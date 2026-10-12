import { ApiResponse, apiPostFetcher } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

interface PaymentMethods {
  Cash: number;
  Card: number;
  Wallet: number;
  POS?: number;
  "Apple-Pay": number,
  // applePay?: number;
}

interface Ride {
  SK: string;
  ride_type: string;
  totalRides:number;
  totalPages:number;
  currentPage:number;
  pageSize:number;

  status: string;
  estimated_time_in_minutes: number;
  estimated_amount: number;
  paymentDetails: {
    payment_method: string;
    card: any;
  };
  requested_drop_point: string;
  lower_chauffeur_name: string;
  vehicleDetails: {
    color: string;
    vehicle_id: string;
    make: string;
    brand: string;
  };
  // Add more fields as needed
}

interface RevenueData {
  totalRevenue: number;
  totalTip: number;
  totalAmountWithoutTip: number;
  paymentMethods: PaymentMethods;
  rides: Ride[];
}

interface RevenueReportPayload {
  start_date?: string;
  end_date?: string;
  chauffeur_id?: number; // Added chauffeur_id in the payload
}
export interface ExportRidesPayload {
  start_date?: string;
  end_date?: string;
  chauffeur_id?: number;
  status?: boolean;
}


const RevenueService = {
  /**
   * Fetch the revenue report from the API using a POST request.
   * Optionally accepts a payload containing parameters such as start_date, end_date, and chauffeur_id.
   * @param payload Optional payload with search parameters.
   * @returns A promise resolving to the API response containing revenue data.
   */
  fetchRevenueReport: async (
    payload?: RevenueReportPayload
  ): Promise<ApiResponse<RevenueData>> => {
    const url = `${BASE_URL}/api/admin/revenue-report`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      return {
        success: false,
        data: {
          totalRevenue: 0,
          totalTip: 0,
          totalAmountWithoutTip: 0,
          paymentMethods: { Cash: 0, Card: 0, Wallet: 0, POS: 0, "Apple-Pay": 0 },
          rides: []
        },
        status: null,
        error: "Authentication token is missing.",
      };
    }

    try {
      // Use the provided payload if available, otherwise send an empty object.
      const response: ApiResponse<any> = await apiPostFetcher(
        url,
        payload || {},
        token
      );

      if (response.success && response.data?.data) {
        const {
          totalRevenue,
          totalTip,
          totalAmountWithoutTip,
          paymentMethods,
          rides,
        } = response.data.data;

        return {
          success: true,
          data: {
            totalRevenue: totalRevenue ?? 0,
            totalTip: totalTip ?? 0,
            totalAmountWithoutTip: totalAmountWithoutTip ?? 0,
            paymentMethods: {
              Cash: paymentMethods?.Cash ?? 0,
              Card: paymentMethods?.Card ?? 0,
              Wallet: paymentMethods?.Wallet ?? 0,
              "Apple-Pay": paymentMethods?.["Apple-Pay"]?? 0,
              POS: paymentMethods?.POS ?? 0, // Default to 0 if missing
            },
            rides: rides || []
          },
          status: response.status,
          error: null,
        };
      }

      return {
        success: false,
        data: {
          totalRevenue: 0,
          totalTip: 0,
          totalAmountWithoutTip: 0,
          paymentMethods: { Cash: 0, Card: 0, Wallet: 0, POS: 0, "Apple-Pay": 0 },
          rides: []
        },
        status: response.status,
        error: response.error || "Failed to fetch revenue report.",
      };
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      return {
        success: false,
        data: {
          totalRevenue: 0,
          totalTip: 0,
          totalAmountWithoutTip: 0,
          paymentMethods: { Cash: 0, Card: 0, Wallet: 0, POS: 0, "Apple-Pay": 0 },
          rides: []
        },
        status: null,
        error: "An error occurred while fetching revenue report.",
      };
    }
  },

  /**
   * Fetch the credited rides from the API using a POST request.
   * This function uses the same payload and response structure as fetchRevenueReport
   * but calls the `/api/admin/get-credited-rides` endpoint.
   * @param payload Optional payload with search parameters.
   * @returns A promise resolving to the API response containing credited rides data.
   */
  fetchCreditedRides: async (
    payload?: RevenueReportPayload
  ): Promise<ApiResponse<RevenueData>> => {
    const url = `${BASE_URL}/api/admin/get-credited-rides`;
    const token = localStorage.getItem("authToken");

    if (!token) {
      return {
        success: false,
        data: {
          totalRevenue: 0,
          totalTip: 0,
          totalAmountWithoutTip: 0,
          paymentMethods: { Cash: 0, Card: 0, Wallet: 0, POS: 0, "Apple-Pay": 0 },
          rides: []
        },
        status: null,
        error: "Authentication token is missing.",
      };
    }

    try {
      // Use the provided payload if available, otherwise send an empty object.
      const response: ApiResponse<any> = await apiPostFetcher(
        url,
        payload || {},
        token
      );

      if (response.success && response.data?.data) {
        const {
          totalRevenue,
          totalTip,
          totalAmountWithoutTip,
          paymentMethods,
          rides,
        } = response.data.data;

        return {
          success: true,
          data: {
            totalRevenue: totalRevenue ?? 0,
            totalTip: totalTip ?? 0,
            totalAmountWithoutTip: totalAmountWithoutTip ?? 0,
            paymentMethods: {
              Cash: paymentMethods?.Cash ?? 0,
              Card: paymentMethods?.Card ?? 0,
              Wallet: paymentMethods?.Wallet ?? 0,
              POS: paymentMethods?.POS ?? 0,
              "Apple-Pay": paymentMethods?.["Apple-Pay"]?? 0,
            },
            rides: rides || []
          },
          status: response.status,
          error: null,
        };
      }

      return {
        success: false,
        data: {
          totalRevenue: 0,
          totalTip: 0,
          totalAmountWithoutTip: 0,
          paymentMethods: { Cash: 0, Card: 0, Wallet: 0, POS: 0, "Apple-Pay": 0 },
          rides: []
        },
        status: response.status,
        error: response.error || "Failed to fetch credited rides.",
      };
    } catch (error) {
      console.error("Error fetching credited rides:", error);
      return {
        success: false,
        data: {
          totalRevenue: 0,
          totalTip: 0,
          totalAmountWithoutTip: 0,
          paymentMethods: { Cash: 0, Card: 0, Wallet: 0, POS: 0, "Apple-Pay": 0 },
          rides: []
        },
        status: null,
        error: "An error occurred while fetching credited rides.",
      };
    }
  },
  // Add the new export method
  async exportRevenueRidesToExcel(payload: ExportRidesPayload): Promise<ApiResponse<Blob>> {
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
  
    // Merge extra fields into the payload, ensuring "status" is always true.
    const exportPayload = { ...payload, status: true };
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(exportPayload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
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
  }
};

export default RevenueService;
