// services/dashboardService.ts

import { apiGetFetcher, apiPostFetcher, ApiResponse } from "./apiFetcher"; // Adjust the import path to match your project
import BASE_URL from "@/config/apiConfig"; // Adjust the import path based on your project structure

/**
 * Service to manage dashboard-related API calls.
 */
const dashboardService = {
  /**
   * Fetch dashboard data for the user.
   * @param token - Authorization token (e.g., from localStorage)
   * @returns A Promise resolving to an ApiResponse object containing the dashboard data.
   */
  fetchDashboardData: async (token: string): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/user/dashboard`;
    return apiGetFetcher(url, token);
  },

  /**
   * Fetch the pending payment amount for an organization.
   * @param token - Authorization token (e.g., from localStorage)
   * @returns A Promise resolving to an ApiResponse object containing the pending payment amount data.
   */
  fetchOrganizationPendingPaymentAmount: async (token: string): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/admin/organization-pending-payment-amount`;
    
    // Retrieve organization_id from localStorage
    const organizationId = localStorage.getItem("allowedOrganization");

    // Validate organizationId
    if (!organizationId || organizationId === "*" || organizationId === "1") {
      return {
        success: false,
        error: "Invalid or missing organization ID in localStorage",
        data: null,
        status: null, // Add status property to match ApiResponse interface
      };
    }

    // Prepare payload
    const payload = {
      organization_id: parseInt(organizationId, 10), // Convert to integer
    };

    // Make POST request
    return apiPostFetcher(url, payload, token);
  },
};

export default dashboardService;
