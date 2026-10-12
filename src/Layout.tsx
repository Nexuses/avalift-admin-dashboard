import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './components/app-sidebar';
import { SidebarProvider} from './components/ui/sidebar'; // Assuming SidebarTrigger is used for toggling

const Layout: React.FC = () => {
  return (
    <div className="flex">
      {/* Sidebar Provider - Responsible for managing sidebar state */}
      <SidebarProvider className='w-fit'>
        {/* AppSidebar - Custom sidebar component */}
        <AppSidebar />
      </SidebarProvider>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Outlet renders the main content dynamically */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
