import React, { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationComponent } from "@/components/PaginationComponent";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { walletService } from "@/utils/WalletService";
import { Spin, Empty } from "antd";
import { format } from "date-fns";
import { toast } from "sonner";

type ChauffeurTipWalletLog = {
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
};

const TipWalletDetailsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const chauffeurIdParam = searchParams.get("chauffeurId");
  const chauffeurId = chauffeurIdParam ? Number(chauffeurIdParam) : null;
  const navigate = useNavigate();

  const [logs, setLogs] = useState<ChauffeurTipWalletLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 15;
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const token = useMemo(() => localStorage.getItem("authToken") || "", []);

  useEffect(() => {
    if (!chauffeurId) {
      setError("Missing chauffeur ID.");
      return;
    }
    fetchLogs(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chauffeurId, currentPage]);

  const fetchLogs = async (pageOverride?: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError("No authorization token found.");
        toast.error("No authorization token found.");
        return;
      }
      const response = await walletService.getChauffeurTipWalletLogsById(token, {
        chauffeurId: chauffeurId ?? 0,
        page: (pageOverride ?? currentPage) + 1,
        limit: rowsPerPage,
      });

      if (response.success && response.data) {
        setLogs(response.data.logs || []);
        setTotalRecords(response.data.totalRecords || 0);
      } else {
        setError(response.error || "No data available");
      }
    } catch (err) {
      setError("Error fetching tip wallet logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Tip Wallet</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Logs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-xl">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold">Tip Wallet Logs</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Chauffeur ID: {chauffeurId ?? "N/A"}
        </p>

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="px-4 py-2 font-semibold">Reference</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Amount (AED)</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Prev Balance</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Current Balance</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Type</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Status</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Description</TableCell>
                <TableCell className="px-4 py-2 font-semibold">Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    <Spin />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-red-500 py-4">
                    {error}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    <Empty description="No data available" />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="px-4 py-2">{log.reference_id}</TableCell>
                    <TableCell className="px-4 py-2">{log.amount}</TableCell>
                    <TableCell className="px-4 py-2">{log.previous_balance}</TableCell>
                    <TableCell className="px-4 py-2">{log.current_balance}</TableCell>
                    <TableCell className="px-4 py-2">{log.transaction_type}</TableCell>
                    <TableCell className="px-4 py-2">{log.status}</TableCell>
                    <TableCell className="px-4 py-2">{log.description || "—"}</TableCell>
                    <TableCell className="px-4 py-2">
                      {log.createdAt ? format(new Date(log.createdAt), "PP p") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationComponent
          totalItems={totalRecords}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default TipWalletDetailsPage;
