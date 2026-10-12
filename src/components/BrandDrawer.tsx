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
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import brandService from "@/utils/brandService";
import vehicleLogotypesData from "@/assets/vehicle-logotypes.json";
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

interface BrandFormInputs {
  brand_name: string;
}

interface BrandDrawerProps {
  onBrandCreated?: () => void;
  onBrandUpdated?: () => void;
  editingBrand?: { id: number; name: string; logo: string };
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function BrandDrawer({
  onBrandCreated,
  onBrandUpdated,
  editingBrand,
  isOpen,
  setIsOpen,
}: BrandDrawerProps) {
  const form = useForm<BrandFormInputs>({
    defaultValues: {
      brand_name: editingBrand?.name || "",
    },
  });

  const { control, handleSubmit, reset, watch } = form;
  const [loading, setLoading] = React.useState(false);

  const token = React.useMemo(() => localStorage.getItem("authToken") || "", []);

  // Helper function to get the brand image from JSON data
  const getBrandImage = (brandName: string): string => {
    const normalized = brandName.trim().toLowerCase().replace(/\s+/g, "-");
    const brandData = vehicleLogotypesDataTyped[normalized];
    if (brandData) {
      return brandData.logotype.uri;
    }

    if (
      editingBrand &&
      brandName.trim().toLowerCase() === editingBrand.name.trim().toLowerCase()
    ) {
      return editingBrand.logo;
    }

    return defaultCar;
  };

  const onSubmit: SubmitHandler<BrandFormInputs> = async (data) => {
    setLoading(true);
    try {
      let brandImage = getBrandImage(data.brand_name);
      if (!brandImage) {
        throw new Error("Brand image is required.");
      }

      // Convert relative paths to full URLs
      if (brandImage && !brandImage.startsWith("http")) {
        const origin = window.location.origin;
        brandImage = `${origin}${brandImage.startsWith("/") ? "" : "/"}${brandImage}`;
      }

      let response;
      if (editingBrand) {
        // Update existing brand
        const payload = {
          old_brand_name: editingBrand.name,
          new_brand_name: data.brand_name,
          new_brand_image: brandImage,
        };
        response = await brandService.updateBrandWithImage(token, payload);
      } else {
        // Create new brand
        const payload = {
          brand_name: data.brand_name,
          brand_image: brandImage,
        };
        response = await brandService.createBrand(token, payload);
      }

      if (response.success) {
        toast.success(editingBrand ? "Brand updated successfully!" : "Brand created successfully!");
        reset();
        setIsOpen(false);
        if (editingBrand && onBrandUpdated) onBrandUpdated();
        if (!editingBrand && onBrandCreated) onBrandCreated();
      } else {
        toast.error(response.error || `Failed to ${editingBrand ? "update" : "create"} brand.`);
      }
    } catch (err: any) {
      toast.error(err.message || `An error occurred while ${editingBrand ? "updating" : "creating"} the brand.`);
    } finally {
      setLoading(false);
    }
  };

  // Update form when editingBrand changes
  React.useEffect(() => {
    if (editingBrand) {
      form.setValue("brand_name", editingBrand.name);
    } else {
      form.reset({ brand_name: "" });
    }
  }, [editingBrand, form]);

  return (
    <Form {...form}>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{editingBrand ? "Edit Vehicle Brand" : "Create a Vehicle Brand"}</DrawerTitle>
              <DrawerDescription>
                {editingBrand ? "Update the brand name below." : "Enter the brand name below."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4" noValidate>
                <FormField
                  control={control}
                  name="brand_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input {...field} required placeholder="Enter brand name" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watch("brand_name") && (
                  <div className="mt-4 flex items-center justify-center">
                    <img
                      src={getBrandImage(watch("brand_name"))}
                      alt={`${watch("brand_name")} Logo`}
                      width={50}
                      height={50}
                      className="rounded"
                    />
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setIsOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : editingBrand ? "Update" : "Submit"}
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