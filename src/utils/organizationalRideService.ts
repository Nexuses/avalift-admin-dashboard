// organizationalRideService.ts
import BASE_URL from "@/config/apiConfig";
import { ApiResponse } from "./apiFetcher";

export interface GetOrgRidesPayload {
  organization_id: number;
  start_date: string;
  end_date: string;
}


/**
 * Fetches organizational rides based on the given payload and auth token.
 *
 * @param payload - Payload containing organization ID and date range.
 * @param token - Authentication token.
 * @returns Promise resolving to an ApiResponse of rides.
 */
export async function fetchOrganizationalRides<T>(
  payload: GetOrgRidesPayload,
  token: string
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}/api/admin/get-organisational-ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.json();
}

export default {
  fetchOrganizationalRides,
};
