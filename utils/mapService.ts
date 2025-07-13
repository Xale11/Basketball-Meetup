    // This service handles map operations through a backend proxy
// to keep the Google Maps API key secure

export interface MapService {
  getNearbyCourts: (latitude: number, longitude: number, radius: number) => Promise<any[]>;
  getDirections: (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => Promise<any>;
}

// Example implementation - you would replace this with your actual backend
export const mapService: MapService = {
  async getNearbyCourts(latitude: number, longitude: number, radius: number) {
    try {
      // This would call your backend API instead of directly using Google Maps API
      const response = await fetch('/api/courts/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby courts:', error);
      return [];
    }
  },

  async getDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    try {
      // This would call your backend API instead of directly using Google Maps API
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  },
}; 