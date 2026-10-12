import { 
  apiGetFetcher, 
  apiPostFetcher, 
  apiDeleteFetcher, 
  ApiResponse 
} from "./apiFetcher"; // Adjust import paths as needed
import BASE_URL from "@/config/apiConfig"; // Adjust based on your project structure

// Define an interface for an organization record.
export interface Organization {
  email_id: string;
  organization_name: string;
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string;
  organization_logo?: string; // Add logo field to store the logo URL or path returned by the server
}

export interface OrganizationUser {
  id: number;
}

export interface OrganizationUserResponse {
  success: boolean;
  data: OrganizationUser[];
  error?: string;
  message?: string;
  id?: string;
}

const organizationService = {
  /**
   * Fetch all organizations using the /api/organization/all-organizations endpoint.
   */
  fetchAllOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    const url = `${BASE_URL}/api/organization/all-organizations`;
    const token = localStorage.getItem("authToken") || "";
    return await apiGetFetcher<Organization[]>(url, token);
  },

  /**
   * Create a new organization.
   */
  createOrganization: async (formData: FormData): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/organization/create-organization`;
    const token = localStorage.getItem("authToken") || "";

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication failed: Missing token. Please log in and try again.",
      };
    }

    try {
      // Use fetch directly to handle FormData, as apiPostFetcher expects a JSON payload
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type for FormData; the browser sets it automatically
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: null,
          status: response.status,
          error: data.message || "Failed to create organization. Please try again.",
        };
      }

      return {
        success: true,
        data,
        status: response.status,
        error: null,
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
   * Update an existing organization.
   */
  updateOrganization: async (
    token: string,
    id: number,
    payload: FormData // Change payload type to FormData
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/organization/${id}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type for FormData; the browser sets it automatically
        },
        body: payload, // Use payload directly as FormData
      });

      const data = await response.json();

      return response.ok
        ? { success: true, data, status: response.status, error: null }
        : { success: false, data: null, status: response.status, error: data.message || "API Error" };
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
   * Fetch all users for a given organization.
   */
  fetchAllUsers: async (orgId: string): Promise<ApiResponse<any>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const url = `${BASE_URL}/api/organization/all-users-organizations`;
    const payload = {
      organisation_id: orgId,
    };

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
    return response;
  },

  /**
   * Delete an existing organization.
   */
  deleteOrganization: async (
    token: string,
    id: number
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/organization/${id}`;
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication failed: Missing token. Please log in and try again.",
      };
    }
    return await apiDeleteFetcher(url, token);
  },

  /**
   * Fetch organizations for the current allowed organization.
   */
  fetchOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: [],
        status: null,
        error: "No token provided. Authorization denied.",
      };
    }
    const allowedOrganization = localStorage.getItem("allowedOrganization") || "";
    const url = `${BASE_URL}/api/organization/all-users-organizations`;
    return await apiPostFetcher(url, { organisation_id: allowedOrganization }, token);
  },

  /**
   * Fetch the user ID from the organization API based on the provided organisation_id.
   */
  fetchUserIdFromOrganization: async (
    organisation_id: string,
    token: string
  ): Promise<number> => {
    const url = `${BASE_URL}/api/organization/all-users-organizations`;
    const response = await apiPostFetcher<OrganizationUserResponse>(url, { organisation_id }, token);
    if (!response.success) {
      throw new Error("Failed to fetch user ID from organization API");
    }
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0].id;
    } else {
      throw new Error("Failed to retrieve user information from organization API.");
    }
  },

  /**
   * Toggle organization active status
   */
  toggleOrganizationStatus: async (organizationId: number, isActive: boolean): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/organization/organization-status`;
    const token = localStorage.getItem("authToken") || "";

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
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          is_active: isActive
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: null,
          status: response.status,
          error: data.message || 'Failed to update organization status'
        };
      }

      return {
        success: true,
        data: data,
        status: response.status,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: null,
        error: 'An error occurred while updating organization status'
      };
    }
  },
};

/**
 * Retrieves the user ID from localStorage.
 */
export function getUserIdFromLocalStorage(): number | null {
  const userDetailsString = localStorage.getItem("userDetails");
  if (userDetailsString) {
    try {
      const userDetails = JSON.parse(userDetailsString);
      return userDetails.data.user_id;
    } catch (err) {
      console.error("Error parsing userDetails from localStorage:", err);
    }
  }
  return null;
}

export default organizationService;