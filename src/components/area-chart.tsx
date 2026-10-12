"use client";


import { ResponsiveContainer, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import dashboardService from "@/utils/dashboardService";
import { Empty, Spin } from "antd";
import { format } from "date-fns";

export function CompletedVsCancelledChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [summaryText, setSummaryText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("No authorization token found");

        const response = await dashboardService.fetchDashboardData(authToken);

        if (response.success) {
          const ridesByDate = response.data?.data?.chauffeurRidesByDate || {};

          // Get dates, sort ascending (oldest first)
          const dates = Object.keys(ridesByDate).sort();
          // Get only the last 7 days if there are more than 7.
          const last7Dates = dates.slice(-7);
          const dataArray = last7Dates.map((date) => ({
            date,
            instantCompleted: ridesByDate[date]?.instant?.Completed || 0,
            instantCancelled: ridesByDate[date]?.instant?.Cancelled || 0,
            scheduledCompleted: ridesByDate[date]?.scheduled?.Completed || 0,
            scheduledCancelled: ridesByDate[date]?.scheduled?.Cancelled || 0,
          }));

          setChartData(dataArray);

          // Calculate overall totals over these dates
          const totalCompleted = dataArray.reduce(
            (acc, cur) => acc + cur.instantCompleted + cur.scheduledCompleted,
            0
          );
          const totalCancelled = dataArray.reduce(
            (acc, cur) => acc + cur.instantCancelled + cur.scheduledCancelled,
            0
          );

          setSummaryText(`Completed: ${totalCompleted} | Cancelled: ${totalCancelled}`);
        } else {
          console.error("Failed to fetch dashboard data:", response.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="w-full flex flex-col min-h-[400px]">
      <CardHeader className="items-center pb-1">
        <CardTitle>Instant vs Scheduled: Completed & Cancelled</CardTitle>
        <CardDescription>Overall Rides Summary (Last 7 Days)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        <div className="flex justify-center gap-6 mb-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span
              className="block w-3 h-3"
              style={{ backgroundColor: "hsl(210, 70%, 40%)" }}
            ></span>
            <span>Instant</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="block w-3 h-3"
              style={{ backgroundColor: "hsl(180, 70%, 40%)" }}
            ></span>
            <span>Scheduled</span>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        ) : chartData.length === 0 ? (
          <Empty description="No data available" />
        ) : (
          <ChartContainer
            config={{
              instantCompleted: { color: "hsl(210, 70%, 40%)" },
              instantCancelled: { color: "hsl(210, 70%, 60%)" },
              scheduledCompleted: { color: "hsl(180, 70%, 40%)" },
              scheduledCancelled: { color: "hsl(180, 70%, 60%)" },
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
              
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const formattedDate = format(new Date(data.date), "dd/MM/yyyy");
                      const completed = data.instantCompleted + data.scheduledCompleted;
                      const cancelled = data.instantCancelled + data.scheduledCancelled;
                      return (
                        <div className="p-2 bg-white shadow-md rounded-md">
                          <p className="font-semibold">{formattedDate}</p>
                          <p>Completed: {completed}</p>
                          <p>Cancelled: {cancelled}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={false}
                />
                <Area
                  type="monotone"
                  dataKey="instantCompleted"
                  fill="hsl(210, 70%, 40%)"
                  stroke="hsl(210, 70%, 40%)"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="instantCancelled"
                  fill="hsl(210, 70%, 60%)"
                  stroke="hsl(210, 70%, 60%)"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="scheduledCompleted"
                  fill="hsl(180, 70%, 40%)"
                  stroke="hsl(180, 70%, 40%)"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="scheduledCancelled"
                  fill="hsl(180, 70%, 60%)"
                  stroke="hsl(180, 70%, 60%)"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm mt-auto font-semibold">
        {summaryText}
      </CardFooter>
    </Card>
  );
}
