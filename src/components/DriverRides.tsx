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
import { format } from "date-fns";
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
import ChauffeurRideDetailsCard from "./ChauffeurRideDetailsCard ";
import rideService, {
  Ride,
  RidesResponse,
  GetAllChauffeurRidesPayload,
  chauffeurRideDetails,
} from "@/utils/RideService";
import { FiRefreshCcw } from "react-icons/fi";

export function AllChaffeurRidesTable() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchString, setSearchString] = useState<string>("");

  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
const [toDate, setToDate] = useState<Date | undefined>(undefined);
 

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<chauffeurRideDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rideDetailsLoading, setRideDetailsLoading] = useState<boolean>(false);
  const [rideDetailsError, setRideDetailsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(""); // Dropdown for statuses

  // Always use CHAUFFEUR rides
  const fetchAllChauffeurRides = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
  
    let startLocal: Date | undefined;
    let endLocal: Date | undefined;
  
    if (fromDate) {
      startLocal = new Date(fromDate);
      startLocal.setHours(0, 1, 0, 0); // 12:01 AM local
    }
    if (toDate) {
      endLocal = new Date(toDate);
      endLocal.setHours(23, 59, 0, 0); // 11:59 PM local
    }
  
    const payload: GetAllChauffeurRidesPayload = {
      status: statusFilter,
      search_string: searchString,
      start_date: startLocal ? startLocal.toISOString() : "",
      end_date: endLocal ? endLocal.toISOString() : "",
    };
    try {
      const response = await rideService.getAllChauffeurRides(pageNumber, 10, payload);
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
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageIndex: number) => {
    const newPage = pageIndex + 1;
    fetchAllChauffeurRides(newPage);
  };

  const handleChauffeurViewRide = async (rideId: string) => {
    setRideDetailsLoading(true);
    setRideDetailsError(null);
    try {
      const payload = { ride_id: rideId };
      const res = await rideService.getChaffeurRideById(payload);
      if (res.success && res.data) {
        setSelectedRide(res.data);
      } else {
        setRideDetailsError(res.error || "Failed to load ride details.");
        setSelectedRide(null);
      }
    } catch (err: any) {
      setRideDetailsError(err.message || "Failed to load ride details.");
      setSelectedRide(null);
    } finally {
      setRideDetailsLoading(false);
      setIsDialogOpen(true);
    }
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

  useEffect(() => {
    fetchAllChauffeurRides(1);
  }, []);

  // Refresh handler: reset filters and load the default state.
  const handleRefresh = () => {
    setSearchString("");
    setFromDate(undefined);
    setToDate(undefined);
    setStatusFilter("");
    setCurrentPage(1);
    fetchAllChauffeurRides(1);
  };
  return (
    <div className="w-full p-4">
      {/* Filter Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        {/* Status Filter Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Status</option>
          <option value="Requested">Requested</option>
          <option value="Accepted">Accepted</option>
          <option value="Started">Started</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Droprequest">Drop Request</option>
        </select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-48 justify-start text-left font-normal",
                !fromDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, "PPP") : "From Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                if (date) setFromDate(date);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-48 justify-start text-left font-normal",
                !toDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, "PPP") : "To Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                if (date) setToDate(date);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {/* Search Button */}
        <Button
          variant="outline"
          className="bg-blue-500 text-white py-2 px-4 rounded"
          onClick={() => fetchAllChauffeurRides(1)}
        >
          Search
        </Button>
        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          <FiRefreshCcw className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Loading State with Skeleton */}
      {loading ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-semibold">Created Date</TableCell>
              <TableCell className="font-semibold">Ride ID</TableCell>
              <TableCell className="font-semibold">Status</TableCell>
              <TableCell className="font-semibold">Pickup Point</TableCell>
              <TableCell className="font-semibold">Drop Point</TableCell>
              <TableCell className="font-semibold">PD ID</TableCell>
              <TableCell className="font-semibold">Chauffeur ID</TableCell>
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
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
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
          {/* Rides Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold">Created Date</TableCell>
                <TableCell className="font-semibold">Ride ID</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold">Pickup Point</TableCell>
                <TableCell className="font-semibold">Drop Point</TableCell>
                <TableCell className="font-semibold">PD ID</TableCell>
                <TableCell className="font-semibold">Chauffeur ID</TableCell>
                <TableCell className="font-semibold">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride) => (
                  <TableRow key={ride.ride_id}>
                    <TableCell>
                      {ride.order_date
                        ? format(new Date(ride.order_date), "PPP")
                        : "N/A"}
                        </TableCell>

                    <TableCell>{ride.ride_id}</TableCell>
                    <TableCell>{ride.status}</TableCell>
                    <TableCell>
                      {ride.requested_pickup_point ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      {ride.requested_drop_point ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      {ride.pd_id && ride.pd_name 
                        ? `${ride.pd_id} - ${ride.pd_name}` 
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {ride.chauffeur_id && ride.chauffeur_name 
                        ? `${ride.chauffeur_id} - ${ride.chauffeur_name}` 
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        className="rounded"
                        onClick={() => handleChauffeurViewRide(ride.ride_id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
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
                  </PaginationItem>
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
                  <PaginationItem>
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
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Alert Dialog for Ride Details */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <ChauffeurRideDetailsCard
                ride={selectedRide}
                onClose={() => setIsDialogOpen(false)}
                onPdAssigned={() => {}}
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