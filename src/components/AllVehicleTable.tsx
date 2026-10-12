import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
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
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateVehicleDrawer } from "./updateVehicle";
import { Empty, Spin, message } from "antd";
import { vehicleService } from "@/utils/vehicleService";
import { LinkPreview } from "./ui/link-preview";

interface VehicleDetail {
  id: number;
  vehicle_id: number;
  color: string;
  fuel_type: string;
  make: string;
  model: string;
  media_data?: string[]; // Add media_data to the interface
  createdAt: string;
  updatedAt: string;
}

interface Vehicle {
  id: number;
  user_id: number;
  registration_no: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: number;
    country_code: string;
    mobile_number: string;
    email_id: string | null;
    first_name: string;
    last_name: string;
    password: string | null;
    type_id: number;
    role_id: number;
    is_active: boolean;
    status_id: number | null;
    device_id: string;
    createdAt: string;
    updatedAt: string;
  };
  vehicleDetail: VehicleDetail | null;
}

interface AllVehicleTableProps {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onVehicleUpdated: (updatedVehicle: Vehicle) => void;
  onVehicleDeleted: (vehicleId: number) => void;
}

export function AllVehicleTable({
  vehicles,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onVehicleUpdated,
  onVehicleDeleted,
}: AllVehicleTableProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayVehicles = vehicles ?? [];

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

  const handleEdit = (id: number) => {
    const vehicleToEdit = vehicles.find((v) => v.id === id);
    if (vehicleToEdit) {
      setSelectedVehicle(vehicleToEdit);
    }
  };

  const handleDeleteClick = (id: number) => {
    setVehicleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        message.error("No token found. Please log in.");
        return;
      }
      await vehicleService.deleteVehicle(token, vehicleToDelete);
      message.success("Vehicle deleted successfully");
      onVehicleDeleted(vehicleToDelete);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to delete vehicle");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="w-full p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">Vehicle ID</TableCell>
            <TableCell className="font-semibold">Customer(ID-Name)</TableCell>
            <TableCell className="font-semibold">Brand</TableCell>
            <TableCell className="font-semibold">Model</TableCell>
            <TableCell className="font-semibold">Color</TableCell>
            <TableCell className="font-semibold">Reg No</TableCell>
            <TableCell className="font-semibold">Status</TableCell>
            <TableCell className="font-semibold">Image</TableCell> {/* New Image Column */}
            <TableCell className="font-semibold">Created At</TableCell>
            <TableCell className="font-semibold">Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-4">
                <Spin />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-red-500 py-4">
                {error}
              </TableCell>
            </TableRow>
          ) : displayVehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-4">
                <Empty description="No data available" />
              </TableCell>
            </TableRow>
          ) : (
            displayVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>{vehicle.id}</TableCell>
                <TableCell>
                  {vehicle.User
                    ? `${vehicle.User.id} - ${vehicle.User.first_name} ${vehicle.User.last_name}`
                    : "Unknown"}
                </TableCell>
                <TableCell>
                  {vehicle.vehicleDetail?.make?.slice(0, 20) ?? "Unknown"}
                </TableCell>
                <TableCell>
                  {vehicle.vehicleDetail?.model?.slice(0, 20) ?? "Unknown"}
                </TableCell>
                <TableCell>
                  {vehicle.vehicleDetail?.color?.slice(0, 20) ?? "Unknown"}
                </TableCell>
                <TableCell>
                  {vehicle.registration_no?.slice(0, 20) ?? "N/A"}
                </TableCell>
                <TableCell>
                  {vehicle.is_active ? "Active" : "Inactive"}
                </TableCell>
                <TableCell>
                  {vehicle.vehicleDetail?.media_data &&
                  vehicle.vehicleDetail.media_data.length > 0 ? (
                    <LinkPreview
                    url={vehicle.vehicleDetail.media_data[0]}
                    imageSrc={vehicle.vehicleDetail.media_data[0]}
                    width={300}
                    height={300}
                    isStatic={true}
                    className="rounded-full"
                  >
                    <img
                      src={vehicle.vehicleDetail.media_data[0]}
                      alt={`Vehicle ${vehicle.registration_no}`}
                      className="w-10 h-10 object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-image.png";
                        e.currentTarget.alt = "Image not available";
                      }}
                    />
                  </LinkPreview>
                  ) : (
                    "No Image"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(vehicle.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleEdit(vehicle.id)}
                    className="text-blue-500 hover:text-blue-700"
                    aria-label={`Edit vehicle ${vehicle.registration_no}`}
                  >
                    <Edit size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteClick(vehicle.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isDeleting}
                    aria-label={`Delete vehicle ${vehicle.registration_no}`}
                  >
                    <Trash2 size={20} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
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
                    onPageChange(currentPage - 1);
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
                        onPageChange(item as number);
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
                    onPageChange(currentPage + 1);
                  }
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {selectedVehicle && (
        <UpdateVehicleDrawer
          vehicle={{
            ...selectedVehicle,
            User: selectedVehicle.User
              ? {
                  ...selectedVehicle.User,
                  status_id: selectedVehicle.User.status_id ?? 0,
                }
              : undefined,
            vehicleDetail:
              selectedVehicle.vehicleDetail || {
                id: 0,
                vehicle_id: selectedVehicle.id,
                color: "",
                fuel_type: "",
                make: "",
                model: "",
                media_data: [], // Ensure media_data is included
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
          }}
          open={!!selectedVehicle}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedVehicle(null);
            }
          }}
          onVehicleUpdated={onVehicleUpdated}
        />
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the vehicle with registration number{" "}
              <strong>
                {vehicles.find((v) => v.id === vehicleToDelete)?.registration_no ?? "Unknown"}
              </strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setVehicleToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? <Spin size="small" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
