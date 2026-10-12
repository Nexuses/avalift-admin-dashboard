// CustomerSearch.tsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import customerService from "@/utils/customerService";
import { Spin } from "antd";

// Define a minimal Customer type.
export type Customer = {
  id: number;
  first_name: string;
  last_name: string;
};

type CustomerSearchProps = {
  value: string;
  onChange: (newValue: string) => void;
  // Updated to accept a full Customer object.
  onCustomerSelect: (customer: Customer) => void;
};

export function CustomerSearch({
  value,
  onChange,
  onCustomerSelect,
}: CustomerSearchProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!value || value.length < 2) {
      setCustomers([]);
      return;
    }
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await customerService.fetchIndividualCustomers({
          query: value,
      
        });
        if (response.success && response.data) {
          setCustomers(response.data);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error(error);
        setCustomers([]);
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      fetchCustomers();
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search customer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {loading && (
        <div className="absolute z-10 bg-white px-2 py-1 text-sm">
          <Spin/>
        </div>
      )}
      {customers.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto">
          {customers.map((customer) => {
            const fullName = `${customer.first_name} ${customer.last_name}`.trim();
            return (
              <li
                key={customer.id}
                onClick={() => {
                  onCustomerSelect(customer);
                  onChange(fullName);
                  setCustomers([]);
                }}
                className="cursor-pointer px-2 py-1 hover:bg-gray-200"
              >
                {fullName} (ID: {customer.id})
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CustomerSearch;
