import BASE_URL from "@/config/apiConfig";


export async function getRevenue(searchParams: { dateRange: string; driver: string; customStartDate: string; customEndDate: string; }): Promise<any> {
  const queryParams = new URLSearchParams(searchParams).toString();
  const response = await fetch(`${BASE_URL}/api/revenue?${queryParams}`, {
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
