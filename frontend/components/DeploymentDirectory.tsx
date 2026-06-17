"use client";

import {
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

type EmployeeTableRow = {
  id: number;
  employee_digit_code: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  department: string;
  position: string;
  date_hired: string;
  status: "Active" | "On Leave" | "Inactive";
};

const employeeRows: EmployeeTableRow[] = [
  {
    id: 1,
    employee_digit_code: "EMP-1001",
    first_name: "Maria",
    last_name: "Santos",
    contact_number: "0917 245 8891",
    position: "IT Support",
    department: "IT Support",
    date_hired: "2024-02-12",
    status: "Active",
  },
  {
    id: 2,
    employee_digit_code: "EMP-1002",
    first_name: "Jomar",
    last_name: "Cerrado",
    contact_number: "0928 716 4302",
    position: "IT Support",
    department: "Operations",
    date_hired: "2023-09-18",
    status: "Active",
  },
  {
    id: 3,
    employee_digit_code: "EMP-1003",
    first_name: "Angela",
    last_name: "Reyes",
    contact_number: "0995 104 7720",
    position: "IT Support",
    department: "Administration",
    date_hired: "2022-11-07",
    status: "On Leave",
  },
  {
    id: 4,
    employee_digit_code: "EMP-1004",
    first_name: "Mark",
    last_name: "Dela Cruz",
    contact_number: "0906 318 5574",
    position: "IT Support",
    department: "Finance",
    date_hired: "2021-06-21",
    status: "Active",
  },
  {
    id: 5,
    employee_digit_code: "EMP-1005",
    first_name: "Nicole",
    last_name: "Garcia",
    contact_number: "0918 642 0935",
    position: "IT Support",
    department: "Procurement",
    date_hired: "2020-03-16",
    status: "Inactive",
  },
];

const statusStyles: Record<EmployeeTableRow["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function DeploymentDirectory() {
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
              {employeeRows.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-purple-600">
                    {employee.employee_digit_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <UserRound size={17} />
                      </div>
                      <span className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {employee.contact_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {employee.position}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {employee.date_hired}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[employee.status]}`}
                    >
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 shrink-0">
          <p>
            Showing 1 to {employeeRows.length} of {employeeRows.length} entries
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
