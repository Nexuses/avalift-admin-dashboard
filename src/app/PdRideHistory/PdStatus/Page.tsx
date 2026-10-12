import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PDStatusTable } from "@/components/PDStatusTable";

const PdStatus: React.FC = () => {
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
                        <BreadcrumbPage>PD Pickup and Drop Status</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
      <h1 className="text-2xl font-bold pt-4">PickUp and Drop Status</h1>
      <div className="mt-6">
      {/* <PDHistoryTable/> */}
      <PDStatusTable/>
      </div>
    </div>
  );
};

export default PdStatus;
