// fareService.ts
import BASE_URL from "@/config/apiConfig";

export interface FarePayload {
  rate_type: string;
  estimated_time_in_minutes: string;
  coupon_ids: any[];
  organisation_id: string;
}

export interface FareResponse {
  success: boolean;
  data?: {
    final_total_amount: number;
  };
  message?: string;
}

/**
 * Calculates the estimated fare.
 *
 * @param payload - The payload for the fare estimation.
 * @param token - Authentication token.
 * @returns The API response.
 */
export async function calculateEstimatedFare(
  payload: FarePayload,
  token: string
): Promise<FareResponse> {
  const response = await fetch(`${BASE_URL}/api/rides/customers/calculate-estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch estimated fare");
  }

  return await response.json();
}

export default { calculateEstimatedFare };
