"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "antd";
import rideService, { Ride, RidesResponse, GetAllRidesPayload } from "@/utils/RideService";

export function AllRidesTableAll() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all rides without any filters.
  const fetchAllRides = async (pageNumber: number) => {
    setLoading(true);
    setError(null);

    const payload: GetAllRidesPayload = {
      status: "",
      search_string: "",
      start_date: undefined,
      end_date: undefined,
      ride_type: "" as any, // Pass empty string to fetch all rides.
      selected_org: "",
    };

    try {
      const response = await rideService.getAllRides(pageNumber, 10, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch rides.");
      }
      const json: RidesResponse = response.data;
      setRides(json.data.rides || []);
      setTotalPages(json.data.totalPages || 1);
      setCurrentPage(json.data.currentPage || pageNumber);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching rides.");
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageIndex: number) => {
    const newPage = pageIndex + 1;
    fetchAllRides(newPage);
  };

  useEffect(() => {
    fetchAllRides(1);
  }, []);

  const getPaginationItems = (): (number | "ellipsis")[] => {
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
    return pages;
  };

  return (
    <div className="w-full p-4">
      {loading ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-semibold">Ride ID</TableCell>
              <TableCell className="font-semibold">Status</TableCell>
              <TableCell className="font-semibold">Pickup Point</TableCell>
              <TableCell className="font-semibold">Drop Point</TableCell>
              <TableCell className="font-semibold">Customer Name</TableCell>
              <TableCell className="font-semibold">Chauffeur ID</TableCell>
              <TableCell className="font-semibold">Estimated Amount</TableCell>
              <TableCell className="font-semibold">Final Amount</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold">Ride ID</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold">Pickup Point</TableCell>
                <TableCell className="font-semibold">Drop Point</TableCell>
                <TableCell className="font-semibold">Customer Name</TableCell>
                <TableCell className="font-semibold">Chauffeur ID</TableCell>
                <TableCell className="font-semibold">Estimated Amount</TableCell>
                <TableCell className="font-semibold">Final Amount</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    <Empty description="No data available" />
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride) => {
                  const estimatedAmount = ride.estimated_amount;
                  const finalAmount =
                    ride.final_price_calculation?.final_total_amount ?? estimatedAmount;
                  return (
                    <TableRow key={ride.ride_id}>
                      <TableCell>{ride.ride_id}</TableCell>
                      <TableCell>{ride.status}</TableCell>
                      <TableCell>{ride.requested_pickup_point || "N/A"}</TableCell>
                      <TableCell>{ride.requested_drop_point || "N/A"}</TableCell>
                      <TableCell>{ride.customer_details?.name || "N/A"}</TableCell>
                      <TableCell>{ride.chauffeur_id ?? "N/A"}</TableCell>
                      <TableCell>AED {estimatedAmount.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        AED {finalAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 2);
                      }
                    }}
                    className={currentPage === 1 ? "disabled" : ""}
                  />
                  {getPaginationItems().map((item, index) =>
                    item === "ellipsis" ? (
                      <PaginationEllipsis key={index} />
                    ) : (
                      <PaginationItem key={index}>
                        <PaginationLink
                          href="#"
                          isActive={item === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange((item as number) - 1);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage);
                      }
                    }}
                    className={currentPage === totalPages ? "disabled" : ""}
                  />
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AllRidesTableAll;
