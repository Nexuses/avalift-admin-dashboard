import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddVehicleDrawer } from "./vehicleCreation";
import { Search } from "lucide-react";

interface VehicleSearchProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

export default function VehicleSearch({ searchTerm, setSearchTerm }: VehicleSearchProps) {
  const [inputValue, setInputValue] = useState(searchTerm);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearchClick = () => {
    setSearchTerm(inputValue);
    console.log("Searching for:", inputValue);
    // Call an API or filter the data based on `inputValue` if needed
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="flex flex-col space-y-2">
        {/* Title Above Search Bar */}
        <label htmlFor="search-title" className="block text-sm font-medium text-gray-700">
          Search
        </label>

        {/* Search Bar */}
        <div className="flex items-center space-x-4 relative">
          <div className="relative w-1/4">
            <input
              id="search-title"
              type="text"
              placeholder="Search"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-10 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {/* Search Icon */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          </div>

          {/* Search Button */}
          <div>
            <Button onClick={handleSearchClick} className="bg-blue-500 text-white py-2 px-4 rounded">
              Search
            </Button>
          </div>

          <AddVehicleDrawer onVehicleCreated={function (): void {
            throw new Error("Function not implemented.");
          } } />
        </div>
      </div>
    </div>
  );
}
