"use client";

import * as React from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
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
import { Input } from "@/components/ui/input";
import organizationService from "@/utils/organizationSevice";
import { ApiResponse } from "@/utils/apiFetcher";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface OrganizationFormInputs {
  name: string;
  email_id: string;
  address: string;
  country_code: string;
  mobile_number: string;
  logo?: FileList;
}

interface OrganizationDrawerProps {
  onOrganizationCreated?: () => void;
}

export function CreateOrganizationDrawer({
  onOrganizationCreated,
}: OrganizationDrawerProps) {
  const form = useForm<OrganizationFormInputs>({
    defaultValues: {
      name: "",
      email_id: "",
      address: "",
      country_code: "+971",
      mobile_number: "",
      logo: undefined,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const countryCode = useWatch({
    control,
    name: "country_code",
  });

  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const onSubmit: SubmitHandler<OrganizationFormInputs> = async (data) => {
    setLoading(true);

    const trimmedName = data.name.trim();
    const trimmedEmail = data.email_id.trim();

    if (data.country_code === "+971" && data.mobile_number.trim().length !== 9) {
      toast.error("UAE phone number must be exactly 9 digits.");
      setLoading(false);
      return;
    }
    if (data.country_code === "+91" && data.mobile_number.trim().length !== 10) {
      toast.error("Indian phone number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    const fullPhone = data.country_code + data.mobile_number;
    const phoneNumber = parsePhoneNumberFromString(fullPhone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      toast.error("Invalid phone number format.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("email_id", trimmedEmail);
      formData.append("address", data.address);
      formData.append("country_code", data.country_code);
      formData.append("mobile_number", data.mobile_number.trim());

      if (data.logo && data.logo[0]) {
        formData.append("logo", data.logo[0]);
      }

      const response: ApiResponse<any> = await organizationService.createOrganization(formData);
      if (response.success) {
        toast.success("Organization created successfully!");
        reset();
        setIsDrawerOpen(false);
        setLogoPreview(null);
        if (onOrganizationCreated) onOrganizationCreated();
      } else {
        toast.error(response.error || "Failed to create organization.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while creating the organization.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        toast.error("Please upload a PNG or JPEG image.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            reset();
            setLogoPreview(null);
          }
        }}
      >
        <DrawerTrigger asChild>
          <Button className="text-white py-2 px-4 rounded">
            Create Organization
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>Organization Information</DrawerTitle>
              <DrawerDescription>
                Please fill in the details below to create a new organization.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Organization Name */}
                <FormField
                  control={control}
                  name="name"
                  rules={{
                    required: "Organization name is required.",
                    maxLength: { value: 40, message: "Maximum length is 40 characters." },
                    pattern: {
                      value: /^[A-Za-z0-9 ]+$/,
                      message: "Organization name must contain only alphabets, numbers, and spaces.",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter organization name" {...field} maxLength={40} />
                      </FormControl>
                      <FormMessage>{errors.name && errors.name.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Organization Logo */}
                <FormField
                  control={control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Logo</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) => {
                              field.onChange(e.target.files);
                              handleLogoChange(e);
                            }}
                          />
                          {logoPreview && (
                            <div className="mt-2">
                              <img
                                src={logoPreview}
                                alt="Logo Preview"
                                className="h-20 w-20 object-contain rounded"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage>{errors.logo && errors.logo.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={control}
                  name="address"
                  rules={{
                    required: "Address is required.",
                    maxLength: { value: 250, message: "Maximum length is 250 characters." },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Enter address"
                          {...field}
                          className="w-full rounded border border-gray-300 p-2 text-sm"
                          rows={3}
                          maxLength={250}
                        />
                      </FormControl>
                      <FormMessage>{errors.address && errors.address.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Email ID */}
                <FormField
                  control={control}
                  name="email_id"
                  rules={{
                    required: "Email is required.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address.",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} maxLength={40} />
                      </FormControl>
                      <FormMessage>{errors.email_id && errors.email_id.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Country Code and Mobile Number */}
                <div className="flex space-x-6">
                  <FormField
                    control={control}
                    name="country_code"
                    rules={{ required: "Country code is required." }}
                    render={({ field }) => (
                      <FormItem className="size-[5rem]">
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <PhoneInput
                            country="ae"
                            value={field.value}
                            onChange={(_, country: CountryData) =>
                              field.onChange(`+${country.dialCode}`)
                            }
                            inputStyle={{ width: "120%", height: "2.4rem" }}
                            dropdownStyle={{ top: "auto", bottom: "100%" }}
                            enableSearch
                            searchPlaceholder="Search..."
                          />
                        </FormControl>
                        <FormMessage>{errors.country_code && errors.country_code.message}</FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="mobile_number"
                    rules={{
                      required: "Mobile number is required.",
                      validate: (value: string) => {
                        const trimmed = value.trim();
                        if (countryCode === "+971" && trimmed.length !== 9) {
                          return "UAE phone number must be exactly 9 digits.";
                        }
                        if (countryCode === "+91" && trimmed.length !== 10) {
                          return "Indian phone number must be exactly 10 digits.";
                        }
                        const fullPhone = countryCode + trimmed;
                        const phoneNumber = parsePhoneNumberFromString(fullPhone);
                        if (!phoneNumber || !phoneNumber.isValid()) {
                          return "Invalid phone number format.";
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="w-3/4">
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter mobile number"
                            maxLength={
                              countryCode === "+971"
                                ? 9
                                : countryCode === "+91"
                                ? 10
                                : undefined
                            }
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/\D/g, "");
                              field.onChange(numericValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage>{errors.mobile_number && errors.mobile_number.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button type="submit" disabled={loading} className="bg-blue-500 rounded">
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" disabled={loading} className="rounded">
                      Cancel
                    </Button>
                  </DrawerClose>
                </div>
              </form>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </Form>
  );
}