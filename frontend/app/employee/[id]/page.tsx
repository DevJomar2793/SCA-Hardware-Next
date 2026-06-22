"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { deleteEmployee, fetchEmployeeById } from "@/services/api";
import { AddEmployeeModal } from "@/components/AddEmployeeModal";
import { EmployeeDetails } from "@/types/employee";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const fallbackStatusStyle = "bg-slate-100 text-slate-600 ring-slate-500/20";

const displayValue = (value: string | null | undefined) => value || "-";

const getFullName = (employee: EmployeeDetails) => {
  const fullName = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "-";
};

const getInitials = (employee: EmployeeDetails | null) => {
  if (!employee) return "--";

  const initials = [employee.first_name, employee.last_name]
    .map((name) => name?.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || "--";
};

const DetailItem = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {displayValue(value)}
        </p>
      </div>
    </div>
  </div>
);

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = params.id;
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEmployee = useCallback(async () => {
    if (!employeeId || Number.isNaN(Number(employeeId))) {
      setError("Invalid employee id.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchEmployeeById(employeeId);
      setEmployee(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch employee details",
      );
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEmployee();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEmployee]);

  const status = employee?.status || "-";
  const statusStyle = statusStyles[status] ?? fallbackStatusStyle;
  const fullName = useMemo(
    () => (employee ? getFullName(employee) : "-"),
    [employee],
  );

  const handleEditSuccess = async () => {
    await loadEmployee();
    setIsEditModalOpen(false);
  };

  const handleDeleteEmployee = async () => {
    if (!employee) return;

    const isConfirmed = window.confirm(
      `This will permanently delete ${getFullName(employee)}.`,
    );

    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      await deleteEmployee(employee.id);
      window.sessionStorage.setItem(
        "employee-delete-toast",
        "Employee deleted successfully",
      );
      router.push("/employee");
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to delete employee.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-sky-50 p-8">
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-slate-500 shadow-sm">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-600" />
          <p className="font-medium">Fetching employee details...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-sky-50 p-8">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 font-semibold text-red-700">
            Unable to load employee
          </p>
          <p className="mb-6 text-sm text-slate-600">
            {error || "Employee not found."}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/employee"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50"
            >
              Back to Employee
            </Link>
            <button
              type="button"
              onClick={() => void loadEmployee()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-sky-50 p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/employee"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Employee
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteEmployee()}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-lg font-bold text-white shadow-sm">
                  {getInitials(employee)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-600">
                    {displayValue(employee.employee_digit_code)}
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-800">
                    {fullName}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {displayValue(employee.position)}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusStyle}`}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Contact & Role
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Contact Number"
                    value={employee.contact_number}
                    icon={Phone}
                  />
                  <DetailItem
                    label="Employee Code"
                    value={employee.employee_digit_code}
                    icon={UserRound}
                  />
                  <DetailItem
                    label="Position"
                    value={employee.position}
                    icon={BriefcaseBusiness}
                  />
                  <DetailItem
                    label="Department"
                    value={employee.department}
                    icon={Mail}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                  Employment
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Date Hired"
                    value={employee.date_hired}
                    icon={CalendarDays}
                  />
                  <DetailItem
                    label="Created Date"
                    value={employee.date_created}
                    icon={Clock3}
                  />
                </div>
              </section>
            </div>

            <aside className="rounded-xl border border-gray-200 bg-slate-50 p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-600">
                Notes
              </h2>
              <p className="min-h-36 whitespace-pre-wrap rounded-lg border border-gray-100 bg-white p-4 text-sm leading-6 text-slate-700">
                {employee.notes || "No notes available."}
              </p>
            </aside>
          </div>
        </section>
      </div>
      <AnimatePresence>
        {isEditModalOpen && (
          <AddEmployeeModal
            employee={employee}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
