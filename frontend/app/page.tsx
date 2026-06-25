"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  fetchEmployeeList,
  fetchHardwareAssignmentList,
  fetchHardwareList,
} from "@/services/api";
import { HardwareAssignment } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";
import { Hardware } from "@/types/hardware";
import { getEmployeeFullName } from "@/lib/employee-table";

const displayValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);

const isReturnedAssignment = (assignment: HardwareAssignment) =>
  Boolean(assignment.date_returned) ||
  assignment.status.trim().toLowerCase() === "returned";

export default function DashboardPage() {
  const [hardwareItems, setHardwareItems] = useState<Hardware[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [assignments, setAssignments] = useState<HardwareAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [hardwareData, employeeData, assignmentData] = await Promise.all([
        fetchHardwareList(),
        fetchEmployeeList(),
        fetchHardwareAssignmentList(),
      ]);

      setHardwareItems(hardwareData);
      setEmployees(employeeData);
      setAssignments(assignmentData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const activeAssignments = assignments.filter(
    (assignment) => !isReturnedAssignment(assignment),
  );
  const returnedAssignments = assignments.filter(isReturnedAssignment);

  const recentHardware = useMemo(
    () => [...hardwareItems].sort((a, b) => b.id - a.id).slice(0, 5),
    [hardwareItems],
  );

  const recentAssignments = useMemo(
    () => [...assignments].sort((a, b) => b.id - a.id).slice(0, 5),
    [assignments],
  );

  const getEmployeeLabel = (assignment: HardwareAssignment) => {
    const employee = employeeById.get(assignment.employee_details_id);
    if (!employee) return `Employee #${assignment.employee_details_id}`;

    return getEmployeeFullName(employee) || `Employee #${employee.id}`;
  };

  const metrics = [
    { label: "Total Hardware", value: hardwareItems.length },
    { label: "Total Employees", value: employees.length },
    { label: "Active Assignments", value: activeAssignments.length },
    { label: "Returned Assignments", value: returnedAssignments.length },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-100 p-8">
        <div className="flex flex-col items-center rounded-xl bg-white p-8 text-slate-500 shadow-sm">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-600" />
          <p className="font-medium">Loading dashboard overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-100 p-8">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 font-semibold text-red-700">
            Error loading dashboard
          </p>
          <p className="mb-6 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-800">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            Recent Hardware
          </h2>
          {recentHardware.length === 0 ? (
            <p className="text-sm text-slate-500">No hardware records found.</p>
          ) : (
            <div className="space-y-3">
              {recentHardware.map((hardware) => (
                <div
                  key={hardware.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <p className="font-semibold text-slate-800">
                    {displayValue(hardware.ckt_item_number)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[hardware.hardware_type, hardware.manufacturer]
                      .filter(Boolean)
                      .join(" · ") || "Hardware details unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {displayValue(hardware.model_number)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            Recent Assignments
          </h2>
          {recentAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hardware assignments found.
            </p>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {getEmployeeLabel(assignment)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Assigned {displayValue(assignment.date_assigned)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    {displayValue(assignment.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
