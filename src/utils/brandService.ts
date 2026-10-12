import { apiGetFetcher, apiPostFetcher, ApiResponse } from "./apiFetcher"; // Adjust import paths as needed
import BASE_URL from "@/config/apiConfig"; // Adjust based on your project structure

/**
 * Service to manage brand-related API calls.
 */
const brandService = {
  /**
   * Fetch all vehicle brands.
   * @returns A Promise resolving to an ApiResponse containing an array of brand names and images.
   */
  fetchBrands: async (): Promise<ApiResponse<{ brand: string; brandImage: string | null }[]>> => {
    const url = `${BASE_URL}/api/vehicle/brands`;
    const token = localStorage.getItem("authToken") || "";

    try {
      const response = await apiGetFetcher<{ brand: string; brandImage: string | null }[]>(url, token);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          status: response.status,
          error: null,
        };
      } else {
        return {
          success: false,
          data: [],
          status: response.status,
          error: response.error || "Failed to fetch brands.",
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

  /**
   * Create a new vehicle brand.
   * @param token - The authentication token.
   * @param payload - The brand payload containing brand_name and brand_image (as URL or base64).
   * @returns A Promise resolving to an ApiResponse object.
   */
  createBrand: async (
    token: string,
    payload: { brand_name: string; brand_image: string | null } // JSON payload
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/vehicle/brand`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication failed: Missing token. Please log in and try again.",
      };
    }

    const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);

    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.data?.message || response.error || "Failed to create brand. Please try again.",
      };
    }

    return response;
  },

  


  /**
   * Update a vehicle brand with optional image change.
   * @param token - The authentication token.
   * @param payload - Object containing old and new brand details.
   * @returns A Promise resolving to an ApiResponse with updated brand data.
   */
  updateBrandWithImage: async (
    token: string,
    payload: {
      old_brand_name: string;
      new_brand_name: string;
      new_brand_image: string;
    }
  ): Promise<ApiResponse<{ new_brand_name: string; new_brand_image: string }>> => {
    const url = `${BASE_URL}/api/vehicle/update-brand`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication failed: Missing token. Please log in and try again.",
      };
    }

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      return response.ok
        ? {
            success: true,
            data: data.data,
            status: data.status,
            error: null,
          }
        : {
            success: false,
            data: null,
            status: data.status,
            error: data.message || "Failed to update brand.",
          };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        status: null,
        error: error.message || "Network Error",
      };
    }
  },

  /**
   * Delete an existing vehicle brand.
   * @param token - The authentication token.
   * @param brandName - The name of the brand to delete.
   * @returns A Promise resolving to an ApiResponse object.
   */
  deleteBrand: async (
    token: string,
    brandName: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const url = `${BASE_URL}/api/vehicle/brand/delete-brand`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication failed: Missing token. Please log in and try again.",
      };
    }

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ brand: brandName }),
      });

      const data = await response.json();

      return response.ok
        ? {
            success: true,
            data: { message: data.message },
            status: response.status,
            error: null,
          }
        : {
            success: false,
            data: null,
            status: response.status,
            error: data.message || "Failed to delete brand.",
          };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        status: null,
        error: error.message || "Network Error",
      };
    }
  },
};

export default brandService;
