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
import { walletService, PDWalletDetail, PdWalletByIdDetail } from "@/utils/WalletService";
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

/**
 * Helper: Converts a local date with a specified hour and minute to its UTC ISO string.
 * For example, using (date, 0, 1) sets the time to 12:01 AM local time, then converts to UTC.
 */
const convertLocalDateToUTC = (date: Date, hours: number, minutes: number): string => {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
  return localDate.toISOString();
};

export function PDWalletDetailsPage() {
  // State for wallet transactions (handover details)
  const [data, setData] = useState<PDWalletDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const rowsPerPage = 15;

  // State for received payments
  const [receivedData, setReceivedData] = useState<PdWalletByIdDetail[]>([]);
  const [receivedLoading, setReceivedLoading] = useState<boolean>(false);
  const [receivedError, setReceivedError] = useState<string | null>(null);

  // Toggle between views
  const [view, setView] = useState<"wallet" | "received">("wallet");

  // Date range filter (assumed to be in local time)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  // Extract query parameters from URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const pdId = queryParams.get("pdId");
  const startDate = queryParams.get("start_date");
  const endDate = queryParams.get("end_date");

  // Navigation hook
  const navigate = useNavigate();

  // Sync date range with URL params on mount
  useEffect(() => {
    if (startDate && endDate) {
      setDateRange({
        from: new Date(startDate),
        to: new Date(endDate),
      });
    }
  }, [startDate, endDate]);

  // Fetch wallet transactions (handover details)
  const fetchWalletDetails = async () => {
    if (!pdId) {
      setError("PD ID is missing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      const startUTC = dateRange ? convertLocalDateToUTC(dateRange.from, 0, 1) : "";
      const endUTC = dateRange ? convertLocalDateToUTC(dateRange.to, 23, 59) : "";

      const payload = {
        pd_id: parseInt(pdId),
        start_date: startUTC,
        end_date: endUTC,
        page: currentPage + 1,
        limit: rowsPerPage,
      };
      const response = await walletService.getPdWalletBalance(token, payload);
      if (response.success && response.data) {
        setData(response.data);
        setTotalRecords(response.data.length); // Adjust if API provides totalRecords
      } else {
        setError(response.error || "No data available");
      }
    } catch (err) {
      setError("Error fetching wallet details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch received payments using getPdWalletById
  const fetchReceivedPayments = async () => {
    if (!pdId) {
      setReceivedError("PD ID is missing.");
      return;
    }
    setReceivedLoading(true);
    setReceivedError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      const startUTC = dateRange ? convertLocalDateToUTC(dateRange.from, 0, 1) : "";
      const endUTC = dateRange ? convertLocalDateToUTC(dateRange.to, 23, 59) : "";

      const payload = {
        pd_id: pdId,
        start_date: startUTC,
        end_date: endUTC,
      };
      const response = await walletService.getPdWalletById(token, payload);
      if (response.success && response.data) {
        setReceivedData(response.data);
      } else {
        setReceivedError(response.error || "No received payment data available");
      }
    } catch (err) {
      setReceivedError("Error fetching received payments.");
    } finally {
      setReceivedLoading(false);
    }
  };

  // Fetch data based on selected view
  useEffect(() => {
    if (view === "wallet") {
      fetchWalletDetails();
    } else {
      fetchReceivedPayments();
    }
  }, [view, currentPage, pdId, dateRange]);

  // Determine PD name
  const pdName = data.length > 0
    ? `${data[0].User.first_name} ${data[0].User.last_name}`
    : receivedData.length > 0
    ? `${receivedData[0]["PD-User"].first_name} ${receivedData[0]["PD-User"].last_name}`
    : "Unknown";

  // Combined loading state for refresh button
  const isLoading = view === "wallet" ? loading : receivedLoading;

  // Refresh handler with date range reset
  const handleRefresh = () => {
    setDateRange(undefined); // Reset date range
    if (view === "wallet") {
      fetchWalletDetails();
    } else {
      fetchReceivedPayments();
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
              <BreadcrumbPage>PD</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate(-1)} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center rounded bg-blue-500 text-white" disabled={isLoading}>
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
        Cash Handling for {pdName} (ID: {pdId})
      </h3>

      {/* Filter Section */}
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
          <label htmlFor="view-select" className="text-sm font-medium">Select View</label>
          <select
            id="view-select"
            value={view}
            onChange={(e) => setView(e.target.value as "wallet" | "received")}
            className="border rounded p-2 bg-white shadow-sm w-full sm:w-[200px]"
          >
            <option value="wallet">Hand over details</option>
            <option value="received">Amount received details</option>
          </select>
        </div>
      </div>

      {/* Wallet Transactions Table (Handover Details) */}
      {view === "wallet" && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="px-4 py-2 font-semibold">Date</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Hand-over Amount</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Handed Over To</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-red-500 py-4">
                    {error}
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <Empty description="No handover history found" />
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-2">
                      {row.hand_over_transaction_date
                        ? format(new Date(row.hand_over_transaction_date), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-red-500 font-bold">
                      {row.hand_over_amount}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row["Hand-Over-User"]
                        ? `${row["Hand-Over-User"].first_name} ${row["Hand-Over-User"].last_name}`
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

      {/* Received Payments Table */}
      {view === "received" && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="px-4 py-2 font-semibold">Date</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Amount Received</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Amount received From</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivedLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : receivedError ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-red-500 py-4">
                    {receivedError}
                  </TableCell>
                </TableRow>
              ) : receivedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <Empty description="No received payments found" />
                  </TableCell>
                </TableRow>
              ) : (
                receivedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-2">
                      {row.pd_transaction_date
                        ? format(new Date(row.pd_transaction_date), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-green-500 font-bold">
                      {row.hand_over_amount}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row["User"]
                        ? `${row["User"].id}-${row["User"].first_name} ${row["User"].last_name}`
                        : "N/A"}
                    </TableCell>
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

export default PDWalletDetailsPage;