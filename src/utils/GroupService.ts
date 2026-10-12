// services/GroupService.ts

import BASE_URL from "@/config/apiConfig";

export interface Group {
  id: number;
  group_name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  users: any[];
}

export interface Member {
  id: number;
  country_code: string;
  mobile_number: string;
  email_id: string;
  first_name: string;
  last_name: string;
  password: string;
  type_id: number;
  role_id: number;
  is_active: boolean;
  status_id: number;
  device_id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all coupon groups.
 */
export async function fetchGroups(token: string | null): Promise<Group[]> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/view`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  const data = await response.json();
  return data.groups || [];
}

/**
 * Fetch members of a given group.
 */
export async function fetchMembers(groupId: number, token: string | null): Promise<Member[]> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/members/view`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ groupId }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch members");
  }
  const data = await response.json();
  return data.members || [];
}

/**
 * Add a member to a group.
 */
export async function addMember(groupId: number, userId: number, token: string | null): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/members/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ groupId, userId }),
  });
  if (!response.ok) {
    throw new Error("Failed to add member");
  }
  const data = await response.json();
  return data.message || "Member added successfully";
}

/**
 * Delete a member from a group.
 */
export async function deleteMember(groupId: number, userId: number, token: string | null): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/members/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ groupId, userId }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete member");
  }
  const data = await response.json();
  return data.message || "Member deleted successfully";
}

/**
 * Delete a group.
 */
export async function deleteGroup(groupId: number, token: string | null): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ groupId }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete group: ${response.status} - ${errorText}`);
  }
  return "Group deleted successfully";
}

/**
 * Edit a group.
 */
export async function editGroup(
  groupId: number,
  group_name: string,
  description: string,
  token: string | null
): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/edit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      groupId,
      group_name,
      description,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to edit group: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data.message || "Group updated successfully";
}