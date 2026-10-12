// notificationService.ts
import BASE_URL from "@/config/apiConfig";

export interface RideData {
  ride_id: string;
  pd_country_code: string;
  pd_name: string;
  requested_pickup_long: string;
  pd_id: string;
  pd_mobilenumber: string;
  requested_pickup_point: string;
  requested_pickup_lat: string;
}

export interface Notification {
  recipient_id: string;
  delivery_time: string;
  status: string;
  recipient_type: string;
  notification_type: string;
  messageId: string;
  data: RideData;
  notification_id: string;
  SK: string;
  errorMessage: string | null;
  PK: string;
  body: string;
  title: string;
}

export interface NotificationsResponseData {
  notifications: Notification[];
  totalPages: number;
  currentPage: number;
}

export interface ApiResponse {
  success: boolean;
  status: number;
  data: NotificationsResponseData;
}

export type RecipientType = "individual" | "chauffeur" | "pd";

export interface SendNotificationPayload {
  title: string;
  message: string;
  userType: RecipientType;
}

export interface SendNotificationResponse {
  success: boolean;
  status: number;
  message?: string;
  data?: {
    successCount?: number;
    failureCount?: number;
  };
}

export interface BulkNotificationSummary {
  data: {
    successCount: number;
    failureCount: number;
  };
  delivery_time: string;
  user_type: RecipientType;
  PK: string;
  notification_type: string;
  title: string;
  body: string;
  SK: string;
}

export interface BulkNotificationResponse {
  success: boolean;
  status: number;
  message: string;
  data: BulkNotificationSummary[];
}

/**
 * Fetch notifications with the given page and limit.
 * Uses the auth token from localStorage if not provided.
 */
export async function fetchNotifications(
  page: number = 1,
  limit: number = 10,
  token?: string
): Promise<ApiResponse> {
  const authToken =
    token || (typeof window !== "undefined" && localStorage.getItem("authToken")) || "";
  const response = await fetch(
    `${BASE_URL}/api/admin/notification-list-admin/${page}/${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return await response.json();
}

export async function sendNotification(
  payload: SendNotificationPayload,
  token?: string
): Promise<SendNotificationResponse> {
  const authToken =
    token || (typeof window !== "undefined" && localStorage.getItem("authToken")) || "";

  const response = await fetch(`${BASE_URL}/api/admin/send-bulk-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken ? `Bearer ${authToken}` : "",
    },
    body: JSON.stringify({
      title: payload.title,
      message: payload.message,
      userType: payload.userType,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to send notification";
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore JSON parse errors and use the default message.
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch {
    return {
      success: true,
      status: response.status,
    };
  }
}

export async function fetchBulkNotificationHistory(
  token?: string
): Promise<BulkNotificationResponse> {
  const authToken =
    token || (typeof window !== "undefined" && localStorage.getItem("authToken")) || "";

  const response = await fetch(`${BASE_URL}/api/admin/get-bulk-notification`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken ? `Bearer ${authToken}` : "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bulk notifications");
  }

  return await response.json();
}

export default {
  fetchNotifications,
  sendNotification,
  fetchBulkNotificationHistory,
};
