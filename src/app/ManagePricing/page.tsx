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
import { ApiResponse } from "@/utils/apiFetcher";
import { ShowFareTable } from "@/components/ShowFareTable";

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
  organization_id: string;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
  vat: number;
  rates: {
    per_min: number;
    base_fare: number;
    half_day?: number;
    full_day?: number;
    fixed?: number;
    garage_ride?: number;
    rta_test?: number;
    per_hour_tiers?: { [key: string]: number };
  };
}

const todayStr = new Date().toISOString().split("T")[0];
const tomorrow = new Date();
tomorrow.setDate(new Date().getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];

const ManagePricing: React.FC = () => {
  const [payPerMinute, setPayPerMinute] = useState("");
  const [perHourTiers, setPerHourTiers] = useState<string[]>(Array(12).fill(""));
  const [fixedRate, setFixedRate] = useState("");
  const [baseFare, setBaseFare] = useState("");
  const [halfDay, setHalfDay] = useState("");
  const [fullDay, setFullDay] = useState("");
  const [garageRide, setGarageRide] = useState("");
  const [rtaTest, setRtaTest] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr);
  const [effectiveTo, setEffectiveTo] = useState(tomorrowStr);
  const [currency, setCurrency] = useState("AED");
  const [isActive, setIsActive] = useState(true);
  const [vat, setVat] = useState("");
  const [mandatoryCharges, setMandatoryCharges] = useState<ExtraCharge[]>([]);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fares, setFares] = useState<Fare[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);

  const fetchFares = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }
    setLoading(true);
    const response: ApiResponse<{ fares: Fare[] }> =
      await pricingService.showFares(token);
    if (
      response.success &&
      response.data &&
      Array.isArray(response.data.fares)
    ) {
      const filteredFares = response.data.fares.filter(
        (fare) => Number(fare.organization_id) === 1
      );
      setFares(filteredFares);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFares();
  }, []);

  const addExtraCharge = () => {
    setExtraCharges([
      ...extraCharges,
      { label: "", value: "", isPercentage: false },
    ]);
  };

  const addMandatoryCharge = () => {
    setMandatoryCharges([
      ...mandatoryCharges,
      { label: "", value: "", isPercentage: false },
    ]);
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
        newErrors[
          `mandatory_${index}`
        ] = `Charge name is required if a value is provided.`;
        isValid = false;
      }
      if (
        charge.value.trim() !== "" &&
        (isNaN(Number(charge.value)) || Number(charge.value) < 0)
      ) {
        newErrors[
          `mandatory_${index}`
        ] = `${charge.label} ..`;
        isValid = false;
      }
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate payPerMinute (per_min)
    if (!payPerMinute || isNaN(Number(payPerMinute)) || Number(payPerMinute) <= 0) {
      newErrors.payPerMinute = "Pay per minute is required .";
      isValid = false;
    }

    // Validate baseFare
    if (!baseFare || isNaN(Number(baseFare)) || Number(baseFare) <= 0) {
      newErrors.baseFare = "Base fare is required .";
      isValid = false;
    }

    // Validate perHourTiers (all 12 tiers must be filled)
    perHourTiers.forEach((val, idx) => {
      if (!val || isNaN(Number(val)) || Number(val) <= 0) {
        newErrors[`perHourTier_${idx}`] = `Hour ${idx + 1} rate is required .`;
        isValid = false;
      }
    });

    // Validate halfDay
    if (!halfDay || isNaN(Number(halfDay)) || Number(halfDay) <= 0) {
      newErrors.halfDay = "Half day rate is required .";
      isValid = false;
    }

    // Validate fullDay
    if (!fullDay || isNaN(Number(fullDay)) || Number(fullDay) <= 0) {
      newErrors.fullDay = "Full day rate is required .";
      isValid = false;
    }

    // Validate rtaTest
    if (!rtaTest || isNaN(Number(rtaTest)) || Number(rtaTest) <= 0) {
      newErrors.rtaTest = "RTA test rate is required .";
      isValid = false;
    }

    // Validate garageRide
    if (!garageRide || isNaN(Number(garageRide)) || Number(garageRide) <= 0) {
      newErrors.garageRide = "Garage ride rate is required .";
      isValid = false;
    }

    // Validate fixedRate
    if (!fixedRate || isNaN(Number(fixedRate)) || Number(fixedRate) <= 0) {
      newErrors.fixedRate = "Fixed rate is required .";
      isValid = false;
    }

    // Validate vat
    if (!vat || isNaN(Number(vat)) || Number(vat) < 0) {
      newErrors.vat = "VAT is required and must be a non-negative number.";
      isValid = false;
    }

    // Validate currency
    if (!currency.trim()) {
      newErrors.currency = "Currency is required.";
      isValid = false;
    }

    // Validate effectiveFrom
    if (!effectiveFrom) {
      newErrors.effectiveFrom = "Effective from date is required.";
      isValid = false;
    }

    // Validate effectiveTo
    if (!effectiveTo) {
      newErrors.effectiveTo = "Effective to date is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    if (!validateMandatoryCharges()) {
      toast.error("Please fill in all required mandatory charges correctly.");
      return;
    }

    const otherCharges = extraCharges.reduce<Record<string, Charge>>(
      (acc, charge) => {
        if (charge.label.trim()) {
          acc[charge.label.toLowerCase().replace(/ /g, "_")] = {
            isPercentage: charge.isPercentage,
            value: (parseFloat(charge.value) || 0).toString(),
          };
        }
        return acc;
      },
      {}
    );

    const mandCharges = mandatoryCharges.reduce<Record<string, Charge>>(
      (acc, charge) => {
        if (charge.label.trim()) {
          acc[charge.label.toLowerCase().replace(/ /g, "_")] = {
            isPercentage: charge.isPercentage,
            value: (parseFloat(charge.value) || 0).toString(),
          };
        }
        return acc;
      },
      {}
    );

    const perHourTiersObj = perHourTiers.reduce<Record<string, number>>((acc, val, idx) => {
      if (val && !isNaN(Number(val))) {
        acc[(idx + 1).toString()] = Number(val);
      }
      return acc;
    }, {});
    const rates = {
      base_fare: parseFloat(baseFare),
      per_min: parseFloat(payPerMinute),
      half_day: parseFloat(halfDay),
      full_day: parseFloat(fullDay),
      fixed: parseFloat(fixedRate),
      garage_ride: parseFloat(garageRide),
      rta_test: parseFloat(rtaTest),
      per_hour_tiers: perHourTiersObj,
    };

    const payload = {
      organization_id: 1,
      currency,
      effective_from: new Date(effectiveFrom).toISOString(),
      effective_to: new Date(effectiveTo).toISOString(),
      is_active: isActive,
      vat: parseFloat(vat) || 0,
      mandatory_charges: mandCharges,
      other_charges: otherCharges,
      rates,
    };

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      setLoading(true);
      const response: ApiResponse<any> = await pricingService.addPricing(
        payload,
        token
      );
      if (response.success) {
        toast.success("Pricing added successfully!");
        await fetchFares();
        setShowPricingForm(false); // Hide form on successful submission
      } else {
        toast.error(response.error || "Failed to add pricing.");
      }
    } catch (err) {
      toast.error("Network error occurred while adding pricing.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPricingClick = () => {
    if (!showPricingForm) {
      // Reset all form fields when opening the form
      setPayPerMinute("");
      setPerHourTiers(Array(12).fill(""));
      setFixedRate("");
      setBaseFare("");
      setHalfDay("");
      setFullDay("");
      setGarageRide("");
      setRtaTest("");
      setEffectiveFrom(todayStr);
      setEffectiveTo(tomorrowStr);
      setCurrency("AED");
      setIsActive(true);
      setVat("");
      setMandatoryCharges([]);
      setExtraCharges([]);
      setErrors({});
    }
    setShowPricingForm(!showPricingForm);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="text-gray-600 hover:text-gray-800"
            >
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Manage Ride Pricing for Avalift
      </h1>

      <Button
        onClick={handleAddPricingClick}
        className="mb-6 bg-blue-500 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
      >
        {showPricingForm ? "Hide Pricing Form" : "Add Pricing"}
        {showPricingForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Button>

      {showPricingForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-800 text-white p-6">
              <CardTitle className="text-xl font-semibold">
                Pricing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label
                  htmlFor="payPerMinute"
                  className="text-sm font-medium text-gray-700"
                >
                  Pay per Minute *
                </Label>
                <Input
                  id="payPerMinute"
                  type="number"
                  value={payPerMinute}
                  onChange={(e) => setPayPerMinute(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter pay per minute"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.payPerMinute ? "border-red-500" : ""
                  }`}
                />
                {errors.payPerMinute && (
                  <p className="text-red-500 text-xs mt-1">{errors.payPerMinute}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Per Hour Tiers *
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {perHourTiers.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-12">Hour {idx + 1}</span>
                      <Input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const updated = [...perHourTiers];
                          updated[idx] = e.target.value;
                          setPerHourTiers(updated);
                        }}
                        onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                        placeholder={`Enter rate for hour ${idx + 1}`}
                        required
                        className={`flex-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                          errors[`perHourTier_${idx}`] ? "border-red-500" : ""
                        }`}
                      />
                      {errors[`perHourTier_${idx}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`perHourTier_${idx}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label
                  htmlFor="fixed"
                  className="text-sm font-medium text-gray-700"
                >
                  Fixed Rate *
                </Label>
                <Input
                  id="fixed"
                  type="number"
                  value={fixedRate}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  onChange={(e) => setFixedRate(e.target.value)}
                  placeholder="Enter fixed rate"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.fixedRate ? "border-red-500" : ""
                  }`}
                />
                {errors.fixedRate && (
                  <p className="text-red-500 text-xs mt-1">{errors.fixedRate}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="baseFare"
                  className="text-sm font-medium text-gray-700"
                >
                  Base Fare *
                </Label>
                <Input
                  id="baseFare"
                  type="number"
                  value={baseFare}
                  onChange={(e) => setBaseFare(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter base fare"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.baseFare ? "border-red-500" : ""
                  }`}
                />
                {errors.baseFare && (
                  <p className="text-red-500 text-xs mt-1">{errors.baseFare}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="vat"
                  className="text-sm font-medium text-gray-700"
                >
                  VAT % *
                </Label>
                <Input
                  id="vat"
                  type="number"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter VAT percentage"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.vat ? "border-red-500" : ""
                  }`}
                />
                {errors.vat && (
                  <p className="text-red-500 text-xs mt-1">{errors.vat}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="halfDay"
                  className="text-sm font-medium text-gray-700"
                >
                  Half Day Rate *
                </Label>
                <Input
                  id="halfDay"
                  type="number"
                  value={halfDay}
                  onChange={(e) => setHalfDay(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter half day rate"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.halfDay ? "border-red-500" : ""
                  }`}
                />
                {errors.halfDay && (
                  <p className="text-red-500 text-xs mt-1">{errors.halfDay}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="fullDay"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Day Rate *
                </Label>
                <Input
                  id="fullDay"
                  type="number"
                  value={fullDay}
                  onChange={(e) => setFullDay(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter full day rate"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.fullDay ? "border-red-500" : ""
                  }`}
                />
                {errors.fullDay && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullDay}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="garageRide"
                  className="text-sm font-medium text-gray-700"
                >
                  Garage Ride *
                </Label>
                <Input
                  id="garageRide"
                  type="number"
                  value={garageRide}
                  onChange={(e) => setGarageRide(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter garage ride rate"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.garageRide ? "border-red-500" : ""
                  }`}
                />
                {errors.garageRide && (
                  <p className="text-red-500 text-xs mt-1">{errors.garageRide}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="rtaTest"
                  className="text-sm font-medium text-gray-700"
                >
                  RTA Test *
                </Label>
                <Input
                  id="rtaTest"
                  type="number"
                  value={rtaTest}
                  onChange={(e) => setRtaTest(e.target.value)}
                  onWheel={(e) => e.target instanceof HTMLElement && e.target.blur()}
                  placeholder="Enter RTA test rate"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.rtaTest ? "border-red-500" : ""
                  }`}
                />
                {errors.rtaTest && (
                  <p className="text-red-500 text-xs mt-1">{errors.rtaTest}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="currency"
                  className="text-sm font-medium text-gray-700"
                >
                  Currency *
                </Label>
                <Input
                  id="currency"
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="Enter currency"
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.currency ? "border-red-500" : ""
                  }`}
                />
                {errors.currency && (
                  <p className="text-red-500 text-xs mt-1">{errors.currency}</p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="effectiveFrom"
                  className="text-sm font-medium text-gray-700"
                >
                  Effective From *
                </Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.effectiveFrom ? "border-red-500" : ""
                  }`}
                />
                {errors.effectiveFrom && (
                  <p className="text-red-500 text-xs mt-1">{errors.effectiveFrom}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="effectiveTo"
                  className="text-sm font-medium text-gray-700"
                >
                  Effective To *
                </Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  required
                  className={`mt-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded ${
                    errors.effectiveTo ? "border-red-500" : ""
                  }`}
                />
                {errors.effectiveTo && (
                  <p className="text-red-500 text-xs mt-1">{errors.effectiveTo}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-white rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-800 text-white p-6">
              <CardTitle className="text-xl font-semibold">Charges</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Mandatory Charges
                </h3>
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
                    {errors[`mandatory_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`mandatory_${index}`]}</p>
                    )}
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Extra Charges
                </h3>
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

export default ManagePricing;