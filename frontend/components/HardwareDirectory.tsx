"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, LayoutGrid, List, Plus, Loader2 } from "lucide-react";
import { fetchHardwareList, Hardware } from "@/services/api";

export const HardwareDirectory: React.FC = () => {
  const [hardwareItems, setHardwareItems] = useState<Hardware[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadHardware = async () => {
      try {
        setIsLoading(true);
        const data = await fetchHardwareList();
        setHardwareItems(data);
      } catch (err) {
        console.error("Failed to fetch hardware:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadHardware();
  }, []);

  const filteredItems = hardwareItems.filter(
    (item) =>
      item.ckt_item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (error) {
    return (
      <div className="flex-1 bg-sky-50 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200 text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">
            Error loading hardware data
          </p>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-sky-50 p-8 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-slate-800">
          Hardware Directory
        </h1>
        <button className="bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-gray-200 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Plus size={18} />
          Add Hardware
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search hardware..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Filter...
            </button>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button className="p-2 bg-gray-100 text-gray-600 border-r border-gray-200">
                <List size={16} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">
                Fetching inventory...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <p>No hardware items found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    CKT#
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hardware Type
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {item.ckt_item_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.hardware_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.manufacturer}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.model_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.date_created}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-3">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-800 font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 shrink-0">
          <p>
            Showing 1 to {filteredItems.length} of {filteredItems.length}{" "}
            entries
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">
              Next {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
