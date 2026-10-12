import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import RevenueCards from "@/components/RevenueReportCard";

const ReveneueReportPage: React.FC = () => {
  const [reportTitle, setReportTitle] = useState("Revenue Report");

  useEffect(() => {
    const allowedOrg = localStorage.getItem("allowedOrganization");
    if (allowedOrg !== "1" && allowedOrg !== "*") {
      setReportTitle("Ride Report");
    }
  }, []);

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{reportTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold pt-4">{reportTitle}</h1>

      <div className="space-y-4 mt-8">
        <RevenueCards />
      </div>
    </div>
  );
};

export default ReveneueReportPage;
