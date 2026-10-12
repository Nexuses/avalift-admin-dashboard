"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { RideDetails } from "@/utils/RideService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import rideService from "@/utils/RideService";
import { LinkPreview } from "./ui/link-preview";
import DriverService, { AvailableChauffeur } from "@/utils/driverService";
import { Empty } from "antd";
import RideMap from "./RideMap";
import { Textarea } from "./ui/textarea";

// Define the Driver type (used for assignedChauffeur state)
interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  mobile_number?: string;
  profile_image?: string;
}

interface PaymentCard {
  slug_id: string;
  name?: string;
  logo?: string;
  card_bin?: number | string;
  card_end?: number | string;
  pay_method?: string;
}

// ChauffeurAssignmentCard Props
interface ChauffeurAssignmentCardProps {
  rideId: string;
  customerId: string | number;
  rideType: string;
  rideStatus: string;
  onChauffeurAssigned: (chauffeur: Driver) => number;
  onStatusChange?: (status: string) => void;
}

// ChauffeurAssignmentCard Component
const ChauffeurAssignmentCard: React.FC<ChauffeurAssignmentCardProps> = ({
  rideId,
  customerId,
  rideType,
  rideStatus,
  onChauffeurAssigned,
  onStatusChange,
}) => {
  const [chauffeurs, setChauffeurs] = useState<AvailableChauffeur[]>([]);
  const [selectedChauffeur, setSelectedChauffeur] = useState<string>("");
  const [isAssigned, setIsAssigned] = useState(false);

  useEffect(() => {
    async function fetchAvailableChauffeurs() {
      try {
        const response = await DriverService.getAvailableChauffeurs();
        if (response.success && Array.isArray(response.data)) {
          setChauffeurs(response.data);
        } else {
          toast.error(
            response.error || "Failed to fetch available chauffeurs."
          );
        }
      } catch (error) {
        console.error("Error fetching available chauffeurs:", error);
        toast.error("Error fetching available chauffeurs.");
      }
    }
    fetchAvailableChauffeurs();
  }, []);

  const normalizedRideStatus = rideStatus.toLowerCase();

  async function handleAssignOrReassignChauffeur() {
    if (!selectedChauffeur || selectedChauffeur === "none") {
      toast.error("Please select a chauffeur first.");
      return;
    }
    if (!rideId) {
      toast.error("Ride ID is not provided.");
      return;
    }
    if (!customerId && !["started", "on-the-way"].includes(normalizedRideStatus)) {
      toast.error("Customer ID is not provided.");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found.");

      let response;

      // For scheduled rides, use the reassign API when the ride is accepted or already on the way
      if (
        rideType.toLowerCase() === "scheduled" &&
        ["accepted", "on-the-way"].includes(normalizedRideStatus)
      ) {
        response = await DriverService.reassignScheduledChauffeur(
          rideId,
          rideStatus,
          rideType,
          Number(selectedChauffeur),
          customerId,
          token
        );
      } else {
        response = await DriverService.assignOrReassignChauffeur(
          rideId,
          rideStatus,
          rideType,
          Number(selectedChauffeur),
          customerId,
          token
        );
      }

      const data = await response.data;
      if (!response.success) {
        throw new Error(
          response.error || "Failed to assign/reassign chauffeur."
        );
      }

      const isReassignState = ["started", "on-the-way"].includes(normalizedRideStatus);
      toast.success(
        isReassignState
          ? "Chauffeur reassigned successfully!"
          : "Chauffeur assigned successfully!"
      );
      setIsAssigned(true);
      if (onStatusChange) {
        onStatusChange("accepted");
      }

      const assignedChauffeurData = chauffeurs.find(
        (chf) => chf.id === Number(selectedChauffeur)
      );
      if (assignedChauffeurData) {
        const [firstName, ...lastNameParts] =
          assignedChauffeurData.name.split(" ");
        const lastName = lastNameParts.join(" ");
        onChauffeurAssigned({
          id: assignedChauffeurData.id,
          first_name: firstName || "",
          last_name: lastName || "",
          mobile_number: data?.chauffeur_mobile || undefined,
          profile_image: data?.chauffeur_image || undefined,
        });
      }
    } catch (error: any) {
      console.error("Error assigning/reassigning chauffeur:", error);
      toast.error(error.message || "Failed to assign/reassign chauffeur.");
    }
  }

  const isReassignState = ["started", "on-the-way"].includes(normalizedRideStatus);
  const buttonText = isAssigned
    ? isReassignState
      ? "Reassigned"
      : "Assigned"
    : isReassignState
    ? "Reassign"
    : "Assign";

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isReassignState ? "Reassign Chauffeur" : "Assign Chauffeur"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Select
            onValueChange={(val) => setSelectedChauffeur(val)}
            value={selectedChauffeur}
            disabled={isAssigned}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a chauffeur" />
            </SelectTrigger>
            <SelectContent>
              {chauffeurs.length === 0 ? (
                <SelectItem value="none" disabled>
                  No chauffeurs available
                </SelectItem>
              ) : (
                chauffeurs.map((chf) => (
                  <SelectItem key={chf.id} value={chf.id.toString()}>
                    {chf.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={handleAssignOrReassignChauffeur}
            className="rounded"
            disabled={isAssigned}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// RideDetailsCard Props
interface RideDetailsCardProps {
  ride: RideDetails;
  onClose: () => void;
  onActionPerformed?: () => void;
  onFetchAllRides: (pageNumber: number) => void;
  currentPage: number;
}

const RideDetailsCard: React.FC<RideDetailsCardProps> = ({
  ride,
  onClose,
  onActionPerformed,
  onFetchAllRides,
  currentPage,
}) => {
  const rideSlugId = useMemo(
    () =>
      (
        ride.slug_id ||
        ride.paymentDetails?.card?.slug_id ||
        ride.paymentDetails?.card?.slug ||
        ""
      )?.toString() || "",
    [
      ride.paymentDetails?.card?.slug,
      ride.paymentDetails?.card?.slug_id,
      ride.slug_id,
    ]
  );

  const customerIdForPayment =
    ride.customer_details?.id?.toString() || ride.customer_id?.toString() || "";

  const [cancellationOrigin, setCancellationOrigin] = useState<
    "admin" | "user"
  >("admin");
  const [assignedChauffeur, setAssignedChauffeur] = useState<Driver | null>(
    null
  );
  const [rideStatus, setRideStatus] = useState(ride.status);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [customerCards, setCustomerCards] = useState<PaymentCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [selectedCardSlugId, setSelectedCardSlugId] = useState<string>(
    rideSlugId
  );
  const [isCardPaymentProcessing, setIsCardPaymentProcessing] = useState(false);

  const allowedOrganization = localStorage.getItem("allowedOrganization") || "";
  const showChauffeurAndCancel =
    allowedOrganization === "*" || allowedOrganization === "1";

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim(); // Remove extra spaces
  };

  const renderAuditValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (key === "timestamp" || key === "rta_due_date") {
      return format(new Date(value), "PPP hh:mm a"); // Format dates
    } else if (key.endsWith("ImageUrl")) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View Image
        </a>
      ); // Render image URLs as links
    } else if (typeof value === "boolean") {
      return value ? "Yes" : "No"; // Convert booleans to Yes/No
    } else {
      return value; // Display strings, numbers, etc. as is
    }
  };

  useEffect(() => {
    setSelectedCardSlugId(rideSlugId);
    setCustomerCards([]);
    setCardsError(null);
    setCardsLoading(false);
    setIsCardPaymentProcessing(false);
    setIsCardDialogOpen(false);
  }, [ride.ride_id, rideSlugId]);

  useEffect(() => {
    if (
      ride.chauffeur_id &&
      ride.chauffeur_name &&
      !assignedChauffeur // Only set if not already set
    ) {
      setAssignedChauffeur({
        id: ride.chauffeur_id,
        first_name: ride.chauffeur_name.name.split(" ")[0] || "",
        last_name: ride.chauffeur_name.name.split(" ")[1] || "",
        mobile_number: ride.chauffeur_name.mobile_number,
        profile_image: ride.vehicleDetails?.chauffeur_image,
      });
    }
  }, [
    ride.chauffeur_id,
    ride.chauffeur_name,
    ride.vehicleDetails?.chauffeur_image,
    assignedChauffeur,
  ]);

  const normalizeCards = (payload: any): PaymentCard[] => {
    const possibleList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.cards)
      ? payload.cards
      : [];

    return possibleList
      .map((card: any) => ({
        slug_id:
          card?.slug_id ||
          card?.slugId ||
          card?.slugID ||
          card?.slug ||
          "",
        name: card?.name,
        logo: card?.logo,
        card_bin: card?.card_bin ?? card?.bin,
        card_end: card?.card_end ?? card?.cardEnd ?? card?.last4,
        pay_method: card?.pay_method ?? card?.method,
      }))
      .filter((card: PaymentCard) => Boolean(card.slug_id))
      .map((card: PaymentCard) => ({
        ...card,
        slug_id: card.slug_id.toString(),
        card_end: card.card_end?.toString() ?? card.card_end,
        card_bin: card.card_bin?.toString() ?? card.card_bin,
      }));
  };

  const fetchCustomerCards = useCallback(async () => {
    if (!customerIdForPayment) {
      setCardsError("Customer ID is missing for card payment.");
      return;
    }

    setCardsLoading(true);
    setCardsError(null);

    try {
      const response = await rideService.getUserCardsById(customerIdForPayment);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch saved cards.");
      }

      const normalizedCards = normalizeCards(response.data);

      setCustomerCards(normalizedCards);

      if (!normalizedCards.length) {
        if (rideSlugId) {
          setSelectedCardSlugId(rideSlugId);
        }
        return;
      }

      const preferredSlug = selectedCardSlugId || rideSlugId;
      const fallbackSlug = normalizedCards.some(
        (card) => card.slug_id === preferredSlug
      )
        ? preferredSlug
        : normalizedCards[0]?.slug_id;

      if (fallbackSlug) {
        setSelectedCardSlugId(fallbackSlug);
      }
    } catch (error: any) {
      console.error("Error fetching cards:", error);
      setCustomerCards([]);
      setCardsError(error?.message || "Failed to fetch saved cards.");
    } finally {
      setCardsLoading(false);
    }
  }, [customerIdForPayment, rideSlugId, selectedCardSlugId]);

  const handleCardDialogOpenChange = (open: boolean) => {
    setIsCardDialogOpen(open);
    if (!open) {
      setCardsError(null);
    }
  };

  useEffect(() => {
    if (isCardDialogOpen) {
      fetchCustomerCards();
    }
  }, [fetchCustomerCards, isCardDialogOpen]);

  const normalizedRideStatus = rideStatus?.toLowerCase() || "";
  const showOnTheWayButton = normalizedRideStatus === "accepted";
  const showChauffeurReachedButton = normalizedRideStatus === "on-the-way";
  const showStartRideButton = normalizedRideStatus === "reached customer";
  const showCompleteRideButton = [
    "payment-pending",
    "started",
    "payment-initiated",
    "payment initiated",
  ].includes(normalizedRideStatus);
  const showPaymentCompletionActions =
    showChauffeurAndCancel &&
    [
      "payment-pending",
      "payment initiated",
      "payment-initiated",
    ].includes(normalizedRideStatus) &&
    ride.organisation_ride !== true;

  const handleStartRide = async () => {
    try {
      const response = await rideService.startCustomerRide(
        ride.ride_id,
        ride.customer_details.id.toString()
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to start ride");
      }
      toast.success("Ride started successfully!");
      setRideStatus("started");
      onActionPerformed?.();
    } catch (error: any) {
      console.error("Error starting ride:", error);
      toast.error(error.message || "Failed to start ride");
    }
  };

  const handleCompleteRide = async () => {
    try {
      const response = await rideService.completeCustomerRide(
        ride.ride_id,
        ride.customer_details.id.toString()
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to complete ride");
      }
      toast.success("Complete the payment");
      setRideStatus("payment initiated");
      onActionPerformed?.();
    } catch (error: any) {
      console.error("Error completing ride:", error);
      toast.error(error.message || "Failed to complete ride");
    }
  };

  const handleCompleteCashPayment = async () => {
    try {
      const response = await rideService.adminCompleteCashPayment(
        ride.ride_id,
        ride.customer_details.id.toString(),
        "cash",
        [], 
        ride.chauffeur_id || 0 // Ensure chauffeur_id is available
      );
      if (!response.success)
        throw new Error(response.error || "Failed to complete cash payment");
      toast.success("Ride completed with cash payment successfully!");
      setRideStatus("review-pending");
      onActionPerformed?.();
    } catch (error: any) {
      console.error("Error completing cash payment:", error);
      toast.error(error.message || "Failed to complete cash payment");
    }
  };

  const handleCompleteCardPayment = async () => {
    if (!customerIdForPayment) {
      toast.error("Customer ID is missing for card payment.");
      return;
    }

    const slugId = (selectedCardSlugId || rideSlugId)?.toString();

    if (!slugId) {
      toast.error("Select a card before attempting the payment.");
      return;
    }

    const couponIds = Array.isArray(ride.coupon_ids) ? ride.coupon_ids : [];

    try {
      setIsCardPaymentProcessing(true);
      const response = await rideService.adminCompleteCardPayment(
        ride.ride_id,
        customerIdForPayment,
        slugId,
        couponIds
      );
      if (!response.success)
        throw new Error(response.error || "Failed to complete card payment");
      toast.success("Ride completed with card payment successfully!");
      setRideStatus("review-pending");
      onActionPerformed?.();
      setIsCardDialogOpen(false);
    } catch (error: any) {
      console.error("Error completing card payment:", error);
      toast.error(error.message || "Failed to complete card payment");
    } finally {
      setIsCardPaymentProcessing(false);
    }
  };

  const handleChauffeurOnTheWay = async () => {
    if (!assignedChauffeur?.id) {
      toast.error("No chauffeur assigned yet");
      return;
    }
    try {
      const response = await rideService.chauffeurOnTheWay(
        ride.ride_id,
        ride.customer_details.id.toString()
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to update chauffeur status");
      }
      toast.success("Marked chauffeur as on the way!");
      setRideStatus("On-The-Way");
      onActionPerformed?.();
    } catch (error: any) {
      console.error("Error updating chauffeur on the way:", error);
      toast.error(error.message || "Failed to update chauffeur status");
    }
  };

  const handleChauffeurReached = async () => {
    if (!assignedChauffeur?.id) {
      toast.error("No chauffeur assigned yet");
      return;
    }
    try {
      const response = await rideService.chauffeurReachedCustomer(
        ride.ride_id,
        ride.customer_details.id.toString()
      );
      if (!response.success) {
        throw new Error(
          response.error || "Failed to update chauffeur reached status"
        );
      }
      toast.success("Chauffeur reached status updated successfully!");
      setRideStatus("Reached Customer");
      onActionPerformed?.();
    } catch (error: any) {
      console.error("Error updating chauffeur reached:", error);
      toast.error(error.message || "Failed to update chauffeur reached status");
    }
  };

  const handleCancelRide = async () => {
    try {
      const response = await rideService.adminCancelRide(
        ride.ride_id,
        ride.customer_details.id.toString(),
        cancellationOrigin,
        cancellationReason
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to cancel ride");
      }
      toast.success("Ride cancelled successfully!");
      setRideStatus("cancelled");
      onActionPerformed?.();
    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      toast.error(error.message || "Failed to cancel ride");
    }
  };

  const handleChauffeurAssigned = (chauffeur: Driver): number => {
    setAssignedChauffeur(chauffeur);
    onActionPerformed?.();
    return chauffeur.id;
  };

  const shouldShowAssignChauffeur = [
    // "reached customer",
    "accepted",
    "requested",
    "on-the-way",
  ].includes(normalizedRideStatus);

  // Handle close button click
  const handleClose = () => {
    onFetchAllRides(currentPage);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-0 p-4 z-50 animate-in fade-in-0 duration-300">
      <div className="bg-gradient-to-br from-white to-gray-100 shadow-2xl rounded-2xl w-full max-w-6xl h-[90vh] max-h-[90vh] flex overflow-hidden">
        {/* Left Section - Ride Details + Tabs */}
        <div className="w-2/3 p-6 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Ride Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="space-y-2 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={
                        assignedChauffeur?.profile_image ||
                        ride.vehicleDetails?.chauffeur_image
                      }
                    />
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Chauffeur:{" "}
                      {assignedChauffeur
                        ? `${assignedChauffeur.first_name} ${assignedChauffeur.last_name}`
                        : ride.chauffeur_name?.name || "N/A"}
                    </p>
                    <p className="text-gray-600">
                      ID: {assignedChauffeur?.id || ride.chauffeur_id || "N/A"}
                    </p>
                    <p className="text-gray-600">
                      Contact:{" "}
                      {assignedChauffeur?.mobile_number ||
                        ride.chauffeur_name?.mobile_number ||
                        "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={ride.customer_details.profile_image} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Customer: {ride.customer_details.name || "N/A"}
                    </p>
                    <p className="text-gray-600">
                      ID: {ride.customer_details.id || "N/A"}
                    </p>
                    <p className="text-gray-600">
                      Contact: {ride.customer_details.country_code || ""}{" "}
                      {ride.customer_details.mobile_number || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="ride-details" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="ride-details">Ride Details</TabsTrigger>
                <TabsTrigger value="timestamps">Timestamps</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                <TabsTrigger value="extras">Extras</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="ride-details">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bold text-black">
                      Ride Details
                    </CardTitle>
                    <CardTitle className="font-bold text-black">
                      {ride?.organisation_name !== "Ziezzu" && (
                        <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          {ride?.organisation_name}
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-black">
                            Field
                          </TableHead>
                          <TableHead className="font-bold text-black">
                            Details
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Ride ID</TableCell>
                          <TableCell>{ride?.ride_id || "N/A"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>{rideStatus || "N/A"}</TableCell>
                        </TableRow>
                        {ride.status_log &&
                          ride.status_log.some(
                            (log) => log.status === "Cancelled"
                          ) && (
                            <TableRow>
                              <TableCell>Cancellation Reason</TableCell>
                              <TableCell>
                                {ride.status_log.find(
                                  (log) => log.status === "Cancelled"
                                )?.cancellation_reason || "Not Provided"}
                              </TableCell>
                            </TableRow>
                          )}
                        {ride.status_log &&
                          ride.status_log.some(
                            (log) => log.status === "Cancelled"
                          ) && (
                            <TableRow>
                              <TableCell>Cancelled By</TableCell>
                              <TableCell>
                                {ride.status_log.find(
                                  (log) => log.status === "Cancelled"
                                )?.action_by || "Not Provided"}
                              </TableCell>
                            </TableRow>
                          )}
                        <TableRow>
                          <TableCell>Estimated Time</TableCell>
                          <TableCell>
                            {ride?.estimated_time_in_minutes
                              ? (() => {
                                  const totalMinutes =
                                    ride.estimated_time_in_minutes;
                                  const hours = Math.floor(totalMinutes / 60);
                                  const minutes = totalMinutes % 60;
                                  return hours > 0
                                    ? `${hours} ${
                                        hours === 1 ? "hour" : "hours"
                                      }${
                                        minutes > 0
                                          ? ` ${minutes} ${
                                              minutes === 1
                                                ? "minute"
                                                : "minutes"
                                            }`
                                          : ""
                                      }`
                                    : `${minutes} ${
                                        minutes === 1 ? "minute" : "minutes"
                                      }`;
                                })()
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Booking Date & Time</TableCell>
                          <TableCell>
                            {ride.order_date
                              ? format(new Date(ride.order_date), "PPP hh:mm a")
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Actual Time</TableCell>
                          <TableCell>{ride?.ride_duration || "N/A"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Selected coupon</TableCell>
                          <TableCell>
                            {ride?.selected_coupon?.coupon_code || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Payment Method</TableCell>
                          <TableCell>
                            {ride.paymentDetails?.payment_method || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Estimated Amount</TableCell>
                          <TableCell>
                            AED {ride?.estimated_amount || "N/A"}
                            {/* {ride?.final_price_calculation
                            ?.estimated_total_amount!= null
                            ? `AED ${ride.final_price_calculation.estimated_total_amount}`
                              : "N/A"} */}
                          </TableCell>
                        </TableRow>
                        {(() => {
                          const rawPreviousBalance =
                            ride?.final_price_calculation?.previous_balance ??
                            ride?.previous_balance;

                          if (
                            rawPreviousBalance === null ||
                            rawPreviousBalance === undefined
                          ) {
                            return null;
                          }

                          const numericPreviousBalance = Number(
                            rawPreviousBalance
                          );

                          if (
                            Number.isNaN(numericPreviousBalance) ||
                            numericPreviousBalance === 0
                          ) {
                            return null;
                          }

                          return (
                            <TableRow>
                              <TableCell>Previous Balance</TableCell>
                              <TableCell>
                                AED {rawPreviousBalance}
                              </TableCell>
                            </TableRow>
                          );
                        })()}

                        <TableRow>
                          <TableCell>Ride Type</TableCell>
                          <TableCell>{ride?.ride_type || "N/A"}</TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>Rate Type</TableCell>
                          <TableCell>
                            {ride?.rate_type === "per_min"
                              ? "Per Minute"
                              : ride?.rate_type === "per_hour"
                              ? "Per Hour"
                              : ride?.rate_type || "N/A"}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>Final Amount</TableCell>
                          <TableCell>
                            {/* AED {ride?.estimated_total_amount || "N/A"} */}
                            {ride?.final_price_calculation
                              ?.estimated_total_amount != null
                              ? `AED ${
                                  ride.final_price_calculation
                                    .estimated_total_amount +
                                  ride.final_price_calculation.vat +
                                  ride.final_price_calculation.mandatory_charges
                                    .total +
                                  ride.final_price_calculation.other_charges
                                    .total
                                }`
                              : "N/A"}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>Coupon Applied</TableCell>
                          <TableCell>
                            {ride?.final_price_calculation?.appliedCoupons &&
                            ride.final_price_calculation.appliedCoupons.length >
                              0
                              ? ride.final_price_calculation.appliedCoupons.map(
                                  (coupon, index) => (
                                    <div key={index}>
                                      {coupon.coupon_code} (Discount: AED{" "}
                                      {coupon.discount})
                                    </div>
                                  )
                                )
                              : "N/A"}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>Tip Amount</TableCell>
                          <TableCell>
                            {ride?.final_price_calculation?.tip_amount != null
                              ? `AED ${ride.final_price_calculation.tip_amount}`
                              : "N/A"}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>Amount to be Paid</TableCell>
                          <TableCell>
                            {ride?.final_price_calculation
                              ?.final_total_amount != null
                              ? `AED ${ride.final_price_calculation.final_total_amount}`
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timestamps">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bold text-black">
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-black">
                            Timestamp
                          </TableHead>
                          <TableHead className="font-bold text-black">
                            Details
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ride.status_log && ride.status_log.length > 0 ? (
                          ride.status_log.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell>{log.status || "N/A"}</TableCell>
                              <TableCell>
                                {log.datetime
                                  ? format(
                                      new Date(log.datetime),
                                      "PPP hh:mm a"
                                    )
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center">
                              No timestamps available
                            </TableCell>
                          </TableRow>
                        )}
                        {ride.ride_type === "scheduled" &&
                          ride.scheduled_pickup &&
                          typeof ride.scheduled_pickup !== "boolean" && (
                            <TableRow className="bg-green-100">
                              <TableCell>Scheduled Pickup</TableCell>
                              <TableCell>
                                {format(
                                  new Date(ride.scheduled_pickup),
                                  "PPP hh:mm a"
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        {ride.planned_end_time &&
                          typeof ride.planned_end_time !== "boolean" && (
                            <TableRow>
                              <TableCell>Planned End Time</TableCell>
                              <TableCell>
                                {format(
                                  new Date(ride.planned_end_time),
                                  "PPP hh:mm a"
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="locations">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bold text-black">
                      Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-black">
                            Field
                          </TableHead>
                          <TableHead className="font-bold text-black">
                            Details
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Pickup Point</TableCell>
                          <TableCell>
                            {ride.requested_pickup_point || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Pickup Coordinates</TableCell>
                          <TableCell>
                            Lat: {ride.requested_pickup?.lat ?? "N/A"}, Long:{" "}
                            {ride.requested_pickup?.long ?? "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Drop Point</TableCell>
                          <TableCell>
                            {ride.requested_drop_point || "N/A"}
                          </TableCell>
                        </TableRow>

                        {ride.destination_change_history ? (
                          <TableRow>
                            <TableCell>Destination Change time</TableCell>
                            <TableCell>
                              {ride.destination_change_history.map(
                                (change, index) => (
                                  <div key={index}>
                                    {new Date(
                                      change.changed_at
                                    ).toLocaleString()}
                                  </div>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell>Destination Change</TableCell>
                            <TableCell>N/A</TableCell>
                          </TableRow>
                        )}

                        {ride.destination_change_history &&
                          ride.destination_change_history.length > 0 && (
                            <TableRow>
                              <TableCell>Destination Change location</TableCell>
                              <TableCell>
                                {ride.destination_change_history.map(
                                  (change, index) => (
                                    <div key={index}>{change.point}</div>
                                  )
                                )}
                              </TableCell>
                            </TableRow>
                          )}

                        {ride.requested_drop ? (
                          <TableRow>
                            <TableCell>Drop Coordinates</TableCell>
                            <TableCell>
                              Lat: {ride.requested_drop.lat}, Long:{" "}
                              {ride.requested_drop.long}
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell>Drop Coordinates</TableCell>
                            <TableCell>N/A</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vehicle">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bold text-black">
                      Vehicle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-black">
                            Field
                          </TableHead>
                          <TableHead className="font-bold text-black">
                            Details
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Registration Number</TableCell>
                          <TableCell>
                            {ride.vehicle_details?.registration_no || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Color</TableCell>
                          <TableCell>
                            {ride.vehicleDetails?.color || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Make</TableCell>
                          <TableCell>
                            {ride.vehicleDetails?.make || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Brand</TableCell>
                          <TableCell>
                            {ride.vehicleDetails?.brand || "N/A"}
                          </TableCell>
                        </TableRow>
                        {/* <TableRow>
                          <TableCell>Rating</TableCell>
                          <TableCell>
                            {ride.reviews?.rating ? "★".repeat(ride.reviews.rating) + "☆".repeat(5 - ride.reviews.rating) : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Remarks</TableCell>
                          <TableCell>
                            {ride.reviews?.comment|| "N/A"}
                          </TableCell>
                        </TableRow> */}
                      </TableBody>
                    </Table>

                    {ride.before_ride_images &&
                      ride.before_ride_images.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-700 mb-2">
                            Before Ride Images
                          </h3>
                          <div className="flex space-x-4 overflow-x-auto pb-2">
                            {ride.before_ride_images.map((imagePath, index) => {
                              const transformedPath = `${imagePath.replace(
                                "src/uploads",
                                ""
                              )}`;
                              return (
                                <div
                                  key={index}
                                  className="flex-shrink-0 text-gray-600"
                                >
                                  <LinkPreview
                                    url={transformedPath}
                                    width={120}
                                    height={100}
                                    isStatic={true}
                                    imageSrc={transformedPath}
                                    className="font-bold text-blue-600 hover:underline"
                                  >
                                    Image {index + 1}
                                  </LinkPreview>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {ride.after_ride_images &&
                      ride.after_ride_images.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-700 mb-2">
                            After Ride Images
                          </h3>
                          <div className="flex space-x-4 overflow-x-auto pb-2">
                            {ride.after_ride_images.map((imagePath, index) => {
                              const transformedPath = `${imagePath.replace(
                                "src/uploads",
                                ""
                              )}`;
                              return (
                                <div
                                  key={index}
                                  className="flex-shrink-0 text-gray-600"
                                >
                                  <LinkPreview
                                    url={transformedPath}
                                    width={120}
                                    height={100}
                                    isStatic={true}
                                    imageSrc={transformedPath}
                                    className="font-bold text-blue-600 hover:underline"
                                  >
                                    Image {index + 1}
                                  </LinkPreview>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="extras">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bold text-black">
                      Extras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-black">
                            Field
                          </TableHead>
                          <TableHead className="font-bold text-black">
                            Details
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Instructions</TableCell>
                          <TableCell>
                            {ride.customer_extra_details?.instructions || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Key Details</TableCell>
                          <TableCell>
                            {ride.customer_extra_details?.key_details || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Parking Instructions</TableCell>
                          <TableCell>
                            {ride.customer_extra_details
                              ?.parking_instructions || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Customer Available</TableCell>
                          <TableCell>
                            {ride.is_customer_available ? "Yes" : "No"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Rating</TableCell>
                          <TableCell>
                            {ride.reviews?.rating
                              ? "★".repeat(ride.reviews.rating) +
                                "☆".repeat(5 - ride.reviews.rating)
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Remarks</TableCell>
                          <TableCell>
                            {ride.reviews?.comment || "N/A"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="audit">
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-bold text-black">
                      Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ride?.vehicle_audit?.report_url && (
                      <a
                        href={ride.vehicle_audit.report_url?.toString()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded"
                      >
                        View Report
                      </a>
                    )}
                    {ride.vehicle_audit ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-bold text-black">
                              Field
                            </TableHead>
                            <TableHead className="font-bold text-black">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(ride.vehicle_audit)
                            .filter(([key]) => key !== "ride_id")
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell>{formatKey(key)}</TableCell>
                                <TableCell>
                                  {renderAuditValue(key, value)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <Empty description="No audit data available" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Section - Map & (Conditional) Assign/Reassign & Cancel */}
        <div className="w-1/3 p-6 bg-gray-50 flex flex-col gap-6 overflow-y-auto max-h-[90vh]">
          {showChauffeurAndCancel && (
            <div className="flex-shrink-0">
              {shouldShowAssignChauffeur && (
                <ChauffeurAssignmentCard
                  rideId={ride.ride_id}
                  customerId={ride.customer_id}
                  rideType={ride.ride_type}
                  rideStatus={rideStatus}
                  onChauffeurAssigned={handleChauffeurAssigned}
                  onStatusChange={setRideStatus}
                />
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0">
            <div className="flex-1 min-h-0">
              {(() => {
                const pickup = {
                  lat: Number(ride.requested_pickup?.lat || 0),
                  lng: Number(ride.requested_pickup?.long || 0),
                };
                const drop = {
                  lat: Number(ride.requested_drop?.lat || 0),
                  lng: Number(ride.requested_drop?.long || 0),
                };
                console.log("Map coordinates:", { pickup, drop });
                return null;
              })()}
              <RideMap
                pickupLocation={{
                  lat: Number(ride.requested_pickup?.lat || 0),
                  lng: Number(ride.requested_pickup?.long || 0),
                }}
                dropLocation={{
                  lat: Number(ride.requested_drop?.lat || 0),
                  lng: Number(ride.requested_drop?.long || 0),
                }}
                driverLocations={{
                  acceptedToReachedCustomer: ride.driver_locations,
                  ReachedCustomerToStarted: [],
                  StartedToPaymentInitiated: [],
                }}
                className="min-h-[300px] max-h-[350px] w-full"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white shrink-0 h-auto flex-wrap">
              {showChauffeurAndCancel && showOnTheWayButton && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200">
                      On The Way
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark Chauffeur On The Way</AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirm that the chauffeur has started towards the customer. This
                        will update the ride status to on the way.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleChauffeurOnTheWay}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {showChauffeurAndCancel && showChauffeurReachedButton && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="rounded bg-yellow-600 hover:bg-yellow-700 text-white transition-colors duration-200">
                      Chauffeur Reached
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirm Chauffeur Reached
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to mark the chauffeur as having
                        reached the customer? This action will update the ride
                        status.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleChauffeurReached}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {showChauffeurAndCancel && showStartRideButton && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="rounded bg-green-600 hover:bg-green-700 text-white transition-colors duration-200">
                      Start Ride
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Start Ride</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to start this ride? This action
                        will update the ride status.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStartRide}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {showChauffeurAndCancel &&
                showCompleteRideButton &&
                normalizedRideStatus !== "payment initiated" &&
                ride.organisation_ride !== true && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200">
                        Initiate Payment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirm Complete Ride
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to complete this ride? This
                          action will finalize the ride and update its status.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteRide}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

              {showPaymentCompletionActions && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200">
                        Cash Payment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirm Cash Collection
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Please confirm the chauffeur collected{" "}
                          <span className="text-red-500">cash from the customer</span>.
                          This will finalize the payment and update the ride status.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded"
                          onClick={handleCompleteCashPayment}
                        >
                          Confirm Cash
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog
                    open={isCardDialogOpen}
                    onOpenChange={handleCardDialogOpenChange}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        className="rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-200"
                        disabled={isCardPaymentProcessing}
                      >
                        Card Payment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Select card for  payment
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Choose one of the customer&apos;s saved cards before completing
                          the payment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="space-y-3">
                        {cardsLoading ? (
                          <div className="text-sm text-gray-500">
                            Fetching saved cards...
                          </div>
                        ) : cardsError ? (
                          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {cardsError}
                          </div>
                        ) : customerCards.length ? (
                          <RadioGroup
                            value={selectedCardSlugId}
                            onValueChange={setSelectedCardSlugId}
                          >
                            {customerCards.map((card: PaymentCard) => {
                              const optionId = `card-${card.slug_id}`;
                              const subtitleParts = [
                                card.pay_method || "Card",
                                card.card_end ? `**** ${card.card_end}` : null,
                              ].filter(Boolean);

                              return (
                                <Label
                                  key={card.slug_id}
                                  htmlFor={optionId}
                                  className="flex cursor-pointer items-center gap-3 rounded border border-gray-200 p-3 hover:border-emerald-500"
                                >
                                  <RadioGroupItem
                                    value={card.slug_id}
                                    id={optionId}
                                  />
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={card.logo || ""}
                                      alt={card.name || "Card logo"}
                                    />
                                    <AvatarFallback className="bg-emerald-50 text-emerald-700">
                                      {(card.name || card.pay_method || "C")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-800">
                                      {card.name || "Saved Card"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {subtitleParts.join(" | ")}
                                    </span>
                                  </div>
                                </Label>
                              );
                            })}
                          </RadioGroup>
                        ) : (
                          <div className="rounded border border-dashed border-gray-200 p-3 text-sm text-gray-600">
                            No saved cards found for this user.
                          </div>
                        )}

                        {!cardsLoading &&
                          !customerCards.length &&
                          selectedCardSlugId &&
                          !cardsError && (
                            <div className="rounded border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                              Using the payment reference stored on this ride.
                            </div>
                          )}
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className="rounded"
                          disabled={isCardPaymentProcessing}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded"
                          onClick={handleCompleteCardPayment}
                          disabled={
                            !selectedCardSlugId ||
                            isCardPaymentProcessing ||
                            cardsLoading
                          }
                        >
                          {isCardPaymentProcessing
                            ? "Processing..."
                            : "Confirm Payment"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {showChauffeurAndCancel &&
                ![
                  "completed",
                  "cancelled",
                  "payment initiated",
                  "payment-initiated",
                  "payment-pending",
                  "review-pending",
                ].includes(normalizedRideStatus) && (
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
                          Are you sure you want to cancel this ride? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4">
                        <Select
                          onValueChange={(value: "admin" | "user") =>
                            setCancellationOrigin(value)
                          }
                          value={cancellationOrigin}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Cancelled By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Enter cancellation reason..."
                          value={cancellationReason}
                          onChange={(e) =>
                            setCancellationReason(e.target.value)
                          }
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelRide}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

              <Button
                className="rounded bg-blue-600 hover:bg-gray-700 text-white transition-colors duration-200"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetailsCard;
