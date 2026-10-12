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
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import OrganizationAdminService from "@/utils/CooperateCustomerService";
import organizationService from "@/utils/organizationSevice";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Organization } from "@/types/organization";

interface CorporateCustomerDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  password: string;
  organizationId: number | string;
  role: "corporate";
}

interface FormInputs {
  customerDetails: CorporateCustomerDetails;
}

interface CorporateCustomerDrawerProps {
  onCustomerCreated: () => void;
  selectedOrg?: Organization | null;
  onEditComplete?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function CorporateCustomerDrawer({
  onCustomerCreated,
  selectedOrg,
  onEditComplete,
  isOpen,
  setIsOpen,
  triggerButton,
}: CorporateCustomerDrawerProps) {
  const defaultValues = {
    customerDetails: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      country_code: "+971",
      password: "",
      organizationId: "",
      role: "corporate" as const,
    },
  };

  const form = useForm<FormInputs>({
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = form;
  const [loading, setLoading] = React.useState(false);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [, setOrgLoading] = React.useState<boolean>(true);
  const [, setPhoneValue] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Watch country code to dynamically restrict phone number length.
  const countryCode = useWatch({
    control,
    name: "customerDetails.country_code",
    defaultValue: "+971",
  });
  const maxLength =
    countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  const token = React.useMemo(
    () => localStorage.getItem("authToken") || "",
    []
  );

  // Fetch organizations
  React.useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setOrgLoading(true);
        const response = await organizationService.fetchAllOrganizations();
        if (response.success && response.data) {
          const orgArray = Array.isArray(response.data)
            ? response.data
            : Array.isArray((response.data as any).data)
            ? (response.data as any).data
            : [];
          setOrganizations(orgArray);
        } else {
          console.error("Error fetching organizations:", response.error);
          setOrganizations([]);
        }
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setOrganizations([]);
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Pre-populate form when the drawer opens.
  React.useEffect(() => {
    if (isOpen) {
      if (selectedOrg) {
        // Edit mode: Populate each field separately.
        setValue("customerDetails.first_name", selectedOrg.first_name || "");
        setValue("customerDetails.last_name", selectedOrg.last_name || "");
        setValue("customerDetails.email", selectedOrg.email_id || "");
        setValue(
          "customerDetails.phone_number",
          selectedOrg.mobile_number || ""
        );
        setValue(
          "customerDetails.country_code",
          selectedOrg.country_code || "+971"
        );
        setPhoneValue(
          (selectedOrg.country_code || "+971") +
            (selectedOrg.mobile_number || "")
        );
        // organizationId is set from selectedOrg id.
        setValue("customerDetails.organizationId", selectedOrg.id.toString());
        // In update mode, password field remains disabled and displays 8 asterisks.
        setValue("customerDetails.password", "********");
      } else {
        // Create mode: Reset to default.
        reset(defaultValues);
      }
    }
  }, [selectedOrg, isOpen, setValue, reset]);

  const handleCancel = () => {
    reset(defaultValues);
    setIsOpen(false);
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    const fullPhoneNumber = data.customerDetails.phone_number.replace(
      /\D/g,
      ""
    );
    const countryCode = data.customerDetails.country_code;
    const mobileNumber = fullPhoneNumber;

    try {
      const payload = {
        firstName: data.customerDetails.first_name,
        lastName: data.customerDetails.last_name,
        emailId: data.customerDetails.email,
        phoneNumber: mobileNumber,
        countryCode: countryCode,
        // For update mode, we won't change the password as it's disabled.
        password: selectedOrg ? "" : data.customerDetails.password || "",
        organizationId: selectedOrg
          ? selectedOrg.id
          : Number(data.customerDetails.organizationId),
      };

      if (selectedOrg) {
        const response = await OrganizationAdminService.updateOrgAdmin(
          token,
          selectedOrg.id,
          {
            email_id: payload.emailId,
            mobile_number: payload.phoneNumber,
            country_code: payload.countryCode,
            first_name: payload.firstName,
            last_name: payload.lastName,
            // Do not update password if not provided.
          }
        );

        if (response.success) {
          toast.success("Corporate customer updated successfully!");
          reset(defaultValues);
          setIsOpen(false);
          onEditComplete?.();
        } else {
          toast.error(response.error || "Failed to update corporate customer.");
        }
      } else {
        const response = await OrganizationAdminService.createOrgAdmin(
          token,
          payload
        );
        if (response.success) {
          toast.success("Corporate customer created successfully!");
          reset(defaultValues);
          setIsOpen(false);
          onCustomerCreated();
        } else {
          toast.error(response.error || "Failed to create corporate customer.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {triggerButton || <Button>Create Organization Customer</Button>}
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>
                {selectedOrg
                  ? "Edit Organization Customer"
                  : "Create Organization Customer"}
              </DrawerTitle>
              <DrawerDescription>
                {selectedOrg
                  ? "Update the details below to edit the organization customer."
                  : "Fill in the details below to create an organization customer."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                autoComplete="off"
                className="grid grid-cols-2 gap-4"
                noValidate
              >
                <input
                  type="text"
                  name="dummy_username"
                  style={{ display: "none" }}
                  autoComplete="username"
                />
                <input
                  type="password"
                  name="dummy_password"
                  style={{ display: "none" }}
                  autoComplete="new-password"
                />

                {/* Always render separate fields for first and last names */}

                <FormField
                  control={control}
                  name="customerDetails.first_name"
                  rules={{
                    required: "First name is required",
                    pattern: {
                      value: /^[A-Za-z0-9]+$/,
                      message: "Only letters and numbers are allowed",
                    },
                    maxLength: {
                      value: 20,
                      message: "Maximum 20 characters allowed",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      <FormMessage>
                        {errors.customerDetails?.first_name?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="customerDetails.last_name"
                  rules={{
                    pattern: {
                      value: /^[A-Za-z0-9]+( [A-Za-z0-9]+)?$/,
                      message:
                        "Only letters and numbers allowed, with an optional single space",
                    },
                    maxLength: {
                      value: 20,
                      message: "Maximum 20 characters allowed",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      <FormMessage>
                        {errors.customerDetails?.last_name?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                {/* If in edit mode, show organization name (read-only) */}
                {selectedOrg && (
                  <FormField
                    control={control}
                    name="customerDetails.organizationId"
                    render={() => (
                      <FormItem className="col-span-2">
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            value={selectedOrg.organization_name}
                            readOnly
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={control}
                  name="customerDetails.email"
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email format",
                    },
                    maxLength: {
                      value: 40,
                      message: "Maximum 40 characters allowed",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={40}
                          autoComplete="new-email"
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.customerDetails?.email?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <div className="col-span-3 grid grid-cols-3">
                  <FormField
                    control={control}
                    name="customerDetails.country_code"
                    render={({ field }) => (
                      <FormItem className="size-[5rem]">
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <PhoneInput
                            country="ae"
                            value={field.value}
                            onChange={(_value, data: CountryData) => {
                              const dialCode = data.dialCode || "971";
                              field.onChange(`+${dialCode}`);
                            }}
                            enableSearch
                            searchPlaceholder="Search..."
                            inputStyle={{ width: "120%", height: "2.4rem" }}
                            dropdownStyle={{ top: "auto", bottom: "100%" }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="customerDetails.phone_number"
                    rules={{
                      required: "Phone number is required",
                      validate: (value) => {
                        if (!/^\d+$/.test(value)) {
                          return "Phone number must only contain numbers";
                        }
                        const currentCountryCode = getValues(
                          "customerDetails.country_code"
                        );
                        const fullPhoneNumber = currentCountryCode + value;
                        if (
                          currentCountryCode === "+971" &&
                          value.length !== 9
                        ) {
                          return "UAE phone number must be exactly 9 digits";
                        }
                        if (
                          currentCountryCode === "+91" &&
                          value.length !== 10
                        ) {
                          return "Indian phone number must be exactly 10 digits";
                        }
                        if (!isValidPhoneNumber(fullPhoneNumber)) {
                          return "Invalid phone number format for the selected country";
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            maxLength={maxLength} // Dynamic maxLength based on country code
                            placeholder="Enter mobile number"
                            onInput={(e) => {
                              const input = e.target as HTMLInputElement;
                              input.value = input.value.replace(/\D/g, "");
                            }}
                          />
                        </FormControl>
                        <FormMessage>
                          {errors.customerDetails?.phone_number?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="customerDetails.password"
                  rules={{
                    required: selectedOrg ? false : "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters long",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            maxLength={20}
                            disabled={!!selectedOrg}
                            value={selectedOrg ? "********" : field.value}
                            className="pr-10"
                          />
                          {!selectedOrg && (
                            <button
                              type="button"
                              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowPassword((prev) => !prev)}
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.67-3.153M6.206 6.206A9.969 9.969 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.969 9.969 0 01-1.67 3.153M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3l18 18"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage>
                        {errors.customerDetails?.password?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                {!selectedOrg && (
                  <FormField
                    control={control}
                    name="customerDetails.organizationId"
                    rules={{
                      required: "Organization is required",
                    }}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Organization</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an Organization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(organizations) &&
                              organizations.map((org) => (
                                <SelectItem
                                  key={org.id}
                                  value={org.id.toString()}
                                >
                                  {org.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage>
                          {errors.customerDetails?.organizationId?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                )}

                <div className="col-span-2 mt-4 flex justify-end gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-blue-500"
                  >
                    {loading
                      ? "Submitting..."
                      : selectedOrg
                      ? "Update"
                      : "Submit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="rounded"
                  >
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
