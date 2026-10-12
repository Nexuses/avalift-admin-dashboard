
import { apiPostFetcher, ApiResponse } from "./apiFetcher";
import BASE_URL from "@/config/apiConfig";

// Generic interface for API responses
export interface WalletDetail {
  ride_amount: string;
  chauffeur_id: string;
  ride_id: string;
  user_id: number;
  wallet_balance: string;
  is_org: boolean;
  first_name: string;
  last_name: string;
  role_name: string;
}

export interface ActiveWalletDetail {
  user_id: number;
  top_up_amount: string;
  wallet_balance: string;
  ride_id: string;
  ride_amount: string;
  adjusted_ride_amount: string;
  transaction_date: string;
  transaction_reference: string | null;
  amount_to_be_paid: string;
  discount_amount: string;
  tip_amount: string;
  chauffeur_id: string;
  is_paid: boolean;
  payment_status_id: number;
  customer_wallet_id: number;
  base_fare: string;
  rate_type: string;
  rates: string;
  mandatory_charges: string;
  other_charges: string;
  is_coupon_applied: boolean;
  vat: string;
  is_invoice_created: boolean;
  ride_minutes: number;
  total_after_discount: string;
  "CustomerWallet.is_org": boolean;
  "User.first_name": string;
  "User.last_name": string;
  "PaymentType.name": string;
  "Status.name": string;
  PaymentStatusName: string;
}



interface ChauffeurWalletApiResponse {
  userWalletsDetail?: {
    success: boolean;
    message: string;
    data?: {
      chauffeurRec: {
        totalRecords: number;
        totalPages: number;
        currentPage: number;
        data: ChauffeurWalletDetail[];
      };
    };
  };
}

export interface PDWalletDetail {
  hand_over_amount: string;
  hand_over_transaction_date: any;
  wallet_balance: string;
  User: {
    first_name: string;
    last_name: string;
    id: number;
  };
  "Hand-Over-User": {
    first_name: string;
    last_name: string;
  } | null;
}

interface PDWalletApiResponse {
  userWalletsDetail?: {
    success: boolean;
    message: string;
    data?: {
      pdRec: {
        totalRecords: number;
        totalPages: number;
        currentPage: number;
        perPage: number;
        data: PDWalletDetail[];
      };
    };
  };
}


export interface AdminWalletDetail {
  wallet_balance: string;
  Admin: {
    first_name: string;
    last_name: string;
    id: number;
  };
}

interface AdminWalletApiResponse {
  userWalletsDetail?: {
    success: boolean;
    message: string;
    data?: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      data: AdminWalletDetail[];
    };
  };
}

export interface HistoryWalletDetail {
  hand_over_transaction_date: null;
  hand_over_amount: string;
  wallet_balance: string;
  User: {
    first_name: string;
    last_name: string;
    id: number;
  };
  "Hand-Over-User": {
    first_name: string;
    last_name: string;
  } | null;
}
interface HistoryChauffeurWalletApiResponse {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  data: HistoryWalletDetail[];
}

interface HistoryWalletApiResponse {
  userWalletDetail?: {
    success: boolean;
    message: string;
    data?: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      data: HistoryWalletDetail[];
    };
  };
}

interface ChauffeurTipWalletLog {
  id: number;
  chauffeur_tip_wallet_id: number;
  ride_id: number | null;
  chauffeur_id: number;
  amount: string;
  previous_balance: string;
  current_balance: string;
  transaction_type: string;
  status: string;
  reference_id: string;
  processed_by: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  user_id: number | null;
}

// Interfaces for /api/admin/get-user-wallet-details (updated to POST)
interface GetUserWalletPayload {
  start_date: string;
  end_date: string;
  page: number;
  limit: number;
  search_string: string;
}

export interface CustomerWalletDetail {
  user_id: number;
  wallet_balance: string;
  is_org: boolean;
  User: {
    first_name: string;
    last_name: string;
  };
}

interface UserWalletApiResponse {
  results?: {
    success: boolean;
    message: string;
    data?: {
      customerWalletRec: {
        totalRecords: number;
        totalPages: number;
        currentPage: number;
        data: CustomerWalletDetail[];
      };
    };
  };
}

// New interface to include pagination metadata.
export interface WalletDetailResponse {
  data: CustomerWalletDetail[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

// Interfaces for /api/admin/get-user-wallet-balance (updated to POST)
interface GetUserWalletBalancePayload {
  start_date: string;
  end_date: string;
  customer_id: string;
  page: number;
  limit: number;
  search_string: string;
}
interface ChauffeurWalletDetail {
  pd_transaction_date: string;
  hand_over_amount: string;
  has_handed_over: boolean;
  User: {
    first_name: string;
    last_name: string;
    id: number;
  };
  "PD-User": {
    first_name: string;
    last_name: string;
    id: number;
  };
}
export interface WalletBalanceDetail {
  User: {
    first_name: string;
    last_name: string;
  };
  user_id: number;
  payment_type_id: number;
  top_up_amount: string;
  ride_id: string;
  adjusted_ride_amount: string;
  transaction_date: string;
  amount_to_be_paid: string;
  is_paid: boolean;
  payment_status_id: number;
  rate_type: string;
  is_invoice_created: boolean;
  wallet_balance: string;
  PaymentType: {
    name: string;
  };
  Status: {
    name: string;
  };
}

interface WalletBalanceApiResponse {
  results?: {
    success: boolean;
    message: string;
    data?: {
      customerRec: {
        totalRecords: number;
        totalPages: number;
        currentPage: number;
        data: WalletBalanceDetail[];
      };
    };
  };
}

interface ChauffeurWalletBalanceResponse {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  data: ChauffeurWalletDetail[];
}
interface HistoryPDWalletApiResponse {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  data: PDWalletDetail[];
}

interface WalletBalanceHistoryResponse {
  data: WalletBalanceDetail[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}


interface RidePayment {
  ride_id: string;
  amount_to_be_paid: string;
  chauffeur_id: string;
  adjusted_ride_amount: number;
}

interface ChauffeurWalletByIdResponse {
  success: boolean;
  message: string;
  data: {
    rides: {
      paymentsRec: RidePayment[];
      customerWalletRec: RidePayment[];
    };
  };
}
interface GetPdWalletByIdPayload {
  pd_id: string;
  start_date: string;
  end_date: string;
}
export interface PdWalletByIdDetail {
  user_id: number;
  pd_user_id: number;
  hand_over_amount: string;
  pd_transaction_date: string;
  User: {
    first_name: string;
    last_name: string;
    id: number;
  };
  "PD-User": {
    first_name: string;
    last_name: string;
    id: number;
  };
}

interface PdWalletByIdApiResponse {
  success: boolean;
  message: string;
  data: {
    transItems: {
      pdWalletRec: PdWalletByIdDetail[];
    };
  };
}
const walletService = {
  // Fetch user wallet details
  getUserWallet: async (
    token: string,
    payload: GetUserWalletPayload
  ): Promise<ApiResponse<WalletDetailResponse>> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-user-wallet-details`;
      const response: ApiResponse<UserWalletApiResponse> = await apiPostFetcher(url, payload, token);
      if (
        response.success &&
        response.data?.results?.success &&
        response.data.results.data?.customerWalletRec?.data
      ) {
        const rec = response.data.results.data.customerWalletRec;
        return {
          success: true,
          data: {
            data: rec.data,
            totalRecords: rec.totalRecords,
            totalPages: rec.totalPages,
            currentPage: rec.currentPage,
          },
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: { data: [], totalRecords: 0, totalPages: 0, currentPage: 1 },
        status: response.status || 500,
        error: response.data?.results?.message || "Failed to fetch wallet details.",
      };
    } catch (error) {
      return {
        success: false,
        data: { data: [], totalRecords: 0, totalPages: 0, currentPage: 1 },
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Fetch user wallet balance details (wallet history)
  getUserWalletHistory: async (
    token: string,
    payload: GetUserWalletBalancePayload
  ): Promise<ApiResponse<WalletBalanceHistoryResponse>> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-user-wallet-balance`;
      const response: ApiResponse<WalletBalanceApiResponse> = await apiPostFetcher(url, payload, token);
      if (
        response.success &&
        response.data?.results?.success &&
        response.data.results.data?.customerRec?.data
      ) {
        const rec = response.data.results.data.customerRec;
        return {
          success: true,
          data: {
            data: rec.data,
            totalRecords: rec.totalRecords,
            totalPages: rec.totalPages,
            currentPage: rec.currentPage,
          },
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: { data: [], totalRecords: 0, totalPages: 0, currentPage: 1 },
        status: response.status || 500,
        error: response.data?.results?.message || "Failed to fetch wallet balance details",
      };
    } catch (error) {
      return {
        success: false,
        data: { data: [], totalRecords: 0, totalPages: 0, currentPage: 1 },
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },


// Update the method
getChauffeurWalletBalance: async (
  token: string,
  payload: {
    start_date: string;
    end_date: string;
    chauffeur_id: number;
    page: number;
    limit: number;
  }
): Promise<ApiResponse<ChauffeurWalletBalanceResponse>> => {
  try {
    if (!token) throw new Error("Authorization token is required.");
    const url = `${BASE_URL}/api/admin/get-chauffeur-wallet-balance`;
    const response: ApiResponse<ChauffeurWalletApiResponse> = await apiPostFetcher(url, payload, token);
    if (
      response.success &&
      response.data?.userWalletsDetail?.success &&
      response.data.userWalletsDetail.data?.chauffeurRec
    ) {
      const rec = response.data.userWalletsDetail.data.chauffeurRec;
      return {
        success: true,
        data: {
          totalRecords: rec.totalRecords,
          totalPages: rec.totalPages,
          currentPage: rec.currentPage,
          data: rec.data,
        },
        status: 200,
        error: null,
      };
    }
    return {
      success: false,
      data: { totalRecords: 0, totalPages: 0, currentPage: 1, data: [] },
      status: response.status || 500,
      error: response.data?.userWalletsDetail?.message || "Failed to fetch chauffeur wallet details",
    };
  } catch (error) {
    return {
      success: false,
      data: { totalRecords: 0, totalPages: 0, currentPage: 1, data: [] },
      status: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
},
getChauffeurWalletById: async (
  token: string,
  payload: {
    chauffeur_id: string;
    start_date: string;
    end_date: string;
    page: number;
    limit: number;
  }
): Promise<ApiResponse<ChauffeurWalletByIdResponse>> => {
  try {
    if (!token) throw new Error("Authorization token is required.");
    const url = `${BASE_URL}/api/admin/get-chauffeur-wallet-by-id`;
    const response: ApiResponse<ChauffeurWalletByIdResponse> = await apiPostFetcher(url, payload, token);
    if (response.success && response.data?.success) {
      return {
        success: true,
        data: response.data,
        status: 200,
        error: null,
      };
    }
    return {
      success: false,
      data: null,
      status: response.status || 500,
      error: response.data?.message || "Failed to fetch chauffeur wallet by ID",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
},

  getPdWalletBalance: async (
    token: string,
    payload: {
      start_date: string;
      end_date: string;
      pd_id: number;
      page: number;
      limit: number;
    }
  ): Promise<ApiResponse<PDWalletDetail[]>> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-pd-wallet-balance`;
      const response: ApiResponse<PDWalletApiResponse> = await apiPostFetcher(url, payload, token);
      if (
        response.success &&
        response.data?.userWalletsDetail?.success &&
        response.data.userWalletsDetail.data?.pdRec
      ) {
        const rec = response.data.userWalletsDetail.data.pdRec;
        return {
          success: true,
          data: rec.data,  // Extract the actual array from pdRec.data
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: [],
        status: response.status || 500,
        error:
          response.data?.userWalletsDetail?.message ||
          "Failed to fetch PD wallet details",
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  

  getAdminWalletBalance: async (
    token: string,
    payload: {
      start_date: string;
      end_date: string;
      admin_id: number;
      page: number;
      limit: number;
    }
  ): Promise<ApiResponse<AdminWalletDetail[]>> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-admin-wallet-balance`;
      const response: ApiResponse<AdminWalletApiResponse> = await apiPostFetcher(url, payload, token);
      if (
        response.success &&
        response.data?.userWalletsDetail?.success &&
        response.data.userWalletsDetail.data?.data
      ) {
        return {
          success: true,
          data: response.data.userWalletsDetail.data.data,
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: [],
        status: response.status || 500,
        error:
          response.data?.userWalletsDetail?.message ||
          "Failed to fetch admin wallet details",
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // New API endpoints for history:
  getChauffeurWalletHistory: async (
    token: string,
    payload: {
      start_date: string;
      end_date: string;
      page: number;
      limit: number;
    }
  ): Promise<ApiResponse<HistoryChauffeurWalletApiResponse >> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-chauffeur-wallet-history`;
      const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);
  
      if (
        response.success &&
        response.data?.userWalletDetail?.success &&
        response.data.userWalletDetail.data
      ) {
        return {
          success: true,
          data: response.data.userWalletDetail.data, // Full object with totalRecords, data, etc.
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: null,
        status: response.status || 500,
        error: response.data?.userWalletDetail?.message || "Failed to fetch chauffeur wallet history",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  getChauffeurTipWalletHistory: async (
    token: string,
    payload: {
      start_date: string;
      end_date: string;
      page: number;
      limit: number;
    }
  ): Promise<ApiResponse<HistoryChauffeurWalletApiResponse >> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-chauffeur-tip-wallet-history`;
      const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);
  
      if (
        response.success &&
        response.data?.userWalletDetail?.success &&
        response.data.userWalletDetail.data
      ) {
        return {
          success: true,
          data: response.data.userWalletDetail.data, // Full object with totalRecords, data, etc.
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: null,
        status: response.status || 500,
        error: response.data?.userWalletDetail?.message || "Failed to fetch chauffeur tip wallet history",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  getChauffeurTipWalletBalances: async (
    token: string,
    payload: {
      searchString: string;
      fromDate: string;
      toDate: string;
      page: number;
      limit: number;
    }
  ): Promise<
    ApiResponse<{
      wallets: Array<{
        id: number;
        chauffeur_id: number;
        balance: string;
        Chauffeur?: { id: number; first_name?: string; last_name?: string };
      }>;
      totalRecords: number;
      currentPage: number | string;
      totalPages: number;
    }>
  > => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-all-chauffeur-tip-wallet-balances/${payload.page}/${payload.limit}`;
      const response: ApiResponse<any> = await apiPostFetcher(
        url,
        {
          searchString: payload.searchString,
          fromDate: payload.fromDate,
          toDate: payload.toDate,
        },
        token
      );

      if (response.success && response.data?.data?.wallets) {
        const { wallets, totalRecords, currentPage, totalPages } = response.data.data;
        return {
          success: true,
          data: { wallets, totalRecords, currentPage, totalPages },
          status: response.status,
          error: null,
        };
      }

      return {
        success: false,
        data: null,
        status: response.status || 500,
        error: response.data?.error || response.error || "Failed to fetch tip wallet balances",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  getChauffeurTipWalletLogsById: async (
    token: string,
    payload: {
      chauffeurId: number;
      page: number;
      limit: number;
    }
  ): Promise<
    ApiResponse<{
      logs: ChauffeurTipWalletLog[];
      totalRecords: number;
      currentPage: number | string;
      totalPages: number;
    }>
  > => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-chauffeur-tip-wallet-logs-by-id/${payload.page}/${payload.limit}`;
      const response: ApiResponse<any> = await apiPostFetcher(
        url,
        { chauffeurId: payload.chauffeurId },
        token
      );

      if (response.success && response.data?.data?.logs) {
        const { logs, totalRecords, currentPage, totalPages } = response.data.data;
        return {
          success: true,
          data: { logs, totalRecords, currentPage, totalPages },
          status: response.status,
          error: null,
        };
      }

      return {
        success: false,
        data: null,
        status: response.status || 500,
        error: response.data?.error || response.error || "Failed to fetch tip wallet logs",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  tipPayout: async (
    token: string,
    payload: {
      chauffeurId: number;
      amount: number;
    }
  ): Promise<ApiResponse<any>> => {
    if (!token) {
      return {
        success: false,
        data: null,
        status: null,
        error: "Authentication token is missing. Please log in again.",
      };
    }

    const url = `${BASE_URL}/api/admin/tip-payout`;
    const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);

    if (response.success) {
      return response;
    }

    return {
      success: false,
      data: null,
      status: response.status,
      error: response.data?.message || response.error || "Failed to process tip payout",
    };
  },
  getPdWalletHistory: async (
    token: string,
    payload: {
      start_date: string;
      end_date: string;
      page: number;
      limit: number;
    }
  ): Promise<ApiResponse<HistoryPDWalletApiResponse>> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-pd-wallet-history`;
      const response: ApiResponse<any> = await apiPostFetcher(url, payload, token);
  
      if (
        response.success &&
        response.data?.userWalletDetail?.success &&
        response.data.userWalletDetail.data
      ) {
        return {
          success: true,
          data: response.data.userWalletDetail.data, // Full object with totalRecords, data, etc.
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: null,
        status: response.status || 500,
        error: response.data?.userWalletDetail?.message || "Failed to fetch PD wallet history",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  getAdminWalletHistory: async (
    token: string,
    payload: {
      start_date: string;
      end_date: string;
      page: number;
      limit: number;
    }
  ): Promise<ApiResponse<HistoryWalletDetail[]>> => {
    try {
      if (!token) throw new Error("Authorization token is required.");
      const url = `${BASE_URL}/api/admin/get-admin-wallet-history`;
      const response: ApiResponse<HistoryWalletApiResponse> = await apiPostFetcher(url, payload, token);
      if (
        response.success &&
        response.data?.userWalletDetail?.success &&
        response.data.userWalletDetail.data?.data
      ) {
        return {
          success: true,
          data: response.data.userWalletDetail.data.data,
          status: 200,
          error: null,
        };
      }
      return {
        success: false,
        data: [],
        status: response.status || 500,
        error: response.data?.userWalletDetail?.message || "Failed to fetch admin wallet history",
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // New export endpoints for wallet logs
  // Export PD Wallet Logs to Excel
async exportPdWalletLogs(
token: string, payload: { start_date: string; end_date: string; }): Promise<ApiResponse<Blob>> {

  if (!token) {
    return {
      success: false,
      data: null,
      status: null,
      error: "Authentication token is missing. Please log in again.",
    };
  }

  const url = `${BASE_URL}/api/admin/export-pd-walletlogs`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || errorData.message || "An unknown error occurred.";
      return {
        success: false,
        data: null,
        status: response.status,
        error: errorMessage,
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
      status: response.status,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: null,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
},

// Export Admin Wallet Logs to Excel
async exportAdminWalletLogs(
token: string, payload: { start_date: string; end_date: string; }): Promise<ApiResponse<Blob>> {
 
  if (!token) {
    return {
      success: false,
      data: null,
      status: null,
      error: "Authentication token is missing. Please log in again.",
    };
  }

  const url = `${BASE_URL}/api/admin/export-admin-walletlogs`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || errorData.message || "An unknown error occurred.";
      return {
        success: false,
        data: null,
        status: response.status,
        error: errorMessage,
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
      status: response.status,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: null,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
},

// Export Chauffeur Wallet Logs to Excel
async exportChauffeurWalletLogs(
token: string, payload: { start_date: string; end_date: string; }): Promise<ApiResponse<Blob>> {
 
  if (!token) {
    return {
      success: false,
      data: null,
      status: null,
      error: "Authentication token is missing. Please log in again.",
    };
  }

  const url = `${BASE_URL}/api/admin/export-chauffeur-walletlogs`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || errorData.message || "An unknown error occurred.";
      return {
        success: false,
        data: null,
        status: response.status,
        error: errorMessage,
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
      status: response.status,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: null,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
},
// Export Chauffeur Tip Wallet Logs to Excel
async exportChauffeurTipWalletLogs(
token: string, payload: { start_date: string; end_date: string; }): Promise<ApiResponse<Blob>> {
 
  if (!token) {
    return {
      success: false,
      data: null,
      status: null,
      error: "Authentication token is missing. Please log in again.",
    };
  }

  const url = `${BASE_URL}/api/admin/export-chauffeur-tip-walletlogs`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || errorData.message || "An unknown error occurred.";
      return {
        success: false,
        data: null,
        status: response.status,
        error: errorMessage,
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
      status: response.status,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: null,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
},

  getPdWalletById: async (
  token: string,
  payload: GetPdWalletByIdPayload
): Promise<ApiResponse<PdWalletByIdDetail[]>> => {
  try {
    if (!token) throw new Error("Authorization token is required.");
    const url = `${BASE_URL}/api/admin/get-pd-wallet-by-id`;
    const response: ApiResponse<PdWalletByIdApiResponse> = await apiPostFetcher(url, payload, token);

    if (response.success && response.data?.success && response.data.data?.transItems?.pdWalletRec) {
      return {
        success: true,
        data: response.data.data.transItems.pdWalletRec,
        status: 200,
        error: null,
      };
    }
    return {
      success: false,
      data: [],
      status: response.status || 500,
      error: response.data?.message || "Failed to fetch PD wallet by ID",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      status: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
},
};

export { walletService };
