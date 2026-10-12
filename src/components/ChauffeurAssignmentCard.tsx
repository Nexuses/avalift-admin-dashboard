"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { ApiResponse } from "@/utils/apiFetcher";
import DriverService, { ChauffeurAssignmentPayload } from "@/utils/driverService";

// Define the Driver type.
interface Driver {
  id: number;
  first_name: string;
  last_name: string;
}

// Define the props expected by the card.
interface ChauffeurAssignmentCardProps {
  rideId: string;                     
  customerId: string | number;        
  rideType: string;                   
}

export default function ChauffeurAssignmentCard({
  rideId,
  customerId,
  rideType,
}: ChauffeurAssignmentCardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedChauffeur, setSelectedChauffeur] = useState<string>("");

    const [, setLoading] = useState<boolean>(true);
    const [, setError] = useState<string | null>(null);

  // Fetch drivers when the component mounts.
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      const response: ApiResponse<Driver[]> = await DriverService.fetchIndividualDrivers();
      if (response.status && response.status >= 200 && response.status < 300 && response.data) {
        setDrivers(response.data);
      } else {
        setError(response.error || "Failed to fetch drivers.");
      }
      
      setLoading(false);
    };
    fetchDrivers();
  }, []);

  // Function to call the API for assigning the selected chauffeur.
  async function handleAssignChauffeur() {
    if (!selectedChauffeur || selectedChauffeur === "none") {
      toast.error("Please select a chauffeur first.");
      return;
    }
    if (!rideId) {
      toast.error("Ride ID is not provided.");
      return;
    }
    if (!customerId) {
      toast.error("Customer ID is not provided.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found.");

      const payload: ChauffeurAssignmentPayload = {
        ride_id: rideId,
        chauffeur_id: Number(selectedChauffeur),
        customer_id: customerId.toString(),
      };

      const response = await DriverService.assignChauffeurToRide(payload, rideType, token);
      if (!response.success) {
        throw new Error(response.error || "Failed to assign chauffeur.");
      }
      toast.success("Chauffeur assigned successfully!");
      // Optionally update your UI here.
    } catch (error: any) {
      console.error("Error assigning chauffeur:", error);
      toast.error(error.message || "Failed to assign chauffeur.");
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Assign Chauffeur</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Chauffeur Dropdown */}
          <Select
            onValueChange={(val) => setSelectedChauffeur(val)}
            value={selectedChauffeur}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a chauffeur" />
            </SelectTrigger>
            <SelectContent>
              {drivers.length === 0 ? (
                <SelectItem value="none" disabled>
                  No drivers available
                </SelectItem>
              ) : (
                drivers.map((drv) => {
                  const fullName = `${drv.first_name} ${drv.last_name}`;
                  return (
                    <SelectItem key={drv.id} value={drv.id.toString()}>
                      {fullName}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>

          {/* Button to call API */}
          <Button onClick={handleAssignChauffeur} className="rounded">
            Assign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}