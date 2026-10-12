"use client";

import * as React from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import AdminUserService, { UpdateAdminUserPayload } from "@/utils/AdminUsersService";
import {
  extractStoredUserRoleId,
  extractStoredUserRoleName,
  isSuperAdminRoleName,
  parseStoredRoles,
} from "@/utils/roleAccess";

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email_id: string | null;
  country_code: string;
  mobile_number: string;
  role_id: number;
  display_name: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminRole {
  id: number;
  name: string;
}

interface AdminUserDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  role_id?: number;
}

interface FormInputs {
  id: number;
  adminUserDetails: AdminUserDetails;
}

interface UpdateAdminUserDrawerProps {
  adminUser: AdminUser;
  onClose: () => void;
  onUserUpdated: (updatedUser: AdminUser) => void;
}

export function UpdateAdminUserDrawer({
  adminUser,
  onClose,
  onUserUpdated,
}: UpdateAdminUserDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      id: 0,
      adminUserDetails: {
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        country_code: "",
        role_id: undefined,
      },
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [adminRoles, setAdminRoles] = React.useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [rolesFetchFailed, setRolesFetchFailed] = React.useState(false);

  // Watch the country_code to dynamically adjust maxLength
  const countryCode = useWatch({ control, name: "adminUserDetails.country_code" });

  // Set maxLength based on country code
  const maxLength = countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);
  const storedRoles = React.useMemo(
    () => parseStoredRoles(localStorage.getItem("roles")),
    []
  );
  const fallbackUserRoleId = React.useMemo(
    () => extractStoredUserRoleId(localStorage.getItem("userDetails")),
    []
  );
  const fallbackUserRoleName = React.useMemo(
    () => extractStoredUserRoleName(localStorage.getItem("userDetails")),
    []
  );

  React.useEffect(() => {
    if (adminUser) {
      setIsDrawerOpen(true);
      setValue("id", adminUser.id);
      setValue("adminUserDetails.first_name", adminUser.first_name);
      setValue("adminUserDetails.last_name", adminUser.last_name);
      setValue("adminUserDetails.email", adminUser.email_id || "");
      setValue("adminUserDetails.phone_number", adminUser.mobile_number);
      setValue("adminUserDetails.country_code", adminUser.country_code);
      setValue("adminUserDetails.role_id", adminUser.role_id);
    }
  }, [adminUser, setValue]);

  React.useEffect(() => {
    let isMounted = true;

    const normalizeRoles = (rawRoles: unknown[]): AdminRole[] => {
      return rawRoles
        .map((role) => {
          if (!role || typeof role !== "object") {
            return null;
          }

          const roleData = role as { id?: unknown; name?: unknown; display_name?: unknown };
          const roleId =
            typeof roleData.id === "number" ? roleData.id : Number(roleData.id);
          const roleName =
            typeof roleData.name === "string"
              ? roleData.name
              : typeof roleData.display_name === "string"
                ? roleData.display_name
                : "";

          if (!Number.isFinite(roleId) || !roleName.trim()) {
            return null;
          }

          return {
            id: roleId,
            name: roleName.trim(),
          } as AdminRole;
        })
        .filter((role): role is AdminRole => role !== null);
    };

    const fetchAvailableRoles = async () => {
      if (!token || !isDrawerOpen) {
        return;
      }

      setRolesLoading(true);
      setRolesFetchFailed(false);

      try {
        const response = await AdminUserService.getAvailableAdminRoles(token);
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch role options.");
        }

        const responseData = response.data as { data?: unknown } | null;
        const rawRoles = Array.isArray(response.data)
          ? response.data
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

        const normalizedRoles = normalizeRoles(rawRoles);

        if (isMounted) {
          setAdminRoles(normalizedRoles);
          setValue("adminUserDetails.role_id", adminUser.role_id);
        }

        if (normalizedRoles.length === 0) {
          if (isMounted) {
            setRolesFetchFailed(true);
          }
          toast.error("Role options are unavailable. You can still update other fields.");
        }
      } catch (error: unknown) {
        if (isMounted) {
          setAdminRoles([]);
          setRolesFetchFailed(true);
        }
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Role options are unavailable. You can still update other fields.";
        toast.error(
          errorMessage
        );
      } finally {
        if (isMounted) {
          setRolesLoading(false);
        }
      }
    };

    fetchAvailableRoles();

    return () => {
      isMounted = false;
    };
  }, [adminUser.id, adminUser.role_id, isDrawerOpen, setValue, token]);

  const currentUserIsSuperAdmin = React.useMemo(() => {
    if (storedRoles.some(isSuperAdminRoleName)) {
      return true;
    }

    if (fallbackUserRoleName && isSuperAdminRoleName(fallbackUserRoleName)) {
      return true;
    }

    if (fallbackUserRoleId === null) {
      return false;
    }

    const currentUserRole = adminRoles.find((role) => role.id === fallbackUserRoleId);
    return currentUserRole ? isSuperAdminRoleName(currentUserRole.name) : false;
  }, [adminRoles, fallbackUserRoleId, fallbackUserRoleName, storedRoles]);

  const targetRoleName = React.useMemo(() => {
    const targetRole = adminRoles.find((role) => role.id === adminUser.role_id);
    return targetRole?.name || adminUser.display_name || "";
  }, [adminRoles, adminUser.display_name, adminUser.role_id]);

  const targetIsSuperAdmin = React.useMemo(() => {
    return isSuperAdminRoleName(targetRoleName);
  }, [targetRoleName]);

  const canEditRole = React.useMemo(() => {
    return (
      currentUserIsSuperAdmin &&
      !targetIsSuperAdmin &&
      !rolesFetchFailed &&
      adminRoles.length > 0
    );
  }, [adminRoles.length, currentUserIsSuperAdmin, rolesFetchFailed, targetIsSuperAdmin]);

  const roleRestrictionMessage = React.useMemo(() => {
    if (rolesLoading) {
      return "Loading role options.";
    }

    if (rolesFetchFailed || adminRoles.length === 0) {
      return "Role options are unavailable. You can still update other fields.";
    }

    if (!currentUserIsSuperAdmin) {
      return "Only super admin can change user roles.";
    }

    if (targetIsSuperAdmin) {
      return "Super admin role cannot be changed.";
    }

    return "";
  }, [
    adminRoles.length,
    currentUserIsSuperAdmin,
    rolesFetchFailed,
    rolesLoading,
    targetIsSuperAdmin,
  ]);

  const handleCancel = () => {
    reset();
    setIsDrawerOpen(false);
    onClose();
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    try {
      const userId = Number(data.id);
      if (isNaN(userId)) {
        toast.error("Invalid user ID.");
        return;
      }

      const cleanedPhone = data.adminUserDetails.phone_number.replace(/\D/g, "");
      const fullPhone = data.adminUserDetails.country_code + cleanedPhone;
      if (!isValidPhoneNumber(fullPhone)) {
        toast.error("Invalid phone number format.");
        return;
      }

      const payload = {
        first_name: data.adminUserDetails.first_name,
        last_name: data.adminUserDetails.last_name,
        email_id: data.adminUserDetails.email,
        mobile_number: cleanedPhone,
        country_code: data.adminUserDetails.country_code,
      } as UpdateAdminUserPayload;

      const roleId = data.adminUserDetails.role_id;
      if (canEditRole && typeof roleId === "number" && roleId > 0) {
        payload.role_id = roleId;
      }

      const response = await AdminUserService.updateAdminUser(token, userId, payload);

      if (response.success) {
        toast.success(response.message || "Admin user updated successfully!");
        const selectedRole = payload.role_id
          ? adminRoles.find((role) => role.id === payload.role_id)
          : null;
        const updatedUser: AdminUser = {
          ...adminUser,
          first_name: data.adminUserDetails.first_name,
          last_name: data.adminUserDetails.last_name,
          email_id: data.adminUserDetails.email,
          mobile_number: cleanedPhone,
          country_code: data.adminUserDetails.country_code,
          role_id: payload.role_id ?? adminUser.role_id,
          display_name: selectedRole?.name ?? adminUser.display_name,
          is_active: adminUser.is_active,
          createdAt: adminUser.createdAt,
          updatedAt: adminUser.updatedAt,
        };
        onUserUpdated(updatedUser);
        reset();
        setIsDrawerOpen(false);
        onClose();
      } else {
        toast.error(response.error || "Failed to update admin user.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while updating the admin user.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            onClose();
          }
        }}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Update Admin User</DrawerTitle>
              <DrawerDescription>
                Update user details. Role can be changed only by super admin for non-super-admin users.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <FormField
                  control={control}
                  name="adminUserDetails.first_name"
                  rules={{
                    required: "First name is required",
                    maxLength: { value: 20, message: "Maximum 20 characters allowed" },
                    pattern: { value: /^[A-Za-z]+$/, message: "Only letters are allowed" },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage>{errors.adminUserDetails?.first_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                {/* Last Name */}
                <FormField
                  control={control}
                  name="adminUserDetails.last_name"
                  rules={{
                    required: "Last name is required",
                    maxLength: { value: 20, message: "Maximum 20 characters allowed" },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage>{errors.adminUserDetails?.last_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                {/* Email */}
                <FormField
                  control={control}
                  name="adminUserDetails.email"
                  rules={{
                    required: "Email is required",
                    maxLength: { value: 40, message: "Maximum 40 characters allowed" },
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email format",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" autoComplete="new-email" maxLength={40}/>
                      </FormControl>
                      <FormMessage>{errors.adminUserDetails?.email?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                {/* Country Code & Phone Number */}
                <div className="col-span-3 grid grid-cols-3">
                  <FormField
                    control={control}
                    name="adminUserDetails.country_code"
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
                             enableSearch
                            searchPlaceholder="Search..."
                            inputStyle={{ width: "120%", height: "2.4rem" }}
                            dropdownStyle={{ top: "auto", bottom: "100%" }}
                          />
                        </FormControl>
                        <FormMessage>{errors.adminUserDetails?.country_code?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="adminUserDetails.phone_number"
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
                      <FormItem className="col-span-2">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter mobile number"
                            maxLength={maxLength} // Restrict keyboard input
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        
                        <FormMessage>{errors.adminUserDetails?.phone_number?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                </div>
                {/* Role */}
                <FormField
                  control={control}
                  name="adminUserDetails.role_id"
                  rules={
                    canEditRole
                      ? {
                          validate: (value) => {
                            const isValidSelection = adminRoles.some((role) => role.id === value);
                            return isValidSelection || "Please select a valid role";
                          },
                        }
                      : undefined
                  }
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        {canEditRole ? (
                          <select
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-full rounded border border-gray-300 p-2 text-sm"
                            disabled={rolesLoading}
                          >
                            <option value="" disabled>
                              Select a role
                            </option>
                            {adminRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.id} - {role.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type="text"
                            readOnly
                            disabled
                            value={`${adminUser.role_id} - ${targetRoleName || adminUser.display_name}`}
                          />
                        )}
                      </FormControl>
                      {!canEditRole && roleRestrictionMessage ? (
                        <p className="text-xs text-muted-foreground">{roleRestrictionMessage}</p>
                      ) : null}
                      <FormMessage>{errors.adminUserDetails?.role_id?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                {/* Action Buttons */}
                <div className="col-span-2 mt-4 flex justify-end gap-4">
                  <Button type="submit" disabled={loading} className="bg-blue-500 rounded">
                    {loading ? "Updating..." : "Update"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="rounded">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DrawerContent>
        <DrawerClose />
      </Drawer>
    </Form>
  );
}
