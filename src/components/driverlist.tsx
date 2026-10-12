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
import { UpdateDriverDrawer } from "./UpdateDriver";
import { Empty, Spin, Modal } from "antd";
import { Button } from "@/components/ui/button";
import DriverService from "@/utils/driverService";
import { toast } from "sonner";

interface Document {
  name: string;
  url: string;
}

interface Driver {
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
  erp_chauffeur_code?: string;
  erp_ac_name_cash?: string;
  erp_ac_code_cash?: string;
  erp_ac_code_online?: string;
  erp_ac_name_online?: string;
}

interface DriverDataTableProps {
  searchTerm: string;
  drivers: Driver[];
  loading: boolean;
  error: string | null;
  onDriverUpdated: (updatedDriver: Driver) => void;
  isOperator?: boolean;
}

export function DriverDataTable({
  searchTerm,
  drivers,
  loading,
  error,
  onDriverUpdated,
  isOperator = false,
}: DriverDataTableProps) {
  const [localDrivers, setLocalDrivers] = useState<Driver[]>(drivers);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [driverToToggle, setDriverToToggle] = useState<Driver | null>(null);
  const rowsPerPage = 15;

  useEffect(() => {
    setLocalDrivers(drivers);
  }, [drivers]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return localDrivers;
    const lowerSearch = searchTerm.toLowerCase();
    return localDrivers.filter(
      (driver) =>
        driver.first_name.toLowerCase().includes(lowerSearch) ||
        driver.last_name.toLowerCase().includes(lowerSearch) ||
        driver.id.toString().includes(lowerSearch) ||
        (driver.email_id && driver.email_id.toLowerCase().includes(lowerSearch)) ||
        driver.mobile_number.includes(lowerSearch) ||
        (driver.erp_chauffeur_code && driver.erp_chauffeur_code.toLowerCase().includes(lowerSearch))
    );
  }, [localDrivers, searchTerm]);

  const paginatedData = filteredData.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );

  const handleEdit = (driver: Driver) => {
    setSelectedDriver({ ...driver, documents: driver.documents ?? [] });
    setIsUpdateDrawerOpen(true);
  };

  const handleShowDocument = (doc: Document) => {
    window.open(doc.url, "_blank");
  };

  const handleToggleActive = async (driver: Driver) => {
    setDriverToToggle(driver);
    setIsConfirmModalOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!driverToToggle) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Authentication token is missing.");
      setIsConfirmModalOpen(false);
      return;
    }

    const enable = !driverToToggle.is_active;
    const response = await DriverService.toggleUserActiveStatus(driverToToggle.id, token, enable);
    if (response.success && response.data) {
      const updatedDriver = {
        ...driverToToggle,
        is_active: response.data.user_availability,
      };
      setLocalDrivers((prev) =>
        prev.map((d) => (d.id === driverToToggle.id ? updatedDriver : d))
      );
      onDriverUpdated(updatedDriver);
      toast.success(`User ${response.data.user_availability ? "enabled" : "disabled"} successfully!`);
    } else {
      toast.error(`Failed to toggle user status: ${response.error}`);
    }
    setIsConfirmModalOpen(false);
    setDriverToToggle(null);
  };

  return (
    <div className="w-full p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">ID</TableCell>
            <TableCell className="font-semibold">Name</TableCell>
            <TableCell className="font-semibold">ERP Code</TableCell>
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
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
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
                  <TableCell>{row.erp_chauffeur_code || "N/A"}</TableCell>
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
                    <TableCell className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FiEdit size={20} />
                      </button>
                      <Button
                        onClick={() => handleToggleActive(row)}
                        variant={row.is_active ? "destructive" : "default"}
                        size="sm"
                      >
                        {row.is_active ? "Disable" : "Enable"}
                      </Button>
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

      {isUpdateDrawerOpen && selectedDriver && (
        <UpdateDriverDrawer
          driver={{ ...selectedDriver, documents: selectedDriver?.documents ?? [] }}
          isOpen={isUpdateDrawerOpen}
          onClose={() => {
            setIsUpdateDrawerOpen(false);
            setSelectedDriver(null);
          }}
          onDriverUpdated={(updatedDriver) => {
            onDriverUpdated(updatedDriver);
            setIsUpdateDrawerOpen(false);
            setSelectedDriver(null);
          }}
        />
      )}

      <Modal
        title="Confirm Status Change"
        open={isConfirmModalOpen}
        onOk={confirmToggleActive}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setDriverToToggle(null);
        }}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to {driverToToggle?.is_active ? "disable" : "enable"} the driver{" "}
          {driverToToggle ? `${driverToToggle.first_name} ${driverToToggle.last_name}` : ""}?
        </p>
      </Modal>
    </div>
  );
}
