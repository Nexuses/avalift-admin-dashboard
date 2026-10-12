"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CreateCouponForm } from "@/components/CreateCouponForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import BASE_URL from "@/config/apiConfig";
import { format, endOfDay, subDays } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ticket, Trash2, Edit2, Eye, Calendar, RefreshCw } from "lucide-react";
import { Spin } from "antd";
import { Badge } from "@/components/ui/badge";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


// Define the Coupon interface for TypeScript type safety
interface Coupon {
  id: number;
  coupon_title: string;
  coupon_code: string;
  discount_type: string;
  max_usage_per_user: number;
  discount_value: string;
  max_discount_amount: string;
  valid_from: string;
  valid_to: string;
  usage_limit: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  is_combinable: boolean;
  first_order_only: boolean;
  min_subtotal: string;
  max_subtotal: string;
  rules?: Array<{
    id: number;
    rule_type: string;
    operator?: string | null;
    value?: string | null;
    value2?: string | null;
  }>;
  applicable_user_groups?: Array<{ id: number; group_name: string }>;
}

// Interface for coupon usage summary data from the API
interface CouponUsage {
  id: number;
  coupon_title: string;
  coupon_code: string;
  valid_from: string;
  valid_to: string;
  usage_limit: number;
  is_active: boolean;
  couponUsages: Array<{
    coupon_id: number;
    customer_id: number;
    User: {
      first_name: string;
      last_name: string;
      id: number;
    };
  }>;
}

interface CouponUsageResponse {
  results: {
    success: boolean;
    message: string;
    data: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      perPage: number;
      data: CouponUsage[];
    };
  };
}

// Interface for coupon usage details data from the new API
interface CouponUsageDetail {
  customer_id: number;
  usageCount: string;
  User: {
    first_name: string;
    last_name: string;
  };
}

interface CouponUsageDetailsResponse {
  results: {
    success: boolean;
    message: string;
    data: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      perPage: number;
      data: CouponUsageDetail[];
    };
  };
}

// Main CouponsPage component
const CouponsPage: React.FC = () => {
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editCouponId, setEditCouponId] = useState<number | null>(null);
  const [couponUsages, setCouponUsages] = useState<{ [key: number]: number }>({});
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [dateFilterDialogOpen, setDateFilterDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [usageDetails, setUsageDetails] = useState<CouponUsageDetail[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [totalTablePages, setTotalTablePages] = useState(1);
  const rowsPerPage = 10;

  const token = localStorage.getItem("authToken");

  // Function to close the coupon form and refresh the list
  const handleCouponClose = () => {
    setShowCouponForm(false);
    setEditCouponId(null);
    fetchCoupons();
  };

  // Fetch all coupons from the API
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/coupons/view-all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch coupons");
      const couponsData = await response.json();
      setCoupons(couponsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch coupon usage summary from the API
  const fetchCouponUsageSummary = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setUsageLoading(true);
      const usageData: { [key: number]: number } = {};

      const payload = {
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        page: 1,
        limit: 100,
      };

      const response = await fetch(`${BASE_URL}/api/admin/get-coupon-usage-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to fetch coupon usage summary");

      const data: CouponUsageResponse = await response.json();
      if (data.results.success && data.results.data.data) {
        data.results.data.data.forEach((coupon: CouponUsage) => {
          usageData[coupon.id] = coupon.couponUsages.length;
        });
        setCouponUsages(usageData);
      } else {
        throw new Error(data.results.message || "Failed to fetch coupon usage data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching coupon usage");
      toast.error(err instanceof Error ? err.message : "An error occurred while fetching coupon usage");
    } finally {
      setUsageLoading(false);
    }
  };

  // Fetch coupon usage details from the new API
  const fetchCouponUsageDetails = async (couponId: number, page: number = 1) => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setUsageLoading(true);
      const payload = {
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        page,
        limit: rowsPerPage,
        coupon_id: couponId,
      };

      const response = await fetch(`${BASE_URL}/api/admin/get-coupon-usage-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to fetch coupon usage details");

      const data: CouponUsageDetailsResponse = await response.json();
      if (data.results.success && data.results.data.data) {
        setUsageDetails(data.results.data.data);
        setTotalTablePages(data.results.data.totalPages);
        setCurrentTablePage(data.results.data.currentPage);
      } else {
        throw new Error(data.results.message || "Failed to fetch coupon usage details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching coupon usage details");
      toast.error(err instanceof Error ? err.message : "An error occurred while fetching coupon usage details");
    } finally {
      setUsageLoading(false);
    }
  };

  // Delete a coupon by ID
  const deleteCoupon = async (couponId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/api/coupons/delete-coupons/${couponId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete coupon");

      const data = await response.json();
      toast.success(data.message || "Coupon deleted successfully");
      setCoupons(coupons.filter((coupon) => coupon.id !== couponId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Handle edit button click
  const handleEditCoupon = (couponId: number) => {
    setEditCouponId(couponId);
    setShowCouponForm(true);
    resetDateFilters(); // Reset date filters when editing
  };

  // Handle view usage details click
  const handleViewUsageDetails = (couponId: number) => {
    setSelectedCouponId(couponId);
    setUsageDetails([]);
    fetchCouponUsageDetails(couponId);
    setUsageDialogOpen(true);
  };

  // Reset date filters to default
  const resetDateFilters = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setError(null);
    setCouponUsages({}); // Clear usage data
    setDateFilterDialogOpen(false);
  };

  // Apply date filters
  const applyDateFilters = () => {
    if (startDate && endDate) {
      setDateFilterDialogOpen(false);
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    resetDateFilters(); // Reset filters on refresh
    fetchCoupons();
  };

  // Fetch usage summary when startDate or endDate changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchCouponUsageSummary();
    }
  }, [startDate, endDate]);

  // Fetch coupons on component mount
  useEffect(() => {
    resetDateFilters(); // Reset filters on mount
    fetchCoupons();
  }, []);

  return (
    <div className="p-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Coupons</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Create Coupon and Filter Buttons */}
      <div className="flex justify-between items-center pt-4">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <div className="flex gap-2">
          <Dialog open={dateFilterDialogOpen} onOpenChange={setDateFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                <Calendar className="h-4 w-4 mr-1" /> Filter by Date
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Coupon Usage Details-Date Range</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
  {/* Start Date Picker */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700">Start Date</label>
    <DatePicker
      selected={startDate}
      onChange={(date: Date | null) => setStartDate(date)}
      maxDate={endDate || new Date()}
      dateFormat="yyyy-MM-dd"
      shouldCloseOnSelect={true}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
      placeholderText="Select start date"
      autoFocus={false}
    />
  </div>

  {/* End Date Picker */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700">End Date</label>
    <DatePicker
      selected={endDate}
      onChange={(date: Date | null) => setEndDate(date)}
      minDate={startDate || undefined}
      maxDate={new Date()}
      dateFormat="yyyy-MM-dd"
      shouldCloseOnSelect={true}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
      placeholderText="Select end date"
      autoFocus={false}
    />
  </div>

  <div className="flex justify-end gap-2">
    <Button
      onClick={applyDateFilters}
      className="bg-blue-500 hover:bg-blue-600 text-white rounded"
      disabled={!startDate || !endDate}
    >
      Apply
    </Button>
    {/* <Button
      onClick={resetDateFilters}
      variant="outline"
      className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded"
    >
      Reset
    </Button> */}
  </div>
</div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleRefresh}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Dialog open={showCouponForm} onOpenChange={setShowCouponForm}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-transparent border-none">
              <DialogHeader>
                {/* Uncomment if you want a title */}
                {/* <DialogTitle>{editCouponId ? "Edit Coupon" : "Create New Coupon"}</DialogTitle> */}
              </DialogHeader>
              <CreateCouponForm
                onClose={handleCouponClose}
                couponId={editCouponId || undefined}
                endpoint={
                  editCouponId
                    ? `${BASE_URL}/api/coupons/update-coupons/${editCouponId}`
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <p className="text-gray-500 mt-4">
          <Spin />
        </p>
      )}
      {error && (
        <p className="p-2 rounded-md mt-4 text-sm text-center text-red-600">
          {error}
        </p>
      )}

      {/* Coupons List */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Coupons</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 max-w-7xl mx-auto">
        {coupons.map((coupon, index) => (
          <div
            key={coupon.id}
            className={cn(
              "flex flex-col min-h-[200px] lg:border-r py-10 relative group/feature dark:border-neutral-800",
              index % 3 === 0 && "lg:border-l dark:border-neutral-800",
              index < coupons.length - (coupons.length % 3 || 3) &&
                "lg:border-b dark:border-neutral-800"
            )}
          >
            {/* Expired Badge */}
            {new Date() > endOfDay(new Date(coupon.valid_to)) && (
              <Badge variant="destructive" className="absolute top-2 right-2 text-xs px-2 py-1 rounded">
                Expired
              </Badge>
            )}
            <div className="flex-1">
              <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                <Ticket />
              </div>
              <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                  {coupon.coupon_title}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
                Code: {coupon.coupon_code}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
                {coupon.discount_type === "percentage"
                  ? `${coupon.discount_value}% off`
                  : `AED ${coupon.discount_value} off`}
              </p>
              <p className="text-xs text-neutral-500 mt-2 relative z-10 px-10">
  Valid: {format(new Date(coupon.valid_from), "PPP")} - {format(new Date(coupon.valid_to), "PPP")}
</p>
              <p className="text-xs text-neutral-500 mt-2 relative z-10 px-10">
                Created: {format(new Date(coupon.createdAt), "PPP")}
              </p>
              <p className="text-xs text-neutral-500 mt-2 relative z-10 px-10">
                Used: {couponUsages[coupon.id] || 0} time{couponUsages[coupon.id] !== 1 ? "s" : ""} {startDate && endDate && (
            <p className="text-xs text-neutral-500 ">
              Date Range: {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
            </p>
          )}
              </p>
            </div>
            <div className="relative z-10 flex justify-end gap-2 px-4 pb-4 mt-4">
              <Button
                className="h-9 bg-blue-500 text-white text-sm hover:bg-blue-600 rounded px-3 transition-all duration-200"
                onClick={() => handleEditCoupon(coupon.id)}
              >
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                className="h-9 bg-blue-500 text-white text-sm hover:bg-blue-600 rounded px-3 transition-all duration-200"
                onClick={() => handleViewUsageDetails(coupon.id)}
              >
                <Eye className="h-4 w-4 mr-1" /> View Usage
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the coupon "
                      {coupon.coupon_title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCoupon(coupon.id)}
                      className="bg-red-600 hover:bg-red-700 rounded"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Details Dialog */}
      <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Usage Details for Coupon {coupons.find(c => c.id === selectedCouponId)?.coupon_code || selectedCouponId}
            </DialogTitle>
          </DialogHeader>
          {startDate && endDate && (
            <p className="text-sm text-gray-600 mb-4">
              Date Range: {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
            </p>
          )}
          {usageLoading ? (
            <div className="flex justify-center items-center p-6">
              <Spin />
            </div>
          ) : usageDetails.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Usage Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageDetails.map((usage, index) => (
                    <TableRow key={`${usage.customer_id}-${index}`}>
                      <TableCell>{(currentTablePage - 1) * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{usage.customer_id}</TableCell>
                      <TableCell>{usage.User ? `${usage.User.first_name} ${usage.User.last_name}` : "Unknown"}</TableCell>
                      <TableCell>{parseInt(usage.usageCount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalTablePages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={() => {
                      if (selectedCouponId) {
                        fetchCouponUsageDetails(selectedCouponId, currentTablePage - 1);
                      }
                    }}
                    disabled={currentTablePage === 1}
                    variant="outline"
                    className="rounded"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentTablePage} of {totalTablePages}
                  </span>
                  <Button
                    onClick={() => {
                      if (selectedCouponId) {
                        fetchCouponUsageDetails(selectedCouponId, currentTablePage + 1);
                      }
                    }}
                    disabled={currentTablePage === totalTablePages}
                    variant="outline"
                    className="rounded"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 p-4">No usage data available for this coupon.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;