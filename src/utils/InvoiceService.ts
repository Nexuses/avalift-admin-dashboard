import BASE_URL from "@/config/apiConfig";

export interface GetInvoicesPayload {
  page: number;
  limit: number;
  organization_id?: string;
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  organization_id: number;
  organization_name: string;
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

export interface GetInvoicesResponse {
  success: boolean;
  message: string;
  data: Invoice[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}


export interface GenerateInvoicePayload {
    organization_id: number | string;
    start_date: string;
    end_date: string;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    status?: number | null;
    error?: string | null;
    message?: string;
  }

/**
 * Fetch invoices based on the given payload.
 */
export async function getInvoices(
  payload: GetInvoicesPayload,
  token: string
): Promise<GetInvoicesResponse> {
  const response = await fetch(`${BASE_URL}/api/admin/get-invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return (await response.json()) as GetInvoicesResponse;
}

/**
 * Downloads the invoice PDF as a Blob.
 */
export async function exportInvoice(pdfPath: string, token: string): Promise<Blob> {
  const res = await fetch(pdfPath, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  return await res.blob();
}

/**
 * Marks the invoice as paid.
 */
/**
 * Marks the invoice as paid.
 */
export async function markInvoiceAsPaid(
  invoice_number: string,
  user_id: string,
  token: string
): Promise<any> {
  const payBody = { invoice_number, user_id };

  const response = await fetch(`${BASE_URL}/api/admin/invoice-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payBody),
  });

  const data = await response.json(); // Always parse the response body

  if (!response.ok) {
    // Return the parsed data instead of throwing an error
    return {
      success: false,
      message: data.message || `Server error (Status: ${response.status})`,
      error: data.error || null,
      status: response.status,
    };
  }

  return data; // Return the successful response as-is
}



/**
 * Generates an invoice for the given payload.
 */
export async function generateInvoice(
  payload: GenerateInvoicePayload
): Promise<ApiResponse<any>> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("authToken") || ""
      : "";
  const response = await fetch(`${BASE_URL}/api/admin/generate-invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  // Instead of throwing an error, return the backend response
  if (!response.ok) {
    return data as ApiResponse<any>;
  }
  return data as ApiResponse<any>;
}

  
  export default {
    generateInvoice,
  };