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
import organizationService from "@/utils/organizationSevice";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { CountryData } from "react-phone-input-2";

interface Organization {
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string;
  email_id: string;
  organization_logo?: string;
}

interface FormInputs {
  id: number;
  organizationDetails: {
    name: string;
    address: string;
    country_code: string;
    mobile_number: string;
    email_id: string;
    logo_url?: string;
  };
}

interface UpdateOrganizationDrawerProps {
  organization: Organization;
  onClose: () => void;
  onOrganizationUpdated: (updatedOrganization: Organization) => void;
}

export function UpdateOrganizationDrawer({
  organization,
  onClose,
  onOrganizationUpdated,
}: UpdateOrganizationDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      id: 0,
      organizationDetails: {
        name: "",
        address: "",
        country_code: "",
        mobile_number: "",
        email_id: "",
        logo_url: "",
      },
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Watch the country_code field to dynamically adjust maxLength
  const countryCode = useWatch({
    control,
    name: "organizationDetails.country_code",
  });

  // Dynamically set maxLength based on the selected country code
  const maxLength = countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  React.useEffect(() => {
    if (organization) {
      setIsDrawerOpen(true);
      setValue("id", organization.id);
      setValue("organizationDetails.name", organization.name || "");
      setValue("organizationDetails.address", organization.address || "");
      setValue("organizationDetails.country_code", organization.country_code || "");
      setValue("organizationDetails.mobile_number", organization.mobile_number || "");
      setValue("organizationDetails.email_id", organization.email_id || "");

      setLogoPreview(organization.organization_logo || null);
    }
  }, [organization, setValue]);

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    reset();
    setIsDrawerOpen(false);
    onClose();
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    try {
      const orgId = Number(data.id);
      if (isNaN(orgId)) {
        toast.error("Invalid organization ID.");
        return;
      }

      const trimmedName = data.organizationDetails.name.trim();

      const payload = {
        name: trimmedName,
        address: data.organizationDetails.address,
        country_code: data.organizationDetails.country_code,
        mobile_number: data.organizationDetails.mobile_number.replace(/\D/g, ""),
        email_id: data.organizationDetails.email_id.trim(),
      };

      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('address', payload.address);
      formData.append('country_code', payload.country_code);
      formData.append('mobile_number', payload.mobile_number);
      formData.append('email_id', payload.email_id);
      const fileList = data.organizationDetails.logo_url as unknown as FileList;
if (fileList && fileList.length > 0) {
  formData.append("logo", fileList[0]); // 
}
      const response = await organizationService.updateOrganization(token, orgId, formData);
      

      if (response.success) {
        toast.success("Organization updated successfully!");
        const updatedOrganization: Organization = {
          ...organization,
          name: trimmedName,
          address: data.organizationDetails.address,
          country_code: data.organizationDetails.country_code,
          mobile_number: data.organizationDetails.mobile_number,
          email_id: data.organizationDetails.email_id,
        };

        onOrganizationUpdated(updatedOrganization);
        reset();
        setIsDrawerOpen(false);
        onClose();
      } else {
        toast.error(response.error || "Failed to update organization.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the organization.");
    } finally {
      setLoading(false);
    }
  };
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>Update Organization</DrawerTitle>
              <DrawerDescription>
                Modify the organization details below.
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-2 gap-4"
                noValidate
              >
                <FormField
                  control={control}
                  name="organizationDetails.name"
                  rules={{
                    required: "Organization name is required",
                    pattern: {
                      value: /^[A-Za-z0-9 ]+$/,
                      message:
                        "Organization name must contain only alphabets, numbers, and spaces.",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Organization Name"
                          maxLength={20}
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.organizationDetails?.name?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="organizationDetails.address"
                  rules={{ required: "Address is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Organization Address"
                          maxLength={250}
                          className="w-full rounded border border-gray-300 p-2"
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.organizationDetails?.address?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />


<FormField
  control={control}
  name="organizationDetails.logo_url"
  render={({ field }) => (
    <FormItem className="col-span-2">
      <FormLabel>Organization Logo</FormLabel>
      <FormControl>
        <div>
          <Input
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (!["image/png", "image/jpeg"].includes(file.type)) {
                toast.error("Only PNG and JPEG images are allowed.");
                return;
              }

              if (file.size > 2 * 1024 * 1024) {
                toast.error("Image size should be less than 2MB.");
                return;
              }

              field.onChange(e.target.files); // ✅ set FileList in RHF

              const reader = new FileReader();
              reader.onload = () => {
                setLogoPreview(reader.result as string);
              };
              reader.readAsDataURL(file);
            }}
          />
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="mt-2 h-20 w-20 object-contain rounded"
            />
          )}
        </div>
      </FormControl>
    </FormItem>
  )}
/>

                <FormField
                  control={control}
                  name="organizationDetails.email_id"
                  rules={{ required: "Email Id is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Email ID"
                          maxLength={40}
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.organizationDetails?.email_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <div className="col-span-3 grid grid-cols-4">
                  <FormField
                    control={control}
                    name="organizationDetails.country_code"
                    render={({ field }) => (
                      <FormItem className="size-[5rem]">
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <PhoneInput
                            country="ae"
                            value={field.value}
                            onChange={(_, data: CountryData) =>
                              field.onChange(`+${data.dialCode}`)
                            }
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
                    name="organizationDetails.mobile_number"
                    rules={{
                      required: "Mobile number is required",
                      validate: (value: string) => {
                        const countryCode = getValues("organizationDetails.country_code");
                        const fullPhoneNumber = countryCode + value;
                        if (countryCode === "+971" && value.length !== 9) {
                          return "UAE phone number must be exactly 9 digits.";
                        }
                        if (countryCode === "+91" && value.length !== 10) {
                          return "Indian phone number must be exactly 10 digits.";
                        }
                        return isValidPhoneNumber(fullPhoneNumber) || "Invalid phone number.";
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter mobile number"
                            maxLength={maxLength} // Dynamic maxLength based on country code
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/\D/g, "");
                              field.onChange(numericValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage>
                          {errors.organizationDetails?.mobile_number?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-2 mt-4 flex justify-end gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-blue-500"
                  >
                    {loading ? "Updating..." : "Update"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
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
