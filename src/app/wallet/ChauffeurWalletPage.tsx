import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import ChauffeurWalletBalancePage from "@/components/ChauffeurWallet";



const ChauffeurWalletPage: React.FC = () => {
  return (
    <div className="p-4">
       <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                 Wallet
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Chauffeur Wallet</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
           
      <div className="rounded-xl">
      <h1 className="text-2xl font-bold pt-4">Chauffeur Wallet</h1>
<ChauffeurWalletBalancePage/>
       
      </div>
    </div>
  );
};

export default ChauffeurWalletPage;
