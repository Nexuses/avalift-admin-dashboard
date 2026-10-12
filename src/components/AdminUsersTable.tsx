"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Spin, Empty } from "antd";
import { Edit, Trash, X } from "lucide-react";
import { UpdateAdminUserDrawer } from "./UpdateAdmin";
import { DeleteAdminUserDrawer } from "./DeleteAdminUser";

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email_id: string | null;
  country_code: string;
  mobile_number: string;
  role_id: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  display_name: string;
}

interface AdminUserListTableProps {
  adminUsers: AdminUser[];
  loading: boolean;
  error: string | null;
  onUserUpdated: (updatedUser: AdminUser) => void;
  onUserDeleted: (deletedUserId: number) => void;
  isOperator?: boolean;
}

export function AdminUserListTable({
  adminUsers,
  loading,
  error,
  onUserUpdated,
  onUserDeleted,
  isOperator = false,
}: AdminUserListTableProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUpdateDrawerOpen(true);
  };

  const handleDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteDrawerOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Filter users based on search query
  const filteredUsers = adminUsers.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email_id?.toLowerCase() || "";
    const mobile = `${user.country_code}${user.mobile_number}`.toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      fullName.includes(query) ||
      email.includes(query) ||
      mobile.includes(query)
    );
  });

  return (
    <div className="w-full p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pr-10 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">ID</TableCell>
            <TableCell className="font-semibold">Name</TableCell>
            <TableCell className="font-semibold">Mobile</TableCell>
            <TableCell className="font-semibold">Email</TableCell>
            <TableCell className="font-semibold">Role</TableCell>
            {!isOperator && <TableCell className="font-semibold">Action</TableCell>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center">
                <div className="flex items-center justify-center">
                  <Spin />
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center text-destructive">
                {error}
              </TableCell>
            </TableRow>
          ) : filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center">
                <Empty description={searchQuery ? "No matching users found" : "No users available"} />
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => {
              const fullName = `${user.first_name} ${user.last_name}`;
              const truncatedName =
                fullName.length > 20 ? `${fullName.slice(0, 20)}...` : fullName;
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{truncatedName}</TableCell>
                  <TableCell>
                    {user.country_code} {user.mobile_number}
                  </TableCell>
                  <TableCell>
                    {user.email_id
                      ? user.email_id.length > 20
                        ? `${user.email_id.slice(0, 20)}...`
                        : user.email_id
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {user.role_id} - {user.display_name}
                  </TableCell>
                  {!isOperator && (
                    <TableCell className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash size={20} />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {isUpdateDrawerOpen && selectedUser && (
        <UpdateAdminUserDrawer
          adminUser={selectedUser}
          onClose={() => {
            setIsUpdateDrawerOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={(updatedUser) => {
            onUserUpdated(updatedUser);
            setIsUpdateDrawerOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {isDeleteDrawerOpen && selectedUser && (
        <DeleteAdminUserDrawer
          adminUser={selectedUser}
          onClose={() => {
            setIsDeleteDrawerOpen(false);
            setSelectedUser(null);
          }}
          onUserDeleted={(deletedUserId) => {
            onUserDeleted(deletedUserId);
            setIsDeleteDrawerOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}