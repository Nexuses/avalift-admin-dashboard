import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    // logo: string;
    plan: string;
  }[];
}) {
  const [activeTeam] = React.useState(teams[0]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <SidebarTrigger />
          {/* <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <img
              src={activeTeam.logo}
              alt={`${activeTeam.name} Logo`}
              className="size-6"
            />
          </div> */}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{activeTeam.name}</span> 
            <span className="truncate text-xs">{activeTeam.plan}</span>
          </div>
          
        </SidebarMenuButton>
       
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
