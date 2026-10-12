import React, { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const OperatorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  
    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    };
  
  return (
    <div className="p-4">
      <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#">
            User and Customer
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>Operators</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
   
     
      <h1 className="text-2xl font-bold pt-4">Operator</h1>
      <div className="space-y-4 mt-8">
        <div className="flex flex-col space-y-2">
          {/* Title Above Search Bar */}
          <label
            htmlFor="search-title"
            className="block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          {/* Search Bar */}
          <div className="flex items-center space-x-4 relative">
            <div className="relative w-1/4">
              <input
                id="search-title"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-gray-300 px-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {/* Search Icon */}
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={18}
              />
            </div>

            {/* Search Button */}
            <div>
              <Button
                // onClick={}
                variant="outline"
                className="bg-blue-500 text-white py-2 px-4 rounded"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorsPage;
