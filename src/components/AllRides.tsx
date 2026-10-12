
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isToday} from "date-fns"; // Added startOfDay, endOfDay
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import RideDetailsCard from "@/components/RideDetailsCard";
import rideService, {
  Ride,
  RidesResponse,
  GetAllRidesPayload,
  RideDetails,
} from "@/utils/RideService";
import organizationService from "@/utils/organizationSevice";
import { Empty } from "antd";
import { FiRefreshCcw, FiDownload } from "react-icons/fi";
import { toast } from "sonner";

interface Organization {
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string;
}

function getStartDateUTC(date: Date): string {
  const startLocal = new Date(date);
  startLocal.setHours(0, 1, 0, 0); // 12:01 AM local time
  return startLocal.toISOString();
}

function getEndDateUTC(date: Date): string {
  const endLocal = new Date(date);
  endLocal.setHours(23, 59, 0, 0); // 11:59 PM local time
  return endLocal.toISOString();
}

export function AllRidesTable() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rideType, setRideType] = useState<"instant" | "scheduled">("instant");
  const [searchString, setSearchString] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rideDetailsLoading, setRideDetailsLoading] = useState<boolean>(false);
  const [rideDetailsError, setRideDetailsError] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgLoading, setOrgLoading] = useState<boolean>(true);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [exportFromDate, setExportFromDate] = useState<Date | undefined>(undefined);
  const [exportToDate, setExportToDate] = useState<Date | undefined>(undefined);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [isFromDatePickerOpen, setIsFromDatePickerOpen] = useState(false);
  const [isToDatePickerOpen, setIsToDatePickerOpen] = useState(false);
  const [allowedOrg, setAllowedOrg] = useState<string | null>(null);
  const [rateTypeFilter, setRateTypeFilter] = useState<string>("");
  const [needsRefresh, setNeedsRefresh] = useState<boolean>(false); // New state to track refresh need

  const searchQuery = searchString.trim();

  function formatAddress(address: string): string {
    const parts = address.split(",").map((part) => part.trim());
    const plusCodeRegex = /^[A-Z0-9]{3,}\+[A-Z0-9]{2,}$/i;
    if (parts.length > 0 && plusCodeRegex.test(parts[0])) {
      parts.shift();
    }
    const countryRegex = /^[A-Za-z\s]+$/;
    if (parts.length > 0 && countryRegex.test(parts[parts.length - 1])) {
      parts.pop();
    }
    return parts.join(", ");
  }

  function formatLimitedAddress(address: string): string {
    const formatted = formatAddress(address);
    return formatted.length > 20 ? formatted.slice(0, 20) + "..." : formatted;
  }

  const fetchAllRides = async (pageNumber: number) => {
    setLoading(true);
    setError(null);

    const payload: GetAllRidesPayload = {
      status: statusFilter,
      search_string: searchQuery,
      start_date: fromDate ? getStartDateUTC(fromDate) : undefined,
      end_date: toDate ? getEndDateUTC(toDate) : undefined,
      ride_type: rideType,
      selected_org: selectedOrg,
      ...(rateTypeFilter && { rate_type: rateTypeFilter }), // Add rate type to payload only if filter is set
    };

    try {
      const response = await rideService.getAllRides(pageNumber, 10, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch rides.");
      }
      const json: RidesResponse = response.data;
      setRides(json.data.rides || []);
      setTotalPages(json.data.totalPages || 1);
      setCurrentPage(json.data.currentPage || pageNumber);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching rides.");
      setRides([]);
      toast.error(err.message || "An error occurred while fetching rides.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRide = async (rideId: string) => {
    setRideDetailsLoading(true);
    setRideDetailsError(null);
    try {
      const res = await rideService.getRideById(rideId);
      if (res.success && res.data) {
        setSelectedRide(res.data);
      } else {
        setRideDetailsError(res.error || "Failed to load ride details.");
        setSelectedRide(null);
        toast.error(res.error || "Failed to load ride details.");
      }
    } catch (err: any) {
      setRideDetailsError(err.message || "Failed to load ride details.");
      setSelectedRide(null);
      toast.error(err.message || "Failed to load ride details.");
    } finally {
      setRideDetailsLoading(false);
      setIsDialogOpen(true);
    }
  };

  const fetchOrganizations = async () => {
      const token = localStorage.getItem("authToken");
      const allowed = localStorage.getItem("allowedOrganization");
      
      if (!token) {
        setOrgError("No authentication token found. Please log in.");
        setOrgLoading(false);
        toast.error("No authentication token found. Please log in.");
        return;
      }
  
      // Only fetch all organizations if user has proper permissions
      if (allowed !== "*" && allowed !== "1") {
        // If user is restricted to specific org, just set that org
        if (allowed) {
          const restrictedOrg = {
            id: parseInt(allowed),
            name: "Your Organization", // This should ideally be fetched from a single org endpoint
            address: "",
            country_code: "",
            mobile_number: ""
          };
          setOrgs([restrictedOrg]);
          setSelectedOrg(allowed);
        }
        setOrgLoading(false);
        return;
      }
  
      try {
        setOrgLoading(true);
        setOrgError(null);
        const response = await organizationService.fetchAllOrganizations();
        if (response.success && response.data) {
          const orgs = Array.isArray(response.data)
            ? response.data
            : Array.isArray((response.data as any).data)
            ? (response.data as any).data
            : [];
          setOrgs(orgs);
        } else {
          setOrgError(response.error || "Failed to load organizations.");
          setOrgs([]);
          toast.error(response.error || "Failed to load organizations.");
        }
      } catch (err: any) {
        setOrgError(err.message || "Error fetching organizations.");
        setOrgs([]);
        toast.error(err.message || "Error fetching organizations.");
      } finally {
        setOrgLoading(false);
      }
    };

  const sortedRides =
    rideType === "scheduled"
      ? [...rides].sort((a, b) => {
          const aDate = a.scheduled_pickup ? new Date(a.scheduled_pickup) : null;
          const bDate = b.scheduled_pickup ? new Date(b.scheduled_pickup) : null;
          const aIsToday = aDate ? isToday(aDate) : false;
          const bIsToday = bDate ? isToday(bDate) : false;
          if (aIsToday && !bIsToday) return -1;
          if (!aIsToday && bIsToday) return 1;
          return 0;
        })
      : rides;

  const handlePageChange = (pageIndex: number) => {
    const newPage = pageIndex + 1;
    fetchAllRides(newPage);
  };

  const getPaginationItems = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const current = currentPage;
      pages.push(1);
      if (current > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (current < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const downloadRidesExcel = async (from: Date | undefined, to: Date | undefined) => {
    try {
      const payload = {
        start_date: from ? getStartDateUTC(from) : undefined,
        end_date: to ? getEndDateUTC(to) : undefined,
      };
      const response = await rideService.exportRidesToExcel(payload);
      if (response.success && response.data instanceof Blob) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rides_export.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error || "Failed to download file");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export rides.";
      toast.error(errorMessage);
    }
  };

  const refreshAllDetails = () => {
    setRideType("instant");
    setSearchString("");
    setStatusFilter("");
    setSelectedOrg("");
    setFromDate(undefined);
    setToDate(undefined);
    setRateTypeFilter("");
    setCurrentPage(1);
    fetchAllRides(1);
  };

  useEffect(() => {
    const allowed = localStorage.getItem("allowedOrganization");
    setAllowedOrg(allowed);
    if (allowed && allowed !== "*" && allowed !== "1") {
      setSelectedOrg(allowed);
    }
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchAllRides(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [rideType, statusFilter, searchString, fromDate, toDate, selectedOrg, rateTypeFilter]);

  return (
    <div className="w-full p-4">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-2 mb-2">
        {/* Organization Filter */}
        {(allowedOrg === "*" || allowedOrg === "1") && (
          orgLoading ? (
            <div>Loading organizations...</div>
          ) : orgError ? (
            <div className="text-red-500">{orgError}</div>
          ) : (
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="border px-2 py-1 rounded min-w-[160px]"
            >
              <option value="">All Organizations</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id.toString()}>
                  {org.name}
                </option>
              ))}
            </select>
          )
        )}

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded min-w-[120px]"
        >
          <option value="">All Status</option>
          <option value="requested">Requested</option>
          <option value="started">Started</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Rate Type Filter */}
        <select
          value={rateTypeFilter}
          onChange={(e) => setRateTypeFilter(e.target.value)}
          className="border px-2 py-1 rounded min-w-[120px]"
        >
          <option value="">All Rate Types</option>
          <option value="fixed">Fixed</option>
          <option value="per_hour">Per Hour</option>
          <option value="half_day">Half Day</option>
          <option value="per_min">Per Minute</option>
          <option value="full_day">Full Day</option>
          <option value="rta_test">RTA Test</option>
          <option value="garage_ride">Garage Ride</option>
        </select>

        {/* Date Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-42 justify-start font-normal", !fromDate && "text-muted-foreground")}
            >
              <CalendarIcon size={15} />
              {fromDate ? format(fromDate, "PPP") : "From Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => setFromDate(date || undefined)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-42 justify-start font-normal", !toDate && "text-muted-foreground")}
            >
              <CalendarIcon size={15} />
              {toDate ? format(toDate, "PPP") : "To Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => setToDate(date || undefined)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Search Field */}
        <input
          type="text"
          placeholder="Search..."
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
          className="border px-2 py-1 rounded min-w-[160px]"
        />
      </div>

      {/* Radio and Actions Row */}
      <div className="flex flex-wrap items-center justify-between mb-4">
        {/* Radio Buttons Left */}
        <div className="flex space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              value="instant"
              checked={rideType === "instant"}
              onChange={() => setRideType("instant")}
            />
            <span>Instant</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              value="scheduled"
              checked={rideType === "scheduled"}
              onChange={() => setRideType("scheduled")}
            />
            <span>Scheduled</span>
          </label>
        </div>
        {/* Actions Right */}
        <div className="flex gap-2">
          <Button
            onClick={refreshAllDetails}
            className="flex items-center bg-blue-500 rounded text-white py-2 px-4"
          >
            <FiRefreshCcw className="mr-2" /> Refresh
          </Button>
          <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                className="flex items-center bg-green-500 rounded text-white py-2 px-4"
                disabled={isExportPopoverOpen}
              >
                <FiDownload className="mr-2" /> Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <div className="flex flex-col space-y-4">
                <h3 className="font-semibold">Select Date Range for Export</h3>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Popover open={isFromDatePickerOpen} onOpenChange={setIsFromDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-40 justify-start">
                        {exportFromDate ? format(exportFromDate, "PPP") : "From Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={exportFromDate}
                        onSelect={(date) => {
                          setExportFromDate(date);
                          setIsFromDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover open={isToDatePickerOpen} onOpenChange={setIsToDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-40 justify-start">
                        {exportToDate ? format(exportToDate, "PPP") : "To Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={exportToDate}
                        onSelect={(date) => {
                          setExportToDate(date);
                          setIsToDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  onClick={() => {
                    setIsExportPopoverOpen(false);
                    downloadRidesExcel(exportFromDate, exportToDate);
                  }}
                  disabled={!exportFromDate || !exportToDate}
                  className="bg-green-500 text-white"
                >
                  Export
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {loading ? (
        <Table>
          <TableHeader>
            <TableRow>
            <TableCell className="font-semibold">Created Date</TableCell>
              <TableCell className="font-semibold">Ride ID</TableCell>
              <TableCell className="font-semibold">Status</TableCell>
              <TableCell className="font-semibold">Pickup Point</TableCell>
              <TableCell className="font-semibold">Drop Point</TableCell>
              <TableCell className="font-semibold">Customer</TableCell>
              <TableCell className="font-semibold">Chauffeur</TableCell>
              
              {rideType === "scheduled" && (
                <TableCell className="font-semibold">Scheduled Pickup</TableCell>
              )}
              <TableCell className="font-semibold">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-28" />
                </TableCell>
                {rideType === "scheduled" && (
                  <TableCell>
                    <Skeleton className="h-6 w-28" />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
              <TableCell className="font-semibold">Created Date</TableCell>
                <TableCell className="font-semibold">Ride ID</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold">Pickup Point</TableCell>
                <TableCell className="font-semibold">Drop Point</TableCell>
                <TableCell className="font-semibold">Customer</TableCell>
                <TableCell className="font-semibold">Chauffeur</TableCell>
                
                {rideType === "scheduled" && (
                  <TableCell className="font-semibold">Scheduled Pickup</TableCell>
                )}
                <TableCell className="font-semibold">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={rideType === "scheduled" ? 9 : 8} className="text-center py-4">
                    <Empty description="No data available" />
                  </TableCell>
                </TableRow>
              ) : (
                sortedRides.map((ride) => {
                  const rideDate = ride.scheduled_pickup
                    ? new Date(ride.scheduled_pickup)
                    : null;
                  const organisationName = ride.organisation_name;
                  // const highlight = rideDate && isToday(rideDate);
                  const highlight = rideDate && isToday(rideDate) && ride.status === "requested";
                  const scheduledPickup = ride.scheduled_pickup
                    ? format(new Date(ride.scheduled_pickup), "PPP p")
                    : "N/A";
                  const customerDisplay =
                    ride.organisation_id && ride.organisation_id.toString() !== "1" ? (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                        {organisationName}
                      </span>
                    ) : ride.customer_id && ride.customer_name ? (
                      `${ride.customer_id} - ${ride.customer_name}`
                    ) : (
                      "N/A"
                    );
                  const chauffeurDisplay =
                    ride.chauffeur_id && ride.chauffeur_id !== 0 && ride.chauffeur_name
                      ? `${ride.chauffeur_id} - ${ride.chauffeur_name}`
                      : "Unassigned";
                      const orderDate = ride.order_date
                      ? format(new Date(ride.order_date), "dd/MM/yyyy")
                      : "N/A";

                  return (
                    <TableRow key={ride.ride_id} className={highlight ? "bg-blue-100" : ""}>
                       <TableCell>{orderDate}</TableCell>
                      <TableCell>{ride.ride_id}</TableCell>
                      <TableCell>{ride.status}</TableCell>
                      <TableCell>
                        {ride.requested_pickup_point
                          ? formatLimitedAddress(ride.requested_pickup_point)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {ride.requested_drop_point
                          ? formatLimitedAddress(ride.requested_drop_point)
                          : "N/A"}
                      </TableCell>
                      <TableCell>{customerDisplay}</TableCell>
                      <TableCell>{chauffeurDisplay}</TableCell>
                      {rideType === "scheduled" && (
                        <TableCell>{scheduledPickup}</TableCell>
                      )}
                      <TableCell>
                        <Button className="rounded" onClick={() => handleViewRide(ride.ride_id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 2);
                      }
                    }}
                    className={currentPage === 1 ? "disabled" : ""}
                  />
                  {getPaginationItems().map((item, index) =>
                    item === "ellipsis" ? (
                      <PaginationEllipsis key={index} />
                    ) : (
                      <PaginationItem key={index}>
                        <PaginationLink
                          href="#"
                          isActive={item === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange((item as number) - 1);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage);
                      }
                    }}
                    className={currentPage === totalPages ? "disabled" : ""}
                  />
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open && needsRefresh) {
            fetchAllRides(currentPage);
            setNeedsRefresh(false);
          }
        }}
      >
        <AlertDialogContent className="w-[85vw] h-[85vh] max-w-none p-0 bg-transparent border-0 overflow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Ride Details</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {rideDetailsLoading ? (
              <p>Loading ride details...</p>
            ) : rideDetailsError ? (
              <p className="text-red-500">{rideDetailsError}</p>
            ) : selectedRide ? (
              <RideDetailsCard
                ride={selectedRide}
                onClose={() => setIsDialogOpen(false)}
                onActionPerformed={() => setNeedsRefresh(true)}
                onFetchAllRides={fetchAllRides}
                currentPage={currentPage}
              />
            ) : (
              <p>No ride details available.</p>
            )}
          </AlertDialogDescription>
          {!rideDetailsLoading && !rideDetailsError && !selectedRide && (
            <AlertDialogFooter className="p-4 justify-end">
              <AlertDialogAction asChild>
                <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}