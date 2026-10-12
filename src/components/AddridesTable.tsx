"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Autocomplete } from "@react-google-maps/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import customerService from "@/utils/customerService";
import DriverService, { AvailableChauffeur, Driver } from "@/utils/driverService";
import { vehicleService } from "@/utils/vehicleService";
import { paymentService } from "@/utils/paymentService";
import rideService, { CreateRidePayload } from "@/utils/RideService";
import { DateTimePicker } from "./ui/datetime-picker";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import BASE_URL from "@/config/apiConfig";
import organizationService from "@/utils/organizationSevice";
import { Spin } from "antd";
import fareService from "@/utils/fareService";

const Checkbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onChange(e.target.checked)}
    className="h-4 w-4"
  />
);

interface PaymentMethodFieldProps {
  form: ReturnType<typeof useForm<CreateRideFormValues>>;
  paymentMethods: PaymentMethodData[];
  loading: boolean;
  error: string | null;
}

const PaymentMethodField: React.FC<PaymentMethodFieldProps> = ({
  form,
  paymentMethods,
  loading,
  error,
}) => (
  <FormField
    control={form.control}
    name="paymentDetails.payment_method"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Payment Method</FormLabel>
        <FormControl className="rounded">
          <Select onValueChange={field.onChange} value={field.value.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>
                  <Spin />
                </SelectItem>
              ) : error ? (
                <SelectItem value="error" disabled>
                  {error}
                </SelectItem>
              ) : paymentMethods.length === 0 ? (
                <SelectItem value="none" disabled>
                  No payment methods available
                </SelectItem>
              ) : (
                paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.name}>
                    {method.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export type Customer = {
  id: number;
  first_name: string;
  last_name: string;
};

export interface VehicleDetail {
  vehicle_id: number;
  color: string;
  fuel_type: string;
  make: string;
  brand: string;
  model: string;
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
    type_id: number | null;
    role_id: number;
    is_active: boolean;
    status_id: number | null;
    device_id: string | null;
    createdAt: string;
    updatedAt: string;
    os_type?: Record<string, any>; // Allow os_type to be an empty object or any key-value pairs
    user_availability?: boolean; // Optional since it might not always be present
  };
}

interface PaymentMethodData {
  id: number;
  name: string;
}

const isApplePayMethod = (name: string) =>
  name.replace(/[\s-]/g, "").toLowerCase() === "applepay";

interface Organization {
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string;
}

const createRideSchema = z
  .object({
    is_customer_available: z.boolean(),
    customer_name: z.string().optional(),
    estimated_time_in_minutes: z.number().optional(),
    estimated_distance: z.string().optional(),
    hours_booked: z.number().nullable().optional(),
    ride_type: z.enum(["scheduled", "instant"]),
    rate_type: z.enum(["per_min", "per_hour", "half_day", "full_day", "fixed", "rta_test", "garage_ride"]),
    requested_pickup_point: z.string().min(1, "Pickup location is required"),
    requested_drop_point: z.string().min(1, "Drop location is required"),
    requested_pickup: z.object({ lat: z.number(), long: z.number() }),
    requested_drop: z.object({ lat: z.number(), long: z.number() }),
    paymentDetails: z.object({
      payment_method: z.string().min(1, "Payment method is required"),
    }),
    vehicle: z.string().min(1, "Vehicle is required"),
    chauffeur_id: z.number().nullable().optional(),
    organisation_id: z.string().min(1),
    organisation_ride: z.boolean(),
    chauffeur_name: z.string().optional(),
    scheduled_datetime: z.string().nullable().optional(),
    estimated_fare: z.number().optional(),
  })
  .refine(
    (data) =>
      data.ride_type === "instant" ||
      (data.ride_type === "scheduled" && data.scheduled_datetime !== null),
    {
      message: "Scheduled date and time are required for scheduled rides",
      path: ["scheduled_datetime"],
    }
  )
  .refine((data) => (data.organisation_ride ? true : !!data.customer_name), {
    message: "Customer name is required for non-organisation rides",
    path: ["customer_name"],
  })
  .refine(
    (data) =>
      data.organisation_ride ||
      ((data.chauffeur_id ?? null) !== null && data.chauffeur_id! >= 0),
    {
      message: "Chauffeur is required when organisation ride is not selected",
      path: ["chauffeur_id"],
    }
  );

export type CreateRideFormValues = z.infer<typeof createRideSchema>;

interface CustomerAutocompleteProps {
  value: string;
  onChange: (newValue: string) => void;
  onSelect: (customer: Customer) => void;
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
}) => {
  const [query, setQuery] = useState(value);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (query.length < 2) {
        setCustomers([]);
        return;
      }
      setLoading(true);
      try {
        const response = await customerService.fetchIndividualCustomers({
          query,
        });
        if (response.success && response.data) {
          setCustomers(response.data);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="Search customer..."
      />
      {loading && (
        <div className="absolute top-full left-0 bg-white border w-full p-2">
          <Spin />
        </div>
      )}
      {!loading && customers.length > 0 && (
        <Card className="absolute top-full left-0 w-full max-h-60 overflow-y-auto z-10">
          <CardContent className="p-0">
            {customers.map((cust) => {
              const fullName = `${cust.first_name} ${cust.last_name}`;
              return (
                <div
                  key={cust.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onSelect(cust);
                    setQuery(fullName);
                    onChange(fullName);
                    setCustomers([]);
                  }}
                >
                  {fullName}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export function CreateRideForm({
  defaultCustomerId,
  onLocationChange,
  isLoaded,
}: {
  defaultCustomerId?: number;
  onLocationChange: (
    field: "requested_pickup" | "requested_drop",
    coords: { lat: number; long: number }
  ) => void;
  isLoaded: boolean;
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(
    defaultCustomerId || 0
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [, setDrivers] = useState<Driver[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<any>(null);
  const [dropAutocomplete, setDropAutocomplete] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgLoading, setOrgLoading] = useState<boolean>(true);

  const [chauffeurs, setChauffeurs] = useState<AvailableChauffeur[]>([]);

  const allowedOrganization = localStorage.getItem("allowedOrganization");
  const isOrganisationAllowed =
    allowedOrganization === "1" || allowedOrganization === "*";

  const allRateTypes = [
    { value: "per_min", label: "Per Minute" },
    { value: "per_hour", label: "Per Hour" },
    { value: "half_day", label: "Half Day" },
    { value: "full_day", label: "Full Day" },
    { value: "fixed", label: "Fixed" },
    { value: "rta_test", label: "RTA" },
    { value: "garage_ride", label: "Garage Ride" },
  ];

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      is_customer_available: true,
      customer_name: "",
      estimated_time_in_minutes: 0,
      estimated_distance: "",
      hours_booked: null,
      ride_type: "instant",
      rate_type: "per_min",
      requested_pickup_point: "",
      requested_drop_point: "",
      requested_pickup: { lat: 0, long: 0 },
      requested_drop: { lat: 0, long: 0 },
      paymentDetails: { payment_method: "" },
      vehicle: "",
      chauffeur_id: 0,
      organisation_ride: isOrganisationAllowed ? false : true,
      organisation_id: isOrganisationAllowed ? "1" : allowedOrganization || "1",
      chauffeur_name: "",
      estimated_fare: 0,
      scheduled_datetime: null,
    },
  });

  const rateType = useWatch({ control: form.control, name: "rate_type" });
  const pickupCoords = useWatch({
    control: form.control,
    name: "requested_pickup",
  });
  const dropCoords = useWatch({
    control: form.control,
    name: "requested_drop",
  });
  const rideType = form.watch("ride_type");
  const estimatedTimeInMinutes = useWatch({
    control: form.control,
    name: "estimated_time_in_minutes",
  });
  const hoursBooked = useWatch({ control: form.control, name: "hours_booked" });
  const organisationRide = useWatch({
    control: form.control,
    name: "organisation_ride",
  });
  const organisationId = useWatch({ control: form.control, name: "organisation_id" });

  const rateTypesFiltered = organisationId === "1" || organisationId === "*"
    ? allRateTypes
    : [{ value: "fixed", label: "Fixed" }];

  useEffect(() => {
    if (organisationId !== "1" && organisationId !== "*") {
      form.setValue("paymentDetails.payment_method", "Wallet Credit");
    }
  }, [organisationId]); // Removed 'form' from dependencies

  useEffect(() => {
    if (
      organisationId !== "1" &&
      organisationId !== "*" &&
      form.getValues("rate_type") !== "fixed"
    ) {
      form.setValue("rate_type", "fixed");
    }
  }, [organisationId]); // Removed 'form' from dependencies

  useEffect(() => {
    if (rateType === "half_day") {
      form.setValue("estimated_time_in_minutes", 240); // 4 hours * 60 minutes
    } else if (rateType === "full_day") {
      form.setValue("estimated_time_in_minutes", 480); // 8 hours * 60 minutes
    } else if (rateType === "per_hour" && hoursBooked) {
      form.setValue("estimated_time_in_minutes", hoursBooked * 60);
    } else if (rateType === "rta_test") {
      form.setValue("estimated_time_in_minutes", 60); // Example: 1 hour for RTA test
    } else if (rateType === "fixed") {
      form.setValue("estimated_time_in_minutes", 60); // Fixed might not use time
    } else if (rateType === "garage_ride") {
      form.setValue("estimated_time_in_minutes", 60); // Example: 30 min for garage
    } else if (rateType === "per_min") {
      form.setValue("estimated_time_in_minutes", 0);
    }
  }, [rateType, hoursBooked]); // Removed 'form' from dependencies

  useEffect(() => {
    if (!isOrganisationAllowed) {
      form.setValue("organisation_ride", true);
    }
  }, [isOrganisationAllowed]); // Removed 'form' from dependencies

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (organisationId === "1" || organisationId === "*") {
        setLoadingPayments(true);
        try {
          const methods = await paymentService.getPaymentMethodsDetails();
          const filteredMethods = methods
            .map((method) => ({ id: method.id, name: method.name }))
            .filter((method) => !isApplePayMethod(method.name));

          setPaymentMethods(filteredMethods);

          const currentMethod = form.getValues("paymentDetails.payment_method");
          if (currentMethod && isApplePayMethod(currentMethod)) {
            form.setValue("paymentDetails.payment_method", "");
          }
        } catch (err) {
          console.error("Error fetching payment methods:", err);
          setPaymentError("Failed to load payment methods");
        } finally {
          setLoadingPayments(false);
        }
      }
    };
    fetchPaymentMethods();
  }, [organisationId]);

  const fetchOrganizations = async () => {
    try {
      setOrgLoading(true);
      const response = await organizationService.fetchAllOrganizations();
      if (response.success && response.data) {
        const orgs = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as any).data)
          ? (response.data as any).data
          : [];
        setOrganizations(orgs.filter((org: Organization) => org.id !== 1));
      } else {
        console.error("Error fetching organizations:", response.error);
        setOrganizations([]);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setOrganizations([]);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (!organisationRide) {
      form.setValue("organisation_id", "1");
      form.setValue("customer_name", "");
    }
  }, [organisationRide, form]);

  useEffect(() => {
    const currentCustomerName = form.getValues("customer_name");
    form.setValue("estimated_time_in_minutes", 0);
    form.setValue("estimated_distance", "");
    form.setValue("hours_booked", null);
    form.setValue("vehicle", "");

    if (!organisationRide) {
      form.setValue("customer_name", currentCustomerName);
    } else {
      form.setValue("customer_name", "");
    }
  }, [rateType, form, organisationRide]);

  useEffect(() => {
    const fetchEstimatedFare = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const payload = {
        rate_type: rateType,
        estimated_time_in_minutes:
          rateType === "per_hour" && hoursBooked
            ? (hoursBooked * 60).toString()
            : (estimatedTimeInMinutes || 0).toString(),
        coupon_ids: [],
        organisation_id: form.getValues("organisation_id"),
      };

      if (parseFloat(payload.estimated_time_in_minutes) <= 0) {
        form.setValue("estimated_fare", 0);
        return;
      }

      try {
        const data = await fareService.calculateEstimatedFare(payload, token);
        if (data.success && data.data) {
          form.setValue("estimated_fare", data.data.final_total_amount);
        } else {
          throw new Error(data.message || "Error in response");
        }
      } catch (err) {
        console.error("Error fetching estimated fare:", err);
        toast.error("Failed to calculate estimated fare");
        form.setValue("estimated_fare", 0);
      }
    };

    fetchEstimatedFare();
  }, [rateType, estimatedTimeInMinutes, hoursBooked]);

  // Store previous coordinates to prevent unnecessary API calls
  const prevCoordsRef = React.useRef<{
    pickup: { lat: number; long: number } | null;
    drop: { lat: number; long: number } | null;
  }>({ pickup: null, drop: null });
  
  // Add debouncing to prevent rapid successive API calls
  const debounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const shouldCalculateTime = ["per_min", "fixed", "rta_test", "garage_ride"].includes(rateType);

    // Check if coordinates have actually changed
    const pickupChanged = prevCoordsRef.current.pickup?.lat !== pickupCoords.lat || 
                         prevCoordsRef.current.pickup?.long !== pickupCoords.long;
    const dropChanged = prevCoordsRef.current.drop?.lat !== dropCoords.lat || 
                       prevCoordsRef.current.drop?.long !== dropCoords.long;

    if (
      shouldCalculateTime &&
      pickupCoords.lat !== 0 &&
      pickupCoords.long !== 0 &&
      dropCoords.lat !== 0 &&
      dropCoords.long !== 0 &&
      isLoaded &&
      (pickupChanged || dropChanged)
    ) {
      // Clear any existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the API call by 500ms to prevent rapid successive calls
      debounceTimeoutRef.current = setTimeout(() => {
        // Update stored coordinates
        prevCoordsRef.current = {
          pickup: { lat: pickupCoords.lat, long: pickupCoords.long },
          drop: { lat: dropCoords.lat, long: dropCoords.long }
        };

        const distanceMatrixService = new google.maps.DistanceMatrixService();
        distanceMatrixService.getDistanceMatrix(
          {
            origins: [{ lat: pickupCoords.lat, lng: pickupCoords.long }],
            destinations: [{ lat: dropCoords.lat, lng: dropCoords.long }],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK && response) {
              const element = response.rows[0].elements[0];
              const durationInSeconds = element.duration.value;
              const durationInMinutes = Math.ceil(durationInSeconds / 60);
              form.setValue("estimated_time_in_minutes", durationInMinutes);
              const distanceText = element.distance.text;
              form.setValue("estimated_distance", distanceText);
            } else {
              console.error("Error calculating duration:", status);
              toast.error("Unable to calculate travel time.");
              form.setValue("estimated_time_in_minutes", 0);
              form.setValue("estimated_distance", "");
            }
          }
        );
      }, 500); // 500ms debounce delay
    }
  }, [pickupCoords, dropCoords, rateType, isLoaded]); // Removed 'form' from dependencies

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  async function fetchVehicles() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("No auth token found for vehicles");
      return;
    }

    const organisationRide = form.watch("organisation_ride");
    const organisationId = form.getValues("organisation_id");

    if (organisationRide) {
      try {
        const resp = await vehicleService.getAllVehiclesByOrganisationId(
          token,
          Number(organisationId)
        );
        if (resp.success && Array.isArray(resp.data)) {
          setVehicles(
            resp.data.map((vehicle) => ({
              ...vehicle,
              vehicleDetail: {
                ...vehicle.vehicleDetail,
                brand: vehicle.vehicleDetail.make || "Unknown",
              },
            }))
          );
        } else {
          toast.error("Please Create User for this Organization ");
        }
      } catch (err) {
        console.error("Error fetching vehicles for organization:", err);
        toast.error("Error fetching vehicles for organization");
      }
    } else {
      if (selectedCustomerId) {
        try {
          const resp = await vehicleService.getVehicleByUserId(
            selectedCustomerId,
            token
          );
          if (resp.success && Array.isArray(resp.data)) {
            setVehicles(
              resp.data.map((vehicle: Vehicle) => ({
                ...vehicle,
                vehicleDetail: {
                  ...vehicle.vehicleDetail,
                  brand: vehicle.vehicleDetail.make || "Unknown",
                },
              }))
            );
          } else {
            toast.error(resp.error || "Failed to fetch vehicles");
          }
        } catch (err) {
          console.error("Error fetching vehicles:", err);
          toast.error("Error fetching vehicles");
        }
      } else {
        setVehicles([]); // Clear vehicles if no customer is selected
      }
    }
  }

  useEffect(() => {
    fetchVehicles();
  }, [
    selectedCustomerId,
    form.watch("organisation_ride"),
    form.watch("organisation_id"),
  ]);

  useEffect(() => {
    DriverService.fetchIndividualDrivers()
      .then((resp) => {
        if (resp.success && Array.isArray(resp.data)) {
          setDrivers(resp.data);
        } else {
          toast.error(resp.error || "Failed to fetch drivers");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error fetching drivers");
      });
  }, []);

  useEffect(() => {
    async function fetchAvailableChauffeurs() {
      try {
        const response = await DriverService.getAvailableChauffeurs();
        if (response.success && Array.isArray(response.data)) {
          setChauffeurs(response.data);
        } else {
          toast.error(
            response.error || "Failed to fetch available chauffeurs."
          );
        }
      } catch (error) {
        console.error("Error fetching available chauffeurs:", error);
        toast.error("Error fetching available chauffeurs.");
      }
    }
    fetchAvailableChauffeurs();
  }, []);

  async function onSubmit(data: CreateRideFormValues) {
    setSubmitting(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("No auth token found. Please log in.");
      setSubmitting(false);
      return;
    }
  
    let userId: number | null = null;
    let customerId: number;
  
    // Fetch userId for organization rides or from localStorage for customer rides
    if (data.organisation_ride) {
      try {
        const response = await fetch(
          `${BASE_URL}/api/organization/all-users-organizations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orgnanisation_id: data.organisation_id,
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user ID from organization API");
        }
        const resData = await response.json();
        if (resData.success && resData.data && resData.data.length > 0) {
          userId = resData.data[0].id;
        } else {
          toast.error("No users found for the selected organization.");
          setSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching user ID:", err);
        toast.error("Error fetching user ID from organization API");
        setSubmitting(false);
        return;
      }
    } else {
      const userDetailsString = localStorage.getItem("userDetails");
      if (userDetailsString) {
        try {
          const userDetails = JSON.parse(userDetailsString);
          userId = userDetails.data.user_id;
        } catch (err) {
          console.error("Error parsing userDetails from localStorage:", err);
        }
      }
    }
  
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      setSubmitting(false);
      return;
    }
  
    // Set customerId based on ride type
    if (data.organisation_ride) {
      customerId = Number(data.organisation_id);
      if (!customerId) {
        toast.error("Please select an organisation for the ride.");
        setSubmitting(false);
        return;
      }
    } else {
      customerId = selectedCustomerId;
      if (!customerId) {
        toast.error("Please select a customer before creating the ride.");
        setSubmitting(false);
        return;
      }
    }
  
    const selectedVehicle = vehicles.find(
      (veh) => veh.id.toString() === data.vehicle
    );
    if (!selectedVehicle) {
      toast.error("Selected vehicle not found.");
      setSubmitting(false);
      return;
    }
  
    const { hours_booked } = data;
    const finalEstimatedMinutes =
      data.rate_type === "per_hour" && hours_booked
        ? hours_booked * 60
        : data.estimated_time_in_minutes || 0;
  
    const vehicleDetails = {
      vehicle_id: selectedVehicle.id.toString(),
      color: selectedVehicle.vehicleDetail.color,
      make: selectedVehicle.vehicleDetail.make,
      brand: selectedVehicle.vehicleDetail.model,
    };
  
    const finalOrganisationId = data.organisation_ride ? data.organisation_id : "1";
  
    const ridePayload: CreateRidePayload = {
      is_customer_available: data.is_customer_available,
      estimated_time_in_minutes: finalEstimatedMinutes,
      hours_booked: data.hours_booked,
      ride_type: data.ride_type,
      rate_type: data.rate_type,
      requested_pickup_point: data.requested_pickup_point,
      requested_drop_point: data.requested_drop_point,
      requested_pickup: data.requested_pickup,
      requested_drop: data.requested_drop,
      paymentDetails: data.paymentDetails,
      vehicleDetails,
      chauffeur_id: data.chauffeur_id || 0,
      organisation_id: finalOrganisationId,
      organisation_ride: data.organisation_ride,
      chauffeur_name: data.chauffeur_name || "",
      ...(data.ride_type === "scheduled" && {
        scheduled_pickup: data.scheduled_datetime || undefined,
      }),
    };
  
    try {
      let response;
      let idToSend: number;
  
      if (data.organisation_ride && data.organisation_id !== "1" && data.organisation_id !== "*") {
        // Organization ride for non-default organization
        idToSend = userId;
        if (data.ride_type === "scheduled") {
          const apiUrl = `${BASE_URL}/api/admin/create-schedule-ride-from-org-user/${idToSend}`;
          response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(ridePayload),
          });
          const resData = await response.json();
          if (!response.ok || !resData.success) {
            throw new Error(resData.error || resData.message || "Failed to create scheduled organisation ride");
          }
          response = { success: true, data: resData.data, status: response.status, error: null };
        } else {
          const apiUrl = `${BASE_URL}/api/admin/create-ride-for-organisation`;
          response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(ridePayload),
          });
          const resData = await response.json();
          if (!response.ok || !resData.success) {
            throw new Error(resData.error || resData.message || "Failed to create organisation ride");
          }
          response = { success: true, data: resData.data, status: response.status, error: null };
        }
      } else {
        // Customer ride or default organization ride
        idToSend = data.organisation_ride ? userId : customerId;
        if (data.ride_type === "scheduled") {
          if (!data.scheduled_datetime) {
            throw new Error("Scheduled date and time are required for scheduled rides");
          }
          response = await rideService.createScheduledRide(idToSend, ridePayload);
        } else {
          response = await rideService.createRide(idToSend, ridePayload);
        }
      }
  
      const rideData = response.data;
      if (response.success) {
        console.log("Ride created:", rideData);
        toast.success("Ride created successfully!");
  
        const defaultRateType = (isOrganisationAllowed && !data.organisation_ride) || data.organisation_id === "1" || data.organisation_id === "*"
          ? "per_min"
          : "fixed";
  
        const defaultPaymentMethod = (isOrganisationAllowed && !data.organisation_ride) || data.organisation_id === "1" || data.organisation_id === "*"
          ? ""
          : "Wallet Credit";
  
        const defaultOrganisationRide = isOrganisationAllowed ? data.organisation_ride : true;
        const defaultOrganisationId = isOrganisationAllowed ? (data.organisation_ride ? data.organisation_id : "1") : allowedOrganization || "";
  
        form.reset({
          is_customer_available: true,
          customer_name: "",
          estimated_time_in_minutes: 0,
          estimated_distance: "",
          hours_booked: null,
          ride_type: "instant",
          rate_type: defaultRateType,
          requested_pickup_point: "",
          requested_drop_point: "",
          requested_pickup: { lat: 0, long: 0 },
          requested_drop: { lat: 0, long: 0 },
          paymentDetails: { payment_method: defaultPaymentMethod },
          vehicle: "",
          chauffeur_id: null,
          organisation_ride: defaultOrganisationRide,
          organisation_id: defaultOrganisationId,
          chauffeur_name: "",
          estimated_fare: 0,
          scheduled_datetime: null,
        });
        setSelectedCustomerId(0);
      } else {
        throw new Error(response.error || "Failed to create ride");
      }
    } catch (err: any) {
      console.error("Error creating ride:", err);
      if (err.message && err.message.includes("Cannot read properties of undefined (reading 'rates')")) {
        toast.error("Pricing is not added for this organization. Please contact the admin.");
      } else {
        toast.error(err.message || "Failed to create ride");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCustomerSelect(customer: Customer) {
    const fullName = `${customer.first_name} ${customer.last_name}`;
    form.setValue("customer_name", fullName);
    setSelectedCustomerId(customer.id);
  }

  if (!isLoaded) {
    return <div>Loading form...</div>;
  }

  const [chauffeurOpen, setChauffeurOpen] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded">
        {isOrganisationAllowed && (
          <FormField
            control={form.control}
            name="organisation_ride"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2">
                <Checkbox checked={field.value} onChange={field.onChange} />
                <FormLabel className="m-0 cursor-pointer">
                  Organization Ride
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {organisationRide ? (
          <FormField
            control={form.control}
            name="organisation_id"
            render={({ field }) => (
              <FormItem className="rounded">
                <FormLabel>Organization</FormLabel>
                <FormControl>
                  <Select
                    disabled={!isOrganisationAllowed}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgLoading ? (
                        <SelectItem value="1" disabled>
                          Loading organizations...
                        </SelectItem>
                      ) : organizations.length === 0 ? (
                        <SelectItem value="1" disabled>
                          No organizations available
                        </SelectItem>
                      ) : (
                        organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem className="rounded">
                <FormLabel>Customer</FormLabel>
                <CustomerAutocomplete
                  value={field.value || ""}
                  onChange={field.onChange}
                  onSelect={handleCustomerSelect}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded">
          <FormField
            control={form.control}
            name="rate_type"
            render={({ field }) => (
              <FormItem className="rounded">
                <FormLabel>Rate Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate type" />
                    </SelectTrigger>
                    <SelectContent>
                      {rateTypesFiltered.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(form.watch("rate_type") === "per_hour" ||
            form.watch("rate_type") === "half_day" ||
            form.watch("rate_type") === "full_day") && (
            <FormField
              control={form.control}
              name="hours_booked"
              render={({ field }) => {
                if (
                  form.watch("rate_type") === "half_day" ||
                  form.watch("rate_type") === "full_day"
                ) {
                  const autoValue =
                    form.watch("rate_type") === "half_day" ? 4 : 8;
                  if (field.value !== autoValue) {
                    field.onChange(autoValue);
                  }
                  return (
                    <FormItem className="rounded">
                      <FormLabel>Hours Booked</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="rounded"
                          value={autoValue}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }
                return (
                  <FormItem className="rounded">
                    <FormLabel>Hours Booked</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value)
                          )
                        }
                        placeholder="Enter hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          <FormField
            control={form.control}
            name="ride_type"
            render={({ field }) => (
              <FormItem className="rounded">
                <FormLabel>Ride Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ride type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="instant">Instant</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {rideType === "scheduled" && (
            <FormField
              control={form.control}
              name="scheduled_datetime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Date & Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <input
                        type="text"
                        value={
                          field.value
                            ? new Date(field.value).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : ""
                        }
                        placeholder="Scheduled Date & Time"
                        readOnly
                        className="w-full p-2 border rounded cursor-pointer"
                        onClick={() => setShowCalendar(!showCalendar)}
                      />
                      {showCalendar && (
                        <div className="absolute z-50 mt-2 bg-white border rounded-md shadow-md">
                          <DateTimePicker
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => {
                              field.onChange(date ? date.toISOString() : null);
                              setShowCalendar(false);
                            }}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="requested_pickup_point"
            render={() => (
              <FormItem className="rounded">
                <FormLabel>Pickup Location</FormLabel>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="requested_pickup_point"
                    render={({ field }) => (
                      <Autocomplete
                        onLoad={(ac) => setPickupAutocomplete(ac)}
                        onPlaceChanged={() => {
                          const place = pickupAutocomplete?.getPlace();
                          if (place?.geometry) {
                            const coords = {
                              lat: place.geometry.location.lat(),
                              long: place.geometry.location.lng(),
                            };
                            form.setValue("requested_pickup", coords);
                            field.onChange(
                              place.formatted_address || place.name
                            );
                            onLocationChange("requested_pickup", coords);
                          }
                        }}
                      >
                        <Input
                          {...field}
                          placeholder="Search pickup location"
                          className="rounded"
                        />
                      </Autocomplete>
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requested_drop_point"
            render={() => (
              <FormItem className="rounded">
                <FormLabel>Drop Location</FormLabel>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="requested_drop_point"
                    render={({ field }) => (
                      <Autocomplete
                        onLoad={(ac) => setDropAutocomplete(ac)}
                        onPlaceChanged={() => {
                          const place = dropAutocomplete?.getPlace();
                          if (place?.geometry) {
                            const coords = {
                              lat: place.geometry.location.lat(),
                              long: place.geometry.location.lng(),
                            };
                            form.setValue("requested_drop", coords);
                            field.onChange(
                              place.formatted_address || place.name
                            );
                            onLocationChange("requested_drop", coords);
                          }
                        }}
                      >
                        <Input
                          {...field}
                          placeholder="Search drop location"
                          className="rounded"
                        />
                      </Autocomplete>
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {organisationId === "1" || organisationId === "*" ? (
            <PaymentMethodField
              form={form}
              paymentMethods={paymentMethods}
              loading={loadingPayments}
              error={paymentError}
            />
          ) : (
            <FormField
              control={form.control}
              name="paymentDetails.payment_method"
              render={({ }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Input value="Wallet Credit" readOnly className="rounded" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {rateType === "per_min" && [
            <FormField
              key="estimated_time_in_minutes"
              control={form.control}
              name="estimated_time_in_minutes"
              render={({ field }) => (
                <FormItem className="rounded">
                  <FormLabel>Estimated Time(hr)</FormLabel>
                  <FormControl>
                    <Input value={field.value != null ? (field.value / 60).toFixed(2) : ""} readOnly className="rounded" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />,
            <FormField
              key="estimated_distance"
              control={form.control}
              name="estimated_distance"
              render={({ field }) => (
                <FormItem className="rounded">
                  <FormLabel>Estimated Distance (km)</FormLabel>
                  <FormControl>
                    <Input value={field.value} readOnly className="rounded" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />,
          ]}

          <FormField
            control={form.control}
            name="estimated_fare"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Fare</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ? `AED ${field.value.toFixed(2)}` : ""}
                    readOnly
                    className="bg-gray-100 rounded"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicle"
            render={({ field }) => (
              <FormItem className="rounded">
                <FormLabel>Vehicle</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No vehicles available
                        </SelectItem>
                      ) : (
                        vehicles.map((veh) => (
                          <SelectItem key={veh.id} value={veh.id.toString()}>
                            {`${veh.vehicleDetail.make} - ${veh.vehicleDetail.model} - ${veh.registration_no}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

            {(allowedOrganization === "1" || allowedOrganization === "*") && (
            <FormField
              control={form.control}
              name="chauffeur_id"
              render={({ field }) => {
                const [chauffeurSearch, setChauffeurSearch] = useState("");
                const [chauffeurLoading, setChauffeurLoading] = useState(false);
                const filteredChauffeurs = chauffeurs.filter((chauffeur) =>
                  `${chauffeur.id} ${chauffeur.name || ""}`
                    .toLowerCase()
                    .includes(chauffeurSearch.toLowerCase())
                );
                const selectedChauffeur = chauffeurs.find(
                  (chauffeur) => chauffeur.id === field.value
                );

                const fetchNearbyChauffeurs = async () => {
                  setChauffeurLoading(true);
                  try {
                    const response = await DriverService.getAvailableChauffeurs();
                    if (response.success && Array.isArray(response.data)) {
                      setChauffeurs(response.data);
                    } else {
                      toast.error(
                        response.error || "Failed to fetch nearby chauffeurs."
                      );
                    }
                  } catch (error) {
                    console.error("Error fetching nearby chauffeurs:", error);
                    toast.error("Error fetching nearby chauffeurs.");
                  } finally {
                    setChauffeurLoading(false);
                  }
                };

                return (
                  <FormItem className="rounded">
                    <FormLabel>Chauffeur</FormLabel>
                    <FormControl>
                      <Popover
                        open={chauffeurOpen}
                        onOpenChange={(open) => {
                          setChauffeurOpen(open);
                          if (open) {
                            fetchNearbyChauffeurs();
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={chauffeurOpen}
                            className="w-full md:w-full lg:w-full justify-between"
                          >
                            {selectedChauffeur
                              ? `${selectedChauffeur.id} - ${selectedChauffeur.name}`
                              : "Select a chauffeur"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full md:w-full lg:w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search chauffeur..."
                              className="h-9 text-sm"
                              onValueChange={(value) => setChauffeurSearch(value)}
                            />
                            <CommandList>
                              {chauffeurLoading ? (
                                <CommandEmpty>Loading chauffeurs...</CommandEmpty>
                              ) : filteredChauffeurs.length === 0 ? (
                                <CommandEmpty>No chauffeur found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {filteredChauffeurs.map((chauffeur) => (
                                    <CommandItem
                                      key={chauffeur.id}
                                      value={`${chauffeur.id} ${chauffeur.name || ""}`}
                                      onSelect={() => {
                                        field.onChange(chauffeur.id);
                                        form.setValue(
                                          "chauffeur_name",
                                          `${chauffeur.name || ""}`
                                        );
                                        setChauffeurOpen(false);
                                        setChauffeurSearch("");
                                      }}
                                      className="text-sm"
                                    >
                                      {chauffeur.id} - {chauffeur.name || ""}{" "}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          chauffeur.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}
        </div>
        <Button type="submit" className="w-full rounded" disabled={submitting}>
          {submitting ? "Creating Ride..." : "Create Ride"}
        </Button>
      </form>
    </Form>
  );
}
