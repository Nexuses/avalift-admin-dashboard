import BASE_URL from "@/config/apiConfig";


export interface RevenueData {
  id: number;
  dateTime: string;
  customerName: string;
  driverName: string;
  pickupLocation: string;
  dropLocation: string;
  subTotal: number;
  discount: number;
  vat: number;
  payableAmount: number;
  paymentMode: string;
  invoice: string;
}

export async function getRevenueData(): Promise<RevenueData[]> {
  const response = await fetch(`${BASE_URL}/api/revenue`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch revenue data");
  }

  return response.json(); 
}
