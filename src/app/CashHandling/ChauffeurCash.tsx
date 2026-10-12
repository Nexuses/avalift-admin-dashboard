import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"





const ChauffeurCashHandlingPage: React.FC = () => {
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
                      <BreadcrumbPage>Chauffeur</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
           
      <div className="rounded-xl">
      <h1 className="text-2xl font-bold pt-4">Chauffeur</h1>
      

   
       
      </div>
    </div>
  );
};

export default ChauffeurCashHandlingPage;
