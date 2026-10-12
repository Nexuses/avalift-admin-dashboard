"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationComponent } from "./PaginationComponent";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Empty, Spin } from "antd";
import { ApiResponse } from "@/utils/apiFetcher";
import { walletService } from "@/utils/WalletService";
import PresetCalendar from "./PresetCalendar";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

export function AdminWalletBalancePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const rowsPerPage = 15;

  // Default date range for wallet balance (today 12:01 AM to 11:59 PM local time)
  const today = new Date();
  const defaultFrom = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    1,
    0
  );
  const defaultTo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    0
  );

  // Date range for fetching wallet balance
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    from: defaultFrom,
    to: defaultTo,
  });

  // Export popover states and export date range (separate from the fetch range)
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState<boolean>(false);
  const [exportRange, setExportRange] = useState<DateRange>({
    from: defaultFrom,
    to: defaultTo,
  });
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [, setExportMessage] = useState<string>("");

  // Function to fetch admin wallet balance data
  const fetchWalletBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const userDetailsStr = localStorage.getItem("userDetails");
      if (!userDetailsStr) {
        const errMsg = "No user details found in localStorage.";
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      let userDetails;
      try {
        userDetails = JSON.parse(userDetailsStr);
      } catch (error) {
        const errMsg = "Error parsing user details from localStorage.";
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      const adminId = userDetails?.data?.user_id;
      if (!adminId) {
        const errMsg = "Admin ID not found in user details.";
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      if (!selectedRange || !selectedRange.from) {
        const errMsg = "Please select a date range.";
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      // Use 'from' and 'to' dates (if 'to' is missing, use 'from')
      const fromDate = selectedRange.from;
      const toDate = selectedRange.to || selectedRange.from;

      // Convert local dates to ISO strings (UTC)
      const start_date = fromDate.toISOString();
      const end_date = toDate.toISOString();

      const payload = {
        start_date,
        end_date,
        page: currentPage,
        limit: rowsPerPage,
      };

      const response: ApiResponse<any> = await walletService.getAdminWalletHistory(
        localStorage.getItem("authToken") || "",
        payload
      );

      if (response.success) {
        setData(response.data || []);
        setTotalPages(1);
        setError(null);
      } else {
        setData([]);
        const errMsg = response.error || "No data found.";
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      const errMsg = "Error fetching wallet balance.";
      setError(errMsg);
      toast.error(errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export function to call admin export API and download the file
  const exportAdminWalletLogs = async () => {
    setExportLoading(true);
    setExportMessage("");
    try {
      const token = localStorage.getItem("authToken") || "";
      if (!token) {
        const errMsg = "No authorization token found.";
        setExportMessage(errMsg);
        toast.error(errMsg);
        setExportLoading(false);
        return;
      }
      if (!exportRange || !exportRange.from) {
        const errMsg = "Please select an export date range.";
        setExportMessage(errMsg);
        toast.error(errMsg);
        setExportLoading(false);
        return;
      }

      // Adjust the export dates to local time 12:01 AM and 11:59 PM before converting to UTC.
      const exportFromLocal = new Date(exportRange.from);
      exportFromLocal.setHours(0, 1, 0, 0); // Set to 12:01 AM local time

      const exportToLocal = new Date(exportRange.to || exportRange.from);
      exportToLocal.setHours(23, 59, 0, 0); // Set to 11:59 PM local time

      const payload = {
        start_date: exportFromLocal.toISOString(), // UTC timestamp
        end_date: exportToLocal.toISOString(), // UTC timestamp
      };

      const response: ApiResponse<any> = await walletService.exportAdminWalletLogs(
        token,
        payload
      );
      if (response.success) {
        // If response.data is a Blob, trigger file download.
        if (response.data instanceof Blob) {
          const blob = response.data;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "admin_wallet_export.xlsx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        const successMsg = "Export successful!";
        setExportMessage(successMsg);
        toast.success(successMsg);
      } else {
        const errMsg = response.error || "Export failed.";
        setExportMessage(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      const errMsg = "Error exporting data.";
      setExportMessage(errMsg);
      toast.error(errMsg);
      console.error(err);
    } finally {
      setExportLoading(false);
      setIsExportPopoverOpen(false);
    }
  };

  // Auto-fetch default data on mount
  useEffect(() => {
    fetchWalletBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Filter Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Date Range Field for Fetch */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:max-w-[16rem] truncate justify-start text-left font-normal"
                )}
              >
                {selectedRange && selectedRange.from
                  ? `${format(selectedRange.from, "PPP")} - ${
                      selectedRange.to
                        ? format(selectedRange.to, "PPP")
                        : format(selectedRange.from, "PPP")
                    }`
                  : "Select Date Range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <PresetCalendar
                selected={selectedRange}
                onSelect={(range) =>
                  setSelectedRange(range || { from: defaultFrom, to: defaultTo })
                }
              />
            </PopoverContent>
          </Popover>
          {/* Search Button */}
          <Button
            onClick={() => {
              setCurrentPage(1); // Reset page when new dates are searched
              fetchWalletBalance();
            }}
            variant="outline"
            className="bg-blue-500 text-white py-2 px-6 rounded whitespace-nowrap"
          >
            {loading ? "Search" : "Search"}
          </Button>
          {/* Export Button with Popover */}
          <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-green-500 text-white py-2 px-6 rounded whitespace-nowrap"
              >
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <div className="flex flex-col space-y-4">
                <h3 className="font-semibold">Select Export Date Range</h3>
                <PresetCalendar
                  selected={exportRange}
                  onSelect={(range) =>
                    setExportRange(range || { from: defaultFrom, to: defaultTo })
                  }
                />
                <Button
                  onClick={exportAdminWalletLogs}
                  disabled={exportLoading || !exportRange || !exportRange.from}
                  className="bg-green-500 text-white"
                >
                  {exportLoading ? "Exporting..." : "Export"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Table Section */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 border-b border-gray-300">
              <TableCell className="px-4 py-3 font-semibold">Admin ID</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Name</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Wallet Balance</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <Spin />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-red-500 py-6">
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <Empty description="No data available" />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={`${row.User?.id ?? "unknown"}-${index}`}
                  className="hover:bg-gray-50"
                >
                  <TableCell className="px-4 py-3">{row.User?.id ?? "N/A"}</TableCell>
                  <TableCell className="px-4 py-3">
                    {row.User ? `${row.User.first_name} ${row.User.last_name}`.trim() : "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-right w-[5vw]">{row.wallet_balance ?? "N/A"}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Section */}
      <div className="mt-6">
        <PaginationComponent
          totalItems={totalPages * rowsPerPage}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            fetchWalletBalance();
          }}
        />
      </div>
    </div>
  );
}

export default AdminWalletBalancePage;
