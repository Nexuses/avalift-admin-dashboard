import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PaginationComponent } from "./PaginationComponent";
import { Button } from "@/components/ui/button";
import { ArrowBigRight } from "lucide-react";
import { Empty, Spin } from "antd";
import { walletService } from "@/utils/WalletService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RefreshCcw } from "lucide-react";

type TipWalletRow = {
  id: number;
  chauffeur_id: number;
  balance: string;
  Chauffeur?: { id: number; first_name?: string; last_name?: string };
};

export function TipWalletHistoryPage() {
  const [data, setData] = useState<TipWalletRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 15;
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [searchString, setSearchString] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const navigate = useNavigate();
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState<TipWalletRow | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [fullAmount, setFullAmount] = useState<boolean>(false);
  const [payoutLoading, setPayoutLoading] = useState<boolean>(false);

  // Auto-fetch data on mount and when page changes
  useEffect(() => {
    fetchWalletBalances(currentPage);
  }, [currentPage]);

  // Handle navigation to details page (reuse existing cash handling details page)
  const handleNavigate = (chauffeurId: number) => {
    navigate(`/admin/dashboard/TipWalletDetails?chauffeurId=${chauffeurId}`);
  };

  const fetchWalletBalances = async (pageOverride?: number, limitOverride?: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") || "";
      if (!token) {
        toast.error("No authorization token found.");
        setLoading(false);
        return;
      }
      const payload = {
        searchString,
        fromDate,
        toDate,
        page: (pageOverride ?? currentPage) + 1,
        limit: limitOverride ?? rowsPerPage,
      };

      const response = await walletService.getChauffeurTipWalletBalances(token, payload);
      if (response.success && response.data) {
        setData(response.data.wallets || []);
        setTotalRecords(response.data.totalRecords || 0);
      } else {
        setError(response.error || "No data available");
      }
    } catch (err) {
      setError("Error fetching tip wallet data.");
    } finally {
      setLoading(false);
    }
  };

  const openPayoutModal = (row: TipWalletRow) => {
    setSelectedChauffeur(row);
    setPayoutAmount(row.balance || "");
    setFullAmount(false);
    setPayoutModalOpen(true);
  };

  const closePayoutModal = () => {
    setPayoutModalOpen(false);
    setSelectedChauffeur(null);
    setPayoutAmount("");
    setFullAmount(false);
  };

  const handleConfirmPayout = async () => {
    if (!selectedChauffeur) {
      toast.error("No chauffeur selected.");
      return;
    }

    const amountValue = fullAmount
      ? parseFloat(selectedChauffeur.balance || "0")
      : parseFloat(payoutAmount || "0");

    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Enter a valid payout amount.");
      return;
    }

    const token = localStorage.getItem("authToken") || "";
    if (!token) {
      toast.error("No authorization token found.");
      return;
    }

    setPayoutLoading(true);
    try {
      const response = await walletService.tipPayout(token, {
        chauffeurId: selectedChauffeur.chauffeur_id,
        amount: amountValue,
      });

      if (response.success) {
        toast.success(response.data?.message || "Payout processed successfully.");
        closePayoutModal();
        setCurrentPage(0);
        fetchWalletBalances(0);
      } else {
        toast.error(response.error || response.data?.message || "Payout failed.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Payout failed.");
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Search Section */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Search by name or ID"
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
          />
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="min-w-[150px]"
            placeholder="From date"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="min-w-[150px]"
            placeholder="To date"
          />
        </div>
        <Button
          onClick={() => {
            setCurrentPage(0);
            fetchWalletBalances(0);
          }}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => fetchWalletBalances(currentPage)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCcw size={16} />
          Refresh
        </Button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-10">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 border-b border-gray-300">
              <TableCell className="px-4 py-2 font-semibold">Chauffeur ID</TableCell>
              <TableCell className="px-4 py-2 font-semibold">Name</TableCell>
              <TableCell className="px-4 py-2 font-semibold">Tip Wallet Balance (AED)</TableCell>
              <TableCell className="px-4 py-2 font-semibold">Action</TableCell>
              <TableCell className="px-4 py-2 font-semibold"></TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <Spin />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-red-500 py-4">
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <Empty description="No data available" />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={`${row.chauffeur_id ?? "unknown"}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNavigate(row.chauffeur_id ?? 0)}
                >
                  <TableCell className="px-4 py-2">{row.chauffeur_id ?? "N/A"}</TableCell>
                  <TableCell className="px-4 py-2">
                    {`${row.Chauffeur?.first_name ?? "N/A"} ${row.Chauffeur?.last_name ?? ""}`.trim()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="text-right w-[5vw]">{row.balance ?? "N/A"}</div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                   
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPayoutModal(row);
                        }}
                      >
                        Payout
                      </Button>
                     
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    
                      <ArrowBigRight
                        className="h-5 w-5 text-gray-500 hover:text-blue-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(row.chauffeur_id ?? 0);
                        }}
                      />
                  
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <PaginationComponent
        totalItems={totalRecords}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <AlertDialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payout</AlertDialogTitle>
            <AlertDialogDescription>
              {`Chauffeur ID: ${selectedChauffeur?.chauffeur_id ?? "N/A"}. Enter payout amount or choose full amount.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fullAmount"
                checked={fullAmount}
                onCheckedChange={(checked) => setFullAmount(Boolean(checked))}
              />
              <Label htmlFor="fullAmount">Full amount</Label>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="payoutAmount">Amount (AED)</Label>
              <Input
                id="payoutAmount"
                type="number"
                value={fullAmount ? selectedChauffeur?.balance ?? "" : payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                disabled={fullAmount}
                min="0"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closePayoutModal}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayout} disabled={payoutLoading}>
              {payoutLoading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TipWalletHistoryPage;
