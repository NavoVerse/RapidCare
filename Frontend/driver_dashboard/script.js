document.addEventListener('DOMContentLoaded', async () => {
    // 1. Session & Auth Check
    const token = localStorage.getItem('rapidcare_token');
    if (!token) {
        window.location.href = '/driver-login';
        return;
    }

    // 2. Fetch Driver Profile
    try {
        const response = await fetch('/api/v1/drivers/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('rapidcare_token');
                window.location.href = '/driver-login';
                return;
            }
            throw new Error('Failed to fetch profile');
        }

        const driver = await response.json();
        updateUIWithDriverData(driver);
    } catch (err) {
        console.error('Auth error:', err);
        // If it's a network error or similar, we might want to show an error message
    }

    // Function to update UI with real data
    function updateUIWithDriverData(driver) {
        // Sidebar profile
        const userNameElements = document.querySelectorAll('.user-name');
        const userIdElements = document.querySelectorAll('.user-id');
        const avatars = document.querySelectorAll('.avatar, .main-avatar');

        userNameElements.forEach(el => el.textContent = driver.name);
        userIdElements.forEach(el => el.textContent = `ID #${driver.id.toString().padStart(6, '0')}`);
        
        // Initials for avatar
        const initials = driver.name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatars.forEach(av => {
            if (av.tagName === 'DIV') av.textContent = initials;
        });

        // Profile Tab Fields
        const profileFields = {
            'profile-display-name': driver.name,
            'profile-name': driver.name, // For the main dashboard if applicable
            'profile-email': driver.email,
            'profile-phone': driver.phone,
            'profile-gender': driver.gender || 'Not Specified',
            'profile-vehicle': `${driver.vehicle_number} (${driver.vehicle_type || 'Ambulance'})`,
            'profile-license': driver.license_number,
            'profile-address': `${driver.address || ''}, ${driver.city || ''}, ${driver.state || ''} - ${driver.pincode || ''}`
        };

        for (const [id, value] of Object.entries(profileFields)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        // Availability status
        const toggle = document.getElementById('availability-toggle');
        if (toggle) {
            toggle.checked = driver.status === 'available' || driver.status === 'busy';
            updateAvailabilityUI(toggle.checked);
        }
    }

    function updateAvailabilityUI(isLive) {
        const statusText = document.querySelector('.status-text');
        const liveBadge = document.querySelector('.live-badge');
        if (isLive) {
            statusText.textContent = 'LIVE';
            statusText.style.color = 'var(--accent-green)';
            if (liveBadge) liveBadge.style.opacity = '1';
        } else {
            statusText.textContent = 'OFFLINE';
            statusText.style.color = 'var(--text-secondary)';
            if (liveBadge) liveBadge.style.opacity = '0.5';
        }
    }

    // Availability Toggle Persistence
    const toggle = document.getElementById('availability-toggle');
    const user = JSON.parse(localStorage.getItem('rapidcare_user'));

    // 1.5 Real-Time Connection (Socket.IO)
    const socket = io();
    
    if (user) {
        socket.emit('join', { userId: user.id, role: 'driver' });
    }

    // Handle Incoming Trip Requests
    let activeTripData = null;
    let allDriverTrips = [];

    // --- Leaflet Map Initialization ---
    let driverMap = null;
    let driverMarker = null;
    let pickupMarker = null;
    let hospitalMarker = null;
    let mapRouteLine = null;

    function initDriverMap(lat, lng) {
        const mapContainer = document.getElementById('driver-live-map');
        if (!mapContainer || driverMap) return;

        driverMap = L.map('driver-live-map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(driverMap);

        const driverIcon = L.divIcon({
            className: 'driver-marker',
            html: `<div style="background: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
            iconSize: [16, 16]
        });

        driverMarker = L.marker([lat, lng], { icon: driverIcon }).addTo(driverMap);
    }

    function drawTripRoute(trip) {
        if (!driverMap || !trip) return;

        if (pickupMarker) driverMap.removeLayer(pickupMarker);
        if (hospitalMarker) driverMap.removeLayer(hospitalMarker);
        if (mapRouteLine) driverMap.removeLayer(mapRouteLine);

        const bounds = [];
        if (driverMarker) bounds.push(driverMarker.getLatLng());

        if (trip.pickup_lat && trip.pickup_lng) {
            const pickupIcon = L.divIcon({
                className: 'pickup-marker',
                html: `<div style="background: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
                iconSize: [16, 16]
            });
            pickupMarker = L.marker([trip.pickup_lat, trip.pickup_lng], { icon: pickupIcon })
                .bindPopup('Pickup: ' + (trip.patient_name || 'Patient'))
                .addTo(driverMap);
            bounds.push([trip.pickup_lat, trip.pickup_lng]);
        }

        if (trip.hospital_lat && trip.hospital_lng) {
            const hospitalIcon = L.divIcon({
                className: 'hospital-marker',
                html: `<div style="background: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
                iconSize: [16, 16]
            });
            hospitalMarker = L.marker([trip.hospital_lat, trip.hospital_lng], { icon: hospitalIcon })
                .bindPopup('Drop-off: ' + (trip.hospital_name || 'Hospital'))
                .addTo(driverMap);
            bounds.push([trip.hospital_lat, trip.hospital_lng]);
        }

        if (bounds.length >= 2) {
            mapRouteLine = L.polyline(bounds, { color: '#2563eb', weight: 4, opacity: 0.7 }).addTo(driverMap);
            driverMap.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    socket.on('trip:new_request', (data) => {
        console.log('New trip request received:', data);
        showIncomingAlert(data);
    });

    // --- Geolocation & Live Tracking ---
    let locationInterval = null;

    function startTracking() {
        if (locationInterval) return;
        console.log('Starting location tracking...');
        sendLocation(); // Initial update
        locationInterval = setInterval(sendLocation, 10000); // Every 10s
    }

    function stopTracking() {
        if (locationInterval) {
            console.log('Stopping location tracking.');
            clearInterval(locationInterval);
            locationInterval = null;
        }
    }

    function sendLocation() {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Sending location: ${latitude}, ${longitude}`);
            
            if (!driverMap) {
                initDriverMap(latitude, longitude);
            } else if (driverMarker) {
                driverMarker.setLatLng([latitude, longitude]);
            }

            socket.emit('driver:location_update', {
                userId: user.id,
                lat: latitude,
                lng: longitude
            });
        }, (err) => {
            console.error('Geolocation error:', err);
        }, {
            enableHighAccuracy: true
        });
    }

    let alertTimerInterval = null;
    let currentTripId = null;

    function showIncomingAlert(data) {
        currentTripId = data.trip_id;
        const overlay = document.getElementById('incoming-alert-overlay');
        if (!overlay) return;

        // Populate Data
        document.getElementById('alert-patient-name').textContent = data.patient_name || 'Emergency Patient';
        document.getElementById('alert-hospital-name').textContent = data.hospital_name || 'City General Hospital';
        document.getElementById('alert-pickup-location').textContent = `Lat: ${data.pickup_lat.toFixed(4)}, Lng: ${data.pickup_lng.toFixed(4)}`;
        
        const initials = (data.patient_name || 'P').split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('alert-patient-avatar').textContent = initials;

        // Reset & Show
        overlay.style.display = 'flex';
        startAlertTimer(30);

        // Sound Notification (Optional but recommended for emergency apps)
        playEmergencySound();
    }

    function startAlertTimer(seconds) {
        if (alertTimerInterval) clearInterval(alertTimerInterval);
        
        let timeLeft = seconds;
        const timerText = document.getElementById('alert-timer-text');
        const timerProgress = document.querySelector('.timer-progress');
        const circumference = 113; // 2 * pi * 18

        function updateTimer() {
            timerText.textContent = `${timeLeft}s`;
            const offset = circumference - (timeLeft / seconds) * circumference;
            timerProgress.style.strokeDashoffset = offset;

            if (timeLeft <= 0) {
                clearInterval(alertTimerInterval);
                hideIncomingAlert();
            }
            timeLeft--;
        }

        updateTimer();
        alertTimerInterval = setInterval(updateTimer, 1000);
    }

    function hideIncomingAlert() {
        const overlay = document.getElementById('incoming-alert-overlay');
        if (overlay) overlay.style.display = 'none';
        if (alertTimerInterval) clearInterval(alertTimerInterval);
        currentTripId = null;
    }

    function playEmergencySound() {
        // We could use an Audio object here if we had a sound file
        // For now, console log or vibration if supported
        console.log('🚨 EMERGENCY ALERT SOUND PLAYING');
        if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Accept / Reject Handlers
    const acceptBtn = document.getElementById('accept-trip-btn');
    const rejectBtn = document.getElementById('reject-trip-btn');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', async () => {
            if (!currentTripId) return;
            
            try {
                const response = await fetch(`/api/v1/trips/${currentTripId}/accept`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    hideIncomingAlert();
                    // Navigate to Active Call view or update current status
                    window.location.reload(); // Refresh to show active trip state for now
                } else {
                    const err = await response.json();
                    alert(`Failed to accept: ${err.error}`);
                }
            } catch (err) {
                console.error('Accept error:', err);
            }
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', async () => {
            if (!currentTripId) return;

            try {
                const response = await fetch(`/api/v1/trips/${currentTripId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    hideIncomingAlert();
                }
            } catch (err) {
                console.error('Reject error:', err);
                hideIncomingAlert();
            }
        });
    }

    if (toggle) {
        // Initial tracking state
        if (toggle.checked) startTracking();

        toggle.addEventListener('change', async () => {
            const isLive = toggle.checked;
            updateAvailabilityUI(isLive);

            if (isLive) startTracking();
            else stopTracking();

            try {
                await fetch('/api/v1/drivers/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: isLive ? 'available' : 'offline' })
                });
            } catch (err) {
                console.error('Failed to update status:', err);
            }
        });
    }

    // 3. Fetch Trip History
    async function fetchAndRenderTrips() {
        try {
            const response = await fetch('/api/v1/drivers/trips', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch trips');
            const trips = await response.json();
            
            renderTripHistory(trips);
        } catch (err) {
            console.error('History error:', err);
        }
    }

    function renderTripHistory(trips) {
        allDriverTrips = trips;
        const tripList = document.querySelector('.list-body'); // Profile tab list
        const dashboardTripList = document.getElementById('profile-trip-list'); // Main dashboard list
        const queueList = document.querySelector('.queue-list'); // Dashboard incoming queue
        
        if (!tripList) return;

        // --- 1. Render Profile History List ---
        if (trips.length === 0) {
            tripList.innerHTML = '<div class="list-item" style="justify-content: center; opacity: 0.5;">No recent trips found</div>';
        } else {
            tripList.innerHTML = trips.map(trip => {
                const date = new Date(trip.created_at);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'short' });
                
                let statusClass = 'booked';
                if (trip.status === 'completed') statusClass = 'done';
                if (trip.status === 'cancelled') statusClass = 'cancelled';

                return `
                    <div class="list-item">
                        <div class="item-date">
                            <span class="day">${day}</span>
                            <span class="month">${month}</span>
                        </div>
                        <div class="item-info">
                            <span class="task">${trip.patient_name || 'Emergency'}'s Request</span>
                            <span class="time">${new Date(trip.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <span class="status-badge ${statusClass}">${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</span>
                        <div class="item-price">
                            <span class="total">₹${trip.total_fare || 0}</span>
                            <span class="rate">₹70/km</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // --- 2. Render Dashboard Stats ---
        const totalBookings = trips.length;
        const completedBookings = trips.filter(t => t.status === 'completed').length;
        const cancelledBookings = trips.filter(t => t.status === 'cancelled').length;

        const totalEl = document.getElementById('stat-total-bookings');
        const completedEl = document.getElementById('stat-completed-bookings');
        const cancelledEl = document.getElementById('stat-cancelled-bookings');

        if (totalEl) totalEl.textContent = totalBookings;
        if (completedEl) completedEl.textContent = completedBookings;
        if (cancelledEl) cancelledEl.textContent = cancelledBookings;

        const efficiencyEl = document.getElementById('stat-efficiency');
        const efficiencyDescEl = document.getElementById('stat-efficiency-desc');
        const efficiency = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 100;
        
        if (efficiencyEl) efficiencyEl.textContent = `${efficiency}%`;
        if (efficiencyDescEl) {
            if (efficiency >= 85) efficiencyDescEl.textContent = 'Excellent performance';
            else if (efficiency >= 70) efficiencyDescEl.textContent = 'Acceptable performance';
            else efficiencyDescEl.textContent = 'Action Required';
        }

        const totalCountFilterEl = document.getElementById('stat-total-count-filter');
        if (totalCountFilterEl) totalCountFilterEl.textContent = `All Time (${totalBookings})`;

        // Today's Stats
        const today = new Date().toDateString();
        const tripsToday = trips.filter(t => new Date(t.created_at).toDateString() === today);
        const doneToday = tripsToday.filter(t => t.status === 'completed').length;
        const activeToday = tripsToday.filter(t => !['completed', 'cancelled'].includes(t.status)).length;

        const tripsTodayEl = document.getElementById('stat-trips-today');
        const tripsTodayDescEl = document.getElementById('stat-trips-today-desc');
        const activeCallsEl = document.getElementById('stat-active-calls');

        if (tripsTodayEl) tripsTodayEl.textContent = tripsToday.length;
        if (tripsTodayDescEl) tripsTodayDescEl.textContent = `${doneToday} done · ${activeToday} active`;
        if (activeCallsEl) activeCallsEl.textContent = activeToday;

        // ETA & Distance
        activeTripData = trips.find(t => !['completed', 'cancelled'].includes(t.status));
        const etaEl = document.getElementById('stat-eta');
        const distEl = document.getElementById('stat-distance');
        const activePatientIdEl = document.getElementById('active-patient-id');
        const activeConditionEl = document.getElementById('active-patient-condition');

        if (activeTripData) {
            if (etaEl) etaEl.textContent = '4 min';
            if (distEl) distEl.textContent = '2.1 km remaining';
            if (activePatientIdEl) activePatientIdEl.textContent = `Patient ID #${activeTripData.patient_id}`;
            if (activeConditionEl) activeConditionEl.textContent = activeTripData.complaint || 'Emergency Response';
            drawTripRoute(activeTripData);
        } else {
            if (etaEl) etaEl.textContent = '--';
            if (distEl) distEl.textContent = 'No active trip';
            if (activePatientIdEl) activePatientIdEl.textContent = 'No active call';
            if (activeConditionEl) activeConditionEl.textContent = 'Waiting for request...';
        }

        updateActionButtons(activeTripData);

        // --- 3. Render Dashboard Recent List ---
        if (dashboardTripList) {
            dashboardTripList.innerHTML = trips.slice(0, 5).map(trip => {
                let statusClass = 'success';
                if (trip.status === 'cancelled') statusClass = 'error';
                return `
                    <div class="trip-item">
                        <div class="trip-icon ${statusClass}">
                            <i class="fa-solid ${trip.status === 'completed' ? 'fa-check' : 'fa-xmark'}"></i>
                        </div>
                        <div class="trip-info">
                            <span class="patient-id">Patient #${trip.patient_id}</span>
                            <span class="trip-detail">${trip.hospital_name || 'Hospital Transfer'}</span>
                        </div>
                        <span class="trip-time">${new Date(trip.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                `;
            }).join('');
        }

        // --- 4. Render Incoming Queue ---
        if (queueList) {
            const requestedTrips = trips.filter(t => t.status === 'requested');
            if (requestedTrips.length === 0) {
                queueList.innerHTML = '<div class="queue-item" style="justify-content: center; opacity: 0.5;">No pending requests</div>';
            } else {
                queueList.innerHTML = requestedTrips.map(trip => {
                    return `
                        <div class="queue-item">
                            <div class="item-header">
                                <span class="name">${trip.patient_name || 'Emergency Patient'}</span>
                                <span class="time">${new Date(trip.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div class="item-details">
                                <span class="location">Lat: ${trip.pickup_lat.toFixed(4)}, Lng: ${trip.pickup_lng.toFixed(4)}</span>
                                <span class="distance">Nearby</span>
                            </div>
                            <span class="status-tag medium">Requested</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Initial load
    fetchAndRenderTrips();

    // Logout Functionality
    const logoutBtn = document.querySelector('.nav-item i.fa-right-from-bracket')?.parentElement;
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('rapidcare_token');
            localStorage.removeItem('rapidcare_user');
            window.location.href = '/driver-login';
        });
    }


    // Button Hover Effects and Click Ripple (Simple)
    const buttons = document.querySelectorAll('.btn, .emergency-sos-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function(e) {
            this.style.transform = 'scale(0.98)';
        });
        btn.addEventListener('mouseup', function(e) {
            this.style.transform = 'scale(1)';
        });
    });

    // Simulate some real-time data updates (e.g., heart rate)
    const heartRateElement = document.querySelector('.vital-item:nth-child(1) .vital-value');
    if (heartRateElement) {
        setInterval(() => {
            if (toggle.checked) {
                const baseRate = 112;
                const variance = Math.floor(Math.random() * 5) - 2;
                heartRateElement.textContent = baseRate + variance;
                
                // Add a small pulse effect on change
                heartRateElement.style.transition = 'transform 0.2s';
                heartRateElement.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    heartRateElement.style.transform = 'scale(1)';
                }, 200);
            }
        }, 3000);
    }

    // Scroll reveal for cards
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .stat-card').forEach(card => {
        observer.observe(card);
    });

    // Navigation Tab Switching
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const viewSections = document.querySelectorAll('.view-section');
    const headerTitle = document.querySelector('.main-header h1');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all nav items
            navItems.forEach(nav => {
                nav.classList.remove('active');
                const dot = nav.querySelector('.active-dot');
                if (dot) dot.style.display = 'none';
            });

            // Add active to clicked item
            item.classList.add('active');
            const dot = item.querySelector('.active-dot');
            if (dot) dot.style.display = 'block';

            // Hide all views
            viewSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show target view
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.style.display = 'block';
                // Small delay to allow display:block to apply before adding class for animations
                setTimeout(() => {
                    targetView.classList.add('active');
                }, 10);
            }

            // Update Header Title
            if (targetId === 'profile-view') {
                headerTitle.textContent = 'Driver Profile';
            } else {
                headerTitle.textContent = 'Dashboard';
            }
        });
    });

    // --- Invoices & Trip Subtab Toggling ---
    const tabRecentTrips = document.getElementById('tab-recent-trips');
    const tabInvoices = document.getElementById('tab-invoices');

    if (tabRecentTrips && tabInvoices) {
        tabRecentTrips.addEventListener('click', () => {
            tabRecentTrips.classList.add('active');
            tabInvoices.classList.remove('active');
            renderSubTab('recent');
        });

        tabInvoices.addEventListener('click', () => {
            tabInvoices.classList.add('active');
            tabRecentTrips.classList.remove('active');
            renderSubTab('invoices');
        });
    }

    function renderSubTab(type) {
        const listBody = document.querySelector('.list-body');
        if (!listBody) return;

        if (type === 'recent') {
            if (allDriverTrips.length === 0) {
                listBody.innerHTML = '<div class="list-item" style="justify-content: center; opacity: 0.5;">No recent trips found</div>';
            } else {
                listBody.innerHTML = allDriverTrips.map(trip => {
                    const date = new Date(trip.created_at);
                    const day = date.getDate();
                    const month = date.toLocaleString('default', { month: 'short' });
                    
                    let statusClass = 'booked';
                    if (trip.status === 'completed') statusClass = 'done';
                    if (trip.status === 'cancelled') statusClass = 'cancelled';

                    return `
                        <div class="list-item">
                            <div class="item-date">
                                <span class="day">${day}</span>
                                <span class="month">${month}</span>
                            </div>
                            <div class="item-info">
                                <span class="task">${trip.patient_name || 'Emergency'}'s Request</span>
                                <span class="time">${new Date(trip.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <span class="status-badge ${statusClass}">${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</span>
                            <div class="item-price">
                                <span class="total">₹${trip.total_fare || 0}</span>
                                <span class="rate">₹70/km</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else if (type === 'invoices') {
            const completedTrips = allDriverTrips.filter(t => t.status === 'completed');
            if (completedTrips.length === 0) {
                listBody.innerHTML = '<div class="list-item" style="justify-content: center; opacity: 0.5;">No invoices generated yet</div>';
            } else {
                listBody.innerHTML = completedTrips.map(trip => {
                    const date = new Date(trip.created_at);
                    const day = date.getDate();
                    const month = date.toLocaleString('default', { month: 'short' });

                    return `
                        <div class="list-item">
                            <div class="item-date">
                                <span class="day">${day}</span>
                                <span class="month">${month}</span>
                            </div>
                            <div class="item-info">
                                <span class="task">Invoice #${trip.id.toString().padStart(5, '0')}</span>
                                <span class="time">${trip.hospital_name || 'Emergency Drop-off'}</span>
                            </div>
                            <span class="status-badge done">Paid</span>
                            <div class="item-price">
                                <span class="total">₹${trip.total_fare || 0}</span>
                                <span class="rate">₹70/km</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Status Workflow Handlers
    function updateActionButtons(trip) {
        const btnArrivedPatient = document.getElementById('btn-arrived-patient');
        const btnPickedUp = document.getElementById('btn-picked-up');
        const btnArrivedHospital = document.getElementById('btn-arrived-hospital');
        const btnCompleteTrip = document.getElementById('btn-complete-trip');

        // Hide all first
        [btnArrivedPatient, btnPickedUp, btnArrivedHospital, btnCompleteTrip].forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        if (!trip) return;

        switch (trip.status) {
            case 'accepted':
            case 'heading_to_patient':
                if (btnArrivedPatient) btnArrivedPatient.style.display = 'block';
                break;
            case 'arrived':
                if (btnPickedUp) btnPickedUp.style.display = 'block';
                break;
            case 'heading_to_hospital':
                if (btnArrivedHospital) btnArrivedHospital.style.display = 'block';
                break;
            case 'at_hospital':
                if (btnCompleteTrip) btnCompleteTrip.style.display = 'block';
                break;
        }
    }

    async function changeTripStatus(newStatus) {
        if (!activeTripData) return;

        try {
            const response = await fetch(`/api/v1/trips/${activeTripData.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Refresh data to update UI
                fetchAndRenderTrips();
                showToast(`Status updated to ${newStatus}`);
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (err) {
            console.error('Status update error:', err);
        }
    }

    // Attach listeners to buttons
    document.getElementById('btn-arrived-patient')?.addEventListener('click', () => changeTripStatus('arrived'));
    document.getElementById('btn-picked-up')?.addEventListener('click', () => changeTripStatus('heading_to_hospital'));
    document.getElementById('btn-arrived-hospital')?.addEventListener('click', () => changeTripStatus('at_hospital'));
    document.getElementById('btn-complete-trip')?.addEventListener('click', async () => {
        await changeTripStatus('completed');
        // If completed, also set driver back to available? 
        // Backend handles this in some cases, but let's be sure.
        window.location.reload(); 
    });

    function showToast(msg) {
        // Simple toast or console log for now
        console.log('TOAST:', msg);
    }
});
