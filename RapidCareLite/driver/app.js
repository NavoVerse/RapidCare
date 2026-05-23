const API_BASE = window.location.origin + '/api/v1';
let socket;
let currentTripId = null;

// DOM Elements
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const idleState = document.getElementById('idle-state');
const requestCard = document.getElementById('request-card');
const activeTripCard = document.getElementById('active-trip-card');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('auth-error');

const acceptBtn = document.getElementById('accept-btn');
const rejectBtn = document.getElementById('reject-btn');
const statusBtns = document.querySelectorAll('.status-btn');

// ─── Init ─────────────────────────────────────────────────────────────────────
function checkAuth() {
    const token = localStorage.getItem('lite_driver_token');
    const user = JSON.parse(localStorage.getItem('lite_driver_user') || 'null');

    if (token && user && user.role === 'driver') {
        authView.classList.remove('active');
        mainView.classList.add('active');
        document.getElementById('user-name').textContent = user.name;

        showView('idle');
        initSocket(user.id);
        checkActiveTrip(token);
    } else {
        authView.classList.add('active');
        mainView.classList.remove('active');
    }
}

function showView(viewName) {
    idleState.classList.add('hidden');
    requestCard.classList.add('hidden');
    activeTripCard.classList.add('hidden');

    if (viewName === 'idle') idleState.classList.remove('hidden');
    if (viewName === 'request') requestCard.classList.remove('hidden');
    if (viewName === 'active') activeTripCard.classList.remove('hidden');
}

// ─── Check Existing Active Trip (on page load / refresh) ─────────────────────
async function checkActiveTrip(token) {
    try {
        const res = await fetch(`${API_BASE}/drivers/trips`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const trips = await res.json();
        const pendingTrip = trips.find(t => t.status === 'requested');
        const activeTrip = trips.find(t => !['completed', 'cancelled', 'requested'].includes(t.status));

        if (pendingTrip) {
            // If there's already a pending request (e.g. after page refresh), show it
            showIncomingRequest(pendingTrip);
        } else if (activeTrip) {
            currentTripId = activeTrip.id;
            document.getElementById('trip-id-display').textContent = `#${activeTrip.id}`;
            showView('active');
            updateStatusButtons(activeTrip.status);
        }
    } catch (err) {
        console.error('Failed to load trips', err);
    }
}

// ─── Show Incoming Request Card ────────────────────────────────────────────────
function showIncomingRequest(data) {
    currentTripId = data.trip_id || data.id;

    // Build distance display
    const dist = data.distance_km != null
        ? `${data.distance_km.toFixed(1)} km`
        : 'Location Locked';

    const triageBadge = data.triage_level
        ? ` · <span class="triage-${data.triage_level.toLowerCase()}">${data.triage_level}</span>`
        : '';

    document.getElementById('req-dist').innerHTML = dist + triageBadge;
    document.getElementById('req-patient-id').textContent =
        data.patient_name || `Patient #${data.patient_id}`;
    document.getElementById('req-hospital').textContent =
        data.hospital_name || 'Hospital';
    document.getElementById('req-complaint').textContent =
        data.complaint || 'Emergency';

    showView('request');
}

// ─── Login ─────────────────────────────────────────────────────────────────────
loginBtn.addEventListener('click', async () => {
    loginBtn.textContent = 'Authenticating...';
    errorMsg.classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value,
                expectedRole: 'driver'
            })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('lite_driver_token', data.token);
            localStorage.setItem('lite_driver_user', JSON.stringify(data.user));
            checkAuth();
        } else {
            errorMsg.textContent = data.error || 'Login failed';
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        errorMsg.textContent = 'Network error';
        errorMsg.classList.remove('hidden');
    } finally {
        loginBtn.textContent = 'Go Online';
    }
});

// ─── Logout ────────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('lite_driver_token');
    localStorage.removeItem('lite_driver_user');
    if (socket) socket.disconnect();
    checkAuth();
});

// ─── Socket.io: Real-time Trip Dispatch ───────────────────────────────────────
function initSocket(userId) {
    if (socket) socket.disconnect();
    socket = io(window.location.origin, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        // Join the driver-specific room so the backend can push directly to this driver
        socket.emit('join', { userId, role: 'driver' });
    });

    // ✅ Backend emits this when a patient books → backend assigns nearest driver → pushes here
    socket.on('trip:new_request', (data) => {
        console.log('[Socket] New trip request received:', data);
        // Only show if not already handling a trip
        if (!currentTripId || currentTripId === null) {
            showIncomingRequest(data);
        }
    });

    // Backend emits this if the trip times out (no accept in 60s)
    socket.on('trip:cancelled', (data) => {
        if (data.trip_id == currentTripId) {
            alert('⏱ Trip request timed out. Back to standby.');
            currentTripId = null;
            showView('idle');
        }
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
    });
}

// ─── Accept Trip ───────────────────────────────────────────────────────────────
acceptBtn.addEventListener('click', async () => {
    if (!currentTripId) return;
    const token = localStorage.getItem('lite_driver_token');
    acceptBtn.textContent = 'Accepting...';
    acceptBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/trips/${currentTripId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            document.getElementById('trip-id-display').textContent = `#${currentTripId}`;
            showView('active');
        } else {
            const d = await res.json();
            alert(d.error || 'Failed to accept trip.');
            currentTripId = null;
            showView('idle');
        }
    } catch (e) {
        alert('Network error');
    } finally {
        acceptBtn.textContent = 'ACCEPT';
        acceptBtn.disabled = false;
    }
});

// ─── Reject Trip ───────────────────────────────────────────────────────────────
rejectBtn.addEventListener('click', async () => {
    if (!currentTripId) return;
    const token = localStorage.getItem('lite_driver_token');
    rejectBtn.disabled = true;

    try {
        await fetch(`${API_BASE}/trips/${currentTripId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) {
        console.error('Reject failed silently');
    } finally {
        currentTripId = null;
        rejectBtn.disabled = false;
        showView('idle');
    }
});

// ─── Update Trip Status ────────────────────────────────────────────────────────
statusBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!currentTripId) return;

        const newStatus = btn.getAttribute('data-status');
        const token = localStorage.getItem('lite_driver_token');

        btn.textContent = 'Updating...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/trips/${currentTripId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                updateStatusButtons(newStatus);
                if (newStatus === 'completed') {
                    setTimeout(() => {
                        currentTripId = null;
                        showView('idle');
                    }, 2000);
                }
            } else {
                alert('Failed to update status. Please try again.');
            }
        } catch (e) {
            alert('Network error updating status.');
        } finally {
            // Restore button text
            const labels = {
                'arrived': 'Arrived at Patient',
                'heading_to_hospital': 'Heading to Hospital',
                'completed': 'Trip Completed ✓'
            };
            btn.textContent = labels[newStatus] || newStatus;
            btn.disabled = false;
        }
    });
});

function updateStatusButtons(currentStatus) {
    statusBtns.forEach(b => b.classList.remove('active'));
    const statusMap = {
        'accepted': null,
        'arrived': '[data-status="arrived"]',
        'heading_to_hospital': '[data-status="heading_to_hospital"]',
        'at_hospital': '[data-status="heading_to_hospital"]',
        'completed': '[data-status="completed"]'
    };
    const selector = statusMap[currentStatus];
    if (selector) {
        const btn = document.querySelector(selector);
        if (btn) btn.classList.add('active');
    }
}

checkAuth();
