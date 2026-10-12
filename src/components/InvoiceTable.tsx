"use client";

import { useEffect, useState } from "react";

// Shadcn table & dialog
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BASE_URL from "@/config/apiConfig";

// For date formatting
import { parseISO, format } from "date-fns";

// Import Sonner toast
import { toast } from "sonner";

interface Invoice {
  id: number;
  invoice_number: string;
  organization_id: number;
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

interface GetInvoicesResponse {
  success: boolean;
  message: string;
  data: Invoice[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Payment modal states
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payLoading, setPayLoading] = useState<boolean>(false);

  // If you're storing a token in localStorage:
  const token =
    (typeof window !== "undefined" && localStorage.getItem("authToken")) || "";

  // ---------------
  // Fetch Invoices
  // ---------------
  async function fetchInvoices() {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        page: 1,
        limit: 10,
        organization_id: "",
        is_paid: false,
      };

      const response = await fetch(
        `${BASE_URL}/api/admin/get-invoices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: GetInvoicesResponse = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setInvoices(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch invoices.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------------
  // Format Date (Remove Time)
  // ---------------
  function formatDate(dateString: string) {
    try {
      const parsed = parseISO(dateString);
      return format(parsed, "PPP"); // e.g. "Mar 12, 2025"
    } catch {
      return dateString;
    }
  }

  // ---------------
  // Download PDF Handler
  // ---------------
  async function handleExport(pdfPath: string, invoiceNumber: string) {
    try {
      const res = await fetch(pdfPath, {
        method: "GET",
        // If needed:
        // headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error("Failed to download PDF. See console for details.");
    }
  }

  // ---------------
  // Payment Modal Logic
  // ---------------
  function openPayModal(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setPayModalOpen(true);
  }

  async function handleConfirmPay() {
    if (!selectedInvoice) return;

    try {
      setPayLoading(true);

      // Example payload
      const payBody = {
        invoice_number: selectedInvoice.invoice_number,
        amount: selectedInvoice.total_amount, // or parseFloat if numeric
        user_id: "1",
      };

      const payResponse = await fetch(
        `${BASE_URL}/api/admin/invoice-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payBody),
        }
      );

      if (!payResponse.ok) {
        throw new Error(`HTTP error! Status: ${payResponse.status}`);
      }

      // If 200, parse the JSON
      const payResult = await payResponse.json();
      if (payResult.success) {
        // Show success toast
        toast.success(payResult.message || "Payment successful!");

        // Refetch invoices so we see "is_paid = true"
        await fetchInvoices();

        // Close modal
        setPayModalOpen(false);
        setSelectedInvoice(null);
      } else {
        throw new Error(payResult.message || "Failed to mark invoice as paid.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error during payment.");
    } finally {
      setPayLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Invoices</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && invoices.length === 0 && (
        <p>No invoices found.</p>
      )}

      {!loading && !error && invoices.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Organization ID</TableHead>
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
                <TableCell>{invoice.organization_id}</TableCell>
                <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                <TableCell>{formatDate(invoice.start_date)}</TableCell>
                <TableCell>{formatDate(invoice.end_date)}</TableCell>
                <TableCell>{invoice.total_amount}</TableCell>
                <TableCell>{invoice.is_paid ? "Paid" : "Unpaid"}</TableCell>
                <TableCell className="space-x-2">
                  {/* Export Button (optional) */}
                  <Button
                   className="rounded"
                    variant="outline"
                    onClick={() =>
                      handleExport(invoice.invoice_file, invoice.invoice_number)
                    }
                  >
                    Export
                  </Button>

                  {/* Pay Button */}
                  {!invoice.is_paid && (
                    <Button className="rounded" onClick={() => openPayModal(invoice)}>Pay</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Payment Dialog */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment Completed?</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Do you want to mark payment of{" "}
                  <b>{selectedInvoice.total_amount}</b> completed?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline"  className="rounded" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button  className="rounded" onClick={handleConfirmPay} disabled={payLoading}>
              {payLoading ? "Processing..." : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}