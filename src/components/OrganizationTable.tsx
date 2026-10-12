"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpdateOrganizationDrawer } from "./updateOrganization";
import { Edit } from "lucide-react";
import { Spin } from "antd";
import organizationService from "@/utils/organizationSevice";
import { LinkPreview } from "./ui/link-preview"; // Import LinkPreview

interface Organization {
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string;
  email_id: string;
  is_active?: boolean;
  organization_logo?: string;
}

interface OrganizationDataTableProps {
  organization: Organization[];
  loading: boolean;
  error: string | null;
  onOrganizationUpdated: (updatedOrganization: Organization) => void;
}

export function AllOrganizationTable({
  organization,
  loading,
  error,
  onOrganizationUpdated,
}: OrganizationDataTableProps) {
  const [localOrganizations, setLocalOrganizations] = useState<Organization[]>(
    Array.isArray(organization) ? organization : []
  );

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const [toggleLoading, setToggleLoading] = useState<{ [key: number]: boolean }>(
    {}
  );

  useEffect(() => {
    setLocalOrganizations(Array.isArray(organization) ? organization : []);
  }, [organization]);

  const handleEditClick = (org: Organization) => {
    if (selectedOrganization?.id === org.id) {
      setSelectedOrganization(null);
      setTimeout(() => {
        setSelectedOrganization(org);
      }, 50);
    } else {
      setSelectedOrganization(org);
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    const orgId = org.id;
    setToggleLoading((prev) => ({ ...prev, [orgId]: true }));
    try {
      const newStatus = !(org.is_active ?? false);
      const response = await organizationService.toggleOrganizationStatus(
        orgId,
        newStatus
      );

      if (response.success) {
        const updatedOrg: Organization = {
          ...org,
          is_active: response.data?.is_active ?? newStatus,
        };

        setLocalOrganizations((prev) =>
          prev.map((o) => (o.id === orgId ? updatedOrg : o))
        );

        onOrganizationUpdated(updatedOrg);
      } else {
        console.error("Failed to toggle status:", response.error);
      }
    } catch (error) {
      console.error("Error toggling organization status:", error);
    } finally {
      setToggleLoading((prev) => ({ ...prev, [orgId]: false }));
    }
  };

  const truncateAddress = (address: string, maxLength = 30) => {
    return address.length > maxLength
      ? `${address.slice(0, maxLength)}...`
      : address;
  };

  return (
    <div className="w-full p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">ID</TableCell>
            <TableCell className="font-semibold">Name</TableCell>
            <TableCell className="font-semibold">Address</TableCell>
            <TableCell className="font-semibold">Phone</TableCell>
            <TableCell className="font-semibold">Email ID</TableCell>
            <TableCell className="font-semibold">Logo</TableCell>
            <TableCell className="font-semibold">Status</TableCell>
            <TableCell className="font-semibold">Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                <Spin />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-red-500 py-4">
                {error}
              </TableCell>
            </TableRow>
          ) : localOrganizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                N/A
              </TableCell>
            </TableRow>
          ) : (
            localOrganizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>{org.id || "N/A"}</TableCell>
                <TableCell>{org.name || "N/A"}</TableCell>
                <TableCell>
                  {org.address ? truncateAddress(org.address) : "N/A"}
                </TableCell>
                <TableCell>
                  {org.country_code && org.mobile_number
                    ? `${org.country_code} ${org.mobile_number}`
                    : "N/A"}
                </TableCell>
                <TableCell>{org.email_id || "N/A"}</TableCell>
                <TableCell>
                  {org.organization_logo ? (
                    <LinkPreview
                      url={org.organization_logo}
                      imageSrc={org.organization_logo}
                      width={300}
                      height={300}
                      isStatic={true}
                      className="rounded-full"
                    >
                      <img
                        src={org.organization_logo}
                        alt={`${org.name} Logo`}
                        className="h-8 w-8 object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.png";
                          e.currentTarget.alt = "Image not available";
                        }}
                      />
                    </LinkPreview>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      org.is_active
                        ? "text-green-500 font-semibold"
                        : "text-red-500 font-semibold"
                    }
                  >
                    {org.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(org)}
                    className="text-blue-500 hover:text-blue-700"
                    disabled={toggleLoading[org.id]}
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(org)}
                    className={`px-2 py-1 rounded text-white ${
                      org.is_active
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                    disabled={toggleLoading[org.id]}
                  >
                    {toggleLoading[org.id]
                      ? "Loading..."
                      : org.is_active
                      ? "Disable"
                      : "Activate"}
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedOrganization && (
        <UpdateOrganizationDrawer
          organization={selectedOrganization}
          onClose={() => setSelectedOrganization(null)}
          onOrganizationUpdated={(updatedOrg) => {
            setLocalOrganizations((prev) =>
              prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org))
            );
            onOrganizationUpdated(updatedOrg);
            setSelectedOrganization(null);
          }}
        />
      )}
    </div>
  );
}