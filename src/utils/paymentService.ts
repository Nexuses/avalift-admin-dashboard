import { apiPostFetcher, ApiResponse } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

/**
 * Interface for a single payment method.
 */
interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
}

/**
 * Corrected Interface for the API response structure.
 */
interface PaymentMethodsApiResponse {
  success: boolean;
  message: string;
  data: {
    paymentMethods: PaymentMethod[];
  };
}

/**
 * Service for handling payment methods for admins.
 */
const paymentService = {
  /**
   * Fetch available payment methods.
   * @returns A promise that resolves to the API response containing the payment methods.
   */
  fetchPaymentMethods: async (): Promise<ApiResponse<PaymentMethodsApiResponse>> => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authorization token is required.");

      const url = `${BASE_URL}/api/payments/select-payment-method`;
      const payload = { is_active: true };

      // Fetch the data
      const response = await apiPostFetcher(url, payload, token);
      console.log("API Response:", response);  // Debug log

      // Access the paymentMethods correctly from response.data.data.paymentMethods
      const paymentMethods = (response as ApiResponse<PaymentMethodsApiResponse>).data?.data?.paymentMethods;
      if (response.success && paymentMethods) {
        return { ...response, data: { success: (response.data as PaymentMethodsApiResponse).success || false, message: (response.data as PaymentMethodsApiResponse).message || "", data: { paymentMethods: paymentMethods || [] } }, error: "" };
      }

      throw new Error(response.error || "Failed to fetch payment methods.");
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return {
        status: 500,
        success: false,
        data: { success: false, message: error instanceof Error ? error.message : "Unknown error occurred", data: { paymentMethods: [] } },
        error: error instanceof Error ? error.message : "Unknown error occurred",
      } as ApiResponse<PaymentMethodsApiResponse>;
    }
  },

  /**
   * Get only payment methods (names, ids, and is_active).
   * @returns A promise that resolves to the payment methods array.
   */
  getPaymentMethodsDetails: async (): Promise<PaymentMethod[]> => {
    const response = await paymentService.fetchPaymentMethods();

    return response.success && response.data?.data?.paymentMethods
      ? response.data.data.paymentMethods
      : [];
  },
};

export { paymentService };
