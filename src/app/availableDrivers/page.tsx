"use client";

import BASE_URL from "@/config/apiConfig";
import React, { useState, useEffect, useRef } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

// ---------- STYLING & CONSTANTS ----------
const mapContainerStyle: React.CSSProperties = {
  width: "50vw",
  height: "90vh",
};

const initialCenter = { lat: 25.145785691539647, lng: 55.223768868913844 };

const blueStyle = [
  { elementType: "geometry", stylers: [{ color: "#1e3a8a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e3a8a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#4b5e94" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#2563eb" }] },
];

// ---------- ICON HELPERS ----------
const ICONS = {
  chauffeurCar: "/car.png",
  greenPin: "/greenpin.png",
  redPin: "/redpin.png",
  pdCar: "/pd.png",
};

function getIconForUser(user: any): google.maps.Icon {
  if (user.user_type === "Chauffeur") {
    if (user.active_ride) {
      return { url: ICONS.chauffeurCar, scaledSize: new window.google.maps.Size(48, 48) };
    }
    if (user.status === "Online") {
      return { url: ICONS.greenPin, scaledSize: new window.google.maps.Size(48, 48) };
    } else {
      return { url: ICONS.redPin, scaledSize: new window.google.maps.Size(48, 48) };
    }
  } else if (user.user_type === "PD") {
    return { url: ICONS.pdCar, scaledSize: new window.google.maps.Size(48, 48) };
  }
  return { url: ICONS.redPin, scaledSize: new window.google.maps.Size(48, 48) };
}

// ---------- ANIMATED MARKER COMPONENT ----------
type AnimatedMarkerProps = {
  position: google.maps.LatLngLiteral;
  icon: google.maps.Icon;
  onClick?: () => void;
  zIndex?: number;
  isSelected?: boolean;
  userType?: string;
  activeRide?: boolean;
};

const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({
  position,
  icon,
  onClick,
  zIndex = 1,
  isSelected = false,
  userType,
  activeRide,
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    if (!markerRef.current) return;

    const start = currentPosition;
    const end = position;
    const duration = 1000;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;

      const newPos = { lat, lng };
      markerRef.current?.setPosition(newPos);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentPosition(end);
      }
    };

    requestAnimationFrame(animate);
  }, [position, currentPosition]);

  useEffect(() => {
    if (markerRef.current) {
      // Apply bounce only if not PD and not on active ride
      if (isSelected && userType !== "PD" && !activeRide) {
        markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
      } else {
        markerRef.current.setAnimation(null);
      }
    }
  }, [isSelected, userType, activeRide]);

  return (
    <Marker
      onLoad={(marker) => (markerRef.current = marker)}
      position={currentPosition}
      icon={icon}
      onClick={onClick}
      zIndex={zIndex}
    />
  );
};

// Helper to format date strings
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// ---------- MAIN PAGE ----------
export default function AvailableDriversPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ["places"],
  });

  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const navigate = useNavigate();

  async function fetchNearbyDrivers() {
    try {
      const token = localStorage.getItem("authToken");
      const url = `${BASE_URL}/api/location/getnearbyuser`;
      const payload = {
        latitude: 25.145785691539647,
        longitude: 55.223768868913844,
        radius: 100000,
        user_type: "chauffeur",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        const uniqueDrivers = Object.values(
          data.data.reduce((acc: any, current: any) => {
            const existing = acc[current.id];
            if (!existing || new Date(current.updated_at) > new Date(existing.updated_at)) {
              acc[current.id] = current;
            }
            return acc;
          }, {})
        );
        setNearbyDrivers(uniqueDrivers);
      } else {
        console.error("Failed to fetch nearby drivers:", data);
      }
    } catch (error) {
      console.error("Error fetching nearby drivers:", error);
    }
  }

  useEffect(() => {
    fetchNearbyDrivers();
    const intervalId = setInterval(fetchNearbyDrivers, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter drivers into categories
  const chauffeursOnRide = nearbyDrivers.filter(
    (user) => user.user_type === "Chauffeur" && user.active_ride
  );
  const chauffeursOnline = nearbyDrivers.filter(
    (user) => user.user_type === "Chauffeur" && !user.active_ride && user.status === "Online"
  );
  const pdUsers = nearbyDrivers.filter((user) => user.user_type === "PD");
  const chauffeursOffline = nearbyDrivers.filter(
    (user) => user.user_type === "Chauffeur" && !user.active_ride && user.status !== "Online"
  );

  const handleMarkerClick = (uniqueId: string) => {
    if (activeMarker === uniqueId) {
      setActiveMarker(null);
    } else {
      setActiveMarker(uniqueId);
      const user = nearbyDrivers.find((u) => `${u.id}-${u.updated_at}` === uniqueId);
      if (user && mapRef.current) {
        mapRef.current.setCenter({ lat: user.latitude, lng: user.longitude });
        mapRef.current.setZoom(15);
      }
    }
  };

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Available Chauffeurs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            onClick={() => navigate("DriverLogSummaryPage")}
            className="rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Summary
          </Button>
        </header>

        <div className="flex">
          {/* Left Sidebar for User List */}
          <div className="w-1/3 p-4 overflow-y-auto" style={{ maxHeight: "90vh" }}>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                {/* Chauffeurs on Ride */}
                <h3 className="text-md font-semibold mb-2">Chauffeurs on Ride</h3>
                <Accordion type="single" collapsible>
                  {chauffeursOnRide.length > 0 ? (
                    chauffeursOnRide.map((user) => {
                      const uniqueId = `${user.id}-${user.updated_at}`;
                      return (
                        <AccordionItem key={uniqueId} value={uniqueId}>
                          <AccordionTrigger
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${activeMarker === uniqueId ? "bg-blue-100" : ""}`}
                            onClick={() => handleMarkerClick(uniqueId)}
                          >
                            <div className="flex items-center space-x-2">
                              <img src={getIconForUser(user).url} alt="Chauffeur" className="w-6 h-6" />
                              <span>{user.name || "N/A"}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm space-y-1 pl-10">
                            <p><strong>Mobile:</strong> {user.mobile_number || "-"}</p>
                            <p><strong>Status:</strong> {user.status || "-"}</p>
                            <p><strong>Active Ride:</strong> {user.active_ride ? "Yes" : "No"}</p>
                            {user.status === "Offline" && user.last_seen && (
                              <p><strong>Last Seen:</strong> {formatDate(user.last_seen)}</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No chauffeurs on ride.</p>
                  )}
                </Accordion>

                {/* Chauffeurs Online */}
                <h3 className="text-md font-semibold mt-4 mb-2">Chauffeurs Online</h3>
                <Accordion type="single" collapsible>
                  {chauffeursOnline.length > 0 ? (
                    chauffeursOnline.map((user) => {
                      const uniqueId = `${user.id}-${user.updated_at}`;
                      return (
                        <AccordionItem key={uniqueId} value={uniqueId}>
                          <AccordionTrigger
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${activeMarker === uniqueId ? "bg-blue-100" : ""}`}
                            onClick={() => handleMarkerClick(uniqueId)}
                          >
                            <div className="flex items-center space-x-2">
                              <img src={getIconForUser(user).url} alt="Chauffeur" className="w-6 h-6" />
                              <span>{user.name || "N/A"}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm space-y-1 pl-10">
                            <p><strong>Mobile:</strong> {user.mobile_number || "-"}</p>
                            <p><strong>Status:</strong> {user.status || "-"}</p>
                            <p><strong>Active Ride:</strong> {user.active_ride ? "Yes" : "No"}</p>
                            {user.status === "Offline" && user.last_seen && (
                              <p><strong>Last Seen:</strong> {formatDate(user.last_seen)}</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No chauffeurs online.</p>
                  )}
                </Accordion>

                {/* PD */}
                <h3 className="text-md font-semibold mt-4 mb-2">PD</h3>
                <Accordion type="single" collapsible>
                  {pdUsers.length > 0 ? (
                    pdUsers.map((user) => {
                      const uniqueId = `${user.id}-${user.updated_at}`;
                      return (
                        <AccordionItem key={uniqueId} value={uniqueId}>
                          <AccordionTrigger
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${activeMarker === uniqueId ? "bg-blue-100" : ""}`}
                            onClick={() => handleMarkerClick(uniqueId)}
                          >
                            <div className="flex items-center space-x-2">
                              <img src={getIconForUser(user).url} alt="PD" className="w-6 h-6" />
                              <span>{user.name || "N/A"}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm space-y-1 pl-10">
                            <p><strong>Mobile:</strong> {user.mobile_number || "-"}</p>
                            <p><strong>Status:</strong> {user.status || "-"}</p>
                            <p><strong>Active Ride:</strong> {user.active_ride ? "Yes" : "No"}</p>
                            {user.status === "Offline" && user.last_seen && (
                              <p><strong>Last Seen:</strong> {formatDate(user.last_seen)}</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No PD users.</p>
                  )}
                </Accordion>

                {/* Chauffeurs Offline */}
                <h3 className="text-md font-semibold mt-4 mb-2">Chauffeurs Offline</h3>
                <Accordion type="single" collapsible>
                  {chauffeursOffline.length > 0 ? (
                    chauffeursOffline.map((user) => {
                      const uniqueId = `${user.id}-${user.updated_at}`;
                      return (
                        <AccordionItem key={uniqueId} value={uniqueId}>
                          <AccordionTrigger
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${activeMarker === uniqueId ? "bg-blue-100" : ""}`}
                            onClick={() => handleMarkerClick(uniqueId)}
                          >
                            <div className="flex items-center space-x-2">
                              <img src={getIconForUser(user).url} alt="Chauffeur" className="w-6 h-6" />
                              <span>{user.name || "N/A"}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm space-y-1 pl-10">
                            <p><strong>Mobile:</strong> {user.mobile_number || "-"}</p>
                            <p><strong>Status:</strong> {user.status || "-"}</p>
                            <p><strong>Active Ride:</strong> {user.active_ride ? "Yes" : "No"}</p>
                            {user.status === "Offline" && user.last_seen && (
                              <p><strong>Last Seen:</strong> {formatDate(user.last_seen)}</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No chauffeurs offline.</p>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Map Area */}
          <div className="relative w-2/3">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={initialCenter}
              zoom={12}
              options={{
                styles: blueStyle,
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
              }}
              onLoad={(map) => {
                mapRef.current = map;
              }}
            >
              {nearbyDrivers.map((user) => {
                const position = { lat: user.latitude, lng: user.longitude };
                const icon = getIconForUser(user);
                const uniqueId = `${user.id}-${user.updated_at}`;

                return (
                  <React.Fragment key={uniqueId}>
                    <AnimatedMarker
                      position={position}
                      icon={icon}
                      onClick={() => handleMarkerClick(uniqueId)}
                      zIndex={activeMarker === uniqueId ? 500 : 1}
                      isSelected={activeMarker === uniqueId}
                      userType={user.user_type}
                      activeRide={user.active_ride}
                    />
                    <OverlayView
                      position={position}
                      mapPaneName={OverlayView.FLOAT_PANE}
                    >
                      <div
                        className="absolute left-1/2 -translate-x-1/2 translate-y-[10px] text-center"
                        style={{ zIndex: 10 }}
                      >
                        <span
                          className="text-xs font-semibold bg-white px-1 py-0.5 rounded shadow inline-block whitespace-nowrap max-w-[150px] truncate"
                        >
                          {user.name || "N/A"}
                        </span>
                      </div>
                    </OverlayView>
                  </React.Fragment>
                );
              })}
            </GoogleMap>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}