"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Spin, Empty } from "antd";
import { walletService } from "@/utils/WalletService";
import { PaginationComponent } from "./PaginationComponent";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowLeft, RefreshCw, Loader } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PresetCalendar from "./PresetCalendar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define the RidePayment interface
interface RidePayment {
  ride_id: string;
  amount_to_be_paid: string;
  chauffeur_id: string;
  adjusted_ride_amount: number;
  type?: string; // Optional field to distinguish payment type
}

interface ChauffeurWalletDetail {
  pd_transaction_date: string;
  hand_over_amount: string;
  has_handed_over: boolean;
  User: {
    first_name: string;
    last_name: string;
    id: number;
  };
  "PD-User": {
    first_name: string;
    last_name: string;
    id: number;
  };
}

/**
 * Converts a local date and specified time (hours and minutes) into its corresponding UTC ISO string.
 * The date is interpreted in the browser's local time zone.
 */
const convertLocalDateToUTC = (date: Date, hours: number, minutes: number): string => {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
  return localDate.toISOString();
};

export function ChauffeurWalletDetailsPage() {
  // State for wallet transactions
  const [data, setData] = useState<ChauffeurWalletDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0); // 0-based for PaginationComponent
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const rowsPerPage = 15;

  // State for ride payments
  const [rideData, setRideData] = useState<RidePayment[]>([]);
  const [rideLoading, setRideLoading] = useState<boolean>(false);
  const [rideError, setRideError] = useState<string | null>(null);

  // State for view selection
  const [view, setView] = useState<"wallet" | "ride">("wallet");

  // State for date range (these are assumed to be in local time)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  // Get query parameters from URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const chauffeurId = queryParams.get("chauffeurId");
  const startDateParam = queryParams.get("start_date");
  const endDateParam = queryParams.get("end_date");

  // Navigation hook
  const navigate = useNavigate();

  // Sync date range with URL params on mount
  useEffect(() => {
    if (startDateParam && endDateParam) {
      setDateRange({
        from: new Date(startDateParam),
        to: new Date(endDateParam),
      });
    }
  }, [startDateParam, endDateParam]);

  // Fetch wallet transactions
  const fetchWalletDetails = async () => {
    if (!chauffeurId) {
      setError("Chauffeur ID is missing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      // Convert local date boundaries to UTC.
      const startUTC = dateRange ? convertLocalDateToUTC(dateRange.from, 0, 1) : "";
      const endUTC = dateRange ? convertLocalDateToUTC(dateRange.to, 23, 59) : "";

      const payload = {
        start_date: startUTC,
        end_date: endUTC,
        chauffeur_id: parseInt(chauffeurId),
        page: currentPage + 1, // API expects 1-based page numbers
        limit: rowsPerPage,
      };
      const response = await walletService.getChauffeurWalletBalance(token, payload);
      if (response.success && response.data) {
        setData(response.data.data);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.error || "No data available");
      }
    } catch (err) {
      setError("Error fetching wallet details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch ride payments (only paymentsRec)
  const fetchRidePayments = async () => {
    if (!chauffeurId) {
      setRideError("Chauffeur ID is missing.");
      return;
    }
    setRideLoading(true);
    setRideError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      // Convert local time to UTC for ride payments as well.
      const startUTC = dateRange ? convertLocalDateToUTC(dateRange.from, 0, 1) : "";
      const endUTC = dateRange ? convertLocalDateToUTC(dateRange.to, 23, 59) : "";

      const payload = {
        chauffeur_id: chauffeurId,
        start_date: startUTC,
        end_date: endUTC,
        page: 1, // Hardcoded for simplicity
        limit: 1000, // Fetch all data; adjust if pagination is needed
      };
      const response = await walletService.getChauffeurWalletById(token, payload);
      if (response.success && response.data) {
        const { paymentsRec } = response.data.data.rides;
        const combinedData = paymentsRec.map((item) => ({ ...item, type: "Cash Payment" }));
        setRideData(combinedData);
      } else {
        setRideError(response.error || "No ride payment data available");
      }
    } catch (err) {
      setRideError("Error fetching ride payments.");
    } finally {
      setRideLoading(false);
    }
  };

  // Fetch data based on selected view
  useEffect(() => {
    if (view === "wallet") {
      fetchWalletDetails();
    }
  }, [view, currentPage, chauffeurId, dateRange]);

  useEffect(() => {
    if (view === "ride") {
      fetchRidePayments();
    }
  }, [view, chauffeurId, dateRange]);

  // Determine chauffeur name
  const chauffeurName = data.length > 0
    ? `${data[0].User.first_name} ${data[0].User.last_name}`
    : "Unknown";

  // Combined loading state for refresh button
  const isLoading = view === "wallet" ? loading : rideLoading;

  // Refresh handler with date range reset
  const handleRefresh = () => {
    setDateRange(undefined); // Reset date range
    if (view === "wallet") {
      fetchWalletDetails();
    } else {
      fetchRidePayments();
    }
  };

  return (
    <div className="w-full p-4">
      {/* Header with Breadcrumb and Buttons */}
      <div className="flex items-center justify-between mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Cash Handling</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Chauffeur</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate(-1)} className="flex items-center rounded">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleRefresh} className="flex items-center rounded bg-blue-500 text-white" disabled={isLoading}>
            {isLoading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold mb-4">
        Cash Handling for {chauffeurName} (ID: {chauffeurId})
      </h3>

      {/* Filter Section - Date Range and View Select in One Row */}
      <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex flex-col mt-6">
          <label className="text-sm font-medium">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[300px] justify-start text-left">
                {dateRange ? (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {`${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`}
                  </>
                ) : (
                  "Select Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <PresetCalendar
                selected={dateRange}
                onSelect={(range) => {
                  if (!range?.from) return;
                  setDateRange({ from: range.from, to: range.to || range.from });
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col mt-6">
          <label htmlFor="view-select" className="text-sm font-medium">Select</label>
          <select
            id="view-select"
            value={view}
            onChange={(e) => setView(e.target.value as "wallet" | "ride")}
            className="border rounded p-2 bg-white shadow-sm w-full sm:w-[200px]"
          >
            <option value="wallet">Hand over details</option>
            <option value="ride">Amount received details</option>
          </select>
        </div>
      </div>

      {/* Wallet Transactions Table */}
      {view === "wallet" && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="px-4 py-2 font-semibold">Date</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Hand-over Amount</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Handed Over</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Handed Over To</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-500 py-4">
                    {error}
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    <Empty description="No wallet history found" />
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-2">
                      {row.pd_transaction_date
                        ? format(new Date(row.pd_transaction_date), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-red-500 font-bold">
                      {row.hand_over_amount}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row.has_handed_over ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row["PD-User"]
                        ? `${row["PD-User"].first_name} ${row["PD-User"].last_name}`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination for Wallet Transactions */}
      {view === "wallet" && totalRecords > 0 && (
        <div className="mt-4">
          <PaginationComponent
            totalItems={totalRecords}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Ride Payments Table */}
      {view === "ride" && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="px-4 py-2 font-semibold">Ride ID</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Amount Received</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Adjusted Ride Amount</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rideLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : rideError ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-red-500 py-4">
                    {rideError}
                  </TableCell>
                </TableRow>
              ) : rideData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <Empty description="No ride payments found" />
                  </TableCell>
                </TableRow>
              ) : (
                rideData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-2">{row.ride_id}</TableCell>
                    <TableCell className="px-4 py-2 text-green-500 font-bold">
                      {row.amount_to_be_paid}
                    </TableCell>
                    <TableCell className="px-4 py-2">{row.adjusted_ride_amount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}