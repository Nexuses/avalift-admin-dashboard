"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import dashboardService from "@/utils/dashboardService";
import { Empty, Spin } from "antd"; // Import Empty and Spin from antd

export function RidesByChauffeurChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalRides, setTotalRides] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setChartKey] = useState(Date.now());

  const allowedOrganization = localStorage.getItem("allowedOrganization");

  // 🛑 Don't render if not allowed
  if (allowedOrganization !== "1" && allowedOrganization !== "*") {
    return null;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("No authorization token found");

        const response = await dashboardService.fetchDashboardData(authToken);

        if (response.success) {
          const chauffeurData = response.data?.data?.chauffeurRidesCount || {};

          const sortedData = Object.entries(chauffeurData)
            .filter(([id]) => id !== "Unknown")
            .map(([id, data]: [string, any]) => ({ id, ...data }))
            .sort((a, b) => b.totalRides - a.totalRides)
            .slice(0, 10);

          setChartData(sortedData);

          const statusCount = response.data?.data?.statusCount || {};
          const scheduledCompleted = statusCount.scheduled?.Completed || 0;
          const instantCompleted = statusCount.instant?.Completed || 0;
          const totalCompleted = scheduledCompleted + instantCompleted;
          setTotalRides(totalCompleted || null);

          setChartKey(Date.now());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-white border rounded shadow">
          <p className="font-semibold">ID: {data.id}</p>
          <p>Name: {data.name || `Chauffeur ${data.id}`}</p>
          <p>Total Rides: {data.totalRides}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col w-full min-h-[400px]">
      <CardHeader className="items-center pb-1">
        <CardTitle className="text-center">Top 10 Chauffeurs by Rides</CardTitle>
        <CardDescription className="text-center">
          Ranked by the highest number of rides.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        ) : chartData.length === 0 ? (
          <Empty description="No data available" />
        ) : (
          <ChartContainer
            config={{
              totalRides: { color: "hsl(var(--chart-3))" },
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <ChartTooltip cursor={false} content={<CustomTooltip />} />
                <Bar
                  dataKey="totalRides"
                  fill="hsl(var(--chart-3))"
                  barSize={30}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm font-semibold text-center mt-auto">
        {totalRides !== null && (
          <div>
            Total completed rides : <span>{totalRides}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
