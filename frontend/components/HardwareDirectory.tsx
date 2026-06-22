"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Loader2,
  FileUp,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { importExcel } from "@/services/api";
import { HARDWARE_ITEMS_PER_PAGE } from "@/constants/hardware";
import {
  filterHardwareItems,
  getNextSortConfig,
  paginateHardwareItems,
  sortHardwareItems,
} from "@/lib/hardware-table";
import { Hardware, HardwareSortConfig } from "@/types/hardware";
import { AddHardwareModal } from "./AddHardwareModal";
import { AnimatePresence } from "framer-motion";
import { useRef } from "react";

interface HardwareDirectoryProps {
  hardwareItems: Hardware[];
  isLoading: boolean;
  error: string | null;
  onErrorChange: React.Dispatch<React.SetStateAction<string | null>>;
  onReload: () => Promise<void>;
}

export const HardwareDirectory: React.FC<HardwareDirectoryProps> = ({
  hardwareItems,
  isLoading,
  error,
  onErrorChange,
  onReload,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("All");
  const [sortConfig, setSortConfig] = useState<HardwareSortConfig>({
    key: null,
    direction: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddHardwareSuccess = async () => {
    await onReload();
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Importing file:", file.name);

    try {
      setIsImporting(true);
      onErrorChange(null);
      const result = await importExcel(file);
      console.log("Import successful:", result);
      alert(
        `Successfully imported ${result.imported} items. ${result.skipped} items were skipped.`,
      );
      await onReload();
    } catch (err) {
      console.error("Import failed:", err);
      onErrorChange(
        err instanceof Error ? err.message : "Failed to import Excel file",
      );
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = ""; // Reset input
    }
  };

  const filteredItems = filterHardwareItems(
    hardwareItems,
    searchTerm,
    filterType,
  );

  const sortedItems = React.useMemo(() => {
    return sortHardwareItems(filteredItems, sortConfig);
  }, [filteredItems, sortConfig]);

  const totalPages = Math.ceil(sortedItems.length / HARDWARE_ITEMS_PER_PAGE);
  const paginatedItems = paginateHardwareItems(
    sortedItems,
    currentPage,
    HARDWARE_ITEMS_PER_PAGE,
  );

  const handleSort = (key: keyof Hardware) => {
    setSortConfig((prev) => getNextSortConfig(prev, key));
  };

  const renderSortIcon = (key: keyof Hardware) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === "asc")
      return <ChevronUp size={14} className="ml-1" />;
    if (sortConfig.direction === "desc")
      return <ChevronDown size={14} className="ml-1" />;
    return null;
  };

  if (error) {
    return (
      <div className="flex-1 bg-sky-50 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200 text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">
            Error loading hardware data
          </p>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => void onReload()}
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-gray-200 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Hardware
          </button>
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className={`bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-gray-200 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${isImporting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isImporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileUp size={18} />
            )}
            {isImporting ? "Importing..." : "Import Excel"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
          />
        </div>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="All">ALL HARDWARE TYPES</option>
                {[...new Set(hardwareItems.map((item) => item.hardware_type))]
                  .sort()
                  .map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
            </div>
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
                  <th
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleSort("ckt_item_number")}
                  >
                    <div className="flex items-center">
                      CKT# {renderSortIcon("ckt_item_number")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleSort("hardware_type")}
                  >
                    <div className="flex items-center">
                      Hardware Type {renderSortIcon("hardware_type")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleSort("manufacturer")}
                  >
                    <div className="flex items-center">
                      Brand {renderSortIcon("manufacturer")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleSort("model_number")}
                  >
                    <div className="flex items-center">
                      Model {renderSortIcon("model_number")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleSort("date_tested")}
                  >
                    <div className="flex items-center">
                      Date Tested {renderSortIcon("date_tested")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Created At {renderSortIcon("created_at")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        href={`/hardware/${item.id}`}
                        className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors"
                      >
                        {item.ckt_item_number}
                      </Link>
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
                      {item.date_tested || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.created_at}
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
            Showing{" "}
            {Math.min(
              (currentPage - 1) * HARDWARE_ITEMS_PER_PAGE + 1,
              filteredItems.length,
            )}{" "}
            to{" "}
            {Math.min(
              currentPage * HARDWARE_ITEMS_PER_PAGE,
              filteredItems.length,
            )}{" "}
            of {filteredItems.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, and pages around current page
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  const isFirstEllipsis =
                    index > 0 && page - array[index - 1] > 1;
                  const isLastEllipsis =
                    index < array.length - 1 && array[index + 1] - page > 1;

                  return (
                    <React.Fragment key={page}>
                      {isFirstEllipsis && (
                        <span className="px-2 py-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded transition-colors ${
                          currentPage === page
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                      {isLastEllipsis && <span className="px-2 py-1">...</span>}
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next {">"}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isAddModalOpen && (
          <AddHardwareModal
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleAddHardwareSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
