"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CustomerListTable } from "@/components/CustomerListTables";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CustomerDrawer } from "@/components/customerCreation";
import CustomerService from "@/utils/customerService";
import { FiRefreshCcw } from "react-icons/fi";
import { parseStoredRoles } from "@/utils/roleAccess";

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(parseStoredRoles(localStorage.getItem("roles")));
  }, []);

  const isOperator = roles.some(role => role.includes("operator"));

  const rowsPerPage = 11;

  const fetchCustomers = useCallback(
    async (query: string, pageNumber: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await CustomerService.fetchIndividualCustomers({
          query,
          page: pageNumber,
          limit: rowsPerPage,
        });

        if (response.success) {
          setCustomers(response.data || []);
          setTotalPages(response.totalPages || 1);
        } else {
          console.error("Error fetching customers:", response.error);
          setCustomers([]);
          setTotalPages(1);
          setError(response.error || "Failed to fetch customers");
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        setCustomers([]);
        setError("An error occurred while fetching customers");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCustomers(searchTerm.trim(), currentPage);
  }, [searchTerm, currentPage, fetchCustomers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setIsSearchActive(!!searchTerm.trim());
    setCurrentPage(1);
  };

  const handleCustomerCreated = () => {
    fetchCustomers(searchTerm.trim(), currentPage);
  };

  const handleRefresh = () => {
    setSearchTerm(""); // Reset search term to clear the filter
    setIsSearchActive(false); // Reset search active state
    setCurrentPage(1); // Reset to first page
    fetchCustomers("", 1); // Fetch unfiltered customers
  };

  const handleCustomerUpdated = (updatedCustomer: any) => {
    if (updatedCustomer.is_active === false) {
      // For deletions (soft delete), refetch to ensure list is accurate
      fetchCustomers(searchTerm.trim(), currentPage);
    } else {
      // For updates, modify the list locally
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.id === updatedCustomer.id ? updatedCustomer : customer
        )
      );
    }
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
            <BreadcrumbPage>Customers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold pt-4">Customers</h1>
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

          <div className="flex items-center space-x-4 relative">
            <div className="relative w-1/4">
              <input
                id="search-title"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <Button
              onClick={handleSearch}
              variant="outline"
              className="bg-blue-500 text-white py-2 px-4 rounded"
            >
              Search
            </Button>

            {!isOperator && <CustomerDrawer onCustomerCreated={handleCustomerCreated} />}
          </div>
        </div>
      </div>

      <CustomerListTable
        customers={customers}
        loading={loading}
        error={error}
        isSearchActive={isSearchActive}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onCustomerUpdated={handleCustomerUpdated}
        isOperator={isOperator}
      />
    </div>
  );
};

export default CustomersPage;