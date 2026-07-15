"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { HARDWARE_ITEMS_PER_PAGE } from "@/constants/hardware";
import {
  filterEmployeeItems,
  getEmployeeFullName,
  getNextEmployeeSortConfig,
  paginateEmployeeItems,
  sortEmployeeItems,
} from "@/lib/employee-table";
import { EmployeeDetails, EmployeeSortConfig } from "@/types/employee";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const fallbackStatusStyle = "bg-slate-100 text-slate-600 ring-slate-500/20";

const displayValue = (value: string | null | undefined) => value || "—";

const getFullName = (employee: EmployeeDetails) =>
  getEmployeeFullName(employee) || "—";

interface DeploymentDirectoryProps {
  employees: EmployeeDetails[];
  isLoading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
}

export function EmployeeDirectory({
  employees,
  isLoading,
  error,
  onReload,
}: DeploymentDirectoryProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<EmployeeSortConfig>({
    key: null,
    direction: null,
  });

  const handleAddEmployeeSuccess = async () => {
    await onReload();
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const filteredEmployees = filterEmployeeItems(
    employees,
    searchTerm,
    departmentFilter,
    statusFilter,
  );

  const sortedEmployees = React.useMemo(() => {
    return sortEmployeeItems(filteredEmployees, sortConfig);
  }, [filteredEmployees, sortConfig]);

  const totalPages = Math.ceil(
    sortedEmployees.length / HARDWARE_ITEMS_PER_PAGE,
  );
  const paginatedEmployees = paginateEmployeeItems(
    sortedEmployees,
    currentPage,
    HARDWARE_ITEMS_PER_PAGE,
  );

  const departmentOptions = React.useMemo(
    () =>
      [
        ...new Set(
          employees
            .map((employee) => employee.department)
            .filter((department): department is string => Boolean(department)),
        ),
      ].sort(),
    [employees],
  );

  const handleSort = (key: EmployeeSortConfig["key"]) => {
    setSortConfig((prev) => getNextEmployeeSortConfig(prev, key));
  };

  const renderSortIcon = (key: EmployeeSortConfig["key"]) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === "asc") {
      return <ChevronUp size={14} className="ml-1" />;
    }
    if (sortConfig.direction === "desc") {
      return <ChevronDown size={14} className="ml-1" />;
    }
    return null;
  };

  const renderSortableHeader = (
    label: string,
    key: EmployeeSortConfig["key"],
  ) => (
    <th
      className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center">
        {label} {renderSortIcon(key)}
      </div>
    </th>
  );

  return (
    <main className="page-shell flex flex-1 flex-col">
      <div className="page-container flex flex-1 flex-col">
      <header className="mb-7 flex shrink-0 flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">People directory</p>
          <h1 className="page-title">Employees</h1>
          <p className="page-description">Manage employee details and quickly find the people assigned to company assets.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="button-primary"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </header>

      <div className="surface-card flex flex-1 flex-col overflow-hidden">
        <div className="data-toolbar flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="All">All Departments</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
            {(searchTerm || departmentFilter !== "All" || statusFilter !== "All") && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("All");
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="data-table w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                {renderSortableHeader("Employee Code", "employee_digit_code")}
                {renderSortableHeader("Full Name", "full_name")}
                {renderSortableHeader("Contact Number", "contact_number")}
                {renderSortableHeader("Position", "position")}
                {renderSortableHeader("Department", "department")}
                {renderSortableHeader("Date Hired", "date_hired")}
                {renderSortableHeader("Status", "status")}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-600" />
                      <p className="font-medium">Fetching employees...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20">
                    <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                      <p className="mb-2 font-semibold text-red-700">
                        Error loading employees
                      </p>
                      <p className="mb-4 text-sm text-red-600">{error}</p>
                      <button
                        type="button"
                        onClick={() => void onReload()}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-slate-500"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => {
                  const status = employee.status || "—";
                  const statusStyle =
                    statusStyles[status] ?? fallbackStatusStyle;

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-purple-600">
                        <Link
                          href={`/employee/${employee.id}`}
                          className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors"
                        >
                          {displayValue(employee.employee_digit_code)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                            <UserRound size={17} />
                          </div>
                          <span className="font-medium">
                            {getFullName(employee)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {displayValue(employee.contact_number)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {displayValue(employee.position)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {displayValue(employee.department)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {displayValue(employee.date_hired)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 shrink-0">
          <p>
            Showing{" "}
            {Math.min(
              (currentPage - 1) * HARDWARE_ITEMS_PER_PAGE + 1,
              filteredEmployees.length,
            )}{" "}
            to{" "}
            {Math.min(
              currentPage * HARDWARE_ITEMS_PER_PAGE,
              filteredEmployees.length,
            )}{" "}
            of {filteredEmployees.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
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
                        type="button"
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
              type="button"
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
      </div>
      <AnimatePresence>
        {isAddModalOpen && (
          <AddEmployeeModal
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleAddEmployeeSuccess}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
