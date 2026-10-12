import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AllChaffeurRidesTable } from "@/components/DriverRides";

const ChaffeurPdRide: React.FC = () => {
  return (
    <div className="p-4">
      <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">
                          PD Activities
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Chauffeur-PD Rides</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
      <h1 className="text-2xl font-bold pt-4">Chauffeur-PD Rides</h1>
      <div className="mt-6">
    <AllChaffeurRidesTable/>
      </div>
    </div>
  );
};

export default ChaffeurPdRide;
