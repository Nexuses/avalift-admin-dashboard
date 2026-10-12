"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import pricingService from "../../utils/pricingService";
import organizationService from "@/utils/organizationSevice";
// import { ApiResponse } from "@/components/utils/apiFetcher"; 
import { ShowFareTable } from "@/components/ShowFareTable";
import { ApiResponse } from "@/utils/apiFetcher";

// Define interfaces
interface Charge {
  isPercentage: boolean;
  value: string;
}
interface ExtraCharge extends Charge {
  label: string;
}
interface Fare {
  other_charges: any;
  mandatory_charges: any;
  pricing_id: string;
  currency: string;
  organization_id: number;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
  vat: number;
  rates: {
    per_min: number;
    per_hour: number;
    base_fare: number;
    half_day: number;
    full_day: number;
    fixed?:number;
   
  };
}
interface Organization {
  id: number;
  name: string;
  address: string;
  country_code: string;
  mobile_number: string;
}

// Native date input default values
const todayStr = new Date().toISOString().split("T")[0];
const tomorrow = new Date();
tomorrow.setDate(new Date().getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];

const OtherOrganizationPricing: React.FC = () => {
  // Pricing form state
  const [payPerMinute] = useState("");
  // const [payPerHour] = useState("");
   const [fixedRate,setFixedRate]=useState("");
  const [baseFare] = useState("");
  const [halfDay] = useState("");
  const [fullDay] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr);
  const [effectiveTo, setEffectiveTo] = useState(tomorrowStr);
  const [currency, setCurrency] = useState("AED");
  const [isActive, setIsActive] = useState(true);
  const [vat, setVat] = useState("");
  const [mandatoryCharges, setMandatoryCharges] = useState<ExtraCharge[]>([]);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [, setErrors] = useState<Record<string, string>>({});
  const [fares, setFares] = useState<Fare[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [, setSelectedFare] = useState<Fare | null>(null);

  // State for organizations and the selected organization
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number>(0);
  const [, setOrgLoading] = useState<boolean>(true);

  // Fetch organizations from organizationService on component mount
  const fetchOrganizations = async () => {
    try {
      setOrgLoading(true);
      const response = await organizationService.fetchAllOrganizations();
      console.log("Organizations response:", response);

      if (response.success && response.data) {
        const orgs = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response.data as any).data)
          ? (response.data as any).data
          : [];
        console.log("Organizations fetched:", orgs);
        setOrganizations(orgs);
      } else {
        console.error("Error fetching organizations:", response.error);
        setOrganizations([]);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setOrganizations([]);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch fares for the selected organization
  const fetchFares = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }
    setLoading(true);
    const response: ApiResponse<{ fares: Fare[] }> = await pricingService.showFares(token);
    if (response.success && response.data && Array.isArray(response.data.fares)) {
      setFares(response.data.fares.filter(fare=> Number(fare.organization_id) !== 1));
      if (response.data.fares.length > 0) {
        setSelectedFare(response.data.fares[0]);
      }
      // const filteredFares = response.data.fares.filter(fare => Number(fare.organization_id) === 1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFares();
  }, []);

  const addExtraCharge = () => {
    setExtraCharges([...extraCharges, { label: "", value: "", isPercentage: false }]);
  };

  const addMandatoryCharge = () => {
    setMandatoryCharges([...mandatoryCharges, { label: "", value: "", isPercentage: false }]);
  };

  const handleRemoveCharge = (index: number, type: "extra" | "mandatory") => {
    if (type === "extra") {
      setExtraCharges(extraCharges.filter((_, i) => i !== index));
    } else {
      setMandatoryCharges(mandatoryCharges.filter((_, i) => i !== index));
    }
  };

  const validateMandatoryCharges = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    mandatoryCharges.forEach((charge, index) => {
      if (charge.label.trim() === "" && charge.value.trim() === "") {
        return;
      }
      if (charge.label.trim() !== "" && charge.value.trim() === "") {
        newErrors[`mandatory_${index}`] = `${charge.label} value is required.`;
        isValid = false;
      }
      if (charge.value.trim() !== "" && charge.label.trim() === "") {
        newErrors[`mandatory_${index}`] = `Charge name is required if a value is provided.`;
        isValid = false;
      }
      if (charge.value.trim() !== "" && (isNaN(Number(charge.value)) || Number(charge.value) < 0)) {
        newErrors[`mandatory_${index}`] = `${charge.label} must be a positive number.`;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!selectedOrg) {
      toast.error("Please select an organization.");
      return;
    }

    if (vat.trim() === "" || isNaN(Number(vat)) || Number(vat) < 0) {
      toast.error("Please enter a valid VAT value.");
      return;
    }

    if (!validateMandatoryCharges()) {
      toast.error("Please fill in all required mandatory charges correctly.");
      return;
    }

    const otherCharges = extraCharges.reduce<Record<string, Charge>>((acc, charge) => {
      if (charge.label.trim()) {
        acc[charge.label.toLowerCase().replace(/ /g, "_")] = {
          isPercentage: charge.isPercentage,
          value: (parseFloat(charge.value) || 0).toString(),
        };
      }
      return acc;
    }, {});

    const mandCharges = mandatoryCharges.reduce<Record<string, Charge>>((acc, charge) => {
      if (charge.label.trim()) {
        acc[charge.label.toLowerCase().replace(/ /g, "_")] = {
          isPercentage: charge.isPercentage,
          value: (parseFloat(charge.value) || 0).toString(),
        };
      }
      return acc;
    }, {});

    const rates = {
      base_fare: parseFloat(baseFare) || 0,
      per_min: parseFloat(payPerMinute) || 0,
      // per_hour: parseFloat(payPerHour) || 0,
      half_day: parseFloat(halfDay) || 0,
      full_day: parseFloat(fullDay) || 0,
      fixed:parseFloat(fixedRate)||0,
    };

    const payload = {
      organization_id: selectedOrg,
      currency,
      effective_from: new Date(effectiveFrom).toISOString(),
      effective_to: new Date(effectiveTo).toISOString(),
      is_active: isActive,
      vat: parseFloat(vat) || 0,
      mandatory_charges: mandCharges,
      other_charges: otherCharges,
      rates,
    };

    console.log('Sending organization ID in payload:', selectedOrg);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      setLoading(true);
      const response: ApiResponse<any> = await pricingService.addPricing(payload, token);
      if (response.success) {
        toast.success("Pricing added successfully!");
        await fetchFares();
        // Add 2 second delay before refreshing the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(response.error || "Failed to add pricing.");
      }
    } catch (err) {
      toast.error("Network error occurred while adding pricing.");
    } finally {
      setLoading(false);
    }
  };

  // Simplified handleAddPricingClick without pre-population
  const handleAddPricingClick = () => {
    setShowPricingForm(!showPricingForm);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-100 min-h-screen">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#" className="text-gray-600 hover:text-gray-800">
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-800 font-semibold">
              Manage Pricing
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Ride Pricing for Organizations</h1>

      <Button
        onClick={handleAddPricingClick}
        className="mb-6 bg-blue-500 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
        {showPricingForm ? "Hide Pricing Form" : "Add Pricing"}
        {showPricingForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Button>

      {showPricingForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pricing Details Card */}
          <Card className="shadow-lg border-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-800 text-white p-6">
              <CardTitle className="text-xl font-semibold">Pricing Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Dropdown for selecting organization */}
              <div>
                <Label htmlFor="organization" className="text-sm font-medium text-gray-700">
                  Organization
                </Label>
                <select
                  id="organization"
                  value={selectedOrg}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    console.log('Selected Organization ID:', selectedId);
                    setSelectedOrg(organizations.find((org) => org.id === selectedId)?.id || 0);
                  }}
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded w-full p-2"
                >
                  <option value={0}>Select Organization</option>
                  {organizations.length > 0 ? (
                    organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Loading organizations...</option>
                  )}
                </select>
              </div>

              {/* <div>
                <Label htmlFor="payPerMinute" className="text-sm font-medium text-gray-700">
                  Pay per Minute
                </Label>
                <Input
                  id="payPerMinute"
                  type="number"
                  value={payPerMinute}
                  onChange={(e) => setPayPerMinute(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div> */}

              {/* <div>
                <Label htmlFor="payPerHour" className="text-sm font-medium text-gray-700">
                  Pay per Hour
                </Label>
                <Input
                  id="payPerHour"
                  type="number"
                  value={payPerHour}
                  onChange={(e) => setPayPerHour(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div> */}
              <div>
                <Label htmlFor="fixed" className="text-sm font-medium text-gray-700">
                  Fixed
                </Label>
                <Input
                  id="fixed"
                  type="number"
                  value={fixedRate}
                  onChange={(e) => setFixedRate(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>

            
                

              {/* <div>
                <Label htmlFor="baseFare" className="text-sm font-medium text-gray-700">
                  Base Fare
                </Label>
                <Input
                  id="baseFare"
                  type="number"
                  value={baseFare}
                  onChange={(e) => setBaseFare(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div> */}

              <div>
                <Label htmlFor="vat" className="text-sm font-medium text-gray-700">
                  VAT
                </Label>
                <Input
                  id="vat"
                  type="number"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>

              {/* <div>
                <Label htmlFor="halfDay" className="text-sm font-medium text-gray-700">
                  Half Day Rate
                </Label>
                <Input
                  id="halfDay"
                  type="number"
                  value={halfDay}
                  onChange={(e) => setHalfDay(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div> */}

              {/* <div>
                <Label htmlFor="fullDay" className="text-sm font-medium text-gray-700">
                  Full Day Rate
                </Label>
                <Input
                  id="fullDay"
                  type="number"
                  value={fullDay}
                  onChange={(e) => setFullDay(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}

                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div> */}

              <div>
                <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                  Currency
                </Label>
                <Input
                  id="currency"
                  type="text"
                  value={currency}
                  disabled
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder=""
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>

              <div>
                <Label htmlFor="effectiveFrom" className="text-sm font-medium text-gray-700">
                  Effective From
                </Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>

              <div>
                <Label htmlFor="effectiveTo" className="text-sm font-medium text-gray-700">
                  Effective To
                </Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Charges Card */}
          <Card className="shadow-lg border-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-800 text-white p-6">
              <CardTitle className="text-xl font-semibold">Charges</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Mandatory Charges</h3>
                {mandatoryCharges.map((charge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded mb-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <Input
                      type="text"
                      value={charge.label}
                      onChange={(e) => {
                        const updated = [...mandatoryCharges];
                        updated[index].label = e.target.value;
                        setMandatoryCharges(updated);
                      }}
                      placeholder="Charge name"
                      className="flex-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    <Input
                      type="number"
                      value={charge.value}
                      onChange={(e) => {
                        const updated = [...mandatoryCharges];
                        updated[index].value = e.target.value;
                        setMandatoryCharges(updated);
                      }}
                      placeholder="Amount"
                      className="flex-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    <select
                      value={charge.isPercentage ? "true" : "false"}
                      onChange={(e) => {
                        const updated = [...mandatoryCharges];
                        updated[index].isPercentage = e.target.value === "true";
                        setMandatoryCharges(updated);
                      }}
                      className="p-2 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">%</option>
                      <option value="false">Fixed</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCharge(index, "mandatory")}
                      className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={addMandatoryCharge}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Add Mandatory Charge
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Extra Charges</h3>
                {extraCharges.map((charge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded mb-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <Input
                      type="text"
                      value={charge.label}
                      onChange={(e) => {
                        const updated = [...extraCharges];
                        updated[index].label = e.target.value;
                        setExtraCharges(updated);
                      }}
                      placeholder="Charge name"
                      className="flex-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    <Input
                      type="number"
                      value={charge.value}
                      onChange={(e) => {
                        const updated = [...extraCharges];
                        updated[index].value = e.target.value;
                        setExtraCharges(updated);
                      }}
                      placeholder="Amount"
                      className="flex-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    <select
                      value={charge.isPercentage ? "true" : "false"}
                      onChange={(e) => {
                        const updated = [...extraCharges];
                        updated[index].isPercentage = e.target.value === "true";
                        setExtraCharges(updated);
                      }}
                      className="p-2 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">%</option>
                      <option value="false">Fixed</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCharge(index, "extra")}
                      className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={addExtraCharge}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Add Extra Charge
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? "Submitting..." : "Save Pricing"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-10">
        <ShowFareTable fares={fares as any[]} />
      </div>
    </div>
  );
};

export default OtherOrganizationPricing;