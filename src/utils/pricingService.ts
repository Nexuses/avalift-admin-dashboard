// services/pricingService.ts

import { apiPostFetcher, apiGetFetcher,ApiResponse, apiPatchFetcher } from "./apiFetcher"; // Adjust the import path to match your project
import BASE_URL from "@/config/apiConfig"; // Adjust the import path based on your project structure

/**
 * Interface for a single mandatory charge item.
 */
interface MandatoryCharge {
  isPercentage: boolean;
  value: string;
}

/**
 * Interface representing the payload structure required for pricing creation.
 */
interface PricingPayload {
  organization_id: number;
  currency: string;
  effective_from: string; // Should be in ISO format: new Date(effectiveFrom).toISOString()
  effective_to: string;   // Should be in ISO format: new Date(effectiveTo).toISOString()
  is_active: boolean;
  mandatory_charges: Record<string, MandatoryCharge>;
  other_charges: Record<string, MandatoryCharge>;
  rates: {
    per_min: number;
    // per_hour: number;
  };
}

/**
 * Service to manage pricing-related API calls.
 */
const pricingService = {
  /**
   * Add new pricing.
   * @param payload - The pricing payload
   * @param token - Authorization token (e.g., from localStorage)
   * @returns A Promise resolving to an ApiResponse object.
   */
  addPricing: async (
    payload: PricingPayload,
    token: string
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/admin/add-pricing`;
    return apiPostFetcher(url, payload, token);
  },

  /**
   * Fetch fares for a specific organization.
   * @param organizationId - Organization ID to fetch fares for
   * @param token - Authorization token (e.g., from localStorage)
   * @returns A Promise resolving to an ApiResponse object.
   */
  showFares: async (
   
    token: string
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/admin/show-fares`;
    return apiGetFetcher(url, token);
  },

  /**
 * Fetch a single fare by organization_id and pricing_id.
 * @param payload - Contains organization_id and pricing_id
 * @param token - Auth token
 */
getFareDetails: async (
  payload: { organization_id: number; pricing_id: string },
  token: string
): Promise<ApiResponse<any>> => {
  const url = `${BASE_URL}/api/admin/get-pricing`;
  return apiPostFetcher(url, payload, token);
},

updatePricing: async (
  payload: Record<string, any>,
  token: string
): Promise<ApiResponse<any>> => {
  const url = `${BASE_URL}/api/admin/update-pricing`;
  return apiPatchFetcher(url, payload, token); // ✅ Use PATCH
},



};



export default pricingService;
