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
import PDService from "@/utils/pdService";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { format, parseISO } from "date-fns";
import { Calendar } from "./Calenderdemo";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUploadDialog } from "./FileUploadDialog";
import { isValidPhoneNumber } from "libphonenumber-js";

interface Document {
  name: string;
  url: string;
  type?: string;
}

export interface PD {
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
}

interface PdDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  emirates_id: string;
  emirates_id_validity: string;
  licence_number: string;
  licence_validity: string;
  emirates_id_doc?: File | undefined;
  licence_doc?: File | undefined;
}

interface FormInputs {
  id: number;
  pdDetails: PdDetails;
}

interface UpdatePDDrawerProps {
  pd: PD;
  isOpen: boolean;
  onClose: () => void;
  onPDUpdated: (updatedPD: PD) => void;
}

export function UpdatePDDrawer({
  pd,
  isOpen,
  onClose,
  onPDUpdated,
}: UpdatePDDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      id: 0,
      pdDetails: {
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        country_code: "+971",
        emirates_id: "",
        emirates_id_validity: "",
        licence_number: "",
        licence_validity: "",
        emirates_id_doc: undefined,
        licence_doc: undefined,
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
  const [, setPhoneValue] = React.useState("");
  const [emiratesIdFileName, setEmiratesIdFileName] = React.useState<string | null>(null);
  const [licenceFileName, setLicenceFileName] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    if (pd) {
      setValue("id", pd.id);
      setValue("pdDetails.first_name", pd.first_name || "");
      setValue("pdDetails.last_name", pd.last_name || "");
      setValue("pdDetails.email", pd.email_id || "");
      setValue("pdDetails.phone_number", pd.mobile_number || "");
      setValue("pdDetails.country_code", pd.country_code || "+971");
      setPhoneValue((pd.country_code || "+971") + (pd.mobile_number || ""));
      setValue("pdDetails.emirates_id", pd.emirates_id || "");
      setValue("pdDetails.emirates_id_validity", pd.emiratesId_validity || "");
      setValue("pdDetails.licence_number", pd.licence_number || "");
      setValue("pdDetails.licence_validity", pd.licence_validity || "");

      const normalizeType = (type: string) => {
        if (type.includes("emirates")) return "emirates_id";
        if (type.includes("licence")) return "licence";
        return "";
      };

      const emiratesDoc = pd.documents?.find((doc) => normalizeType(doc.type || "") === "emirates_id");
      const licenceDoc = pd.documents?.find((doc) => normalizeType(doc.type || "") === "licence");

      setEmiratesIdFileName(emiratesDoc?.name || null);
      setLicenceFileName(licenceDoc?.name || null);
    }
  }, [pd, setValue]);

  const watchedCountryCode = useWatch({
    control,
    name: "pdDetails.country_code",
    defaultValue: "+971",
  });
  const allowedLocalLength =
    watchedCountryCode === "+971" ? 10 : watchedCountryCode === "+91" ? 10 : 15;

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    reset();
    onClose();
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
  
    const dialCode = data.pdDetails.country_code.replace("+", "");
    let mobileNumber = data.pdDetails.phone_number;
    if (mobileNumber.startsWith(dialCode)) {
      mobileNumber = mobileNumber.substring(dialCode.length);
    }
    const sanitizedCountryCode = data.pdDetails.country_code.replace(/[^+\d]/g, "");
    const sanitizedLocalNumber = mobileNumber.replace(/[^0-9]/g, "");
    const formattedEmiratesIdValidity = data.pdDetails.emirates_id_validity
      ? format(parseISO(data.pdDetails.emirates_id_validity), "yyyy-MM-dd")
      : "";
    const formattedLicenceValidity = data.pdDetails.licence_validity
      ? format(parseISO(data.pdDetails.licence_validity), "yyyy-MM-dd")
      : "";
  
    // Validate file types and sizes if provided
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB
  
    if (data.pdDetails.emirates_id_doc) {
      if (!allowedTypes.includes(data.pdDetails.emirates_id_doc.type)) {
        toast.error("Emirates ID document must be a PNG, JPEG, or PDF file.");
        setLoading(false);
        return;
      }
      if (data.pdDetails.emirates_id_doc.size > maxSize) {
        toast.error("Emirates ID document must be less than 5MB.");
        setLoading(false);
        return;
      }
      console.log("Emirates ID Document:", {
        name: data.pdDetails.emirates_id_doc.name,
        type: data.pdDetails.emirates_id_doc.type,
        size: data.pdDetails.emirates_id_doc.size,
      });
    }
  
    if (data.pdDetails.licence_doc) {
      if (!allowedTypes.includes(data.pdDetails.licence_doc.type)) {
        toast.error("License document must be a PNG, JPEG, or PDF file.");
        setLoading(false);
        return;
      }
      if (data.pdDetails.licence_doc.size > maxSize) {
        toast.error("License document must be less than 5MB.");
        setLoading(false);
        return;
      }
      console.log("License Document:", {
        name: data.pdDetails.licence_doc.name,
        type: data.pdDetails.licence_doc.type,
        size: data.pdDetails.licence_doc.size,
      });
    }
  
    try {
      const pdId = Number(data.id);
      if (isNaN(pdId)) {
        toast.error("Invalid PD ID.");
        setLoading(false);
        return;
      }
  
      const response = await PDService.updatePd(token, pdId, {
        firstName: data.pdDetails.first_name,
        lastName: data.pdDetails.last_name,
        emailId: data.pdDetails.email,
        phoneNumber: sanitizedLocalNumber,
        countryCode: sanitizedCountryCode,
        emiratesId: data.pdDetails.emirates_id,
        emiratesId_validity: formattedEmiratesIdValidity,
        licenceNumber: data.pdDetails.licence_number,
        licenceValidity: formattedLicenceValidity,
        emiratesIdFile: data.pdDetails.emirates_id_doc,
        licenceFile: data.pdDetails.licence_doc,
      });
  
      if (response.success) {
        toast.success("PD updated successfully!");
        const pdsResponse = await PDService.fetchIndividualPD();
        if (pdsResponse.success && pdsResponse.data) {
          const updatedPd =
            pdsResponse.data.find((d: PD) => d.id === pdId) || pd;
          onPDUpdated(updatedPd);
        } else {
          const updatedPd: PD = {
            ...pd,
            first_name: data.pdDetails.first_name || pd.first_name,
            last_name: data.pdDetails.last_name || pd.last_name,
            email_id: data.pdDetails.email || pd.email_id,
            mobile_number: sanitizedLocalNumber || pd.mobile_number,
            country_code: sanitizedCountryCode || pd.country_code,
            emirates_id: data.pdDetails.emirates_id || pd.emirates_id,
            emiratesId_validity: formattedEmiratesIdValidity || pd.emiratesId_validity,
            licence_number: data.pdDetails.licence_number || pd.licence_number,
            licence_validity: formattedLicenceValidity || pd.licence_validity,
            type_id: pd.type_id,
            role_id: pd.role_id,
            is_active: pd.is_active,
            status_id: pd.status_id || null,
            device_id: pd.device_id,
            createdAt: pd.createdAt,
            updatedAt: new Date().toISOString(),
            documents: pd.documents,
          };
          onPDUpdated(updatedPd);
        }
        reset();
        setPhoneValue(
          getValues("pdDetails.country_code") +
            getValues("pdDetails.phone_number")
        );
        onClose();
      } else {
        toast.error(response.error || "Failed to update PD.");
      }
    } catch (error: any) {
      console.error("An error occurred while updating PD:", error);
      toast.error(error.message || "An error occurred while updating the PD.");
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
            <DrawerTitle className="text-xl font-semibold">Update PD</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Modify the PD details below to update their information.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-6">
                {/* First Name */}
                <FormField
                  control={control}
                  name="pdDetails.first_name"
                  rules={{
                    required: "First Name is required",
                    maxLength: {
                      value: 20,
                      message: "First Name cannot exceed 20 characters",
                    },
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: "First Name can only contain letters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      {errors.pdDetails?.first_name && (
                        <FormMessage>{errors.pdDetails.first_name.message}</FormMessage>
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
                    maxLength: {
                      value: 20,
                      message: "Last Name cannot exceed 20 characters",
                    },
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
                      {errors.pdDetails?.last_name && (
                        <FormMessage>{errors.pdDetails.last_name.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={control}
                  name="pdDetails.email"
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
                      {errors.pdDetails?.email && (
                        <FormMessage>{errors.pdDetails.email.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Phone Number with Country Code Validation */}
                <div className="flex gap-4">
                  <FormField
                    control={control}
                    // value={phoneValue}
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
                    name="pdDetails.phone_number"
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
                            maxLength={allowedLocalLength}
                            placeholder="Enter mobile number"
                            onInput={(e) => {
                              const input = e.target as HTMLInputElement;
                              input.value = input.value.replace(/\D/g, "");
                            }}
                          />
                        </FormControl>
                        {errors.pdDetails?.phone_number && (
                          <FormMessage>{errors.pdDetails.phone_number.message}</FormMessage>
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
                      {errors.pdDetails?.emirates_id && (
                        <FormMessage>{errors.pdDetails.emirates_id.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Emirates Expiry Date */}
                <FormField
                  control={control}
                  name="pdDetails.emirates_id_validity"
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
                          {field.value
                            ? format(parseISO(field.value), "PPP")
                            : "Pick a date"}
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
                      {errors.pdDetails?.emirates_id_validity && (
                        <FormMessage>{errors.pdDetails.emirates_id_validity.message}</FormMessage>
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
                      {errors.pdDetails?.licence_number && (
                        <FormMessage>{errors.pdDetails.licence_number.message}</FormMessage>
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
                          {field.value
                            ? format(parseISO(field.value), "PPP")
                            : "Pick a date"}
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
                      {errors.pdDetails?.licence_validity && (
                        <FormMessage>{errors.pdDetails.licence_validity.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* Emirates ID Document Upload */}
                <FormField
                  control={control}
                  name="pdDetails.emirates_id_doc"
                  render={() => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Emirates ID Document</FormLabel>
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <FileUploadDialog
                            onFilesSelected={(files) => {
                              if (files.length > 0) {
                                setValue("pdDetails.emirates_id_doc", files[0]);
                                setEmiratesIdFileName(files[0].name);
                              } else {
                                setValue("pdDetails.emirates_id_doc", undefined);
                                setEmiratesIdFileName(null);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="flex flex-col space-y-1">
                          {pd.documents?.find((doc) => doc.type === "emirates_id") &&
                            !emiratesIdFileName && (
                              <a
                                href={pd.documents.find((doc) => doc.type === "emirates_id")!.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 underline text-sm"
                              >
                                {pd.documents.find((doc) => doc.type === "emirates_id")!.name}
                              </a>
                            )}
                          {emiratesIdFileName && <span className="text-sm">{emiratesIdFileName}</span>}
                        </div>
                      </div>
                      {errors.pdDetails?.emirates_id_doc && (
                        <FormMessage>{errors.pdDetails.emirates_id_doc.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {/* License Document Upload */}
                <FormField
                  control={control}
                  name="pdDetails.licence_doc"
                  render={() => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>License Document</FormLabel>
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <FileUploadDialog
                            onFilesSelected={(files) => {
                              if (files.length > 0) {
                                setValue("pdDetails.licence_doc", files[0]);
                                setLicenceFileName(files[0].name);
                              } else {
                                setValue("pdDetails.licence_doc", undefined);
                                setLicenceFileName(null);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="flex flex-col space-y-1">
                          {pd.documents?.find((doc) => doc.type === "licence") &&
                            !licenceFileName && (
                              <a
                                href={pd.documents.find((doc) => doc.type === "licence")!.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 underline text-sm"
                              >
                                {pd.documents.find((doc) => doc.type === "licence")!.name}
                              </a>
                            )}
                          {licenceFileName && <span className="text-sm">{licenceFileName}</span>}
                        </div>
                      </div>
                      {errors.pdDetails?.licence_doc && (
                        <FormMessage>{errors.pdDetails.licence_doc.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-blue-500"
                >
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