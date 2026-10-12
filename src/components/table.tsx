"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
  RideDetails,
  GetAllRidesPayload,
} from "@/utils/RideService";
import { Empty, Spin } from "antd";
import { toast } from "sonner";

export function RideHistoryTable() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, ] = useState<RideDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rideDetailsLoading,] = useState<boolean>(false);
  const [rideDetailsError, ] = useState<string | null>(null);
   const [rideType,] = useState<"instant" | "scheduled">("instant");

  
      const [, setTotalPages] = useState<number>(1);
      const [currentPage, setCurrentPage] = useState<number>(1);
      const [rateTypeFilter,] = useState<string>("");
    
      const [searchString, ] = useState<string>("");
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
   

  // Fetch ride history without any filters, limit to 30 rides.
  const fetchRideHistory = async () => {
    setLoading(true);
    setError(null);

    const payload: GetAllRidesPayload = {
      status: "",
      search_string: "",
      start_date: undefined,
      end_date: undefined,
      ride_type: "",
      selected_org: "",
    };

    try {
      // Limit the results to the first 30 rides.
      const response = await rideService.getAllRides(1, 30, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch ride history.");
      }
      const json: RidesResponse = response.data;
      setRides(json.data.rides || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching ride history.");
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

 

  // Fetch ride history on mount
  useEffect(() => {
    fetchRideHistory();
  }, []);

  return (
    <div className="w-full p-4">
       <h2 className="text-2xl font-bold text-start mb-6">Ride History</h2>
     
      {loading ? (
        <div className="text-center py-6">
          <Spin />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-6">{error}</div>
      ) : rides.length === 0 ? (
        <div className="text-center py-6">
          <Empty description="No ride history available" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableCell className="px-4 py-3 font-semibold">Ride ID</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Status</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Ride Type</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Pickup Point</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Drop Point</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Customer</TableCell>
              <TableCell className="px-4 py-3 font-semibold">Chauffeur</TableCell>
            
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.ride_id} className="hover:bg-gray-50">
                <TableCell className="px-4 py-3">{ride.ride_id}</TableCell>
                <TableCell className="px-4 py-3">{ride.status}</TableCell>
                <TableCell className="px-4 py-3">{ride.ride_type || "N/A"}</TableCell>
                <TableCell className="px-4 py-3">
                  {ride.requested_pickup_point || "N/A"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {ride.requested_drop_point || "N/A"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {ride.customer_details
                    ? `${ride.customer_details.id} - ${ride.customer_details.name}`
                    : "N/A"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {ride.chauffeur_id && ride.chauffeur_id !== 0 && ride.chauffeur_name
                    ? `${ride.chauffeur_id} - ${ride.chauffeur_name}`
                    : "Unassigned"}
                </TableCell>
               
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Alert Dialog for Ride Details */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="w-[85vw] h-[85vh] max-w-none p-0 bg-transparent border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Ride Details</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {rideDetailsLoading ? (
              <p>Loading ride details...</p>
            ) : rideDetailsError ? (
              <p className="text-red-500">{rideDetailsError}</p>
            ) : selectedRide ? (
              <RideDetailsCard ride={selectedRide} onClose={() => setIsDialogOpen(false)}  onFetchAllRides={fetchAllRides}
              currentPage={currentPage}/>
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

export default RideHistoryTable;
