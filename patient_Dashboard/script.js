document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateToggleIcon(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateToggleIcon(isDark);
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

    function updateToggleIcon(isDark) {
        if (!themeToggle) return;
        themeToggle.innerHTML = isDark 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }

    // Nav menu interaction
    const navItems = document.querySelectorAll('.nav-item');
    const dashboardView = document.getElementById('dashboard-view');
    const detailsView = document.getElementById('details-view');
    const trackingView = document.getElementById('tracking-view');
    const insuranceView = document.getElementById('insurance-view');
    const analyticsView = document.getElementById('analytics-view');
    const historyView = document.getElementById('history-view');
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
            paymentsView.style.display = 'none';

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
            } else if (label === 'Payment History') {
                paymentsView.style.display = 'block';
            } else {
                dashboardView.style.display = 'block';
            }
        });
    });

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

    // Search bar focus effect
    const searchBarInput = document.querySelector('.search-bar input');
    const searchBarEl = document.querySelector('.search-bar');
    
    if (searchBarInput && searchBarEl) {
        searchBarInput.addEventListener('focus', () => {
            searchBarEl.style.boxShadow = '0 0 0 2px rgba(21, 128, 61, 0.2)';
        });
        searchBarInput.addEventListener('blur', () => {
            searchBarEl.style.boxShadow = 'none';
        });
    }

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
                animateAmbulance(coords);
            }
        } catch (err) {
            console.error("Tracking Routing failed", err);
        }
    }

    function animateAmbulance(routePoints) {
        if (!ambulanceMarker || !routePoints || routePoints.length === 0) return;
        let idx = 0;
        const totalPoints = routePoints.length;
        const stepTime = Math.max(50, 15000 / totalPoints); 
        const step = () => {
            if (idx >= totalPoints) idx = 0;
            ambulanceMarker.setLatLng(routePoints[idx]);
            idx++;
            setTimeout(step, stepTime);
        };
        step();
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
                    <button onclick="window.bookAmbulance('${h.name.replace(/'/g, "\\'")}')" style="width: 100%; padding: 8px; background: #15803d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">🚑 Book RapidCare</button>
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
    window.bookAmbulance = function(hospitalName) {
        const otpValue = Math.floor(1000 + Math.random() * 9000);
        alert(`🚑 AMBULANCE DISPATCHED!\n\nDestination: ${hospitalName}\nYour OTP: ${otpValue}\nPlease share this with the driver upon arrival.`);
        
        const otpStat = document.querySelectorAll('.stat-card .value')[2];
        if (otpStat) {
            otpStat.textContent = otpValue;
            otpStat.style.color = 'var(--primary-green)';
            otpStat.style.fontWeight = '700';
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

                    <button onclick="window.bookAmbulance('${h.name.replace(/'/g, "\\'")}')" style="width: 100%; padding: 16px; background: var(--primary-green); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem;">
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
                        <button class="book-btn uni-btn" onclick="event.stopPropagation(); window.bookAmbulance('${h.name.replace(/'/g, "\\'")}')">🚑 Book Now</button>
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
            { label: 'Location', id: 'edit-loc', target: 'displayProfileLocation', prefix: '📍 ' },
            { label: 'Job Title', id: 'edit-job', target: 'displayProfileJob', prefix: '💼 ' },
            { label: 'Birth Date', id: 'edit-birth', target: 'displayProfileBirth', prefix: '🎂 ' }
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
        { id: 'editMedicalHistory', title: 'Edit Medical History', fields: [] },
        { id: 'editMedicationsList', title: 'Edit Medications', fields: [] },
        { id: 'editMedicationsListTab', title: 'Edit Medications', fields: [] },
        { id: 'editDietNotes', title: 'Edit Diet & Notes', fields: [] }
    ];

    let activeEditConfig = null;

    editButtons.forEach(btnConfig => {
        const btn = document.getElementById(btnConfig.id);
        if (btn) {
            btn.addEventListener('click', () => {
                activeEditConfig = btnConfig;
                editModalTitle.textContent = btnConfig.title;
                
                editFields.innerHTML = btnConfig.fields.map(f => {
                    let currentVal = '';
                    if (f.target) {
                        const targetEl = document.getElementById(f.target);
                        currentVal = targetEl ? targetEl.textContent.replace(f.prefix, '') : '';
                    }
                    
                    return `
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">${f.label}</label>
                            <input type="text" id="${f.id}" value="${currentVal}" placeholder="Enter ${f.label}..." style="width:100%; padding:10px; border:1px solid var(--border); border-radius:8px;">
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

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (activeEditConfig && activeEditConfig.fields) {
                activeEditConfig.fields.forEach(f => {
                    const input = document.getElementById(f.id);
                    if (input && f.target) {
                        const targetEl = document.getElementById(f.target);
                        if (targetEl) {
                            targetEl.textContent = f.prefix + input.value;
                        }
                    }
                });
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
        confirmPayBtn.addEventListener('click', () => {
            const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
            if (selectedMethod === 'cash') {
                if (isCashRewardActivePayment) {
                    cashRideCountPayment = 0;
                    isCashRewardActivePayment = false;
                } else {
                    cashRideCountPayment++;
                }
                localStorage.setItem('rapidcare_cash_rides', cashRideCountPayment.toString());
            }

            alert('PAYMENT SUCCESSFUL!\n\nThank you for choosing RapidCare.\nYour bill is settled.');
            updateCashRewardUIPayment();
            updateTotalPayment();
            // Return to dashboard overview
            document.querySelector('.nav-item[data-view="overview"]')?.click();
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
const medicalRecords = [
    {
        id: 1,
        date: "2024-03-15",
        type: "cardiology",
        title: "Heart Rhythm Consultation",
        doctor: "Dr. Sarah Mitchell",
        hospital: "City General Hospital",
        status: "completed",
        vitals: { bp: "120/80", hr: "72 bpm", temp: "98.6 F", weight: "75 kg" },
        diagnosis: "Normal Sinus Rhythm, mild tachycardia during exercise.",
        prescriptions: [
            { name: "Metoprolol", dosage: "25mg", frequency: "Once daily", purpose: "Heart rate control" },
            { name: "Aspirin", dosage: "81mg", frequency: "Once daily", purpose: "Blood thinner" }
        ],
        notes: "Patient reported occasional palpitations. EKG showed no significant abnormalities. Recommended maintaining current exercise routine but monitoring heart rate."
    },
    {
        id: 2,
        date: "2024-02-10",
        type: "general",
        title: "Annual Physical Examination",
        doctor: "Dr. Robert Wilson",
        hospital: "RapidCare Clinic",
        status: "completed",
        vitals: { bp: "118/75", hr: "68 bpm", temp: "98.4 F", weight: "76 kg" },
        diagnosis: "Healthy adult, all vitals within normal range.",
        prescriptions: [
            { name: "Vitamin D3", dosage: "2000 IU", frequency: "Once daily", purpose: "Supplements" }
        ],
        notes: "Overall health is excellent. Blood work looks good. Slight deficiency in Vitamin D, hence the supplement."
    },
    {
        id: 3,
        date: "2024-01-22",
        type: "lab",
        title: "Comprehensive Metabolic Panel",
        doctor: "Lab Services",
        hospital: "Diagnostic Labs Inc.",
        status: "completed",
        vitals: null,
        diagnosis: "Lab results within reference ranges.",
        prescriptions: [],
        notes: "Glucose levels: 92 mg/dL. Cholesterol: 185 mg/dL. Kidney function tests (BUN/Creatinine) are normal."
    },
    {
        id: 4,
        date: "2023-12-05",
        type: "cardiology",
        title: "Follow-up Echo-cardiogram",
        doctor: "Dr. Sarah Mitchell",
        hospital: "City General Hospital",
        status: "completed",
        vitals: { bp: "122/82", hr: "75 bpm", temp: "98.2 F", weight: "77 kg" },
        diagnosis: "Normal cardiac structure and function.",
        prescriptions: [],
        notes: "Echo shows no signs of valve disease or cardiomyopathy. Next follow-up in 12 months."
    }
];

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
    renderHistory();
    setupEventListeners();
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
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.remove('active');
    document.getElementById('booking-form').reset();
}

function handleBookingSubmit(event) {
    event.preventDefault();
    
    const newBooking = {
        id: Date.now(),
        doctor: document.getElementById('book-doctor').value,
        specialty: document.getElementById('book-specialty').value,
        date: document.getElementById('book-date').value,
        time: document.getElementById('book-time').value,
        hospital: document.getElementById('book-hospital').value,
        type: document.getElementById('book-type').value
    };

    doctorBookings.unshift(newBooking); // Add to beginning of list
    closeBookingModal();
    
    // Re-render the detail pane if a record is still selected
    if (selectedRecordId) {
        selectRecord(selectedRecordId);
    }
    
    // Optional: Show success feedback
    console.log('Booking confirmed:', newBooking);
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
});
