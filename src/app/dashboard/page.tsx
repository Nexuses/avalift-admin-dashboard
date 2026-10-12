import { useState, useEffect } from "react";
import { CompletedVsCancelledChart } from "@/components/area-chart";
import { RidesByChauffeurChart } from "@/components/bar-chart";
import { TaxiCompanyStats } from "@/components/cards-data";
import { Component } from "@/components/pie_chart";
import { ScheduledRidesDashboard } from "@/components/ScheduledRidesShortcut";
import RideHistoryTable from "@/components/table";
import dashboardService from "@/utils/dashboardService";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming you have a Card component

// New Pending Payment Card Component
function PendingPaymentCard({ amount, loading, error }: { amount: number | null; loading: boolean; error: string | null }) {
  return (
    <Card className="transform transition-transform duration-300 hover:scale-105">
      <CardHeader>
        <CardTitle>Pending Payment Amount</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <p className="text-2xl font-bold">
            {amount !== null ? `${amount} AED` : "N/A"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending payment amount
  const fetchPendingPayment = async () => {
    const token = localStorage.getItem("authToken") || "";
    if (!token) {
      setError("No authentication token found.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await dashboardService.fetchOrganizationPendingPaymentAmount(token);
      if (response.success && response.data) {
        // Assuming the API returns { pending_amount: number }
        setPendingAmount(response.data.pending_amount || 0);
      } else {
        setError(response.error || "Failed to fetch pending payment amount.");
        setPendingAmount(null);
      }
    } catch (err) {
      setError("Error fetching pending payment amount.");
      setPendingAmount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowedOrg = localStorage.getItem("allowedOrganization");
    // Only fetch if allowedOrganization is a specific ID (not "*" or "1")
    if (allowedOrg && allowedOrg !== "*" && allowedOrg !== "1") {
      fetchPendingPayment();
    }
  }, []);

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-all duration-300 ease-in-out group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="#"
                    className="hover:text-primary transition-colors duration-200"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="transition-opacity duration-200 opacity-90 hover:opacity-100">
                    Performance Summary
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 h-full">
            <div className="transform transition-transform duration-300 hover:scale-105">
              <Component />
            </div>
            {typeof window !== "undefined" &&
              (localStorage.getItem("allowedOrganization") === "1" ||
                localStorage.getItem("allowedOrganization") === "*") && (
                <div className="transform transition-transform duration-300 hover:scale-105">
                  <RidesByChauffeurChart />
                </div>
              )}
            <div className="transform transition-transform duration-300 hover:scale-105">
              <CompletedVsCancelledChart />
            </div>
            {/* Add Pending Payment Card only for specific organization */}
            {typeof window !== "undefined" &&
              localStorage.getItem("allowedOrganization") !== "*" &&
              localStorage.getItem("allowedOrganization") !== "1" && (
                <div className="transform transition-transform duration-300 hover:scale-105">
                  <PendingPaymentCard
                    amount={pendingAmount}
                    loading={loading}
                    error={error}
                  />
                </div>
              )}
          </div>

          <div className="animate-in fade-in-0 duration-700">
            <TaxiCompanyStats />
          </div>
          <div className="animate-in fade-in-0 duration-700">
            <ScheduledRidesDashboard />
          </div>

          <RideHistoryTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}