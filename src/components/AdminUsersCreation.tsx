"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
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
import AdminUserService from "@/utils/AdminUsersService"; // Adjust the path as needed

interface AdminUserDetails {
  first_name: string;
  last_name: string;
  email_id: string;
  phone: string; // Combined phone field (country code + mobile number)
  password: string;
  role_id: number;
}

interface FormInputs {
  adminUserDetails: AdminUserDetails;
}

interface AdminRole {
  id: number;
  name: string;
}

interface AdminUserDrawerProps {
  onAdminUserCreated?: () => void;
}

export function AdminUserDrawer({ onAdminUserCreated }: AdminUserDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      adminUserDetails: {
        first_name: "",
        last_name: "",
        email_id: "",
        phone: "",
        password: "",
        role_id: 0,
      },
    },
    mode: "onSubmit",
    shouldUnregister: true,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = form;

  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [adminRoles, setAdminRoles] = React.useState<AdminRole[]>([]);
  const [dialCode, setDialCode] = React.useState<string>("+971"); // Default UAE
  const [currentMaxLength, setCurrentMaxLength] = React.useState<number>(13); // Default for UAE: 4 (+971) + 9 digits
  const [selectedCountry, setSelectedCountry] = React.useState<string>("ae"); // Default UAE country code

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  // Fetch admin roles on mount
  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        if (token) {
          const response = await AdminUserService.getAvailableAdminRoles(token);
          const roles = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data.data)
            ? response.data.data
            : [];
          setAdminRoles(roles);
          if (roles.length > 0) {
            form.setValue("adminUserDetails.role_id", 0);
          }
        } else {
          console.warn("Token is missing");
        }
      } catch (error: any) {
        console.error("Error fetching roles:", error);
        toast.error(error?.message || "An error occurred while fetching roles.");
      }
    };
    fetchRoles();
  }, [token, form]);

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);

    let mobile_number = data.adminUserDetails.phone.trim();
    if (mobile_number.startsWith(dialCode)) {
      mobile_number = mobile_number.substring(dialCode.length).trim();
    }
    const codeWithoutPlus = dialCode.slice(1);
    if (mobile_number.startsWith(codeWithoutPlus)) {
      mobile_number = mobile_number.substring(codeWithoutPlus.length).trim();
    }

    const fullPhoneNumber = dialCode + mobile_number;
    if (!isValidPhoneNumber(fullPhoneNumber)) {
      toast.error("Invalid phone number for the selected country");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        first_name: data.adminUserDetails.first_name,
        last_name: data.adminUserDetails.last_name,
        email_id: data.adminUserDetails.email_id,
        country_code: dialCode,
        mobile_number: mobile_number,
        password: data.adminUserDetails.password,
        role_id: data.adminUserDetails.role_id,
      };

      const response = await AdminUserService.createAdminUser(token, payload);
      if (response.success) {
        toast.success(response.message || "Admin user created successfully!");
        reset();
        setIsDrawerOpen(false);
        if (onAdminUserCreated) onAdminUserCreated();
      } else {
        toast.error(response.error || "Failed to create admin user.");
      }
    } catch (err: any) {
      console.error("Error creating admin user:", err);
      toast.error(err?.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsDrawerOpen(false);
  };

  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className="rounded">Create User</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="p-6 border-b">
            <DrawerTitle className="text-xl font-semibold">
              Admin User Information
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Fill in the details below to create a new admin user.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-4 gap-6" noValidate>
              {/* First Name */}
              <FormField
                control={control}
                name="adminUserDetails.first_name"
                rules={{
                  required: "First name is required",
                  maxLength: { value: 20, message: "Max 20 characters" },
                  pattern: {
                    value: /^[A-Za-z]+$/,
                    message: "Only letters allowed",
                  },
                }}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={20} />
                    </FormControl>
                    {isSubmitted && (
                      <FormMessage>{errors.adminUserDetails?.first_name?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={control}
                name="adminUserDetails.last_name"
                rules={{
                  required: "Last name is required",
                  maxLength: { value: 20, message: "Max 20 characters" },
                  pattern: {
                    value: /^[A-Za-z]+( [A-Za-z]+)?$/,
                    message: "Only letters with an optional single space allowed",
                  },
                }}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={20} />
                    </FormControl>
                    {isSubmitted && (
                      <FormMessage>{errors.adminUserDetails?.last_name?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={control}
                name="adminUserDetails.email_id"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email format",
                  },
                }}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" maxLength={40} />
                    </FormControl>
                    {isSubmitted && (
                      <FormMessage>{errors.adminUserDetails?.email_id?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={control}
                name="adminUserDetails.phone"
                rules={{
                  required: "Phone number is required",
                  validate: (value: string) => {
                    let mobile = value;
                    if (mobile.startsWith(dialCode)) {
                      mobile = mobile.substring(dialCode.length).trim();
                    }
                    const codeWithoutPlus = dialCode.slice(1);
                    if (mobile.startsWith(codeWithoutPlus)) {
                      mobile = mobile.substring(codeWithoutPlus.length).trim();
                    }
                    if (!/^\d+$/.test(mobile)) {
                      return "Phone number must contain only digits";
                    }
                    if (selectedCountry === "ae" && mobile.length !== 9) {
                      return "UAE phone number must be exactly 9 digits";
                    }
                    if (selectedCountry === "in" && mobile.length !== 10) {
                      return "Indian phone number must be exactly 10 digits";
                    }
                    const fullPhoneNumber = dialCode + mobile;
                    if (!isValidPhoneNumber(fullPhoneNumber)) {
                      return "Invalid phone number for selected country";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        country="ae"
                        value={field.value}
                        autoFormat={false}
                        onChange={(value: string, country: CountryData) => {
                          field.onChange(value);
                          setSelectedCountry(country.countryCode);
                          if (country.countryCode === "ae") {
                            setCurrentMaxLength(13); // +971 (4) + 9 digits
                          } else if (country.countryCode === "in") {
                            setCurrentMaxLength(13); // +91 (3) + 10 digits
                          } else {
                            setCurrentMaxLength(20); // Reasonable limit for others
                          }
                          setDialCode(`+${country.dialCode}`);
                        }}
                         enableSearch
                          searchPlaceholder="Search..."
                        inputProps={{ maxLength: currentMaxLength }}
                        inputStyle={{ width: "100%" }}
                        dropdownStyle={{ top: "auto", bottom: "100%" }}
                      />
                    </FormControl>
                    
                    {isSubmitted && (
                      <FormMessage>{errors.adminUserDetails?.phone?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={control}
                name="adminUserDetails.password"
                rules={{
                  required: "Password is required",
                  minLength: { value: 6, message: "Must be at least 6 characters" },
                }}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 focus:outline-none"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </FormControl>
                    {isSubmitted && (
                      <FormMessage>{errors.adminUserDetails?.password?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={control}
                name="adminUserDetails.role_id"
                rules={{
                  required: "Role is required",
                  validate: (value) => (value !== 0 ? true : "Please select a role"),
                }}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white shadow-lg max-h-[245px] overflow-auto"
                      >
                        <option value={0} disabled>
                          Select a Role
                        </option>
                        {adminRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.id} - {role.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {isSubmitted && (
                      <FormMessage>{errors.adminUserDetails?.role_id?.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Buttons */}
              <div className="col-span-4 mt-4 flex justify-end gap-4">
                <Button variant="outline" onClick={handleCancel} className="rounded">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="rounded bg-blue-500 text-white">
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
        <DrawerClose />
      </Drawer>
    </Form>
  );
}