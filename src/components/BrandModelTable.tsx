"use client";

import React, { useEffect, useState } from "react";
import { Spin, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import brandService from "@/utils/brandService";
import { BrandDrawer } from "./BrandDrawer"; // Adjust the import path as needed
import { ModelDrawer } from "@/components/modelCreation";
import { ApiResponse } from "@/utils/apiFetcher";
import ModelService from "@/utils/modelService";
import vehicleLogotypesData from "@/assets/vehicle-logotypes.json";

interface Brand {
  id: number;
  name: string;
  logo: string;
  models?: string[];
}

interface ShowBrandModelTableProps {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  onBrandCreated?: () => void;
  onBrandUpdated?: () => void;
  onBrandDeleted?: () => void; // New callback for deletion
}

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

const ShowBrandModelTable: React.FC<ShowBrandModelTableProps> = ({
  brands,
  loading,
  error,
  onBrandCreated,
  onBrandUpdated,
  onBrandDeleted,
}) => {
  const [visibleModels, setVisibleModels] = useState<{ [key: number]: boolean }>({});
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingBrandId, setDeletingBrandId] = useState<number | null>(null);

  const [, setBrands] = useState<Brand[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Get allowedOrganization from localStorage
  const allowedOrganization = localStorage.getItem("allowedOrganization") || "";
  const canEditOrDelete = allowedOrganization === "1" || allowedOrganization === "*";

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

  const token = localStorage.getItem("authToken") || "";

  const toggleModels = (id: number) => {
    setVisibleModels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateDrawer = () => {
    setEditingBrand(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (brand: Brand) => {
    setEditingBrand(brand);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setEditingBrand(null);
    setIsDrawerOpen(false);
  };

  const handleDeleteBrand = async (brand: Brand) => {
    setDeletingBrandId(brand.id);
    try {
      const response = await brandService.deleteBrand(token, brand.name);
      if (response.success) {
        toast.success(response.data?.message || "Brand deleted successfully!");
        if (onBrandDeleted) onBrandDeleted();
      } else {
        toast.error(response.error || "Failed to delete brand.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting the brand.");
    } finally {
      setDeletingBrandId(null);
    }
  };

  // Always show the create buttons, even if there are no brands
  return (
    <div>
      <div className="mb-4">
        <div className="flex flex-row items-center gap-2 mb-4">
          <Button
            className="bg-blue-500 rounded"
            onClick={openCreateDrawer}
            disabled={isDrawerOpen}
          >
            Create Brand
          </Button>
          <BrandDrawer
            onBrandCreated={() => {
              closeDrawer();
              if (onBrandCreated) onBrandCreated();
            }}
            onBrandUpdated={() => {
              closeDrawer();
              if (onBrandUpdated) onBrandUpdated();
            }}
            editingBrand={editingBrand || undefined}
            isOpen={isDrawerOpen}
            setIsOpen={setIsDrawerOpen}
          />
          <ModelDrawer onModelCreated={handleBrandOrModelChanged} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4"><Spin /></div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-4">No Brands Found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="border p-4 rounded shadow-md flex flex-col gap-4 cursor-pointer hover:shadow-lg relative"
              onClick={() => toggleModels(brand.id)}
            >
              {/* Conditionally render Edit and Delete icons */}
              {canEditOrDelete && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <EditOutlined
                    className="text-blue-500 hover:text-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDrawer(brand);
                    }}
                  />
                  <Popconfirm
                    title="Are you sure you want to delete this brand?"
                    description="This will also delete all associated models."
                    onConfirm={() => handleDeleteBrand(brand)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <DeleteOutlined
                      className="text-red-500 hover:text-red-600"
                      style={{ opacity: deletingBrandId === brand.id ? 0.5 : 1 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              )}

              <div className="flex items-center gap-4">
                <img
                  src={brand.logo}
                  alt={`${brand.name} Logo`}
                  width={40}
                  height={40}
                  className="rounded"
                />
                <span className="font-semibold">{brand.name}</span>
              </div>

              {visibleModels[brand.id] && (
                <div className="mt-2">
                  {brand.models && brand.models.length > 0 ? (
                    <ul>
                      {brand.models.map((model, idx) => (
                        <li key={idx} className="text-sm py-1">
                          {model}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm py-1">No Models Found</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowBrandModelTable;