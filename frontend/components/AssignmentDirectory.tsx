import { Filter, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HardwareAssignment } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";
import { getEmployeeFullName } from "@/lib/employee-table";
import {
  AssignmentCardGroup,
  filterUnassignedEmployees,
  getAssignedEmployeeIds,
  groupActiveAssignmentsByEmployee,
} from "@/lib/assignment-table";

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

const displayValue = (value: string | null | undefined) => value || "-";

const getStatusStyle = (status: string | null | undefined) => {
  if ((status || "").trim().toLowerCase() === "returned") {
    return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
};

export function AssignmentDirectory({
  assignments,
  employees,
  isLoading,
  error,
  onReload,
}: AssignmentDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const departmentOptions = useMemo(
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

  const assignmentGroups = useMemo(
    () => groupActiveAssignmentsByEmployee(assignments),
    [assignments],
  );

  const filteredAssignmentGroups = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toUpperCase();

    return assignmentGroups.filter((assignmentGroup) => {
      const employee = employeeById.get(assignmentGroup.employee_details_id);
      const employeeName = employee ? getEmployeeFullName(employee) : "";
      const matchesSearch =
        normalizedSearchTerm === "" ||
        employeeName.toUpperCase().includes(normalizedSearchTerm);
      const matchesDepartment =
        departmentFilter === "All" || employee?.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [assignmentGroups, departmentFilter, employeeById, searchTerm]);

  const assignedEmployeeIds = useMemo(
    () => getAssignedEmployeeIds(assignmentGroups),
    [assignmentGroups],
  );

  const filteredUnassignedEmployees = useMemo(
    () =>
      filterUnassignedEmployees(
        employees,
        assignedEmployeeIds,
        searchTerm,
        departmentFilter,
        getEmployeeFullName,
      ),
    [assignedEmployeeIds, departmentFilter, employees, searchTerm],
  );

  const hasVisibleCards =
    filteredAssignmentGroups.length > 0 ||
    filteredUnassignedEmployees.length > 0;

  const getEmployeeLabel = (assignmentGroup: AssignmentCardGroup) => {
    const employee = employeeById.get(assignmentGroup.employee_details_id);
    if (!employee) return `Employee #${assignmentGroup.employee_details_id}`;

    return getEmployeeFullName(employee) || `Employee #${employee.id}`;
  };

  const getEmployeePosition = (assignmentGroup: AssignmentCardGroup) => {
    const employee = employeeById.get(assignmentGroup.employee_details_id);
    return employee?.position || "Position unavailable";
  };

  const getEmployeeDepartment = (assignmentGroup: AssignmentCardGroup) => {
    const employee = employeeById.get(assignmentGroup.employee_details_id);
    return employee?.department || "Department unavailable";
  };

  const getUnassignedEmployeeName = (employee: EmployeeDetails) =>
    getEmployeeFullName(employee) || `Employee #${employee.id}`;

  return (
    <div className="min-h-full bg-gray-100 p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-600 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm outline-none transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="All">All Departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
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
      ) : employees.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            No employees found.
          </p>
        </div>
      ) : !hasVisibleCards ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            No matching assignments found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAssignmentGroups.map((assignmentGroup) => {
            const name = getEmployeeLabel(assignmentGroup);

            return (
              <article
                key={assignmentGroup.employee_details_id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-16 bg-slate-100" />
                <div className="px-5 pb-5">
                  <div className="-mt-8 mb-4 flex items-end justify-between gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-lg font-bold text-white shadow-sm">
                      {getInitials(name)}
                    </div>
                    <span
                      className={`mb-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                        "Assigned",
                      )}`}
                    >
                      {assignmentGroup.assignments.length} deployed
                    </span>
                  </div>
                  <div className="text-left">
                    <h2 className="truncate text-lg font-bold text-slate-900">
                      {name}
                    </h2>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">
                      {getEmployeePosition(assignmentGroup)}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium uppercase tracking-wide text-slate-400">
                      {getEmployeeDepartment(assignmentGroup)}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      href={`/assignment/${assignmentGroup.assignmentId}/hardware`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View Deployed Hardware
                    </Link>
                    <Link
                      href={`/assignment/employee/${assignmentGroup.employee_details_id}/hardware`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Plus size={16} />
                      Add Hardware
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
          {filteredUnassignedEmployees.map((employee) => {
            const name = getUnassignedEmployeeName(employee);

            return (
              <article
                key={`employee-${employee.id}`}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-16 bg-slate-100" />
                <div className="px-5 pb-5">
                  <div className="-mt-8 mb-4 flex items-end justify-between gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-slate-600 text-lg font-bold text-white shadow-sm">
                      {getInitials(name)}
                    </div>
                    <span className="mb-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      Unassigned
                    </span>
                  </div>
                  <div className="text-left">
                    <h2 className="truncate text-lg font-bold text-slate-900">
                      {name}
                    </h2>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">
                      {employee.position || "Position unavailable"}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium uppercase tracking-wide text-slate-400">
                      {employee.department || "Department unavailable"}
                    </p>
                  </div>
                  <Link
                    href={`/assignment/employee/${employee.id}/hardware`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Assign Hardware
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
