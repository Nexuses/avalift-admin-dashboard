"use client";

import { useState, useEffect, useTransition, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import organizationService from "@/utils/organizationSevice";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getGroups, getCouponData, submitCoupon } from "@/utils/couponService";
import { Group } from "@/utils/couponService";

const formSchema = z
  .object({
    coupon_title: z.string().min(1, "Coupon title is required"),
    coupon_description: z.string().min(1, "Coupon description is required"),
    coupon_code: z.string().min(1, "Coupon code is required"),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.number().min(0, "Discount value must be positive"),
    max_discount_amount: z.number().min(0, "Max discount must be positive").optional(),
    valid_from: z.date(),
    valid_to: z.date(),
    usage_limit: z.number().int().min(1, "Usage limit must be at least 1"),
    max_usage_per_user: z.number().int().min(1, "Max usage per user must be at least 1").optional(),
    is_active: z.boolean(),
    organization_id: z.number().nullable(),
    first_order_only: z.boolean(),
    min_subtotal: z.number().min(0, "Minimum subtotal must be positive"),
    max_subtotal: z.number().min(0, "Maximum subtotal must be positive"),
    applicable_user_groups: z.array(z.number()),
    no_group_specified: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.discount_type === "fixed" ||
      (data.discount_type === "percentage" && data.max_discount_amount !== undefined),
    {
      message: "Max discount amount is required for percentage discounts",
      path: ["max_discount_amount"],
    }
  )
  .refine(
    (data) =>
      data.max_discount_amount === undefined ||
      data.max_discount_amount >= data.discount_value,
    {
      message: "Max discount amount must be greater than or equal to discount value",
      path: ["max_discount_amount"],
    }
  )
  .refine((data) => data.max_subtotal >= data.min_subtotal, {
    message: "Maximum subtotal must be greater than or equal to minimum subtotal",
    path: ["max_subtotal"],
  })
  .refine((data) => data.valid_from <= data.valid_to, {
    message: "Valid from date must be before or equal to valid to date",
    path: ["valid_to"],
  });

type FormValues = z.infer<typeof formSchema>;

interface CreateCouponFormProps {
  onClose: () => void;
  couponId?: number;
  endpoint?: string;
}

export function CreateCouponForm({
  onClose,
  couponId,
  endpoint,
}: CreateCouponFormProps) {
  const [isPending, startTransition] = useTransition();
  const [, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const [orgs, setOrganizations] = useState<Organization[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coupon_title: "",
      coupon_description: "",
      coupon_code: "",
      discount_type: "percentage",
      discount_value: undefined,
      max_discount_amount: undefined,
      valid_from: new Date(),
      valid_to: new Date(),
      usage_limit: 100,
      max_usage_per_user: undefined,
      is_active: true,
      organization_id: 1,
      first_order_only: true,
      min_subtotal: undefined,
      max_subtotal: undefined,
      applicable_user_groups: [],
      no_group_specified: false,
    },
  });

  const discountType = form.watch("discount_type");

  interface Organization {
    name: ReactNode;
    id: number;
    organization_name: string;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupsData = await getGroups(token);
        setGroups(groupsData);

        const response = await organizationService.fetchAllOrganizations();
        if (response.success && response.data) {
          const orgs = Array.isArray(response.data)
            ? response.data
            : Array.isArray((response.data as any).data)
            ? (response.data as any).data
            : [];
          setOrganizations(orgs);
        } else {
          toast.error(response.error || "Failed to load organizations");
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      }

      if (couponId) {
        try {
          const couponData = await getCouponData(couponId, token);
          form.reset({
            ...couponData,
            coupon_description: couponData.coupon_description || "",
            discount_value: couponData.discount_value,
            max_discount_amount: couponData.max_discount_amount
              ? couponData.max_discount_amount
              : undefined,
            valid_from: new Date(couponData.valid_from),
            valid_to: new Date(couponData.valid_to),
            usage_limit: parseInt(couponData.usage_limit),
            max_usage_per_user: couponData.max_usage_per_user
            ? couponData.max_usage_per_user
              : undefined,
            min_subtotal: couponData.min_subtotal
              ? couponData.min_subtotal
              : undefined,
            max_subtotal: couponData.max_subtotal
              ? couponData.max_subtotal
              : undefined,
            applicable_user_groups: couponData.applicable_user_groups || [],
            no_group_specified: couponData.no_group_specified || false,
            first_order_only: couponData.first_order_only || false,
            organization_id: couponData.organization_id !== undefined
              ? couponData.organization_id
              : 1,
              
            coupon_title: couponData.coupon_title || "",
            coupon_code: couponData.coupon_code || "",
            discount_type: couponData.discount_type || "percentage",
            is_active: couponData.is_active !== undefined ? couponData.is_active : true,
          });
        } catch (err) {
          console.error("Failed to fetch coupon data:", err);
          toast.error("Failed to load coupon data");
        }
      }
    };

    fetchData();
  }, [couponId, token, form]);

  useEffect(() => {
    if (discountType === "fixed") {
      form.setValue("max_discount_amount", undefined);
    }
  }, [discountType, form]);

  const onSubmit = (values: FormValues) => {
    const rules: any[] = [];
    if (values.first_order_only) rules.push({ rule_type: "first_order" });
    if (values.min_subtotal > 0) {
      rules.push({
        rule_type: "subtotal",
        operator: "greater_than",
        value: values.min_subtotal,
      });
    }
    if (values.max_subtotal > 0) {
      rules.push({
        rule_type: "subtotal",
        operator: "less_than",
        value: values.max_subtotal,
      });
    }

    const finalUserGroups = values.no_group_specified
      ? []
      : values.applicable_user_groups;

    const payload = {
      coupon: {
        coupon_title: values.coupon_title,
        coupon_description: values.coupon_description,
        coupon_code: values.coupon_code,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_discount_amount: values.max_discount_amount,
        valid_from: values.valid_from.toISOString().split("T")[0],
        valid_to: values.valid_to.toISOString().split("T")[0],
        usage_limit: values.usage_limit,
        max_usage_per_user: values.max_usage_per_user,
        is_active: true,
        organization_id: values.organization_id,
        is_combinable: false,
        first_order_only: values.first_order_only,
        min_subtotal: values.min_subtotal,
        max_subtotal: values.max_subtotal,
      },
      rules,
      applicable_user_groups: finalUserGroups,
    };

    startTransition(() => {
      (async () => {
        try {
          setError(null);
          const sanitizedPayload = {
            ...payload,
            coupon: {
              ...payload.coupon,
              max_discount_amount: payload.coupon.max_discount_amount ?? 0,
            },
          };
          await submitCoupon(sanitizedPayload, token, endpoint);
          toast.success(
            endpoint
              ? "Coupon updated successfully!"
              : "Coupon created successfully!"
          );
          onClose();
        } catch (err) {
          console.error("Error processing coupon:", err);
          let errorMessage = endpoint ? "Error updating coupon." : "Error creating coupon.";

          if (err instanceof Error && (err as any).response) {
            const errorResponse = (err as any).response;
            if (errorResponse.details && Array.isArray(errorResponse.details)) {
              const couponCodeError = errorResponse.details.find(
                (detail: any) => detail.field === "coupon_code"
              );
              if (couponCodeError) {
                errorMessage = couponCodeError.message;
              }
            }
          }

          toast.error(errorMessage);
          setError(errorMessage);
        }
      })();
    });
  };

  return (
    <div className="w-full max-w-full sm:max-w-3xl mx-auto my-4 sm:my-6 p-2 sm:p-4 bg-white rounded-xl shadow-md border border-gray-200 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pt-2 sm:pt-0">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
          {couponId ? "Edit Coupon" : "Create Coupon"}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            <FormField
              control={form.control}
              name="coupon_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Coupon Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Coupon Title"
                      {...field}
                      className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
           
            <FormField
              control={form.control}
              name="coupon_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Coupon Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Coupon Code"
                      {...field}
                      className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />

<FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Organization
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const orgId = value ? parseInt(value) : null;
                      field.onChange(orgId);
                    }}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger
                        disabled={!!couponId}
                        className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                      >
                        <SelectValue placeholder="Select an organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-gray-200 bg-white shadow-md rounded max-h-60 overflow-y-auto">
                      {orgs.map((org) => (
                        <SelectItem
                          key={org.id}
                          value={org.id.toString()}
                          className="text-xs sm:text-sm hover:bg-gray-100"
                        >
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            <FormField
              control={form.control}
              name="discount_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Discount Value %
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Discount value"
                      {...field}
                      value={field.value !== undefined ? field.value : ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            {discountType === "percentage" && (
              <FormField
                control={form.control}
                name="max_discount_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                      Max Discount Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Maximum discount"
                        value={field.value !== undefined ? field.value.toString() : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange(undefined);
                          } else if (!isNaN(parseFloat(value))) {
                            field.onChange(parseFloat(value));
                          }
                        }}
                        className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            <FormField
              control={form.control}
              name="valid_from"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Valid From
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date || new Date())}
                      minDate={new Date()}
                      maxDate={new Date("2025-12-31")}
                      dateFormat="MMMM d, yyyy"
                      className="h-9 sm:h-10 w-full pl-2 sm:pl-3 bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                      placeholderText="Pick a date"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valid_to"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Valid To
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date || new Date())}
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      className="h-9 sm:h-10 w-full pl-2 sm:pl-3 bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                      placeholderText="Pick a date"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usage_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                   Coupon Usage Limit
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />

<FormField
  control={form.control}
  name="max_usage_per_user"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
        Max Usage Per User
      </FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder="Max usage per user"
          {...field}
          value={field.value !== undefined ? field.value : ""}
          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
          className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
        />
      </FormControl>
      <FormMessage className="text-red-600 text-xs sm:text-sm" />
    </FormItem>
    
  )}
/>

 <FormField
              control={form.control}
              name="coupon_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Coupon Description
                  </FormLabel>
                  <FormControl>
                    <textarea 
                      placeholder="Coupon Description"
                      {...field}
                      className="h-12 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm p-2 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
           
          </div>

          <FormField
            control={form.control}
            name="no_group_specified"
            render={({ field }) => (
              <FormItem className="flex items-center mb-2 sm:mb-4 space-x-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300"
                  />
                </FormControl>
                <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                  No Group Specified
                </FormLabel>
              </FormItem>
            )}
          />

          <div className="p-2 sm:p-4 rounded mb-2 sm:mb-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Groups
              </h3>
              {groups.length > 1 && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowAllGroups(!showAllGroups)}
                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm p-0"
                >
                  {showAllGroups ? "Show Less" : "Show All"}
                </Button>
              )}
            </div>
            <FormField
              control={form.control}
              name="applicable_user_groups"
              render={({ field }) => {
                const noGroupSpecified = form.watch("no_group_specified");
                const displayedGroups = showAllGroups
                  ? groups
                  : groups.slice(0, 1);
                return (
                  <div className="space-y-2 sm:space-y-3 max-h-60 overflow-y-auto">
                    {displayedGroups.map((group) => (
                      <FormItem
                        key={group.id}
                        className="flex items-center space-x-2 p-2 bg-white rounded"
                      >
                        <FormControl>
                          <Checkbox
                            disabled={noGroupSpecified}
                            checked={field.value.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked)
                                field.onChange([...field.value, group.id]);
                              else
                                field.onChange(
                                  field.value.filter((id) => id !== group.id)
                                );
                            }}
                            className="h-4 w-4 mt-1 sm:mt-3 border-gray-300 rounded"
                          />
                        </FormControl>
                        <div className="flex-1 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <FormLabel className="text-xs sm:text-sm text-gray-700 font-semibold">
                              {group.group_name}
                            </FormLabel>
                          </div>
                        </div>
                      </FormItem>
                    ))}
                  </div>
                );
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <FormField
              control={form.control}
              name="first_order_only"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 sm:space-x-3 space-y-0 p-1 sm:p-2 rounded">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                      First Ride Only
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <FormField
              control={form.control}
              name="min_subtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Minimum Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Minimum subtotal"
                      {...field}
                      value={field.value !== undefined ? field.value : ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_subtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                    Maximum Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Maximum subtotal"
                      {...field}
                      value={field.value !== undefined ? field.value : ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      className="h-9 sm:h-10 w-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs sm:text-sm" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 sm:gap-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 text-xs sm:text-sm py-2 px-3 sm:px-4 rounded"
            >
              {isPending
                ? endpoint
                  ? "Updating..."
                  : "Creating..."
                : endpoint
                ? "Update Coupon"
                : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}