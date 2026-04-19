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

    // --- Insurance View Logic ---
    const iModal = document.getElementById('add-scheme-modal');
    const iForm = document.getElementById('add-scheme-form');
    const iTypeInput = document.getElementById('scheme-type');
    let iCurrentContainer = null;
    let iCurrentPill = null;
    let iCurrentAccordion = null;

    if (iModal && iForm) {
        // We hook for all plans
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
            
            iModal.classList.add('active');
        }

        const iCloseBtn = iModal.querySelector('.close-modal-btn');
        if (iCloseBtn) {
            iCloseBtn.addEventListener('click', () => {
                iModal.classList.remove('active');
                iForm.reset();
            });
        }

        iModal.addEventListener('click', (e) => {
            if (e.target === iModal) {
                iModal.classList.remove('active');
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
            iForm.reset();
        });
    }

    const iAccordions = document.querySelectorAll('.accordion-header-insurance');

    iAccordions.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            
            item.classList.toggle('active');

            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
            
            setTimeout(() => {
                if (item.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }, 300);
        });
    });

    window.addEventListener('resize', () => {
        document.querySelectorAll('.accordion-item-insurance.active .accordion-content-insurance').forEach(content => {
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });

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
