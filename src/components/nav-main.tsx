"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useState } from "react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]  
  }[]
}) {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null)
  const navigate = useNavigate()  // useNavigate hook to navigate to pages

  // Handle item clicks
  const handleItemClick = (url: string, hasSubItems: boolean) => {
    setActiveItem(url)

    // If there are sub-items, toggle the collapsible, else navigate directly
    if (hasSubItems) {
      setOpenCollapsible((prev) => (prev === url ? null : url))
    } else {
      navigate(url) // Navigate directly if no sub-items
    }
  }

  const getItemClassName = (url: string) => {
    const baseClass = "text-black hover:bg-blue-400 rounded hover:text-white"
    const activeClass = url === activeItem ? "bg-blue-500 text-white" : ""
    return `${baseClass} ${activeClass}` // Combine both hover and active classes
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items ? (
              <Collapsible
                asChild
                open={openCollapsible === item.url} // Controlled open state based on the active collapsible
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    setOpenCollapsible(null) // Close collapsible when it's no longer open
                  } else {
                    setOpenCollapsible(item.url) // Open the clicked collapsible
                  }
                }}
                className="group/collapsible"
              >
                <div>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => handleItemClick(item.url, true)} // Handle click for items with sub-items
                      className={getItemClassName(item.url)} // Apply active class
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            onClick={() => handleItemClick(subItem.url, false)} // Handle click for sub-items
                            className={getItemClassName(subItem.url)} // Apply active class to sub-items
                          >
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : (
              // If there are no sub-items, just render the menu item without the arrow
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => handleItemClick(item.url, false)} // Handle click for items without sub-items
                className={getItemClassName(item.url)} // Apply active class
              >
                {item.icon && <item.icon />}
                <Link to={item.url}>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
