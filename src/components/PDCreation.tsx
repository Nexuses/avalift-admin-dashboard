"use client";

import * as React from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { toast } from "sonner";
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
import PDService from "@/utils/pdService";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FileUploadDialog } from "./FileUploadDialog";
import { Calendar } from "./Calenderdemo";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidPhoneNumber } from "libphonenumber-js";

interface PDDetails {
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_number: string;
  country_code: string;
  role: "pd";
  emirates_id: string;
  emiratesId_validity: string;
  licence_number: string;
  licence_validity: string;
  emirates_id_doc: File | null;
  licence_doc: File | null;
}

interface FormInputs {
  pdDetails: PDDetails;
}

interface PDDrawerProps {
  onPDCreated?: () => void;
}

export function PDDrawer({ onPDCreated }: PDDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      pdDetails: {
        first_name: "",
        last_name: "",
        email_id: "",
        mobile_number: "",
        country_code: "+971",
        role: "pd",
        emirates_id: "",
        emiratesId_validity: "",
        licence_number: "",
        licence_validity: "",
        emirates_id_doc: null,
        licence_doc: null,
      },
    },
    mode: "onSubmit",
    shouldUnregister: true,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitted },
  } = form;

  const countryCode = useWatch({
    control,
    name: "pdDetails.country_code",
    defaultValue: "+971",
  });

  const maxLength = countryCode === "+971" ? 9 : countryCode === "+91" ? 10 : 15;

  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [showEmiratesCalendar, setShowEmiratesCalendar] = React.useState(false);
  const [showLicenseCalendar, setShowLicenseCalendar] = React.useState(false);

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const emiratesCalendarRef = React.useRef<HTMLDivElement>(null);
  const licenseCalendarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmiratesCalendar &&
        emiratesCalendarRef.current &&
        !emiratesCalendarRef.current.contains(event.target as Node)
      ) {
        setShowEmiratesCalendar(false);
      }
      if (
        showLicenseCalendar &&
        licenseCalendarRef.current &&
        !licenseCalendarRef.current.contains(event.target as Node)
      ) {
        setShowLicenseCalendar(false);
      }
    };
    if (showEmiratesCalendar || showLicenseCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmiratesCalendar, showLicenseCalendar]);



  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
  
    const fullPhoneNumber = data.pdDetails.mobile_number.replace(/\D/g, "");
    const countryCode = data.pdDetails.country_code;
    const mobileNumber = fullPhoneNumber;
  
    if (!data.pdDetails.emirates_id_doc || !data.pdDetails.licence_doc) {
      toast.error("Both Emirates ID and License documents are required.");
      setLoading(false);
      return;
    }
  
    // Validate file types and sizes
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB
  
    if (!allowedTypes.includes(data.pdDetails.emirates_id_doc.type)) {
      toast.error("Emirates ID document must be a PNG, JPEG, or PDF file.");
      setLoading(false);
      return;
    }
    if (!allowedTypes.includes(data.pdDetails.licence_doc.type)) {
      toast.error("License document must be a PNG, JPEG, or PDF file.");
      setLoading(false);
      return;
    }
    if (data.pdDetails.emirates_id_doc.size > maxSize) {
      toast.error("Emirates ID document must be less than 5MB.");
      setLoading(false);
      return;
    }
    if (data.pdDetails.licence_doc.size > maxSize) {
      toast.error("License document must be less than 5MB.");
      setLoading(false);
      return;
    }
  
    // Log document details
    console.log("Emirates ID Document:", {
      name: data.pdDetails.emirates_id_doc.name,
      type: data.pdDetails.emirates_id_doc.type,
      size: data.pdDetails.emirates_id_doc.size,
    });
    console.log("License Document:", {
      name: data.pdDetails.licence_doc.name,
      type: data.pdDetails.licence_doc.type,
      size: data.pdDetails.licence_doc.size,
    });
  
    const formattedEmiratesIdValidity = data.pdDetails.emiratesId_validity
      ? format(parseISO(data.pdDetails.emiratesId_validity), "yyyy-MM-dd")
      : "";
    const formattedLicenceValidity = data.pdDetails.licence_validity
      ? format(parseISO(data.pdDetails.licence_validity), "yyyy-MM-dd")
      : "";
  
    try {
      const response = await PDService.createPD(token, {
        firstName: data.pdDetails.first_name,
        lastName: data.pdDetails.last_name,
        emailId: data.pdDetails.email_id,
        phoneNumber: mobileNumber,
        countryCode,
        role: data.pdDetails.role,
        emiratesId: data.pdDetails.emirates_id,
        emiratesId_validity: formattedEmiratesIdValidity,
        licenceNumber: data.pdDetails.licence_number,
        licenceValidity: formattedLicenceValidity,
        documents: {
          emirates_id: data.pdDetails.emirates_id_doc,
          licence: data.pdDetails.licence_doc,
        },
      });
  
      if (response.success) {
        toast.success("PD created successfully!");
        reset();
        setIsDrawerOpen(false);
        if (onPDCreated) onPDCreated();
      } else {
        toast.error(response.error || "Failed to create PD.");
      }
    } catch (err: any) {
      console.error("Error during API call:", err);
      toast.error(err.message || "An error occurred while creating the PD.");
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
          <Button className="rounded">Create PD</Button>
        </DrawerTrigger>
        <DrawerContent className="max-w-md sm:max-w-full md:max-w-full lg:max-w-full mx-auto">
          <DrawerHeader className="p-6 border-b">
            <DrawerTitle className="text-xl font-semibold">PD Information</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Fill in the details below to create a new PD.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <input type="hidden" {...form.register("pdDetails.role")} value="pd" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-6">
                {/* First Name */}
                <FormField
                  control={control}
                  name="pdDetails.first_name"
                  rules={{
                    required: "First Name is required",
                    maxLength: { value: 20, message: "First Name cannot exceed 20 characters" },
                    pattern: { value: /^[A-Za-z]+$/, message: "First Name can only contain letters" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.first_name?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={control}
                  name="pdDetails.last_name"
                  rules={{
                    required: "Last Name is required",
                    maxLength: { value: 20, message: "Last Name cannot exceed 20 characters" },
                    pattern: {
                      value: /^[A-Za-z]+( [A-Za-z]+)?$/,
                      message: "Last Name must contain only letters and can include one space",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.last_name?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={control}
                  name="pdDetails.email_id"
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email format (e.g., example@domain.com)",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" maxLength={40} />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.email_id?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Phone Number: Country Code & Phone Number */}
                <div className="flex gap-4">
                  {/* Country Code */}
                  <FormField
                    control={control}
                    name="pdDetails.country_code"
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
                            inputStyle={{ width: "110%", height: "2.4rem" }}
                            dropdownStyle={{ top: "auto", bottom: "100%" }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="pdDetails.mobile_number"
                    rules={{
                      required: "Phone number is required",
                      validate: (value) => {
                        if (!/^\d+$/.test(value)) {
                          return "Phone number must only contain numbers";
                        }
                        const currentCountryCode = getValues("pdDetails.country_code");
                        const fullPhoneNumber = currentCountryCode + value;
                        if (currentCountryCode === "+971" && value.length !== 9) {
                          return "UAE phone number must be exactly 9 digits";
                        }
                        if (currentCountryCode === "+91" && value.length !== 10) {
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
                            maxLength={maxLength}
                            placeholder="Enter mobile number"
                            onInput={(e) => {
                              const input = e.target as HTMLInputElement;
                              input.value = input.value.replace(/\D/g, "");
                            }}
                          />
                        </FormControl>
                        {isSubmitted && (
                          <FormMessage>{errors.pdDetails?.mobile_number?.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Emirates ID */}
                <FormField
                  control={control}
                  name="pdDetails.emirates_id"
                  rules={{
                    required: "Emirates ID is required",
                    pattern: {
                      value: /^[0-9]{15}$/,
                      message: "Emirates ID must be exactly 15 digits",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emirates ID</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={15} />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.emirates_id?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Emirates Expiry Date */}
                <FormField
                  control={control}
                  name="pdDetails.emiratesId_validity"
                  rules={{ required: "Emirates Expiry Date is required" }}
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Emirates Expiry Date</FormLabel>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEmiratesCalendar((prev) => !prev)}
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 px-3 py-2 text-sm border rounded-md",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(parseISO(field.value), "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                      {showEmiratesCalendar && (
                        <div
                          ref={emiratesCalendarRef}
                          className="absolute bottom-full left-0 right-0 mb-2 rounded-lg z-20"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                            onSelect={(selectedDate) => {
                              if (selectedDate) {
                                const formattedDate = format(selectedDate, "yyyy-MM-dd");
                                field.onChange(formattedDate);
                              }
                              setShowEmiratesCalendar(false);
                            }}
                            initialFocus
                          />
                        </div>
                      )}
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.emiratesId_validity?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* License Number */}
                <FormField
                  control={control}
                  name="pdDetails.licence_number"
                  rules={{
                    required: "License number is required",
                    pattern: {
                      value: /^[A-Za-z0-9-]{7}$/,
                      message: "License number must be exactly 7 characters (letters, numbers, hyphens only)",
                    },
                    minLength: {
                      value: 7,
                      message: "License number must be exactly 7 characters",
                    },
                    maxLength: {
                      value: 7,
                      message: "License number must be exactly 7 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={7} />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.licence_number?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* License Expiry Date */}
                <FormField
                  control={control}
                  name="pdDetails.licence_validity"
                  rules={{ required: "License Expiry Date is required" }}
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>License Expiry Date</FormLabel>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowLicenseCalendar((prev) => !prev)}
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 px-3 py-2 text-sm border rounded-md",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(parseISO(field.value), "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                      {showLicenseCalendar && (
                        <div
                          ref={licenseCalendarRef}
                          className="absolute bottom-full left-0 right-0 mb-2 rounded-lg z-20"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                            onSelect={(selectedDate) => {
                              if (selectedDate) {
                                const formattedDate = format(selectedDate, "yyyy-MM-dd");
                                field.onChange(formattedDate);
                              }
                              setShowLicenseCalendar(false);
                            }}
                            initialFocus
                          />
                        </div>
                      )}
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.licence_validity?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Emirates ID Upload */}
                <FormField
                  control={control}
                  name="pdDetails.emirates_id_doc"
                  rules={{ required: "Emirates ID document is required" }}
                  render={() => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Emirates ID Document</FormLabel>
                      <FormControl>
                        <FileUploadDialog
                          onFilesSelected={(files) => {
                            if (files.length > 0) {
                              setValue("pdDetails.emirates_id_doc", files[0]);
                            }
                          }}
                        />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.emirates_id_doc?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* License Upload */}
                <FormField
                  control={control}
                  name="pdDetails.licence_doc"
                  rules={{ required: "License document is required" }}
                  render={() => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>License Document</FormLabel>
                      <FormControl>
                        <FileUploadDialog
                          onFilesSelected={(files) => {
                            if (files.length > 0) {
                              setValue("pdDetails.licence_doc", files[0]);
                            }
                          }}
                        />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.pdDetails?.licence_doc?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" className="rounded" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-500">
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