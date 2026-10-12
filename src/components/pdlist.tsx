"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationComponent } from "./PaginationComponent";
import { FiEdit } from "react-icons/fi";
import { UpdatePDDrawer } from "./UpdatePD";
import { Empty, Spin, Modal } from "antd";
import { Button } from "@/components/ui/button";
import PDService from "@/utils/pdService";
import { toast } from "sonner";

interface Document {
  name: string;
  url: string;
}

interface Pd {
  id: number;
  documents?: Document[];
  country_code: string;
  mobile_number: string;
  email_id: string | null;
  first_name: string;
  last_name: string;
  type_id: number;
  role_id: number;
  is_active: boolean;
  status_id: number | null;
  device_id: string | null;
  createdAt: string;
  updatedAt: string;
  emirates_id: string;
  emiratesId_validity: string;
  licence_number: string;
  licence_validity: string;
}

interface PdTableProps {
  searchTerm: string;
  pds: Pd[];
  loading: boolean;
  error: string | null;
  onPDUpdated?: (updatedPd: Pd) => void;
  isOperator?: boolean;
}

export function PdTable({
  searchTerm,
  pds,
  loading,
  error,
  onPDUpdated,
  isOperator = false,
}: PdTableProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 15;
  const [selectedPd, setSelectedPd] = useState<Pd | null>(null);
  const [localPd, setLocalPd] = useState<Pd[]>(pds);
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [pdToToggle, setPdToToggle] = useState<Pd | null>(null);

  useEffect(() => {
    setLocalPd(pds);
  }, [pds]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return localPd;
    const lowerSearch = searchTerm.toLowerCase();
    return localPd.filter(
      (pd) =>
        pd.first_name.toLowerCase().includes(lowerSearch) ||
        pd.last_name.toLowerCase().includes(lowerSearch) ||
        pd.id.toString().includes(lowerSearch) ||
        (pd.email_id && pd.email_id.toLowerCase().includes(lowerSearch)) ||
        pd.mobile_number.includes(lowerSearch)
    );
  }, [localPd, searchTerm]);

  const paginatedData = filteredData.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );

  const handleEdit = (pd: Pd) => {
    setSelectedPd({ ...pd, documents: pd.documents ?? [] });
    setIsUpdateDrawerOpen(true);
  };

  const handleShowDocument = (doc: Document) => {
    window.open(doc.url, "_blank");
  };

  const handleToggleActive = (pd: Pd) => {
    setPdToToggle(pd);
    setIsConfirmModalOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!pdToToggle) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.warning("Authentication token is missing.");
      setIsConfirmModalOpen(false);
      return;
    }

    try {
      const response = await PDService.toggleUserActiveStatus(
        pdToToggle.id,
        token,
        !pdToToggle.is_active // ✅ sends target state
      );      
      if (response.success && response.data) {
        const updatedPd = {
          ...pdToToggle,
          is_active: response.data.user_availability,
        };
        setLocalPd((prev) =>
          prev.map((p) => (p.id === pdToToggle.id ? updatedPd : p))
        );
        if (onPDUpdated) {
          onPDUpdated(updatedPd);
        }
        toast.success(`PD ${response.data.user_availability ? "enabled" : "disabled"} successfully!`);
      } else {
        toast.error(`Failed to toggle PD status: ${response.error || "Unknown error"}`);
      }
    } catch (error) {
      toast.error(
        `Error toggling PD status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsConfirmModalOpen(false);
      setPdToToggle(null);
    }
  };

  return (
    <div className="w-full p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">ID</TableCell>
            <TableCell className="font-semibold">Name</TableCell>
            <TableCell className="font-semibold">Mobile</TableCell>
            <TableCell className="font-semibold">Email</TableCell>
            <TableCell className="font-semibold">Documents</TableCell>
            <TableCell className="font-semibold">Status</TableCell>
            {!isOperator && <TableCell className="font-semibold">Actions</TableCell>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                <Spin />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-red-500 py-4">
                {error}
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                <Empty description="No data available" />
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => {
              const fullName = `${row.first_name} ${row.last_name}`;
              const displayName =
                fullName.length > 20 ? `${fullName.slice(0, 20)}...` : fullName;
              return (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{displayName}</TableCell>
                  <TableCell>
                    {row.country_code} {row.mobile_number}
                  </TableCell>
                  <TableCell>
                    {row.email_id
                      ? row.email_id.length > 20
                        ? `${row.email_id.slice(0, 20)}...`
                        : row.email_id
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {row.documents && row.documents.length > 0 ? (
                      row.documents.map((doc, index) => {
                        const displayDocName =
                          doc.name.length > 20 ? `${doc.name.slice(0, 20)}...` : doc.name;
                        return (
                          <div key={index}>
                            <span
                              onClick={() => handleShowDocument(doc)}
                              className="cursor-pointer text-blue-500 underline"
                            >
                              {displayDocName}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      "No document"
                    )}
                  </TableCell>
                  <TableCell>{row.is_active ? "Active" : "Inactive"}</TableCell>
                  {!isOperator && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label="Edit PD"
                        >
                          <FiEdit size={20} />
                        </button>
                        <Button
                          onClick={() => handleToggleActive(row)}
                          variant={row.is_active ? "destructive" : "default"}
                          size="sm"
                          aria-label={row.is_active ? "Disable PD" : "Enable PD"}
                        >
                          {row.is_active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <PaginationComponent
        totalItems={filteredData.length}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {isUpdateDrawerOpen && selectedPd && (
        <UpdatePDDrawer
          pd={{ ...selectedPd, documents: selectedPd?.documents ?? [] }}
          isOpen={isUpdateDrawerOpen}
          onClose={() => {
            setIsUpdateDrawerOpen(false);
            setSelectedPd(null);
          }}
          onPDUpdated={(updatedPd) => {
            if (onPDUpdated) {
              onPDUpdated(updatedPd);
            }
            setIsUpdateDrawerOpen(false);
            setSelectedPd(null);
          }}
        />
      )}

      <Modal
        title="Confirm Status Change"
        open={isConfirmModalOpen}
        onOk={confirmToggleActive}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setPdToToggle(null);
        }}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to{" "}
          {pdToToggle?.is_active ? "disable" : "enable"} the PD{" "}
          {pdToToggle ? `${pdToToggle.first_name} ${pdToToggle.last_name}` : ""}?
        </p>
      </Modal>
    </div>
  );
}