"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import bankService, { Bank, GetBanksPayload, GetBankByIdPayload, AddBankPayload } from "@/utils/bankService";

const BanksPage: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBankId, setEditBankId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddBankPayload>({
    account_number: "",
    bank_name: "",
    iban: "",
    branch_name: "",
    default: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadBanks = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        setFormError("Please log in to view banks.");
        return;
      }
      const payload: GetBanksPayload = {};
      const response = await bankService.fetchBanks(payload, token);
      if (response.success && Array.isArray(response.data)) {
        setBanks(response.data);
      } else {
        console.error("Failed to fetch banks:", response.message ?? response.error);
        setFormError(response.message ?? response.error ?? "Failed to load banks. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      setFormError("An error occurred while fetching banks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const handleEdit = async (bank: Bank) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        setFormError("Please log in to edit a bank account.");
        return;
      }

      const payload: GetBankByIdPayload = { id: bank.id };
      const response = await bankService.fetchBankById(payload, token);
      if (response.success && response.data) {
        setFormData({
          account_number: response.data.account_number,
          bank_name: response.data.bank_name,
          iban: response.data.iban,
          branch_name: response.data.branch_name,
          default: response.data.default,
        });
        setEditBankId(bank.id);
        setShowForm(true);
        setFormError(null);
        setSuccessMessage(null);
      } else {
        console.error("Failed to fetch bank details:", response.message ?? response.error);
        setFormError(response.message ?? response.error ?? "Failed to load bank details.");
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
      setFormError("An error occurred while fetching bank details.");
    }
  };

  const handleCreateOrUpdateBank = async () => {
    setFormError(null);
    setSuccessMessage(null);

    // Basic form validation
    if (
      !formData.account_number ||
      !formData.bank_name ||
      !formData.iban ||
      !formData.branch_name
    ) {
      setFormError("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        setFormError("Please log in to create or update a bank account.");
        return;
      }

      const response = await bankService.addBank(formData, token);
      if (response.success && response.data) {
        setSuccessMessage(
          editBankId
            ? `Bank account "${response.data.bank_name}" (${response.data.account_number}) updated successfully!`
            : `Bank account "${response.data.bank_name}" (${response.data.account_number}) created successfully!`
        );
        setFormData({
          account_number: "",
          bank_name: "",
          iban: "",
          branch_name: "",
          default: false,
        });
        setEditBankId(null);
        setShowForm(false);
        await loadBanks(); // Refresh the bank list
      } else {
        console.error("Failed to save bank account:", response.message ?? response.error);
        setFormError(response.message ?? response.error ?? "Failed to save bank account. Please try again.");
      }
    } catch (error) {
      console.error("Error saving bank account:", error);
      setFormError("An error occurred while saving the bank account.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormError(null);
    setSuccessMessage(null);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setFormError(null);
    setSuccessMessage(null);
    if (showForm) {
      setEditBankId(null);
      setFormData({
        account_number: "",
        bank_name: "",
        iban: "",
        branch_name: "",
        default: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Card className="max-w-4xl mx-auto border-none shadow-md bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            All Banks
          </CardTitle>
          <div className="flex justify-end">
            <Button
              onClick={toggleForm}
              className="rounded bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
            >
              {showForm ? "Cancel" : "Create Bank Account"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editBankId ? "Edit Bank Account" : "Add New Bank Account"}
              </h3>
              {formError && (
                <p className="text-red-600 mb-4">{formError}</p>
              )}
              {successMessage && (
                <p className="text-green-600 mb-4">{successMessage}</p>
              )}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="e.g., 070331234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="e.g., Emirates NBD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="e.g., AE070331234567890123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="e.g., Dubai Mall Branch"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="default"
                    checked={formData.default}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    Set as Default
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleCreateOrUpdateBank}
                  className="rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                  {editBankId ? "Update" : "Submit"}
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2">Loading banks...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-black">Account Number</TableHead>
                  <TableHead className="font-bold text-black">Bank Name</TableHead>
                  <TableHead className="font-bold text-black">IBAN</TableHead>
                  <TableHead className="font-bold text-black">Branch Name</TableHead>
                  <TableHead className="font-bold text-black">Default</TableHead>
                  <TableHead className="font-bold text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banks.length > 0 ? (
                  banks.map((bank) => (
                    <TableRow key={bank.account_number}>
                      <TableCell>{bank.account_number}</TableCell>
                      <TableCell>{bank.bank_name}</TableCell>
                      <TableCell>{bank.iban}</TableCell>
                      <TableCell>{bank.branch_name}</TableCell>
                      <TableCell>
                        {bank.default ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-300 text-gray-800">
                            Not Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleEdit(bank)}
                          className="rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No banks available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BanksPage;