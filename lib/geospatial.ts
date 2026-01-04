export const LAB_COORDS = { lat: 21.9015, lng: 77.8961 };

/**
 * Calculates straight-line distance (displacement) using Haversine formula.
 * @returns Distance in Kilometers
 */
export const getDisplacement = (userLat: number, userLng: number): number => {
    const R = 6371; // Earth radius in KM
    const dLat = (userLat - LAB_COORDS.lat) * (Math.PI / 180);
    const dLng = (userLng - LAB_COORDS.lng) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(LAB_COORDS.lat * (Math.PI / 180)) * Math.cos(userLat * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Calculates driving distance using OSRM public API.
 * Falls back to Haversine displacement if API fails.
 * @returns Distance in Kilometers
 */
export const getRoadDistance = async (userLat: number, userLng: number): Promise<number> => {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${LAB_COORDS.lng},${LAB_COORDS.lat}?overview=false`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('OSRM API Error');

        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
            return data.routes[0].distance / 1000; // Convert meters to KM
        }

        throw new Error('No routes found');
    } catch (error) {
        console.error('OSRM Failed, falling back to displacement:', error);
        return getDisplacement(userLat, userLng);
    }
};
