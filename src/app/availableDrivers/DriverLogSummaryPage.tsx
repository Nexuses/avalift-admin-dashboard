"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchDriverLogSummaryService } from "@/utils/driverService";

export interface UserLogSummary {
  user_id: string;
  name: string;
  mobile: string;
  date_utc: string;
  online_duration_hours: string; // String in "HH:MM" format
  offline_duration_hours: string; // String in "HH:MM" format
}

const DriverLogSummaryPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(""); // Current date by default (empty string)
  const [logSummary, setLogSummary] = useState<UserLogSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch driver log summary using the service function
  const fetchDriverLogSummary = async (date: string) => {
    setLoading(true);
    try {
      const data = await fetchDriverLogSummaryService(date);
      if (data.success && data.status === 200) {
        setLogSummary(data.userLogSummary);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to fetch driver log summary.");
        setLogSummary([]);
      }
    } catch (error: any) {
      console.error("Error fetching driver log summary:", error);
      toast.error(error.message || "An error occurred while fetching data.");
      setLogSummary([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount (using current date)
  useEffect(() => {
    fetchDriverLogSummary("");
  }, []);

  // Handle date change and fetch data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchDriverLogSummary(newDate);
  };

  // Reset to current date
  const handleResetToCurrent = () => {
    setSelectedDate("");
    fetchDriverLogSummary("");
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Driver Online/Offline Log Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date Picker and Reset Button */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <Label htmlFor="date-picker" className="text-gray-700">
                Select Date
              </Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="mt-1 w-64"
                max={format(new Date(), "yyyy-MM-dd")} // Prevent future dates
              />
            </div>
            <Button
              onClick={handleResetToCurrent}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Reset to Current Date
            </Button>
          </div>

          {/* Display selected date or current date */}
          <p className="text-gray-600 mb-4">
            Showing data for:{" "}
            {selectedDate
              ? format(parseISO(selectedDate), "PPP")
              : "Current Date (" + format(new Date(), "PPP") + ")"}
          </p>

          {/* Table to display log summary */}
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : logSummary.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-black">User ID</TableHead>
                  <TableHead className="font-bold text-black">Name</TableHead>
                  <TableHead className="font-bold text-black">Mobile</TableHead>
                  <TableHead className="font-bold text-black">Date</TableHead>
                  <TableHead className="font-bold text-black">Online </TableHead>
                  <TableHead className="font-bold text-black">Offline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logSummary.map((log) => (
                  <TableRow key={log.user_id}>
                    <TableCell>{log.user_id}</TableCell>
                    <TableCell>{log.name}</TableCell>
                    <TableCell>{log.mobile}</TableCell>
                    <TableCell>{format(parseISO(log.date_utc), "PPP")}</TableCell>
                    <TableCell>{log.online_duration_hours}</TableCell>
                    <TableCell>{log.offline_duration_hours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">No data available for the selected date.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverLogSummaryPage;