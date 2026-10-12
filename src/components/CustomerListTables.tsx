import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { UpdateCustomerDrawer } from "./UpdateCustomer";
import {
  Pagination,
  PaginationContent,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { useState } from "react";
import { Empty, Spin } from "antd";
import { Button } from "@/components/ui/button";
import CustomerService from "@/utils/customerService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Customer {
  id: number;
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  customerDetails?: any;
}

interface Props {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  isSearchActive: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
  isOperator?: boolean;
}

export function CustomerListTable({
  customers = [],
  loading,
  error,
  isSearchActive,
  currentPage,
  totalPages,
  onPageChange,
  onCustomerUpdated,
  isOperator = false,
}: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Handle edit button click
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsUpdateDrawerOpen(true);
  };

  // Handle delete button click (open confirmation dialog)
  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!customerToDelete) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication token is missing.");
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
      return;
    }

    try {
      const response = await CustomerService.deleteCustomer(customerToDelete.id.toString(), token);
      
      if (response.success) {
        onCustomerUpdated({ ...customerToDelete, is_active: false }); // Trigger update to refresh list
        toast.success("Customer deleted successfully!");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
     
      toast.error(error instanceof Error ? error.message : "An error occurred while deleting the customer.");
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  // Handle page change
  const handlePageChange = (pageIndex: number) => {
    if (pageIndex !== currentPage) {
      onPageChange(pageIndex);
    }
  };

  return (
    <div className="w-full p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">ID</TableCell>
            <TableCell className="font-semibold">Name</TableCell>
            <TableCell className="font-semibold">Mobile</TableCell>
            <TableCell className="font-semibold">Email</TableCell>
            <TableCell className="font-semibold">Status</TableCell>
            {!isOperator && <TableCell className="font-semibold">Actions</TableCell>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center">
                <div className="flex items-center justify-center">
                  <Spin />
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center text-destructive">
                {error}
              </TableCell>
            </TableRow>
          ) : customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center">
                <Empty description="No data available" />
              </TableCell>
            </TableRow>
          ) : (
            customers.map((row) => {
              const fullName = `${row.first_name} ${row.last_name}`;
              const displayName =
                fullName.length > 20 ? `${fullName.slice(0, 20)}...` : fullName;
              return (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{displayName}</TableCell>
                  <TableCell>
                    {row.country_code} {row.mobile_number}
                  </TableCell>
                  <TableCell>
                    {row.email_id
                      ? row.email_id.length > 20
                        ? `${row.email_id.slice(0, 20)}...`
                        : row.email_id
                      : "N/A"}
                  </TableCell>
                  <TableCell>{row.is_active ? "Active" : "Inactive"}</TableCell>
                  {!isOperator && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label="Edit customer"
                        >
                          <Edit size={20} />
                        </button>
                        <Button
                          onClick={() => handleDelete(row)}
                          variant="destructive"
                          size="sm"
                          aria-label="Delete customer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {!isSearchActive && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) handlePageChange(currentPage - 1);
              }}
              className={currentPage === 1 ? "disabled" : ""}
            />
            {(() => {
              const pages: (number | "ellipsis")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                const current = currentPage;
                pages.push(1);
                if (current > 3) pages.push("ellipsis");
                const start = Math.max(2, current - 1);
                const end = Math.min(totalPages - 1, current + 1);
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                if (current < totalPages - 2) pages.push("ellipsis");
                pages.push(totalPages);
              }

              return pages.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationEllipsis key={index} />
                ) : (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(item as number);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              );
            })()}
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) handlePageChange(currentPage + 1);
              }}
              className={currentPage === totalPages ? "disabled" : ""}
            />
          </PaginationContent>
        </Pagination>
      )}

      {isUpdateDrawerOpen && selectedCustomer && (
        <UpdateCustomerDrawer
          customer={selectedCustomer}
          onClose={() => {
            setIsUpdateDrawerOpen(false);
            setSelectedCustomer(null);
          }}
          onCustomerUpdated={(updatedCustomer) => {
            onCustomerUpdated(updatedCustomer);
            setIsUpdateDrawerOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {isDeleteDialogOpen && customerToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {customerToDelete.first_name}{" "}
                {customerToDelete.last_name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}