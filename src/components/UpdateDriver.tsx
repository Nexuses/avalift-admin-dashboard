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
import driverService from "@/utils/driverService";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { format, parseISO } from "date-fns";
import { Calendar } from "./Calenderdemo";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUploadDialog } from "./FileUploadDialog";

interface Document {
  name: string;
  url: string;
  type?: string;
}

export interface Driver {
  id: number;
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  type_id: number;
  role_id: number;
  is_active: boolean;
  status_id: number | null;
  device_id: string | null;
  createdAt: string;
  updatedAt: string;
  emirates_id: string;
  emiratesId_validity: string;
  licence_number: string;
  licence_validity: string;
  documents?: Document[];
  erp_chauffeur_code?: string;
  erp_ac_name_cash?: string;
  erp_ac_code_cash?: string;
  erp_ac_code_online?: string;
  erp_ac_name_online?: string;
}

interface DriverDetails {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  country_code: string;
  emirates_id: string;
  emirates_id_validity: string;
  licence_number: string;
  licence_validity: string;
  emirates_id_doc?: File;
  licence_doc?: File;
  erp_chauffeur_code: string;
  erp_ac_name_cash: string;
  erp_ac_code_cash: string;
  erp_ac_code_online: string;
  erp_ac_name_online: string;
}

interface FormInputs {
  id: number;
  driverDetails: DriverDetails;
}

interface UpdateDriverDrawerProps {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
  onDriverUpdated: (updatedDriver: Driver) => void;
}

export function UpdateDriverDrawer({
  driver,
  isOpen,
  onClose,
  onDriverUpdated,
}: UpdateDriverDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      id: 0,
      driverDetails: {
        first_name: "",
        last_name: "",
        email: "",
        mobile_number: "",
        country_code: "+971",
        emirates_id: "",
        emirates_id_validity: "",
        licence_number: "",
        licence_validity: "",
        erp_chauffeur_code: "",
        erp_ac_name_cash: "",
        erp_ac_code_cash: "",
        erp_ac_code_online: "",
        erp_ac_name_online: "",
      },
    },
    mode: "onChange",
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
  const [showEmiratesCalendar, setShowEmiratesCalendar] = React.useState(false);
  const [showLicenseCalendar, setShowLicenseCalendar] = React.useState(false);
  const [emiratesIdFileName, setEmiratesIdFileName] = React.useState<string | null>(null);
  const [licenceFileName, setLicenceFileName] = React.useState<string | null>(null);

  const emiratesCalendarRef = React.useRef<HTMLDivElement>(null);
  const licenseCalendarRef = React.useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmiratesCalendar, showLicenseCalendar]);

  // Pre-populate form with driver data
  React.useEffect(() => {
    if (driver) {
      setValue("id", driver.id);
      setValue("driverDetails.first_name", driver.first_name || "");
      setValue("driverDetails.last_name", driver.last_name || "");
      setValue("driverDetails.email", driver.email_id || "");
      setValue("driverDetails.mobile_number", driver.mobile_number || "");
      setValue("driverDetails.country_code", driver.country_code || "+971");
      setValue("driverDetails.emirates_id", driver.emirates_id || "");
      setValue("driverDetails.emirates_id_validity", driver.emiratesId_validity || "");
      setValue("driverDetails.licence_number", driver.licence_number || "");
      setValue("driverDetails.licence_validity", driver.licence_validity || "");
      setValue("driverDetails.erp_chauffeur_code", driver.erp_chauffeur_code || "");
      setValue("driverDetails.erp_ac_name_cash", driver.erp_ac_name_cash || "");
      setValue("driverDetails.erp_ac_code_cash", driver.erp_ac_code_cash || "");
      setValue("driverDetails.erp_ac_code_online", driver.erp_ac_code_online || "");
      setValue("driverDetails.erp_ac_name_online", driver.erp_ac_name_online || "");

      const emiratesDoc = driver.documents?.find((doc) => doc.type === "emirates_id_doc");
      const licenceDoc = driver.documents?.find((doc) => doc.type === "licence_doc");

// setEmiratesIdFileName(emiratesDoc?.name || null);
// setLicenceFileName(licenceDoc?.name || null); 

      setEmiratesIdFileName(emiratesDoc?.name || null);
      setLicenceFileName(licenceDoc?.name || null);
    }
  }, [driver, setValue]);

  // Watch for country code changes to determine max length
  const watchedCountryCode = useWatch({
    control,
    name: "driverDetails.country_code",
    defaultValue: "+971",
  });
  // const maxLength = watchedCountryCode === "+971" ? 9 : watchedCountryCode === "+91" ? 10 : 15;

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    reset();
    onClose();
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);

    const formattedEmiratesIdValidity = data.driverDetails.emirates_id_validity
      ? format(parseISO(data.driverDetails.emirates_id_validity), "yyyy-MM-dd")
      : "";
    const formattedLicenceValidity = data.driverDetails.licence_validity
      ? format(parseISO(data.driverDetails.licence_validity), "yyyy-MM-dd")
      : "";

    try {
      const driverId = Number(data.id);
      if (isNaN(driverId)) {
        toast.error("Invalid driver ID.");
        return;
      }

      const response = await driverService.updateDriver(token, driverId, {
        firstName: data.driverDetails.first_name,
        lastName: data.driverDetails.last_name,
        emailId: data.driverDetails.email,
        phoneNumber: data.driverDetails.mobile_number,
        countryCode: data.driverDetails.country_code,
        emiratesId: data.driverDetails.emirates_id,
        emiratesId_validity: formattedEmiratesIdValidity,
        licenceNumber: data.driverDetails.licence_number,
        licenceValidity: formattedLicenceValidity,
        emiratesIdFile: data.driverDetails.emirates_id_doc,
        licenceFile: data.driverDetails.licence_doc,
        erp_chauffeur_code: data.driverDetails.erp_chauffeur_code,
        erp_ac_name_cash: data.driverDetails.erp_ac_name_cash,
        erp_ac_code_cash: data.driverDetails.erp_ac_code_cash,
        erp_ac_code_online: data.driverDetails.erp_ac_code_online,
        erp_ac_name_online: data.driverDetails.erp_ac_name_online,
      });

      if (response.success) {
        toast.success("Driver updated successfully!");
        const chauffeursResponse = await driverService.fetchIndividualDrivers();
        if (chauffeursResponse.success && chauffeursResponse.data) {
          const updatedDriver =
            chauffeursResponse.data.find((d: Driver) => d.id === driverId) || driver;
          onDriverUpdated(updatedDriver);
        } else {
          onDriverUpdated(driver);
        }
        reset();
        onClose();
      } else {
        toast.error(response.error || "Failed to update driver.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the driver.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DrawerContent className="max-w-md sm:max-w-full md:max-w-full lg:max-w-full mx-auto">
          <DrawerHeader className="p-6 border-b">
            <DrawerTitle className="text-xl font-semibold">Update Driver</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Modify the driver details below to update their information.
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
                    pattern: { value: /^[A-Za-z]+$/, message: "Only letters allowed" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.first_name?.message}</FormMessage>
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
                    pattern: { value: /^[A-Za-z]+$/, message: "Only letters allowed" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.last_name?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={control}
                  name="driverDetails.email"
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email format",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" maxLength={40} />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.email?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
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
          inputStyle={{ width: "100%", height: "2.2rem" }}
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
              ? 10
              : watchedCountryCode === "+91"
              ? 10
              : 15
          }
          placeholder="Enter number"
          onChange={(event) => {
            const sanitizedValue = event.target.value.replace(/\D/g, "");
            field.onChange(sanitizedValue);
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
                    pattern: { value: /^[0-9]{15}$/, message: "Must be 15 digits" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emirates ID</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={15} />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.emirates_id?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Emirates ID Expiry Date */}
                <FormField
                  control={control}
                  name="driverDetails.emirates_id_validity"
                  rules={{ required: "Emirates Expiry Date is required" }}
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Emirates Expiry Date</FormLabel>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEmiratesCalendar((prev) => !prev)}
                          className={cn("w-full justify-start", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(parseISO(field.value), "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                      {showEmiratesCalendar && (
                        <div ref={emiratesCalendarRef} className="absolute bottom-full left-0 right-0 mb-2 z-20">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) field.onChange(format(date, "yyyy-MM-dd"));
                              setShowEmiratesCalendar(false);
                            }}
                          />
                        </div>
                      )}
                      <FormMessage>{errors.driverDetails?.emirates_id_validity?.message}</FormMessage>
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
                      message: "Must be exactly 7 characters (letters/numbers/hyphens)",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={7} />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.licence_number?.message}</FormMessage>
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
                          className={cn("w-full justify-start", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(parseISO(field.value), "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                      {showLicenseCalendar && (
                        <div ref={licenseCalendarRef} className="absolute bottom-full left-0 right-0 mb-2 z-20">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) field.onChange(format(date, "yyyy-MM-dd"));
                              setShowLicenseCalendar(false);
                            }}
                          />
                        </div>
                      )}
                      <FormMessage>{errors.driverDetails?.licence_validity?.message}</FormMessage>
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
                        <Input {...field} maxLength={50} placeholder="" />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.erp_chauffeur_code?.message}</FormMessage>
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
                        <Input {...field} maxLength={50} placeholder="" />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.erp_ac_name_cash?.message}</FormMessage>
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
                        <Input {...field} maxLength={50} placeholder="" />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.erp_ac_code_cash?.message}</FormMessage>
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
                        <Input {...field} maxLength={50} placeholder="" />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.erp_ac_code_online?.message}</FormMessage>
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
                        <Input {...field} maxLength={50} placeholder="" />
                      </FormControl>
                      <FormMessage>{errors.driverDetails?.erp_ac_name_online?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Emirates ID Document Upload */}
                <FormField
  control={control}
  name="driverDetails.emirates_id_doc"
  render={() => (
    <FormItem className="sm:col-span-2">
      <FormLabel>Emirates ID Document</FormLabel>
      <div className="flex items-center gap-4">
        <FormControl>
          <FileUploadDialog
            onFilesSelected={(files) => {
              if (files.length > 0) {
                setValue("driverDetails.emirates_id_doc", files[0]);
                setEmiratesIdFileName(files[0].name);
              } else {
                setValue("driverDetails.emirates_id_doc", undefined);
                setEmiratesIdFileName(null);
              }
            }}
          />
        </FormControl>
        {emiratesIdFileName && <span className="text-sm">{emiratesIdFileName}</span>}
        {!emiratesIdFileName &&
          driver.documents?.find((doc) => doc.type === "emirates_id_doc") && (
            <a
              href={driver.documents.find((doc) => doc.type === "emirates_id_doc")!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline text-sm"
            >
              {driver.documents.find((doc) => doc.type === "emirates_id_doc")!.name}
            </a>
          )}
      </div>
    </FormItem>
  )}
/>

{/* License Document Upload */}
<FormField
  control={control}
  name="driverDetails.licence_doc"
  render={() => (
    <FormItem className="sm:col-span-2">
      <FormLabel>License Document</FormLabel>
      <div className="flex items-center gap-4">
        <FormControl>
          <FileUploadDialog
            onFilesSelected={(files) => {
              if (files.length > 0) {
                setValue("driverDetails.licence_doc", files[0]);
                setLicenceFileName(files[0].name);
              } else {
                setValue("driverDetails.licence_doc", undefined);
                setLicenceFileName(null);
              }
            }}
          />
        </FormControl>
        {licenceFileName && <span className="text-sm">{licenceFileName}</span>}
        {!licenceFileName &&
          driver.documents?.find((doc) => doc.type === "licence_doc") && (
            <a
              href={driver.documents.find((doc) => doc.type === "licence_doc")!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline text-sm"
            >
              {driver.documents.find((doc) => doc.type === "licence_doc")!.name}
            </a>
          )}
      </div>
    </FormItem>
  )}
/>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-500">
                  {loading ? "Updating..." : "Update"}
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
