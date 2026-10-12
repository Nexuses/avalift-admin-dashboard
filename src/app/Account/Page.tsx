"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import UserService from "@/utils/userService";
import { toast } from "sonner";
import { logout, changePassword } from "@/utils/authService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Eye, EyeOff } from "lucide-react";
import AdminUserService, { UpdateAdminUserPayload } from "@/utils/AdminUsersService";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";

interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email_id: string;
  country_code: string;
  mobile_number: string;
  images: string | null;
  documents: { name: string; value: string }[];
  role_id: number | null;
}

interface FormData {
  first_name: string;
  last_name: string;
  email_id: string;
  country_code: string;
  mobile_number: string;
}

const AccountPage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const navigate = useNavigate();

  // Change password state variables
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Form setup for Edit Profile
  const form = useForm<FormData>({
    defaultValues: {
      first_name: "",
      last_name: "",
      email_id: "",
      country_code: "",
      mobile_number: "",
    },
  });

  const { control, handleSubmit, reset, setValue, formState: { errors } } = form;

  // Watch country_code to dynamically adjust maxLength
  const countryCode = useWatch({ control, name: "country_code" });
  const maxLength = countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  const togglePasswordVisibility = (field: "old" | "new" | "confirm") => {
    if (field === "old") setShowOldPassword((prev) => !prev);
    if (field === "new") setShowNewPassword((prev) => !prev);
    if (field === "confirm") setShowConfirmNewPassword((prev) => !prev);
  };

  const resetPasswordForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setPasswordError(null);
  };

  const handleChangePasswordSubmit = async () => {
    setPasswordError(null);
    if (!oldPassword) {
      setPasswordError("Old password is required.");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required.");
      return;
    }
    if (!confirmNewPassword) {
      setPasswordError("Confirm new password is required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password changed successfully!");
      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProfileSubmit = async (data: FormData) => {
    setIsEditing(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No token found in localStorage");
      toast.error("Authentication token is missing. Please log in again.");
      setIsEditing(false);
      navigate("/login");
      return;
    }

    if (!user) {
      console.error("User is missing");
      toast.error("User information is missing.");
      setIsEditing(false);
      return;
    }

    const cleanedPhone = data.mobile_number.replace(/\D/g, "");
    const fullPhone = data.country_code + cleanedPhone;
    if (!isValidPhoneNumber(fullPhone)) {
      toast.error("Invalid phone number format.");
      setIsEditing(false);
      return;
    }

    try {
      const payload: UpdateAdminUserPayload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email_id: data.email_id,
        country_code: data.country_code,
        mobile_number: cleanedPhone,
      };

      if (user.role_id !== null && user.role_id !== undefined) {
        payload.role_id = user.role_id;
      }

      const response = await AdminUserService.updateAdminUser(token, user.user_id, payload);
      if (response.success) {
        toast.success("Profile updated successfully!");
        setUser({
          ...user,
          first_name: data.first_name,
          last_name: data.last_name,
          email_id: data.email_id,
          country_code: data.country_code,
          mobile_number: cleanedPhone,
          role_id: user.role_id,
        });
        setShowEditProfileModal(false);
      } else {
        console.error("Update failed:", response.error);
        toast.error(response.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile.");
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = await UserService.fetchUserProfile();
        if (userData && userData.data) {
          const {
            user_id,
            first_name,
            last_name,
            email_id,
            country_code,
            mobile_number,
            images,
            documents,
          } = userData.data;
          // Some responses may use different key names for role; access safely to avoid TS errors
          const role_id = (userData.data as any).role_id ?? (userData.data as any).role ?? null;
          const userProfile: UserProfile = {
            user_id,
            first_name,
            last_name,
            email_id,
            country_code,
            mobile_number,
            images,
            documents: Array.isArray(documents) ? documents : [],
            role_id,
          };
          setUser(userProfile);
          // Set form values
          setValue("first_name", first_name);
          setValue("last_name", last_name);
          setValue("email_id", email_id);
          setValue("country_code", country_code);
          setValue("mobile_number", mobile_number);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [setValue]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      UserService.clearUserProfile();
      navigate("/");
    } catch (err) {
      console.error("Error during logout:", err);
      toast.error("An unexpected error occurred during logout.");
      navigate("/");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const fullName = user ? `${user.first_name} ${user.last_name}` : "";

  return (
    <div className="w-full min-h-screen p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-6 max-w-2xl mx-auto rounded">
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-blue-500 text-white rounded">
            <CardTitle className="text-2xl font-bold text-center">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4 mb-6">
              <img src="/logo.png" alt="Logo" className="h-14 w-14 rounded object-contain bg-white p-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">{fullName}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (user) {
                        setValue("first_name", user.first_name);
                        setValue("last_name", user.last_name);
                        setValue("email_id", user.email_id);
                        setValue("country_code", user.country_code);
                        setValue("mobile_number", user.mobile_number);
                        setShowEditProfileModal(true);
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-gray-600">{user?.email_id}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-gray-600">{user?.country_code} {user?.mobile_number}</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <ul className="space-y-3">
                <li>
                  <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-800 p-0"
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="text-red-600 hover:text-red-800 p-0"
                    onClick={() => setShowLogoutModal(true)}
                  >
                    Log Out
                  </Button>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog
        open={showChangePasswordModal}
        onOpenChange={(open) => {
          if (!open) {
            resetPasswordForm();
          }
          setShowChangePasswordModal(open);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSubmitting}
                className="pr-10"
                placeholder="Enter old password"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-8 h-6 w-6 p-0"
                onClick={() => togglePasswordVisibility("old")}
                disabled={isSubmitting}
              >
                {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                className="pr-10"
                placeholder="Enter new password"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-8 h-6 w-6 p-0"
                onClick={() => togglePasswordVisibility("new")}
                disabled={isSubmitting}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type={showConfirmNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isSubmitting}
                className="pr-10"
                placeholder="Confirm new password"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-8 h-6 w-6 p-0"
                onClick={() => togglePasswordVisibility("confirm")}
                disabled={isSubmitting}
              >
                {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" disabled={isSubmitting} onClick={() => setShowChangePasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePasswordSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Form {...form}>
        <Dialog
          open={showEditProfileModal}
          onOpenChange={(open) => {
            if (!open) {
              reset();
            }
            setShowEditProfileModal(open);
          }}
        >
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleEditProfileSubmit)} noValidate className="grid gap-4 py-4">
              <FormField
                control={control}
                name="first_name"
                rules={{
                  required: "First name is required",
                  maxLength: { value: 20, message: "Maximum 20 characters allowed" },
                  pattern: { value: /^[A-Za-z]+$/, message: "Only letters are allowed" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage>{errors.first_name?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="last_name"
                rules={{
                  required: "Last name is required",
                  maxLength: { value: 20, message: "Maximum 20 characters allowed" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage>{errors.last_name?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="email_id"
                rules={{
                  required: "Email is required",
                  maxLength: { value: 40, message: "Maximum 40 characters allowed" },
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email format",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={isEditing} autoComplete="new-email" maxLength={40} />
                    </FormControl>
                    <FormMessage>{errors.email_id?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-4">
                <FormField
                  control={control}
                  name="country_code"
                  rules={{
                    required: "Country code is required",
                    pattern: {
                      value: /^\+\d{1,3}$/,
                      message: "Country code must start with '+' followed by 1 to 3 digits",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="size-[5rem]">
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <PhoneInput
                          country="ae"
                          value={field.value}
                          onChange={(_, data: CountryData) => {
                            const dialCode = data.dialCode || "971";
                            field.onChange(`+${dialCode}`);
                          }}
                          disabled={isEditing}
                          enableSearch
                          searchPlaceholder="Search..."
                          inputStyle={{ width: "110%", height: "2.4rem" }}
                          dropdownStyle={{ top: "auto", bottom: "100%" }}
                        />
                      </FormControl>
                      <FormMessage>{errors.country_code?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="mobile_number"
                  rules={{
                    required: "Phone number is required",
                    validate: (value) => {
                      if (!/^\d+$/.test(value)) {
                        return "Phone number must only contain numbers";
                      }
                      if (countryCode === "+971" && value.length !== 9) {
                        return "UAE phone number must be exactly 9 digits";
                      }
                      if (countryCode === "+91" && value.length !== 10) {
                        return "Indian phone number must be exactly 10 digits";
                      }
                      const fullPhone = countryCode + value;
                      return isValidPhoneNumber(fullPhone) || "Invalid phone number format";
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="Enter mobile number"
                          maxLength={maxLength}
                          disabled={isEditing}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage>{errors.mobile_number?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isEditing}
                  onClick={() => setShowEditProfileModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditing} className="bg-blue-500 rounded">
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Form>

      {/* Log Out Confirmation Dialog */}
      <Dialog open={showLogoutModal} onOpenChange={() => setShowLogoutModal(false)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <p>Are you sure you want to log out?</p>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setShowLogoutModal(false);
                handleLogout();
              }}
            >
              Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountPage;
