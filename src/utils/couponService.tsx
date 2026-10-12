// services/couponService.ts
import BASE_URL from "@/config/apiConfig";

export interface Group {
  id: number;
  group_name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  users: any[];
}

/**
 * Fetch the groups.
 */
export async function getGroups(token: string | null): Promise<Group[]> {
  const response = await fetch(`${BASE_URL}/api/coupons/groups/view`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error("Failed to fetch groups");
  const data = await response.json();
  return data.groups || [];
}

/**
 * Fetch coupon data by couponId and transform it for the form.
 */
export async function getCouponData(couponId: number, token: string | null) {
  const response = await fetch(`${BASE_URL}/api/coupons/${couponId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error("Failed to fetch coupon data");
  const data = await response.json();
  return {
    coupon_title: data.coupon_title,
    coupon_code: data.coupon_code,
    max_usage_per_user: data.max_usage_per_user,
    discount_type: data.discount_type,
    coupon_description: data.coupon_description,
    discount_value: parseFloat(data.discount_value),
    max_discount_amount: parseFloat(data.max_discount_amount),
    valid_from: new Date(data.valid_from),
    valid_to: new Date(data.valid_to),
    usage_limit: data.usage_limit,
    is_active: data.is_active,
    organization_id: data.organization_id || null,
    is_combinable: data.is_combinable,
    first_order_only: data.first_order_only,
    min_subtotal: parseFloat(data.min_subtotal),
    max_subtotal: parseFloat(data.max_subtotal),
    applicable_user_groups: (data.applicable_user_groups || []).map((g: any) => g.id),
    no_group_specified: (data.applicable_user_groups?.length || 0) === 0,
  };
}

interface CouponPayload {
  coupon: {
    coupon_title: string;
    coupon_code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount: number;
    valid_from: string;
    valid_to: string;
    usage_limit: number;
    is_active: boolean;
    organization_id: number | null;
    is_combinable: boolean;
    first_order_only: boolean;
    min_subtotal: number;
    max_subtotal: number;
  };
  rules: any[];
  applicable_user_groups: number[];
}

/**
 * Submits the coupon data.
 * If an endpoint is provided, uses PUT (update); otherwise, POST (create).
 */
export async function submitCoupon(
  payload: CouponPayload,
  token: string | null,
  endpoint?: string
) {
  const url = endpoint || `${BASE_URL}/api/coupons/create-coupons`;
  const method = endpoint ? "PUT" : "POST";
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Parse the error response
      const error = new Error(`Operation failed. Status: ${response.status}`);
      (error as any).response = errorData; // Attach the parsed error data
      throw error;
    }

    return response.json();
  } catch (error) {
    throw error;
  }
}
