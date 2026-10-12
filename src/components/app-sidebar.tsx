import * as React from "react";
import {
  CarFront,
  CarTaxiFront,
  Contact2,
  Home,
  UserRound,
  Wallet2Icon,
  Ticket,
  Wallet,
  Building,
  Scroll,
  TrendingUp,
  Bell,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Sample data
const data = {
  user: {
    name: "Avalift",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Avalift",
      plan: "Dashboard",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "Available Chauffeurs",
      url: "/admin/dashboard/AvailableDriversPage",
      icon: CarTaxiFront,
      permission: ["chauffeur.management", "chauffeur.available.view"],
    },
    {
      title: "Organization",
      url: "organization",
      icon: Building,
      permission: ["organization.management"]
    },
    {
      title: "Users & Customers",
      url: "#",
      icon: Contact2,
      permission: ["customer.management"],
      items: [
        { title: "Users", url: "users" },
        { title: "Customers", url: "/admin/dashboard/customers" },
        { title: "Chauffeur", url: "/admin/dashboard/drivers" },
        { title: "PD", url: "/admin/dashboard/pd" },
        {
          title: "Organization Customer",
          url: "/admin/dashboard/OrganizationCustomer",
        },
      ],
    },
    {
      title: "Manage Pricing",
      url: "/admin/dashboard/ManagePricing",
      icon: Wallet,
      permission: ["price.management", "reports.generate"],
      items: [
        { title: "Avalift", url: "/admin/dashboard/ManagePricing" },
        {
          title: "Other Organization",
          url: "/admin/dashboard/OtherOrganzationPricing",
        },
      ],
    },
    {
      title: "Rides",
      url: "/admin/dashboard/rides",
      icon: CarTaxiFront,
      permission: ["ride.management", "ride.create"],
      items: [
        { title: "Add Ride", url: "/admin/dashboard/AddRidesPage" },
        { title: "All Rides", url: "/admin/dashboard/AllRides" },
      ],
    },
    {
      title: "PD Activities",
      url: "",
      icon: UserRound,
      permission: ["pd.management"],
      items: [
        {
          title: "All PD Pickup & Drop",
          url: "/admin/dashboard/PdPickupDrop",
        },
        {
          title: "PD Status",
          url: "/admin/dashboard/PdStatus",
        },
        {
          title: "Chauffeur-PD Rides",
          url: "/admin/dashboard/Chaffeur-PD-Ride",
        },
      ],
    },
    {
      title: "Coupons",
      url: "Coupons",
      icon: Ticket,
      permission: ["coupon.management", "coupons.create"],
      items: [
        { title: "Coupon", url: "/admin/dashboard/coupons" },
        { title: "User Group", url: "/admin/dashboard/coupons/usergroup" },
        { title: "Coupon Details", url: "/admin/dashboard/coupons/details" },
      ],
    },
    {
      title: "Revenue Report",
      url: "RevenueReport",
      icon: TrendingUp,
      permission: ["cash.management", "reports.view"]
    },
    // {
    //   title: "Banks",
    //   url: "Banks",
    //   icon: Building,
    //   permission: "organization.management",
    // },
    {
      title: "Vehicles",
      url: "/admin/dashboard/vehicles",
      icon: CarFront,
      permission: ["vehicle.management", "vehicles.view"],
      items: [
        { title: "All Vehicles", url: "/admin/dashboard/AllVehicle" },
        { title: "Brand", url: "/admin/dashboard/AllBrands" },
      ],
    },
    {
      title: "Wallet",
      url: "/admin/dashboard/wallet",
      icon: Wallet2Icon,
      permission: ["wallet.management", "reports.view"],
      items: [
        { title: "Customer Wallet", url: "/admin/dashboard/wallet" },
        { title: "Chauffeur Wallet", url: "/admin/dashboard/ChauffeurWallet" },
        { title: "PD Wallet", url: "/admin/dashboard/PdWallet" },
        { title: "Admin Wallet", url: "/admin/dashboard/AdminWallet" },
      ],
    },
    {
      title: "Tip Wallet",
      url: "/admin/dashboard/TipWallet",
      icon: Wallet2Icon,
      permission: ["wallet.management", "reports.view"],
    },
    {
      title: "Invoice",
      url: "/admin/dashboard/InvoicePage",
      icon: Scroll,
      permission: ["revenuereport.management", "invoice.view"],
      items: [
        { title: "Invoice", url: "/admin/dashboard/InvoicePage" },
        { title: "Invoice Report", url: "/admin/dashboard/InvoiceReport" },
      ],
    },

    {
      title: "Send Notification",
      url: "/admin/dashboard/Notifications/send",
      icon: Bell,
      permission: ["users.create"]
    },

  ],
};

const parsePermissions = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") {
      return parsed
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
};

const parseRoles = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((r: any) =>
        typeof r === "string" ? r.toLowerCase() : (r?.name?.toLowerCase() || "")
      );
    }
    if (typeof parsed === "string") {
      return parsed.split(",").map(r => r.trim().toLowerCase());
    }
    return [];
  } catch {
    return [];
  }
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [allowedOrg, setAllowedOrg] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("allowedOrganization");
  });
  const [permissions, setPermissions] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return parsePermissions(localStorage.getItem("permissions"));
  });
  const [roles, setRoles] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return parseRoles(localStorage.getItem("roles"));
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const readFromStorage = () => {
      setAllowedOrg(localStorage.getItem("allowedOrganization"));
      setPermissions(parsePermissions(localStorage.getItem("permissions")));
      setRoles(parseRoles(localStorage.getItem("roles")));
    };

    readFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;
      if (event.key === "permissions" || event.key === "allowedOrganization" || event.key === "roles") {
        readFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("permissions-updated", readFromStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("permissions-updated", readFromStorage);
    };
  }, []);

  // Determine if we are in the allowed scenario ("1" or "*")
  const isAllowedOrg = allowedOrg === "1" || allowedOrg === "*";

  // Adjust Revenue Report title based on allowed organization
  const modifiedNavMain = React.useMemo(() => {
    return data.navMain.map((item) => {
      if (item.title === "Revenue Report") {
        return { ...item, title: isAllowedOrg ? "Revenue Report" : "Ride Report" };
      }
      return item;
    });
  }, [isAllowedOrg]);

  // Filter navMain items based on permissions
  const filteredNavMain = React.useMemo(() => {
    const isOperator = roles.some(role => role.includes("operator"));

    return modifiedNavMain
      .filter((item) => {
        if (item.title === "Users & Customers" && isOperator) {
          return true; // allow operator
        }
        // If the item has a permission requirement, check if user has it
        if (item.permission) {
          if (Array.isArray(item.permission)) {
            // ✅ Allow if the user has at least one of the required permissions
            return item.permission.some((p) => permissions.includes(p));
          }
          // Single permission string
          return permissions.includes(item.permission);
        }
        // If no permission is specified, include the item by default
        return true;
      });
  }, [modifiedNavMain, permissions, roles]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
