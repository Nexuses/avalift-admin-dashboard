"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import PresetCalendar from "./PresetCalendar";
import { DateRange } from "react-day-picker";
import { walletService, CustomerWalletDetail } from "@/utils/WalletService";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

// Import Pagination UI components
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

// Import Switch and Label for toggle functionality
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Empty } from "antd";

export function WalletTable() {
  // State for wallet details, loading, error, and filters.
  const [wallets, setWallets] = useState<CustomerWalletDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Remove the default date range so it’s undefined until a user selects a date.
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Pagination states.
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Toggle state: false = Normal customers, true = Organization customers.
  const [isOrganization, setIsOrganization] = useState<boolean>(false);

  // Fetch wallets with pagination and filters.
  const fetchWallets = async () => {
    setLoading(true);
    setError(null);

    // Only include date filters if a valid date range has been selected.
    let utcStartDate = "";
    let utcEndDate = "";
    if (dateRange && dateRange.from && dateRange.to) {
      const startOfDayLocal = new Date(dateRange.from);
      startOfDayLocal.setHours(0, 1, 0, 0); // 12:01 AM local time
      utcStartDate = startOfDayLocal.toISOString();
    
      const endOfDayLocal = new Date(dateRange.to);
      endOfDayLocal.setHours(23, 59, 0, 0); // 11:59 PM local time
      utcEndDate = endOfDayLocal.toISOString();
    }
    

    const payload: any = {
      page: currentPage,
      limit: 10,
      search_string: searchQuery,
    };

    // Add date filters to payload only if both start and end dates are available.
    if (utcStartDate && utcEndDate) {
      payload.start_date = utcStartDate;
      payload.end_date = utcEndDate;
    }

    const token = localStorage.getItem("authToken") || "";
    if (!token) {
      setError("Authorization token is missing.");
      setLoading(false);
      return;
    }

    const response = await walletService.getUserWallet(token, payload);
    if (response.success && response.data) {
      setWallets(response.data.data);
      setTotalPages(response.data.totalPages || 1);
    } else {
      setError(response.error || "Failed to fetch wallet details.");
      setWallets([]);
    }
    setLoading(false);
  };

  // Refetch whenever search query, date range, or current page changes.
  useEffect(() => {
    fetchWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateRange, currentPage]);

  // Helper function to generate pagination items.
  const getPaginationItems = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  // Filter wallets based on the toggle state.
  const filteredWallets = wallets.filter((wallet) =>
    isOrganization ? wallet.is_org === true : wallet.is_org === false
  );

  return (
    <div className="w-full p-6 rounded-xl shadow-sm">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        {/* Left side: Search and Date Range */}
        <div className="flex flex-col gap-4 mt-4 md:mt-0 md:flex-row md:items-center">
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); 
            }} 
            className="w-full md:w-64"
          />
          <div className="relative w-full max-w-md md:w-80">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Popover>
              <PopoverTrigger asChild>
                <Input
                  readOnly
                  value={
                    dateRange && dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "PPP")} - ${format(
                          dateRange.to,
                          "PPP"
                        )}`
                      : ""
                  }
                  placeholder="Select Date Range"
                  className="w-full cursor-pointer pl-10"
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <PresetCalendar
                  selected={dateRange}
                  onSelect={(range: DateRange | undefined) => {
                    // Only update if a valid start date exists.
                    if (!range || !range.from) return;
                    setDateRange({
                      from: range.from,
                      to: range.to || range.from,
                    });
                    setCurrentPage(1);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={fetchWallets} className="bg-blue-500 rounded">
            Search
          </Button>
        </div>

        {/* Right side: Toggle Switch */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Switch
            id="org-switch"
            checked={isOrganization}
            onCheckedChange={(checked) => setIsOrganization(checked)}
          />
          <Label htmlFor="org-switch">
            {isOrganization ? "Show Customers" : "Show Organization Customers"}
          </Label>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-200 transition-colors">
              <TableCell className="py-3 px-4 text-left text-sm font-semibold text-black">
                User ID
              </TableCell>
              <TableCell className="py-3 px-4 text-left text-sm font-semibold text-black">
                User Name
              </TableCell>
              <TableCell className="py-3 px-4 text-left text-sm font-semibold text-black">
                Wallet Balance
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-b border-gray-200">
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center">
                  <div className="text-gray-500">
                    <p className="font-medium">{error}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center">
                  <div className="text-gray-500">
                    <Empty description="No customer wallets found" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredWallets.map((wallet) => (
                <TableRow
                  key={wallet.user_id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="py-4 px-4 text-sm text-gray-900">
                    {wallet.user_id}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-900">
                    {wallet.User.first_name} {wallet.User.last_name}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-gray-900">
                    <div className="text-right w-[5vw]">{wallet.wallet_balance}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages >= 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                        setCurrentPage(item as number);
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
                    setCurrentPage(currentPage + 1);
                  }
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
