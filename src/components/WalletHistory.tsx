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
import { walletService, WalletBalanceDetail } from "@/utils/WalletService";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import CustomerSearch, { Customer } from "./CustomerSearch";

// Pagination UI components
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Empty } from "antd";

export default function WalletDetailsPage() {
  const [wallets, setWallets] = useState<WalletBalanceDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [searchQuery,setSearchQuery] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // No default date range – user must select one.
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);

    let utcStartDate = "";
    let utcEndDate = "";
    if (dateRange?.from) {
      const start = new Date(dateRange.from);
      start.setHours(0, 1, 0, 0); // 12:01 AM local time
      utcStartDate = start.toISOString();
    }
    if (dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999); // 11:59 PM local time
      utcEndDate = end.toISOString();
    }
    

    const payload = {
      start_date: utcStartDate,
      end_date: utcEndDate,
      customer_id: selectedCustomer ? selectedCustomer.id.toString() : "",
      page: currentPage,
      limit: 10,
      search_string: searchQuery,
    };

    const token = localStorage.getItem("authToken") || "";
    if (!token) {
      setError("Authorization token is missing.");
      setLoading(false);
      return;
    }

    const response = await walletService.getUserWalletHistory(token, payload);
    if (response.success && response.data) {
      setWallets(response.data.data);
      setTotalPages(response.data.totalPages || 1);
    } else {
      setError(response.error || "Failed to fetch wallet details.");
      setWallets([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
  }, [searchQuery, dateRange, selectedCustomer, currentPage]);

  const getPaginationItems = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  // Helper to display a field or "N/A" if empty.
  const displayValue = (value: any) => {
    return value || value === 0 ? value : "N/A";
  };

  
  return (
    <div className="w-full p-6 rounded-xl shadow-sm">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="flex flex-col gap-4 mt-4 md:mt-0 md:flex-row md:items-center">
         
            {/* Search Input */}
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-64"
          />
           <div className="w-full md:w-64">
            <CustomerSearch
              value={customerSearch}
              onChange={(newValue) => {
                setCustomerSearch(newValue);
                if (!newValue) setSelectedCustomer(null);
                setCurrentPage(1);
              }}
              onCustomerSelect={(customer) => {
                setSelectedCustomer(customer);
                setCustomerSearch(`${customer.first_name} ${customer.last_name}`);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="relative w-full max-w-md md:w-80">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Popover>
              <PopoverTrigger asChild>
                <Input
                  readOnly
                  value={
                    dateRange && dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
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
                    if (!range || !range.from) return;
                    setDateRange({ from: range.from, to: range.to || range.from });
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
      </div>

      {/* Table Section */}
      <div className="rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Transaction Date
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                User (ID - Name)
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Ride ID
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Top Up Amount
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Adjusted Ride Amount
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Amount To Be Paid
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Rate Type
              </TableCell>
            
             
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Payment Type
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Status
              </TableCell>
              <TableCell className="py-3 px-2 text-left text-sm font-semibold text-black">
                Wallet Balance
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b border-gray-200">
                  {Array.from({ length: 13 }).map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-4 px-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : wallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center">
                  <div className="text-gray-500">
                    <Empty description="No wallet details found" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((wallet, idx) => (
                <TableRow
                  key={`${wallet.user_id}-${wallet.ride_id}-${idx}`}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {wallet.transaction_date
                      ? new Date(wallet.transaction_date).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {wallet.user_id && wallet.User
                      ? `${displayValue(wallet.user_id)} - ${displayValue(wallet.User.first_name)} ${displayValue(wallet.User.last_name)}`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {displayValue(wallet.ride_id)}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {displayValue(wallet.top_up_amount)}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {displayValue(wallet.adjusted_ride_amount)}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {displayValue(wallet.amount_to_be_paid)}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {displayValue(wallet.rate_type)}
                  </TableCell>
                 
          
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {wallet.PaymentType?.name
                      ? displayValue(wallet.PaymentType.name)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {wallet.Status?.name
                      ? displayValue(wallet.Status.name)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-gray-900">
                    {displayValue(wallet.wallet_balance)}
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
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
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
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
