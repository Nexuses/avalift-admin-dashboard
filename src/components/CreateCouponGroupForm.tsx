// components/CreateCouponGroupForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Import the service function and Group type
import { createCouponGroup, Group } from "@/utils/CouponGroupService"

const formSchema = z.object({
  group_name: z.string().min(1, "Group name is required"),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCouponGroupFormProps {
  onClose: () => void;
  onGroupCreated: (newGroup: Group) => void;
}

export function CreateCouponGroupForm({ onClose, onGroupCreated }: CreateCouponGroupFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group_name: "",
      description: "",
    },
  });
  
  const onSubmit = (values: FormValues) => {
    startTransition(() => {
      const submitAsync = async () => {
        try {
          const token = localStorage.getItem("authToken");
          // Call the service to create a new group
          const newGroup = await createCouponGroup(
            {
              group_name: values.group_name,
              description: values.description,
            },
            token
          );
          toast.success("Group created successfully");
          form.reset();
          onGroupCreated(newGroup);
          onClose();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "An error occurred";
          setError(errMsg);
          toast.error(errMsg);
        }
      };
      submitAsync();
    });
  };
  
  return (
    <div className="max-w-2xl p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">New Group</h2>
      {error && (
        <p className="text-red-600 bg-red-50 p-2 rounded-md mb-3 text-sm text-center">
          {error}
        </p>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="group_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-600">Group Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Group name"
                    {...field}
                    className="h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-600">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description"
                    {...field}
                    className="h-20 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md resize-none"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs" />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-sm border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3"
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
