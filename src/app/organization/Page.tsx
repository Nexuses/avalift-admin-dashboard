import React, { useEffect, useState, ChangeEvent } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AllOrganizationTable } from "@/components/OrganizationTable";
import { CreateOrganizationDrawer } from "@/components/OrganizationCreate";
import { Button } from "@/components/ui/button";
import { ApiResponse } from "@/utils/apiFetcher";
import organizationService from "@/utils/organizationSevice";
import { FiRefreshCcw } from "react-icons/fi";

interface Organization {
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string | null;
  email_id: string | null;
}

const OrganizationPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // New state for the search term
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Function to fetch organizations from the API
  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No token found");
        return;
      }

      const response: ApiResponse<any> =
        await organizationService.fetchAllOrganizations();
      console.log("API response:", response);
      
      if (response.success && response.data) {
        // Try to extract the organizations array
        const orgs = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
        console.log("Organizations fetched:", orgs);
        setOrganizations(orgs);
      } else {
        setError(response.error || "Failed to fetch organizations.");
      }
    } catch (err) {
      setError("An error occurred while fetching organizations.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Callback for new organization creation
  const handleOrganizationCreated = () => {
    fetchOrganizations();
  };

  // Handler for refresh
  const handleRefresh = () => {
    setSearchTerm(""); // Reset search term to clear the filter
    fetchOrganizations();
  };

  // Handler for search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filtering based on searchTerm across multiple fields: id, name, email, and mobile number.
  const filteredOrganizations = organizations
    .map((org) => ({
      ...org,
      mobile_number: org.mobile_number ?? "", // Ensure mobile_number is always a string
      email_id: org.email_id ?? "", // Ensure email_id is always a string
    }))
    .filter((org) => {
      const lowerQuery = searchTerm.toLowerCase();
      return (
        org.id.toString().includes(searchTerm) ||
        (org.name && org.name.toLowerCase().includes(lowerQuery)) ||
        ((org.email_id ?? "").toLowerCase().includes(lowerQuery)) ||
        org.mobile_number.toLowerCase().includes(lowerQuery)
      );
    });

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">DashBoard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Organization</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold pt-4">Organization</h1>

      {/* Flex container with two sections: search UI on the left and refresh button on the right */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <label htmlFor="search-org" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative w-64">
              <input
                id="search-org"
                type="text"
                placeholder="Search by name, id, phone or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            {/* <Button
              variant="outline"
              className="bg-blue-500 text-white py-2 px-4 rounded"
              onClick={() => {}}
            >
              Search
            </Button> */}
            <CreateOrganizationDrawer onOrganizationCreated={handleOrganizationCreated} />
          </div>
        </div>
        {/* Refresh button placed at the end of the row */}
        <Button onClick={handleRefresh} className="flex items-center bg-blue-500 rounded text-white py-2 px-4">
          <FiRefreshCcw className="mr-2" /> Refresh
        </Button>
      </div>

      <AllOrganizationTable
        organization={filteredOrganizations}
        loading={loading}
        error={error}
        onOrganizationUpdated={(updatedOrganization: Organization) => {
          setOrganizations((prevOrgs) =>
            prevOrgs.map((org) =>
              org.id === updatedOrganization.id ? updatedOrganization : org
            )
          );
        }}
      />
    </div>
  );
};

export default OrganizationPage;