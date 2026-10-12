"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import AdminUserService from "@/utils/AdminUsersService";

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
}

interface DeleteAdminUserDrawerProps {
  adminUser: AdminUser;
  onClose: () => void;
  onUserDeleted: (deletedUserId: number) => void;
}

export function DeleteAdminUserDrawer({
  adminUser,
  onClose,
  onUserDeleted,
}: DeleteAdminUserDrawerProps) {
  const [loading, setLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (adminUser) {
      setIsDrawerOpen(true);
    }
  }, [adminUser]);

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  const handleCancel = () => {
    setIsDrawerOpen(false);
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await AdminUserService.deleteAdminUser(token, adminUser.id);
      if (response.success) {
        toast.success(response.message || "Admin user deleted successfully!");
        onUserDeleted(adminUser.id);
        setIsDrawerOpen(false);
        onClose();
      } else {
        toast.error(response.error || "Failed to delete admin user.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the admin user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Delete Admin User</DrawerTitle>
            <DrawerDescription>
              Are you sure you want to delete admin user{" "}
              <strong>
                {adminUser.first_name} {adminUser.last_name}
              </strong>
              ?
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 flex justify-end gap-4">
            <Button variant="outline" onClick={handleCancel} disabled={loading} className="rounded">
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red-500 rounded text-white">
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DrawerContent>
      <DrawerClose />
    </Drawer>
  );
}
