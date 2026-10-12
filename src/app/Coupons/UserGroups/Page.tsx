// pages/UserGroupPage.tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CreateCouponForm } from "@/components/CreateCouponForm";
import { CreateCouponGroupForm } from "@/components/CreateCouponGroupForm";
import CustomerService from "@/utils/customerService";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Add Textarea for description

import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Pencil } from "lucide-react"; // Add Pencil icon for edit
import { Spin } from "antd";

// Import service functions and types for groups
import { fetchGroups, fetchMembers, addMember, deleteMember, deleteGroup, editGroup, Group, Member } from "@/utils/GroupService";

interface Customer {
  id: number;
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  type_id: number | null;
  role_id: number;
  is_active: boolean;
  status_id: number | null;
  device_id: string | null;
  createdAt: string;
  updatedAt: string;
}

const UserGroupPage: React.FC = () => {
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [addMemberGroupId, setAddMemberGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [editGroupId, setEditGroupId] = useState<number | null>(null); // New state for editing
  const [editGroupName, setEditGroupName] = useState<string>(""); // New state for group name
  const [editDescription, setEditDescription] = useState<string>(""); // New state for description

  const token = localStorage.getItem("authToken");

  const handleCouponClose = () => setShowCouponForm(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const groupsData = await fetchGroups(token);
      setGroups(groupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleGroupCreated = () => {
    loadGroups();
    setShowGroupForm(false);
  };

  const loadMembers = async (groupId: number) => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const membersData = await fetchMembers(groupId, token);
      setMembers(membersData);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setMembersLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await CustomerService.fetchIndividualCustomers({
        query,
        page: 1,
        limit: 10,
      });
      if (response.success) {
        setCustomers(response.data);
      } else {
        setSearchError(response.error || "Failed to fetch customers");
        setCustomers([]);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "An error occurred");
      setCustomers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async (groupId: number, customerId: number) => {
    try {
      const message = await addMember(groupId, customerId, token);
      toast.success(message);
      setSearchQuery("");
      setCustomers([]);
      setAddMemberGroupId(null);
      if (selectedGroupId === groupId) loadMembers(groupId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteMember = async (groupId: number, memberId: number) => {
    try {
      const message = await deleteMember(groupId, memberId, token);
      toast.success(message);
      if (selectedGroupId === groupId) loadMembers(groupId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const message = await deleteGroup(groupId, token);
      toast.success(message);
      setGroups(groups.filter((group) => group.id !== groupId));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        setMembers([]);
      }
      if (addMemberGroupId === groupId) {
        setAddMemberGroupId(null);
        setSearchQuery("");
        setCustomers([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred while deleting the group");
    }
  };

  const handleEditGroup = async (groupId: number) => {
    try {
      const message = await editGroup(groupId, editGroupName, editDescription, token);
      toast.success(message);
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, group_name: editGroupName, description: editDescription } 
          : group
      ));
      setEditGroupId(null);
      setEditGroupName("");
      setEditDescription("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred while editing the group");
    }
  };

  const handleViewGroup = (groupId: number) => {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
      setMembers([]);
    } else {
      setSelectedGroupId(groupId);
      loadMembers(groupId);
      setAddMemberGroupId(null);
    }
  };

  const handleToggleAddMember = (groupId: number) => {
    if (addMemberGroupId === groupId) {
      setAddMemberGroupId(null);
      setSearchQuery("");
      setCustomers([]);
    } else {
      setAddMemberGroupId(groupId);
      setSelectedGroupId(null);
    }
  };

  const openEditDialog = (group: Group) => {
    setEditGroupId(group.id);
    setEditGroupName(group.group_name);
    setEditDescription(group.description);
  };

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>user groups</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center pt-4">
        <h1 className="text-2xl font-bold">User groups</h1>
        <div className="flex gap-2">
          <Dialog open={showGroupForm} onOpenChange={setShowGroupForm}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-200"
                disabled={showCouponForm}
              >
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-transparent border-none">
              <DialogHeader />
              <CreateCouponGroupForm onClose={() => setShowGroupForm(false)} onGroupCreated={handleGroupCreated} />
            </DialogContent>
          </Dialog>
          <Dialog open={showCouponForm} onOpenChange={setShowCouponForm}>
            <DialogTrigger asChild>
              {/* Uncomment if coupon form is needed */}
              {/* <Button
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-200"
                disabled={showGroupForm}
              >
                Create Coupon
              </Button> */}
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-transparent border-none">
              <DialogHeader />
              <CreateCouponForm onClose={handleCouponClose} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && <p className="text-gray-500 mt-4"><Spin /></p>}
      {error && (
        <p className="text-red-600 bg-red-50 p-2 rounded-md mt-4 text-sm text-center">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 max-w-7xl mx-auto">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={cn(
              "flex flex-col min-h-[200px] lg:border-r py-10 relative group/feature dark:border-neutral-800",
              index % 3 === 0 && "lg:border-l dark:border-neutral-800",
              index < groups.length - (groups.length % 3 || 3) && "lg:border-b dark:border-neutral-800"
            )}
          >
            <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            <div className="flex-1">
              <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                <Users />
              </div>
              <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                  {group.group_name}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
                {group.description}
              </p>
              <p className="text-xs text-neutral-500 mt-2 relative z-10 px-10">
                Created: {format(new Date(group.createdAt), "PPP")}
              </p>
            </div>
            <div className="relative z-10 flex justify-end gap-2 px-4 pb-4 mt-4">
              <Button
                className="h-9 bg-blue-500 text-white text-sm hover:bg-blue-600 rounded px-3 transition-all duration-200"
                onClick={() => handleToggleAddMember(group.id)}
              >
                {addMemberGroupId === group.id ? "Cancel" : "Add Member"}
              </Button>
              <Button
                className="h-9 bg-gray-500 text-white text-sm hover:bg-gray-600 rounded px-3 transition-all duration-200"
                onClick={() => handleViewGroup(group.id)}
              >
                {selectedGroupId === group.id ? "Hide" : "View"}
              </Button>
              <Dialog open={editGroupId === group.id} onOpenChange={(open) => !open && setEditGroupId(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-100"
                    onClick={() => openEditDialog(group)}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <h2 className="text-lg font-bold">Edit Group</h2>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="groupName" className="text-sm font-medium">
                        Group Name
                      </label>
                      <Input
                        id="groupName"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditGroupId(null)}
                      className="rounded"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleEditGroup(group.id)}
                      className="bg-blue-600 hover:bg-blue-700 rounded"
                      disabled={!editGroupName.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the group "{group.group_name}" and all its associated members.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteGroup(group.id)}
                      className="bg-red-600 hover:bg-red-700 rounded"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {addMemberGroupId !== null && (
        <div className="mt-6 max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">
            Add Members to {groups.find((g) => g.id === addMemberGroupId)?.group_name}
          </h2>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search customers (name, email, phone)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) searchCustomers(e.target.value);
                else setCustomers([]);
              }}
              className="h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md"
            />
          </div>
          {searchLoading && <p className="text-gray-500 text-sm">Searching...</p>}
          {searchError && (
            <p className="text-red-600 bg-red-50 p-2 rounded-md text-sm text-center">
              {searchError}
            </p>
          )}
          {customers.length > 0 && (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium text-gray-600">Name</TableHead>
                  <TableHead className="text-xs font-medium text-gray-600">Email</TableHead>
                  <TableHead className="text-xs font-medium text-gray-600">Phone</TableHead>
                  <TableHead className="text-xs font-medium text-gray-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="text-sm text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {customer.email_id || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {customer.country_code}{customer.mobile_number}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleAddMember(addMemberGroupId!, customer.id)}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md px-2"
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {selectedGroupId !== null && (
        <div className="mt-6 max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">
            Members of {groups.find((g) => g.id === selectedGroupId)?.group_name}
          </h2>
          {membersLoading && <p className="text-gray-500 text-center">Loading members...</p>}
          {membersError && (
            <p className="text-red-600 bg-red-50 p-2 rounded-md text-sm text-center">
              {membersError}
            </p>
          )}
          {!membersLoading && !membersError && members.length === 0 && (
            <p className="text-gray-500 text-sm text-center">No members found.</p>
          )}
          {members.length > 0 && (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium text-gray-600">Name</TableHead>
                  <TableHead className="text-xs font-medium text-gray-600">Email</TableHead>
                  <TableHead className="text-xs font-medium text-gray-600">Phone</TableHead>
                  <TableHead className="text-xs font-medium text-gray-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-sm text-gray-900">
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">{member.email_id}</TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {member.country_code}{member.mobile_number}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white rounded px-2"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove{" "}
                              {member.first_name} {member.last_name} from the group.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMember(selectedGroupId!, member.id)}
                              className="bg-red-600 hover:bg-red-700 rounded"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
};

export default UserGroupPage;