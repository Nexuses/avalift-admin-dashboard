"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, endOfDay, subDays } from "date-fns";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Edit2, Trash2, Eye } from "lucide-react";
import { Spin } from "antd";
import BASE_URL from "@/config/apiConfig";
import { CreateCouponForm } from "@/components/CreateCouponForm";

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

interface CouponUsageDetail {
  customer_id: number;
  usageCount: string;
  User: {
    first_name: string;
    last_name: string;
  };
  coupon_code?: string; // Optional, included when fetching all coupons
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

const CouponDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const couponId = params.couponId as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [usageDetails, setUsageDetails] = useState<CouponUsageDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCouponsLoading, setAllCouponsLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [totalTablePages, setTotalTablePages] = useState(1);
  const rowsPerPage = 10;

  // Filter states
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");

  const token = localStorage.getItem("authToken");

  const fetchAllCoupons = async () => {
    try {
      setAllCouponsLoading(true);
      console.log("Fetching all coupons from:", `${BASE_URL}/api/coupons/view-all`);
      console.log("Using token:", token);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${BASE_URL}/api/coupons/view-all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log("All coupons response status:", response.status);
      const rawData = await response.json();
      console.log("All coupons raw API response:", rawData);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const couponsData: Coupon[] = Array.isArray(rawData) ? rawData : rawData.results?.data || rawData.data || [];
      console.log("All coupons data:", couponsData);
      setAllCoupons(couponsData);

      if (couponId && !isNaN(parseInt(couponId))) {
        const selectedCoupon = couponsData.find(c => c.id === parseInt(couponId));
        if (selectedCoupon) {
          setCoupon(selectedCoupon);
        } else {
          setError("Coupon not found");
        }
      }
    } catch (err) {
      console.error("Fetch all coupons error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching coupons");
      toast.error(err instanceof Error ? err.message : "An error occurred while fetching coupons");
    } finally {
      setAllCouponsLoading(false);
      setLoading(false);
    }
  };

  const fetchCouponUsageDetails = async (page: number = 1) => {
    try {
      setUsageLoading(true);
      const payload: any = {
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        page,
        limit: rowsPerPage,
      };
      if (selectedCouponId) {
        payload.coupon_id = parseInt(selectedCouponId);
      }

      console.log("Fetching usage details with payload:", payload);
      const response = await fetch(`${BASE_URL}/api/admin/get-coupon-usage-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data: CouponUsageDetailsResponse = await response.json();
      console.log("Usage Details Response:", data);
      if (data.results.success && data.results.data.data) {
        setUsageDetails(data.results.data.data);
        setTotalTablePages(data.results.data.totalPages);
        setCurrentTablePage(data.results.data.currentPage);
      } else {
        throw new Error(data.results.message || "Failed to fetch coupon usage details");
      }
    } catch (err) {
      console.error("Fetch Usage Details Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching coupon usage details");
      toast.error(err instanceof Error ? err.message : "An error occurred while fetching coupon usage details");
    } finally {
      setUsageLoading(false);
    }
  };

  const deleteCoupon = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/coupons/delete-coupons/${couponId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      toast.success(data.message || "Coupon deleted successfully");
      navigate("/coupons");
    } catch (err) {
      console.error("Delete Coupon Error:", err);
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEditCoupon = () => {
    setShowCouponForm(true);
  };

  const handleViewUsageDetails = () => {
    setUsageDetails([]);
    setSelectedCouponId(couponId);
    fetchCouponUsageDetails();
    setUsageDialogOpen(true);
  };

  const handleCouponClose = () => {
    setShowCouponForm(false);
    fetchAllCoupons();
  };

  const handleCouponClick = (id: number) => {
    navigate(`/coupons/${id}`);
  };

  const handleFilterApply = () => {
    setCurrentTablePage(1);
    fetchCouponUsageDetails(1);
  };

  useEffect(() => {
    console.log("useEffect triggered with couponId:", couponId);
    console.log("Auth Token:", token);
    if (!couponId || isNaN(parseInt(couponId))) {
      console.log("Invalid couponId");
      setError("No coupons available");
      setLoading(false);
    }
    if (!token) {
      console.log("No auth token");
      setError("Authentication token missing");
      setLoading(false);
      navigate("/login");
      return;
    }
    fetchAllCoupons();
    fetchCouponUsageDetails();
  }, [couponId, token, navigate]);

  if (loading || allCouponsLoading || usageLoading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <Spin />
      </div>
    );
  }

  if (error && !coupon && allCoupons.length === 0 && usageDetails.length === 0) {
    return (
      <div className="p-4 flex justify-center items-center min-h-screen">
        <div className="bg-red-100 p-4 rounded-md text-sm text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Coupon Usage Details Table */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Coupon Usage Details</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => date && setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
              dateFormat="yyyy-MM-dd"
              className="border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => date && setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              dateFormat="yyyy-MM-dd"
              className="border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Coupon</label>
            <select
              value={selectedCouponId}
              onChange={(e) => setSelectedCouponId(e.target.value)}
              className="border rounded-md p-2 w-full"
            >
              <option value="">All Coupons</option>
              {allCoupons.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.coupon_code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleFilterApply} className="bg-blue-500 text-white">
              Apply Filters
            </Button>
          </div>
        </div>
        {usageDetails.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer ID</TableHead>
                <TableHead>Customer Name</TableHead>
                {/* <TableHead>Coupon Code</TableHead> */}
                <TableHead>Usage Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageDetails.map((usage, index) => (
                <TableRow key={`${usage.customer_id}-${index}`}>
                  <TableCell>{(currentTablePage - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{usage.customer_id}</TableCell>
                  <TableCell>
                    {usage.User ? `${usage.User.first_name} ${usage.User.last_name}` : "Unknown"}
                  </TableCell>
                  {/* <TableCell>{usage.coupon_code || "N/A"}</TableCell> */}
                  <TableCell>{parseInt(usage.usageCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 p-4">No usage data available.</p>
        )}
        {totalTablePages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => fetchCouponUsageDetails(currentTablePage - 1)}
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
              onClick={() => fetchCouponUsageDetails(currentTablePage + 1)}
              disabled={currentTablePage === totalTablePages}
              variant="outline"
              className="rounded"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* All Coupons Table */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">All Coupons</h2>
        {allCoupons.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid To</TableHead>
                {/* <TableHead>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCoupons.map((c) => {
                const isExpired = new Date() > endOfDay(new Date(c.valid_to));
                return (
                  <TableRow
                    key={c.id}
                    onClick={() => handleCouponClick(c.id)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.coupon_title}</TableCell>
                    <TableCell>{c.coupon_code}</TableCell>
                    <TableCell>
                      {c.discount_type === "percentage"
                        ? `${c.discount_value}%`
                        : `AED ${c.discount_value}`}
                    </TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(c.valid_to), "PPP")}</TableCell>
                    <TableCell>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/coupons/${c.id}`);
                        }}
                      >
                        View
                      </Button> */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 p-4">No coupons available.</p>
        )}
      </div>

      {/* Specific Coupon Details */}
      {coupon && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/coupons">Coupons</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{coupon.coupon_code}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex justify-between items-center pt-4 mb-6">
            <h1 className="text-2xl font-bold">Coupon Details: {coupon.coupon_code}</h1>
            <div className="flex gap-2">
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded"
                onClick={handleEditCoupon}
              >
                <Edit2 className="h-4 w-4 mr-1" /> Edit Coupon
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-red-500 hover:bg-red-600 text-white rounded">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Coupon
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
                      onClick={deleteCoupon}
                      className="bg-red-600 hover:bg-red-700 rounded"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded"
                onClick={handleViewUsageDetails}
              >
                <Eye className="h-4 w-4 mr-1" /> View Usage
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Coupon Information</h2>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Title</TableCell>
                  <TableCell>{coupon.coupon_title}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Code</TableCell>
                  <TableCell>{coupon.coupon_code}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Discount Type</TableCell>
                  <TableCell>
                    {coupon.discount_type === "percentage" ? "Percentage" : "Fixed Amount"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Discount Value</TableCell>
                  <TableCell>
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `AED ${coupon.discount_value}`}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Max Discount Amount</TableCell>
                  <TableCell>
                    {coupon.max_discount_amount ? `AED ${coupon.max_discount_amount}` : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Valid From</TableCell>
                  <TableCell>{format(new Date(coupon.valid_from), "PPP")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Valid To</TableCell>
                  <TableCell>{format(new Date(coupon.valid_to), "PPP")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    {coupon.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    {new Date() > endOfDay(new Date(coupon.valid_to)) && (
                      <Badge variant="destructive" className="ml-2">
                        Expired
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Usage Limit</TableCell>
                  <TableCell>{coupon.usage_limit || "Unlimited"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Max Usage Per User</TableCell>
                  <TableCell>{coupon.max_usage_per_user || "Unlimited"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Combinable</TableCell>
                  <TableCell>{coupon.is_combinable ? "Yes" : "No"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">First Order Only</TableCell>
                  <TableCell>{coupon.first_order_only ? "Yes" : "No"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Min Subtotal</TableCell>
                  <TableCell>{coupon.min_subtotal ? `AED ${coupon.min_subtotal}` : "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Max Subtotal</TableCell>
                  <TableCell>{coupon.max_subtotal ? `AED ${coupon.max_subtotal}` : "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Created At</TableCell>
                  <TableCell>{format(new Date(coupon.createdAt), "PPP")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Updated At</TableCell>
                  <TableCell>{format(new Date(coupon.updatedAt), "PPP")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {coupon.rules && coupon.rules.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Rules</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Rule Type</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Value 2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupon.rules.map((rule, index) => (
                      <TableRow key={rule.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{rule.rule_type}</TableCell>
                        <TableCell>{rule.operator || "N/A"}</TableCell>
                        <TableCell>{rule.value || "N/A"}</TableCell>
                        <TableCell>{rule.value2 || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {coupon.applicable_user_groups && coupon.applicable_user_groups.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Applicable User Groups</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Group Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupon.applicable_user_groups.map((group, index) => (
                      <TableRow key={group.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{group.group_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Dialog open={showCouponForm} onOpenChange={setShowCouponForm}>
            <DialogContent className="max-w-3xl bg-transparent border-none">
              <DialogHeader>
                <DialogTitle>Edit Coupon</DialogTitle>
              </DialogHeader>
              <CreateCouponForm
                onClose={handleCouponClose}
                couponId={parseInt(couponId)}
                endpoint={`${BASE_URL}/api/coupons/update-coupons/${couponId}`}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Usage Details for Coupon {coupon.coupon_code}</DialogTitle>
              </DialogHeader>
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
                          <TableCell>
                            {usage.User ? `${usage.User.first_name} ${usage.User.last_name}` : "Unknown"}
                          </TableCell>
                          <TableCell>{parseInt(usage.usageCount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalTablePages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={() => fetchCouponUsageDetails(currentTablePage - 1)}
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
                        onClick={() => fetchCouponUsageDetails(currentTablePage + 1)}
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
        </>
      )}
    </div>
  );
};

export default CouponDetailsPage;