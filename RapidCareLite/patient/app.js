const API_BASE = window.location.origin + '/api/v1';
let socket;
let currentLat = 22.5726; // Default to Kolkata
let currentLng = 88.3639;

// DOM Elements
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const statusCard = document.getElementById('status-card');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const sosBtn = document.getElementById('sos-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('auth-error');

// Init
function checkAuth() {
    const token = localStorage.getItem('lite_token');
    const user = JSON.parse(localStorage.getItem('lite_user') || 'null');
    
    if (token && user && user.role === 'patient') {
        authView.classList.remove('active');
        mainView.classList.add('active');
        document.getElementById('user-name').textContent = user.name;
        initSocket(user.id);
        getLocation();
        loadHospitals();
    } else {
        authView.classList.add('active');
        mainView.classList.remove('active');
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
                expectedRole: 'patient'
            })
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('lite_token', data.token);
            localStorage.setItem('lite_user', JSON.stringify(data.user));
            checkAuth();
        } else {
            errorMsg.textContent = data.error || 'Login failed';
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        errorMsg.textContent = 'Network error';
        errorMsg.classList.remove('hidden');
    } finally {
        loginBtn.textContent = 'Login & Access';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('lite_token');
    localStorage.removeItem('lite_user');
    if(socket) socket.disconnect();
    checkAuth();
});

// Get Location
function getLocation() {
    const locText = document.querySelector('.loc-text');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                currentLat = pos.coords.latitude;
                currentLng = pos.coords.longitude;
                locText.textContent = `📍 Locked: ${currentLat.toFixed(3)}, ${currentLng.toFixed(3)}`;
            },
            () => { locText.textContent = "📍 Using default location"; }
        );
    }
}

// Load Hospitals
async function loadHospitals() {
    try {
        const res = await fetch(`${API_BASE}/hospitals`);
        if (res.ok) {
            const hospitals = await res.json();
            const select = document.getElementById('hospital-select');
            if (hospitals.length > 0) {
                select.innerHTML = hospitals.map(h => `<option value="${h.user_id}">${h.name}</option>`).join('');
            }
        }
    } catch (err) {
        console.warn('Could not load hospitals, using default.');
    }
}

// Book Ambulance
sosBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('lite_token');
    const hospitalId = document.getElementById('hospital-select').value;
    
    sosBtn.disabled = true;
    sosBtn.querySelector('span').textContent = 'REQUESTING...';
    
    try {
        const res = await fetch(`${API_BASE}/trips/request`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                pickup_lat: currentLat,
                pickup_lng: currentLng,
                hospital_id: hospitalId
            })
        });
        
        const data = await res.json();
        if (res.ok || res.status === 201) {
            statusCard.classList.remove('hidden');
            document.getElementById('trip-status').textContent = 'Request Sent!';
            document.getElementById('trip-details').textContent = 'Waiting for driver...';
        } else {
            alert(data.error || 'Failed to dispatch');
        }
    } catch (err) {
        alert('Network error during dispatch');
    } finally {
        sosBtn.disabled = false;
        sosBtn.querySelector('span').textContent = 'SOS / BOOK AMBULANCE';
    }
});

// Socket Integration
function initSocket(userId) {
    if (socket) socket.disconnect();
    socket = io(window.location.origin);
    
    socket.on('connect', () => {
        socket.emit('join', { userId, role: 'patient' });
    });
    
    socket.on('trip:accepted', (data) => {
        statusCard.classList.remove('hidden');
        document.getElementById('trip-status').textContent = 'Ambulance En Route!';
        document.getElementById('trip-details').textContent = `Driver ID: ${data.driver_id} has accepted your request.`;
        document.querySelector('.status-indicator').style.animation = 'pulse 1s infinite';
    });
}

checkAuth();
