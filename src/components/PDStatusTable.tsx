"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Spin } from "antd";
import PDService from "@/utils/pdService";
import Empty from "antd/es/empty";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FiRefreshCcw } from "react-icons/fi";

interface Chauffeur {
  chauffeur_id: number;
  chauffeur_name: string;
  ride_id: string;
  status: string;
}

interface PdData {
  pd_id: number;
  chauffeurs?: Chauffeur[];
}

interface ApiResponseData {
  [pdName: string]: PdData;
}

export function PDStatusTable() {
  const [data, setData] = React.useState<ApiResponseData>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedPDs, setExpandedPDs] = React.useState<string[]>([]);

  const fetchAllChauffeurs = async () => {
    setLoading(true);
    setError(null);
    setData({});

    try {
      const response = await PDService.fetchAllChauffeursWithPd();
      console.log("Raw API response:", response);

      if (!response.success || !response.data || !response.data.data) {
        setError(response.error || "Failed to fetch chauffeurs data");
        setData({});
      } else {
        const sanitizedData = Object.fromEntries(
          Object.entries(response.data.data as Record<string, PdData>).map(
            ([pdName, pdData]) => [pdName, { ...pdData, chauffeurs: pdData.chauffeurs || [] }]
          )
        );
        console.log("Sanitized data:", sanitizedData);
        setData(sanitizedData);
        setError(null);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An error occurred while fetching chauffeurs data");
      setData({});
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAllChauffeurs();
  }, []);

  const togglePD = (pdName: string) => {
    setExpandedPDs((prev) =>
      prev.includes(pdName) ? prev.filter((name) => name !== pdName) : [...prev, pdName]
    );
  };

  return (
    <div className="w-full p-6 min-h-screen">
      <div className="mb-6 flex justify-end">
        <Button
          onClick={fetchAllChauffeurs}
          className="bg-blue-600 text-white py-2 px-6 shadow-md hover:bg-blue-700 transition-all duration-200 flex items-center rounded"
          disabled={loading}
        >
           <FiRefreshCcw className="mr-2" />
         
          Refresh
        </Button>
      </div>

      {loading && !Object.keys(data).length && (
        <div className="flex justify-center items-center h-64">
          <Spin/>
        </div>
      )}

      {error && (
        <p className="text-center mb-6 bg-red-50 p-4 rounded-lg">
          {error}
        </p>
      )}

      {Object.keys(data).length === 0 && !loading ? (
        <Empty description="No chauffeurs data available" className="mt-12" />
      ) : (
        <div className="space-y-2">
          {Object.entries(data).map(([pdName, pdData]) => (
            <div
              key={pdData.pd_id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <button
                onClick={() => togglePD(pdName)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {pdName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">{pdName}</h3>
                    <p className="text-sm text-gray-500">PD ID: {pdData.pd_id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {pdData.chauffeurs?.length || 0} Chauffeur(s)
                  </span>
                  {expandedPDs.includes(pdName) ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedPDs.includes(pdName) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50">
                      {(!pdData.chauffeurs || pdData.chauffeurs.length === 0) ? (
                        <p className="text-gray-500 text-center text-sm">
                          No chauffeurs assigned
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {pdData.chauffeurs.map((chauffeur) => (
                            <li
                              key={chauffeur.chauffeur_id}
                              className="flex items-center p-2 bg-white rounded-md shadow-sm"
                            >
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  {chauffeur.chauffeur_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-800">
                                    {chauffeur.chauffeur_name}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ID: {chauffeur.chauffeur_id}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  Ride: {chauffeur.ride_id}
                                </div>
                                <div className="text-sm">
                                  Status:{" "}
                                  <span
                                    className={`${
                                      chauffeur.status === "Droprequest"
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {chauffeur.status}
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}