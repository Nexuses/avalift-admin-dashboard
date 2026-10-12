// ChangePasswordPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import BASE_URL from "@/config/apiConfig";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const togglePasswordVisibility = (field: "old" | "new" | "confirm") => {
    if (field === "old") setShowOldPassword((prev) => !prev);
    if (field === "new") setShowNewPassword((prev) => !prev);
    if (field === "confirm") setShowConfirmNewPassword((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      window.location.reload(); // Refresh the page, or navigate elsewhere
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(
        error.message || "Failed to change password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/admin/dashboard">Account</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Change Password</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-6">
        <Card className="max-w-md mx-auto shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="oldPassword">Old Password</Label>
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10"
                  placeholder="Enter old password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-8 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility("old")}
                  disabled={isSubmitting}
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <div className="grid gap-2 relative">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10"
                  placeholder="Enter new password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-8 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={isSubmitting}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <div className="grid gap-2 relative">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10"
                  placeholder="Confirm new password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-8 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={isSubmitting}
                >
                  {showConfirmNewPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePasswordPage;