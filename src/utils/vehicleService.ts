import { apiGetFetcher, apiPostFetcher, apiPutFetcher, ApiResponse } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

interface VehicleDetail {
  registration_no: string;
  id: number;
  vehicle_id: number;
  color: string;
  fuel_type: string;
  make: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  
}

interface Vehicle {
  id: number;
  user_id: number;
  registration_no: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleDetail: VehicleDetail;
  User?: {
    id: number;
    country_code: string;
    mobile_number: string;
    email_id: string | null;
    first_name: string;
    last_name: string;
    password: string | null;
    type_id: number;
    role_id: number;
    is_active: boolean;
    status_id: number | null;
    device_id: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface VehicleApiResponse {
  data: any;
  currentPage: string;
  totalPages: number;
  totalItems: number;
  vehicles: Vehicle[];
}

const vehicleService = {
  getVehicles: async (
    token: string,
    page: number = 1,
    limit: number = 10,
    searchString: string = ""
  ): Promise<ApiResponse<VehicleApiResponse>> => {
    try {
      if (!token) {
        throw new Error("Authorization token is required.");
      }
      const url = `${BASE_URL}/api/vehicle/vehicles/${page}/${limit}`;
      const payload = {
        search_string: searchString,
      };
      // Endpoint now expects POST
      const response: ApiResponse<VehicleApiResponse> = await apiPostFetcher(url, payload, token);
      if (response.success && response.data) {
        return response;
      } else {
        throw new Error(response.error || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Vehicle Service Error:", error);
      throw error;
    }
  },

  getVehicleByUserId: async (userId: number, token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/vehicle/get-vehicle-by-id/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching vehicle details", error);
      throw error;
    }
  },

  createVehicle: async (
    token: string,
    payload: {
      user_id: string;
      registration_no: string;
      is_active: boolean;
      emirate_name: string;
      vehicleDetails: {
        color: string;
        fuel_type: string;
        make: string;
        model: string;
        
      };
    }
  ): Promise<ApiResponse<any>> => {
    try {
      if (!token) {
        throw new Error("Authorization token is required.");
      }
      const url = `${BASE_URL}/api/admin/create-vehicle`;
      const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || "Failed to update vehicle");
      }
    } catch (error) {
      throw error;
    }
  },

  updateVehicle: async (
    token: string,
    vehicleId: number,
    payload: {
      registration_no: string;
      is_active: boolean;
      vehicleDetails: {
        color: string;
        fuel_type: string;
        make: string;
        model: string;
      };
    }
  ): Promise<ApiResponse<any>> => {
    try {
      if (!token) {
        throw new Error("Authorization token is required.");
      }
      const url = `${BASE_URL}/api/admin/update-vehicle/${vehicleId}`;
      const response: ApiResponse<any> = await apiPutFetcher(url, payload, token);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || "Failed to update vehicle");
      }
    } catch (error) {
      throw error;
    }
  },

  getAllVehiclesByOrganisationId: async (token: string, orgId: number): Promise<ApiResponse<Vehicle[]>> => {
    try {
      if (!token) {
        throw new Error("Authorization token is required.");
      }
      const url = `${BASE_URL}/api/vehicle/get-all-vehicle-by-organisation-id/${orgId}`;
      const response: ApiResponse<any> = await apiGetFetcher(url, token);
      if (response.success && Array.isArray(response.data.data)) {
        response.data = response.data.data;
        return response as ApiResponse<Vehicle[]>;
      } else {
        throw new Error(response.error || "Failed to fetch vehicles by organization");
      }
    } catch (error) {
      console.error("Error fetching vehicles by organization:", error);
      throw error;
    }
  },

  deleteVehicle: async (token: string, vehicleId: number): Promise<ApiResponse<any>> => {
    try {
      if (!token) {
        throw new Error("Authorization token is required.");
      }

      // Check allowedOrganization in localStorage
      const allowedOrganization = localStorage.getItem("allowedOrganization");
      const isOrganizationLogin = allowedOrganization && allowedOrganization !== "1" && allowedOrganization !== "*";
      const url = isOrganizationLogin
        ? `${BASE_URL}/api/admin/delete-organization-vehicle/${vehicleId}`
        : `${BASE_URL}/api/admin/delete-vehicle/${vehicleId}`;

      // Use apiDeleteFetcher if available, otherwise use fetch
      const response: ApiResponse<any> = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || "Failed to delete vehicle");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  },
};

export { vehicleService };
