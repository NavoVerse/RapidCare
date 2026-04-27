document.addEventListener('DOMContentLoaded', () => {
    let selectedHabits = [];
    // =============================================
    // REAL-TIME DISPATCH (Socket.IO)
    // =============================================
    const API_BASE = RapidCareConfig.API_BASE;
    const socket = io(RapidCareConfig.SOCKET_URL);

    socket.on('connect', () => {
        console.log('[Socket.IO] Connected to backend');
        // Join room if user already in localStorage
        const userStr = localStorage.getItem('rapidcare_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            socket.emit('join', { userId: user.id, role: user.role });
        }
    });

    socket.on('trip:accepted', (data) => {
        alert(`🚑 RapidCare Accepted! Trip #${data.trip_id}. Driver is on the way.`);
    });

    socket.on('trip:timeout', (data) => {
        alert(`⚠️ Dispatch Timeout: ${data.message}`);
    });

    socket.on('trip:rejected', (data) => {
        alert(`❌ Dispatch Rejected: ${data.message}`);
    });

    socket.on('trip:driver_location', (data) => {
        console.log('[Socket.IO] Received driver location:', data);
        if (ambulanceMarker) {
            ambulanceMarker.setLatLng([data.lat, data.lng]);
            // If the tracking tab is open, we might want to follow the driver
            if (trackingMap) {
                // trackingMap.panTo([data.lat, data.lng]);
            }
        }
    });
    // =============================================
    // PROFILE DATA FETCHING
    // =============================================
    async function loadUserProfile() {
        const token = localStorage.getItem('rapidcare_token');
        if (!token) {
            // Check if user is in localStorage just in case
            const userStr = localStorage.getItem('rapidcare_user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const sidebarName = document.querySelector('.user-info h3');
                    if (sidebarName) sidebarName.textContent = user.name;
                } catch(e) {}
            }
            return;
        }

        try {
            const response = await fetch(API_BASE + '/patients/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();

            // Update details view
            const setVal = (id, val, prefix = '', defaultVal = '--') => {
                const el = document.getElementById(id);
                if (el) {
                    if ((id === 'ownDiagnosisTags' || id === 'healthBarriersTags') && val && val !== 'None added') {
                        const tags = val.split(',').map(t => t.trim()).filter(t => t);
                        if (tags.length > 0) {
                            el.innerHTML = tags.map(tag => `<span class="tag" style="background: rgba(255,255,255,0.05); color: var(--secondary-text); border: 1px solid var(--border-color);">${tag}</span>`).join('');
                            return;
                        }
                    }
                    el.textContent = val ? val : defaultVal;
                }
            };

            setVal('displayProfileName', data.name, '', 'Unknown User');
            setVal('displayProfileGender', data.gender);
            setVal('displayProfileBirth', data.date_of_birth);
            setVal('displayProfileHeight', data.height);
            setVal('displayProfileWeight', data.weight);
            if (data.height && data.weight) {
                const hM = data.height / 100;
                setVal('displayProfileBMI', (data.weight / (hM * hM)).toFixed(1));
            } else {
                setVal('displayProfileBMI', '--');
            }
            setVal('displayProfileBlood', data.blood_type);
            setVal('displayProfileLocation', data.home_location);
            setVal('displayProfileBP', data.blood_pressure);
            setVal('displayProfileAllergies', data.allergies);
            setVal('displayProfileChronic', data.chronic_conditions);
            setVal('ownDiagnosisTags', data.own_diagnosis, '', 'None added');
            setVal('healthBarriersTags', data.health_barriers, '', 'None added');

            // Detailed Medical History
            setVal('hist-chronic', data.chronic_disease, '', 'None added');
            setVal('hist-emergencies', data.diabetes_emergencies, '', 'None added');
            setVal('hist-surgery', data.surgeries, '', 'None added');
            setVal('hist-family', data.family_history, '', 'None added');
            setVal('hist-complication', data.diabetes_complications, '', 'None added');

            // Render habit emojis (map text back to emojis if needed)
            selectedHabits = [];
            if (data.habits) {
                const habitNames = data.habits.split(',').map(h => h.trim());
                habitNames.forEach(name => {
                    // Try to find the emoji for this name from the picker options
                    const opt = document.querySelector(`.picker-option[title="${name}"]`);
                    if (opt) {
                        selectedHabits.push(opt.dataset.emoji);
                    } else if (name.length <= 2) { // Fallback if it's already an emoji
                        selectedHabits.push(name);
                    }
                });
            }
            renderHabitEmojis(selectedHabits);
            updateEmojiPickerSelection();

            // Update sidebar and header
            const sidebarName = document.getElementById('sidebarName');
            if (sidebarName && data.name) sidebarName.textContent = data.name;
            
            // Set avatars (Prefer uploaded one, fallback to UI Avatars)
            let avatarUrl = data.avatar_url;
            if (!avatarUrl && data.name) {
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=2563eb&color=fff&size=128`;
            }
            
            if (avatarUrl) {
                const sidebarAvatar = document.getElementById('sidebarAvatar');
                if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
                const headerAvatar = document.getElementById('headerAvatar');
                if (headerAvatar) headerAvatar.src = avatarUrl;
                const mainProfileAvatar = document.getElementById('mainProfileAvatar');
                if (mainProfileAvatar) mainProfileAvatar.src = avatarUrl;
            }

            // Ensure socket room is joined
            socket.emit('join', { userId: data.id || JSON.parse(localStorage.getItem('rapidcare_user')).id, role: 'patient' });

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // Habit Emoji Logic
    function renderHabitEmojis(habits) {
        const container = document.getElementById('habitEmojisDisplay');
        if (!container) return;
        container.innerHTML = habits.map(emoji => `<span class="habit-emoji">${emoji}</span>`).join('');
    }

    function updateEmojiPickerSelection() {
        const options = document.querySelectorAll('.picker-option');
        options.forEach(opt => {
            const emoji = opt.dataset.emoji;
            if (selectedHabits.includes(emoji)) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }

    const picker = document.getElementById('habitEmojiPicker');
    if (picker) {
        picker.addEventListener('click', (e) => {
            const opt = e.target.closest('.picker-option');
            if (!opt) return;
            const emoji = opt.dataset.emoji;
            if (selectedHabits.includes(emoji)) {
                selectedHabits = selectedHabits.filter(h => h !== emoji);
            } else {
                if (selectedHabits.length >= 3) {
                    alert('You can select a maximum of 3 habit emojis.');
                    return;
                }
                selectedHabits.push(emoji);
            }
            renderHabitEmojis(selectedHabits);
            updateEmojiPickerSelection();
        });
    }

    // =============================================
    // PROFILE PICTURE UPLOAD & COMPRESSION
    // =============================================
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 256;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to low-quality JPEG for database storage
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    // Upload to backend
                    uploadAvatar(dataUrl);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function uploadAvatar(dataUrl) {
        try {
            const token = localStorage.getItem('rapidcare_token');
            const response = await fetch(API_BASE + '/patients/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar_url: dataUrl })
            });

            if (response.ok) {
                // Update all avatar instances on the page
                const avatars = ['sidebarAvatar', 'headerAvatar', 'mainProfileAvatar'];
                avatars.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.src = dataUrl;
                });
            } else {
                const errData = await response.json().catch(() => ({}));
                console.error('Server error during avatar upload:', response.status, errData);
                throw new Error(errData.error || 'Failed to upload avatar');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert('Failed to update profile picture: ' + error.message);
        }
    }

    loadUserProfile();

    // SOS Button Logic
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
        sosBtn.addEventListener('click', () => {
            window.location.href = '/urgency';
        });
    }

    // Sidebar Toggle Logic
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // Check for saved state
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent immediate close on mobile
            const nowCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', nowCollapsed);
            
            // Trigger a map resize if needed, since the container size changes
            if (typeof map !== 'undefined' && map.invalidateSize) {
                setTimeout(() => map.invalidateSize(), 300);
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
                    sidebar.classList.remove('collapsed');
                    localStorage.setItem('sidebar-collapsed', false);
                }
            }
        });
    }



    // Nav menu interaction
    const navItems = document.querySelectorAll('.nav-item');
    const dashboardView = document.getElementById('dashboard-view');
    const detailsView = document.getElementById('details-view');
    const trackingView = document.getElementById('tracking-view');
    const insuranceView = document.getElementById('insurance-view');
    const analyticsView = document.getElementById('analytics-view');
    const historyView = document.getElementById('history-view');
    const paymentView = document.getElementById('payment-view');
    const paymentsView = document.getElementById('payments-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const label = item.querySelector('span').textContent.trim();
            
            // Only prevent default for # links
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // View Switching Logic
            dashboardView.style.display = 'none';
            detailsView.style.display = 'none';
            trackingView.style.display = 'none';
            insuranceView.style.display = 'none';
            if(analyticsView) analyticsView.style.display = 'none';
            if(historyView) historyView.style.display = 'none';
            if(paymentView) paymentView.style.display = 'none';
            if(paymentsView) paymentsView.style.display = 'none';

            if (label === 'Details') {
                detailsView.style.display = 'block';
            } else if (label === 'Overview') {
                dashboardView.style.display = 'block';
                // Trigger map resize since it was hidden
                if (typeof overviewMap !== 'undefined' && overviewMap.invalidateSize) {
                    setTimeout(() => overviewMap.invalidateSize(), 150);
                }
            } else if (label === 'Tracking') {
                trackingView.style.display = 'block';
                // Trigger tracking map resize or init
                if (typeof trackingMap === 'undefined' || !trackingMap) {
                    initLiveTrackingMap();
                } else {
                    setTimeout(() => trackingMap.invalidateSize(), 150);
                }
            } else if (label === 'Insurance') {
                insuranceView.style.display = 'block';
            } else if (label === 'Analytics') {
                if(analyticsView) analyticsView.style.display = 'block';
            } else if (label === 'History') {
                if(historyView) historyView.style.display = 'flex';
            } else if (label === 'Payment') {
                if(paymentView) paymentView.style.display = 'block';
            } else if (label === 'Payment History') {
                if(paymentsView) paymentsView.style.display = 'block';
            } else {
                dashboardView.style.display = 'block';
            }
        });
    });

    // Profile Icon Redirection
    const sidebarProfile = document.querySelector('.user-profile');
    const headerProfile = document.querySelector('.user-avatar-small');
    const detailsNavItem = Array.from(navItems).find(item => item.querySelector('span')?.textContent.trim() === 'Details');

    function switchToPatientProfile() {
        if (detailsNavItem) {
            detailsNavItem.click();
            // Wait for view switch before clicking sub-tab if needed, 
            // but the script handles sub-tab state globally so we can just find and click it.
            const patientProfileTab = document.querySelector('.sub-tab[data-tab="patient-profile"]');
            if (patientProfileTab) patientProfileTab.click();
        }
    }

    if (sidebarProfile) {
        sidebarProfile.style.cursor = 'pointer';
        sidebarProfile.addEventListener('click', switchToPatientProfile);
    }
    if (headerProfile) {
        headerProfile.style.cursor = 'pointer';
        headerProfile.addEventListener('click', switchToPatientProfile);
    }

    // Check for view routing in URL (e.g. ?view=tracking)
    const urlParams = new URLSearchParams(window.location.search);
    const viewQuery = urlParams.get('view');
    if (viewQuery) {
        navItems.forEach(item => {
            const label = item.querySelector('span');
            if (label && label.textContent.trim().toLowerCase() === viewQuery.toLowerCase()) {
                item.click();
            }
        });
    }

    // Search bar focus effect is now handled by CSS :focus-within for better performance and transitions.

    // =============================================
    // MAP & HOSPITAL INTEGRATION (Leaflet)
    // =============================================
    const overviewMap = L.map('map').setView([22.5726, 88.3639], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(overviewMap);

    // =============================================
    // LIVE TRACKING MAP (Integrated from Tracking Interface)
    // =============================================
    let trackingMap = null;
    let ambulanceMarker = null;

    async function initLiveTrackingMap() {
        const mapEl = document.getElementById('live-tracking-map');
        if (!mapEl || !window.L) return;

        trackingMap = L.map('live-tracking-map', {
            center: [22.5430, 88.3690],
            zoom: 13,
            zoomControl: false, 
            attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(trackingMap);

        const patientCoords = [22.5726, 88.3639];
        const hospitalCoords = [22.5165, 88.3958];

        const userPin = L.divIcon({
            className: 'leaflet-user-pin',
            html: '📍',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        });

        const hospitalPin = L.divIcon({
            className: 'leaflet-hospital-pin',
            html: '🏥',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        });

        const ambIcon = L.divIcon({
            className: '',
            html: `<div style="width:52px;height:52px;border-radius:50%;background:#fff;border:3px solid #22c55e;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,0.22);font-size:26px;">🚑</div>`,
            iconSize: [52, 52],
            iconAnchor: [26, 26]
        });

        L.marker(patientCoords, { icon: userPin }).addTo(trackingMap).bindPopup('<b>Your Location</b>');
        L.marker(hospitalCoords, { icon: hospitalPin }).addTo(trackingMap).bindPopup('<b>Apollo Gleneagles</b>');
        ambulanceMarker = L.marker(patientCoords, { icon: ambIcon }).addTo(trackingMap).bindPopup('<b>Matt Smith</b><br>ALS Ambulance');

        try {
            const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${patientCoords[1]},${patientCoords[0]};${hospitalCoords[1]},${hospitalCoords[0]}?overview=full&geometries=geojson`);
            const data = await resp.json();
            if (data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                L.polyline(coords, { color: '#14532d', weight: 8, opacity: 0.8 }).addTo(trackingMap);
                const actualRoute = L.polyline(coords, { color: '#22c55e', weight: 4 }).addTo(trackingMap);
                trackingMap.fitBounds(actualRoute.getBounds(), { padding: [60, 60] });
                // Removed simulated animation: animateAmbulance(coords);
            }
        } catch (err) {
            console.error("Tracking Routing failed", err);
        }
    }

    // Animation logic removed in favor of live WebSocket updates
    function animateAmbulance(routePoints) {
        console.log("Simulated animation disabled. Using live tracking.");
    }

    // Map controls for tracking
    const ctrlBtns = document.querySelectorAll('.map-ctrl-btn');
    ctrlBtns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            if (!trackingMap) return;
            if (i === 0) trackingMap.zoomIn();
            else if (i === 1) trackingMap.zoomOut();
            else trackingMap.setView([22.5430, 88.3690], 13);
        });
    });

    let hospitals = [];
    let hospitalMarkers = [];
    let userMarker = null;

    // Custom hospital marker icon
    const hospitalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 2px solid #dc2626;"><svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626"><path d="M19 10h-5V5c0-1.1-.9-2-2-2s-2 .9-2 2v5H5c-1.1 0-2 .9-2 2s.9 2 2 2h5v5c0 1.1.9 2 2 2s2-.9 2-2v-5h5c1.1 0 2-.9 2-2s-.9-2-2-2z"/></svg></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // User location custom icon
    const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: #15803d; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #15803d, 0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    // Load hospitals from backend MapAPI
    async function initHospitals(forced = false) {
        const storedHospitals = localStorage.getItem('hospitalData');
        
        if (!forced && storedHospitals) {
            hospitals = JSON.parse(storedHospitals);
        } else {
            if (window.MapAPI) {
                hospitals = await window.MapAPI.getHospitals();
            } else {
                // Inline fallback
                hospitals = [
                    { name: "AMRI Hospital, Dhakuria", lat: 22.5135, lng: 88.3629, status: "Available", beds: 12, facilities: ["ICU", "Emergency", "Cardiology"] },
                    { name: "Apollo Gleneagles Hospitals", lat: 22.5710, lng: 88.4055, status: "Limited", beds: 3, facilities: ["Neurology", "Trauma Care", "Oxygen Support"] },
                    { name: "Fortis Hospital, Anandapur", lat: 22.5165, lng: 88.4042, status: "Available", beds: 21, facilities: ["General Surgery", "Pediatrics", "Diagnostic Lab"] },
                    { name: "Medica Superspecialty Hospital", lat: 22.4939, lng: 88.3980, status: "Busy", beds: 0, facilities: ["Organ Transplant", "Advanced Imaging", "Reentry Care"] },
                    { name: "NRS Medical College and Hospital", lat: 22.5645, lng: 88.3685, status: "Available", beds: 45, facilities: ["Government Funded", "Free Pharmacy", "Maternity"] },
                    { name: "Peerless Hospital", lat: 22.4770, lng: 88.3900, status: "Available", beds: 18, facilities: ["Orthopedic", "Oncology", "Dialysis"] },
                    { name: "SSKM Hospital", lat: 22.5392, lng: 88.3444, status: "Busy", beds: 1, facilities: ["Cardiac Surgery", "Burn Ward", "Medical Research"] }
                ];
            }
            localStorage.setItem('hospitalData', JSON.stringify(hospitals));
        }

        // Clear existing markers
        hospitalMarkers.forEach(m => overviewMap.removeLayer(m));
        hospitalMarkers = [];

        hospitals.forEach(h => {
            const statusColor = h.status === 'Available' ? '#15803d' : (h.status === 'Busy' ? '#dc2626' : '#eab308');
            const popupContent = `
                <div style="padding: 8px; min-width: 200px;">
                    <h3 style="margin: 0 0 6px 0; color: #14532d; font-size: 1rem;">${h.name}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 0.85rem;">Status: <strong style="color: ${statusColor}">${h.status}</strong></p>
                    <button onclick="window.bookAmbulance(${h.id}, '${h.name.replace(/'/g, "\\'")}')" style="width: 100%; padding: 8px; background: #15803d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">🚑 Book RapidCare</button>
                </div>`;
            const m = L.marker([h.lat, h.lng], { icon: hospitalIcon })
                .addTo(overviewMap)
                .bindPopup(popupContent);
            hospitalMarkers.push(m);
        });

        // Re-render the list if we have location
        const lat = localStorage.getItem('userLat');
        const lng = localStorage.getItem('userLng');
        if (lat && lng) {
            renderHospitalsList(parseFloat(lat), parseFloat(lng));
        }
    }

    // Refresh Hospitals Button Event
    const refreshHospitalsBtn = document.getElementById('refreshHospitalsBtn');
    if (refreshHospitalsBtn) {
        refreshHospitalsBtn.addEventListener('click', () => {
            initHospitals(true);
        });
    }

    initHospitals();

    // =============================================
    // AMBULANCE BOOKING SIMULATION
    // =============================================
    // =============================================
    // REAL AMBULANCE BOOKING
    // =============================================
    window.bookAmbulance = async function(hospitalId, hospitalName) {
        const token = localStorage.getItem('rapidcare_token');
        if (!token) {
            alert("Please login to book an ambulance.");
            return;
        }

        // Get current location from localStorage
        const lat = localStorage.getItem('userLat');
        const lng = localStorage.getItem('userLng');

        if (!lat || !lng) {
            alert("Waiting for GPS location...");
            return;
        }

        try {
            const response = await fetch(API_BASE + '/trips/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pickup_lat: parseFloat(lat),
                    pickup_lng: parseFloat(lng),
                    hospital_id: hospitalId
                })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('rapidcare_last_trip_id', data.trip_id);
                alert(`🚑 DISPATCHING RAPIDCARE!\n\nDestination: ${hospitalName}\nTrip ID: ${data.trip_id}\n\nFinding nearest driver...`);
            } else {
                alert(`Dispatch Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert("Failed to connect to dispatch server.");
        }
    };

    // =============================================
    // HLIGHIGHT DISTANCE & STATUS PANEL LOGIC
    // =============================================
    let distanceBackgroundLine = null;
    let distancePolyline = null;

    window.highlightDistance = async function(lat, lng) {
        if (!userMarker) return;
        const userLatLng = userMarker.getLatLng();
        
        if (distancePolyline) overviewMap.removeLayer(distancePolyline);
        if (distanceBackgroundLine) overviewMap.removeLayer(distanceBackgroundLine);
        
        try {
            // Fetch real road route using OSRM public API
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLatLng.lng},${userLatLng.lat};${lng},${lat}?overview=full&geometries=geojson`);
            const data = await response.json();
            
            let coords = [];
            if (data.routes && data.routes.length > 0) {
                // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
                coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            } else {
                coords = [userLatLng, [lat, lng]];
            }
 
            // Draw outer thick border
            distanceBackgroundLine = L.polyline(coords, {
                color: '#14532d',
                weight: 8,
                opacity: 0.8,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(overviewMap);
 
            // Draw inner smooth path
            distancePolyline = L.polyline(coords, {
                color: '#22c55e',
                weight: 4,
                opacity: 1,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(overviewMap);
 
            overviewMap.fitBounds(distanceBackgroundLine.getBounds(), { padding: [50, 50] });
 
        } catch (e) {
            console.error("Routing error:", e);
            // Fallback to straight dashed line if offline
            distancePolyline = L.polyline([userLatLng, [lat, lng]], {
                color: '#15803d', weight: 4, opacity: 0.7, dashArray: '10, 10', lineJoin: 'round'
            }).addTo(overviewMap);
            overviewMap.fitBounds(distancePolyline.getBounds(), { padding: [50, 50] });
        }
    };

    window.showHospitalStatus = function(hospitalName) {
        const h = hospitals.find(item => item.name === hospitalName);
        if (!h) return;

        const mapContainer = document.getElementById('map');
        const statusPanel = document.getElementById('hospitalStatusPanel');
        const backBtn = document.getElementById('backToMapBtn');
        const title = document.getElementById('tracking-title');
        const badges = document.getElementById('tracking-badges');
        const overlay = document.querySelector('.map-overlay');

        if (mapContainer && statusPanel) {
            mapContainer.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
            statusPanel.style.display = 'block';
            backBtn.style.display = 'block';
            title.textContent = "Hospital Status - " + h.name.split(',')[0];
            badges.style.display = 'none';

            statusPanel.innerHTML = `
                <div class="status-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="font-size: 1.5rem; color: var(--text-main); font-family: 'Outfit', sans-serif;">${h.name}</h2>
                        <span class="h-status" style="background: ${h.status === 'Available' ? '#f0fdf4' : (h.status === 'Busy' ? '#fef2f2' : '#fefce8')}; color: ${h.status === 'Available' ? '#15803d' : (h.status === 'Busy' ? '#dc2626' : '#eab308')};">${h.status}</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        <div style="padding: 20px; background: var(--bg-main); border-radius: 12px; border: 1.5px solid var(--border);">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Available Beds</label>
                            <div style="font-size: 2rem; font-weight: 800; color: var(--primary-green); margin-top: 5px;">${h.beds}</div>
                        </div>
                        <div style="padding: 20px; background: var(--bg-main); border-radius: 12px; border: 1.5px solid var(--border);">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Response Class</label>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--acc-yellow); margin-top: 5px;">Level ${h.beds > 10 ? 'A' : 'B'}</div>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 12px; font-weight: 700;">Key Facilities</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px;">
                        ${h.facilities.map(f => `<span style="padding: 6px 14px; background: var(--white); border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem; font-weight: 500;">${f}</span>`).join('')}
                    </div>

                    <button onclick="window.bookAmbulance(${h.id}, '${h.name.replace(/'/g, "\\'")}')" style="width: 100%; padding: 16px; background: var(--primary-green); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem;">
                        🚑 Book RapidCare for this Hospital
                    </button>
                    <p style="margin-top: 15px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">Note: Bed counts are updated every 15 minutes by hospital staff.</p>
                </div>
            `;
        }
    };

    const backToMapBtn = document.getElementById('backToMapBtn');
    if (backToMapBtn) {
        backToMapBtn.addEventListener('click', () => {
            document.getElementById('map').style.display = 'block';
            document.querySelector('.map-overlay').style.display = 'flex';
            document.getElementById('hospitalStatusPanel').style.display = 'none';
            backToMapBtn.style.display = 'none';
            document.getElementById('tracking-title').textContent = "Real-time Tracking";
            document.getElementById('tracking-badges').style.display = 'flex';
            if (overviewMap.invalidateSize) overviewMap.invalidateSize();
        });
    }

    // =============================================
    // HOSPITAL LIST & DISTANCE CALCULATIONS
    // =============================================
    function renderHospitalsList(userLat, userLng) {
        const container = document.getElementById('hospitalListContainer');
        const etaDisplay = document.querySelector('.duration-info span');
        const tripTimeStat = document.querySelectorAll('.stat-card .value')[3];

        if (!container) return;
        container.innerHTML = '';

        const hospitalsWithDistance = hospitals.map(h => {
            const d = L.latLng(userLat, userLng).distanceTo(L.latLng(h.lat, h.lng));
            return { ...h, distance: (d / 1000).toFixed(1) };
        });

        hospitalsWithDistance.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        // Update ETA
        if (hospitalsWithDistance.length > 0 && window.MapAPI) {
            const closest = hospitalsWithDistance[0];
            const eta = window.MapAPI.calculateETA(closest.distance);
            if (etaDisplay) etaDisplay.textContent = `ETA: ${eta} to ${closest.name.split(',')[0]}`;
            if (tripTimeStat) tripTimeStat.textContent = eta;
        }

        hospitalsWithDistance.forEach(h => {
            const item = document.createElement('div');
            item.className = 'hospital-item';
            const statusColor = h.status === 'Available' ? '#15803d' : (h.status === 'Busy' ? '#dc2626' : '#eab308');
            item.innerHTML = `
                <div class="hospital-info" style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;">
                        <span class="h-name">${h.name}</span>
                        <span class="h-distance" style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">${h.distance} km</span>
                    </div>
                    <div class="h-actions-row" style="display: flex; gap: 10px;">
                        <button class="book-btn uni-btn" onclick="event.stopPropagation(); window.bookAmbulance(${h.id}, '${h.name.replace(/'/g, "\\'")}')">🚑 Book Now</button>
                        <button class="action-btn distance-btn uni-btn" onclick="event.stopPropagation(); window.highlightDistance(${h.lat}, ${h.lng})">📍 Distance</button>
                        <button class="action-btn status-btn uni-btn" onclick="event.stopPropagation(); window.showHospitalStatus('${h.name.replace(/'/g, "\\'")}')" style="color: ${statusColor}; border-color: ${statusColor}">🛡️ ${h.status}</button>
                    </div>
                </div>
            `;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                document.querySelectorAll('.hospital-item').forEach(el => el.classList.remove('active-hospital'));
                item.classList.add('active-hospital');
                overviewMap.setView([h.lat, h.lng], 15);
            });
            container.appendChild(item);
        });
    }

    // =============================================
    // USER LOCATION MANAGEMENT
    // =============================================
    function updateUserLocation(lat, lng) {
        if (userMarker) overviewMap.removeLayer(userMarker);
        
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(overviewMap)
            .bindPopup('<b>Your Location</b>')
            .openPopup();
            
        overviewMap.setView([lat, lng], 13);
        renderHospitalsList(lat, lng);

        // PERSISTENCE: Save to localStorage
        localStorage.setItem('userLat', lat);
        localStorage.setItem('userLng', lng);
    }

    async function detectAutoLocation(forced = false) {
        const locationText = document.getElementById('userLocationText');
        const locationStatus = document.getElementById('locationStatus');

        // Check if we already have saved location and this isn't a forced refresh
        const savedLat = localStorage.getItem('userLat');
        const savedLng = localStorage.getItem('userLng');
        const savedName = localStorage.getItem('userLocationName');

        if (!forced && savedLat && savedLng) {
            if (locationText) locationText.textContent = savedName || "Saved Location";
            if (locationStatus) {
                locationStatus.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Stored`;
            }
            updateUserLocation(parseFloat(savedLat), parseFloat(savedLng));
            return;
        }

        try {
            if (locationText) locationText.textContent = "Detecting...";
            if (window.LocationService) {
                const location = await window.LocationService.getCurrentLocation();
                
                if (locationText) locationText.textContent = location.address;
                localStorage.setItem('userLocationName', location.address);

                // Sync with Database
                if (window.DBManager) {
                    await window.DBManager.updateUserLocation(location.lat, location.lng, location.address);
                }

                updateUserLocation(location.lat, location.lng);
                
                if (locationStatus) {
                    locationStatus.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> GPS Locked`;
                }
            }
        } catch (error) {
            console.warn("Auto-location failed:", error.message);
            if (locationText) locationText.textContent = "Kolkata, IN";
            if (locationStatus) {
                locationStatus.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 19V5M5 12l7-7 7 7" /></svg> Default`;
            }
            updateUserLocation(22.5726, 88.3639);
        }
    }

    // Refresh Button Event
    const refreshBtn = document.getElementById('refreshLocationBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger the modal open
            detectAutoLocation(true); // Force re-detection
        });
    }

    detectAutoLocation();

    // =============================================
    // MANUAL LOCATION MODAL
    // =============================================
    const locationCard = document.getElementById('locationCard');
    const locationModal = document.getElementById('locationModal');
    const closeLocationModalBtn = document.getElementById('closeLocationModal');
    const quickSelect = document.getElementById('quickLocationSelect');
    const locationSearchInput = document.getElementById('locationSearchInput');
    const searchResults = document.getElementById('searchResults');
    const useGPSBtn = document.getElementById('useCurrentGPS');

    function openModal() {
        if (locationModal) locationModal.style.display = 'flex';
    }

    function closeModal() {
        if (locationModal) locationModal.style.display = 'none';
        if (searchResults) searchResults.innerHTML = '';
        if (locationSearchInput) locationSearchInput.value = '';
    }

    if (locationCard) locationCard.addEventListener('click', openModal);
    if (closeLocationModalBtn) closeLocationModalBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === locationModal) closeModal();
    });

    // Quick dropdown selection
    if (quickSelect) {
        quickSelect.addEventListener('change', (e) => {
            const [lat, lng] = e.target.value.split(',').map(Number);
            const cityName = e.target.options[e.target.selectedIndex].text;
            
            updateUserLocation(lat, lng);
            const locText = document.getElementById('userLocationText');
            if (locText) locText.textContent = cityName;
            localStorage.setItem('userLocationName', cityName);
            
            const locationStatus = document.getElementById('locationStatus');
            if (locationStatus) {
                locationStatus.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Manual`;
            }

            if (window.DBManager) window.DBManager.updateUserLocation(lat, lng, cityName);
            closeModal();
        });
    }

    // Live search via Nominatim
    let searchTimeout;
    if (locationSearchInput) {
        locationSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            if (query.length < 3) {
                if (searchResults) searchResults.innerHTML = '';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                    const data = await response.json();
                    
                    if (searchResults) {
                        searchResults.innerHTML = data.map(item => `
                            <div class="search-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.display_name}">
                                ${item.display_name}
                            </div>
                        `).join('');

                        searchResults.querySelectorAll('.search-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const lat = parseFloat(item.dataset.lat);
                                const lng = parseFloat(item.dataset.lon);
                                const shortName = item.dataset.name.split(',')[0];

                                updateUserLocation(lat, lng);
                                const locText = document.getElementById('userLocationText');
                                if (locText) locText.textContent = shortName;
                                localStorage.setItem('userLocationName', shortName);

                                const locationStatus = document.getElementById('locationStatus');
                                if (locationStatus) {
                                    locationStatus.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Searched`;
                                }

                                if (window.DBManager) window.DBManager.updateUserLocation(lat, lng, shortName);
                                closeModal();
                            });
                        });
                    }
                } catch (error) {
                    console.error("Search failed:", error);
                }
            }, 500);
        });
    }

    // Use live GPS button
    if (useGPSBtn) {
        useGPSBtn.addEventListener('click', () => {
            const locationStatus = document.getElementById('locationStatus');
            if (locationStatus) {
                locationStatus.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 19V5M5 12l7-7 7 7" /></svg> GPS Active`;
            }
            detectAutoLocation();
            closeModal();
        });
    }


    // =============================================
    // DETAILS VIEW SUB-TABS & EDIT LOGIC
    // =============================================
    const subTabs = document.querySelectorAll('.sub-tab');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            subTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            subTabContents.forEach(content => {
                content.style.display = 'none';
                if (content.id === `${targetId}-view`) {
                    content.style.display = 'block';
                }
            });
        });
    });

    // Modal elements for Editing
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editForm = document.getElementById('editForm');
    const editFields = document.getElementById('editFields');
    const editModalTitle = document.getElementById('editModalTitle');

    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }

    // Dynamic Edit Logic
    const editButtons = [
        { 
          id: 'editGeneralProfile', 
          title: 'Edit Patient Profile', 
          fields: [
            { label: 'Full Name', id: 'edit-name', target: 'displayProfileName', prefix: '' },
            { label: 'Gender (Male/Female)', id: 'edit-gender', target: 'displayProfileGender', prefix: '👤 ' },
            { label: 'Date of Birth', id: 'edit-birth', target: 'displayProfileBirth', prefix: '🎂 ' },
            { label: 'Height (Cm)', id: 'edit-height', target: 'displayProfileHeight', prefix: '' },
            { label: 'Weight (kg)', id: 'edit-weight', target: 'displayProfileWeight', prefix: '' },
            { label: 'Blood Type', id: 'edit-blood', target: 'displayProfileBlood', prefix: '🩸 ' },
            { label: 'Home Location', id: 'edit-loc', target: 'displayProfileLocation', prefix: '📍 ' },
            { label: 'Blood Pressure', id: 'edit-bp', target: 'displayProfileBP', prefix: '' },
            { label: 'Allergies', id: 'edit-allergies', target: 'displayProfileAllergies', prefix: '' },
            { label: 'Chronic Conditions', id: 'edit-chronic', target: 'displayProfileChronic', prefix: '' }
          ] 
        },
        { 
          id: 'editTimeline', 
          title: 'Edit Timeline', 
          fields: [
            { label: 'Event Title', id: 't-e', target: null },
            { label: 'Date', id: 't-d', target: null },
            { label: 'A1c Level', id: 't-a', target: null }
          ] 
        },
        { 
          id: 'editMedicalHistory', 
          title: 'Edit Medical History', 
          fields: [
            { label: 'Chronic Disease', id: 'm-c', target: 'hist-chronic', prefix: '' },
            { label: 'Emergencies', id: 'm-e', target: 'hist-emergencies', prefix: '' },
            { label: 'Surgery', id: 'm-s', target: 'hist-surgery', prefix: '' },
            { label: 'Family Disease', id: 'm-f', target: 'hist-family', prefix: '' },
            { label: 'Complications', id: 'm-x', target: 'hist-complication', prefix: '' }
          ] 
        },
        { id: 'editMedicationsList', title: 'Edit Medications', fields: [] },
        { id: 'editMedicationsListTab', title: 'Edit Medications', fields: [] },
        { 
          id: 'editDiet', 
          title: 'Edit Diet Plan', 
          fields: [
            { label: 'Water Intake', id: 'd-w', target: 'diet-water', prefix: '🥃 ' },
            { label: 'Coffee/Tea', id: 'd-c', target: 'diet-coffee', prefix: '☕ ' },
            { label: 'Fasting Plan', id: 'd-f', target: 'diet-fasting', prefix: '⏰ ' },
            { label: 'Sugar/Diet', id: 'd-s', target: 'diet-sugar', prefix: '🍭 ' }
          ] 
        }
    ];

    // Toggle Diet Notes Box
    const toggleDietNotesBtn = document.getElementById('toggleDietNotes');
    const dietNotesBox = document.getElementById('dietNotesBox');
    if (toggleDietNotesBtn && dietNotesBox) {
        toggleDietNotesBtn.addEventListener('click', () => {
            const isHidden = dietNotesBox.style.display === 'none';
            dietNotesBox.style.display = isHidden ? 'block' : 'none';
            toggleDietNotesBtn.textContent = isHidden ? 'Close Notes' : '+ Notes';
        });
    }


    let activeEditConfig = null;

    editButtons.forEach(btnConfig => {
        const btn = document.getElementById(btnConfig.id);
        if (btn) {
            btn.addEventListener('click', () => {
                if (btnConfig.id === 'editGeneralProfile') {
                    enterInlineEditMode();
                    return;
                }
                activeEditConfig = btnConfig;
                editModalTitle.textContent = btnConfig.title;
                
                editFields.innerHTML = btnConfig.fields.map(f => {
                    let currentVal = '';
                    if (f.target) {
                        const targetEl = document.getElementById(f.target);
                        currentVal = targetEl ? targetEl.textContent.replace(f.prefix, '') : '';
                    }
                    
                    return `
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom:4px; font-weight:700; font-size:0.75rem; color: var(--secondary-text); text-transform: uppercase; letter-spacing: 0.5px;">${f.label}</label>
                            <input type="text" id="${f.id}" value="${currentVal}" placeholder="Add ${f.label}" style="width:100%; padding:8px 0; border:none; border-bottom:1px solid var(--border-color); background:transparent; color:var(--primary-text); font-size:1rem; font-weight:500; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='var(--border-color)'">
                        </div>
                    `;
                }).join('');
                
                // For empty field configs (placeholder for complex ones)
                if (btnConfig.fields.length === 0) {
                    editFields.innerHTML = `<p style="color: var(--text-muted); padding: 10px;">Detailed editor for this section is coming soon.</p>`;
                }
                
                editModal.style.display = 'flex';
            });
        }
    });

    // =============================================
    // INLINE EDITING LOGIC (General Profile)
    // =============================================
    const editableFields = document.querySelectorAll('.editable-field');
    const saveBtn = document.getElementById('saveGeneralProfile');
    const cancelBtn = document.getElementById('cancelGeneralProfile');
    const editBtn = document.getElementById('editGeneralProfile');
    let originalValues = {};

    function enterInlineEditMode() {
        if (!editBtn || !saveBtn || !cancelBtn) return;
        editBtn.style.display = 'none';
        saveBtn.style.display = 'flex';
        cancelBtn.style.display = 'flex';

        // Show emoji picker and hide display
        const picker = document.getElementById('habitEmojiPicker');
        const display = document.getElementById('habitEmojisDisplay');
        if (picker) picker.style.display = 'grid';
        if (display) display.style.visibility = 'hidden';

        editableFields.forEach(field => {
            if (field.id === 'ownDiagnosisTags' || field.id === 'healthBarriersTags') {
                // If it contains tags, convert them to comma-separated text for editing
                const tags = Array.from(field.querySelectorAll('.tag')).map(t => t.textContent.trim());
                if (tags.length > 0) {
                    field.textContent = tags.join(', ') + ', ';
                }
            }
            originalValues[field.id] = field.textContent;
            field.contentEditable = "true";
        });
        
        // Focus the name field
        const nameField = document.getElementById('displayProfileName');
        if (nameField) nameField.focus();
    }

    function exitInlineEditMode(save = false) {
        if (!editBtn || !saveBtn || !cancelBtn) return;
        editBtn.style.display = 'flex';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';

        editableFields.forEach(field => {
            field.contentEditable = "false";
            if (!save) {
                field.textContent = originalValues[field.id];
            }
        });
        
        // Hide emoji picker and show display
        const picker = document.getElementById('habitEmojiPicker');
        const display = document.getElementById('habitEmojisDisplay');
        if (picker) picker.style.display = 'none';
        if (display) display.style.visibility = 'visible';

        if (save) {
            // Recalculate BMI if needed
            const height = parseFloat(document.getElementById('displayProfileHeight')?.textContent);
            const weight = parseFloat(document.getElementById('displayProfileWeight')?.textContent);
            const bmiEl = document.getElementById('displayProfileBMI');
            if (bmiEl) {
                if (height && weight) {
                    const hM = height / 100;
                    bmiEl.textContent = (weight / (hM * hM)).toFixed(1);
                } else {
                    bmiEl.textContent = '--';
                }
            }
            // Re-render everything from the fresh database state
            loadUserProfile();
        }
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const payload = {};
            editableFields.forEach(field => {
                const key = field.dataset.field;
                if (!key) return;
                let val = field.textContent.trim();
                if (val === '--' || val === 'Unknown User' || val === 'Loading...' || val === 'None added') val = '';
                
                // Convert to number if needed
                if (key === 'height' || key === 'weight') {
                    payload[key] = parseFloat(val) || null;
                } else {
                    payload[key] = val;
                }
            });
            
            // Add habits to payload as text (mapping emojis to their titles)
            const habitLabels = selectedHabits.map(emoji => {
                const opt = document.querySelector(`.picker-option[data-emoji="${emoji}"]`);
                return opt ? opt.getAttribute('title') : emoji;
            });
            payload.habits = habitLabels.join(', ');

            try {
                const token = localStorage.getItem('rapidcare_token');
                if (token) {
                    const response = await fetch(API_BASE + '/patients/me', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error('Failed to update profile');
                    
                    // Update sidebar and header name if changed
                    const sidebarName = document.getElementById('sidebarName');
                    if (sidebarName && payload.name) sidebarName.textContent = payload.name;
                    
                    // Show success toast
                    const toast = document.createElement('div');
                    toast.style.cssText = "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--primary-green);color:white;padding:12px 24px;border-radius:10px;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.1);animation:slideUp 0.3s ease-out;";
                    toast.textContent = "Profile updated successfully!";
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2500);

                    exitInlineEditMode(true);
                }
            } catch (error) {
                console.error('Update error:', error);
                alert('Error updating profile in database.');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exitInlineEditMode(false);
        });
    }

    // =============================================
    // SUGGESTIONS LOGIC
    // =============================================
    const commonAllergies = [
        "Penicillin", "Peanuts", "Shellfish", "Latex", "Pollen", 
        "Dust Mites", "Mold", "Aspirin", "Ibuprofen", "Dairy",
        "Eggs", "Soy", "Wheat"
    ];

    const commonChronic = [
        "Asthma", "Diabetes (Type 1)", "Diabetes (Type 2)", 
        "Hypertension", "Arthritis", "Heart Disease", 
        "Thyroid Disorder", "COPD", "Epilepsy", "Migraine",
        "Anxiety", "Depression", "GERD"
    ];

    const commonDiagnosis = [
        "Obesity", "High Cholesterol", "Insomnia", "Stress",
        "Chronic Pain", "Fatigue", "Vitamin D Deficiency",
        "Anemia", "PCOS", "Sleep Apnea"
    ];

    const commonBarriers = [
        "Lack of Exercise", "Poor Diet", "Smoking", 
        "Alcohol Consumption", "Sedentary Lifestyle", 
        "Irregular Sleep", "High Caffeine Intake",
        "Work Stress", "Financial Constraints"
    ];

    function setupSuggestions(fieldId, suggestionsId, list) {
        const field = document.getElementById(fieldId);
        const dropdown = document.getElementById(suggestionsId);
        if (!field || !dropdown) return;

        function renderSuggestions(filter = "") {
            const filtered = list.filter(item => 
                item.toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                dropdown.classList.remove('active');
                return;
            }

            dropdown.innerHTML = filtered.map(item => `
                <div class="suggestion-item" data-value="${item}">
                    <i class="fas fa-plus"></i> ${item}
                </div>
            `).join('');
            dropdown.classList.add('active');
        }

        field.addEventListener('focus', () => {
            if (field.contentEditable === "true") {
                renderSuggestions();
            }
        });

        field.addEventListener('input', () => {
            if (field.contentEditable === "true") {
                // Get the text after the last comma
                const parts = field.textContent.split(',');
                const lastPart = parts[parts.length - 1].trim();
                renderSuggestions(lastPart);
            }
        });

        dropdown.addEventListener('mousedown', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (item) {
                const value = item.dataset.value;
                const parts = field.textContent.split(',').map(p => p.trim());
                // Replace the last part (what the user was typing) with the selected value
                parts[parts.length - 1] = value;
                
                // Filter out empty or placeholder strings
                const filteredParts = parts.filter(p => p && p !== '--' && p !== 'None');
                
                field.textContent = filteredParts.join(', ') + ', ';
                
                // Keep focus and place cursor at end
                setTimeout(() => {
                    field.focus();
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(field);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }, 0);
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (!field.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    setupSuggestions('displayProfileAllergies', 'allergies-suggestions', commonAllergies);
    setupSuggestions('displayProfileChronic', 'chronic-suggestions', commonChronic);
    setupSuggestions('ownDiagnosisTags', 'own-diagnosis-suggestions', commonDiagnosis);
    setupSuggestions('healthBarriersTags', 'health-barriers-suggestions', commonBarriers);

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (activeEditConfig && activeEditConfig.id === 'editGeneralProfile') {
                const payload = {
                    name: document.getElementById('edit-name')?.value,
                    gender: document.getElementById('edit-gender')?.value,
                    date_of_birth: document.getElementById('edit-birth')?.value,
                    height: parseFloat(document.getElementById('edit-height')?.value) || null,
                    weight: parseFloat(document.getElementById('edit-weight')?.value) || null,
                    blood_type: document.getElementById('edit-blood')?.value,
                    home_location: document.getElementById('edit-loc')?.value,
                    blood_pressure: document.getElementById('edit-bp')?.value,
                    allergies: document.getElementById('edit-allergies')?.value,
                    chronic_conditions: document.getElementById('edit-chronic')?.value
                };

                try {
                    const token = localStorage.getItem('rapidcare_token');
                    if (token) {
                        const response = await fetch(API_BASE + '/patients/me', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });
                        if (!response.ok) throw new Error('Failed to update profile');
                    }
                } catch (error) {
                    console.error('Update error:', error);
                    alert('Error updating profile in database.');
                }
            }

            if (activeEditConfig && activeEditConfig.id === 'editMedicalHistory') {
                const payload = {
                    chronic_disease: document.getElementById('m-c')?.value,
                    diabetes_emergencies: document.getElementById('m-e')?.value,
                    surgeries: document.getElementById('m-s')?.value,
                    family_history: document.getElementById('m-f')?.value,
                    diabetes_complications: document.getElementById('m-x')?.value
                };

                try {
                    const token = localStorage.getItem('rapidcare_token');
                    if (token) {
                        const response = await fetch(API_BASE + '/patients/me', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });
                        if (!response.ok) throw new Error('Failed to update medical history');
                    }
                } catch (error) {
                    console.error('Update error:', error);
                    alert('Error updating medical history in database.');
                }
            }
            
            if (activeEditConfig && activeEditConfig.fields) {
                activeEditConfig.fields.forEach(f => {
                    const input = document.getElementById(f.id);
                    if (input && f.target) {
                        const targetEl = document.getElementById(f.target);
                        if (targetEl) {
                            targetEl.textContent = input.value ? f.prefix + input.value : f.prefix + '--';
                        }
                    }
                });
            }

            if (activeEditConfig && activeEditConfig.id === 'editGeneralProfile') {
                const heightVal = parseFloat(document.getElementById('edit-height')?.value);
                const weightVal = parseFloat(document.getElementById('edit-weight')?.value);
                const bmiEl = document.getElementById('displayProfileBMI');
                if (bmiEl) {
                    if (heightVal && weightVal) {
                        const hM = heightVal / 100;
                        bmiEl.textContent = (weightVal / (hM * hM)).toFixed(1);
                    } else {
                        bmiEl.textContent = '--';
                    }
                }
            }

            // Show success toast
            const toast = document.createElement('div');
            toast.style.cssText = "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--primary-green);color:white;padding:12px 24px;border-radius:10px;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.1);animation:slideUp 0.3s ease-out;";
            toast.textContent = "Profile updated successfully!";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);

            editModal.style.display = 'none';
        });
    }

    // =============================================
    // INSURANCE VIEW LOGIC
    // =============================================
    const iModal = document.getElementById('add-scheme-modal');
    const iForm = document.getElementById('add-scheme-form');
    const iTypeInput = document.getElementById('scheme-type');
    let iCurrentContainer = null;
    let iCurrentPill = null;
    let iCurrentAccordion = null;

    if (iModal && iForm) {
        const stateAcc = document.querySelector('.icon-state')?.closest('.accordion-item-insurance');
        const centralAcc = document.querySelector('.icon-central')?.closest('.accordion-item-insurance');
        const mediclaimAcc = document.querySelector('.icon-mediclaim')?.closest('.accordion-item-insurance');
        const privateAcc = document.querySelector('.icon-private')?.closest('.accordion-item-insurance');

        const accEntries = [
            { id: 'State', el: stateAcc },
            { id: 'Central', el: centralAcc },
            { id: 'Mediclaim', el: mediclaimAcc },
            { id: 'Private', el: privateAcc }
        ];

        accEntries.forEach(acc => {
            if (acc.el) {
                const addBtn = acc.el.querySelector('.add-scheme-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        openInsuranceModal(acc.id, acc.el.querySelector('.scheme-list'), acc.el.querySelector('.count-pill'), acc.el);
                    });
                }
            }
        });

        const globalAddBtn = document.getElementById('global-add-btn');
        if (globalAddBtn) {
            globalAddBtn.addEventListener('click', () => {
                openInsuranceModal('Global', null, null, null);
            });
        }

        function openInsuranceModal(type, listContainer, pillElement, accordionItem) {
            const headerText = iModal.querySelector('.modal-header h3');
            const typeGroup = document.getElementById('scheme-type-group');
            
            if (type === 'Global') {
                iTypeInput.value = 'Global';
                if(headerText) headerText.textContent = `Add New Insurance`;
                if(typeGroup) typeGroup.style.display = 'flex';
                iCurrentContainer = null;
                iCurrentPill = null;
                iCurrentAccordion = null;
            } else {
                iTypeInput.value = type;
                if(headerText) headerText.textContent = `Add ${type} Insurance Scheme`;
                if(typeGroup) typeGroup.style.display = 'none';
                iCurrentContainer = listContainer;
                iCurrentPill = pillElement;
                iCurrentAccordion = accordionItem;
            }
            
            iModal.style.display = 'flex';
            setTimeout(() => iModal.classList.add('active'), 10);
        }

        const iCloseBtn = iModal.querySelector('.close-modal-btn');
        if (iCloseBtn) {
            iCloseBtn.addEventListener('click', () => {
                iModal.classList.remove('active');
                setTimeout(() => iModal.style.display = 'none', 300);
                iForm.reset();
            });
        }

        iModal.addEventListener('click', (e) => {
            if (e.target === iModal) {
                iModal.classList.remove('active');
                setTimeout(() => iModal.style.display = 'none', 300);
                iForm.reset();
            }
        });

        iForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let targetType = iTypeInput.value;
            let targetContainer = iCurrentContainer;
            let targetPill = iCurrentPill;
            let targetAccordion = iCurrentAccordion;

            if (targetType === 'Global') {
                const selected = document.getElementById('scheme-category-select').value;
                const accMap = {
                    'State': document.querySelector('.icon-state')?.closest('.accordion-item-insurance'),
                    'Central': document.querySelector('.icon-central')?.closest('.accordion-item-insurance'),
                    'Mediclaim': document.querySelector('.icon-mediclaim')?.closest('.accordion-item-insurance'),
                    'Private': document.querySelector('.icon-private')?.closest('.accordion-item-insurance')
                };
                targetAccordion = accMap[selected];
                targetContainer = targetAccordion?.querySelector('.scheme-list');
                targetPill = targetAccordion?.querySelector('.count-pill');
            }

            if (!targetContainer) return;

            const name = document.getElementById('scheme-name').value;
            const desc = document.getElementById('scheme-desc').value;
            const link = document.getElementById('scheme-link').value;

            const newCard = document.createElement('div');
            newCard.className = 'scheme-card';
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(10px)';
            newCard.style.transition = 'all 0.3s ease';

            newCard.innerHTML = `
                <div class="scheme-header-insurance">
                    <div class="scheme-title">
                        <h4>${name}</h4>
                        <p>${desc}</p>
                    </div>
                    <span class="badge-insurance active">Linked</span>
                </div>
                <div class="scheme-actions">
                    <button class="btn btn-primary btn-sm">Raise Claim</button>
                    <a href="${link}" target="_blank" class="btn btn-outline btn-sm">View Portal</a>
                </div>
            `;

            const divider = targetContainer.querySelector('.section-divider');
            if (divider) {
                targetContainer.insertBefore(newCard, divider);
            } else {
                targetContainer.appendChild(newCard);
            }

            requestAnimationFrame(() => {
                newCard.style.opacity = '1';
                newCard.style.transform = 'none';
            });

            if (targetPill) {
                let currentCount = parseInt(targetPill.textContent);
                if (!isNaN(currentCount)) {
                    targetPill.textContent = (currentCount + 1) + " Linked";
                }
            }

            if (targetAccordion && targetAccordion.classList.contains('active')) {
                const content = targetAccordion.querySelector('.accordion-content-insurance');
                setTimeout(() => {
                    content.style.maxHeight = content.scrollHeight + "px";
                }, 50);
            }

            iModal.classList.remove('active');
            setTimeout(() => iModal.style.display = 'none', 300);
            iForm.reset();

            // Show success toast
            const toast = document.createElement('div');
            toast.style.cssText = "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--primary-green);color:white;padding:12px 24px;border-radius:10px;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.1);";
            toast.textContent = "Insurance scheme added successfully!";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        });
    }

    const iAccordions = document.querySelectorAll('.accordion-header-insurance');

    iAccordions.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            
            const isActive = item.classList.toggle('active');

            if (isActive) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = '0';
            }
        });
    });

    window.addEventListener('resize', () => {
        document.querySelectorAll('.accordion-item-insurance.active .accordion-content-insurance').forEach(content => {
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });

    // =============================================
    // INTEGRATED PAYMENT LOGIC
    // =============================================
    let baseFarePayment = 350; 
    let equipmentChargePayment = 100;
    let platformChargePayment = 40; 
    let donationAmountPayment = 10;
    
    let isPlatformFreePayment = false;
    let isHighValueAppliedPayment = false;
    let selectedBankOfferPayment = 'none';

    let cashRideCountPayment = parseInt(localStorage.getItem('rapidcare_cash_rides') || '0');
    let isCashRewardActivePayment = (cashRideCountPayment >= 5);

    const detailsBtnPay = document.getElementById('detailsBtnPayment');
    const detailsPanelPay = document.getElementById('detailsPanelIntegrated');
    const donateBtnsPay = document.querySelectorAll('.donate-btn-integrated');
    const customDonationPay = document.getElementById('customDonation');
    
    const payableDisplayPay = document.getElementById('payableAmountDisplay');
    const donationDisplayPay = document.getElementById('donationDisplay');
    const totalDisplayPay = document.getElementById('totalDisplay');
    const payBtnAmtPay = document.getElementById('payBtnAmount');

    const rideDiscRowPay = document.getElementById('rideDiscountRow');
    const bankDiscRowPay = document.getElementById('bankDiscountRow');
    const bankDiscNamePay = document.getElementById('bankDiscountName');
    const bankDiscAmtPay = document.getElementById('bankDiscountAmount');

    const addDiscBtnPay = document.getElementById('addDiscountBtn');
    const firstRideLblPay = document.getElementById('firstRideLabel');
    const platChargeDispPay = document.getElementById('platformChargeDisplay');

    const discModalPay = document.getElementById('discountModal');
    const closeDiscModalPay = document.getElementById('closeDiscountModal');
    const applyDiscBtnPay = document.getElementById('applyDiscountsBtn');
    const cbPlatFreePay = document.getElementById('cbPlatformFree');
    const cbHighValPay = document.getElementById('cbHighValue');
    const bankRadsPay = document.getElementsByName('bankOffer');

    const payMethodsPay = document.querySelectorAll('input[name="payment-method"]');
    const cardFormPay = document.getElementById('cardDetailsForm');
    const upiFormPay = document.getElementById('upiDetailsForm');
    const cashFormPay = document.getElementById('cashDetailsForm');
    const upiAppsPay = document.querySelectorAll('.upi-app-integrated');

    const cashFillPay = document.getElementById('cashProgressFill');
    const cashStatusTxtPay = document.getElementById('cashStatusText');
    const cashRowPay = document.getElementById('cashRewardRow');

    if (detailsBtnPay) {
        detailsBtnPay.addEventListener('click', () => {
            detailsPanelPay.classList.toggle('active');
        });
    }

    if (addDiscBtnPay) {
        addDiscBtnPay.addEventListener('click', () => {
            discModalPay.style.display = 'flex';
        });
    }

    if (closeDiscModalPay) {
        closeDiscModalPay.addEventListener('click', () => {
            discModalPay.style.display = 'none';
        });
    }

    if (applyDiscBtnPay) {
        applyDiscBtnPay.addEventListener('click', () => {
            isPlatformFreePayment = cbPlatFreePay && cbPlatFreePay.checked;
            isHighValueAppliedPayment = cbHighValPay && cbHighValPay.checked;
            
            for (let radio of bankRadsPay) {
                if (radio.checked) {
                    selectedBankOfferPayment = radio.value;
                    break;
                }
            }

            platformChargePayment = isPlatformFreePayment ? 0 : 40;
            addDiscBtnPay.textContent = 'Discounts Applied';
            addDiscBtnPay.style.background = 'var(--primary-green)';
            addDiscBtnPay.style.color = 'white';
            
            updateTotalPayment();
            discModalPay.style.display = 'none';
        });
    }

    donateBtnsPay.forEach(btn => {
        btn.addEventListener('click', (e) => {
            donateBtnsPay.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            if (customDonationPay) customDonationPay.value = '';
            donationAmountPayment = parseInt(e.target.getAttribute('data-amount'));
            updateTotalPayment();
        });
    });

    if (customDonationPay) {
        customDonationPay.addEventListener('input', (e) => {
            donateBtnsPay.forEach(b => b.classList.remove('selected'));
            donationAmountPayment = parseInt(e.target.value) || 0;
            updateTotalPayment();
        });
    }

    const confirmPayBtn = document.querySelector('.pay-now-btn-integrated');
    if (confirmPayBtn) {
        confirmPayBtn.addEventListener('click', async () => {
            const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
            const amountText = document.getElementById('payBtnAmount').textContent;
            const amount = parseInt(amountText) || 0;

            if (selectedMethod === 'cash') {
                if (isCashRewardActivePayment) {
                    cashRideCountPayment = 0;
                    isCashRewardActivePayment = false;
                } else {
                    cashRideCountPayment++;
                }
                localStorage.setItem('rapidcare_cash_rides', cashRideCountPayment.toString());
                alert('PAYMENT SUCCESSFUL!\n\nThank you for choosing RapidCare.\nYour bill is settled via Cash.');
                updateCashRewardUIPayment();
                updateTotalPayment();
                document.querySelector('.nav-item[data-view="overview"]')?.click();
                return;
            }

            try {
                confirmPayBtn.disabled = true;
                confirmPayBtn.innerHTML = 'Processing...';

                // 1. Create Order via Backend
                const orderRes = await fetch('http://localhost:5000/api/v1/payments/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, currency: 'INR' })
                });
                const orderData = await orderRes.json();

                if (!orderData.success) throw new Error('Could not create order');

                // 2. Open Razorpay Checkout
                const options = {
                    key: 'rzp_test_placeholder', // Should match backend or be injected dynamically
                    amount: orderData.order.amount,
                    currency: orderData.order.currency,
                    name: 'RapidCare',
                    description: 'Medical Service Payment',
                    order_id: orderData.order.id,
                    handler: async function (response) {
                        try {
                            // 3. Verify Payment
                            const verifyRes = await fetch('http://localhost:5000/api/v1/payments/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    paymentDetails: { amount, user_id: 'patient_user' }
                                })
                            });
                            
                            const verifyData = await verifyRes.json();
                            
                            if (verifyData.success) {
                                alert('PAYMENT SUCCESSFUL!\n\nThank you for choosing RapidCare.\nYour bill is settled.');
                                updateCashRewardUIPayment();
                                updateTotalPayment();
                                document.querySelector('.nav-item[data-view="overview"]')?.click();
                            } else {
                                alert('Payment verification failed. Please contact support.');
                            }
                        } catch (err) {
                            console.error(err);
                            alert('Error verifying payment.');
                        }
                    },
                    theme: { color: '#0d9488' }
                };
                
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response){
                    alert('Payment Failed: ' + response.error.description);
                });
                rzp.open();
                
            } catch (err) {
                console.error('Payment error:', err);
                alert('Could not initiate payment. Please try again.');
            } finally {
                confirmPayBtn.disabled = false;
                confirmPayBtn.innerHTML = `Pay ₹<span id="payBtnAmount">${amount}</span>`;
            }
        });
    }

    payMethodsPay.forEach(radio => {
        radio.addEventListener('change', () => {
            cardFormPay.style.display = 'none';
            upiFormPay.style.display = 'none';
            cashFormPay.style.display = 'none';

            if (radio.value === 'card') cardFormPay.style.display = 'block';
            else if (radio.value === 'upi') upiFormPay.style.display = 'block';
            else if (radio.value === 'cash') cashFormPay.style.display = 'block';
            
            updateTotalPayment();
        });
    });

    upiAppsPay.forEach(app => {
        app.addEventListener('click', () => {
            upiAppsPay.forEach(a => a.classList.remove('selected'));
            app.classList.add('selected');
        });
    });

    function updateCashRewardUIPayment() {
        const ridesCompleted = Math.min(cashRideCountPayment, 5);
        isCashRewardActivePayment = (cashRideCountPayment >= 5);

        if (cashFillPay) {
            const progress = isCashRewardActivePayment ? 100 : (ridesCompleted / 5) * 100;
            cashFillPay.style.width = progress + '%';
        }

        if (cashStatusTxtPay) {
            if (isCashRewardActivePayment) {
                cashStatusTxtPay.innerHTML = '<strong style="color: var(--primary-green);">Reward Unlocked!</strong> This ride\'s platform fee is waived.';
            } else {
                const remaining = 5 - ridesCompleted;
                cashStatusTxtPay.textContent = `${remaining} more cash ride${remaining !== 1 ? 's' : ''} to unlock free platform fee!`;
            }
        }
    }

    function updateTotalPayment() {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        let cashRewardDiscount = 0;
        if (selectedMethod === 'cash' && isCashRewardActivePayment) {
            cashRewardDiscount = 40;
        }

        let effectivePlatformCharge = platformChargePayment;
        if (cashRewardDiscount > 0) effectivePlatformCharge = 0;

        let subtotal = baseFarePayment + equipmentChargePayment + effectivePlatformCharge;
        
        let rideDiscount = 0;
        if (isHighValueAppliedPayment && (baseFarePayment + equipmentChargePayment + platformChargePayment) > 600) {
            rideDiscount = 10;
            if (rideDiscRowPay) rideDiscRowPay.style.display = 'flex';
        } else {
            if (rideDiscRowPay) rideDiscRowPay.style.display = 'none';
        }

        let bankDiscount = 0;
        let bankName = "";
        
        if (selectedMethod === 'card' && selectedBankOfferPayment !== 'none') {
            if (selectedBankOfferPayment === 'hdfc') {
                bankDiscount = Math.round((subtotal - rideDiscount) * 0.05);
                bankName = "HDFC Bank (5% Off)";
            } else if (selectedBankOfferPayment === 'sbi') {
                bankDiscount = Math.round((subtotal - rideDiscount) * 0.06);
                bankName = "SBI Bank (6% Off)";
            }
        }

        if (bankDiscount > 0) {
            if (bankDiscNamePay) bankDiscNamePay.textContent = bankName;
            if (bankDiscAmtPay) bankDiscAmtPay.textContent = `-₹${bankDiscount}`;
            if (bankDiscRowPay) bankDiscRowPay.style.display = 'flex';
        } else {
            if (bankDiscRowPay) bankDiscRowPay.style.display = 'none';
        }

        if (cashRowPay) {
            cashRowPay.style.display = (cashRewardDiscount > 0) ? 'flex' : 'none';
        }

        if (platChargeDispPay) {
            if (isPlatformFreePayment || cashRewardDiscount > 0) {
                platChargeDispPay.innerHTML = '<del>₹40</del> ₹0';
                if (firstRideLblPay && isPlatformFreePayment) firstRideLblPay.style.display = 'inline';
            } else {
                platChargeDispPay.textContent = '₹40';
                if (firstRideLblPay) firstRideLblPay.style.display = 'none';
            }
        }

        const total = subtotal - rideDiscount - bankDiscount + donationAmountPayment;
        
        if (donationDisplayPay) donationDisplayPay.textContent = `₹${donationAmountPayment}`;
        if (totalDisplayPay) totalDisplayPay.textContent = `₹${total}`;
        if (payableDisplayPay) payableDisplayPay.textContent = `Payable Amount: ₹${total}`;
        if (payBtnAmtPay) payBtnAmtPay.textContent = total;
    }

    updateCashRewardUIPayment();
    updateTotalPayment();

    // Profile Dropdown Logic
    const userProfileCard = document.getElementById('userProfileCard');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileChevron = document.getElementById('profileChevron');

    if (userProfileCard && profileDropdown) {
        userProfileCard.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = profileDropdown.classList.contains('active');
            
            // Toggle dropdown
            profileDropdown.classList.toggle('active');
            
            // Rotate chevron
            if (profileChevron) {
                profileChevron.style.transform = isActive ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (profileDropdown.classList.contains('active')) {
                profileDropdown.classList.remove('active');
                if (profileChevron) {
                    profileChevron.style.transform = 'rotate(0deg)';
                }
            }
        });

        // Prevent closing when clicking inside the dropdown
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle "View Profile" click within dropdown
        const viewProfileItem = profileDropdown.querySelector('[data-view="details"]');
        if (viewProfileItem) {
            viewProfileItem.addEventListener('click', () => {
                // Switch to Details view
                const detailsLink = document.querySelector('.nav-link[data-view="details"]');
                if (detailsLink) detailsLink.click();
                
                // Activate Profile sub-tab
                const profileTab = document.querySelector('.sub-tab[data-tab="profile"]');
                if (profileTab) profileTab.click();
                
                profileDropdown.classList.remove('active');
                if (profileChevron) profileChevron.style.transform = 'rotate(0deg)';
            });
        }
    }

    console.log('RapidCare Dashboard Initialized');
});

function handleCall() {
     const toast = document.createElement('div');
     toast.style.cssText = "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#15803d;color:white;padding:16px 24px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:9999;font-weight:600;display:flex;align-items:center;gap:12px;animation:slideUp 0.4s ease;";
     toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 15.5z"/></svg> Initializing Secure Call...`;
     document.body.appendChild(toast);
     setTimeout(() => toast.remove(), 3000);
}

function handleMessage() {
     const msg = prompt("Enter message for Matt Smith:");
     if (msg) {
        alert("Message sent to driver: " + msg);
     }
}


// --- ANALYTICS SCRIPT --- 
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Simulation Data Elements
    const elements = {
        hr: document.getElementById('val-hr'),
        bp: document.getElementById('val-bp'),
        safety: document.getElementById('val-safety'),
        barHr: document.getElementById('bar-hr'),
        barBp: document.getElementById('bar-bp'),
        barO2: document.getElementById('bar-o2')
    };

    // 1. Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // 2. Theme Toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? 
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>` : 
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>`;
    });

    // 3. Simulation Modal Handlers
    window.openSimModal = () => {
        document.getElementById('simModal').classList.add('active');
    };

    window.closeSimModal = () => {
        document.getElementById('simModal').classList.remove('active');
    };

    window.applySimulation = () => {
        const HR = document.getElementById('input-hr').value;
        const BP = document.getElementById('input-bp').value;
        const Safety = document.getElementById('input-safety').value;

        // Update Values with animation
        animateValue(elements.hr, HR);
        animateValue(elements.safety, Safety);
        elements.bp.innerText = `${BP}/76`;

        // Update Bars
        elements.barHr.style.width = `${(HR / 150) * 100}%`;
        elements.barBp.style.width = `${(BP / 200) * 100}%`;
        
        // Update Safety card progress
        document.querySelector('.metric-card .progress-bar-fill').style.width = `${Safety}%`;

        // Update circular progress (Service quality simulation)
        // Just for visual effect when they edit
        const fgCircle = document.querySelector('.circular-progress circle.fg');
        const offset = 282.7 - (282.7 * (Safety / 100));
        fgCircle.style.strokeDashoffset = offset;
        document.querySelector('.progress-val span').innerText = `${Math.round(Safety * 1.07)}%`;

        closeSimModal();
        
        // Visual feedback
        showNotification('Analytics profile updated successfully');
    };

    function animateValue(obj, end) {
        let start = parseInt(obj.innerText);
        let duration = 800;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerText = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function showNotification(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--primary-green);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s forwards;
            z-index: 9999;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Add keyframe for toast
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});


// --- HISTORY SCRIPT --- 
let medicalRecords = [];

const doctorBookings = [
    {
        id: 101,
        doctor: "Dr. Sarah Mitchell",
        specialty: "Cardiology",
        date: "2024-04-25",
        time: "10:30 AM",
        hospital: "City General Hospital",
        type: "Checkup"
    },
    {
        id: 102,
        doctor: "Dr. Emily Chen",
        specialty: "Dermatology",
        date: "2024-05-02",
        time: "02:15 PM",
        hospital: "Skin & Care Clinic",
        type: "Consultation"
    }
];

// DOM Elements
const historyList = document.getElementById('history-list');
const detailPane = document.getElementById('detail-pane');
const noSelection = document.getElementById('no-selection');
const detailContent = document.getElementById('detail-content');
const searchInput = document.getElementById('history-search');
const filterChips = document.querySelectorAll('.filter-chip');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('theme-toggle');

let currentFilter = 'all';
let searchQuery = '';
let selectedRecordId = null; // Track current record for re-rendering

// Initialize
function init() {
    fetchMedicalRecords();
    setupEventListeners();
    loadAppointments();
    fetchPayments();
    fetchAnalytics();
}




async function fetchMedicalRecords() {
    const token = localStorage.getItem('rapidcare_token');
    if (!token) return;

    try {
        const response = await fetch(API_BASE + '/medical_records', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            medicalRecords = data.map(record => ({
                id: record.id,
                date: record.created_at,
                type: 'general', 
                title: record.diagnosis || 'Medical Visit',
                doctor: record.doctor_name || 'Assigned Doctor',
                hospital: record.hospital_name || 'RapidCare Facility',
                status: record.status || 'completed',
                vitals: null,
                diagnosis: record.diagnosis,
                prescriptions: (record.prescriptions || []).map(p => ({
                    name: p.medication_name,
                    dosage: p.sig,
                    frequency: 'As directed',
                    purpose: p.indication || ''
                })),
                notes: record.clinical_notes || record.treatment_plan
            }));
            renderHistory();
        }
    } catch (err) {
        console.error('Error fetching medical records:', err);
    }
}

async function fetchPayments() {
    const token = localStorage.getItem('rapidcare_token');
    if (!token) return;

    try {
        const response = await fetch(API_BASE + '/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const payments = await response.json();
            const tbody = document.getElementById('payment-history-body');
            if (!tbody) return;

            tbody.innerHTML = payments.map(p => `
                <tr>
                    <td>${new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${p.payment_method === 'cash' ? 'Ambulance (Cash)' : 'Ambulance (Online)'}</td>
                    <td>Trip ID: ${p.trip_id}</td>
                    <td class="amt" style="font-weight: 700;">₹${p.amount.toLocaleString()}</td>
                    <td><span class="badge-insurance approved">${p.status === 'completed' ? 'Paid' : p.status}</span></td>
                    <td><a href="#" style="color: var(--primary-green); text-decoration: none; font-weight: 600;">Download</a></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Error fetching payments:', err);
    }
}

async function fetchAnalytics() {
    const token = localStorage.getItem('rapidcare_token');
    if (!token) return;

    try {
        const response = await fetch(API_BASE + '/analytics/patient', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const { metrics } = data;
            
            if (document.getElementById('val-response')) 
                document.getElementById('val-response').textContent = metrics.avg_response_time;
            if (document.getElementById('val-safety')) 
                document.getElementById('val-safety').textContent = metrics.safety_score;
            if (document.getElementById('val-distance')) 
                document.getElementById('val-distance').textContent = metrics.total_distance;
        }
    } catch (err) {
        console.error('Error fetching analytics:', err);
    }
}



// Render History List
function renderHistory() {
    const filtered = medicalRecords.filter(record => {
        const matchesFilter = currentFilter === 'all' || record.type === currentFilter;
        const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              record.hospital.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    historyList.innerHTML = filtered.map(record => {
        const dateObj = new Date(record.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('default', { month: 'short' });
        
        return `
            <div class="history-item" onclick="selectRecord(${record.id})">
                <div class="date-box">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <div class="history-info">
                    <h4>${record.title}</h4>
                    <p>${record.doctor} • ${record.hospital}</p>
                    <span class="status-tag status-${record.status}">${record.status}</span>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('record-count').innerText = `${filtered.length} Records`;
}

// Helper for trends
function getTrend(currentValue, previousValue, type) {
    if (!previousValue) return { icon: '•', class: 'trend-stable', text: 'First reading' };
    
    const curr = parseFloat(currentValue);
    const prev = parseFloat(previousValue);
    
    if (curr > prev) {
        return { icon: '▲', class: type === 'weight' ? 'trend-up' : 'trend-up', text: 'Higher than last' };
    } else if (curr < prev) {
        return { icon: '▼', class: type === 'weight' ? 'trend-down' : 'trend-down', text: 'Lower than last' };
    }
    return { icon: '▬', class: 'trend-stable', text: 'Stable' };
}

// Select Record and Update Detail Pane
function selectRecord(id) {
    selectedRecordId = id;
    const recordIndex = medicalRecords.findIndex(r => r.id === id);
    const record = medicalRecords[recordIndex];
    const prevRecord = medicalRecords[recordIndex + 1]; // Previous in time is next in array since it's sorted desc

    if (!record) return;

    // Update active state in list
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('selected'));
    
    // Using a more robust way to find the item in the DOM
    const listItems = historyList.querySelectorAll('.history-item');
    const filteredList = medicalRecords.filter(r => {
        const matchesFilter = currentFilter === 'all' || r.type === currentFilter;
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              r.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.hospital.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    const itemIndex = filteredList.findIndex(r => r.id === id);
    if (listItems[itemIndex]) listItems[itemIndex].classList.add('selected');

    noSelection.style.display = 'none';
    detailContent.style.display = 'block';
    
    // Mobile handling
    if (window.innerWidth <= 768) {
        detailPane.classList.add('mobile-active');
    }

    detailContent.innerHTML = `
        <div class="mobile-back-btn" onclick="closeMobileDetail()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Records</span>
        </div>
        <div class="detail-header">
            <div class="detail-title">
                <h2>${record.title}</h2>
                <div class="detail-meta">
                    <span>📅 ${new Date(record.date).toLocaleDateString()}</span>
                    <span>🏥 ${record.hospital}</span>
                    <span>👨‍⚕️ ${record.doctor}</span>
                </div>
            </div>
            <div class="action-group">
                <button class="secondary-btn" onclick="window.print()">Print Report</button>
                <button class="primary-btn">Download PDF</button>
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-card" style="grid-column: span 2;">
                <h3>Current Vitals & Trends</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                    ${record.vitals ? Object.entries(record.vitals).map(([key, val]) => {
                        const prevVal = prevRecord && prevRecord.vitals ? prevRecord.vitals[key] : null;
                        const trend = getTrend(val, prevVal, key);
                        const label = key.replace('bp', 'Blood Pressure').replace('hr', 'Heart Rate').replace('temp', 'Temp').replace('weight', 'Weight');
                        return `
                            <div class="vital-card">
                                <span class="vital-label">${label}</span>
                                <span class="vital-value">${val}</span>
                                <span class="vital-trend ${trend.class}">${trend.icon} ${trend.text}</span>
                            </div>
                        `;
                    }).join('') : '<p>No vitals recorded.</p>'}
                </div>
            </div>

            <div class="detail-card">
                <h3>Prescribed Medicines</h3>
                <div class="medicine-list">
                    ${record.prescriptions.length > 0 ? record.prescriptions.map(p => `
                        <div class="prescription-item" style="border-left: 3px solid var(--primary-green);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <strong>${p.name}</strong>
                                <span style="font-size: 11px; background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">${p.dosage}</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                🕒 ${p.frequency} • <small>${p.purpose}</small>
                            </div>
                        </div>
                    `).join('') : '<p style="color: var(--text-muted); font-size: 14px;">No medications prescribed.</p>'}
                </div>
            </div>

            <div class="detail-card">
                <h3>Doctor's Analysis</h3>
                <p style="font-size: 14px; margin-bottom: 12px;"><strong>Diagnosis:</strong> ${record.diagnosis}</p>
                <div style="font-size: 14px; color: var(--text-main); background: var(--white); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                    ${record.notes}
                </div>
            </div>

            <div class="bookings-section" style="grid-column: span 2;">
                <h3>Upcoming Doctor Bookings</h3>
                <div class="bookings-grid">
                    ${doctorBookings.map(booking => `
                        <div class="booking-card">
                            <div class="booking-header">
                                <span class="booking-status status-upcoming">Upcoming</span>
                                <span style="font-size: 11px; color: var(--text-muted);">${booking.type}</span>
                            </div>
                            <div class="booking-info">
                                <h4>${booking.doctor}</h4>
                                <p>${booking.specialty}</p>
                                <p style="font-size: 11px; margin-top: 4px;">📍 ${booking.hospital}</p>
                            </div>
                            <div class="booking-footer">
                                <span class="booking-time">📅 ${booking.date}</span>
                                <span class="booking-time">⏰ ${booking.time}</span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="booking-card" onclick="openBookingModal()" style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-style: dashed; cursor: pointer; background: transparent;">
                        <span style="font-size: 24px; color: var(--primary-green);">+</span>
                        <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">New Booking</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderHistory();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderHistory();
        });
    });

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        ` : `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    });
}

function closeMobileDetail() {
    detailPane.classList.remove('mobile-active');
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('selected'));
    selectedRecordId = null;
}

// Modal Functions
function openBookingModal() {
    document.getElementById('booking-modal').classList.add('active');
    loadDoctors();
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.remove('active');
    document.getElementById('booking-form').reset();
}


async function loadDoctors() {
    try {
        const token = localStorage.getItem('rapidcare_token');
        const response = await fetch(API_BASE + '/doctors', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const doctors = await response.json();
        
        // Populate datalist for doctor selection
        let datalist = document.getElementById('doctors-datalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'doctors-datalist';
            document.body.appendChild(datalist);
            document.getElementById('book-doctor').setAttribute('list', 'doctors-datalist');
        }
        
        datalist.innerHTML = doctors.map(d => `<option value="${d.name}" data-id="${d.id}" data-specialty="${d.specialization}" data-hospital="${d.hospital_id}">`).join('');
        
        // Auto-fill specialty when doctor is selected
        document.getElementById('book-doctor').addEventListener('input', (e) => {
            const selectedOption = Array.from(datalist.options).find(opt => opt.value === e.target.value);
            if (selectedOption) {
                document.getElementById('book-specialty').value = selectedOption.dataset.specialty;
                // You might need to fetch hospital name here if needed, or just leave it for now
                document.getElementById('book-hospital').value = "Hospital ID: " + selectedOption.dataset.hospital;
                e.target.dataset.selectedId = selectedOption.dataset.id;
            }
        });
    } catch (err) {
        console.error('Error loading doctors:', err);
    }
}

async function loadAppointments() {
    try {
        const token = localStorage.getItem('rapidcare_token');
        const response = await fetch(API_BASE + '/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const appointments = await response.json();
        
        // Map backend appointments to frontend format
        const formatted = appointments.map(a => ({
            id: a.id,
            doctor: a.doctor_name,
            specialty: a.doctor_specialization,
            date: a.appointment_date.split('T')[0],
            time: new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hospital: 'General Hospital', // Simplified
            type: a.type
        }));
        
        // Clear and update the global array (if used for rendering)
        doctorBookings.length = 0;
        doctorBookings.push(...formatted);
        
        // Re-render if necessary
        if (selectedRecordId) selectRecord(selectedRecordId);
    } catch (err) {
        console.error('Error loading appointments:', err);
    }
}

async function handleBookingSubmit(event) {
    event.preventDefault();
    
    const doctorInput = document.getElementById('book-doctor');
    const doctorId = doctorInput.dataset.selectedId;
    const date = document.getElementById('book-date').value;
    const time = document.getElementById('book-time').value;
    const type = document.getElementById('book-type').value;
    const notes = "Booked via RapidCare Dashboard";

    if (!doctorId) {
        alert('Please select a doctor from the list');
        return;
    }

    try {
        const token = localStorage.getItem('rapidcare_token');
        const response = await fetch(API_BASE + '/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                doctor_id: doctorId,
                appointment_date: `${date}T${time}:00`,
                type: type,
                notes: notes
            })
        });

        if (response.ok) {
            alert('Appointment booked successfully!');
            closeBookingModal();
            loadAppointments();
        } else {
            const data = await response.json();
            alert('Booking failed: ' + data.error);
        }
    } catch (err) {
        console.error('Booking error:', err);
        alert('Failed to connect to server');
    }
}


window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        detailPane.classList.remove('mobile-active');
    }
});

init();

// Resizer Logic
document.addEventListener('DOMContentLoaded', () => {
    const resizer = document.getElementById('dragMe');
    if (!resizer) return;
    
    const leftSide = resizer.previousElementSibling;
    const rightSide = resizer.nextElementSibling;

    let x = 0;
    let leftWidth = 0;

    const mouseDownHandler = function (e) {
        x = e.clientX;
        leftWidth = leftSide.getBoundingClientRect().width;
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        
        leftSide.style.pointerEvents = 'none';
        rightSide.style.pointerEvents = 'none';
        leftSide.style.userSelect = 'none';
        rightSide.style.userSelect = 'none';
    };

    const mouseMoveHandler = function (e) {
        const dx = e.clientX - x;
        const parentWidth = resizer.parentNode.getBoundingClientRect().width;
        // Calculate new width in percentage to keep it responsive
        const newLeftWidth = ((leftWidth + dx) * 100) / parentWidth;
        
        // Limits
        if (newLeftWidth > 20 && newLeftWidth < 75) {
            leftSide.style.width = newLeftWidth + '%';
        }
    };

    const mouseUpHandler = function () {
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        
        leftSide.style.pointerEvents = '';
        rightSide.style.pointerEvents = '';
        leftSide.style.userSelect = '';
        rightSide.style.userSelect = '';

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        
        // Trigger resize event for map rendering if needed
        window.dispatchEvent(new Event('resize'));
    };

    resizer.addEventListener('mousedown', mouseDownHandler);


    /* --- IMPORTED PAYMENT JS --- */
    // --- Data ---
    const indianBanks = [
        "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
        "Punjab National Bank", "Canara Bank", "Bank of Baroda", "Union Bank of India",
        "IDFC FIRST Bank", "IndusInd Bank", "Yes Bank", "Federal Bank", "RBL Bank",
        "Indian Bank", "UCO Bank", "Bank of India", "Central Bank of India",
        "South Indian Bank", "Karnataka Bank", "City Union Bank", "Saraswat Bank"
    ];

    const popularBanks = [
        { name: "SBI", icon: "assets/logos/sbi_logo.png" },
        { name: "HDFC", icon: "assets/logos/hdfc_logo.png" },
        { name: "ICICI", icon: "assets/logos/icici_logo.png" },
        { name: "Axis", icon: "assets/logos/axis_logo.png" }
    ];

    const pricingConfig = {
        normal: { original: 100, discounted: 70 },
        oxygen: { original: 150, discounted: 130 },
        icu: { original: 200, discounted: 180 },
        ventilator: { original: 300, discounted: 280 }
    };

    // --- DOM Elements ---
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const cardBankSearch = document.getElementById('card-bank-search');
    const cardBankList = document.getElementById('card-bank-list');
    const netBankSearch = document.getElementById('net-bank-search');
    const netBankList = document.getElementById('net-bank-list');
    const popularBanksGrid = document.getElementById('popular-banks');
    const applyCouponBtn = document.getElementById('apply-coupon');
    const couponInput = document.getElementById('coupon-code');
    const couponMsg = document.getElementById('coupon-msg');
    const totalAmountDisplay = document.getElementById('total-amount');
    const distanceInput = document.getElementById('distance-input');
    const ambulanceOptions = document.querySelectorAll('input[name="ambulance-type"]');
    const payBtn = document.querySelector('.pay-btn');

    // --- Initialize ---
    populateBankLists();
    recalculatePricing();
    
    // --- Pricing Logic ---
    async function recalculatePricing() {
        const selectedType = document.querySelector('input[name="ambulance-type"]:checked').value;
        const distance = parseFloat(distanceInput.value) || 0;
        const couponCode = couponInput.value.toUpperCase();
        
        if (distance <= 0) {
            payBtn.disabled = true;
            payBtn.style.opacity = '0.5';
            payBtn.style.cursor = 'not-allowed';
            return;
        } else {
            payBtn.disabled = false;
            payBtn.style.opacity = '1';
            payBtn.style.cursor = 'pointer';
        }

        try {
            const token = localStorage.getItem('rapidcare_token');
            const response = await fetch(API_BASE + '/payments/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    distance,
                    ambulanceType: selectedType,
                    couponCode: couponMsg.classList.contains('success') ? couponCode : null
                })
            });

            if (!response.ok) throw new Error('Calculation failed');
            const data = await response.json();

            // Update Summary
            const distanceRow = document.getElementById('distance-charge-row');
            if (distanceRow) {
                distanceRow.querySelector('.original').textContent = `₹${(distance * pricingConfig[selectedType].original).toLocaleString()}`;
                distanceRow.querySelector('.discounted').textContent = `₹${data.distanceCharge.toLocaleString()}`;
            }

            const savingsRow = document.getElementById('savings-row');
            if (savingsRow) {
                const originalTotal = distance * pricingConfig[selectedType].original;
                const totalSavings = originalTotal - data.distanceCharge + data.discount;
                savingsRow.querySelector('.save-amount').textContent = `Saved ₹${totalSavings.toLocaleString()}`;
            }

            // Fixed charges display (if they exist in UI)
            // Note: index.html might need placeholders for these if we want to show them dynamically
            
            if (totalAmountDisplay) {
                totalAmountDisplay.textContent = `₹${data.total.toLocaleString()}`;
            }
        } catch (err) {
            console.error('Fare calculation error:', err);
        }
    }


    ambulanceOptions.forEach(opt => opt.addEventListener('change', recalculatePricing));
    distanceInput.addEventListener('input', recalculatePricing);

    // --- Tab Switching Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active classes
            btn.classList.add('active');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });

    // --- Bank Logic ---
    function populateBankLists() {
        indianBanks.sort().forEach(bank => {
            // Populate Cards search list
            const cardItem = createBankItem(bank, cardBankSearch, cardBankList);
            cardBankList.appendChild(cardItem);
            
            // Populate Net Banking search list
            const netItem = createBankItem(bank, netBankSearch, netBankList);
            netBankList.appendChild(netItem);
        });

        // Popular banks grid
        popularBanks.forEach(bank => {
            const card = document.createElement('div');
            card.className = 'upi-card'; 
            card.innerHTML = `<img src="${bank.icon}" alt="${bank.name}" style="filter: none;"><span>${bank.name}</span>`;
            card.onclick = () => {
                const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
                if (activeTab === 'card') {
                    selectBank(bank.name, cardBankSearch, cardBankList);
                } else if (activeTab === 'netbanking') {
                    selectBank(bank.name, netBankSearch, netBankList);
                }
            };
            popularBanksGrid.appendChild(card);
        });
    }

    function createBankItem(bankName, input, list) {
        const item = document.createElement('div');
        item.className = 'bank-item';
        item.textContent = bankName;
        item.onclick = () => selectBank(bankName, input, list);
        return item;
    }

    function selectBank(bankName, input, list) {
        input.value = bankName;
        list.style.display = 'none';
    }

    const bankAcronyms = {
        "SBI": "State Bank of India",
        "HDFC": "HDFC Bank",
        "ICICI": "ICICI Bank",
        "PNB": "Punjab National Bank",
        "BOB": "Bank of Baroda",
        "KOTAK": "Kotak Mahindra Bank",
        "IDFC": "IDFC FIRST Bank",
    };

    function setupSearch(input, list) {
        if (!input || !list) return;
        
        input.addEventListener('focus', () => {
            list.style.display = 'block';
        });

        input.addEventListener('input', (e) => {
            const term = e.target.value.trim().toLowerCase();
            const items = list.querySelectorAll('.bank-item:not(.no-results)');
            let hasResults = false;
            
            items.forEach(item => {
                const bankName = item.textContent;
                const acronymMatch = Object.entries(bankAcronyms).some(([acr, full]) => 
                    acr.toLowerCase().includes(term) && full === bankName
                );

                if (bankName.toLowerCase().includes(term) || acronymMatch) {
                    item.style.display = 'block';
                    hasResults = true;
                } else {
                    item.style.display = 'none';
                }
            });

            // Show "Not Available" if no results
            const existingNoRes = list.querySelector('.no-results');
            if (!hasResults && term.length > 0) {
                list.style.display = 'block'; // Ensure list is visible
                if (!existingNoRes) {
                    const noRes = document.createElement('div');
                    noRes.className = 'bank-item no-results';
                    noRes.style.color = 'var(--accent-color)';
                    noRes.style.fontWeight = '600';
                    noRes.style.textAlign = 'center';
                    noRes.innerHTML = '<i data-lucide="alert-circle" style="width:16px; vertical-align:middle; margin-right:5px;"></i> Bank not available';
                    list.appendChild(noRes);
                    lucide.createIcons();
                }
            } else if (existingNoRes) {
                existingNoRes.remove();
            }
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !list.contains(e.target)) {
                list.style.display = 'none';
            }
        });
    }

    setupSearch(cardBankSearch, cardBankList);
    setupSearch(netBankSearch, netBankList);

    // --- Coupon Logic ---
    applyCouponBtn.addEventListener('click', () => {
        const code = couponInput.value.toUpperCase();
        if (code === 'RAPID20') {
            couponMsg.textContent = 'Coupon applied! 20% off';
            couponMsg.className = 'coupon-status success';
        } else if (code === 'FIRSTCARE') {
            couponMsg.textContent = 'Coupon applied! ₹100 off';
            couponMsg.className = 'coupon-status success';
        } else {
            couponMsg.textContent = 'Invalid coupon code';
            couponMsg.className = 'coupon-status error';
        }
        recalculatePricing();
    });

    // --- Payment Feedback ---
    document.querySelector('.pay-btn').addEventListener('click', async () => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        let method = activeTab.toUpperCase();
        
        const btn = document.querySelector('.pay-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Processing...';
        if (window.lucide) lucide.createIcons();
        
        try {
            const token = localStorage.getItem('rapidcare_token');
            const tripId = localStorage.getItem('rapidcare_last_trip_id');
            const amountText = totalAmountDisplay.textContent.replace('₹', '').replace(',', '');
            const amount = parseInt(amountText);

            if (!tripId) {
                alert('No active trip found to pay for.');
                btn.innerHTML = originalText;
                return;
            }

            const response = await fetch(API_BASE + '/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    trip_id: tripId,
                    amount: amount,
                    payment_method: method.toLowerCase(),
                    transaction_id: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
                })
            });

            if (response.ok) {
                alert(`Payment of ₹${amount} via ${method} was successful!`);
                localStorage.removeItem('rapidcare_last_trip_id'); // Clear after payment
                window.location.href = '/dashboard';
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Payment failed');
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert(`Payment failed: ${err.message}`);
            btn.innerHTML = originalText;
        }
    });

});
