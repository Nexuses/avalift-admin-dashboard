import { apiGetFetcher } from "@/utils/apiFetcher";
import BASE_URL from "@/config/apiConfig";

// Interface for the user profile data
interface UserProfile {
  data: UserProfile | null;
  user_id: number;
  first_name: string;
  last_name: string;
  email_id: string;
  country_code: string;
  mobile_number: string;
  images: string | null;
  documents: string | null;
}

/**
 * Service for user-related API calls.
 */
const UserService = {
  /**
   * Fetch user profile data and store it in localStorage.
   * Endpoint: /api/user/profile
   */
  fetchUserProfile: async (): Promise<UserProfile | null> => {
    const url = `${BASE_URL}/api/user/profile`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("Authentication token is missing.");
      return null;
    }

    try {
      const response = await apiGetFetcher<UserProfile>(url, token);

      if (!response.success || !response.data) {
        console.error("Failed to fetch user profile:", response.error);
        return null;
      }

      // Store user profile in localStorage
      localStorage.setItem("userDetails", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  /**
   * Remove user details from localStorage (used on logout).
   */
  clearUserProfile: () => {
    localStorage.removeItem("userDetails");
  }
};

export default UserService;
