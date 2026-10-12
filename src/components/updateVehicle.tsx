"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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
import { vehicleService } from "@/utils/vehicleService";

interface VehicleDetail {
  id: number;
  vehicle_id: number;
  color: string;
  fuel_type: string;
  make: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  registration_no: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleDetail: VehicleDetail;
  User?: {
    id: number;
    country_code: string;
    mobile_number: string;
    email_id: string | null;
    first_name: string;
    last_name: string;
    password: string | null;
    type_id: number;
    role_id: number;
    is_active: boolean;
    status_id: number;
    device_id: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface VehicleDetailsForm {
  registration_no: string;
  customer: string;
  is_active: boolean;
  color: string;
  fuel_type: string;
  make: string;
  model: string;
}

interface FormInputs {
  id: number;
  vehicleDetails: VehicleDetailsForm;
}

interface UpdateVehicleDrawerProps {
  vehicle: Vehicle | null; // Allow null to handle closing
  open: boolean;          // Controlled open state
  onOpenChange: (open: boolean) => void; // Handle state changes
  onVehicleUpdated: (updatedVehicle: Vehicle) => void;
}

export function UpdateVehicleDrawer({
  vehicle,
  open,
  onOpenChange,
  onVehicleUpdated,
}: UpdateVehicleDrawerProps) {
  const form = useForm<FormInputs>({
    defaultValues: {
      id: 0,
      vehicleDetails: {
        registration_no: "",
        customer: "",
        is_active: false,
        color: "",
        fuel_type: "",
        make: "",
        model: "",
      },
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  const [loading, setLoading] = React.useState(false);

  // Pre-populate form with vehicle data or reset when vehicle is null
  React.useEffect(() => {
    if (vehicle) {
      setValue("id", vehicle.id);
      setValue("vehicleDetails.registration_no", vehicle.registration_no || "");
      setValue(
        "vehicleDetails.customer",
        vehicle.User
          ? `${vehicle.user_id} - ${vehicle.User.first_name} ${vehicle.User.last_name}`
          : "Unknown"
      );
      setValue("vehicleDetails.is_active", vehicle.is_active);
      setValue("vehicleDetails.color", vehicle.vehicleDetail?.color || "");
      setValue("vehicleDetails.fuel_type", vehicle.vehicleDetail?.fuel_type || "");
      setValue("vehicleDetails.make", vehicle.vehicleDetail?.make || "");
      setValue("vehicleDetails.model", vehicle.vehicleDetail?.model || "");
    } else {
      reset();
    }
  }, [vehicle, setValue, reset]);

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    reset();
    onOpenChange(false); // Close the drawer
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    if (!token) {
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const vehicleId = Number(data.id);
      if (isNaN(vehicleId)) {
        toast.error("Invalid vehicle ID.");
        return;
      }

      const response = await vehicleService.updateVehicle(token, vehicleId, {
        registration_no: data.vehicleDetails.registration_no,
        is_active: data.vehicleDetails.is_active,
        vehicleDetails: {
          color: data.vehicleDetails.color,
          fuel_type: data.vehicleDetails.fuel_type,
          make: data.vehicleDetails.make,
          model: data.vehicleDetails.model,
        },
      });

      if (response.success) {
        toast.success("Vehicle updated successfully!");
        const updatedVehicle: Vehicle = {
          ...vehicle!,
          registration_no: data.vehicleDetails.registration_no,
          user_id: vehicle!.user_id,
          is_active: data.vehicleDetails.is_active,
          vehicleDetail: {
            ...vehicle!.vehicleDetail,
            color: data.vehicleDetails.color,
            fuel_type: data.vehicleDetails.fuel_type,
            make: data.vehicleDetails.make,
            model: data.vehicleDetails.model,
            createdAt: vehicle!.vehicleDetail.createdAt,
            updatedAt: new Date().toISOString(),
            id: vehicle!.vehicleDetail.id,
            vehicle_id: vehicle!.id,
          },
        };
        onVehicleUpdated(updatedVehicle);
        reset();
        onOpenChange(false); // Close the drawer
      } else {
        toast.error(response.error || "Failed to update vehicle.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the vehicle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Update Vehicle</DrawerTitle>
              <DrawerDescription>Modify the vehicle details below.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-4 gap-4" noValidate>
                {/* Registration Number */}
                <FormField
                  control={control}
                  name="vehicleDetails.registration_no"
                  rules={{ required: "Registration number is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter registration number" />
                      </FormControl>
                      <FormMessage>{errors.vehicleDetails?.registration_no?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Customer (read-only) */}
                <FormField
                  control={control}
                  name="vehicleDetails.customer"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Customer" disabled />
                      </FormControl>
                      <FormMessage>{errors.vehicleDetails?.customer?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Color */}
                <FormField
                  control={control}
                  name="vehicleDetails.color"
                  rules={{ required: "Color is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter vehicle color" maxLength={20} />
                      </FormControl>
                      <FormMessage>{errors.vehicleDetails?.color?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Fuel Type */}
                <FormField
                  control={control}
                  name="vehicleDetails.fuel_type"
                  rules={{ required: "Fuel type is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2 hidden">
                      <FormLabel>Fuel Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="petrol">Petrol</option>
                        </select>
                      </FormControl>
                      <FormMessage>{errors.vehicleDetails?.fuel_type?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Make */}
                <FormField
                  control={control}
                  name="vehicleDetails.make"
                  rules={{ required: "Make is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter vehicle make" readOnly disabled />
                      </FormControl>
                      <FormMessage>{errors.vehicleDetails?.make?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Model */}
                <FormField
                  control={control}
                  name="vehicleDetails.model"
                  rules={{ required: "Model is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter vehicle model" readOnly disabled />
                      </FormControl>
                      <FormMessage>{errors.vehicleDetails?.model?.message}</FormMessage>
                    </FormItem>
                  )}
                />

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