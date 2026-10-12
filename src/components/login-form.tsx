"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import {
  adminLogin,
  adminForgotPassword,
  adminVerifyOtp,
  adminResetPassword,
} from "@/utils/authService";
import { requestFirebaseNotificationPermission } from "../../firebase-config";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({
  className,
  onLoginSuccess,
  ...props
}: React.ComponentPropsWithoutRef<"form"> & LoginFormProps) {
  // Login form states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotEmailError, setForgotEmailError] = useState<string | null>(null);

  // OTP modal states
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string | null>(null);

  // Reset password modal states
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // Reusable email validation
  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    if (email.length >= 40) return false;
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
      return false;
    return true;
  };

  // Validate email for login and update error state accordingly
  const validateLoginEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Email is required.");
      return false;
    }
    if (email.length >= 40) {
      setEmailError("Email must be 40 characters or less.");
      return false;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setEmailError("Invalid email format.");
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validate password for login
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError("Password is required.");
      return false;
    }
    if (password.length > 20) {
      setPasswordError("Password must be 20 characters or less.");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lowerCaseEmail = e.target.value.toLowerCase();
    setEmail(lowerCaseEmail);
    setEmailError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear local storage to ensure no previous session data persists
    localStorage.clear();

    const isEmailValid = validateLoginEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      toast.error("Please correct the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const fcmToken = await requestFirebaseNotificationPermission();
      if (!fcmToken) {
        throw new Error("Failed to get FCM token.");
      }
      const response = await adminLogin(email, password, fcmToken);
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("allowedOrganization", response.data.access.allowedOrganization);
      localStorage.setItem("permissions", JSON.stringify(response.data.access.permissions || []));
      localStorage.setItem("roles", JSON.stringify(response.data.access.roles || []));
      localStorage.setItem("isLoggedIn", "true");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("permissions-updated"));
      }

      toast.success("Logged in successfully!");
      onLoginSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Open forgot password modal and prefill with current email if available.
  const openForgotModal = () => {
    setForgotEmail(email || "");
    setForgotEmailError(null);
    setShowForgotModal(true);
  };

  // Handle changes in the forgot password modal email field.

  // Handle forgot password submission from modal.
  const submitForgotPassword = async () => {
    if (!validateEmail(forgotEmail)) {
      setForgotEmailError("Please enter a valid email.");
      return;
    }
    try {
      setLoading(true);
      const response = await adminForgotPassword(forgotEmail);
      toast.success(
        response.message || "Password reset instructions have been sent to your email."
      );
      setShowForgotModal(false);
      // After forgot password is successful, show the OTP modal.
      setShowOtpModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process forgot password request.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change.
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    setOtpError(null);
  };

  // Validate OTP (for simplicity, ensure it's not empty)
  const validateOtp = (otp: string): boolean => {
    if (!otp) {
      setOtpError("OTP is required.");
      return false;
    }
    return true;
  };

  // Helper to generate or retrieve a simple device ID.
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = Date.now().toString();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  // Determine OS type from the user agent.
  const getOS = (): string => {
    const ua = navigator.userAgent || navigator.vendor || "";
    if (/android/i.test(ua)) return "Android";
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
    return "Web";
  };

  // Handle OTP verification using the adminVerifyOtp endpoint.
  const handleVerifyOtp = async () => {
    if (!validateOtp(otp)) {
      toast.error("Please enter a valid OTP.");
      return;
    }
    try {
      setLoading(true);
      const osType = getOS();
      const deviceId = getDeviceId();
      const deviceModel = navigator.userAgent;
      const response = await adminVerifyOtp(forgotEmail, otp, osType, deviceId, deviceModel);
      
      // Extract the token from the response (adjust key based on actual response structure)
      const resetToken = response.data?.token;
      // Example: assuming token is in response.data.resetToken
      if (resetToken) {
        localStorage.setItem("resetToken", resetToken); // Store the token
      } else {
        throw new Error("No token received from OTP verification");
      }
      
      toast.success(response.message || "OTP verified successfully!");
      setShowOtpModal(false);
      setShowResetModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify OTP.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for reset password fields.
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setResetPasswordError(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setResetPasswordError(null);
  };

  // Validate new password entries.
  const validateNewPassword = (): boolean => {
    if (!newPassword) {
      setResetPasswordError("New password is required.");
      return false;
    }
    if (newPassword.length < 6) {
      setResetPasswordError("Password must be at least 6 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setResetPasswordError("Passwords do not match.");
      return false;
    }
    return true;
  };

  // Handle reset password submission.
  const handleResetPassword = async () => {
    if (!validateNewPassword()) {
      toast.error("Please correct the errors in your new password.");
      return;
    }
    try {
      setLoading(true);
      const response = await adminResetPassword(forgotEmail, newPassword);
      toast.success(response.message || "Password reset successfully!");

      // Clear ALL related form states
      setShowResetModal(false);
      setShowForgotModal(false);
      setShowOtpModal(false);

      // Clear reset-related states
      setOtp("");
      setForgotEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setResetPasswordError(null);
      setOtpError(null);
      setForgotEmailError(null);

      setEmail("");
      setPassword("");
      setEmailError(null);
      setPasswordError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-balance text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email below to login to your account
          </p>
        </div>

        <div className="grid gap-6">
          {/* Email Input */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@example.com"
              required
              value={email}
              onChange={handleEmailChange}
            />
            {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
          </div>

          {/* Password Input */}
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={openForgotModal}
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={handlePasswordChange}
                className="pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-center">Reset Password</h2>
            <div className="grid gap-2">
              <Label htmlFor="forgot-email">Enter your email address:</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="mail@example.com"
                value={forgotEmail}
                readOnly
              />
              {forgotEmailError && <p className="text-red-500 text-sm">{forgotEmailError}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForgotModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitForgotPassword} disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-center">Enter OTP</h2>
            <div className="grid gap-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={handleOtpChange}
              />
              {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowOtpModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerifyOtp} disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-center">Reset Your Password</h2>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 focus:outline-none"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {resetPasswordError && <p className="text-red-500 text-sm">{resetPasswordError}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
