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
import { Input } from "@/components/ui/input";
import customerService from "@/utils/customerService";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { CountryData } from "react-phone-input-2";
import { isValidPhoneNumber } from "libphonenumber-js";

interface CustomerDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  role: "individual" | "corporate";
}

interface FormInputs {
  customer_id: string;
  is_active: "true" | "false";
  customerDetails: CustomerDetails;
}

interface CustomerDrawerProps {
  onCustomerCreated: () => void;
}

export function CustomerDrawer({ onCustomerCreated }: CustomerDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      customer_id: "",
      is_active: "true",
      customerDetails: {
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        country_code: "+971",
        role: "individual",
      },
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = form;

  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Watch the country_code field to dynamically adjust maxLength
  const countryCode = useWatch({
    control,
    name: "customerDetails.country_code",
  });

  // Dynamically set maxLength based on the selected country code
  const maxLength = countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    reset();
    setIsDrawerOpen(false);
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);

    const fullPhoneNumber = data.customerDetails.phone_number.replace(/\D/g, "");
    const countryCode = data.customerDetails.country_code;
    const mobileNumber = fullPhoneNumber;

    try {
      const response = await customerService.createCustomer(token, {
        firstName: data.customerDetails.first_name,
        lastName: data.customerDetails.last_name,
        emailId: data.customerDetails.email,
        phoneNumber: mobileNumber,
        countryCode,
        role: data.customerDetails.role,
      });

      if (response.success) {
        toast.success("Customer created successfully!");
        reset();
        setIsDrawerOpen(false);
        onCustomerCreated();
      } else {
        toast.error(response.error || "Failed to create customer.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while creating the customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className="rounded">Create Customer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Customer Information</DrawerTitle>
              <DrawerDescription>Fill in the details below.</DrawerDescription>
            </DrawerHeader>

            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4" noValidate>
                {/* First Name */}
                <FormField
                  control={control}
                  name="customerDetails.first_name"
                  rules={{
                    required: "First name is required",
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: "Only letters are allowed",
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
                      <FormMessage>{errors.customerDetails?.first_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={control}
                  name="customerDetails.last_name"
                  rules={{
                    required: "Last name is required",
                    pattern: {
                      value: /^[A-Za-z]+( [A-Za-z]+)?$/,
                      message: "Last Name must contain only letters and can include one space for a second name",
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
                      <FormMessage>{errors.customerDetails?.last_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Email */}
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
                        <Input {...field} maxLength={40} />
                      </FormControl>
                      <FormMessage>{errors.customerDetails?.email?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Phone Number: Country Code & Phone Number */}
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
                        // Ensure only numeric characters
                        if (!/^\d+$/.test(value)) {
                          return "Phone number must only contain numbers";
                        }

                        const countryCode = getValues("customerDetails.country_code");
                        const fullPhoneNumber = countryCode + value;

                        // Length validation for UAE and India
                        if (countryCode === "+971" && value.length !== 9) {
                          return "UAE phone number must be exactly 9 digits";
                        }
                        if (countryCode === "+91" && value.length !== 10) {
                          return "Indian phone number must be exactly 10 digits";
                        }

                        // Validate phone number format
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
                        <FormMessage>{errors.customerDetails?.phone_number?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="col-span-2 mt-4 flex justify-end gap-4">
                  <Button type="submit" disabled={loading} className="rounded bg-blue-500">
                    {loading ? "Submitting..." : "Submit"}
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