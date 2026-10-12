"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarTaxiFrontIcon, CarFrontIcon } from "lucide-react";
import dashboardService from "@/utils/dashboardService";

// Define the type for a single stat card.
interface Stat {
  title: string;
  value: string;
  icon: JSX.Element;
}

export function TaxiCompanyStats() {
  // We'll store two groups of stats: one for revenue and one for rides count.
  const [revenueStats, setRevenueStats] = useState<Stat[]>([]);
  const [ridesStats, setRidesStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Get allowedOrganization from localStorage
  const allowedOrganization = localStorage.getItem("allowedOrganization") || "";

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");

      try {
        const response = await dashboardService.fetchDashboardData(token!);

        if (response.data?.success) {
          const chauffeurData = response.data?.data?.chauffeurData;
          const ridesCount = response.data?.data?.ridesCount;

          if (chauffeurData && ridesCount) {
            // Build revenue stats cards in the order: Total, Yearly, Monthly, Today's.
            const revenueData: Stat[] = [
              {
                title: "Total Revenue",
                value: chauffeurData.totalRevenue?.toFixed(2) || "0.00",
                icon: <span className="font-semibold">AED</span>,
              },
              {
                title: "Yearly Revenue",
                value: chauffeurData.yearlyRevenue?.toFixed(2) || "0.00",
                icon: <span className="font-semibold">AED</span>,
              },
              {
                title: "Monthly Revenue",
                value: chauffeurData.monthlyRevenue?.toFixed(2) || "0.00",
                icon: <span className="font-semibold">AED</span>,
              },
              {
                title: "Today's Revenue",
                value: chauffeurData.todayRevenue?.toFixed(2) || "0.00",
                icon: <span className="font-semibold">AED</span>,
              },
            ];

            // Build rides count stats cards in the order: Total, Yearly, Monthly, Today's.
            const ridesData: Stat[] = [
              {
                title: "Total Rides",
                value: `${ridesCount.totalRides || 0}`,
                icon: <CarFrontIcon className="h-6 w-6" />,
              },
              {
                title: "Yearly Rides",
                value: `${ridesCount.yearlyRides || 0}`,
                icon: <CarFrontIcon className="h-6 w-6" />,
              },
              {
                title: "Monthly Rides",
                value: `${ridesCount.monthlyRides || 0}`,
                icon: <CarTaxiFrontIcon className="h-6 w-6" />,
              },
              {
                title: "Today's Rides",
                value: `${ridesCount.todayRides || 0}`,
                icon: <CarTaxiFrontIcon className="h-6 w-6" />,
              },
            ];

            setRevenueStats(revenueData);
            setRidesStats(ridesData);
          } else {
            
            setRevenueStats(getDefaultRevenueStats());
            setRidesStats(getDefaultRidesStats());
          }
        } else {
         
          setRevenueStats(getDefaultRevenueStats());
          setRidesStats(getDefaultRidesStats());
        }
      } catch (error) {
        
        setRevenueStats(getDefaultRevenueStats());
        setRidesStats(getDefaultRidesStats());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Default revenue stats for error/loading state.
  const getDefaultRevenueStats = (): Stat[] => [
    {
      title: "Total Revenue",
      value: "0.00",
      icon: <span className="font-semibold">AED</span>,
    },
    {
      title: "Yearly Revenue",
      value: "0.00",
      icon: <span className="font-semibold">AED</span>,
    },
    {
      title: "Monthly Revenue",
      value: "0.00",
      icon: <span className="font-semibold">AED</span>,
    },
    {
      title: "Today's Revenue",
      value: "0.00",
      icon: <span className="font-semibold">AED</span>,
    },
  ];

  // Default rides stats for error/loading state.
  const getDefaultRidesStats = (): Stat[] => [
    {
      title: "Total Rides",
      value: "+0",
      icon: <CarFrontIcon className="h-6 w-6" />,
    },
    {
      title: "Yearly Rides",
      value: "+0",
      icon: <CarFrontIcon className="h-6 w-6" />,
    },
    {
      title: "Monthly Rides",
      value: "+0",
      icon: <CarTaxiFrontIcon className="h-6 w-6" />,
    },
    {
      title: "Today's Rides",
      value: "+0",
      icon: <CarTaxiFrontIcon className="h-6 w-6" />,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array(8)
          .fill(null)
          .map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <CardHeader className="p-2">
                <div className="flex items-center justify-between">
                  <div className="bg-blue-200 h-6 w-24" />
                  <div className="bg-blue-200 h-6 w-6 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-200 h-10 w-16 mb-2" />
                <div className="bg-blue-200 h-6 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div>
      {/* Revenue Stats - Only show if allowedOrganization is "1" or "*" */}
      {(allowedOrganization === "1" || allowedOrganization === "*") && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Revenue</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {revenueStats.map(({ title, value, icon }, index) => (
              <Card key={index} className="p-4 bg-blue-50 border border-blue-200">
                <CardHeader className="p-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-black">
                      {title}
                    </CardTitle>
                    <div>{icon}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-black">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rides Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Rides</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ridesStats.map(({ title, value, icon }, index) => (
            <Card key={index} className="p-4 bg-blue-100 border border-blue-300">
              <CardHeader className="p-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-black">
                    {title}
                  </CardTitle>
                  <div>{icon}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-black">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
