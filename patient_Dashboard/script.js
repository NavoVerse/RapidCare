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
        sidebarToggle.addEventListener('click', () => {
            const nowCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', nowCollapsed);
            
            // Trigger a map resize if needed, since the container size changes
            if (typeof map !== 'undefined' && map.invalidateSize) {
                setTimeout(() => map.invalidateSize(), 300);
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
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Only prevent default for # links
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
            }
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

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
    const map = L.map('map').setView([22.5726, 88.3639], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let hospitals = [];
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
    async function initHospitals() {
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

        hospitals.forEach(h => {
            const statusColor = h.status === 'Available' ? '#15803d' : (h.status === 'Busy' ? '#dc2626' : '#eab308');
            const popupContent = `
                <div style="padding: 8px; min-width: 200px;">
                    <h3 style="margin: 0 0 6px 0; color: #14532d; font-size: 1rem;">${h.name}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 0.85rem;">Status: <strong style="color: ${statusColor}">${h.status}</strong></p>
                    <button onclick="window.bookAmbulance('${h.name.replace(/'/g, "\\'")}')" style="width: 100%; padding: 8px; background: #15803d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">🚑 Book RapidCare</button>
                </div>`;
            L.marker([h.lat, h.lng], { icon: hospitalIcon })
                .addTo(map)
                .bindPopup(popupContent);
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
    let distancePolyline = null;

    window.highlightDistance = function(lat, lng) {
        if (!userMarker) return;
        const userLatLng = userMarker.getLatLng();
        
        if (distancePolyline) map.removeLayer(distancePolyline);
        
        distancePolyline = L.polyline([userLatLng, [lat, lng]], {
            color: '#15803d',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10',
            lineJoin: 'round'
        }).addTo(map);
        
        map.fitBounds(distancePolyline.getBounds(), { padding: [50, 50] });
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
            if (map.invalidateSize) map.invalidateSize();
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
                map.setView([h.lat, h.lng], 15);
            });
            container.appendChild(item);
        });
    }

    // =============================================
    // USER LOCATION MANAGEMENT
    // =============================================
    function updateUserLocation(lat, lng) {
        if (userMarker) map.removeLayer(userMarker);
        
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map)
            .bindPopup('<b>Your Location</b>')
            .openPopup();
            
        map.setView([lat, lng], 13);
        renderHospitalsList(lat, lng);
    }

    async function detectAutoLocation() {
        const locationText = document.getElementById('userLocationText');
        const locationStatus = document.getElementById('locationStatus');
        try {
            if (window.LocationService) {
                const location = await window.LocationService.getCurrentLocation();
                
                if (locationText) locationText.textContent = location.address;

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

    console.log('RapidCare Dashboard Initialized');
});
