"use client";

import { Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import dashboardService from "@/utils/dashboardService";
import { Empty, Spin } from "antd";

// Scheduled rides configuration (lighter blue shades)
const scheduledChartConfig = {
  requested: { label: "Requested", color: "hsl(210, 50%, 80%)" },
  accepted: { label: "Accepted", color: "hsl(210, 50%, 75%)" },
  started: { label: "Started", color: "hsl(210, 50%, 70%)" },
  reached_customer: { label: "Reached Customer", color: "hsl(210, 50%, 65%)" },
  payment_initiated: { label: "Payment Initiated", color: "hsl(210, 50%, 60%)" },
  completed: { label: "Completed", color: "hsl(210, 50%, 55%)" },
  review_pending: { label: "Review-Pending", color: "hsl(210, 50%, 50%)" },
  cancelled: { label: "Cancelled", color: "hsl(210, 50%, 45%)" },
  payment_pending: { label: "Payment-Pending", color: "hsl(210, 50%, 40%)" },
  noData: { label: "No Data", color: "#ccc" },
};

// Instant rides configuration (darker, more saturated blue shades)
const instantChartConfig = {
  requested: { label: "Requested", color: "hsl(210, 70%, 70%)" },
  accepted: { label: "Accepted", color: "hsl(210, 70%, 65%)" },
  started: { label: "Started", color: "hsl(210, 70%, 60%)" },
  reached_customer: { label: "Reached Customer", color: "hsl(210, 70%, 55%)" },
  payment_initiated: { label: "Payment Initiated", color: "hsl(210, 70%, 50%)" },
  completed: { label: "Completed", color: "hsl(210, 70%, 45%)" },
  review_pending: { label: "Review-Pending", color: "hsl(210, 70%, 40%)" },
  cancelled: { label: "Cancelled", color: "hsl(210, 70%, 35%)" },
  payment_pending: { label: "Payment-Pending", color: "hsl(210, 70%, 30%)" },
  noData: { label: "No Data", color: "#ccc" },
};

export function Component() {
  const [scheduledData, setScheduledData] = useState<any[]>([]);
  const [instantData, setInstantData] = useState<any[]>([]);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [instantTotal, setInstantTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState(Date.now());

  const statusKeys = [
    "requested",
    "accepted",
    "started",
    "reached_customer",
    "payment_initiated",
    "completed",
    "review_pending",
    "cancelled",
    "payment_pending",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          // Initialize empty data for both charts
          const emptyData = statusKeys.map((key) => ({
            status: scheduledChartConfig[key as keyof typeof scheduledChartConfig].label,
            rides: 0,
            fill: scheduledChartConfig[key as keyof typeof scheduledChartConfig].color,
          }));
          setScheduledData(emptyData);
          setInstantData(emptyData);
          setScheduledTotal(0);
          setInstantTotal(0);
          return;
        }

        const response = await dashboardService.fetchDashboardData(authToken);
        if (response.success) {
          const { statusCount } = response.data.data;
          const scheduledStatusCount = statusCount.scheduled || {};
          const instantStatusCount = statusCount.instant || {};

          const statusKeyMapping: Record<string, string> = {
            requested: "Requested",
            accepted: "Accepted",
            started: "Started",
            reached_customer: "Reached Customer",
            payment_initiated: "Payment Initiated",
            completed: "Completed",
            review_pending: "Review-Pending",
            cancelled: "Cancelled",
            payment_pending: "Payment-Pending",
          };

          // Initialize data with zeros for all known statuses
          const updatedScheduledData = statusKeys.map((key) => ({
            status: scheduledChartConfig[key as keyof typeof scheduledChartConfig].label,
            rides: scheduledStatusCount[statusKeyMapping[key]] || 0,
            fill: scheduledChartConfig[key as keyof typeof scheduledChartConfig].color,
          }));

          const updatedInstantData = statusKeys.map((key) => ({
            status: instantChartConfig[key as keyof typeof instantChartConfig].label,
            rides: instantStatusCount[statusKeyMapping[key]] || 0,
            fill: instantChartConfig[key as keyof typeof instantChartConfig].color,
          }));

          const scheduledSum = updatedScheduledData.reduce((sum, item) => sum + item.rides, 0);
          const instantSum = updatedInstantData.reduce((sum, item) => sum + item.rides, 0);

          setScheduledData(updatedScheduledData);
          setInstantData(updatedInstantData);
          setScheduledTotal(scheduledSum);
          setInstantTotal(instantSum);
          setChartKey(Date.now());
        } else {
          // Initialize empty data on unsuccessful response
          const emptyData = statusKeys.map((key) => ({
            status: scheduledChartConfig[key as keyof typeof scheduledChartConfig].label,
            rides: 0,
            fill: scheduledChartConfig[key as keyof typeof scheduledChartConfig].color,
          }));
          setScheduledData(emptyData);
          setInstantData(emptyData);
          setScheduledTotal(0);
          setInstantTotal(0);
        }
      } catch (err: any) {
        // Initialize empty data on error
        const emptyData = statusKeys.map((key) => ({
          status: scheduledChartConfig[key as keyof typeof scheduledChartConfig].label,
          rides: 0,
          fill: scheduledChartConfig[key as keyof typeof scheduledChartConfig].color,
        }));
        setScheduledData(emptyData);
        setInstantData(emptyData);
        setScheduledTotal(0);
        setInstantTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const overallTotal = scheduledTotal + instantTotal;

  return (
    <Card className="flex flex-col w-full min-h-[400px]">
      <CardHeader className="items-center pb-1">
        <CardTitle className="text-center">Ride Status Distribution</CardTitle>
        <CardDescription className="text-center">Last 30 Days</CardDescription>
      </CardHeader>

      <div className="flex justify-center">
        <div className="flex items-center gap-1">
          <span
            className="block w-3 h-3"
            style={{ backgroundColor: scheduledChartConfig.requested.color }}
          ></span>
          <span className="text-sm">Inner: Scheduled</span>
          <span className="mx-2"></span>
          <span
            className="block w-3 h-3"
            style={{ backgroundColor: instantChartConfig.requested.color }}
          ></span>
          <span className="text-sm">Outer: Instant</span>
        </div>
      </div>

      <CardContent className="flex-1 p-2">
        {loading ? (
          <div className="text-center text-muted-foreground"><Spin /></div>
        ) : overallTotal === 0 ? (
          <div className="text-center text-muted-foreground">
            <Empty description="No data available" />
          </div>
        ) : (
          <ChartContainer
            config={{
              ...scheduledChartConfig,
              ...instantChartConfig,
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart key={chartKey} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Pie
                  data={scheduledData}
                  dataKey="rides"
                  nameKey="status"
                  innerRadius={35}
                  outerRadius={55}
                  stroke="none"
                />
                <Pie
                  data={instantData}
                  dataKey="rides"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={85}
                  strokeWidth="none"
                >
                  <Label
                    content={({ viewBox }) =>
                      viewBox && "cx" in viewBox && "cy" in viewBox ? (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan className="fill-foreground text-2xl font-bold">
                            {overallTotal.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-sm"
                          >
                            Rides
                          </tspan>
                        </text>
                      ) : null
                    }
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>

      {!loading && overallTotal > 0 && (
        <CardFooter className="flex-col gap-2 text-sm mt-auto">
          <div className="font-semibold">
            Scheduled Rides: {scheduledTotal} | Instant Rides: {instantTotal}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}