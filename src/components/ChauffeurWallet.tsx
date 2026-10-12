import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PaginationComponent } from "./PaginationComponent";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowBigRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Empty, Spin } from "antd";
import PresetCalendar from "./PresetCalendar";
import { walletService, HistoryWalletDetail } from "@/utils/WalletService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ChauffeurWalletHistoryPage() {
  const [data, setData] = useState<HistoryWalletDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 15;
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const navigate = useNavigate();

  // Export states for exporting Chauffeur Wallet Logs
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState<boolean>(false);
  // For export, you may choose to default to empty or leave as is.
  const [exportRange, setExportRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [, setExportMessage] = useState<string>("");

  // Fetch wallet history
  const fetchWalletHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      let start_date = "";
      let end_date = "";
      if (dateRange) {
        // Set to 12:01 AM and 11:59 PM of the selected dates in local time
        const startOfRange = new Date(dateRange.from);
        startOfRange.setHours(0, 1, 0, 0); // 12:01 AM local time
        const endOfRange = new Date(dateRange.to);
        endOfRange.setHours(23, 59, 0, 0); // 11:59 PM local time
        start_date = startOfRange.toISOString(); // Convert to UTC
        end_date = endOfRange.toISOString(); // Convert to UTC
      }
      const payload = {
        start_date,
        end_date,
        page: currentPage + 1,
        limit: rowsPerPage,
      };

      console.log("Payload:", payload); // Debug to verify timestamps
      const response = await walletService.getChauffeurWalletHistory(token, payload);
      if (response.success && response.data) {
        setData(response.data.data);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.error || "No data available");
      }
    } catch (err) {
      setError("Error fetching wallet history.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch data on mount and when page or date range changes
  useEffect(() => {
    fetchWalletHistory();
  }, [currentPage, dateRange]);

  // Handle navigation to details page
  const handleNavigate = (chauffeurId: number) => {
    const query = dateRange
      ? `?chauffeurId=${chauffeurId}&start_date=${dateRange.from.toISOString()}&end_date=${dateRange.to.toISOString()}`
      : `?chauffeurId=${chauffeurId}`;
    navigate(`/admin/dashboard/CashHandlingDetails${query}`);
  };

  const exportChauffeurWalletLogs = async () => {
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
      // Use exportRange if provided, otherwise fallback to dateRange
      const rangeToExport = exportRange || dateRange;
      if (!rangeToExport || !rangeToExport.from) {
        const errMsg = "Please select an export date range.";
        setExportMessage(errMsg);
        toast.error(errMsg);
        setExportLoading(false);
        return;
      }
      
      // Adjust the export dates to 12:01 AM and 11:59 PM local time, then convert to UTC.
      const exportFromLocal = new Date(rangeToExport.from);
      exportFromLocal.setHours(0, 1, 0, 0); // 12:01 AM local time
      
      const exportToLocal = new Date(rangeToExport.to || rangeToExport.from);
      exportToLocal.setHours(23, 59, 0, 0); // 11:59 PM local time

      const payload = {
        start_date: exportFromLocal.toISOString(), // UTC timestamp
        end_date: exportToLocal.toISOString(), // UTC timestamp
      };

      const response = await walletService.exportChauffeurWalletLogs(token, payload);
      if (response.success) {
        if (response.data instanceof Blob) {
          const blob = response.data;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "chauffeur_wallet_export.xlsx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          console.error("Response data is not a Blob:", response.data);
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

  return (
    <div className="p-4">
      {/* Filter Section */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex flex-col">
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
        <div className="w-full sm:w-auto flex items-end mt-6 gap-4">
          <Button
            onClick={fetchWalletHistory}
            variant="outline"
            className="w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded"
          >
            Search
          </Button>
         {/* Export Button with Popover */}
         <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-green-500 text-white py-2 px-4 rounded"
              >
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <div className="flex flex-col space-y-4">
                <h3 className="font-semibold">Select Export Date Range</h3>
                <PresetCalendar
                  selected={exportRange}
                  onSelect={(range) => {
                    if (!range?.from) return;
                    setExportRange({ from: range.from, to: range.to || range.from });
                  }}
                />
                <Button
                  onClick={exportChauffeurWalletLogs}
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

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-10">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 border-b border-gray-300">
              <TableCell className="px-4 py-2 font-semibold">Chauffeur ID</TableCell>
              <TableCell className="px-4 py-2 font-semibold">Name</TableCell>
              <TableCell className="px-4 py-2 font-semibold">Wallet Balance (AED)</TableCell>
              <TableCell className="px-4 py-2 font-semibold"></TableCell> {/* Empty header for arrow */}
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
                  <Empty description="No data available" />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={`${row.User?.id ?? "unknown"}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNavigate(row.User?.id ?? 0)}
                >
                  <TableCell className="px-4 py-2">{row.User?.id ?? "N/A"}</TableCell>
                  <TableCell className="px-4 py-2">
                    {`${row.User?.first_name ?? "N/A"} ${row.User?.last_name ?? ""}`.trim()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="text-right w-[5vw]">{row.wallet_balance ?? "N/A"}</div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <ArrowBigRight
                      className="h-5 w-5 text-gray-500 hover:text-blue-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click from triggering
                        handleNavigate(row.User?.id ?? 0);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <PaginationComponent
        totalItems={totalRecords}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}

export default ChauffeurWalletHistoryPage;
