/**
 * RapidCare Shared Frontend Configuration
 */
const CONFIG = {
    API_BASE: window.location.origin + '/api/v1',
    SOCKET_URL: window.location.origin
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
