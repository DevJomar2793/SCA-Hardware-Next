"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  HardDrive,
  Loader2,
  RefreshCw,
  RotateCw,
  Users,
} from "lucide-react";
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
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const activeAssignments = assignments.filter((item) => !isReturnedAssignment(item));
  const returnedAssignments = assignments.filter(isReturnedAssignment);
  const recentHardware = useMemo(
    () => [...hardwareItems].sort((a, b) => b.id - a.id).slice(0, 5),
    [hardwareItems],
  );
  const recentAssignments = useMemo(
    () => [...assignments].sort((a, b) => b.id - a.id).slice(0, 5),
    [assignments],
  );
  const operationalCount = hardwareItems.filter(
    (item) => item.operational?.trim().toLowerCase() === "operational",
  ).length;

  const getEmployeeLabel = (assignment: HardwareAssignment) => {
    const employee = employeeById.get(assignment.employee_details_id);
    return employee
      ? getEmployeeFullName(employee) || `Employee #${employee.id}`
      : `Employee #${assignment.employee_details_id}`;
  };

  const metrics = [
    {
      label: "Hardware assets",
      value: hardwareItems.length,
      detail: `${operationalCount} operational`,
      icon: HardDrive,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Employees",
      value: employees.length,
      detail: "People on record",
      icon: Users,
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "Active assignments",
      value: activeAssignments.length,
      detail: "Currently deployed",
      icon: RotateCw,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Returned",
      value: returnedAssignments.length,
      detail: "Completed returns",
      icon: CircleCheck,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="surface-card flex flex-col items-center px-10 py-12 text-slate-500">
          <Loader2 className="mb-4 h-9 w-9 animate-spin text-indigo-600" />
          <p className="font-medium">Loading inventory overview…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="surface-card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <RefreshCw size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <button type="button" onClick={() => void loadDashboard()} className="button-primary mt-6">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Inventory workspace
            </p>
            <h1 className="page-title">Overview</h1>
            <p className="page-description">A current snapshot of assets, people, and hardware deployment.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/hardware" className="button-secondary">
              <HardDrive size={16} /> View inventory
            </Link>
            <Link href="/assignment" className="button-primary">
              <RotateCw size={16} /> Manage assignments
            </Link>
          </div>
        </header>

        <section aria-label="Inventory metrics" className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">{metric.detail}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.color}`}>
                  <metric.icon size={21} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Recent hardware</h2>
                <p className="mt-0.5 text-xs text-slate-500">Newest inventory records</p>
              </div>
              <Link href="/hardware" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight size={15} />
              </Link>
            </div>
            {recentHardware.length === 0 ? (
              <EmptyList icon={Boxes} message="No hardware records yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentHardware.map((hardware) => (
                  <Link key={hardware.id} href={`/hardware/${hardware.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <HardDrive size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayValue(hardware.ckt_item_number)}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {[hardware.hardware_type, hardware.manufacturer, hardware.model_number].filter(Boolean).join(" · ") || "Details unavailable"}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Recent assignments</h2>
                <p className="mt-0.5 text-xs text-slate-500">Latest deployment activity</p>
              </div>
              <Link href="/assignment" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight size={15} />
              </Link>
            </div>
            {recentAssignments.length === 0 ? (
              <EmptyList icon={RotateCw} message="No assignments recorded yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAssignments.map((assignment) => (
                  <Link key={assignment.id} href={`/assignment/${assignment.id}/hardware`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{getEmployeeLabel(assignment)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Assigned {displayValue(assignment.date_assigned)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isReturnedAssignment(assignment) ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {displayValue(assignment.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function EmptyList({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  message: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center text-slate-500">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
