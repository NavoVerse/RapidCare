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
    const map = L.map('map').setView([52.5200, 13.4050], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Mock Hospital Data (Simulated from Backend/map_Integration/hospital_locations.json)
    const hospitals = [
        { name: "City General Hospital", lat: 52.5200, lng: 13.4050, status: "Available" },
        { name: "St. Mary's Medical Center", lat: 52.5300, lng: 13.3900, status: "Limited" },
        { name: "Metro Health Institute", lat: 52.5100, lng: 13.4200, status: "Available" },
        { name: "Sunshine Pediatric Care", lat: 52.5400, lng: 13.4100, status: "Available" },
        { name: "Hope Emergency Clinic", lat: 52.5000, lng: 13.3800, status: "Busy" }
    ];

    // Custom Icon for Hospitals
    const hospitalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: var(--primary-green); width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    // Add markers
    hospitals.forEach(h => {
        L.marker([h.lat, h.lng], { icon: hospitalIcon })
            .addTo(map)
            .bindPopup(`<b>${h.name}</b><br>Status: ${h.status}`);
    });

    // Add User/Ambulance Location
    L.marker([52.5150, 13.4000]).addTo(map)
        .bindPopup('<b>Current Location</b>')
        .openPopup();

    console.log('RapidCare Dashboard and Map Initialized');
});
