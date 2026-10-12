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
import DriverService from "@/utils/driverService";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FileUploadDialog } from "./FileUploadDialog";
import { Calendar } from "./Calenderdemo";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
// import { isValidPhoneNumber } from "libphonenumber-js";

interface DriverDetails {
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_number: string;
  country_code: string;
  role: "chauffeur";
  documents: FileList | null;
  emirates_id: string;
  emiratesId_validity: string;
  licence_number: string;
  licence_validity: string;
  emirates_id_doc: File | null;
  licence_doc: File | null;
  erp_chauffeur_code: string;
  erp_ac_name_cash: string;
  erp_ac_code_cash: string;
  erp_ac_code_online: string;
  erp_ac_name_online: string;
}

interface FormInputs {
  driverDetails: DriverDetails;
}

interface DriverDrawerProps {
  onDriverCreated?: () => void;
}

export function DriverDrawer({ onDriverCreated }: DriverDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      driverDetails: {
        first_name: "",
        last_name: "",
        email_id: "",
        mobile_number: "",
        country_code: "+971",
        role: "chauffeur",
        emirates_id: "",
        emiratesId_validity: "",
        licence_number: "",
        licence_validity: "",
        documents: null,
        emirates_id_doc: null,
        licence_doc: null,
        erp_chauffeur_code: "",
        erp_ac_name_cash: "",
        erp_ac_code_cash: "",
        erp_ac_code_online: "",
        erp_ac_name_online: "",
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

  // Watch for country code changes
const watchedCountryCode = useWatch({
  control,
  name: "driverDetails.country_code",
  defaultValue: "+971",
});

  // Provide a defaultValue to ensure +971 is available on initial render.

  // Set maxLength based on country code: UAE (9) and India (10); default to 15 if neither.

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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmiratesCalendar, showLicenseCalendar]);

  // ✅ onSubmit: send flat files (no nested documents)
const onSubmit: SubmitHandler<FormInputs> = async (data) => {
  setLoading(true);
  const fullPhoneNumber = data.driverDetails.mobile_number.replace(/\D/g, "");
  const countryCode = data.driverDetails.country_code;

  const formattedEmiratesIdValidity = data.driverDetails.emiratesId_validity
    ? format(parseISO(data.driverDetails.emiratesId_validity), "yyyy-MM-dd")
    : "";
  const formattedLicenceValidity = data.driverDetails.licence_validity
    ? format(parseISO(data.driverDetails.licence_validity), "yyyy-MM-dd")
    : "";

  try {
    const response = await DriverService.createDriver(token, {
      firstName: data.driverDetails.first_name,
      lastName: data.driverDetails.last_name,
      emailId: data.driverDetails.email_id,
      phoneNumber: fullPhoneNumber,
      countryCode,
      emiratesId: data.driverDetails.emirates_id,
      emiratesId_validity: formattedEmiratesIdValidity,
      licenceNumber: data.driverDetails.licence_number,
      licenceValidity: formattedLicenceValidity,
      role: "chauffeur",
      erp_chauffeur_code: data.driverDetails.erp_chauffeur_code,
      erp_ac_name_cash: data.driverDetails.erp_ac_name_cash,
      erp_ac_code_cash: data.driverDetails.erp_ac_code_cash,
      erp_ac_code_online: data.driverDetails.erp_ac_code_online,
      erp_ac_name_online: data.driverDetails.erp_ac_name_online,
      // ⬇️ exact keys your backend expects
      emirates_id_doc: data.driverDetails.emirates_id_doc!,
      licence_doc: data.driverDetails.licence_doc!,
    });

    if (response.success) {
      toast.success("Chauffeur created successfully!");
      reset();
      setIsDrawerOpen(false);
      onDriverCreated?.();
    } else {
      toast.error(response.error || "An unknown error occurred");
    }
  } catch (err: any) {
    console.error("Error during API call:", err);
    const errorMessage =
      err?.response?.data?.error || err?.message || "An unknown error occurred";
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // const handleFilesSelected = (files: File[]) => {
  //   const fileList = new DataTransfer();
  //   files.forEach((file) => fileList.items.add(file));
  //   setValue("driverDetails.documents", fileList.files);
  // };

  const handleCancel = () => {
    reset();
    setIsDrawerOpen(false);
  };

  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className="rounded">Create Chauffeur</Button>
        </DrawerTrigger>
        <DrawerContent className="max-w-md sm:max-w-full md:max-w-full lg:max-w-full mx-auto">
          <DrawerHeader className="p-6 border-b">
            <DrawerTitle className="text-xl font-semibold">
              Chauffeur Information
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Fill in the details below to create a new chauffeur.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-6">
                {/* First Name */}
                <FormField
                  control={control}
                  name="driverDetails.first_name"
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
                        <FormMessage>{errors.driverDetails?.first_name?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={control}
                  name="driverDetails.last_name"
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
                        <FormMessage>{errors.driverDetails?.last_name?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={control}
                  name="driverDetails.email_id"
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
                        <Input {...field} type="email" maxLength={40}/>
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.email_id?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Phone Number: Country Code & Phone Number */}
               {/* Country Code */}
                <div className="flex gap-1">
<FormField
  control={control}
  name="driverDetails.country_code"
  render={({ field }) => (
    <FormItem className="w-24">
      <FormLabel>Code</FormLabel>
      <FormControl>
        <PhoneInput
          country={field.value.replace("+", "") || "ae"} // detect flag from code
          value={field.value}
          onChange={(_value, data: CountryData) => {
            const dialCode = data.dialCode || "971";
            field.onChange(`+${dialCode}`); // update just the code
          }}
          enableSearch
          searchPlaceholder="Search..."
          inputStyle={{ width: "100%", height: "2.4rem" }}
          dropdownStyle={{ top: "auto", bottom: "100%" }}
        />
      </FormControl>
    </FormItem>
  )}
/>

{/* Mobile Number */}
<FormField
  control={control}
  name="driverDetails.mobile_number"
  rules={{
    required: "Phone number is required",
    validate: (value) => {
      const currentCountryCode = getValues("driverDetails.country_code");
      if (currentCountryCode === "+971" && value.length !== 9) {
        return "UAE phone number must be exactly 9 digits";
      }
      if (currentCountryCode === "+91" && value.length !== 10) {
        return "Indian phone number must be exactly 10 digits";
      }
      if (value.length < 5) {
        return "Phone number is too short";
      }
      return true;
    },
  }}
  render={({ field }) => (
    <FormItem className="flex-1">
      <FormLabel>Phone Number</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="text"
          maxLength={
            watchedCountryCode === "+971"
              ? 9
              : watchedCountryCode === "+91"
              ? 10
              : 15
          }
          placeholder="Enter number"
          onInput={(e) => {
            const input = e.target as HTMLInputElement;
            input.value = input.value.replace(/\D/g, ""); // allow only digits
          }}
        />
      </FormControl>
      <FormMessage>{errors.driverDetails?.mobile_number?.message}</FormMessage>
    </FormItem>
  )}
/>
</div>
{/* Emirates ID */}
<FormField
  control={control}
  name="driverDetails.emirates_id"
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
        <FormMessage>{errors.driverDetails?.emirates_id?.message}</FormMessage>
      )}
    </FormItem>
  )}
/>
               {/* Emirates ID Upload */}


                {/* Emirates Expiry Date */}
                <FormField
                  control={control}
                  name="driverDetails.emiratesId_validity"
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
                        <FormMessage>{errors.driverDetails?.emiratesId_validity?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* License Number */}
                <FormField
                  control={control}
                  name="driverDetails.licence_number"
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
                        <FormMessage>{errors.driverDetails?.licence_number?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* License Expiry Date */}
                <FormField
                  control={control}
                  name="driverDetails.licence_validity"
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
                        <FormMessage>{errors.driverDetails?.licence_validity?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* ERP Chauffeur Code */}
                <FormField
                  control={control}
                  name="driverDetails.erp_chauffeur_code"
                  rules={{
                    required: "ERP Chauffeur Code is required",
                    maxLength: { value: 50, message: "Maximum 50 characters allowed" },
                    pattern: {
                      value: /^[A-Za-z0-9\s_-]+$/,
                      message: "Use letters, numbers, spaces, hyphens, or underscores only",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>ERP Chauffeur Code</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={50} placeholder="" />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.erp_chauffeur_code?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* ERP AC Name (Cash) */}
                <FormField
                  control={control}
                  name="driverDetails.erp_ac_name_cash"
                  rules={{
                    required: "ERP AC Name (Cash) is required",
                    maxLength: { value: 50, message: "Maximum 50 characters allowed" },
                    pattern: {
                      value: /^[A-Za-z0-9\s_-]+$/,
                      message: "Use letters, numbers, spaces, hyphens, or underscores only",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>ERP AC Name (Cash)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={50} placeholder="" />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.erp_ac_name_cash?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* ERP AC Code (Cash) */}
                <FormField
                  control={control}
                  name="driverDetails.erp_ac_code_cash"
                  rules={{
                    required: "ERP AC Code (Cash) is required",
                    maxLength: { value: 50, message: "Maximum 50 characters allowed" },
                    pattern: {
                      value: /^[A-Za-z0-9\s_-]+$/,
                      message: "Use letters, numbers, spaces, hyphens, or underscores only",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>ERP AC Code (Cash)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={50} placeholder="" />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.erp_ac_code_cash?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* ERP AC Code (Online) */}
                <FormField
                  control={control}
                  name="driverDetails.erp_ac_code_online"
                  rules={{
                    required: "ERP AC Code (Online) is required",
                    maxLength: { value: 50, message: "Maximum 50 characters allowed" },
                    pattern: {
                      value: /^[A-Za-z0-9\s_-]+$/,
                      message: "Use letters, numbers, spaces, hyphens, or underscores only",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>ERP AC Code (Online)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={50} placeholder="" />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.erp_ac_code_online?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* ERP AC Name (Online) */}
                <FormField
                  control={control}
                  name="driverDetails.erp_ac_name_online"
                  rules={{
                    required: "ERP AC Name (Online) is required",
                    maxLength: { value: 50, message: "Maximum 50 characters allowed" },
                    pattern: {
                      value: /^[A-Za-z0-9\s_-]+$/,
                      message: "Use letters, numbers, spaces, hyphens, or underscores only",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>ERP AC Name (Online)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" maxLength={50} placeholder="" />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.erp_ac_name_online?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Documents Upload */}
                {/* <FormField
                  control={control}
                  name="driverDetails.documents"
                  render={() => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Documents</FormLabel>
                      <FormControl>
                        <FileUploadDialog onFilesSelected={handleFilesSelected} />
                      </FormControl>
                      {isSubmitted && (
                        <FormMessage>{errors.driverDetails?.documents?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                /> */}

<FormField
  control={control}
  name="driverDetails.emirates_id_doc"
  rules={{ required: "Emirates ID document is required" }}
  render={() => (
    <FormItem className="sm:col-span-2">
      <FormLabel>Emirates ID Document</FormLabel>
      <FormControl>
        <FileUploadDialog
          onFilesSelected={(files) => {
            if (files.length > 0) {
              setValue("driverDetails.emirates_id_doc", files[0]);
            }
          }}
        />
      </FormControl>
      {isSubmitted && (
        <FormMessage>
          {errors.driverDetails?.emirates_id_doc?.message}
        </FormMessage>
      )}
    </FormItem>
  )}
/>

{/* License Upload */}
<FormField
  control={control}
  name="driverDetails.licence_doc"
  rules={{ required: "License document is required" }}
  render={() => (
    <FormItem className="sm:col-span-2">
      <FormLabel>License Document</FormLabel>
      <FormControl>
        <FileUploadDialog
          onFilesSelected={(files) => {
            if (files.length > 0) {
              setValue("driverDetails.licence_doc", files[0]);
            }
          }}
        />
      </FormControl>
      {isSubmitted && (
        <FormMessage>
          {errors.driverDetails?.licence_doc?.message}
        </FormMessage>
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
