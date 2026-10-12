import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import AdminWalletBalancePage from "@/components/AdminWallet";


const AdminWalletPage: React.FC = () => {
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
                      <BreadcrumbPage>Admin Wallet</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
            <h1 className="text-2xl font-bold pt-4">
     Admin Wallet
      </h1>
      <div className="rounded-xl">
       <AdminWalletBalancePage/>
       
      </div>
    </div>
  );
};

export default AdminWalletPage;
