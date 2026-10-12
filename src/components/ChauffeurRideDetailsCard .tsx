"use client";

import React, { useState, useCallback } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import rideService, { chauffeurRideDetails } from "@/utils/RideService";
import { toast } from "sonner";
import PdAssignmentCard from "./PdAssignmentCard";
// import { GOOGLE_MAPS_API_KEY } from "@/config/apiConfig";

// PD type
interface PD {
  id: number;
  first_name: string;
  last_name: string;
  mobile_number?: string;
  profile_image?: string;
}

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%", // Will fill its container
  minHeight: "0", // Ensure it respects container height
};

const libraries = ["places"] as "places"[];

interface ChauffeurRideDetailsCardProps {
  ride: chauffeurRideDetails;
  onClose: () => void;
  onPdAssigned: (pd: PD) => void;
}

const ChauffeurRideDetailsCard: React.FC<ChauffeurRideDetailsCardProps> = ({
  ride,
  onClose,
  onPdAssigned,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', 
    libraries,
  });

  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  // Local state to store assigned PD details
  const [assignedPd, setAssignedPd] = useState<PD | null>(null);
  // Local state to track whether the ride is cancelled
  const [isRideCancelled, setIsRideCancelled] = useState(false);

  const onMapLoad = useCallback(
    (_mapInstance: google.maps.Map) => {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: {
            lat: ride?.requested_pickup?.lat || 0,
            lng: ride?.requested_pickup?.long || 0,
          },
          destination: {
            lat: ride?.requested_drop?.lat || 0,
            lng: ride?.requested_drop?.long || 0,
          },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirectionsResponse(result);
          } else {
            console.error("Error fetching directions", result);
          }
        }
      );
    },
    [ride?.requested_pickup, ride?.requested_drop]
  );

  const handleCancelRide = async () => {
    try {
      const response = await rideService.adminCancelChauffeurPdRide(
        ride.ride_id,
        ride.chauffeur_id.toString()
      );
      if (!response.success) {
        throw new Error("Failed to cancel ride");
      }
      toast.success("Ride cancelled successfully!");
      setIsRideCancelled(true);
    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      toast.error(error.message || "Failed to cancel ride");
    }
  };

  // When a PD is assigned, update local state and propagate to parent if needed
  const handlePdAssigned = (pd: PD) => {
    setAssignedPd(pd);
    onPdAssigned(pd);
  };

  const pickup = ride?.requested_pickup ?? { lat: 0, long: 0 };
  const drop = ride?.requested_drop ?? { lat: 0, long: 0 };

  if (!isLoaded) return <div className="text-center p-4">Loading Map...</div>;
  if (loadError)
    return <div className="text-center p-4 text-red-500">Error loading map</div>;

  // Conditionally render PD Assignment Card based on ride status
  const shouldShowAssignPd =
    ride?.status?.toLowerCase() === "accepted" ||
    ride?.status?.toLowerCase() === "requested";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-0 p-4 z-50 animate-in fade-in-0 duration-300">
      <div className="bg-gradient-to-br from-white to-gray-100 shadow-2xl rounded-2xl w-full max-w-6xl h-[90vh] max-h-[90vh] flex overflow-hidden">
        {/* Left Section - Ride Details */}
        <div className="w-2/3 p-6 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Ride Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-700">
                    Chauffeur: {ride.chauffeur_name || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    ID: {ride.chauffeur_id || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Contact: {ride.chauffeur_number || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  {/* Use updated PD details if available, else fall back to ride.pd details */}
                  <p className="font-semibold text-gray-700">
                    PD:{" "}
                    {assignedPd
                      ? `${assignedPd.first_name} ${assignedPd.last_name}`
                      : ride.pd_name || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    ID: {assignedPd ? assignedPd.id : ride.pd_id || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Contact:{" "}
                    {assignedPd?.mobile_number || ride.pd_number || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Ride Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-700">Field</TableHead>
                      <TableHead className="text-gray-700">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Ride ID</TableCell>
                      <TableCell>{ride?.ride_id || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>{ride?.status || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      {/* <TableCell>Estimated Time</TableCell>
                      <TableCell>
                        {ride?.estimated_time_in_minutes
                          ? `${ride.estimated_time_in_minutes} minutes`
                          : "N/A"}
                      </TableCell> */}
                    </TableRow>
                    <TableRow>
                      <TableCell>Pickup Point</TableCell>
                      <TableCell>
                        {ride?.requested_pickup_point || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Drop Point</TableCell>
                      <TableCell>
                        {ride?.requested_drop_point || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pickup Coordinates</TableCell>
                      <TableCell>
                        {pickup.lat} / {pickup.long}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Drop Coordinates</TableCell>
                      <TableCell>
                        {drop.lat} / {drop.long}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Section - Map and PD Assignment */}
        <div className="w-1/3 p-6 bg-gray-50 flex flex-col gap-6">
          {shouldShowAssignPd && (
            <PdAssignmentCard
              rideId={ride.ride_id}
              chauffeurId={Number(ride.chauffeur_id)}
              onPdAssigned={handlePdAssigned}
            />
          )}

          <div className="flex-1 flex flex-col rounded-2xl">
            {/* Map Container with strict height control */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: pickup.lat, lng: pickup.long }}
                zoom={12}
                onLoad={onMapLoad}
                options={{
                  mapTypeControl: false,
                  fullscreenControl: false,
                  streetViewControl: false,
                }}
              >
                <Marker position={{ lat: pickup.lat, lng: pickup.long }} />
                <Marker position={{ lat: drop.lat, lng: drop.long }} />
                {directionsResponse && (
                  <DirectionsRenderer directions={directionsResponse} />
                )}
              </GoogleMap>
            </div>
            {/* Buttons Footer with fixed height */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white shrink-0 h-20">
              <Button
                className="rounded bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200"
                onClick={onClose}
              >
                Close
              </Button>
              {ride?.status?.toLowerCase() !== "completed" &&
                ride?.status?.toLowerCase() !== "cancelled" &&
                !isRideCancelled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="rounded transition-colors duration-200"
                      >
                        Cancel Ride
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Ride</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this ride? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelRide}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChauffeurRideDetailsCard;
