"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PresetCalendar from "@/components/PresetCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import organizationService from "@/utils/organizationSevice";
import { getInvoices, markInvoiceAsPaid } from "@/utils/InvoiceService";
import { Empty } from "antd";

interface Organization {
  id: number;
  name: string;
  address?: string;
  country_code?: string;
  mobile_number?: string;
}

export interface GetInvoicesPayload {
  page: number;
  limit: number;
  organization_id?: string;
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  organization_id: number;
  organization_name:string;
  invoice_date: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  amount_paid: string;
  is_paid: boolean;
  invoice_file: string;
  ride_ids: string[];
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceReport() {
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgLoading, setOrgLoading] = useState<boolean>(true);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>("none");
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<"all" | "unpaid" | "paid">("unpaid");

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") || "" : "";

  const fetchOrganizations = async () => {
    setOrgLoading(true);
    setOrgError(null);
    try {
      const response = await organizationService.fetchAllOrganizations();
      if (response.success && response.data) {
        const orgs = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as any).data)
          ? (response.data as any).data
          : [];
        setOrganizations(orgs);
      } else {
        setOrganizations([]);
        setOrgError(response.error || "Failed to fetch organizations.");
        toast.error(response.error || "Failed to fetch organizations.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error fetching organizations.";
      setOrgError(errorMessage);
      setOrganizations([]);
      toast.error(errorMessage);
    } finally {
      setOrgLoading(false);
    }
  };

  async function fetchInvoices() {
    try {
      setLoading(true);
      setError(null);

      let utcStartDate = "";
      let utcEndDate = "";
      if (dateRange?.from) {
        // Set 12:01 AM local time
        const start = new Date(dateRange.from);
        start.setHours(0, 1, 0, 0);
        utcStartDate = start.toISOString();
      }
      if (dateRange?.to) {
        // Set 11:59 PM local time
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 0, 0);
        utcEndDate = end.toISOString();
      }

      const payload: GetInvoicesPayload = {
        page: 1,
        limit: 10,
        organization_id: selectedOrg === "none" ? "" : selectedOrg,
        is_paid:
          paymentStatus === "paid" ? true : paymentStatus === "unpaid" ? false : undefined,
        start_date: utcStartDate,
        end_date: utcEndDate,
      };

      const data = await getInvoices(payload, token);
      if (data.success && Array.isArray(data.data)) {
        setInvoices(data.data);
        toast.success("Invoices fetched successfully!");
      } else {
        throw new Error(data.message || "Failed to fetch invoices.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      setInvoices([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleExport(pdfUrl: string, invoiceNumber: string) {
    try {
      toast.info(`Opening ${invoiceNumber}.pdf...`);
      window.open(pdfUrl, "_blank");
      toast.success(`Successfully opened ${invoiceNumber}.pdf`);
    } catch (err: any) {
      console.error("Error opening PDF:", err);
      toast.error(err.message || "Failed to open PDF. See console for details.");
    }
  }

  function openPayModal(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setPayModalOpen(true);
  }

  async function handleConfirmPay() {
    if (!selectedInvoice) return;

    try {
      setPayLoading(true);
      const payResult = await markInvoiceAsPaid(
        selectedInvoice.invoice_number,
        "1", // Update this as needed for your user_id
        token
      );
      if (payResult.success) {
        toast.success(payResult.message || "Payment successful!");
        await fetchInvoices();
        setPayModalOpen(false);
        setSelectedInvoice(null);
      } else {
        // Use the detailed error from the response if available
        const errorMessage = payResult.error || payResult.message || "Failed to mark invoice as paid.";
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      // Display the full error message, including details from the API response
      const detailedError = err.message || "Error during payment.";
      toast.error(detailedError);
      console.error("Payment error:", err); // Log for debugging
    } finally {
      setPayLoading(false);
    }
  }

  function formatDate(dateString: string) {
    try {
      const parsed = parseISO(dateString);
      return format(parsed, "PPP");
    } catch {
      return dateString;
    }
  }

  useEffect(() => {
    fetchOrganizations();
    fetchInvoices();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Invoice Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6">Invoice Report</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter Invoices</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            {orgLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : orgError ? (
              <p className="text-red-500">{orgError}</p>
            ) : organizations.length === 0 ? (
              <p>No organizations available</p>
            ) : (
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name} (ID: {org.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                    : "Select Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <PresetCalendar
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range && range.from) {
                      setDateRange({ from: range.from, to: range.to || new Date() });
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Status</label>
            <Select value={paymentStatus} onValueChange={(value: "all" | "unpaid" | "paid") => setPaymentStatus(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={fetchInvoices}
            disabled={loading}
            className="h-8 text-sm w-20 rounded"
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>} {/* Show error even when not loading */}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Generated Invoices</h2>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Organization(ID-name)</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
              <Empty description=" No invoices found" />
           </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Organization(ID-Name)</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{`${invoice.organization_id} - ${invoice.organization_name}`}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>{formatDate(invoice.start_date)}</TableCell>
                  <TableCell>{formatDate(invoice.end_date)}</TableCell>
                  <TableCell>{invoice.total_amount}</TableCell>
                  <TableCell>{invoice.is_paid ? "Paid" : "Unpaid"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      className="rounded h-8 text-sm px-3"
                      variant="outline"
                      onClick={() => handleExport(invoice.invoice_file, invoice.invoice_number)}
                    >
                      Export
                    </Button>
                    {!invoice.is_paid && (
                      <Button
                        className="rounded h-8 text-sm px-3"
                        onClick={() => openPayModal(invoice)}
                      >
                        Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment Completed?</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Do you want to mark payment of <b>{selectedInvoice.total_amount}</b> completed?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded h-8 text-sm px-3"
              onClick={() => setPayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded h-8 text-sm px-3"
              onClick={handleConfirmPay}
              disabled={payLoading}
            >
              {payLoading ? "Processing..." : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
