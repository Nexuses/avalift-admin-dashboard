"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronsUpDown, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/utils/authService";
import { toast } from "sonner";
import UserService from "@/utils/userService";

interface User {
  name: string;
  email: string;
  avatar: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = await UserService.fetchUserProfile();
        if (userData && userData.data) {
          const { first_name, last_name, email_id, images } = userData.data;
          setUser({
            name: `${first_name} ${last_name}`,
            email: email_id,
            avatar: images || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      UserService.clearUserProfile();
      navigate("/");
    } catch (err) {
      toast.error("An unexpected error occurred during logout.");
      navigate("/");
    }
  };

  const handleNotification = () => {
    navigate("/admin/dashboard/notifications");
  };

  const handleProfile = () => {
    navigate("/admin/dashboard/account");
  };

  const displayName = loading ? "Loading..." : user?.name || "Unknown User";
  const displayEmail = loading ? "Loading..." : user?.email || "No email available";
  const avatarSrc = user?.avatar;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="rounded-lg">{displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleNotification}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
               Profile
            
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}