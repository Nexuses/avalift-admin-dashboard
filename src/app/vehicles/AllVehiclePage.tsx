import React, { useState, useEffect } from "react";
import { AllVehicleTable } from "@/components/AllVehicleTable";
import { vehicleService } from "@/utils/vehicleService";
import { FiRefreshCcw } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search } from "lucide-react";
import { AddVehicleDrawer } from "@/components/vehicleCreation";

// Define the expected structure of the API response
export interface VehicleApiResponse {
  data?: {
    vehicles?: any[];
    totalPages?: number;
    currentPage?: string;
  };
  success?: boolean;
  error?: string;
}

const AllVehiclesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const limit = 10; // Items per page

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearchClick = () => {
    const nextSearch = inputValue.trim();
    if (nextSearch === searchTerm.trim()) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchVehicles(1, nextSearch);
      }
      return;
    }
    setSearchTerm(nextSearch);
    setCurrentPage(1);
  };

  // Fetch vehicles from the API
  const fetchVehicles = async (page: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No token found. Please log in.");
        setVehicles([]);
        return;
      }
      const response = await vehicleService.getVehicles(token, page, limit, search);
      if (response.data) {
        const fetchedVehicles =
          (response.data.data && response.data.data.vehicles) ||
          response.data.vehicles ||
          [];
        if (response.success && fetchedVehicles) {
          setVehicles(fetchedVehicles);
          const totalPages =
            (response.data.data?.totalPages) ||
            response.data.totalPages ||
            0;
          const currentPage =
            parseInt(
              (response.data.data?.currentPage) ||
              response.data.currentPage ||
              "1"
            ) || 1;
          setTotalPages(totalPages);
          setCurrentPage(currentPage);
        } else {
          setError(response.error || "Failed to fetch vehicles.");
          setVehicles([]);
        }
      } else {
        setError("Invalid response structure.");
        setVehicles([]);
      }
    } catch (err) {
      setError("An error occurred while fetching vehicles.");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(currentPage, searchTerm.trim());
  }, [currentPage, searchTerm]);

  const handleVehicleCreated = () => {
    fetchVehicles(currentPage, searchTerm.trim());
  };

  const handleVehicleDeleted = (vehicleId: number) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    // Optionally, refetch to ensure consistency with backend
    // fetchVehicles(currentPage);
  };

  const handleRefresh = () => {
    setInputValue("");
    setSearchTerm("");
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchVehicles(1, "");
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="p-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Vehicles</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>All Vehicles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Title */}
      <h1 className="text-2xl font-bold pt-4">All Vehicles</h1>

      {/* Search and Action Buttons */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Search and Add Vehicle */}
          <div className="flex items-center space-x-2 w-full">
            <div className="relative w-1/4">
              <input
                id="search-title"
                type="text"
                placeholder="Search"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={18}
              />
              </div>
              <Button
                onClick={handleSearchClick}
                className="bg-blue-500 text-white py-2 px-4 rounded"
              >
                Search
              </Button>
              <AddVehicleDrawer onVehicleCreated={handleVehicleCreated} />
            </div>

            {/* Right: Refresh Button */}
            <Button
              onClick={handleRefresh}
              className="flex items-center bg-blue-500 text-white py-2 px-4 rounded"
            >
              <FiRefreshCcw className="mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Vehicle Table */}
        <AllVehicleTable
          vehicles={vehicles}
          loading={loading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onVehicleUpdated={(updatedVehicle) =>
            setVehicles((prev) =>
              prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
            )
          }
          onVehicleDeleted={handleVehicleDeleted} // Pass the new callback
        />
      </div>
    );
  };

export default AllVehiclesPage;
