// distanceMatrixService.ts

export interface DistanceMatrixResult {
    durationInMinutes: number;
    distanceText: string;
  }
  
  /**
   * Calculates travel time and distance using Google Maps DistanceMatrixService.
   *
   * @param origins - Array of origin coordinates.
   * @param destinations - Array of destination coordinates.
   * @returns A promise resolving to the duration (in minutes) and distance text.
   */
  export function calculateTravelTime(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[]
  ): Promise<DistanceMatrixResult> {
    return new Promise((resolve, reject) => {
      const distanceMatrixService = new google.maps.DistanceMatrixService();
      distanceMatrixService.getDistanceMatrix(
        {
          origins,
          destinations,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            const element = response.rows[0].elements[0];
            const durationInSeconds = element.duration.value;
            const durationInMinutes = Math.ceil(durationInSeconds / 60);
            const distanceText = element.distance.text;
            resolve({ durationInMinutes, distanceText });
          } else {
            console.error("Error calculating duration:", status);
            reject(status);
          }
        }
      );
    });
  }
  
  export default { calculateTravelTime };
  