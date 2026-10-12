import { apiPostFetcher, ApiResponse } from "./apiFetcher"; // Adjust the import path as needed
import BASE_URL from "@/config/apiConfig";

// Define a Driver interface (adjust properties as needed)
export interface Driver {
  id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  user_type: string;
  status: string;
  active_ride: boolean;
  name?: string;
  mobile_number?: string;
  last_seen?: string;
}

const availabledriverService = {
  /**
   * Fetch nearby drivers.
   * @param latitude - Latitude of the search center.
   * @param longitude - Longitude of the search center.
   * @param radius - Search radius.
   * @param user_type - Type of users to fetch (e.g. "chauffeur").
   * @returns A Promise resolving to an ApiResponse with an array of drivers.
   */
  fetchNearbyDrivers: async (
    latitude: number = 10.7911,
    longitude: number = 76.7542,
    radius: number = 100000,
    user_type: string = "chauffeur"
  ): Promise<ApiResponse<Driver[]>> => {
    const url = `${BASE_URL}/api/location/getnearbyuser`;
    const token = localStorage.getItem("authToken") || "";
    const payload = { latitude, longitude, radius, user_type };

    try {
      const response = await apiPostFetcher<Driver[]>(url, payload, token);
      if (response.success && response.data) {
        // Ensure unique drivers by comparing updated_at timestamps.
        const uniqueDrivers = Object.values(
          response.data.reduce((acc: Record<string, Driver>, current: Driver) => {
            const existing = acc[current.id];
            if (!existing || new Date(current.updated_at) > new Date(existing.updated_at)) {
              acc[current.id] = current;
            }
            return acc;
          }, {})
        );
        return { ...response, data: uniqueDrivers };
      } else {
        return {
          success: false,
          data: [],
          status: response.status,
          error: response.error || "Failed to fetch nearby drivers.",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        status: null,
        error: error.message || "Network Error",
      };
    }
  },
};

export default availabledriverService;
