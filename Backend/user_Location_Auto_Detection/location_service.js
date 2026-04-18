/**
 * RapidCare User Location Detection Service
 * Uses browser Geolocation API and OpenStreetMap Nominatim for Reverse Geocoding
 */

const LocationService = {
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const address = await this.reverseGeocode(latitude, longitude);
                        resolve({
                            lat: latitude,
                            lng: longitude,
                            address: address
                        });
                    } catch (error) {
                        // Fallback to coordinates if geocoding fails
                        resolve({
                            lat: latitude,
                            lng: longitude,
                            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                        });
                    }
                },
                (error) => {
                    reject(this.handleError(error));
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    },

    async reverseGeocode(lat, lng) {
        try {
            // Using OpenStreetMap Nominatim API (Free, no key required for low volume)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
            const data = await response.json();
            
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown";
                const country = data.address.country_code ? data.address.country_code.toUpperCase() : "Unknown";
                return `${city}, ${country}`;
            }
            return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        } catch (error) {
            console.error("Geocoding failed:", error);
            throw error;
        }
    },

    handleError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return new Error("User denied the request for Geolocation.");
            case error.POSITION_UNAVAILABLE:
                return new Error("Location information is unavailable.");
            case error.TIMEOUT:
                return new Error("The request to get user location timed out.");
            default:
                return new Error("An unknown error occurred.");
        }
    }
};

// If using in browser directly without modules
if (typeof window !== 'undefined') {
    window.LocationService = LocationService;
}
