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

import PDService from "@/utils/pdService";
import { ApiResponse } from "@/utils/apiFetcher";

// Define the PD type (similar to Chauffeur).
export interface PD {
  id: number;
  first_name: string;
  last_name: string;
}

// Define the props expected by the card.
interface PdAssignmentCardProps {
  rideId: string;
  chauffeurId: number;
  onPdAssigned: (pd: PD) => void; // Added callback prop
}

export default function PdAssignmentCard({
  rideId,
  chauffeurId,
  onPdAssigned,
}: PdAssignmentCardProps) {
  const [pds, setPds] = useState<PD[]>([]);
  const [selectedPd, setSelectedPd] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch PDs when the component mounts.
  useEffect(() => {
    const fetchPds = async () => {
      setLoading(true);
      try {
        const response: ApiResponse<PD[]> = await PDService.fetchIndividualPD();
        if (response.success && response.data) {
          setPds(response.data);
        } else {
          setError(response.error || "Failed to fetch PD.");
        }
      } catch (error) {
        setError("Error fetching PDs.");
      } finally {
        setLoading(false);
      }
    };

    fetchPds();
  }, []);

  // Function to call the API for assigning the selected PD.
  async function handleAssignPd() {
    if (selectedPd === undefined) {
      toast.error("Please select a PD first.");
      return;
    }
    if (!rideId) {
      toast.error("Ride ID is not provided.");
      return;
    }
    if (chauffeurId === undefined || chauffeurId === null) {
      toast.error("Chauffeur ID is not provided.");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found.");

      // Call the assign PD service
      const response: ApiResponse<any> = await PDService.assignPD(
        rideId,
        chauffeurId,
        selectedPd,
        token
      );

      if (response.success) {
        toast.success("PD assigned successfully!");
        // Find the assigned PD object from the list and call the parent callback
        const assignedPdObj = pds.find((pd) => pd.id === selectedPd);
        if (assignedPdObj) {
          onPdAssigned(assignedPdObj);
        }
      } else {
        toast.error(response.error || "Failed to assign PD.");
      }
    } catch (error: any) {
      console.error("Error assigning PD:", error);
      toast.error(error.message || "Failed to assign PD.");
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Assign PD</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* PD Dropdown */}
          <Select
            onValueChange={(val) => setSelectedPd(Number(val))}
            value={selectedPd ? selectedPd.toString() : ""}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a PD" />
            </SelectTrigger>
            <SelectContent>
              {pds.length === 0 ? (
                <SelectItem value="none" disabled>
                  No PDs available
                </SelectItem>
              ) : (
                pds.map((pd) => (
                  <SelectItem key={pd.id} value={pd.id.toString()}>
                    {`${pd.first_name} ${pd.last_name}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Assign Button */}
          <Button onClick={handleAssignPd} disabled={loading}>
            {loading ? "Assigning..." : "Assign PD"}
          </Button>
        </div>

        {/* Error Display */}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}
