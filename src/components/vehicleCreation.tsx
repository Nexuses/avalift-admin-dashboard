"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { vehicleService } from "@/utils/vehicleService";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import brandService from "@/utils/brandService";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/utils/apiFetcher";
import BASE_URL from "@/config/apiConfig";
import vehicleLogotypesData from "@/assets/vehicle-logotypes.json";
import ModelService from "@/utils/modelService";
import { CustomerSearch, Customer } from "./CustomerSearch";

type VehicleLogotypesData = {
  [key: string]: {
    name: string;
    code: string | null;
    logotype: {
      uri: string;
      width: number;
      height: number;
      mime: string;
      transparent: boolean;
      size: number;
    };
    alternatives: {
      uri: string;
      width: number;
      height: number;
      mime: string;
      transparent: boolean;
      size: number;
    }[];
  };
};

interface Emirate {
  id: number;
  emirate_name: string;
  start_code_type: "numeric" | "alpha" | "double_alpha" | "custom";
  starting_plate_code: string;
  ending_plate_code: string;
  number_of_digits: number;
  plate_image: string | null;
  region_url: string;
}

const vehicleLogotypesDataTyped: VehicleLogotypesData = vehicleLogotypesData;

type Brand = {
  name: string;
  logo: string;
};

interface VehicleDetails {
  color: string;
  make: string;
  model: string;
  
}

interface FormInputs {
  user_id: string;
  registration_no: string;
  is_active: "true" | "false";
  emirate_id: string;
  vehicleDetails: VehicleDetails;
}

interface VehicleDrawerProps {
  onVehicleCreated: () => void;
}

export function AddVehicleDrawer({ onVehicleCreated }: VehicleDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      user_id: "",
      registration_no: "",
      is_active: "true",
      emirate_id: "",
      vehicleDetails: {
        color: "",
        make: "",
        model: "",
      },
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    // watch,
    setError: setFieldError,
  } = form;

  const [brandsLoading, setLoadingBrands] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [emirates, setEmirates] = useState<Emirate[]>([]);
  const [emiratesLoading, setEmiratesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [userSearchValue, setUserSearchValue] = useState("");

  const allowedOrganization = localStorage.getItem("allowedOrganization") || "";
  const isIndividual = allowedOrganization === "*" || allowedOrganization === "1";
  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  // const selectedEmirateId = watch("emirate_id");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token provided. Authorization denied.");
      if (!isIndividual) {
        const res = await fetch(`${BASE_URL}/api/organization/all-users-organizations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orgnanisation_id: allowedOrganization }),
        });
        if (!res.ok) throw new Error("Failed to fetch users.");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const userIds = data.data.map((user: { id: number; first_name: string }) => ({
            id: user.id.toString(),
            name: user.first_name,
          }));
          if (userIds.length > 0) {
            setValue("user_id", userIds[0].id);
            setUserSearchValue(userIds[0].name);
          }
        } else {
          throw new Error("Invalid data format.");
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchEmirates = async () => {
    setEmiratesLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/get-plate-code-region`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setEmirates(data.data);
      } else {
        throw new Error("Failed to fetch emirates.");
      }
    } catch (err) {
      console.error("Error fetching emirates:", err);
      setError("Failed to load emirates.");
      setEmirates([]);
    } finally {
      setEmiratesLoading(false);
    }
  };

  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      setError(null);
      try {
        const response: ApiResponse = await brandService.fetchBrands();
        if (response.success && response.data?.data) {
          const brandList = response.data.data
            .filter((brand: { brand: string }) => brand.brand.toLowerCase() !== "others")
            .map((brand: { brand: string; brandImage: string | null }) => {
              const brandKey = brand.brand.trim().toLowerCase().replace(/\s+/g, "-");
              let logo =
                brand.brandImage ||
                vehicleLogotypesDataTyped[brandKey]?.logotype.uri ||
                "/assets/defaultcar.png";
              
              // Fix incorrect API paths
              if (logo && logo.startsWith("/src/assets/")) {
                logo = logo.replace("/src/assets/", "/assets/");
              }
              
              return { name: brand.brand, logo };
            });
          setBrands(brandList);
        } else {
          throw new Error("Failed to fetch brands.");
        }
      } catch (err) {
        console.error("Error fetching brands:", err);
        setError("Failed to load brands.");
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
    fetchEmirates();
  }, []);

  const fetchModels = async (brand: string) => {
    if (!brand) return;
    setModelsLoading(true);
    setErrorMessage("");
    try {
      const response = await ModelService.fetchModels(brand);
      if (response.success && response.data && response.data.models) {
        setModels(response.data.models);
      } else {
        throw new Error("Failed to load models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      setErrorMessage("Error fetching models. Please try again.");
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  // const validateRegistrationNumber = (value: string, emirateId: string) => {
  //   if (!emirateId) return "Please select an emirate first.";
  //   const emirate = emirates.find((e) => e.id.toString() === emirateId);
  //   if (!emirate) return "Invalid emirate selected.";

  //   const trimmed = value.replace(/\s/g, "");
  //   if (trimmed.length > emirate.number_of_digits + (emirate.start_code_type === "double_alpha" ? 2 : 1)) {
  //     return `Maximum of ${emirate.number_of_digits + (emirate.start_code_type === "double_alpha" ? 2 : 1)} characters allowed.`;
  //   }

  //   if (emirate.start_code_type === "numeric") {
  //     const regex = new RegExp(`^\\d{1,2}\\d{1,${emirate.number_of_digits}}$`);
  //     if (!regex.test(trimmed)) {
  //       return `Registration number must start with 1-2 digits followed by ${emirate.number_of_digits} digits.`;
  //     }
  //     const prefix = parseInt(trimmed.slice(0, 2));
  //     if (prefix < parseInt(emirate.starting_plate_code) || prefix > parseInt(emirate.ending_plate_code)) {
  //       return `Prefix must be between ${emirate.starting_plate_code} and ${emirate.ending_plate_code}.`;
  //     }
  //   } else if (emirate.start_code_type === "alpha") {
  //     const regex = new RegExp(`^[A-Za-z]\\d{1,${emirate.number_of_digits}}$`);
  //     if (!regex.test(trimmed)) {
  //       return `Registration number must start with a letter followed by ${emirate.number_of_digits} digits.`;
  //     }
  //     const prefix = trimmed[0].toUpperCase();
  //     if (prefix < emirate.starting_plate_code || prefix > emirate.ending_plate_code) {
  //       return `Prefix must be between ${emirate.starting_plate_code} and ${emirate.ending_plate_code}.`;
  //     }
  //   } else if (emirate.start_code_type === "double_alpha") {
  //     const regex = new RegExp(`^[A-Za-z]{1,2}\\d{1,${emirate.number_of_digits}}$`);
  //     if (!regex.test(trimmed)) {
  //       return `Registration number must start with one or two letters followed by ${emirate.number_of_digits} digits.`;
  //     }
  //     const alphaMatch = trimmed.match(/^[A-Za-z]{1,2}/);
  //     const prefix = (alphaMatch ? alphaMatch[0] : "").toUpperCase();
  //     if (prefix < emirate.starting_plate_code || prefix > emirate.ending_plate_code) {
  //       return `Prefix must be between ${emirate.starting_plate_code} and ${emirate.ending_plate_code}.`;
  //     }
  //   } else if (emirate.start_code_type === "custom") {
  //     const regex = new RegExp(`^.{1,${emirate.number_of_digits}}$`);
  //     if (!regex.test(trimmed)) {
  //       return `Registration number must be up to ${emirate.number_of_digits} characters.`;
  //     }
  //   }
  //   return true;
  // };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    const sanitizedRegistrationNo = data.registration_no.replace(/\s+/g, "");
  
    // ✅ Find the full emirate object using the selected ID
    const selectedEmirate = emirates.find(e => e.id.toString() === data.emirate_id);
  
    try {
      const response = await vehicleService.createVehicle(token, {
        user_id: data.user_id,
        registration_no: sanitizedRegistrationNo,
        is_active: data.is_active === "true",
        emirate_name: selectedEmirate?.emirate_name || "", // ✅ Add emirate_name
        vehicleDetails: {
          ...data.vehicleDetails,
          fuel_type: "petrol",
        },
      });
  
      if (response.success) {
        toast.success("Vehicle created successfully!");
        reset({
          user_id: data.user_id,
          registration_no: "",
          is_active: "true",
          emirate_id: "",
          vehicleDetails: {
            color: "",
            make: "",
            model: "",
          },
        });
        setIsDrawerOpen(false);
        onVehicleCreated();
      } else {
        setFieldError("registration_no", {
          type: "server",
          message: response.error || "Failed to create vehicle.",
        });
      }
    } catch (err: any) {
      setFieldError("registration_no", {
        type: "server",
        message: err.message || "An error occurred while creating the vehicle.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) {
      const currentValues = getValues();
      reset({
        user_id: currentValues.user_id,
        registration_no: "",
        is_active: "true",
        emirate_id: "",
        vehicleDetails: {
          color: "",
          make: "",
          model: "",
        },
      });
    }
  }, [isDrawerOpen, reset, getValues]);

  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className="rounded">Create Vehicle</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Vehicle Information</DrawerTitle>
              <DrawerDescription>Fill in the details below.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4" noValidate>
                {isIndividual && (
                  <FormField
                    control={control}
                    name="user_id"
                    rules={{
                      required: "Customer ID is required.",
                      validate: (value) =>
                        /^\d+$/.test(value) || "Customer ID must be a valid number",
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <CustomerSearch
                            value={userSearchValue}
                            onChange={(newValue) => {
                              setUserSearchValue(newValue);
                            }}
                            onCustomerSelect={(customer: Customer) => {
                              field.onChange(customer.id.toString());
                              setUserSearchValue(`${customer.first_name} ${customer.last_name}`);
                            }}
                          />
                        </FormControl>
                        <FormMessage>{errors.user_id && errors.user_id.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={control}
                  name="emirate_id"
                  rules={{
                    required: "Emirate is required.",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emirate</FormLabel>
                      <FormControl>
                        {emiratesLoading ? (
                          <p>Loading emirates...</p>
                        ) : error ? (
                          <p className="text-red-500">{error}</p>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger
                              className={cn(
                                errors.emirate_id ? "border-red-500" : "border-gray-300"
                              )}
                            >
                              <SelectValue placeholder="Select Emirate" />
                            </SelectTrigger>
                            <SelectContent>
                              {emirates.length > 0 ? (
                                emirates.map((emirate) => (
                                  <SelectItem key={emirate.id} value={emirate.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      {emirate.region_url !== "Blank" && (
                                        <img
                                          src={emirate.region_url}
                                          alt={emirate.emirate_name}
                                          className="w-6 h-6 object-contain rounded-md"
                                        />
                                      )}
                                      <span>{emirate.emirate_name}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-emirates" disabled>
                                  No emirates available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage>{errors.emirate_id && errors.emirate_id.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="registration_no"
                  rules={{
                    required: "Registration Number is required.",
                    // validate: (value) => validateRegistrationNumber(value, selectedEmirateId),

                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration No</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Reg Number"
                          maxLength={8}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.registration_no && errors.registration_no.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="vehicleDetails.color"
                  rules={{
                    required: "Color is required.",
                    maxLength: {
                      value: 20,
                      message: "Maximum length exceeded (20 characters).",
                    },
                    pattern: {
                      value: /^[A-Za-z\s]+$/,
                      message: "Color must contain only letters and spaces.",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input
                          maxLength={20}
                          placeholder="Enter Color"
                          {...field}
                          className={cn(
                            errors.vehicleDetails?.color ? "border-red-500" : "border-gray-300"
                          )}
                          onBlur={(e) => {
                            const transformed = e.target.value
                              .split(" ")
                              .filter(Boolean)
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              )
                              .join(" ");
                            field.onChange(transformed);
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage>
                        {errors.vehicleDetails?.color && errors.vehicleDetails.color.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="vehicleDetails.make"
                  rules={{
                    required: "Brand is required.",
                    maxLength: {
                      value: 20,
                      message: "Maximum length exceeded (20 characters).",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        {brandsLoading ? (
                          <p>Loading brands...</p>
                        ) : error ? (
                          <p className="text-red-500">{error}</p>
                        ) : (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              fetchModels(value);
                            }}
                            defaultValue={field.value}
                          >
                            <SelectTrigger
                              className={cn(
                                errors.vehicleDetails?.make ? "border-red-500" : "border-gray-300"
                              )}
                            >
                              <SelectValue placeholder="Select Brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.length > 0 ? (
                                brands.map((brand) => (
                                  <SelectItem key={brand.name} value={brand.name}>
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={brand.logo}
                                        alt={brand.name}
                                        className="w-6 h-6 object-contain rounded-md"
                                      />
                                      <span>{brand.name}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-brands" disabled>
                                  No brands available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage>
                        {errors.vehicleDetails?.make && errors.vehicleDetails.make.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="vehicleDetails.model"
                  rules={{
                    required: "Model is required.",
                    maxLength: {
                      value: 20,
                      message: "Maximum length exceeded (20 characters).",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        {modelsLoading ? (
                          <p>Loading models...</p>
                        ) : errorMessage ? (
                          <p className="text-red-500">{errorMessage}</p>
                        ) : (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger
                              className={cn(
                                errors.vehicleDetails?.model ? "border-red-500" : "border-gray-300"
                              )}
                            >
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                              {models.length > 0 ? (
                                models.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem disabled value="no-models">
                                  No models available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage>
                        {errors.vehicleDetails?.model && errors.vehicleDetails.model.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <div className="col-span-2 flex space-x-2">
                  <Button className="rounded bg-blue-500" type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                  <DrawerClose asChild>
                    <Button className="rounded" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </DrawerClose>
                </div>
              </form>
            </div>
            <DrawerFooter className="mt-4 flex space-x-2"></DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </Form>
  );
}