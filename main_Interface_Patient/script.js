document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme
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
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Search bar pulse effect on focus
    const searchInput = document.querySelector('.search-bar input');
    const searchBar = document.querySelector('.search-bar');
    
    searchInput.addEventListener('focus', () => {
        searchBar.style.boxShadow = '0 0 0 2px rgba(21, 128, 61, 0.2)';
        searchBar.style.backgroundColor = '#ffffff';
    });
    
    searchInput.addEventListener('blur', () => {
        searchBar.style.boxShadow = 'none';
        searchBar.style.backgroundColor = 'var(--white)';
    });



    // Map Initialization
    const map = L.map('map').setView([22.5726, 88.3639], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Mock Hospital Data (Simulated from Backend/map_Integration/hospital_locations.json)
    const hospitals = [
        { name: "AMRI Hospital, Dhakuria", lat: 22.5135, lng: 88.3629, status: "Available" },
        { name: "Apollo Gleneagles Hospitals", lat: 22.5710, lng: 88.4055, status: "Limited" },
        { name: "Fortis Hospital, Anandapur", lat: 22.5165, lng: 88.4042, status: "Available" },
        { name: "Medica Superspecialty Hospital", lat: 22.4939, lng: 88.3980, status: "Busy" },
        { name: "NRS Medical College and Hospital", lat: 22.5645, lng: 88.3685, status: "Available" },
        { name: "Peerless Hospital", lat: 22.4770, lng: 88.3900, status: "Available" },
        { name: "SSKM Hospital", lat: 22.5392, lng: 88.3444, status: "Busy" }
    ];

    // Custom Icon for Hospitals
    const hospitalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid #dc2626;"><svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626"><path d="M19 10h-5V5c0-1.1-.9-2-2-2s-2 .9-2 2v5H5c-1.1 0-2 .9-2 2s.9 2 2 2h5v5c0 1.1.9 2 2 2s2-.9 2-2v-5h5c1.1 0 2-.9 2-2s-.9-2-2-2z"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    // Add markers
    hospitals.forEach(h => {
        L.marker([h.lat, h.lng], { icon: hospitalIcon })
            .addTo(map)
            .bindPopup(`<b>${h.name}</b><br>Status: ${h.status}`);
    });

    let userMarker = null;

    function renderHospitalsList(userLat, userLng) {
        const container = document.getElementById('hospitalListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Calculate distances using Leaflet's built-in distanceTo method
        const hospitalsWithDistance = hospitals.map(h => {
            const userLatLng = L.latLng(userLat, userLng);
            const hospitalLatLng = L.latLng(h.lat, h.lng);
            const distanceInMeters = userLatLng.distanceTo(hospitalLatLng);
            const distanceInKm = (distanceInMeters / 1000).toFixed(1);
            return { ...h, distance: distanceInKm };
        });

        // Sort by distance
        hospitalsWithDistance.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        hospitalsWithDistance.forEach(h => {
            const item = document.createElement('div');
            item.className = 'hospital-item';
            
            const statusClass = h.status.toLowerCase();
            
            item.innerHTML = \`
                <div class="hospital-info">
                    <span class="h-name">\${h.name}</span>
                    <span class="h-distance">\${h.distance} km away</span>
                </div>
                <span class="h-status \${statusClass}">\${h.status}</span>
            \`;
            container.appendChild(item);
        });
    }

    function updateUserLocation(lat, lng) {
        if (userMarker) {
            map.removeLayer(userMarker);
        }
        
        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('<b>Your Location</b>')
            .openPopup();
            
        map.setView([lat, lng], 12);
        
        renderHospitalsList(lat, lng);
        
        // Update location text in stats
        const locationStat = document.querySelector('.stat-card .value');
        if (locationStat && locationStat.textContent === 'Berlin, DE') {
            locationStat.textContent = 'Kolkata, IN'; // Can be reverse geocoded if needed
        }
    }

    // Try to get actual location
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                updateUserLocation(lat, lng);
            },
            (error) => {
                console.log("Geolocation error or denied. Using default Kolkata location.", error);
                // Default to Park Street area if denied
                updateUserLocation(22.5535, 88.3514);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        console.log("Geolocation not available. Using default Kolkata location.");
        updateUserLocation(22.5535, 88.3514);
    }

    console.log('RapidCare Dashboard and Map Initialized');
});
