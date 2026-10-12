import { apiPostFetcher } from "@/utils/apiFetcher";
import BASE_URL from "@/config/apiConfig";

// Interface for the login response structure
interface AdminLoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    userDetails: any;
    token: string;
    user: {
      name: string;
      email: string;
    };
    access: {
      roles: string[];
      permissions: string[];
      allowedOrganization: string;
    };
  };
}

// Interface for change password response
interface ChangePasswordResponse {
  success: boolean;
  status: number;
  message?: string;
  error?: string;
}



/**
 * Logs in an admin user.
 * @param email - The admin's email address.
 * @param password - The admin's password.
 * @param deviceToken - The FCM token (or device identifier) from the client.
 * @returns A promise that resolves with the admin data or throws an error.
 */
export async function adminLogin(
  email: string,
  password: string,
  deviceToken: string
): Promise<AdminLoginResponse> {
  const url = `${BASE_URL}/api/auth/admin-login`;
  const body = { email_id: email, password, device_id: deviceToken };

  try {
    const response = await apiPostFetcher<AdminLoginResponse>(url, body, "");

    if (!response.success) {
      const errorMessage = response.error || "Login failed. Please try again.";
      throw new Error(errorMessage);
    }

    if (response.data && response.data.data.token) { 
      localStorage.setItem("authToken", response.data.data.token);
      localStorage.setItem("allowedOrganization", response.data.data.access.allowedOrganization || "null");
      localStorage.setItem("roles", JSON.stringify(response.data.data.access.roles || []));
      localStorage.setItem("permissions", JSON.stringify(response.data.data.access.permissions));
      localStorage.setItem("isLoggedIn", "true");
    } else {
      throw new Error("An unexpected error occurred during login");
    }

    return response.data;
  } catch (err) {
    console.error("Error during login:", err);
    throw err;
  }
}

/**
 * Logs out the current admin user by clearing the auth token, allowed organization, and permissions.
 * @returns A promise that resolves when logout is successful.
 */
export async function logout(): Promise<void> {
  const url = `${BASE_URL}/api/auth/logout`;
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.warn("No auth token found. User may already be logged out.");
    localStorage.removeItem("authToken");
    localStorage.removeItem("allowedOrganization");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("driversPageReloaded");
    return;
  }

  try {
    const response = await apiPostFetcher(url, {}, token);
    if (!response.success) {
      const errorMessage = response.error || "Logout failed. Please try again.";
      console.error(`Logout failed: ${errorMessage}`);
    } else {
      console.log("Logged out successfully.");
    }
  } catch (error: any) {
    console.error("Error during logout:", error);
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("allowedOrganization");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("driversPageReloaded");
  }
}

/**
 * Sends a forgot password request for the given admin email.
 * Endpoint: /api/auth/admin-forgot-password
 * @param email - The admin's email address.
 * @returns A promise that resolves with the response data.
 */
export async function adminForgotPassword(email: string): Promise<any> {
  const url = `${BASE_URL}/api/auth/admin-forgot-password`;
  const body = { email };

  try {
    const response = await apiPostFetcher<any>(url, body, "");
    if (!response.success) {
      const errorMessage = response.data.message|| "Login failed. Please try again.";
      throw new Error(errorMessage);
    }
    
    return response.data;
  } catch (err) {
    console.error("Error in adminForgotPassword:", err);
    throw err;
  }
}

/**
 * Verifies the OTP for the admin.
 * Endpoint: /api/auth/admin-verify-otp
 * @param email - The admin's email address.
 * @param otpCode - The OTP code.
 * @param osType - The operating system type (e.g., "mac os").
 * @param deviceId - The device identifier.
 * @param deviceModel - The model of the device.
 * @returns A promise that resolves with the verification response.
 */
export async function adminVerifyOtp(
  email: string,
  otpCode: string,
  osType: string,
  deviceId: string,
  deviceModel: string
): Promise<any> {
  const url = `${BASE_URL}/api/auth/admin-verify-otp`;
  const body = {
    email_id: email,
    otp_code: otpCode,
    os_type: osType,
    device_id: deviceId,
    device_model: deviceModel,
  };

  try {
    const response = await apiPostFetcher<any>(url, body, "");
    if (!response.success) {
      const errorMessage = response.data.message || "OTP verification failed.";
      throw new Error(errorMessage); // ✅ This ensures "Invalid or expired OTP." shows
    }
    return response.data;
  } catch (err) {
    console.error("Error during admin OTP verification:", err);
    throw err;
  }
}



/**
 * Resets the admin's password.
 * Endpoint: /api/admin/admin-reset-password
 * @param email - The admin's email address.
 * @param newPassword - The new password.
 * @returns A promise that resolves with the response data.
 */
export async function adminResetPassword(email: string, newPassword: string): Promise<any> {
  const url = `${BASE_URL}/api/admin/admin-reset-password`; // Replace BASE_URL with actual value
  const token = localStorage.getItem("resetToken") || ""; // Use resetToken instead of authToken
  const body = { email, password: newPassword };

  try {
    const response = await apiPostFetcher<any>(url, body, token); // Assume apiPostFetcher handles the request
    if (!response.success) {
      const errorMessage = response.error || "Password reset failed.";
      throw new Error(errorMessage);
    }
    return response.data;
  } catch (err) {
    console.error("Error during password reset:", err);
    throw err;
  }
}


/**
 * Changes the admin's password.
 * Endpoint: /api/auth/change-password
 * @param oldPassword - The current password.
 * @param newPassword - The new password.
 * @returns A promise that resolves with the response data or throws an error.
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<any> {
  const url = `${BASE_URL}/api/auth/change-password`;
  const token = localStorage.getItem("authToken") || "";
  const body = { old_password: oldPassword, new_password: newPassword };

  try {
    const response = await apiPostFetcher<ChangePasswordResponse>(url, body, token);
    if (!response.success) {
      const errorMessage = response.error || response.data?.message || "Failed to change password.";
      throw new Error(errorMessage);
    }
    return response;
  } catch (err) {
    console.error("Error during password change:", err);
    throw err;
  }
}
