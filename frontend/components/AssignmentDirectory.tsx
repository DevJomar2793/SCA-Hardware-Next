import { Filter, Loader2, Search } from "lucide-react";
import { useMemo } from "react";
import { HardwareAssignment } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";
import { getEmployeeFullName } from "@/lib/employee-table";

interface AssignmentDirectoryProps {
  assignments: HardwareAssignment[];
  employees: EmployeeDetails[];
  isLoading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
}

const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "NA";
};

export function AssignmentDirectory({
  assignments,
  employees,
  isLoading,
  error,
  onReload,
}: AssignmentDirectoryProps) {
  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const getEmployeeLabel = (assignment: HardwareAssignment) => {
    const employee = employeeById.get(assignment.employee_details_id);
    if (!employee) return `Employee #${assignment.employee_details_id}`;

    return getEmployeeFullName(employee) || `Employee #${employee.id}`;
  };

  const getEmployeePosition = (assignment: HardwareAssignment) => {
    const employee = employeeById.get(assignment.employee_details_id);
    return employee?.position || "Position unavailable";
  };

  return (
    <div className="min-h-full bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Hardware Assignments
        </h1>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative min-w-56 max-w-md flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search assignments..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-600 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm outline-none transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-purple-500/20">
            <option>All Status</option>
            <option>Assigned</option>
            <option>Returned</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
          <p className="font-medium">Fetching hardware assignments...</p>
        </div>
      ) : error ? (
        <div className="mx-auto flex min-h-72 max-w-md flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 font-semibold text-red-700">
            Error loading assignments
          </p>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void onReload()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            No hardware assignments found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {assignments.map((assignment) => {
            const name = getEmployeeLabel(assignment);

            return (
              <article
                key={assignment.id}
                className="overflow-hidden rounded-xl bg-white text-center shadow-md shadow-slate-200/70"
              >
                <div className="h-20 bg-blue-100" />
                <div className="px-6 pb-6">
                  <div className="-mt-10 mb-5 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xl font-bold text-white shadow-sm">
                      {getInitials(name)}
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{name}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {getEmployeePosition(assignment)}
                  </p>
                  <button
                    type="button"
                    className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View Assignment
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
