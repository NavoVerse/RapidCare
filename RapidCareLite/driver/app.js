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

// Init
function checkAuth() {
    const token = localStorage.getItem('lite_driver_token');
    const user = JSON.parse(localStorage.getItem('lite_driver_user') || 'null');
    
    if (token && user && user.role === 'driver') {
        authView.classList.remove('active');
        mainView.classList.add('active');
        document.getElementById('user-name').textContent = user.name;
        
        // Reset view to idle
        showView('idle');
        initSocket(user.id);
        
        // Check if there's an active trip in local storage or fetch from API
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

// Check existing trip
async function checkActiveTrip(token) {
    try {
        const res = await fetch(`${API_BASE}/drivers/trips`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const trips = await res.json();
            const active = trips.find(t => !['completed', 'cancelled'].includes(t.status));
            
            if (active) {
                if (active.status === 'requested') {
                    currentTripId = active.id;
                    document.getElementById('req-patient-id').textContent = `User #${active.patient_id}`;
                    document.getElementById('req-dist').textContent = 'Location Locked';
                    showView('request');
                } else {
                    currentTripId = active.id;
                    document.getElementById('trip-id-display').textContent = `#${active.id}`;
                    showView('active');
                    updateStatusButtons(active.status);
                }
            }
        }
    } catch (err) {
        console.error('Failed to load trips', err);
    }
}

// Login
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

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('lite_driver_token');
    localStorage.removeItem('lite_driver_user');
    if(socket) socket.disconnect();
    checkAuth();
});

// Socket Integration
function initSocket(userId) {
    if (socket) socket.disconnect();
    socket = io(window.location.origin);
    
    socket.on('connect', () => {
        socket.emit('join', { userId, role: 'driver' });
    });
    
    // Simulate incoming trip for local testing (since backend only saves to DB right now and expects polling, 
    // or we might catch a socket emit if backend is modified. Let's poll or rely on initial fetch).
    // The backend does not currently emit 'trip:new' to the driver socket. 
    // It relies on polling or push notifications.
    // For Lite, we will poll every 5 seconds if idle.
    
    setInterval(() => {
        if (!idleState.classList.contains('hidden')) {
            checkActiveTrip(localStorage.getItem('lite_driver_token'));
        }
    }, 5000);
}

// Accept Trip
acceptBtn.addEventListener('click', async () => {
    if (!currentTripId) return;
    const token = localStorage.getItem('lite_driver_token');
    acceptBtn.textContent = 'Accepting...';
    
    try {
        const res = await fetch(`${API_BASE}/trips/${currentTripId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            document.getElementById('trip-id-display').textContent = `#${currentTripId}`;
            showView('active');
        } else {
            alert('Failed to accept trip.');
            showView('idle');
        }
    } catch (e) {
        alert('Network error');
    } finally {
        acceptBtn.textContent = 'ACCEPT';
    }
});

// Reject Trip
rejectBtn.addEventListener('click', async () => {
    if (!currentTripId) return;
    const token = localStorage.getItem('lite_driver_token');
    
    try {
        await fetch(`${API_BASE}/trips/${currentTripId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) {}
    
    currentTripId = null;
    showView('idle');
});

// Update Status
statusBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!currentTripId) return;
        
        const newStatus = btn.getAttribute('data-status');
        const token = localStorage.getItem('lite_driver_token');
        
        btn.textContent = 'Updating...';
        
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
            }
        } catch (e) {
            alert('Failed to update status');
        }
        
        // Reset text
        if (newStatus === 'arrived') btn.textContent = 'Arrived at Patient';
        if (newStatus === 'heading_to_hospital') btn.textContent = 'Heading to Hospital';
        if (newStatus === 'completed') btn.textContent = 'Trip Completed';
    });
});

function updateStatusButtons(currentStatus) {
    statusBtns.forEach(b => b.classList.remove('active'));
    
    let activeBtn = null;
    if (currentStatus === 'arrived') {
        activeBtn = document.querySelector('[data-status="arrived"]');
    } else if (currentStatus === 'heading_to_hospital' || currentStatus === 'at_hospital') {
        activeBtn = document.querySelector('[data-status="heading_to_hospital"]');
    } else if (currentStatus === 'completed') {
        activeBtn = document.querySelector('[data-status="completed"]');
    }
    
    if (activeBtn) activeBtn.classList.add('active');
}

checkAuth();
