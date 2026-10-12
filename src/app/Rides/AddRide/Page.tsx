"use client";

import React, { useState, useEffect } from "react";
import { CreateRideForm, CreateRideFormValues } from "@/components/AddridesTable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoadScript, GoogleMap, Marker, DirectionsRenderer, Libraries } from "@react-google-maps/api";

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 25.276987,
  lng: 55.296249,
};

const libraries: Libraries = ["places"];

const AddRidesPage: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', 
    libraries,
  });

  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [drop, setDrop] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const handleLocationChange = (
    field: keyof Pick<CreateRideFormValues, "requested_pickup" | "requested_drop">,
    coords: { lat: number; long: number }
  ) => {
    const converted = { lat: coords.lat, lng: coords.long };
    if (field === "requested_pickup") {
      setPickup(converted);
      console.log("Pickup set:", converted);
    } else if (field === "requested_drop") {
      setDrop(converted);
      console.log("Drop set:", converted);
    }
  };

  useEffect(() => {
    if (pickup && drop && isLoaded) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup,
          destination: drop,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            console.log("Directions set:", result);
          } else {
            console.error("Error fetching directions:", status);
          }
        }
      );
    }
  }, [pickup, drop, isLoaded]);

  if (loadError) {
    console.error("Map Load Error:", loadError);
    return <div className="text-red-500">Error loading map: {loadError.message}</div>;
  }
  if (!isLoaded) return <div className="text-gray-500">Loading Map...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Rides</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Ride</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold">Create Ride</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Ride Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateRideForm onLocationChange={handleLocationChange} isLoaded={isLoaded} />
          </CardContent>
        </Card>

        <Card className="shadow-lg h-[60vh] lg:h-[750px] rounded">
          <CardContent className="p-0 h-full">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={8}
              options={{ mapTypeControl: false }}
            >
              {pickup && <Marker position={pickup} label="P" />}
              {drop && <Marker position={drop} label="D" />}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddRidesPage;
