import React, { useEffect, useState } from "react";
import { PdTable } from "@/components/pdlist";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PDService from "@/utils/pdService";
import { ApiResponse } from "@/utils/apiFetcher";
import { Button } from "@/components/ui/button";
import { PDDrawer } from "@/components/PDCreation";
import { FiRefreshCcw } from "react-icons/fi";
import { parseStoredRoles } from "@/utils/roleAccess";

export interface Pd {
  id: number;
  documents?: any;
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
}

const PDPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pds, setPds] = useState<Pd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(parseStoredRoles(localStorage.getItem("roles")));
  }, []);

  const isOperator = roles.some(role => role.includes("operator"));

  const fetchPds = async () => {
    setLoading(true);
    // Temporarily type response.data as any[] to handle potential field mismatch
    const response: ApiResponse<any[]> = await PDService.fetchIndividualPD();
    if (response.success && response.data) {
      const mappedPds = response.data.map(pd => ({
        ...pd,
        is_active: pd.user_availability, // Map user_availability to is_active
      }));
      setPds(mappedPds);
    } else {
      setError(response.error || "Failed to fetch PDs.");
    }
    setLoading(false);
  };

  // Fetch PDs on mount
  useEffect(() => {
    fetchPds();
  }, []);

  // Callback to refresh PDs after a new PD creation
  const handlePdCreated = () => {
    fetchPds();
  };

  const handleRefresh = () => {
    fetchPds();
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
            <BreadcrumbPage>PD</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold pt-4">PD</h1>
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button onClick={handleRefresh} className="flex items-center bg-blue-500 rounded">
          <FiRefreshCcw className="mr-2" /> Refresh
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="search-title"
            className="block text-sm font-medium text-gray-700"
          >
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
            <Button
              variant="outline"
              className="bg-blue-500 text-white py-2 px-4 rounded"
            >
              Search
            </Button>
            {!isOperator && <PDDrawer onPDCreated={handlePdCreated} />}
          </div>
        </div>
      </div>

      {/* Pass onPDUpdated callback to update PD list on changes */}
      <PdTable
        searchTerm={searchTerm}
        pds={pds}
        loading={loading}
        error={error}
        onPDUpdated={(updatedPd: Pd) => {
          setPds((prevPds) =>
            prevPds.map((pd) => (pd.id === updatedPd.id ? updatedPd : pd))
          );
        }}
        isOperator={isOperator}
      />
    </div>
  );
};

export default PDPage;