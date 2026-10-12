import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import PDCashPage from "@/components/PdCash";


const PDCashHandlingPage: React.FC = () => {
  return (
    <div className="p-4">
       <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                 Cash Handling
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>PD</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
            <h1 className="text-2xl font-bold pt-4">
     PD 
      </h1>
      <div className="rounded-xl">
        <PDCashPage/>
        
       
      </div>
    </div>
  );
};

export default PDCashHandlingPage;
