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
            'profile-name': driver.name,
            'profile-email': driver.email,
            'profile-phone': driver.phone,
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
    if (toggle) {
        toggle.addEventListener('change', async () => {
            const isLive = toggle.checked;
            updateAvailabilityUI(isLive);

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
        const tripList = document.querySelector('.list-body'); // Profile tab list
        const dashboardTripList = document.getElementById('profile-trip-list'); // Main dashboard list
        
        if (!tripList) return;

        if (trips.length === 0) {
            tripList.innerHTML = '<div class="list-item" style="justify-content: center; opacity: 0.5;">No recent trips found</div>';
            if (dashboardTripList) dashboardTripList.innerHTML = '<div class="trip-item" style="justify-content: center; opacity: 0.5;">No trips today</div>';
            return;
        }

        const tripHtml = trips.map(trip => {
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
                        <span class="task">${trip.patient_name}'s Request</span>
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

        tripList.innerHTML = tripHtml;

        // Simple version for dashboard
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
                            <span class="patient-id">Patient ID #${trip.patient_id}</span>
                            <span class="trip-detail">${trip.hospital_name}</span>
                        </div>
                        <span class="trip-time">${new Date(trip.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                `;
            }).join('');
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
});
