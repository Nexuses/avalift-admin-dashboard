"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PresetCalendar from "@/components/PresetCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import InvoiceService from "@/utils/InvoiceService";
import organizationService from "@/utils/organizationSevice";
import orgRideService from "@/utils/organizationalRideService";
import { Empty } from "antd";

interface Organization {
  id: number;
  name: string;
  address?: string;
  country_code?: string;
  mobile_number?: string;
}

interface GenerateInvoicePayload {
  organization_id: number | string;
  start_date: string;
  end_date: string;
}

interface GetOrgRidesPayload {
  organization_id: number;
  start_date: string;
  end_date: string;
}

interface Ride {
  estimated_time_in_minutes: number;
  requested_drop: { lat: number; long: number };
  paymentDetails: { card: null | string; payment_method: string };
  status: string;
  otp: string;
  after_ride_images: string[];
  before_ride_images: string[];
  estimated_amount: number;
  status_log: { datetime: string; status: string }[];
  requested_drop_point: string;
  all_rides_pk: string;
  organisation_ride: boolean;
  ride_type: string;
  vehicleDetails: { color: string; vehicle_id: string; make: string; brand: string };
  SK: string;
  requested_pickup: { lat: number; long: number };
  ride_id: string;
  is_customer_available: boolean;
  customer_id: string;
  rate_type: string;
  end_time: string;
  lower_customer_name: string;
  requested_pickup_point: string;
  planned_end_time: string;
  order_date: string;
  final_price_calculation: {
    mandatory_charges: { total: number; breakdown: object };
    total_after_discount: number;
    appliedCoupons: any[];
    rates: { base_fare: number; per_hour: number; half_day: number; per_min: number; full_day: number };
    vat: number;
    final_total_amount: number;
    base_fare: number;
    estimated_total_amount: number;
    previous_balance: number;
    couponErrors: any[];
    other_charges: { total: number; breakdown: object };
    isCouponApplied: boolean;
    coupon_discount: number;
  };
  updatedAt: string;
  vehicle_id: string;
  chauffeur_name: string;
  organisation_id: string;
  PK: string;
  hours_booked: null | number;
  chauffeur_id: number;
  customer_name: string;
  customer_details: { name: string; country_code: string; id: number; mobile_number: string };
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  status?: number | null;
  error?: string | null;
  message?: string | null;
}

export function InvoicePage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgLoading, setOrgLoading] = useState<boolean>(true);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>("none");
  const [rides, setRides] = useState<Ride[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);



  // Helper function to convert a local date range to UTC boundaries:
  // Start: 12:01 AM local time
  // End: 11:59 PM local time
  const convertDateRangeToUTC = (from: Date, to: Date) => {
    const start = new Date(from);
    start.setHours(0, 1, 0, 0); // 12:01 AM local time
    const utcStartDate = start.toISOString();

    const end = new Date(to);
    end.setHours(23, 59, 0, 0); // 11:59 PM local time
    const utcEndDate = end.toISOString();

    return { utcStartDate, utcEndDate };
  };

  const fetchOrganizations = async () => {
    setOrgLoading(true);
    setOrgError(null);
    try {
      const response = await organizationService.fetchAllOrganizations();
      if (response.success && response.data) {
        const orgs = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as any).data)
          ? (response.data as any).data
          : [];
        setOrganizations(orgs);
      } else {
        setOrganizations([]);
        setOrgError(response.error || "Failed to fetch organizations.");
        toast.error(response.error || "Failed to fetch organizations.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error fetching organizations.";
      setOrgError(errorMessage);
      setOrganizations([]);
      toast.error(errorMessage);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a valid date range.");
      return;
    }

    // Convert local date boundaries (12:01 AM and 11:59 PM) to UTC
    const { utcStartDate, utcEndDate } = convertDateRangeToUTC(dateRange.from, dateRange.to);

    const payload: GenerateInvoicePayload = {
      organization_id: selectedOrg === "none" ? "" : Number(selectedOrg),
      start_date: utcStartDate,
      end_date: utcEndDate,
    };

    setLoading(true);
    setError(null);
    try {
      const response = await InvoiceService.generateInvoice(payload);
      if (response.success) {
        toast.success("Invoice generated successfully!");
        setModalOpen(false); // Close modal on success
      } else {
        throw new Error(response.error || "Failed to generate invoice.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error generating invoice.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgRides = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a valid date range.");
      return;
    }
    if (selectedOrg === "none") {
      toast.error("Please select an organization.");
      return;
    }

    // Convert the local date boundaries to UTC with the desired times
    const { utcStartDate, utcEndDate } = convertDateRangeToUTC(dateRange.from, dateRange.to);

    const payload: GetOrgRidesPayload = {
      organization_id: Number(selectedOrg),
      start_date: utcStartDate,
      end_date: utcEndDate,
    };

    setSearchLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      const data: ApiResponse<Ride[]> = await orgRideService.fetchOrganizationalRides<Ride[]>(payload, token);
      console.log("API Response in fetchOrgRides:", data);
      if (data.success && Array.isArray(data.data)) {
        setRides(data.data);
        toast.success("Organizational rides fetched successfully!");
      } else {
        setRides([]);
        throw new Error(data.error || "Failed to fetch organizational rides.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error fetching organizational rides.";
      setError(errorMessage);
      setRides([]);
      toast.error(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Invoices</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6">Invoice Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate New Invoice</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            {orgLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : orgError ? (
              <p className="text-red-500">{orgError}</p>
            ) : organizations.length === 0 ? (
              <p>No organizations available</p>
            ) : (
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name} (ID: {org.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                    : "Select Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <PresetCalendar
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range && range.from) {
                      setDateRange({ from: range.from, to: range.to || new Date() });
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={fetchOrgRides}
              disabled={searchLoading}
              className="rounded h-8 text-sm px-3"
            >
              {searchLoading ? "Searching..." : "Search"}
            </Button>

            <Button
              onClick={() => setModalOpen(true)}
              disabled={loading}
              className="bg-blue-500 rounded h-8 text-sm px-3"
            >
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
        {error && (loading || searchLoading) && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Organizational Rides</h2>
        {searchLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ride ID</TableHead>
                <TableHead>Chauffeur Name</TableHead>
                <TableHead>Pickup Point</TableHead>
                <TableHead>Drop Point</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Final Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : rides.length === 0 ? (
          <div className="text-center py-8">
            <Empty description="No rides found. Please search with an organization and date range." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ride ID</TableHead>
                <TableHead>Chauffeur Name</TableHead>
                <TableHead>Pickup Point</TableHead>
                <TableHead>Drop Point</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Final Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.map((ride) => (
                <TableRow key={ride.ride_id}>
                  <TableCell>{ride.ride_id}</TableCell>
                  <TableCell>{ride.chauffeur_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{ride.requested_pickup_point}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{ride.requested_drop_point}</TableCell>
                  <TableCell>{format(new Date(ride.order_date), "PPP")}</TableCell>
                  <TableCell>{ride.final_price_calculation.final_total_amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Invoice Generation</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate an invoice for{" "}
              {selectedOrg === "none" ? "all organizations" : `organization ID ${selectedOrg}`} from{" "}
              {dateRange.from ? format(dateRange.from, "PPP") : "N/A"} to{" "}
              {dateRange.to ? format(dateRange.to, "PPP") : "N/A"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-8 text-sm px-3 rounded"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-8 text-sm px-3 bg-blue-500 rounded"
              onClick={handleGenerateInvoice}
              disabled={loading}
            >
              {loading ? "Generating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InvoicePage;
