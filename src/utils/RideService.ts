import { ApiResponse, apiPostFetcher } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

/**
 * Interface for a basic ride (list view).
 */
export interface Ride {
  order_date: any;
  customer_name: string;
  customer_id: string;
  organisation_name: any;
  organisation_id?: string;
  ride_type: string;
  pd_name: string;
  chauffeur_name: number | boolean;
  final_price_calculation: any;
  estimated_amount: any;
  pd_id: string;
  scheduled_pickup: string;
  ride_id: string;
  status: string;
  requested_pickup_point?: string;
  requested_drop_point?: string;
  chauffeur_id: number;
  customer_details?: {
    name?: string;
    country_code?: string;
    id?: number;
    mobile_number?: string;
    profile_image?: string;
  };
  updatedAt?: string;
}

/**
 * Data structure for the response of get-all-rides.
 */
export interface RidesData {
  rides: Ride[];
  totalPages: number;
  currentPage: number;
  totalCommission?: number; // Optional to handle cases where the field might be absent
}

/**
 * Overall response shape for get-all-rides.
 */
export interface RidesResponse {
  success: boolean;
  status: number;
  message: string;
  data: RidesData;
}

/**
 * Payload for filtering and paginating rides.
 */
export interface GetAllRidesPayload {
  status: string;
  search_string: string;
  start_date: string | undefined;
  end_date: string | undefined;
  ride_type: "instant" | "scheduled"|"";
  selected_org: string;
}

export interface GetAllChauffeurRidesPayload {
  status: string;
  search_string: string;
  start_date: string;
  end_date: string;
}

/**
 * Detailed ride information interface.
 */
export interface RideDetails {
  estimated_total_amount: string;
  organisation_name: string;
  ride_duration: string;
  organisation_ride: boolean;
  selected_coupon?: {
    coupon_code: string;
  };

  reviews: {
    rating: number;
    comment: string;
    
  }
  destination_change_history: Array<{
    changed_at: string;
    point: string;
  }>;
  
  final_price_calculation: {
    mandatory_charges: {
      total: number;
      breakdown: Record<string, any>;
    };
    total_after_discount: number;
    appliedCoupons: any[];
    rates: {
      base_fare: number;
      per_hour: number;
      half_day: number;
      per_min: number;
      full_day: number;
    };
    vat: number;
    final_total_amount: number;
    tip_amount?: number;
    base_fare: number;
    estimated_total_amount: number;
    previous_balance: number;
    couponErrors: any[];
    other_charges: {
      total: number;
      breakdown: Record<string, any>;
    };
    isCouponApplied: boolean;
    coupon_discount: number;
  };
  planned_end_time: string;
  scheduled_pickup?: boolean;
  hours_booked?: number | null;
  otp: string;
  pd_number?: number;
  pd_name?: string;
  driver_details?: string;
  cancellation_reason?: string;
  estimated_time_in_minutes: number;
  requested_drop: {
    lat: number;
    long: number;
  };
  paymentDetails: {
    payment_method: string;
    card: any;
  };
  status: string;
  after_ride_images?: string[];
  before_ride_images: string[];
  estimated_amount: number;
  previous_balance?: number;
  status_log: Array<{
    datetime: string;
    status: string;
    cancellation_reason?: string;
    action_by?:string;
  }>;
  customer_extra_details: {
    instructions: string;
    key_details: string;
    parking_instructions: string;
  };
  requested_drop_point: string;
  all_rides_pk: string;
  lower_chauffeur_name: string;
  ride_type: string;
  vehicleDetails: {
    model?: string;
    chauffeur_name?: any;
    color: string;
    vehicle_id: string;
    registration_no: string;
    make: string;
    brand: string;
    mobile_number?: string;
    chauffeur_image?: string;
  };
  vehicle_details: {
    registration_no: string;
  }
  coupon_ids: any[];
  chauffeur_number?: string;
  SK: string;
  ride_id: string;
  slug_id?: string;
  requested_pickup: {
    lat: number;
    long: number;
  };
  is_customer_available: boolean;
  customer_id: string;
  rate_type: string;
  requested_pickup_point: string;
  lower_customer_name: string;
  end_time?: string;
  order_date: string;
  vehicle_id: string;
  organisation_id: string;
  pd_id?: string;
  PK: string;
  chauffeur_id: number;
  customer_name?: string;
  customer_details: {
    name: string;
    country_code: string;
    id: number;
    mobile_number: string;
    profile_image?: string;
  };
  chauffeur_name?: {
    name: string;
    mobile_number: string;
  };
  driver_locations?: Array<{
    date_time: string;
    latitude: number;
    longitude: number;
    user_id: string;
  }>; // Added driver_locations field

  vehicle_audit?: {
    [key: string]: string | boolean | number | null | undefined;
    vehicle_color?: string;
    spare_tire?: boolean;
    ride_id?: string;
    antenna?: boolean;
    timestamp?: string;
    vehicle_model?: string;
    chassis_no?: string;
    vehicleMarkingImageUrl?: string;
    fire_extinguisher?: boolean;
    registration_card?: boolean;
    wheel_cap?: boolean;
    signatureImageUrl?: string;
    odometer_reading?: number;
    rta_due_date?: string;
    vehicle_brand?: string;
    toolkit?: boolean;
    wiper?: boolean;
    horn?: boolean;
    jack?: boolean;
  
}
}

export interface RideActionResponse {
  success: boolean;
  status: number;
  message: string;
  data?: any;
  error?: string;
}

export interface chauffeurRideDetails {
  chauffeur_name: string;
  final_price_calculation: {
    mandatory_charges: {
      total: number;
      breakdown: Record<string, any>;
    };
    total_after_discount: number;
    appliedCoupons: any[];
    rates: {
      base_fare: number;
      per_hour: number;
      half_day: number;
      per_min: number;
      full_day: number;
    };
    vat: number;
    final_total_amount: number;
    base_fare: number;
    estimated_total_amount: number;
    previous_balance: number;
    couponErrors: any[];
    other_charges: {
      total: number;
      breakdown: Record<string, any>;
    };
    isCouponApplied: boolean;
    coupon_discount: number;
  };
  planned_end_time: string;
  scheduled_pickup?: boolean;
  hours_booked?: number | null;
  otp: string;
  pd_number?: number;
  pd_name?: string;
  driver_details?: string;
  estimated_time_in_minutes: number;
  requested_drop: {
    lat: number;
    long: number;
  };
  paymentDetails: {
    payment_method: string;
    card: any;
  };
  status: string;
  after_ride_images?: string[];
  estimated_amount: number;
  status_log: Array<{
    datetime: string;
    status: string;
  }>;
  customer_extra_details: {
    instructions: string;
    key_details: string;
    parking_instructions: string;
  };
  requested_drop_point: string;
  all_rides_pk: string;
  lower_chauffeur_name: string;
  ride_type: string;
  vehicleDetails: {
    model?: string;
    color: string;
    vehicle_id: string;
    make: string;
    brand: string;
    mobile_number?: string;
    chauffeur_image?: string;
  };
  coupon_ids: any[];
  SK: string;
  ride_id: string;
  slug_id?: string;
  requested_pickup: {
    lat: number;
    long: number;
  };
  is_customer_available: boolean;
  customer_id: string;
  rate_type: string;
  requested_pickup_point: string;
  lower_customer_name: string;
  end_time?: string;
  order_date: string;
  vehicle_id: string;
  organisation_id: string;
  pd_id?: string;
  PK: string;
  chauffeur_id: number;
  chauffeur_number: number;
  customer_name?: string;
  customer_details: {
    name: string;
    country_code: string;
    id: number;
    mobile_number: string;
    profile_image?: string;
  };
}

/**
 * Payload for creating a ride (adjusted for backend requirements).
 */
export interface CreateRidePayload {
  is_customer_available: boolean;
  estimated_time_in_minutes: number;
  hours_booked?: number | null;
  ride_type: "scheduled" | "instant";
  rate_type: "per_min" | "per_hour" | "half_day" | "full_day" | "fixed" | "rta_test" | "garage_ride";
  requested_pickup_point: string;
  requested_drop_point: string;
  requested_pickup: { lat: number; long: number };
  requested_drop: { lat: number; long: number };
  paymentDetails: { payment_method: string };
  vehicleDetails: {
    vehicle_id: string;
    color: string;
    make: string;
    brand: string;
  };
  chauffeur_id: number | null;
  chauffeur_name: string;
  organisation_id: string;
  organisation_ride: boolean;
  scheduled_pickup?: string;
}

/**
 * Response shape for creating a ride.
 */
export interface CreateRideResponse {
  success: boolean;
  status: number;
  message: string;
  details?: string[];
  error?: string;
  data?: {
    ride_id: string;
    [key: string]: any;
  };
}

/**
 * Payload for exporting rides to Excel.
 */
export interface ExportRidesPayload {
  start_date?: string;
  end_date?: string;
}

/**
 * rideService encapsulates all ride-related API calls.
 */
const rideService = {
  getAllRides: async (
    page: number,
    limit: number,
    payload: GetAllRidesPayload
  ): Promise<ApiResponse<RidesResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/get-all-rides/${page}/${limit}`;
    return await apiPostFetcher<RidesResponse>(url, payload, token);
  },

  getAllChauffeurRides: async (
    page: number,
    limit: number,
    payload: GetAllChauffeurRidesPayload
  ): Promise<ApiResponse<RidesResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/get-all-chauffeur-rides/${page}/${limit}`;
    return await apiPostFetcher<RidesResponse>(url, payload, token);
  },

  getChaffeurRideById: async (payload: { ride_id: string }): Promise<ApiResponse<chauffeurRideDetails>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/get-chauffeur-ride-by-id`;
    const response = await apiPostFetcher<chauffeurRideDetails[]>(url, payload, token);
    if (response.success && response.data && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0],
      };
    }
    return {
      success: false,
      data: null,
      status: response.status,
      error: response.error || "No ride details found.",
    };
  },

  getRideById: async (rideId: string): Promise<ApiResponse<RideDetails>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/rides/get-ride-by-id/${rideId}`;
    const response = await apiPostFetcher<RideDetails[]>(url, {}, token);
    if (response.success && response.data && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0],
      };
    }
    return {
      success: false,
      data: null,
      status: response.status,
      error: response.error || "No ride details found.",
    };
  },

  cancelRide: async (rideId: string, customerId: string): Promise<ApiResponse<any>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/rides/cancel`;
    const payload = { ride_id: rideId, customer_id: customerId };
    return await apiPostFetcher<any>(url, payload, token);
  },

  startCustomerRide: async (
    rideId: string,
    customerId: string
  ): Promise<ApiResponse<RideActionResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/rides/start-customer-ride`;
    const payload = { ride_id: rideId, customer_id: customerId };
    return await apiPostFetcher<RideActionResponse>(url, payload, token);
  },

  completeCustomerRide: async (
    rideId: string,
    customerId: string
  ): Promise<ApiResponse<RideActionResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/rides/complete-customer-ride`;
    const payload = { ride_id: rideId, customer_id: customerId };
    return await apiPostFetcher<RideActionResponse>(url, payload, token);
  },

  chauffeurReachedCustomer: async (
    rideId: string,
    customerId: string,
    // chauffeurId: number
  ): Promise<ApiResponse<RideActionResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/rides/chauffeur-reached-customer`;
    const payload = { ride_id: rideId, customer_id: customerId };
    return await apiPostFetcher<RideActionResponse>(url, payload, token);
  },

  chauffeurOnTheWay: async (
    rideId: string,
    customerId: string
  ): Promise<ApiResponse<RideActionResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/rides/chauffeur-on-the-way`;
    const payload = { ride_id: rideId, customer_id: customerId };
    return await apiPostFetcher<RideActionResponse>(url, payload, token);
  },

  adminCancelRide: async (
    rideId: string,
    customerId: string,
    cancellation_origin: 'admin' | 'user',
    cancellation_reason: string // Add cancellation_reason parameter
  ): Promise<ApiResponse<RideActionResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/rides/cancel`;
    const payload = { 
      ride_id: rideId, 
      customer_id: customerId,
      cancellation_origin: cancellation_origin,
      cancellation_reason: cancellation_reason 
    };
    return await apiPostFetcher<RideActionResponse>(url, payload, token);
  },

  createRide: async (
    customerId: number,
    payload: CreateRidePayload
  ): Promise<ApiResponse<CreateRideResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/create-ride-for-customer/${customerId}`;
    return await apiPostFetcher<CreateRideResponse>(url, payload, token);
  },

  createScheduledRide: async (
    customerId: number,
    payload: CreateRidePayload
  ): Promise<ApiResponse<CreateRideResponse>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/create-schedule-ride-from-admin/${customerId}`;
    return await apiPostFetcher<CreateRideResponse>(url, payload, token);
  },
  
  // Add the new export method
  async exportRidesToExcel(payload: ExportRidesPayload): Promise<ApiResponse<Blob>> {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in again.",
      };
    }
  
    const url = `${BASE_URL}/api/admin/export-rides-excel`;
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json(); // Parse the JSON response
        // Use the 'error' field if it exists, otherwise fallback to 'message'
        const errorMessage = errorData.error || errorData.message || "An unknown error occurred.";
        return {
          success: false,
          data: null,
          status: response.status,
          error: errorMessage,
        };
      }
  
      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        status: response.status,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: null,
        error: "An unexpected error occurred. Please try again later.",
      };
    }
  },
   // New method: Cancel Chauffeur-PD Ride
   adminCancelChauffeurPdRide: async (
    ride_id: string,
    chauffeur_id: string
  ): Promise<ApiResponse<any>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/admin-cancel-chauffeur-pd-ride`;
    const payload = { ride_id, chauffeur_id };
    return await apiPostFetcher<any>(url, payload, token);
  },

  // Method to complete cash payment for a ride
  adminCompleteCashPayment: async (
    ride_id: string,
    customer_id: string,
    payment_type: string,
    coupon_ids: number[],
    chauffeur_id: number
  ): Promise<ApiResponse<any>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/admin/admin-cash-payment`;
    const payload = { 
      ride_id, 
      customer_id, 
      payment_type,
      coupon_ids,
      chauffeur_id
    };
    return await apiPostFetcher<any>(url, payload, token);
  },

  // Method to complete card payment for a ride
  adminCompleteCardPayment: async (
    ride_id: string,
    customer_id: string,
    slug_id: string,
    coupon_ids: number[] | string[],
    payment_type = "card"
  ): Promise<ApiResponse<any>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }
    const url = `${BASE_URL}/api/payments/sale-payment`;
    const payload = {
      ride_id,
      slug_id,
      payment_type,
      customer_id,
      coupon_ids,
    };
    return await apiPostFetcher<any>(url, payload, token);
  },

  getUserCardsById: async (
    user_id: string | number
  ): Promise<ApiResponse<any>> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const url = `${BASE_URL}/api/payments/get-user-cards-by-id`;
    const payload = { user_id: user_id.toString() };
    return await apiPostFetcher<any>(url, payload, token);
  },
};

export default rideService;
