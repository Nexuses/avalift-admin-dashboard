"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import modelService from "../utils/modelService"; // API Service for models
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import vehicleLogotypesData from "@/assets/vehicle-logotypes.json";
import { ApiResponse } from "@/utils/apiFetcher";
import brandService from "@/utils/brandService";
import { Spin } from "antd";
import defaultCar from "@/assets/defaultcar.png";

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

type Brand = {
  name: string;
  logo: string;
};

type ModelFormInputs = {
  brand: string;
  model_name: string;
};

interface ModelDrawerProps {
  onModelCreated?: () => void;
}

export function ModelDrawer({ onModelCreated }: ModelDrawerProps) {
  const form = useForm<ModelFormInputs>({
    defaultValues: {
      brand: "",
      model_name: "",
    },
  });

  const { control, handleSubmit, reset } = form;
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const token = React.useMemo(
    () => localStorage.getItem("authToken") || "",
    []
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(true);

  // Fetch brands from the API
  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      const response: ApiResponse = await brandService.fetchBrands();
      if (response.success && response.data?.data) {
        const brandList = response.data.data
          .filter((brand: { brand: string }) => brand.brand.toLowerCase() !== "others")
          .map((brand: { brand: string; brandImage: string | null }) => {
            const normalized = brand.brand.trim().toLowerCase().replace(/\s+/g, "-");
            let logo = defaultCar;

            if (brand.brandImage) {
              if (
                brand.brandImage.includes("defaultcar.png") ||
                brand.brandImage.startsWith("/src/assets/") ||
                brand.brandImage.startsWith("/assets/")
              ) {
                logo = defaultCar;
              } else {
                logo = brand.brandImage;
              }
            } else if (vehicleLogotypesDataTyped[normalized]?.logotype.uri) {
              logo = vehicleLogotypesDataTyped[normalized].logotype.uri;
            }

            return { name: brand.brand, logo };
          });
        setBrands(brandList);
      } else {
        throw new Error("Failed to fetch brands.");
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Fetch brands on mount.
  useEffect(() => {
    fetchBrands();
  }, []);

  // Re-fetch brands when the drawer opens.
  useEffect(() => {
    if (isDrawerOpen) {
      fetchBrands();
    }
  }, [isDrawerOpen]);

  const onSubmit: SubmitHandler<ModelFormInputs> = async (data) => {
    setLoading(true);
    try {
      // Get the brand's logo from the brands list
      const selectedBrand = brands.find(b => b.name === data.brand);
      let brandImage = selectedBrand?.logo || defaultCar;
  //  if (!brandImage) {
      //   throw new Error("Brand image is required for model creation.");
      // }
      // Convert relative paths to full URLs
      if (brandImage && !brandImage.startsWith("http")) {
        const origin = window.location.origin;
        brandImage = `${origin}${brandImage.startsWith("/") ? "" : "/"}${brandImage}`;
      }

      const response = await modelService.addModel(
        data.brand,
        data.model_name,
        brandImage,
        token
      );
      console.log("API Response:", response);
      if (response.success) {
        toast.success("Model added successfully!");
        reset();
        setIsDrawerOpen(false);
        if (onModelCreated) onModelCreated();
      } else {
        toast.error(response.error || "Failed to add model.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while adding the model.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className="bg-blue-500 rounded">Create Model</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Add a Vehicle Model</DrawerTitle>
              <DrawerDescription>
                Enter the brand and model name below.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 gap-4"
                noValidate
              >
                {/* Brand Field */}
                <FormField
                  control={control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-sm w-[345px]">
                            <SelectValue placeholder={loadingBrands ? "Loading..." : "Select Brand"}>
                              {field.value && brands.find(b => b.name === field.value) && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={brands.find(b => b.name === field.value)?.logo}
                                    alt={field.value}
                                    className="w-4 h-4 object-contain rounded"
                                  />
                                  <span>{field.value}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {loadingBrands ? (
                              <SelectItem value="loading" disabled>
                                <Spin/>
                              </SelectItem>
                            ) : brands.length > 0 ? (
                              brands.map((brand) => (
                                <SelectItem key={brand.name} value={brand.name}>
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={brand.logo}
                                      alt={brand.name}
                                      className="w-6 h-6 object-contain rounded-md"
                                    />
                                    <span>{brand.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-brands" disabled>
                                No brands available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                {/* Model Name Field */}
                <FormField
                  control={control}
                  name="model_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name</FormLabel>
                      <FormControl>
                        <Input {...field} required placeholder="Enter model name" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {/* Submit Button */}
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DrawerContent>
        <DrawerClose />
      </Drawer>
    </Form>
  );
}
