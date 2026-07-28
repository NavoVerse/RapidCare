/**
 * RapidCare Shared Frontend Configuration
 */
const CONFIG = {
    API_BASE: 'https://rapidcare-backend-mcg2.onrender.com/api/v1',
    SOCKET_URL: 'https://rapidcare-backend-mcg2.onrender.com'
};

// If running locally (localhost, file system, or no hostname), point to backend on port 5000
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:' ||
    !window.location.hostname) {
    CONFIG.API_BASE = 'http://localhost:5000/api/v1';
    CONFIG.SOCKET_URL = 'http://localhost:5000';
}

window.RapidCareConfig = CONFIG;
