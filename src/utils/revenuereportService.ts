// src/utils/revenueReportService.ts

import { ApiResponse, apiPostFetcher } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig"; // Adjust the import path as needed

/**
 * Payload for generating an invoice.
 */
export interface GenerateInvoicePayload {
  organization_id: number;
  start_date: string; // ISO date string, e.g. "2025-01-01T00:00:00Z"
  end_date: string;   // ISO date string, e.g. "2025-03-09T23:59:59Z"
}

/**
 * Payload for processing an invoice payment.
 */
export interface InvoicePaymentPayload {
  invoice_number: string;
  amount: number;
}

/**
 * Payload for fetching invoices with pagination.
 */
export interface GetInvoicesPayload {
  page: number;
  limit: number;
  organization_id: string;
  is_paid: boolean;
}

/**
 * (Optional) Interface for a generated invoice response.
 */
export interface InvoiceResponse {
  invoice_number: string;
  // ... add other properties as needed
}

/**
 * (Optional) Interface for the get invoices response.
 */
export interface InvoicesResponse {
  data: any[]; // Replace 'any' with a more specific type if available
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Revenue report service to handle invoice generation, payment, and fetching.
 */
const revenueReportService = {
  /**
   * Generate an invoice for a given organization and date range.
   * POST {{BASE_URL}}/api/admin/generate-invoice
   */
  generateInvoice: async (
    payload: GenerateInvoicePayload
  ): Promise<ApiResponse<InvoiceResponse>> => {
    const url = `${BASE_URL}/api/admin/generate-invoice`;
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.error || "Failed to generate invoice.",
      };
    }
    return response;
  },

  /**
   * Process an invoice payment.
   * POST {{BASE_URL}}/api/admin/invoice-payment
   */
  invoicePayment: async (
    payload: InvoicePaymentPayload
  ): Promise<ApiResponse<any>> => {
    const url = `${BASE_URL}/api/admin/invoice-payment`;
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.error || "Failed to process invoice payment.",
      };
    }
    return response;
  },

  /**
   * Fetch invoices with pagination.
   * POST {{BASE_URL}}/api/admin/get-invoices
   */
  getInvoices: async (
    payload: GetInvoicesPayload
  ): Promise<ApiResponse<InvoicesResponse>> => {
    const url = `${BASE_URL}/api/admin/get-invoices`;
    const token = localStorage.getItem("authToken");
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing.",
      };
    }

    const response: ApiResponse<any> = await apiPostFetcher<any>(url, payload, token);
    if (!response.success) {
      return {
        success: false,
        data: null,
        status: response.status,
        error: response.error || "Failed to fetch invoices.",
      };
    }
    return response;
  },
};

export default revenueReportService;
