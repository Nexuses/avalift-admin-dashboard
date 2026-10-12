"use client";

import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ShowBrandModelTable from "@/components/BrandModelTable";

import { ApiResponse } from "@/utils/apiFetcher";
import ModelService from "@/utils/modelService";
import vehicleLogotypesData from "@/assets/vehicle-logotypes.json";

// Define TypeScript interfaces for local logotype data
type VehicleLogotypesData = {
  [key: string]: {
    name: string;
    code: string | null;
    logotype: {
      uri: string;
      width: number;
      height: number;
      mime: string;
      transparent: boolean;
      size: number;
    };
    alternatives: {
      uri: string;
      width: number;
      height: number;
      mime: string;
      transparent: boolean;
      size: number;
    }[];
  };
};

const vehicleLogotypesDataTyped: VehicleLogotypesData = vehicleLogotypesData;

// Define a brand type. The models property is optional.
type Brand = {
  id: number;
  name: string;
  logo: string;
  models?: string[];
};

const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands (with models) using the ModelService API
  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse = await ModelService.fetchAllBrandsModels();

      if (response.success && response.data && response.data.data) {
        const dataObject = response.data.data;
        const brandList: Brand[] = Object.entries(dataObject)
          .filter(([brandName]) => brandName.toLowerCase() !== "others")
          .map(([brandName, details], index) => {
            const brandKey = brandName.trim().toLowerCase();
            let logo = (details as any).brandImage || null;
            if (!logo) {
              const brandData = vehicleLogotypesDataTyped[brandKey];
              logo = brandData?.logotype.uri || "assets/defaultcar.png";
            }
            return {
              id: index, // Note: Consider using API-provided ID
              name: brandName,
              logo,
              models: (details as any).models,
            };
          });
        setBrands(brandList);
      } else {
        setError("Failed to fetch brands or invalid data format.");
      }
    } catch (err: any) {
      console.error("Error fetching brands:", err);
      setError("An error occurred while fetching brands.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Callback for brand/model creation, updates, or deletion to refresh brands
  const handleBrandOrModelChanged = () => {
    fetchBrands();
  };

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Vehicles</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Brands</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold">All Brands</h1>

    
      <div className="mt-6">
        {/* Pass the brands, loading, error, and callbacks to the table */}
        <ShowBrandModelTable
          brands={brands}
          loading={loading}
          error={error}
          onBrandCreated={handleBrandOrModelChanged}
          onBrandUpdated={handleBrandOrModelChanged}
          onBrandDeleted={handleBrandOrModelChanged}
        />
      </div>
    </div>
  );
};

export default BrandPage;