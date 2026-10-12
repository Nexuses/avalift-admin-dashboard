"use client";

import React, { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CorporateCustomerDrawer } from "@/components/CorporateCustomerCreation";
import { CorporateUserTable } from "@/components/CorperateUserTable";
import { Organization } from "@/types/organization";
import { Button } from "@/components/ui/button";
import { FiRefreshCcw } from "react-icons/fi";
import { parseStoredRoles } from "@/utils/roleAccess";

const CooperateCustomerPage: React.FC = () => {
  const [refresh, setRefresh] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("");
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(parseStoredRoles(localStorage.getItem("roles")));
    const handleOrgFilterChange = (e: CustomEvent) => setSelectedOrgFilter(e.detail);
    window.addEventListener("orgFilterChange", handleOrgFilterChange as EventListener);
    return () => window.removeEventListener("orgFilterChange", handleOrgFilterChange as EventListener);
  }, []);

  const isOperator = roles.some(role => role.includes("operator"));

  const handleCustomerCreated = () => {
    console.log("Corporate customer created");
    setRefresh((prev) => prev + 1);
    setIsDrawerOpen(false);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setIsDrawerOpen(true);
  };

  const handleEditComplete = () => {
    setRefresh((prev) => prev + 1);
    setSelectedOrg(null);
    setIsDrawerOpen(false);
  };

  const handleRefresh = () => {
    setRefresh((prev) => prev + 1);
    setSearchQuery("");
    setSelectedOrgFilter("");
  };

  const handleCreateNewCustomer = () => {
    setSelectedOrg(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">User and Customer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Organization Customer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold pt-4">Organization Customer</h1>
      <div className="flex justify-end items-center mb-4">
        <div className="flex space-x-2">
          {!isOperator && (
            <CorporateCustomerDrawer
              onCustomerCreated={handleCustomerCreated}
              selectedOrg={selectedOrg}
              onEditComplete={handleEditComplete}
              isOpen={isDrawerOpen}
              setIsOpen={setIsDrawerOpen}
              triggerButton={
                <Button onClick={handleCreateNewCustomer} className="bg-blue-500 text-white py-2 px-4 rounded">
                  Create Organization Customer
                </Button>
              }
            />
          )}
          <Button
            onClick={handleRefresh}
            className="flex items-center bg-blue-500 rounded text-white py-2 px-4"
          >
            <FiRefreshCcw className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded p-2 w-full max-w-md"
        />
      </div>

      <div className="space-y-4">
        <CorporateUserTable
          refresh={refresh}
          onEdit={handleEdit}
          searchQuery={searchQuery}
          selectedOrgFilter={selectedOrgFilter}
          isOperator={isOperator}
        />
      </div>
    </div>
  );
};

export default CooperateCustomerPage;