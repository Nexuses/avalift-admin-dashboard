// src/services/adminUserService.ts

import {
    ApiResponse,
    apiGetFetcher,
    apiPostFetcher,
 
    apiDeleteFetcher,
  } from "./apiFetcher";
  import BASE_URL from "@/config/apiConfig";
  
  interface AdminUser {
    id: number;
    first_name: string;
    last_name: string;
    email_id: string | null;
    country_code: string;
    mobile_number: string;
    role_id: number;
    display_name:string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  interface CreateAdminUserPayload {
    first_name: string;
    last_name: string;
    country_code: string;
    mobile_number: string;
    email_id: string;
    password: string;
    role_id: number;
  }
  
  export interface UpdateAdminUserPayload {
    first_name: string;
    last_name: string;
    email_id: string;
    mobile_number: string;
    country_code: string;
    role_id?: number;
  }
  
  const AdminUserService = {
    /**
     * Create a new admin user.
     */
    createAdminUser: async (
      token: string,
      payload: CreateAdminUserPayload
    ): Promise<ApiResponse<any>> => {
      const url = `${BASE_URL}/api/admin/create-admin-user`;
  
      if (!token) {
        return {
          success: false,
          data: null,
          status: null,
          error: "Authentication token is missing.",
        };
      }
  
      const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);
  
      if (!response.success) {
        return {
          success: false,
          data: null,
          status: response.status,
          error:
            response.data?.message ||
            response.error ||
            "Failed to create admin user.",
        };
      }
  
      return response;
    },
  
    /**
     * Fetch available admin roles.
     */
    getAvailableAdminRoles: async (
      token: string
    ): Promise<ApiResponse<any>> => {
      const url = `${BASE_URL}/api/admin/get-available-admin-roles`;
  
      if (!token) {
        return {
          success: false,
          data: null,
          status: null,
          error: "Authentication token is missing.",
        };
      }
  
      return await apiGetFetcher(url, token);
    },
  
    /**
     * Fetch all admin users.
     * This method sends only the token (no payload/params) and returns a simple array of admin users.
     */
    getAllAdminUsers: async (
      token: string
    ): Promise<ApiResponse<AdminUser[]>> => {
      const url = `${BASE_URL}/api/admin/get-all-admin-users`;
  
      if (!token) {
        return {
          success: false,
          data: [],
          status: null,
          error: "Authentication token is missing.",
        };
      }
  
      const response: ApiResponse<any> = await apiGetFetcher(url, token);
  
      if (response.success && response.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          status: response.status,
          error: null,
        };
      }
  
      return {
        success: false,
        data: [],
        status: response.status,
        error: response.error || "Failed to fetch admin users.",
      };
    },
  
    /**
     * Update an existing admin user with full editable fields.
     * This method follows the same pattern as the organization update.
     */
    updateAdminUser: async (
      token: string,
      userId: number,
      payload: UpdateAdminUserPayload
    ): Promise<ApiResponse<AdminUser>> => {
      const url = `${BASE_URL}/api/admin/update-admin-user/${userId}`;
    
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
          error: response.data?.message || response.error || "Failed to update admin user.",
        };
      }
    
      return response;
    },
    
  
    /**
     * Delete an admin user.
     */
    deleteAdminUser: async (
      token: string,
      userId: number
    ): Promise<ApiResponse<any>> => {
      const url = `${BASE_URL}/api/admin/delete-admin-user/${userId}`;
  
      if (!token) {
        return {
          success: false,
          data: null,
          status: null,
          error:
            "Authentication failed: Missing token. Please log in and try again.",
        };
      }
  
      return await apiDeleteFetcher(url, token);
    },
  };
  
  export default AdminUserService;
  
