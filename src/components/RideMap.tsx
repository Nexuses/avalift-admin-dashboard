"use client";

import React from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Polyline,
} from "@react-google-maps/api";

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "0",
};

const libraries = ["places"] as "places"[];

interface DriverLocation {
  latitude: number;
  longitude: number;
  date_time: string;
  user_id: string;
}

interface RideMapProps {
  pickupLocation: {
    lat: number;
    lng: number;
  };
  dropLocation: {
    lat: number;
    lng: number;
  };
  driverLocations?: {
    acceptedToReachedCustomer?: DriverLocation[];
    ReachedCustomerToStarted?: DriverLocation[];
    StartedToPaymentInitiated?: DriverLocation[];
  };
  className?: string;
}

const RideMap: React.FC<RideMapProps> = ({
  pickupLocation,
  dropLocation,
  driverLocations,
  className,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [directionsResponse, setDirectionsResponse] =
    React.useState<google.maps.DirectionsResult | null>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  React.useEffect(() => {
    if (isLoaded && pickupLocation && dropLocation) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickupLocation,
          destination: dropLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirectionsResponse(result);
          }
        }
      );

      // Create bounds that include all points
      const newBounds = new google.maps.LatLngBounds();
      newBounds.extend(pickupLocation);
      newBounds.extend(dropLocation);

      // Add driver locations to bounds
      if (driverLocations?.acceptedToReachedCustomer?.length) {
        driverLocations.acceptedToReachedCustomer.forEach((loc) => {
          newBounds.extend({
            lat: loc.latitude,
            lng: loc.longitude,
          });
        });
      }

      if (mapRef.current) {
        mapRef.current.fitBounds(newBounds);
      }
    }
  }, [isLoaded, pickupLocation, dropLocation, driverLocations]);

  const getDriverPath = () => {
    if (!driverLocations?.acceptedToReachedCustomer?.length) return [];

    return driverLocations.acceptedToReachedCustomer.map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
    }));
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className={`w-full h-full ${className || ""}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={13}
        center={pickupLocation}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        }}
      >
        {/* Show the planned route */}
        {directionsResponse && (
          <DirectionsRenderer 
            directions={directionsResponse}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#4A90E2",
                strokeWeight: 4,
                strokeOpacity: 0.7,
              },
            }}
          />
        )}

        {/* Show driver's actual path */}
        {driverLocations?.acceptedToReachedCustomer && driverLocations.acceptedToReachedCustomer.length > 0 && (
          <Polyline
            path={getDriverPath()}
            options={{
              strokeColor: "#FF4444",
              strokeWeight: 3,
              strokeOpacity: 0.8,
            }}
          />
        )}

        {/* Pickup marker */}
        {pickupLocation && (
          <Marker
            position={{
              lat: Number(pickupLocation.lat),
              lng: Number(pickupLocation.lng)
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            }}
          />
        )}

        {/* Drop marker */}
        {dropLocation && (
          <Marker
            position={{
              lat: Number(dropLocation.lat),
              lng: Number(dropLocation.lng)
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }}
          />
        )}

        {/* Current/Last driver position */}
        {driverLocations?.acceptedToReachedCustomer && driverLocations.acceptedToReachedCustomer.length > 0 && (
          <Marker
            position={{
              lat: Number(driverLocations.acceptedToReachedCustomer[driverLocations.acceptedToReachedCustomer.length - 1]?.latitude ?? 0),
              lng: Number(driverLocations.acceptedToReachedCustomer[driverLocations.acceptedToReachedCustomer.length - 1]?.longitude ?? 0),
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default RideMap;