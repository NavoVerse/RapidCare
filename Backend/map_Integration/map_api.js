/**
 * RapidCare Map & Hospital API Service
 * Browser-compatible service for fetching hospital data and routing information.
 */

const MapAPI = {
    // Shared hospital data source
    async getHospitals() {
        try {
            // In a real environment, this path would be relative to the index.html or an absolute URL
            // Since we are running in a file system, we'll try to fetch the local JSON
            const response = await fetch('../Backend/map_Integration/hospital_locations.json?v=' + Date.now());
            if (!response.ok) throw new Error("Could not fetch hospital data");
            return await response.json();
        } catch (error) {
            console.warn("Using fallback local hospital data due to fetch error:", error);
            // Fallback to minimal baked-in data if fetch fails (e.g. file protocol issues)
            return [
                { name: "AMRI Hospital, Dhakuria", lat: 22.5135, lng: 88.3629, status: "Available" },
                { name: "Apollo Gleneagles Hospitals", lat: 22.5710, lng: 88.4055, status: "Limited" },
                { name: "Fortis Hospital, Anandapur", lat: 22.5165, lng: 88.4042, status: "Available" },
                { name: "Medica Superspecialty Hospital", lat: 22.4939, lng: 88.3980, status: "Busy" }
            ];
        }
    },

    /**
     * Calculates the estimated arrival time based on distance (Mock logic)
     */
    calculateETA(distanceInKm) {
        const speedKmh = 30; // Average ambulance speed in city traffic
        const timeHours = distanceInKm / speedKmh;
        const timeMinutes = Math.round(timeHours * 60 + 5); // +5 min base preparation
        return `${timeMinutes} min`;
    }
};

if (typeof window !== 'undefined') {
    window.MapAPI = MapAPI;
}
