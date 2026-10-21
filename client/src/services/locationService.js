// Location service for detecting user's state and calculating mandi distances

// Coordinate centroids for major agricultural districts
export const DISTRICT_COORDINATES = {
  // Madhya Pradesh
  'indore': { lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh' },
  'ujjain': { lat: 23.1765, lon: 75.7885, state: 'Madhya Pradesh' },
  'dewas': { lat: 22.9676, lon: 76.0534, state: 'Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
  'dhar': { lat: 22.5975, lon: 75.2974, state: 'Madhya Pradesh' },
  'ratlam': { lat: 23.3315, lon: 75.0367, state: 'Madhya Pradesh' },
  'rajgarh': { lat: 24.0080, lon: 76.7268, state: 'Madhya Pradesh' },
  'mandla': { lat: 22.5986, lon: 80.3712, state: 'Madhya Pradesh' },

  // Rajasthan
  'jaipur': { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
  'kota': { lat: 25.2138, lon: 75.8648, state: 'Rajasthan' },
  'jodhpur': { lat: 26.2389, lon: 73.0243, state: 'Rajasthan' },

  // Maharashtra
  'nagpur': { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
  'nashik': { lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
  'pune': { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },

  // Uttar Pradesh
  'lucknow': { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lon: 80.3319, state: 'Uttar Pradesh' }
};

// Haversine formula to compute straight-line distance in km
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Auto-detect browser location
export async function detectUserLocation() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedState = 'Madhya Pradesh';
        let detectedDistrict = 'Indore';

        try {
          // Fast reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            if (addr.state) detectedState = addr.state;
            if (addr.state_district || addr.county || addr.city) {
              detectedDistrict = addr.state_district || addr.county || addr.city;
            }
          }
        } catch {
          // If Nominatim fails or blocked, find nearest district centroid
          let minD = Infinity;
          for (const [distName, coords] of Object.entries(DISTRICT_COORDINATES)) {
            const d = calculateDistanceKm(latitude, longitude, coords.lat, coords.lon);
            if (d < minD) {
              minD = d;
              detectedDistrict = distName;
              detectedState = coords.state;
            }
          }
        }

        resolve({
          latitude,
          longitude,
          state: detectedState,
          district: detectedDistrict
        });
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
