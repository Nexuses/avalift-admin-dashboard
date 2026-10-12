"use client";

import React, { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WalletTable } from "@/components/walletTable";
import WalletDetailsPage from "@/components/WalletHistory";
import { Grid, Clock } from "lucide-react";

const WalletPage: React.FC = () => {
  // When true, show the wallet table; when false, show wallet history.
  const [showWalletTable, setShowWalletTable] = useState(true);

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Wallet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold pt-4">Customer Wallet</h1>

      {/* Radio Buttons with Alternative Icons */}
      <div className="flex space-x-4 my-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="walletView"
            value="table"
            checked={showWalletTable}
            onChange={() => setShowWalletTable(true)}
            className="mr-2"
          />
          <Grid className="h-5 w-5 mr-2 text-gray-800" />
          <span className="text-sm font-medium text-gray-800">Wallet Table</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="walletView"
            value="history"
            checked={!showWalletTable}
            onChange={() => setShowWalletTable(false)}
            className="mr-2"
          />
          <Clock className="h-5 w-5 mr-2 text-gray-800" />
          <span className="text-sm font-medium text-gray-800">Wallet History</span>
        </label>
      </div>

      {/* Conditionally Render Content */}
      <div>
        {showWalletTable ? <WalletTable /> : <WalletDetailsPage />}
      </div>
    </div>
  );
};

export default WalletPage;
