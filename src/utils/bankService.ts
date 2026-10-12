import BASE_URL from "@/config/apiConfig";
import { z } from "zod";

export interface Bank {
  id: number;
  account_number: string;
  bank_name: string;
  iban: string;
  branch_name: string;
  default: boolean;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface GetBanksPayload {
  organization_id?: number;
}

export interface GetBankByIdPayload {
  id: number;
}

export interface AddBankPayload {
  account_number: string;
  bank_name: string;
  iban: string;
  branch_name: string;
  default: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  error?: string;
}

const BankSchema = z.object({
  id: z.number(),
  account_number: z.string(),
  bank_name: z.string(),
  iban: z.string(),
  branch_name: z.string(),
  default: z.boolean(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
});

const ApiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number(),
  data: z.array(BankSchema).or(BankSchema).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export async function fetchBanks<T = Bank[]>(
  payload: GetBanksPayload,
  token: string
): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}/api/admin/get-all-bank-details`);
  if (payload.organization_id) {
    url.searchParams.append("organization_id", payload.organization_id.toString());
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  const parsed = ApiResponseSchema.parse(data);
  return parsed as ApiResponse<T>;
}

export async function fetchBankById(
  payload: GetBankByIdPayload,
  token: string
): Promise<ApiResponse<Bank>> {
  const response = await fetch(`${BASE_URL}/api/admin/get-bank-account-details-by-id`, {
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

  const data = await response.json();
  const parsed = ApiResponseSchema.parse(data);
  return parsed as ApiResponse<Bank>;
}

export async function addBank(
  payload: AddBankPayload,
  token: string
): Promise<ApiResponse<Bank>> {
  const response = await fetch(`${BASE_URL}/api/admin/add-bank-account-details`, {
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

  const data = await response.json();
  const parsed = ApiResponseSchema.parse(data);
  return parsed as ApiResponse<Bank>;
}

export default {
  fetchBanks,
  fetchBankById,
  addBank,
};