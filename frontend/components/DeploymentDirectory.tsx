"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { fetchEmployeeList } from "@/services/api";
import { EmployeeDetails } from "@/types/employee";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const fallbackStatusStyle = "bg-slate-100 text-slate-600 ring-slate-500/20";

const displayValue = (value: string | null | undefined) => value || "—";

const getFullName = (employee: EmployeeDetails) => {
  const fullName = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "—";
};

export function DeploymentDirectory() {
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchEmployeeList();
      setEmployees(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch employees",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEmployees();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEmployees]);

  return (
    <div className="flex-1 bg-sky-50 p-8 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Employee Table</h1>
        </div>
        <button
          type="button"
          className="bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-gray-200 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-purple-500/20">
                <option>All Departments</option>
                <option>IT Support</option>
                <option>Operations</option>
                <option>Administration</option>
                <option>Finance</option>
                <option>Procurement</option>
              </select>
            </div>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-purple-500/20">
              <option>All Status</option>
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                className="p-2 bg-gray-100 text-gray-600 border-r border-gray-200"
                title="Table view"
                aria-label="Table view"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[960px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee Code
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact Number
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Hired
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
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
                        onClick={() => void loadEmployees()}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-100"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const status = employee.status || "—";
                  const statusStyle =
                    statusStyles[status] ?? fallbackStatusStyle;

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-purple-600">
                        {displayValue(employee.employee_digit_code)}
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
            Showing {employees.length > 0 ? 1 : 0} to {employees.length} of{" "}
            {employees.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 border border-gray-200 rounded text-gray-400 cursor-default"
            >
              Previous
            </button>
            <button
              type="button"
              className="px-3 py-1 border rounded bg-purple-600 text-white border-purple-600"
            >
              1
            </button>
            <button
              type="button"
              className="px-3 py-1 border border-gray-200 rounded text-gray-400 cursor-default"
            >
              Next {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
