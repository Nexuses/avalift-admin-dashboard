import { ApiResponse, apiPostFetcher, apiGetFetcher, postFormDataAPI, updateFormDataAPI } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

interface Document {
  name: string;
  url: string;
  type: string;
}

export interface PD {
  id: number;
  documents?: Document[];
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  type_id: number;
  role_id: number;
  is_active: boolean;
  status_id: number | null;
  device_id: string | null;
  createdAt: string;
  updatedAt: string;
  emirates_id: string;
  emiratesId_validity: string;
  licence_number: string;
  licence_validity: string;
  user_availability?: boolean;
}

export interface ChauffeurAssignmentPayload {
  ride_id: string;
  chauffeur_id: number;
  customer_id?: string;
}

export interface UserLogSummary {
  user_id: string;
  name: string;
  mobile: string;
  date_utc: string;
  online_duration_hours: string;
  offline_duration_hours: string;
}

export interface DriverLogSummaryApiResponse {
  success: boolean;
  status: number;
  message: string;
  userLogSummary: UserLogSummary[];
}

const PDService = {
  fetchIndividualPD: async (): Promise<ApiResponse<PD[]>> => {
    const url = `${BASE_URL}/api/user/pd`;
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: [],
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const response: ApiResponse<any> = await apiGetFetcher<any>(url, token);
    if (response.success && response.data && Array.isArray(response.data.data)) {
      const transformedData = response.data.data.map((pd: any) => ({
        ...pd,
        documents: pd.documents?.map((doc: any) => ({
          name: doc.name,
          url: doc.url,
          type: doc.type,
        })),
      }));

      return {
        success: true,
        data: transformedData,
        status: response.status,
        error: null,
      };
    }

    return {
      success: false,
      data: [],
      status: response.status,
      error: response.error || "Failed to fetch PD users.",
    };
  },

  createPD: async (
    token: string,
    PDDetails: {
      firstName: string;
      lastName: string;
      emailId: string;
      phoneNumber: string;
      role: string;
      documents: {
        emirates_id: File;
        licence: File;
      };
      countryCode: string;
      emiratesId: string;
      emiratesId_validity: string;
      licenceNumber: string;
      licenceValidity: string;
    }
  ): Promise<ApiResponse<PD>> => {
    const url = `${BASE_URL}/api/admin/create-pd-chauffeur`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const { emirates_id, licence } = PDDetails.documents;
    if (!emirates_id || !licence) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Both Emirates ID and License documents are required.",
      };
    }

    const formData = new FormData();
    formData.append("emirates_id_doc", emirates_id);
    formData.append("licence_doc", licence);
    formData.append("first_name", PDDetails.firstName);
    formData.append("last_name", PDDetails.lastName);
    formData.append("email_id", PDDetails.emailId);
    formData.append("mobile_number", PDDetails.phoneNumber);
    formData.append("role", PDDetails.role);
    formData.append("country_code", PDDetails.countryCode);
    formData.append("emirates_id", PDDetails.emiratesId);
    formData.append("emiratesId_validity", PDDetails.emiratesId_validity);
    formData.append("licence_number", PDDetails.licenceNumber);
    formData.append("licence_validity", PDDetails.licenceValidity);

    // Log FormData content for debugging
    console.log("FormData content for createPD:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
    }

    const response: ApiResponse<any> = await postFormDataAPI<PD>(url, formData, token);

    if (!response.success) {
      console.error("API Error Response:", response);
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.data?.error || response.error || "Failed to create PD.",
      };
    }

    if (response.data?.documents && Array.isArray(response.data.documents)) {
      response.data.documents = response.data.documents.map((doc: any) => ({
        name: doc.name,
        url: doc.url,
        type: doc.type === "emirates_id" ? "emirates_id_doc" : "licence_doc",
      }));
    }

    return response;
  },

  updatePd: async (
    token: string,
    pdId: number,
    PDDetails: {
      firstName: string;
      lastName: string;
      emailId: string;
      phoneNumber: string;
      countryCode: string;
      emiratesId: string;
      emiratesId_validity: string;
      licenceNumber: string;
      licenceValidity: string;
      emiratesIdFile?: File;
      licenceFile?: File;
    }
  ): Promise<ApiResponse<PD>> => {
    const url = `${BASE_URL}/api/admin/update-pd-chauffeur/${pdId}`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const formData = new FormData();
    formData.append("first_name", PDDetails.firstName);
    formData.append("last_name", PDDetails.lastName);
    formData.append("email_id", PDDetails.emailId);
    formData.append("mobile_number", PDDetails.phoneNumber);
    formData.append("country_code", PDDetails.countryCode);
    formData.append("emirates_id", PDDetails.emiratesId);
    formData.append("emiratesId_validity", PDDetails.emiratesId_validity);
    formData.append("licence_number", PDDetails.licenceNumber);
    formData.append("licence_validity", PDDetails.licenceValidity);

    if (PDDetails.emiratesIdFile instanceof File) {
      formData.append("emirates_id_doc", PDDetails.emiratesIdFile);
    }
    if (PDDetails.licenceFile instanceof File) {
      formData.append("licence_doc", PDDetails.licenceFile);
    }

    // Log FormData content for debugging
    console.log("FormData content for updatePd:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
    }

    const response: ApiResponse<any> = await updateFormDataAPI<PD>(url, formData, token);

    if (!response.success) {
      console.error("API Error Response:", response);
      return {
        success: false,
        data: null,
        status: response.status,
        error:
          response.data?.message ||
          response.error ||
          "An unexpected error occurred while updating the PD.",
      };
    }

    if (response.data?.documents && Array.isArray(response.data.documents)) {
      response.data.documents = response.data.documents.map((doc: any) => ({
        name: doc.name,
        url: doc.url,
        type: doc.type === "emirates_id" ? "emirates_id_doc" : "licence_doc",
      }));
    }

    return response;
  },

  fetchChauffeursWithPd: async <T = any>(
    pdId: number,
    action: string = "Started"
  ): Promise<ApiResponse<T>> => {
    const url = `${BASE_URL}/api/rides/get-chauffeurs-with-pd`;
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const requestBody = { pd_id: pdId, action };
    const response = await apiPostFetcher<T>(url, requestBody, token);

    return response;
  },

  assignPD: async (
    rideId: string,
    chauffeurId: number,
    pdId: number,
    token: string
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/admin/admin-assign-pd`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const payload = {
      ride_id: rideId,
      chauffeur_id: chauffeurId,
      pd_id: pdId,
    };

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);

    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.data?.message || response.error || "Failed to assign PD.",
      };
    }

    return response;
  },

  fetchAllChauffeursWithPd: async (): Promise<ApiResponse<ApiResponse>> => {
    const url = `${BASE_URL}/api/admin/get-all-chauffeurs-with-pd`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    try {
      const response = await apiPostFetcher<ApiResponse>(url, {}, token);
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          status: response.status,
          error: null,
        };
      }

      return {
        success: false,
        data: null,
        status: response.status,
        error: response.error || "Failed to fetch chauffeurs with PD data",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: null,
        error: "An unexpected error occurred while fetching data",
      };
    }
  },

  toggleUserActiveStatus: async (
    userId: number,
    token: string,
    enable: boolean
  ): Promise<ApiResponse<{ user_availability: boolean }>> => {
    const url = `${BASE_URL}/api/admin/make-user-active-inactive`;

    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const payload = { user_id: userId, enable };
    const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);

    if (response.success) {
      return {
        success: true,
        data: { user_availability: response.data.user_availability },
        status: response.status,
        error: null,
      };
    }

    return {
      success: false,
      data: null,
      status: response.status,
      error: response.error || "Failed to toggle user status.",
    };
  },
};

export default PDService;

export const fetchDriverLogSummaryService = async (
  date: string
): Promise<DriverLogSummaryApiResponse> => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("Authentication token is missing.");
  }
  const payload = { date: date || "" };
  const response = await fetch(
    `${BASE_URL}/api/admin/get-all-users-log-summary`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const data: DriverLogSummaryApiResponse = await response.json();
  return data;
};