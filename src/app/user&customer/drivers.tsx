"use client";

import React, { useEffect, useState } from "react";
import { DriverDataTable } from "@/components/driverlist";
import { DriverDrawer } from "@/components/driverCreation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import DriverService from "@/utils/driverService";
import { FiRefreshCcw } from "react-icons/fi";
import { parseStoredRoles } from "@/utils/roleAccess";

interface Document {
  name: string;
  url: string;
  type?: string;
}

interface Driver {
  id: number;
  documents?: Document[];
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  type_id: number;
  role_id: number;
  is_active: boolean;
  status_id: number | null;
  device_id: string | null;
  createdAt: string;
  updatedAt: string;
  emirates_id: string;
  emiratesId_validity: string;
  licence_number: string;
  licence_validity: string;
  user_availability?: boolean;
}

const DriversPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<string[]>([]);

  // 🔄 Force reload on first visit
  useEffect(() => {
    setRoles(parseStoredRoles(localStorage.getItem("roles")));

    if (!localStorage.getItem("driversPageReloaded")) {
      localStorage.setItem("driversPageReloaded", "true");
      window.location.reload();
    }
  }, []);

  const isOperator = roles.some(role => role.includes("operator"));

  const fetchDrivers = async () => {
    setLoading(true);
    const response = await DriverService.fetchIndividualDrivers();
    if (response.status && response.status >= 200 && response.status < 300 && response.data) {
      const mappedDrivers: Driver[] = response.data.map((driver) => ({
        ...driver,
        is_active: driver.user_availability ?? false,
      }));
      setDrivers(mappedDrivers);
    } else {
      setError(response.error || "Failed to fetch drivers.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDriverCreated = () => {
    fetchDrivers();
  };

  const handleRefresh = () => {
    fetchDrivers();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
            <BreadcrumbPage>Chauffeur</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold pt-4">Chauffeur</h1>

      <div className="flex justify-end">
        <Button onClick={handleRefresh} className="flex items-center bg-blue-500 rounded">
          <FiRefreshCcw className="mr-2" /> Refresh
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="search-title" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative w-1/4">
              <input
                id="search-title"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <Button variant="outline" className="bg-blue-500 text-white py-2 px-4 rounded">
              Search
            </Button>
            {!isOperator && <DriverDrawer onDriverCreated={handleDriverCreated} />}
          </div>
        </div>
      </div>

      <DriverDataTable
        searchTerm={searchTerm}
        drivers={drivers}
        loading={loading}
        error={error}
        onDriverUpdated={(updatedDriver) => {
          setDrivers((prevDrivers) =>
            prevDrivers.map((driver) =>
              driver.id === updatedDriver.id ? updatedDriver : driver
            )
          );
        }}
        isOperator={isOperator}
      />
    </div>
  );
};

export default DriversPage;