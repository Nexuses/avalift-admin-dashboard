// services/CouponGroupService.ts
import BASE_URL from "@/config/apiConfig";
import { ApiResponse, apiPostFetcher } from "./apiFetcher";

export interface Group {
  id: number;
  group_name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  users: any[];
}

/**
 * Creates a new coupon group.
 *
 * @param payload - The group details (name and description).
 * @param token - The authentication token.
 * @returns A promise that resolves with a new Group object.
 */
export async function createCouponGroup(
  payload: { group_name: string; description: string },
  token: string | null
): Promise<Group> {
  if (!token) {
    throw new Error("Authentication token is missing.");
  }
  
  const url = `${BASE_URL}/api/coupons/groups/add`;
  const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
  
  if (!response.success) {
    throw new Error(response.error || "Failed to create group.");
  }
  
  // Build and return the new group using the API data if available
  const newGroup: Group = {
    id: response.data?.group_id || Date.now(),
    group_name: payload.group_name,
    description: payload.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    users: [],
  };
  
  return newGroup;
}
