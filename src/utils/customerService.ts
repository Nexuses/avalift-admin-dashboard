import { ApiResponse, apiDeleteFetcher, apiPostFetcher, apiPutFetcher } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

/**
 * Interface representing an individual customer.
 */
interface Customer {
  id: number;
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  type_id: number | null;
  role_id: number;
  is_active: boolean;
  status_id: number | null;
  device_id: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response structure for paginated customer data.
 */
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  status: number | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  error?: string | null;
}

/**
 * Service to manage customer-related API calls.
 */
const CustomerService = {
  /**
   * Fetch individual customers with pagination support.
   * The payload includes { search_string, page, limit }.
   * @returns A promise resolving to the API response containing paginated individual customers.
   */
  fetchIndividualCustomers: async (
    params: { query: string; page?: number; limit?: number }
  ): Promise<PaginatedResponse<Customer>> => {
    const url = `${BASE_URL}/api/user/customers/individual`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      return {
        success: false,
        data: [],
        status: null,
        totalCount: 0,
        totalPages: 0,
        currentPage: params.page || 1,
        error: "Authentication token is missing.",
      };
    }

    const payload = {
      search_string: params.query,
      page: params.page || 1,
      limit: params.limit || 10,
    };

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);

    if (response.success && response.data && Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
        status: response.status,
        totalCount: response.data.totalCount || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || params.page || 1,
        error: null,
      };
    }

    return {
      success: false,
      data: [],
      status: response.status,
      totalCount: 0,
      totalPages: 0,
      currentPage: params.page || 1,
      error: response.error || "Failed to fetch customers.",
    };
  },

  /**
   * Create a new customer with the provided details.
   * @param token - The authentication token.
   * @param customerDetails - The data for the customer to be created.
   * @returns A promise resolving to the API response containing the newly created customer.
   */
  createCustomer: async (
    token: string,
    customerDetails: {
      firstName: string;
      lastName: string;
      emailId: string;
      phoneNumber: string;
      countryCode: string;
      role?: string;
    }
  ): Promise<ApiResponse<Customer>> => {
    const url = `${BASE_URL}/api/admin/create-customer`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in and try again.",
      };
    }

    const payload = {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName,
      email_id: customerDetails.emailId,
      mobile_number: customerDetails.phoneNumber,
      country_code: customerDetails.countryCode,
      role: customerDetails.role || "individual",
    };

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);

    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.data?.message || response.error || "An unexpected error occurred while creating the customer.",
      };
    }

    return response;
  },

  /**
   * Update an existing customer with the provided details.
   * @param token - The authentication token.
   * @param customerId - The ID of the customer to update.
   * @param customerDetails - The data for the customer to be updated.
   * @returns A promise resolving to the API response containing the updated customer.
   */
  updateCustomer: async (
    token: string,
    customerId: number,
    customerDetails: {
      firstName: string;
      lastName: string;
      emailId: string;
      phoneNumber: string;
      countryCode: string;
    }
  ): Promise<ApiResponse<Customer>> => {
    const url = `${BASE_URL}/api/admin/update-customer/${customerId}`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in and try again.",
      };
    }

    const payload = {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName,
      email_id: customerDetails.emailId,
      mobile_number: customerDetails.phoneNumber,
      country_code: customerDetails.countryCode,
    };

    const response: ApiResponse<any> = await apiPutFetcher<any>(url, payload, token);

    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.data?.message || response.error || "An unexpected error occurred while updating the customer.",
      };
    }

    return response;
  },

  /**
   * Delete a customer by their user ID.
   * @param userId - The ID of the customer to delete.
   * @param token - The authentication token.
   * @returns A promise resolving to the API response confirming deletion.
   */
  deleteCustomer: async (userId: string, token: string): Promise<ApiResponse<{ message: string }>> => {
    const url = `${BASE_URL}/api/admin/delete-user`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const payload = { user_id: userId };
    const response: ApiResponse<any> = await apiDeleteFetcher(url, token, JSON.stringify(payload));

    if (response.success) {
      return {
        success: true,
        data: { message: response.data?.message || "Customer deleted successfully." },
        status: response.status,
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      status: response.status,
      error: response.data?.error || response.error || "Failed to delete customer.",
    };
  },
};

export default CustomerService;