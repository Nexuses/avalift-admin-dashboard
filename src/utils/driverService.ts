import { ApiResponse, apiGetFetcher, apiPostFetcher, postFormDataAPI, updateFormDataAPI } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

// interface Document {
//   name: string;
//   url: string;
//   type?: string; // To distinguish between emirates_id and licence
// }

/**
 * Interface representing an individual driver.
 */
export interface Driver {
  id: number;
  // documents?: Document[]; // Changed to array-based structure
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
  user_availability?: boolean; // Refined type from 'any'
  erp_chauffeur_code?: string;
  erp_ac_name_cash?: string;
  erp_ac_code_cash?: string;
  erp_ac_code_online?: string;
  erp_ac_name_online?: string;
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

/**
 * Interface representing an available chauffeur in the get-available-chauffeurs response.
 */
export interface AvailableChauffeur {
  id: number;
  name: string;
}

/**
 * Service to manage driver-related API calls.
 */
const DriverService = {
  /**
   * Fetch individual drivers with token authentication.
   * @returns A promise resolving to the API response containing individual drivers.
   */
  fetchIndividualDrivers: async (): Promise<ApiResponse<Driver[]>> => {
    const url = `${BASE_URL}/api/user/chauffeurs`;
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
      // Map API response to Driver interface, keeping documents as array
      const transformedData = response.data.data.map((driver: any) => ({
        ...driver,
        documents: driver.documents?.map((doc: any) => ({
          name: doc.name,
          url: doc.url,
          type: doc.type === "documents[emirates_id]" ? "emirates_id" : doc.type === "documents[licence]" ? "licence" : doc.type,
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
      error: response.error || "Failed to fetch drivers.",
    };
  },

  /**
   * Fetch available chauffeurs with token authentication.
   * @returns A promise resolving to the API response containing available chauffeurs.
   */
  getAvailableChauffeurs: async (): Promise<ApiResponse<AvailableChauffeur[]>> => {
    const url = `${BASE_URL}/api/admin/get-available-chauffeurs`;
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
      error: response.error || "Failed to fetch available chauffeurs.",
    };
  },
/**
 * Create a new driver (Chauffeur or PD) with the provided details.
 * Sends files as top-level multipart fields (no documents[...] nesting).
 */
/**
 * Create a new driver (Chauffeur or PD).
 * Sends files as top-level multipart fields: `emirates_id_doc`, `licence_doc`.
 */
createDriver: async (
  token: string,
  driverDetails: {
    firstName: string;
    lastName: string;
    emailId: string;
    phoneNumber: string;
    role: string;
    countryCode: string;
    emiratesId: string;
    emiratesId_validity: string;
    licenceNumber: string;
    licenceValidity: string;
    emirates_id_doc: File;
    licence_doc: File;
    erp_chauffeur_code: string;
    erp_ac_name_cash: string;
    erp_ac_code_cash: string;
    erp_ac_code_online: string;
    erp_ac_name_online: string;
  }
): Promise<ApiResponse<Driver>> => {
  const url = `${BASE_URL}/api/admin/create-pd-chauffeur`;

  if (!token) {
    return {
      success: false,
      data: null,
      status: null,
      error: "Authentication token is missing.",
    };
  }

  const formData = new FormData();

  // ✅ Correct top-level file field names
  formData.append("emirates_id_doc", driverDetails.emirates_id_doc);
  formData.append("licence_doc", driverDetails.licence_doc);

  // Text fields (match backend keys exactly)
  formData.append("first_name", driverDetails.firstName);
  formData.append("last_name", driverDetails.lastName);
  formData.append("email_id", driverDetails.emailId);
  formData.append("mobile_number", driverDetails.phoneNumber);
  formData.append("role", driverDetails.role);
  formData.append("country_code", driverDetails.countryCode);
  formData.append("emirates_id", driverDetails.emiratesId);            // ⬅️ keep as "emirates_id"
  formData.append("emiratesId_validity", driverDetails.emiratesId_validity);
  formData.append("licence_number", driverDetails.licenceNumber);
  formData.append("licence_validity", driverDetails.licenceValidity);
  formData.append("erp_chauffeur_code", driverDetails.erp_chauffeur_code);
  formData.append("erp_ac_name_cash", driverDetails.erp_ac_name_cash);
  formData.append("erp_ac_code_cash", driverDetails.erp_ac_code_cash);
  formData.append("erp_ac_code_online", driverDetails.erp_ac_code_online);
  formData.append("erp_ac_name_online", driverDetails.erp_ac_name_online);

  // postFormDataAPI must forward FormData as-is (no manual Content-Type)
  const response: ApiResponse<any> =
    await postFormDataAPI<Driver>(url, formData, token);

  if (!response.success) {
    return {
      success: false,
      data: null,
      status: response.status,
      error:
        response.data?.error ||
        response.error ||
        "Failed to create driver. Please try again.",
    };
  }

  // Optional: if backend still returns bracketed doc types, normalize
  if (response.data?.documents && Array.isArray(response.data.documents)) {
    response.data.documents = response.data.documents.map((doc: any) => ({
      name: doc.name,
      url: doc.url,
      type:
        doc.type === "documents[emirates_id]" ? "emirates_id" :
        doc.type === "documents[licence]"     ? "licence"     :
        doc.type,
    }));
  }

  return response;
},
  /**
 * Update an existing driver with the provided details.
 * @param token - The authentication token.
 * @param driverId - The ID of the driver to update.
 * @param driverDetails - The data for the driver to be updated.
 * @returns A promise resolving to the API response containing the updated driver.
 */
updateDriver: async (
  token: string,
  driverId: number,
  driverDetails: {
    firstName: string;
    lastName: string;
    emailId: string;
    phoneNumber: string;
    countryCode: string;
    emiratesId: string;
    emiratesId_validity: string;
    licenceNumber: string;
    licenceValidity: string;
    emiratesIdFile?: File; // New file for Emirates ID (optional)
    licenceFile?: File; // New file for License (optional)
    erp_chauffeur_code: string;
    erp_ac_name_cash: string;
    erp_ac_code_cash: string;
    erp_ac_code_online: string;
    erp_ac_name_online: string;
  }
): Promise<ApiResponse<Driver>> => {
  const url = `${BASE_URL}/api/admin/update-pd-chauffeur/${driverId}`;

  if (!token) {
    return {
      success: false,
      data: null,
      status: null,
      error: "Authentication token is missing. Please log in and try again.",
    };
  }

  const formData = new FormData();
  formData.append("first_name", driverDetails.firstName);
  formData.append("last_name", driverDetails.lastName);
  formData.append("email_id", driverDetails.emailId);
  formData.append("mobile_number", driverDetails.phoneNumber);
  formData.append("country_code", driverDetails.countryCode);
  formData.append("emirates_id", driverDetails.emiratesId);
  formData.append("emiratesId_validity", driverDetails.emiratesId_validity);
  formData.append("licence_number", driverDetails.licenceNumber);
  formData.append("licence_validity", driverDetails.licenceValidity);
  formData.append("erp_chauffeur_code", driverDetails.erp_chauffeur_code);
  formData.append("erp_ac_name_cash", driverDetails.erp_ac_name_cash);
  formData.append("erp_ac_code_cash", driverDetails.erp_ac_code_cash);
  formData.append("erp_ac_code_online", driverDetails.erp_ac_code_online);
  formData.append("erp_ac_name_online", driverDetails.erp_ac_name_online);

  // ✅ Corrected document keys
  if (driverDetails.emiratesIdFile instanceof File) {
    formData.append("emirates_id_doc", driverDetails.emiratesIdFile);
  }
  if (driverDetails.licenceFile instanceof File) {
    formData.append("licence_doc", driverDetails.licenceFile);
  }

  const response: ApiResponse<any> = await updateFormDataAPI<Driver>(url, formData, token);

  if (!response.success) {
    return {
      success: false,
      data: null,
      status: response.status,
      error:
        response.data?.message ||
        response.error ||
        "An unexpected error occurred while updating the driver.",
    };
  }

  // Transform documents to array format with simplified types
  if (response.data?.documents && Array.isArray(response.data.documents)) {
    response.data.documents = response.data.documents.map((doc: any) => ({
      name: doc.name,
      url: doc.url,
      type: doc.type, // No need to remap unless you're still receiving bracketed keys
    }));
  }

  return response;
},
  /**
   * Toggle the active/inactive status of a user.
   * @param userId - The ID of the user to toggle.
   * @param token - The authentication token.
   * @param enable - Boolean indicating whether to enable or disable the user.
   * @returns A promise resolving to the API response.
   */
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

  /**
   * Assign a chauffeur to a ride.
   * @param payload - Contains ride_id, chauffeur_id, and customer_id.
   * @param rideType - The type of the ride; if "scheduled", uses a different endpoint.
   * @param token - The authentication token.
   * @returns A Promise resolving to an ApiResponse from the API.
   */
  assignChauffeurToRide: async (
    payload: ChauffeurAssignmentPayload,
    rideType: string,
    token: string
  ): Promise<ApiResponse<any>> => {
    let url = "";
    if (rideType === "scheduled") {
      url = `${BASE_URL}/api/admin/schedule-chauffeur-assign`;
    } else {
      url = `${BASE_URL}/api/admin/assign-chauffeur-to-ride/${payload.ride_id}`;
    }

    return await apiPostFetcher(url, payload, token);
  },

  /**
   * Assign or reassign a chauffeur to a ride.
   * @param rideId - The ride ID.
   * @param rideStatus - The current status of the ride.
   * @param rideType - The ride type (e.g., "scheduled").
   * @param selectedChauffeur - The selected chauffeur's ID.
   * @param customerId - The customer ID (if applicable).
   * @param token - The authentication token.
   * @returns A Promise resolving to an ApiResponse from the API.
   */
  assignOrReassignChauffeur: async (
    rideId: string,
    rideStatus: string,
    rideType: string,
    selectedChauffeur: number,
    customerId: string | number | undefined,
    token: string
  ): Promise<ApiResponse<any>> => {
    let url = "";
    const payload: ChauffeurAssignmentPayload = {
      ride_id: rideId,
      chauffeur_id: Number(selectedChauffeur),
    };

    const normalizedRideStatus = rideStatus.toLowerCase();
    const normalizedRideType = rideType.toLowerCase();

    if (normalizedRideStatus === "review-pending") {
      url = `${BASE_URL}/api/admin/schedule-chauffeur-reassign`;
    } else if (normalizedRideType === "scheduled" && normalizedRideStatus === "requested") {
      url = `${BASE_URL}/api/admin/schedule-chauffeur-assign`;
      payload.customer_id = customerId?.toString();
    } else if (
      normalizedRideType === "scheduled" &&
      (normalizedRideStatus === "accepted" || normalizedRideStatus === "on-the-way")
    ) {
      url = `${BASE_URL}/api/admin/schedule-chauffeur-reassign`;
      payload.customer_id = customerId?.toString();
    } else if (normalizedRideStatus === "on-the-way" || normalizedRideStatus === "started" || normalizedRideStatus === "reached customer") {
      url = `${BASE_URL}/api/admin/re-assign-chauffeur/${rideId}`;
      payload.customer_id = customerId?.toString();
    } else {
      url = `${BASE_URL}/api/admin/assign-chauffeur-to-ride/${rideId}`;
      payload.customer_id = customerId?.toString();
    }

    return await apiPostFetcher(url, payload, token);
  },

  /**
   * Reassign a scheduled chauffeur.
   * @param rideId - The ride ID.
   * @param rideStatus - The current status of the ride.
   * @param rideType - The ride type.
   * @param chauffeurId - The chauffeur ID.
   * @param customerId - The customer ID.
   * @param token - The authentication token.
   * @returns A Promise resolving to an ApiResponse from the API.
   */
  async reassignScheduledChauffeur(
    rideId: string,
    rideStatus: string,
    rideType: string,
    chauffeurId: number,
    customerId: string | number,
    token: string
  ) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/schedule-chauffeur-reassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ride_id: rideId,
          ride_status: rideStatus,
          ride_type: rideType,
          chauffeur_id: chauffeurId,
          customer_id: customerId,
        }),
      });
      const data = await response.json();
      return { success: response.ok, data, error: data.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  },
};

export default DriverService;

/**
 * Fetch the driver log summary for the specified date.
 * @param date - Date string (empty string for current date).
 * @returns A promise resolving to DriverLogSummaryApiResponse.
 */
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
