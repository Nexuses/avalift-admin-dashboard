
"use client";

import { useState, useEffect } from "react";
import RevenueService from "@/utils/revenueService";
import DriverService from "@/utils/driverService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wallet, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PresetCalendar from "./PresetCalendar";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty } from "antd";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FiRefreshCcw, FiDownload } from "react-icons/fi";
import { toast } from "sonner";

// ### Interfaces
interface PaymentMethods {
  Cash: number;
  Card: number;
  Wallet: number;
  POS?: number;
  ApplePay?: number;
}

interface FinalPriceCalculation {
  mandatory_charges: {
    total: number;
    breakdown: Record<string, unknown>;
  };
  total_after_discount: number;
  appliedCoupons: any[];
  rates: {
    base_fare: number;
    per_hour: number;
    half_day: number;
    per_min: number;
    full_day: number;
  };
  vat: number;
  final_total_amount: number;
  tip_amount?: number;
  base_fare: number;
  estimated_total_amount: number;
  previous_balance: number;
  couponErrors: any[];
  other_charges: {
    total: number;
    breakdown: Record<string, unknown>;
  };
  isCouponApplied: boolean;
  coupon_discount: number;
}

interface Ride {
  previous_balance: number;
  chauffeur_name: string;
  SK: string;
  status: string;
  ride_type: string;
  estimated_time_in_minutes: number;
  estimated_amount: number;
  paymentDetails: {
    payment_method: string;
    card: any;
  };
  requested_drop_point: string;
  lower_chauffeur_name: string;
  vehicleDetails: {
    color: string;
    vehicle_id: string;
    make: string;
    brand: string;
  };
  final_price_calculation?: FinalPriceCalculation;
  requested_pickup_point?: string;
  customer_name: string;
  order_date?: string; // Created date
  end_date?: string;   // Ride end date
  end_time?: string;   // Added to fix compile error
}

interface PaginatedRides {
  totalRides: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  data: Ride[];
}

interface RevenueData {
  totalRevenue: number;
  totalTip: number;
  totalAmountWithoutTip: number;
  paymentMethods: PaymentMethods;
  rides: PaginatedRides;
}

interface RevenueStat {
  title: string;
  value: string;
  icon: JSX.Element;
}

// ### Helper Functions
const transformRides = (ridesData: any): PaginatedRides => {
  if (Array.isArray(ridesData)) {
    return {
      totalRides: ridesData.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: ridesData.length,
      data: ridesData.map((ride: any) => ({
        ...ride,
        customer_name: ride.customer_name || "N/A",
        order_date: ride.order_date || undefined,
        end_date: ride.end_date || ride.order_date || undefined,
        previous_balance: ride.final_price_calculation?.previous_balance ?? ride.previous_balance ?? 0, // Extract previous_balance
      })),
    };
  }
  return {
    totalRides: ridesData.totalRides,
    totalPages: ridesData.totalPages,
    currentPage: ridesData.currentPage,
    pageSize: ridesData.pageSize,
    data: (ridesData.data || []).map((ride: any) => ({
      ...ride,
      customer_name: ride.customer_name || "N/A",
      order_date: ride.order_date || undefined,
      end_date: ride.end_date || ride.order_date || undefined,
      previous_balance: ride.final_price_calculation?.previous_balance ?? ride.previous_balance ?? 0, // Extract previous_balance
    })),
  };
};

function truncateText(text: string, limit: number = 20): string {
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

function getStartDateUTC(date: Date): string {
  const startLocal = new Date(date);
  startLocal.setHours(0, 1, 0, 0); // 12:01 AM local time
  return startLocal.toISOString();
}

function getEndDateUTC(date: Date): string {
  const endLocal = new Date(date);
  endLocal.setHours(23, 59, 0, 0); // 11:59 PM local time
  return endLocal.toISOString();
}

// ### Main Component
export default function RevenueReport() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formattedToday = format(today, "yyyy-MM-dd");
  const formattedMonthStart = format(startOfMonth, "yyyy-MM-dd");

  // ### Default Values
  const defaultDateRange: DateRange = { from: startOfMonth, to: today };
  const defaultChauffeur = "";
  const defaultPage = 1;
  const defaultReportType = false;

  // Synchronously read allowedOrganization from localStorage.
  // Mark as "organization only" if allowedOrg is NOT "1" or "*"
  const allowedOrg =
    typeof window !== "undefined" ? localStorage.getItem("allowedOrganization") : null;
  const initialOrgOnly =
    allowedOrg && allowedOrg !== "1" && allowedOrg !== "*" ? true : false;

  // ### State Declarations
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [chauffeurList, setChauffeurList] = useState<any[]>([]);
  const [chauffeurFilter, setChauffeurFilter] = useState<string>(defaultChauffeur);
  // Show credited if organization is forced; else use defaultReportType
  const [showCredited, setShowCredited] = useState<boolean>(
    initialOrgOnly ? true : defaultReportType
  );
  const [page, setPage] = useState<number>(defaultPage);
  const [pageSize] = useState<number>(10);

  // Force organization report if allowedOrg is not "1" or "*"
  const [isOrganizationOnlyReport] = useState<boolean>(initialOrgOnly);

  // Export-specific states
  const [exportFromDate, setExportFromDate] = useState<Date | undefined>(undefined);
  const [exportToDate, setExportToDate] = useState<Date | undefined>(undefined);
  // Chauffeur selection in export will be shown only if allowedOrg is "1" or "*"
  const [exportChauffeurId, setExportChauffeurId] = useState<string>("");
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [isExportFromDatePickerOpen, setIsExportFromDatePickerOpen] = useState(false);
  const [isExportToDatePickerOpen, setIsExportToDatePickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // ### Effects

  // Fetch chauffeur list
  useEffect(() => {
    const fetchChauffeurs = async () => {
      try {
        const result = await DriverService.fetchIndividualDrivers();
        if (result.success && result.data) {
          setChauffeurList(result.data);
        } else {
          setError(result.error || "Failed to fetch chauffeur list.");
        }
      } catch {
        setError("Error fetching chauffeur list.");
      }
    };
    fetchChauffeurs();
  }, []);

  // Initial data fetch using the correct report type based on isOrganizationOnlyReport
  useEffect(() => {
    if (isOrganizationOnlyReport) {
      fetchCreditedData(formattedMonthStart, formattedToday, undefined, defaultPage);
    } else {
      fetchRevenueData(formattedMonthStart, formattedToday, undefined, defaultPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrganizationOnlyReport]);

  // ### Data Fetching Functions
  const fetchRevenueData = async (
    startDate: string,
    endDate: string,
    chauffeurId?: number,
    pageNumber: number = 1
  ) => {
    setLoading(true);
    try {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const utcStartDate = getStartDateUTC(startDateObj);
      const utcEndDate = getEndDateUTC(endDateObj);
      const payload = {
        chauffeur_id: chauffeurId,
        start_date: utcStartDate,
        end_date: utcEndDate,
        pageNumber: pageNumber,
        pageSize: pageSize,
      };
      const response = await RevenueService.fetchRevenueReport(payload);
      if (response.success && response.data) {
        setRevenue({
          totalRevenue: response.data.totalRevenue || 0,
          totalTip: response.data.totalTip || 0,
          totalAmountWithoutTip: response.data.totalAmountWithoutTip || 0,
          paymentMethods: {
            Cash: response.data.paymentMethods.Cash || 0,
            Card: response.data.paymentMethods.Card || 0,
            Wallet: response.data.paymentMethods.Wallet || 0,
            POS: response.data.paymentMethods.POS || 0,
            ApplePay: response.data.paymentMethods["Apple-Pay"] || 0,
          },
          rides: transformRides(response.data.rides),
        });
        setError(null);
      } else {
        throw new Error(response.error || "Failed to fetch revenue data.");
      }
    } catch (err: any) {
      setError(err.message);
      setRevenue(null);
    }
    setLoading(false);
  };

  const fetchCreditedData = async (
    startDate: string,
    endDate: string,
    chauffeurId?: number,
    pageNumber: number = 1
  ) => {
    setLoading(true);
    try {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const utcStartDate = getStartDateUTC(startDateObj);
      const utcEndDate = getEndDateUTC(endDateObj);
      const payload: any = {
        chauffeur_id: chauffeurId,
        start_date: utcStartDate,
        end_date: utcEndDate,
        pageNumber: pageNumber,
        pageSize: pageSize,
      };
      const allowedOrganization = localStorage.getItem("allowedOrganization");
      if (allowedOrganization && allowedOrganization !== "1" && allowedOrganization !== "*") {
        payload.organization_id = Number(allowedOrganization);
      } else {
        payload.organization_id = "";
      }
      const response = await RevenueService.fetchCreditedRides(payload);
      if (response.success && response.data) {
        setRevenue({
          totalRevenue: response.data.totalRevenue || 0,
          totalTip: response.data.totalTip || 0,
          totalAmountWithoutTip: response.data.totalAmountWithoutTip || 0,
          paymentMethods: {
            Cash: response.data.paymentMethods.Cash || 0,
            Card: response.data.paymentMethods.Card || 0,
            Wallet: response.data.paymentMethods.Wallet || 0,
            POS: response.data.paymentMethods.POS || 0,
            ApplePay: response.data.paymentMethods["Apple-Pay"] || 0,
          },
          rides: transformRides(response.data.rides),
        });
        setError(null);
      } else {
        throw new Error(response.error || "Failed to fetch credited rides.");
      }
    } catch (err: any) {
      setError(err.message);
      setRevenue(null);
    }
    setLoading(false);
  };

  // ### Event Handlers
  const toggleData = (checked: boolean) => {
    if (isOrganizationOnlyReport) return; // Prevent toggling when not allowed
    setShowCredited(checked);
    setDateRange(defaultDateRange);
    setChauffeurFilter(defaultChauffeur);
    setPage(defaultPage);
    if (checked) {
      fetchCreditedData(formattedMonthStart, formattedToday, undefined, defaultPage);
    } else {
      fetchRevenueData(formattedMonthStart, formattedToday, undefined, defaultPage);
    }
  };

  const handleSearch = () => {
    if (dateRange?.from && dateRange?.to) {
      setPage(defaultPage);
      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");
      const chauffeurId =
        !isOrganizationOnlyReport && chauffeurFilter ? parseInt(chauffeurFilter) : undefined;
      if (isOrganizationOnlyReport || showCredited) {
        fetchCreditedData(startDate, endDate, chauffeurId, defaultPage);
      } else {
        fetchRevenueData(startDate, endDate, chauffeurId, defaultPage);
      }
      setOpenCalendar(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const startDate = format(dateRange.from!, "yyyy-MM-dd");
    const endDate = format(dateRange.to!, "yyyy-MM-dd");
    const chauffeurId =
      !isOrganizationOnlyReport && chauffeurFilter ? parseInt(chauffeurFilter) : undefined;
    if (isOrganizationOnlyReport || showCredited) {
      fetchCreditedData(startDate, endDate, chauffeurId, newPage);
    } else {
      fetchRevenueData(startDate, endDate, chauffeurId, newPage);
    }
  };

  const getPaginationItems = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const totalPages = revenue?.rides.totalPages || 1;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const handleRefresh = () => {
    setDateRange(defaultDateRange);
    setChauffeurFilter(defaultChauffeur);
    if (isOrganizationOnlyReport) {
      setShowCredited(true);
      fetchCreditedData(formattedMonthStart, formattedToday, undefined, defaultPage);
    } else {
      setShowCredited(defaultReportType);
      fetchRevenueData(formattedMonthStart, formattedToday, undefined, defaultPage);
    }
  };

  const handleExport = async () => {
    if (!exportFromDate || !exportToDate) {
      toast.error("Please select both from and to dates.");
      return;
    }
    setIsExporting(true);
    const utcStartDate = getStartDateUTC(exportFromDate);
    const utcEndDate = getEndDateUTC(exportToDate);
    const chauffeurId =
      !isOrganizationOnlyReport && exportChauffeurId ? parseInt(exportChauffeurId) : undefined;
    const payload = {
      start_date: utcStartDate,
      end_date: utcEndDate,
      chauffeur_id: chauffeurId,
      status: isOrganizationOnlyReport || showCredited,
    };
    try {
      const response = await RevenueService.exportRevenueRidesToExcel(payload);
      if (response.success && response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "revenue_rides.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(response.error || "Failed to export rides to Excel");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("An error occurred while exporting data.");
    } finally {
      setIsExporting(false);
    }
  };

  // ### Revenue Stats
  const revenueStats: RevenueStat[] = !isOrganizationOnlyReport ? [
    {
      title: "Cash",
      value: `AED ${(revenue?.paymentMethods.Cash || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Card",
      value: `AED ${(revenue?.paymentMethods.Card || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Wallet",
      value: `AED ${(revenue?.paymentMethods.Wallet || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
    // {
    //   title: "POS",
    //   value: `AED ${(revenue?.paymentMethods.POS || 0).toFixed(2)}`,
    //   icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    // },
    {
      title: "Apple Pay",
      value: `AED ${(revenue?.paymentMethods.ApplePay || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Total Revenue",
      value: `AED ${(revenue?.totalRevenue || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Tip",
      value: `AED ${(revenue?.totalTip || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Net Revenue",
      value: `AED ${(revenue?.totalAmountWithoutTip || 0).toFixed(2)}`,
      icon: <Wallet className="h-6 w-6 text-muted-foreground" />,
    },
  ] : [];

  // ### Render
  return (
    <div>
      {/* Search Section */}
      <div className="mb-4">
        <div className="w-full flex items-center">
          <div className="flex flex-wrap items-center space-x-4">
            <div className="w-full sm:w-auto">
              <label className="block text-black font-medium mb-1">Date Range:</label>
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="lg" className="w-auto justify-start px-3 py-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      <>
                        {format(dateRange.from, "PPP")} -{" "}
                        {dateRange?.to
                          ? format(dateRange.to, "PPP")
                          : format(dateRange.from, "PPP")}
                      </>
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <PresetCalendar
                    selected={dateRange}
                    onSelect={(range) => {
                      if (!range?.from) return;
                      setDateRange({ from: range.from, to: range.to || range.from });
                      if (range?.to) {
                        setOpenCalendar(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Chauffeur Selection shown only when allowedOrg is "1" or "*" */}
            {!isOrganizationOnlyReport && (
              <div className="w-full sm:w-auto">
                <label htmlFor="chauffeur-select" className="block text-black font-medium mb-1">
                  Chauffeur:
                </label>
                <select
                  id="chauffeur-select"
                  value={chauffeurFilter}
                  onChange={(e) => setChauffeurFilter(e.target.value)}
                  className="border rounded p-2 text-black"
                >
                  <option value="">All</option>
                  {chauffeurList.map((chauffeur: any) => (
                    <option key={chauffeur.id} value={chauffeur.id}>
                      {chauffeur.id} - {chauffeur.first_name} {chauffeur.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button className="bg-blue-500 text-white py-2 px-4 rounded mt-6" onClick={handleSearch}>
              Search
            </Button>
            <Button
              variant="outline"
              className="flex items-center bg-blue-500 rounded text-white py-2 px-4 mt-6"
              onClick={handleRefresh}
            >
              <FiRefreshCcw className="mr-2" />
              Refresh
            </Button>
            {/* New Export Popover */}
            {!isOrganizationOnlyReport && (
            <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button disabled={isExporting} className="bg-green-500 text-white py-2 px-4 rounded mt-6">
                  <FiDownload className="mr-2" /> Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="flex flex-col space-y-4">
                  <h3 className="font-semibold">
                    Select Date Range
                    {!isOrganizationOnlyReport && " and Chauffeur"} for Export
                  </h3>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    {/* From Date Picker */}
                    <Popover open={isExportFromDatePickerOpen} onOpenChange={setIsExportFromDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-40 justify-start">
                          {exportFromDate ? format(exportFromDate, "PPP") : "From Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={exportFromDate}
                          onSelect={(date) => {
                            setExportFromDate(date);
                            setIsExportFromDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {/* To Date Picker */}
                    <Popover open={isExportToDatePickerOpen} onOpenChange={setIsExportToDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-40 justify-start">
                          {exportToDate ? format(exportToDate, "PPP") : "To Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={exportToDate}
                          onSelect={(date) => {
                            setExportToDate(date);
                            setIsExportToDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Chauffeur Selection for Export – only if allowedOrg is "1" or "*" */}
                  {!isOrganizationOnlyReport && (
                    <div>
                      <label htmlFor="export-chauffeur-select" className="block text-black font-medium mb-1">
                        Chauffeur:
                      </label>
                      <select
                        id="export-chauffeur-select"
                        value={exportChauffeurId}
                        onChange={(e) => setExportChauffeurId(e.target.value)}
                        className="border rounded p-2 text-black w-full"
                      >
                        <option value="">All</option>
                        {chauffeurList.map((chauffeur) => (
                          <option key={chauffeur.id} value={chauffeur.id}>
                            {chauffeur.id} - {chauffeur.first_name} {chauffeur.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setIsExportPopoverOpen(false);
                      handleExport();
                    }}
                    disabled={!exportFromDate || !exportToDate || isExporting}
                    className="bg-green-500 text-white"
                  >
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
          {/* Render Toggle Only if not forced to organization report */}
          {!isOrganizationOnlyReport && (
            <div className="ml-auto flex items-center space-x-2">
              <Switch id="switch-credited" checked={showCredited} onCheckedChange={toggleData} />
              <Label htmlFor="switch-credited" className="text-black font-medium">
                {showCredited ? "Show Revenue Report" : "Organization Report"}
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array(revenueStats.length || 4)
            .fill(null)
            .map((_, index) => (
              <Card key={index} className="p-4 animate-pulse">
                <CardHeader className="p-2 flex justify-between items-center">
                  <div className="bg-gray-300 h-6 w-24 rounded"></div>
                  <div className="bg-gray-300 h-6 w-6 rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-300 h-10 w-16 mb-2 rounded"></div>
                  <div className="bg-gray-300 h-6 w-32 rounded"></div>
                </CardContent>
              </Card>
            ))
        ) : error ? (
          <div className="col-span-4 flex items-center text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="ml-2">{error}</span>
          </div>
        ) : (
          revenueStats.map(({ title, value, icon }, index) => (
            <Card key={index} className="p-4">
              <CardHeader className="p-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  <div>{icon}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ride Details Table */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">
          {isOrganizationOnlyReport ? "Ride Table" : "Ride Details"}
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold">Ride ID</TableCell>
                <TableCell className="font-semibold">End Date</TableCell>
                {/* <TableCell className="font-semibold">Type</TableCell> */}
                <TableCell className="font-semibold">Customer Name</TableCell>
                <TableCell className="font-semibold">Chauffeur</TableCell>
                <TableCell className="font-semibold">Pickup Point</TableCell>
                <TableCell className="font-semibold">Drop Point</TableCell>
                <TableCell className="font-semibold">Tip</TableCell>
                <TableCell className="font-semibold">Final Amount</TableCell>
                <TableCell className="font-semibold">Payment Method</TableCell>
                <TableCell className="font-semibold">Adjusted Amount</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!loading && revenue && revenue.rides.data.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    <Empty description="No data available" />
                  </TableCell>
                </TableRow>
              ) : (
                revenue?.rides.data.map((ride) => {
                  const chosenDateIso = ride.end_time || ride.order_date || undefined;
                  const chosenDateFormatted = chosenDateIso
                    ? format(new Date(chosenDateIso), "dd/MM/yyyy")
                    : "N/A";
                  // const chosenLabel = ride.end_time ? "End" : "Created";
                  return (
                  <TableRow key={ride.SK}>
                    <TableCell>{ride.SK || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{chosenDateFormatted}</span>
                        {/* <span className="text-[10px] text-gray-500">({chosenLabel})</span> */}
                      </div>
                    </TableCell>
                    {/* <TableCell>{ride.ride_type || "N/A"}</TableCell> */}
                    <TableCell>{ride.customer_name || "N/A"}</TableCell>
                    <TableCell>{ride.chauffeur_name || "N/A"}</TableCell>
                    <TableCell>
                      {ride.requested_pickup_point
                        ? truncateText(ride.requested_pickup_point, 15)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {ride.requested_drop_point
                        ? truncateText(ride.requested_drop_point, 15)
                        : "N/A"}
                    </TableCell>

                    <TableCell>{ride.final_price_calculation?.tip_amount|| "N/A"}</TableCell>

                    <TableCell className="font-bold text-green-600 flex items-center ">
                      <div className="text-end w-20">
                        {ride.final_price_calculation?.final_total_amount !== undefined
                          ? Number(ride.final_price_calculation.final_total_amount).toFixed(2)
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{ride.paymentDetails.payment_method || "N/A"}</TableCell>
                    <TableCell className="font-bold text-red-600 flex items-center ">
                      <div className="text-end w-20">
                        {ride.previous_balance || "0"}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {revenue && revenue.rides.totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
                {getPaginationItems().map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationEllipsis key={index} />
                  ) : (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={item === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(item as number);
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
                    if (page < (revenue?.rides.totalPages || 1)) {
                      handlePageChange(page + 1);
                    }
                  }}
                  className={page === (revenue?.rides.totalPages || 1) ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
