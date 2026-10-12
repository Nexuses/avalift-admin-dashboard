"use client";

import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FiRefreshCcw } from "react-icons/fi";

import AdminUserService from "@/utils/AdminUsersService";
import { ApiResponse } from "@/utils/apiFetcher";
import { AdminUserDrawer } from "@/components/AdminUsersCreation";
import { AdminUserListTable } from "@/components/AdminUsersTable";
import { toast } from "sonner";
import { parseStoredRoles } from "@/utils/roleAccess";

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email_id: string | null;
  country_code: string;
  mobile_number: string;
  role_id: number;
  display_name:string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminUsersPage: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const token = localStorage.getItem("authToken") || "";

  useEffect(() => {
    setRoles(parseStoredRoles(localStorage.getItem("roles")));
  }, []);

  const isOperator = roles.some(role => role.includes("operator"));

  // Fetch admin users (token only)
  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const response: ApiResponse<AdminUser[]> = await AdminUserService.getAllAdminUsers(token);
      if (response.success && response.data) {
        setAdminUsers(response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to fetch admin users.");
        toast.error(response.error || "Failed to fetch admin users.");
      }
    } catch (err: any) {
      setError(err.message || "Error occurred while fetching admin users.");
      toast.error(err.message || "Error occurred while fetching admin users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, [token]);

  // Refresh handler
  const handleRefresh = () => {
    fetchAdminUsers();
  };

  // Callback when a new admin user is created
  const handleAdminUserCreated = () => {
    fetchAdminUsers();
  };

  // Callback when an admin user is updated
  const handleUserUpdated = (updatedUser: AdminUser) => {
    setAdminUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  // Callback when an admin user is deleted
  const handleUserDeleted = (deletedUserId: number) => {
    setAdminUsers((prevUsers) => prevUsers.filter((user) => user.id !== deletedUserId));
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
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      
        <h1 className="text-2xl font-bold pt-4">Users</h1>
        <div className="space-y-4 mt-8">


      {/* Both buttons are placed in a single row */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        {!isOperator && <AdminUserDrawer onAdminUserCreated={handleAdminUserCreated} />}
        <Button onClick={handleRefresh}  className="bg-blue-500 text-white py-2 px-4 rounded">
          <FiRefreshCcw className="mr-2" /> Refresh
        </Button>
      
      </div>

      <AdminUserListTable
        adminUsers={adminUsers}
        loading={loading}
        error={error}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
        isOperator={isOperator}
      />
    </div>
    </div>
  );
};

export default AdminUsersPage;
