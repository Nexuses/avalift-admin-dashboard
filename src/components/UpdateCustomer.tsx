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
import customerService from "@/utils/customerService";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { CountryData } from "react-phone-input-2";

interface Customer {
  id: number;
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  customerDetails?: any;
}

interface CustomerDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country_code: string;
}

interface FormInputs {
  id: number;
  customerDetails: CustomerDetails;
}

interface UpdateCustomerDrawerProps {
  customer: Customer;
  onClose: () => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
}

export function UpdateCustomerDrawer({
  customer,
  onClose,
  onCustomerUpdated,
}: UpdateCustomerDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      id: 0,
      customerDetails: {
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        country_code: "",
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

  // Watch the country_code to dynamically set maxLength
  const countryCode = useWatch({ control, name: "customerDetails.country_code" });

  // Set maxLength based on country code
  const maxLength = countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  React.useEffect(() => {
    if (customer) {
      setIsDrawerOpen(true);
      setValue("id", customer.id);
      setValue("customerDetails.first_name", customer.first_name || "");
      setValue("customerDetails.last_name", customer.last_name || "");
      setValue("customerDetails.email", customer.email_id || "");
      setValue("customerDetails.phone_number", customer.mobile_number || "");
      setValue("customerDetails.country_code", customer.country_code || "");
    }
  }, [customer, setValue]);

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    reset();
    setIsDrawerOpen(false);
    onClose();
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    try {
      const customerId = Number(data.id);
      if (isNaN(customerId)) {
        toast.error("Invalid customer ID.");
        return;
      }

      const response = await customerService.updateCustomer(token, customerId, {
        firstName: data.customerDetails.first_name,
        lastName: data.customerDetails.last_name,
        emailId: data.customerDetails.email,
        phoneNumber: data.customerDetails.phone_number.replace(/\D/g, ""),
        countryCode: data.customerDetails.country_code,
      });

      if (response.success) {
        toast.success("Customer updated successfully!");
        const updatedCustomer: Customer = {
          ...customer,
          first_name: data.customerDetails.first_name,
          last_name: data.customerDetails.last_name,
          email_id: data.customerDetails.email,
          mobile_number: data.customerDetails.phone_number,
          country_code: data.customerDetails.country_code,
        };
        onCustomerUpdated(updatedCustomer);
        reset();
        setIsDrawerOpen(false);
        onClose();
      } else {
        toast.error(response.error || "Failed to update customer.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Update Customer</DrawerTitle>
              <DrawerDescription>Modify the customer details below.</DrawerDescription>
            </DrawerHeader>

            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4" noValidate>
                {/* First Name */}
                <FormField
                  control={control}
                  name="customerDetails.first_name"
                  rules={{ required: "First name is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage>{errors.customerDetails?.first_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={control}
                  name="customerDetails.last_name"
                  rules={{ required: "Last name is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage>{errors.customerDetails?.last_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={control}
                  name="customerDetails.email"
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={40} />
                      </FormControl>
                      <FormMessage>{errors.customerDetails?.email?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Phone Number Section */}
                <div className="col-span-3 grid grid-cols-3">
                  {/* Country Code */}
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
                            onChange={(_, data: CountryData) => field.onChange(`+${data.dialCode}`)}
                             enableSearch
                            searchPlaceholder="Search..."
                            inputStyle={{ width: "120%", height: "2.4rem" }}
                            dropdownStyle={{ top: "auto", bottom: "100%" }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Phone Number */}
                  <FormField
                    control={control}
                    name="customerDetails.phone_number"
                    rules={{
                      required: "Phone number is required",
                      validate: (value) => {
                        if (!/^\d+$/.test(value)) {
                          return "Phone number must only contain numbers";
                        }
                        const countryCode = getValues("customerDetails.country_code");
                        if (countryCode === "+971" && value.length !== 9) {
                          return "UAE phone number must be exactly 9 digits.";
                        }
                        if (countryCode === "+91" && value.length !== 10) {
                          return "Indian phone number must be exactly 10 digits.";
                        }
                        const fullPhoneNumber = countryCode + value;
                        return isValidPhoneNumber(fullPhoneNumber) || "Invalid phone number format.";
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
                            maxLength={maxLength} // Dynamic maxLength based on country code
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage>{errors.customerDetails?.phone_number?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

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