"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import notificationService, {
  Notification as NotificationType,
  ApiResponse,
} from "@/utils/notificationService";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = (notificationId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [notificationId]: !prev[notificationId],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data: ApiResponse = await notificationService.fetchNotifications(1, 10);
        setNotifications(data.data.notifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  return (
    <div className="w-full p-6 bg-white min-h-screen">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Ride Notifications</h1>
        <Button
          className="self-start md:self-auto"
          onClick={() => navigate("/admin/dashboard/Notifications/send")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading notifications...</p>
      ) : error ? (
        <div className="text-center text-gray-500">
          Failed to load notifications (Error: {error})
        </div>
      ) : notifications.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Ride ID</TableHead>
                <TableHead>Title</TableHead>
               
                <TableHead>Pickup</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <React.Fragment key={notification.notification_id}>
                  <TableRow className="hover:bg-gray-100">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleExpand(notification.notification_id)
                        }
                      >
                        {expanded[notification.notification_id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{notification.data.ride_id}</TableCell>
                    <TableCell>{notification.title}</TableCell>
                    {/* <TableCell>{notification.data.pd_name}</TableCell> */}
                    <TableCell>
                      {notification.data.requested_pickup_point}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          notification.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {notification.status}
                      </span>
                    </TableCell>
                  </TableRow>
                  {expanded[notification.notification_id] && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="p-4 bg-gray-50 rounded-lg w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Notification Details */}
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Notification ID:
                                </span>{" "}
                                {notification.notification_id}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Recipient:
                                </span>{" "}
                                {notification.recipient_type} #
                                {notification.recipient_id}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Delivery Time:
                                </span>{" "}
                                {formatDate(notification.delivery_time)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Message:</span>{" "}
                                {notification.body}
                              </p>
                            </div>

                            {/* Ride Data */}
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  PD ID:
                                </span>{" "}
                                {notification.data.pd_id}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Mobile:
                                </span>{" "}
                                {notification.data.pd_country_code}
                                {notification.data.pd_mobilenumber}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Pickup (Lat):
                                </span>{" "}
                                {notification.data.requested_pickup_lat}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Pickup (Long):
                                </span>{" "}
                                {notification.data.requested_pickup_long}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center text-gray-500">No notifications found.</div>
      )}
    </div>
  );
};

export default NotificationsPage;
