import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ApiResponse } from "@/utils/apiFetcher";
import { pdHistoryAdminService } from "@/utils/pdRideHistoryService";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PDService from "@/utils/pdService";
import { Empty, Spin } from "antd";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationNext,
} from "@/components/ui/pagination";
import { FiRefreshCcw } from "react-icons/fi";

interface RequestedPickup {
  lat: { N: string };
  long: { N: string };
}

interface PDHistoryData {
  ride_id: string;
  requested_pickup: RequestedPickup;
  updatedAt: string;
  status: string;
  SK: string;
  pd_id: string;
  PK: string;
  requested_pickup_point: string;
  requested_drop_point?: string;
  chauffeur_id: number;
  chauffeur_name?: string;
  pd_name?: string;
}

interface PDHistoryApiResponse {
  data: PDHistoryData[];
}

interface DataRow {
  ride_id: string;
  point: string;
  status: string;
  chauffeur_id: number;
  updatedAt: string;
  pd_id: string;
  chauffeur_name: string;
  pd_name: string;
}

interface PDItem {
  id: string;
  name: string;
  createdAt: string;
}

export function PDHistoryTable() {
  const [data, setData] = React.useState<DataRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState<number>(1); // 1-indexed
  const rowsPerPage = 15;

  // Default to today’s 12:01 AM to 11:59 PM local time
  const today = new Date();
  const [fromDate, setFromDate] = React.useState<Date>(() => {
    const start = new Date(today);
    start.setHours(0, 1, 0, 0); // 12:01 AM local time
    return start;
  });
  const [toDate, setToDate] = React.useState<Date>(() => {
    const end = new Date(today);
    end.setHours(23, 59, 0, 0); // 11:59 PM local time
    return end;
  });

  const [action, setAction] = React.useState<string>("all");
  const [pdFilter, setPdFilter] = React.useState<string>("all");
  const [pdList, setPdList] = React.useState<PDItem[]>([]);

  React.useEffect(() => {
    const fetchPDs = async () => {
      try {
        setLoading(true);
        const result = await PDService.fetchIndividualPD();
        if (!result.success || !result.data) {
          setError(result.error || "Failed to fetch PD list.");
          return;
        }
        const pds: PDItem[] = result.data.map((pd: any) => ({
          id: String(pd.id),
          name: `${pd.first_name} ${pd.last_name}`.trim() || `PD ${pd.id}`,
          createdAt: pd.createdAt,
        }));
        pds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPdList(pds);
      } catch (err) {
        setError("Error fetching PD list.");
      } finally {
        setLoading(false);
      }
    };

    fetchPDs();
  }, []);

  const fetchPDHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure 12:01 AM to 11:59 PM local time
      const startLocal = fromDate ? new Date(fromDate) : new Date();
      startLocal.setHours(0, 1, 0, 0); // 12:01 AM local time
      const endLocal = toDate ? new Date(toDate) : new Date();
      endLocal.setHours(23, 59, 0, 0); // 11:59 PM local time

      const from_date = startLocal.toISOString();
      const to_date = endLocal.toISOString();

      const query: any = { from_date, to_date };
      if (action !== "all") query.action = action;
      if (pdFilter !== "all") query.pd_id = Number(pdFilter);

      const response: ApiResponse<PDHistoryApiResponse> = await pdHistoryAdminService.fetchPDHistory(query);

      if (
        response.success &&
        Array.isArray(response.data?.data) &&
        response.data.data.length > 0
      ) {
        const mappedData: DataRow[] = response.data.data.map((record) => ({
          ride_id: record.ride_id,
          point: record.status === "Dropped"
            ? record.requested_drop_point || record.requested_pickup_point
            : record.requested_pickup_point,
          status: record.status,
          chauffeur_id: record.chauffeur_id,
          updatedAt: record.updatedAt || "N/A",
          pd_id: record.pd_id,
          chauffeur_name: record.chauffeur_name || "N/A",
          pd_name: record.pd_name || "N/A",
        }));

        setData(mappedData);
        setError(null);
      } else {
        setData([]);
      }
    } catch (err) {
      setError("Error fetching PD history");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's data on mount and whenever filters change
  React.useEffect(() => {
    fetchPDHistory();
  }, [fromDate, toDate, action, pdFilter, currentPage]);

  // Calculate paginated data (convert currentPage to zero-indexed)
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);
  const totalPagesCalc = Math.ceil(data.length / rowsPerPage);

  // Pagination handler
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Refresh handler: reset all filters and reload data.
  const handleRefresh = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 1, 0, 0); // 12:01 AM local time
    const end = new Date(now);
    end.setHours(23, 59, 0, 0); // 11:59 PM local time
    setFromDate(start);
    setToDate(end);
    setAction("all");
    setPdFilter("all");
    setCurrentPage(1);
    fetchPDHistory();
  };

  return (
    <div className="w-full p-4">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          <FiRefreshCcw className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filter Form */}
      <div className="flex flex-wrap items-end gap-4">
        {/* From Date Picker */}
        <div className="w-1/5">
          <label className="block text-sm font-medium mb-1">From Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "PPP") : "Pick From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={fromDate} onSelect={(date) => setFromDate(date!)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* To Date Picker */}
        <div className="w-1/5">
          <label className="block text-sm font-medium mb-1">To Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, "PPP") : "Pick To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={toDate} onSelect={(date) => setToDate(date!)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-1/5">
          <label className="block text-sm font-medium mb-1">Action</label>
          <Select value={action} onValueChange={(val) => setAction(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Picked">Picked</SelectItem>
              <SelectItem value="Dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PD Dropdown */}
        <div className="w-1/5">
          <label className="block text-sm font-medium mb-1">PD</label>
          <Select value={pdFilter} onValueChange={(val) => setPdFilter(val)}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading..." : "All PDs"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {pdList.length > 0 ? (
                pdList.map((pd) => (
                  <SelectItem key={pd.id} value={pd.id}>
                    <div className="flex items-center space-x-2">
                      <span>
                        {pd.id} - {pd.name}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-pd" disabled>
                  No PD available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <div>
          <Button
            onClick={fetchPDHistory}
            variant="outline"
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table className="mt-6 w-full">
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">Ride ID</TableCell>
            <TableCell className="font-semibold">Updated At</TableCell>
            <TableCell className="font-semibold">
              {action === "Dropped"
                ? "Drop Point"
                : action === "Picked"
                ? "Pickup Point"
                : "Pickup/Drop Point"}
            </TableCell>
            <TableCell className="font-semibold">Status</TableCell>
            <TableCell className="font-semibold">Chauffeur</TableCell>
            <TableCell className="font-semibold">PD</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                <Spin />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-red-500 py-4">
                {error}
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                <Empty description="No data available" />
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => (
              <TableRow key={`${row.ride_id}-${row.updatedAt}`}>
                <TableCell>{row.ride_id}</TableCell>
                <TableCell>
                  {row.updatedAt !== "N/A"
                    ? format(new Date(row.updatedAt), "PPP p")
                    : "N/A"}
                </TableCell>
                <TableCell>{row.point}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{`${row.chauffeur_id} - ${row.chauffeur_name}`}</TableCell>
                <TableCell>{`${row.pd_id} - ${row.pd_name}`}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPagesCalc > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                className={cn({ "opacity-50 pointer-events-none": currentPage === 1 })}
              />
            </PaginationItem>
            {(() => {
              const pages: (number | "ellipsis")[] = [];
              if (totalPagesCalc <= 7) {
                for (let i = 1; i <= totalPagesCalc; i++) {
                  pages.push(i);
                }
              } else {
                const current = currentPage;
                pages.push(1);
                if (current > 3) pages.push("ellipsis");
                const start = Math.max(2, current - 1);
                const end = Math.min(totalPagesCalc - 1, current + 1);
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                if (current < totalPagesCalc - 2) pages.push("ellipsis");
                pages.push(totalPagesCalc);
              }
              return pages.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationEllipsis key={index} />
                ) : (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(item as number);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              );
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPagesCalc) handlePageChange(currentPage + 1);
                }}
                className={cn({ "opacity-50 pointer-events-none": currentPage === totalPagesCalc || totalPagesCalc === 0 })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}