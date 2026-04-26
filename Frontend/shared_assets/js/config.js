/**
 * RapidCare Shared Frontend Configuration
 */
const CONFIG = {
    API_BASE: window.location.origin + '/api/v1',
    SOCKET_URL: window.location.origin
};

// If running locally as file://, fallback to localhost:5000
if (window.location.protocol === 'file:') {
    CONFIG.API_BASE = 'http://localhost:5000/api/v1';
    CONFIG.SOCKET_URL = 'http://localhost:5000';
}

window.RapidCareConfig = CONFIG;
