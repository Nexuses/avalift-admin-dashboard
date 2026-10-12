// vehicleFetcher.ts
import BASE_URL from "@/config/apiConfig";
import { vehicleService } from "./vehicleService";

export interface VehicleResponse {
  success: boolean;
  data: any[]; // Adjust the type based on your vehicle data model
  error?: string;
}

/**
 * Fetches the user ID for organization rides.
 * @param organisation_id - The organization ID.
 * @param token - Auth token.
 * @returns The first user ID from the organization API.
 */
export async function fetchUserIdForOrganisation(
  organisation_id: string,
  token: string
): Promise<number> {
  const response = await fetch(`${BASE_URL}/api/organization/all-users-organizations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orgnanisation_id: organisation_id }),
  });

  const resData = await response.json();
  if (resData.success && resData.data && resData.data.length > 0) {
    return resData.data[0].id;
  }
  throw new Error("Failed to fetch user ID from organization API");
}

/**
 * Fetches vehicles for a ride.
 * If organisationRide is true, it will first fetch the user ID from the organization API;
 * otherwise, it will use the provided selectedCustomerId.
 *
 * @param organisationRide - Boolean indicating if this is an organization ride.
 * @param organisation_id - The organization ID (as a string).
 * @param selectedCustomerId - The selected customer ID (for non-organization rides).
 * @param token - Auth token.
 * @returns The response from vehicleService.getVehicleByUserId.
 */
export async function fetchVehiclesForRide(
  organisationRide: boolean,
  organisation_id: string,
  selectedCustomerId: number,
  token: string
): Promise<VehicleResponse> {
  let idToUse: number | null = null;

  if (organisationRide) {
    // Fetch the user ID from the organization API.
    idToUse = await fetchUserIdForOrganisation(organisation_id, token);
  } else {
    // For non-organization rides, use the selectedCustomerId.
    idToUse = selectedCustomerId;
  }

  if (!idToUse) {
    throw new Error("No valid ID found for vehicle fetch");
  }

  // Fetch vehicles using the determined ID.
  const resp = await vehicleService.getVehicleByUserId(Number(idToUse), token);
  return resp;
}

export default {
  fetchUserIdForOrganisation,
  fetchVehiclesForRide,
};
