"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BASE_URL from "@/config/apiConfig";
import { Empty, Spin } from "antd";
import { Button } from "@/components/ui/button";
import { Organization } from "@/types/organization";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApiResponse {
  success: boolean;
  data: Organization[];
}

interface CorporateUserTableProps {
  refresh: number;
  onEdit: (org: Organization) => void;
  searchQuery: string;
  selectedOrgFilter: string;
  isOperator?: boolean;
}

const formatOrganizationName = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1);

export function CorporateUserTable({
  refresh,
  onEdit,
  searchQuery,
  selectedOrgFilter,
  isOperator = false,
}: CorporateUserTableProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No token provided. Authorization denied.");
        }
        const allowedOrganization = localStorage.getItem("allowedOrganization") || "";
        const response = await fetch(`${BASE_URL}/api/organization/all-users-organizations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orgnanisation_id: allowedOrganization,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch organizations.");
        }

        const data: ApiResponse = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setOrganizations(data.data);
          const orgNames = [...new Set(data.data.map((org) => org.organization_name))];
          setAllOrganizations(orgNames);
        } else {
          throw new Error("Invalid data format.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching organizations.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [refresh]);

  const filteredOrganizations = useMemo(() => {
    let filtered = organizations;

    if (selectedOrgFilter && selectedOrgFilter !== "all") {
      filtered = filtered.filter(
        (org) => org.organization_name.toLowerCase() === selectedOrgFilter.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          `${org.first_name} ${org.last_name}`.toLowerCase().includes(query) ||
          org.id.toString().includes(query) ||
          org.organization_name.toLowerCase().includes(query) ||
          org.email_id.toLowerCase().includes(query) ||
          `${org.country_code}${org.mobile_number}`.includes(query)
      );
    }

    return filtered;
  }, [organizations, searchQuery, selectedOrgFilter]);

  if (loading) {
    return (
      <p className="text-center justify-center">
        <Spin />
      </p>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <Select
          value={selectedOrgFilter}
          onValueChange={(value) => {
            window.dispatchEvent(new CustomEvent("orgFilterChange", { detail: value }));
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {allOrganizations.map((orgName) => (
              <SelectItem key={orgName} value={orgName}>
                {formatOrganizationName(orgName)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredOrganizations.length === 0 ? (
        <p className="text-center">
          <Empty description="No data available" />
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-semibold">ID</TableCell>
              <TableCell className="font-semibold">User Name</TableCell>
              <TableCell className="font-semibold">Organization Name</TableCell>
              <TableCell className="font-semibold">Email</TableCell>
              <TableCell className="font-semibold">Contact Number</TableCell>
              {!isOperator && <TableCell className="font-semibold">Action</TableCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.map((org) => {
              const userName = `${org.first_name} ${org.last_name}`;
              return (
                <TableRow key={org.id}>
                  <TableCell>{org.id}</TableCell>
                  <TableCell>{userName}</TableCell>
                  <TableCell>{formatOrganizationName(org.organization_name)}</TableCell>
                  <TableCell>{org.email_id}</TableCell>
                  <TableCell>
                    {org.country_code} {org.mobile_number}
                  </TableCell>
                  {!isOperator && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(org)}
                        className="text-blue-500 border-blue-500 hover:bg-blue-50"
                      >
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}