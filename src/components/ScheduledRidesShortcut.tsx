"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { isToday, format } from "date-fns";
import rideService, {
  Ride,
  RidesResponse,
  GetAllRidesPayload,
  RideDetails,
} from "@/utils/RideService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ScheduledRidesDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rideDetailsLoading, setRideDetailsLoading] = useState<boolean>(false);
  const [rideDetailsError, setRideDetailsError] = useState<string | null>(null);

    const [, setTotalPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rateTypeFilter, ] = useState<string>("");
  
    const [searchString,] = useState<string>("");
    const [statusFilter, ] = useState<string>("");
    const [selectedOrg, ] = useState<string>("");
    const [fromDate,] = useState<Date | undefined>(undefined);
    const [toDate, ] = useState<Date | undefined>(undefined);
    
  const searchQuery = searchString.trim();

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
  
 
   
  

  // Fixed rideType value.
  const rideType: "instant" | "scheduled" = "scheduled";

  const navigate = useNavigate();

  const fetchScheduledRides = async () => {
    setLoading(true);
    setError(null);

    const payload: GetAllRidesPayload = {
      status: "",
      search_string: "",
      start_date: undefined,
      end_date: undefined,
      ride_type: rideType,
      selected_org: "",
    };

    try {
      // Increase the limit to 10 instead of 4.
      const response = await rideService.getAllRides(1, 10, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch rides.");
      }
      const json: RidesResponse = response.data;
      setRides(json.data.rides || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching rides.");
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format an address.
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

  // Helper to limit the formatted address to 20 characters.
  function formatLimitedAddress(address: string): string {
    const formatted = formatAddress(address);
    return formatted.length > 20 ? formatted.slice(0, 20) + "..." : formatted;
  }

  // Filter out rides with status "completed" or "cancelled" and sort remaining rides.
  const filteredRides = rides.filter((ride) => {
    const status = ride.status.toLowerCase();
    return status !== "completed" && status !== "cancelled";
  });

  const sortedRides = [...filteredRides].sort((a, b) => {
    const aDate = a.scheduled_pickup ? new Date(a.scheduled_pickup) : null;
    const bDate = b.scheduled_pickup ? new Date(b.scheduled_pickup) : null;
    const aIsToday = aDate ? isToday(aDate) : false;
    const bIsToday = bDate ? isToday(bDate) : false;
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return 0;
  });

  // Display only the top 4 rows.
  const displayedRides = sortedRides.slice(0, 4);

  // Dialog for Ride Details
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
      }
    } catch (err: any) {
      setRideDetailsError(err.message || "Failed to load ride details.");
      setSelectedRide(null);
    } finally {
      setRideDetailsLoading(false);
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    fetchScheduledRides();
  }, []);

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

  return (
    <div className="w-full p-4">
      <h2 className="text-2xl font-bold text-start">Scheduled Rides</h2>
      <div className="mt-4">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold">Ride ID</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold">Pickup Point</TableCell>
                <TableCell className="font-semibold">Drop Point</TableCell>
                <TableCell className="font-semibold">Customer (ID - Name)</TableCell>
                <TableCell className="font-semibold">Chauffeur (ID - Name)</TableCell>
                <TableCell className="font-semibold">Scheduled Pickup</TableCell>
                <TableCell className="font-semibold">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, index) => (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold">Ride ID</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold">Pickup Point</TableCell>
                <TableCell className="font-semibold">Drop Point</TableCell>
                <TableCell className="font-semibold">Customer</TableCell>
                <TableCell className="font-semibold">Chauffeur</TableCell>
                <TableCell className="font-semibold">Scheduled Pickup</TableCell>
                <TableCell className="font-semibold">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                displayedRides.map((ride) => {
                  const rideDate = ride.scheduled_pickup
                    ? new Date(ride.scheduled_pickup)
                    : null;
                  const highlight = rideDate && isToday(rideDate);

                  // Format scheduled pickup date
                  const scheduledPickup = ride.scheduled_pickup
                    ? format(new Date(ride.scheduled_pickup), "PPP p")
                    : "N/A";

                  // Format Pickup and Drop points limited to 20 characters.
                  const pickupPoint = ride.requested_pickup_point
                    ? formatLimitedAddress(ride.requested_pickup_point)
                    : "N/A";
                  const dropPoint = ride.requested_drop_point
                    ? formatLimitedAddress(ride.requested_drop_point)
                    : "N/A";

                  // Format Customer as "ID - Name"
                  const customerDisplay = ride.customer_details
                    ? `${ride.customer_details.id} - ${ride.customer_details.name}`
                    : "N/A";

                  // Format Chauffeur as "ID - Name"
                  const chauffeurDisplay =
                    ride.chauffeur_id && ride.chauffeur_name
                      ? `${ride.chauffeur_id} - ${ride.chauffeur_name}`
                      : "Unassigned";

                  return (
                    <TableRow
                      key={ride.ride_id}
                      className={highlight ? "bg-blue-100" : ""}
                    >
                      <TableCell>{ride.ride_id}</TableCell>
                      <TableCell>{ride.status}</TableCell>
                      <TableCell>{pickupPoint}</TableCell>
                      <TableCell>{dropPoint}</TableCell>
                      <TableCell>{customerDisplay}</TableCell>
                      <TableCell>{chauffeurDisplay}</TableCell>
                      <TableCell>{scheduledPickup}</TableCell>
                      <TableCell>
                        <Button
                          className="rounded"
                          onClick={() => handleViewRide(ride.ride_id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* "Show More" Button navigates to /admin/dashboard/AllRides */}
      <div className="mt-4 justify-end flex">
        <Button className="bg-blue-500" onClick={() => navigate("/admin/dashboard/AllRides")}>
          Show More
        </Button>
      </div>

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
              <RideDetailsCard
                ride={selectedRide}
                onClose={() => setIsDialogOpen(false)}
                onFetchAllRides={fetchAllRides}
                currentPage={currentPage} // Pass currentPage to RideDetailsCard
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
