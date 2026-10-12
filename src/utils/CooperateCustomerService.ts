import { ApiResponse, apiPostFetcher } from "./apiFetcher"; // Assuming this exists
import BASE_URL from "@/config/apiConfig";

interface OrganizationAdmin {
  is_active: boolean;
  id: number;
  email_id: string;
  mobile_number: string;
  country_code: string;
  first_name: string;
  last_name: string;
  password: string;
  role_id: number;
  updatedAt: string;
  createdAt: string;
  type_id: number | null;
  status_id: number | null;
  device_id: string | null;
}

interface CorporateUser {
  id: number;
  email_id: string;
  first_name: string;
  last_name: string;
  organization_name: string;
  country_code: string;
  mobile_number: string;
  type_id: number;
  role_id: number;
  is_active: boolean;
  status_id: number;
  device_id: string;
  createdAt: string;
  updatedAt: string;
}

const OrganizationAdminService = {
  createOrgAdmin: async (
    token: string,
    adminDetails: {
      emailId: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      countryCode: string;
      password: string;
      organizationId: number;
    }
  ): Promise<ApiResponse<OrganizationAdmin>> => {
    const url = `${BASE_URL}/api/organization/create-org-admin`;
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in and try again.",
      };
    }
    const payload = {
      email_id: adminDetails.emailId,
      first_name: adminDetails.firstName,
      last_name: adminDetails.lastName,
      mobile_number: adminDetails.phoneNumber,
      country_code: adminDetails.countryCode,
      password: adminDetails.password,
      organisationId: adminDetails.organizationId,
    };
    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error:
          response.data?.message ||
          response.error ||
          "An unexpected error occurred while creating the organisation admin.",
      };
    }
    return response;
  },

  getAllUsersOrganizations: async (
    token: string,
    organisationId: number
  ): Promise<ApiResponse<CorporateUser[]>> => {
    const url = `${BASE_URL}/api/organization/all-users-organizations`;
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in and try again.",
      };
    }
    const payload = { orgnanisation_id: organisationId };
    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error:
          response.data?.message ||
          response.error ||
          "An unexpected error occurred while fetching the organisations.",
      };
    }
    return response;
  },

  updateOrgAdmin: async (
    token: string,
    id: number,
    adminDetails: {
      email_id: string;
      mobile_number: string;
      country_code: string;
      first_name: string;
      last_name: string;
      password?: string; // Optional for updates
    }
  ): Promise<ApiResponse<OrganizationAdmin>> => {
    const url = `${BASE_URL}/api/organization/update-org-admin/${id}`;
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in and try again.",
      };
    }

    const payload = {
      email_id: adminDetails.email_id,
      mobile_number: adminDetails.mobile_number,
      country_code: adminDetails.country_code,
      first_name: adminDetails.first_name,
      last_name: adminDetails.last_name,
      ...(adminDetails.password && { password: adminDetails.password }), // Include password only if provided
    };

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        data: data.data,
        status: data.status,
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      status: response.status,
      error: data.error,
    };
  },
};

export default OrganizationAdminService;