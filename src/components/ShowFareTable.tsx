"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import pricingService from "@/utils/pricingService";
import { ApiResponse } from "@/utils/apiFetcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Empty, Spin } from "antd";
import { toast } from "sonner";

interface Charge {
  isPercentage?: boolean;
  value?: string;
}

interface Fare {
  pricing_id: string;
  currency: string;
  organization_id: string;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
  vat?: number;
  rates: {
    [key: string]: number | { [tier: string]: number };
  };
  mandatory_charges?: Record<string, Charge>;
  other_charges?: Record<string, Charge>;
  organisation_name?: string;
}

interface ShowFareTableProps {
  fares?: Fare[];
  onEdit?: (fare: Fare) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return "";
  const datePart = dateStr.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toApiDateValue(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("T")) {
    return trimmed;
  }
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function ShowFareTable({ fares: externalFares }: ShowFareTableProps) {
  const [fares, setFares] = useState<Fare[]>(externalFares || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFare, setSelectedFare] = useState<Fare | null>(null);
  const [originalData, setOriginalData] = useState<Fare | null>(null);
  const [editData, setEditData] = useState<Partial<Fare>>({});
  const [editMode, setEditMode] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  const token = localStorage.getItem("authToken") || "";

  useEffect(() => {
    const fetchData = async () => {
      if (!externalFares) {
        setLoading(true);
        const response: ApiResponse<{ fares: Fare[] }> = await pricingService.showFares(token);
        if (response.success && response.data?.fares) {
          setFares(response.data.fares);
        } else {
          setError(response.error || "Failed to fetch fares.");
          setFares([]);
        }
        setLoading(false);
      } else {
        setFares(externalFares);
        setLoading(false);
      }
    };
    fetchData();
  }, [externalFares, token]);

  const today = new Date();
  const activeFares = fares.filter(
    (fare) => new Date(fare.effective_to).getTime() >= today.getTime()
  );

  const handleView = async (fare: Fare) => {
    setIsSheetOpen(true);
    setSelectedFare(null);
    setOriginalData(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await pricingService.getFareDetails(
        {
          organization_id: Number(fare.organization_id),
          pricing_id: fare.pricing_id,
        },
        token
      );
      if (response.success && response.data?.data) {
        setSelectedFare(response.data.data);
        setOriginalData(response.data.data);
        setEditData(response.data.data);
      } else {
        setDetailError(response.error || "Failed to fetch fare details.");
      }
    } catch (err) {
      setDetailError("An error occurred while fetching fare details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!originalData || !editData) return;

    const mergedRates = {
      ...(originalData.rates || {}),
      ...(editData.rates || {}),
    };

    const payload: Record<string, any> = {
      pricing_id: originalData.pricing_id,
      organisation_id: originalData.organization_id,
      currency: editData.currency ?? originalData.currency,
      effective_from: toApiDateValue(editData.effective_from ?? originalData.effective_from),
      effective_to: toApiDateValue(editData.effective_to ?? originalData.effective_to),
      is_active: editData.is_active ?? originalData.is_active,
      vat: editData.vat ?? originalData.vat ?? 0,
      mandatory_charges: editData.mandatory_charges ?? originalData.mandatory_charges ?? {},
      other_charges: editData.other_charges ?? originalData.other_charges ?? {},
      rates: mergedRates,
    };

    try {
      setSaveLoading(true);
      const response = await pricingService.updatePricing(payload, token);

      if (response.success && response.data) {
        toast.success("Pricing updated successfully.");
        setSelectedFare(response.data);
        setOriginalData(response.data);
        setEditData(response.data);
        setEditMode(false);
        setIsSheetOpen(false);
      } else {
        toast.error(response.error || "Update failed.");
      }
    } catch {
      toast.error("Error updating pricing.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRateChange = (key: string, newValue: number) => {
    setEditData((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [key]: newValue,
      },
    }));
  };

  const handleTierChange = (key: string, tier: string, newValue: number) => {
    setEditData((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [key]: {
          ...(prev.rates?.[key] as { [tier: string]: number }),
          [tier]: newValue,
        },
      },
    }));
  };

  return (
    <div className="w-full p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">Pricing ID</TableCell>
            <TableCell className="font-semibold">Currency</TableCell>
            <TableCell className="font-semibold">Organization(ID-Name)</TableCell>
            <TableCell className="font-semibold">Effective From</TableCell>
            <TableCell className="font-semibold">Effective To</TableCell>
            <TableCell className="font-semibold">Status</TableCell>
            <TableCell className="font-semibold">Actions</TableCell>
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
          ) : activeFares.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                <Empty description="No data available" />
              </TableCell>
            </TableRow>
          ) : (
            activeFares.map((fare) => (
              <TableRow key={fare.pricing_id}>
                <TableCell>{fare.pricing_id}</TableCell>
                <TableCell>{fare.currency}</TableCell>
                <TableCell>{fare.organisation_name || fare.organization_id}</TableCell>
                <TableCell>{formatDate(fare.effective_from)}</TableCell>
                <TableCell>{formatDate(fare.effective_to)}</TableCell>
                <TableCell>{fare.is_active ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  <Button onClick={() => handleView(fare)} size="sm" className="rounded">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="max-w-2xl p-4 overflow-y-auto max-h-[100vh]">
          <SheetHeader>
            <SheetTitle>Fare Details</SheetTitle>
            <SheetDescription>View or edit pricing details.</SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spin size="large" />
            </div>
          ) : detailError ? (
            <div className="text-red-500 py-4">{detailError}</div>
          ) : selectedFare ? (
            <Table className="mt-4">
              <TableBody>
                {Object.entries({
                  pricing_id: selectedFare.pricing_id,
                  currency: selectedFare.currency,
                  vat: selectedFare.vat,
                  effective_from: formatDate(selectedFare.effective_from),
                  effective_to: formatDate(selectedFare.effective_to),
                  is_active: selectedFare.is_active ? "Active" : "Inactive",
                }).map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell>
                      {label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </TableCell>
                    <TableCell>
                      {editMode && label !== "pricing_id" && label !== "is_active" && label !== "currency" ? (
                        <input
                          type={
                            label === "effective_from" || label === "effective_to"
                              ? "date"
                              : label === "vat"
                              ? "number"
                              : "text"
                          }
                          value={
                            label === "effective_from" || label === "effective_to"
                              ? toDateInputValue(editData[label as keyof Fare] as string | undefined)
                              : typeof editData[label as keyof Fare] === "string" ||
                                typeof editData[label as keyof Fare] === "number"
                              ? (editData[label as keyof Fare] ?? "").toString()
                              : ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              label,
                              label === "vat" ? Number(e.target.value) : e.target.value
                            )
                          }
                          className="border p-2 w-full rounded"
                        />
                      ) : (
                        value
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Render rates */}
                {selectedFare.rates &&
                  Object.entries(selectedFare.rates).flatMap(([key, value]) => {
                    if (typeof value === "number") {
                      // Only show if value is not 0
                      if (value === 0) return [];
                      return [
                        <TableRow key={key}>
                          <TableCell>
                            {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </TableCell>
                          <TableCell>
                            {editMode ? (
                              <input
                                type="number"
                                value={
                                  typeof editData.rates?.[key] === "number" ||
                                  typeof editData.rates?.[key] === "string"
                                    ? editData.rates?.[key] ?? ""
                                    : ""
                                }
                                onChange={(e) => handleRateChange(key, Number(e.target.value))}
                                className="border p-2 w-full rounded"
                              />
                            ) : (
                              value
                            )}
                          </TableCell>
                        </TableRow>,
                      ];
                    } else if (typeof value === "object" && value !== null) {
                      // Nested object (e.g., per_hour_tiers)
                      return Object.entries(value)
                        .filter(([, rate]) => rate !== 0) // Only show if rate is not 0
                        .map(([tier, rate]) => (
                          <TableRow key={`${key}-${tier}`}>
                            <TableCell>
                              {tier} {tier === "1" ? "Hour" : "Hours"}
                            </TableCell>
                            <TableCell>
                              {editMode ? (
                                <input
                                  type="number"
                                  value={
                                    typeof editData.rates?.[key] === "object" &&
                                    editData.rates?.[key] !== null
                                      ? (editData.rates[key] as { [tier: string]: number })[tier] ?? ""
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleTierChange(key, tier, Number(e.target.value))
                                  }
                                  className="border p-2 w-full rounded"
                                />
                              ) : (
                                rate
                              )}
                            </TableCell>
                          </TableRow>
                        ));
                    }
                    return [];
                  })}
              </TableBody>
            </Table>
          ) : null}

          <div className="mt-4 flex gap-2">
            {!editMode ? (
              selectedFare?.is_active ? (
                <Button onClick={() => setEditMode(true)} className="bg-blue-600 text-white">
                  Edit
                </Button>
              ) : null
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="bg-green-600 text-white"
                >
                  {saveLoading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </>
            )}
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
