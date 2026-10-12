
import { apiPostFetcher, ApiResponse } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

/**
 * Interface for latitude and longitude in the requested_pickup object.
 */
interface LatLong {
  N: string;
}

/**
 * Interface for the requested_pickup object.
 */
interface RequestedPickup {
  lat: LatLong;
  long: LatLong;
}

/**
 * Interface for each record in the Pick-Up and Drop History data.
 */
interface PDHistoryData {
  ride_id: string;
  requested_pickup: RequestedPickup;
  updatedAt: string;
  status: string;
  SK: string;
  pd_id: string;
  PK: string;
  requested_pickup_point: string;
  chauffeur_id: number;
}

/**
 * Interface for the API response that includes a list of Pick-Up and Drop history.
 */
interface PDHistoryApiResponse {
  data: PDHistoryData[];
}

/**
 * Service for handling Pick-Up and Drop History for admins.
 */
const pdHistoryAdminService = {
  /**
   * Fetch Pick-Up and Drop history for a specific admin.
   * @param payload - Request payload including from_date, to_date, and action.
   * @param pdId - pd ID for fetching data.
   * @returns A promise that resolves to the API response containing the history data.
   */
  fetchPDHistory: async (
    payload: {
      from_date: string;
      to_date: string;
      action: string;
      pd_id: number;
    },
    
  ): Promise<ApiResponse<PDHistoryApiResponse>> => {
    try {
      // Retrieve token from local storage
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Authorization token is required.");
      }

      // Construct the URL dynamically
      const url = `${BASE_URL}/api/rides/pd-history-admin`;
     


      // Sending POST request
      const response: ApiResponse<PDHistoryApiResponse> = await apiPostFetcher(
        url,
        payload,
        token
      );

      // Validate the response and handle any errors
      if (response.success && response.data) {
        return response; // Return the response if successful
      } else {
        // Handling error in case the API returns a failure status
        throw new Error(response.error || "Failed to fetch data.");
      }
    } catch (error) {
      // Enhanced error logging for better debugging
      console.error("Error fetching Pick-Up and Drop history:", error);
      
      // Throwing error again for the caller to handle
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  },
};

export { pdHistoryAdminService };
