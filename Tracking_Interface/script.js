/* ===== RapidCare Tracking Interface — Script ===== */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Theme Toggle ───────────────────────────────
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('rapidcare_theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateThemeIcon(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-mode');
            localStorage.setItem('rapidcare_theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
            if (map) refreshMapTiles();
        });
    }

    function updateThemeIcon(isDark) {
        if (!themeToggle) return;
        themeToggle.innerHTML = isDark
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    }

    // ─── Sidebar Toggle ──────────────────────────────
    const sidebar     = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from immediately closing
            sidebar.classList.toggle('collapsed');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
                    sidebar.classList.remove('collapsed');
                }
            }
        });
    }

    // ─── Leaflet Map Setup ───────────────────────────
    let map = null;
    let ambulanceMarker = null;
    let routeLine = null;

    // Default coords: Kolkata area
    const patientCoords   = [22.5726, 88.3639]; // Central Kolkata
    const hospitalCoords  = [22.5165, 88.3958]; // Apollo Gleneagles approx
    const ambStartCoords  = [22.5520, 88.3740]; // Ambulance start (mid-route)

    function initMap() {
        const mapEl = document.getElementById('map');
        if (!mapEl || !window.L) return;

        map = L.map('map', {
            center: [22.5430, 88.3690],
            zoom: 13,
            zoomControl: false,  // we use custom controls
            attributionControl: true
        });

        // OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        // Custom: User Pin
        const userIcon = L.divIcon({
            className: '',
            html: `<div class="leaflet-user-pin">📍</div>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -24]
        });

        // Custom: Hospital Pin
        const hospitalIcon = L.divIcon({
            className: '',
            html: `<div class="leaflet-hospital-pin">🏥</div>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -24]
        });

        // Custom: Ambulance Pin
        const ambIcon = L.divIcon({
            className: '',
            html: `<div style="
                width:52px;height:52px;border-radius:50%;
                background:#fff;border:3px solid #22c55e;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 6px 20px rgba(0,0,0,0.22);
                font-size:26px;
            ">🚑</div>`,
            iconSize: [52, 52],
            iconAnchor: [26, 26]
        });

        // Add markers
        L.marker(patientCoords, { icon: userIcon })
            .addTo(map)
            .bindPopup('<b style="font-family:Inter,sans-serif;">Your Location</b><br>Patient Pickup Point');

        L.marker(hospitalCoords, { icon: hospitalIcon })
            .addTo(map)
            .bindPopup('<b style="font-family:Inter,sans-serif;">Apollo Gleneagles</b><br>Destination Hospital');

        ambulanceMarker = L.marker(ambStartCoords, { icon: ambIcon })
            .addTo(map)
            .bindPopup('<b style="font-family:Inter,sans-serif;">Matt Smith</b><br>ALS Ambulance · WB-04A<br><span style="color:#15803d;font-weight:600;">EN ROUTE</span>');

        // Dashed Route Line
        routeLine = L.polyline(
            [patientCoords, ambStartCoords, hospitalCoords],
            {
                color: '#15803d',
                weight: 4,
                opacity: 0.85,
                dashArray: '12, 10',
                lineJoin: 'round'
            }
        ).addTo(map);

        // Fit map to route
        map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });

        // Animate ambulance along route
        animateAmbulance();
    }

    // Ambulance animation along route
    function animateAmbulance() {
        if (!ambulanceMarker) return;

        const routePoints = [
            [22.5520, 88.3740],
            [22.5480, 88.3780],
            [22.5420, 88.3840],
            [22.5340, 88.3870],
            [22.5260, 88.3920],
            [22.5200, 88.3950],
            [22.5165, 88.3958]
        ];

        let idx = 0;

        const step = () => {
            if (idx >= routePoints.length) idx = 0;
            ambulanceMarker.setLatLng(routePoints[idx]);
            idx++;
            setTimeout(step, 1800);
        };

        step();
    }

    function refreshMapTiles() {
        // Trigger re-render for dark mode filter update
        setTimeout(() => { if (map) map.invalidateSize(); }, 100);
    }

    // Init map after small delay to allow DOM fully render
    setTimeout(initMap, 200);

    // ─── ETA countdown (cosmetic) ────────────────────
    let etaSeconds = 12 * 60; // 12 minutes in seconds
    const etaFill = document.getElementById('etaFill');

    function formatETA(seconds) {
        const m = Math.floor(seconds / 60);
        return m;
    }

    // ─── Mobile Bottom Sheet ─────────────────────────
    const bottomSheet  = document.getElementById('bottomSheet');
    const backdrop     = document.getElementById('sheetBackdrop');
    const sheetHandle  = document.getElementById('sheetHandle');

    function isMobile() { return window.innerWidth <= 768; }

    function openSheet() {
        if (bottomSheet) bottomSheet.classList.add('open');
        if (backdrop)    backdrop.style.display = 'block';
    }

    function closeSheet() {
        if (bottomSheet) bottomSheet.classList.remove('open');
        if (backdrop)    backdrop.style.display = 'none';
    }

    // Auto-open bottom sheet on mobile load
    if (isMobile()) {
        setTimeout(openSheet, 600);
    }

    if (backdrop) backdrop.addEventListener('click', closeSheet);

    // Drag to dismiss (simple touch)
    if (sheetHandle) {
        let startY = 0;
        sheetHandle.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
        sheetHandle.addEventListener('touchend', e => {
            const endY = e.changedTouches[0].clientY;
            if (endY - startY > 60) closeSheet();
        });
    }

    window.addEventListener('resize', () => {
        if (isMobile()) openSheet();
        else closeSheet();
        if (map) map.invalidateSize();
    });

    // ─── Emergency Help Button ───────────────────────
    const emergencyHelpBtn = document.getElementById('emergencyHelpBtn');
    if (emergencyHelpBtn) {
        emergencyHelpBtn.addEventListener('click', () => {
            window.location.href = '../payment_user/login_urgency/index.html';
        });
    }

    // ─── Map custom control buttons ──────────────────
    const ctrlBtns = document.querySelectorAll('.map-ctrl-btn');
    ctrlBtns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            if (!map) return;
            if (i === 0) map.zoomIn();
            else if (i === 1) map.zoomOut();
            else map.setView([22.5430, 88.3690], 13);
        });
    });

    // ─── Live ETA fill animation refresh ────────────
    const fillEl = document.getElementById('etaFill');
    if (fillEl) {
        // already animates via CSS, just ensure it starts at right width
        fillEl.style.width = '62%';
    }

});

// ─── Global action handlers ───────────────────────
function handleCall() {
    alert('📞 Calling Matt Smith (ALS Ambulance Driver)…\n\nIn a real app this would initiate a VoIP call.');
}

function handleMessage() {
    alert('💬 Opening chat with Matt Smith…\n\nIn a real app this would open a SMS/in-app chat.');
}
