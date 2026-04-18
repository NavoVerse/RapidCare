// Simulating a Map API for RapidCare
const hospitalLocations = require('./hospital_locations.json');

/**
 * Get all available hospitals with their coordinates
 * @returns {Array} List of hospital objects
 */
function getHospitals() {
    return hospitalLocations;
}

/**
 * Get user's current location (mocked)
 * @returns {Object} lat/lng object
 */
function getCurrentUserLocation() {
    return { lat: 52.5200, lng: 13.4050 };
}

module.exports = {
    getHospitals,
    getCurrentUserLocation
};
