"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Filter, Loader2, Search } from "lucide-react";
import {
  assignHardware,
  fetchEmployeeById,
  fetchHardwareAssignmentList,
  fetchHardwareList,
} from "@/services/api";
import { getActiveAssignedHardwareIds } from "@/lib/assignment-table";
import { getEmployeeFullName } from "@/lib/employee-table";
import { HardwareAssignment } from "@/types/assignment";
import { Hardware } from "@/types/hardware";
import { EmployeeDetails } from "@/types/employee";

const ASSIGN_HARDWARE_ITEMS_PER_PAGE = 10;

const displayValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const getStatusStyle = (status: string | null | undefined) => {
  if (status === "Operational") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (status === "Under Repair") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  if (status === "Non-Operational") {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  return "bg-slate-100 text-slate-600 ring-slate-500/20";
};

const getConditionStyle = (condition: string | null | undefined) => {
  if (condition === "New") {
    return "bg-purple-50 text-purple-700 ring-purple-600/20";
  }

  if (condition === "Used") {
    return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }

  return "bg-blue-50 text-blue-700 ring-blue-600/20";
};

export default function EmployeeHardwareSelectionPage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const employeeId = params.employeeId;
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [hardwareItems, setHardwareItems] = useState<Hardware[]>([]);
  const [assignments, setAssignments] = useState<HardwareAssignment[]>([]);
  const [assignedHardwareItems, setAssignedHardwareItems] = useState<
    Hardware[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [hardwareTypeFilter, setHardwareTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    if (!employeeId || Number.isNaN(Number(employeeId))) {
      setError("Invalid employee id.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [employeeData, hardwareData, assignmentData] = await Promise.all([
        fetchEmployeeById(employeeId),
        fetchHardwareList(),
        fetchHardwareAssignmentList(),
      ]);
      setEmployee(employeeData);
      setHardwareItems(hardwareData);
      setAssignments(assignmentData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch hardware list.",
      );
      setEmployee(null);
      setHardwareItems([]);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPageData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPageData]);

  const hardwareTypeOptions = useMemo(
    () =>
      [
        ...new Set(
          hardwareItems
            .map((item) => item.hardware_type)
            .filter((type): type is string => Boolean(type)),
        ),
      ].sort(),
    [hardwareItems],
  );

  const activeAssignedHardwareIds = useMemo(
    () => getActiveAssignedHardwareIds(assignments),
    [assignments],
  );

  const availableHardwareItems = useMemo(
    () =>
      hardwareItems.filter((item) => !activeAssignedHardwareIds.has(item.id)),
    [activeAssignedHardwareIds, hardwareItems],
  );

  const filteredHardwareItems = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toUpperCase();

    return availableHardwareItems.filter((item) => {
      const matchesSearch =
        normalizedSearchTerm === "" ||
        [
          item.ckt_item_number,
          item.hardware_type,
          item.manufacturer,
          item.model_number,
          item.serial_number,
        ].some((value) => value?.toUpperCase().includes(normalizedSearchTerm));
      const matchesHardwareType =
        hardwareTypeFilter === "All" ||
        item.hardware_type === hardwareTypeFilter;

      return matchesSearch && matchesHardwareType;
    });
  }, [availableHardwareItems, hardwareTypeFilter, searchTerm]);

  const totalPages = Math.ceil(
    filteredHardwareItems.length / ASSIGN_HARDWARE_ITEMS_PER_PAGE,
  );
  const paginatedHardwareItems = filteredHardwareItems.slice(
    (currentPage - 1) * ASSIGN_HARDWARE_ITEMS_PER_PAGE,
    currentPage * ASSIGN_HARDWARE_ITEMS_PER_PAGE,
  );

  const assignedHardwareIds = useMemo(
    () => new Set(assignedHardwareItems.map((item) => item.id)),
    [assignedHardwareItems],
  );

  const handleAssignHardware = (hardware: Hardware) => {
    setAssignedHardwareItems((prev) => {
      if (prev.some((item) => item.id === hardware.id)) return prev;
      return [...prev, hardware];
    });
  };

  const handleUnassignHardware = (hardwareId: number) => {
    setAssignedHardwareItems((prev) =>
      prev.filter((item) => item.id !== hardwareId),
    );
  };

  const handleSubmitAssignment = async () => {
    const numericEmployeeId = Number(employeeId);
    if (Number.isNaN(numericEmployeeId)) {
      setSubmitError("Invalid employee id.");
      return;
    }

    if (assignedHardwareItems.length === 0) {
      setSubmitError("Select at least one hardware item.");
      return;
    }

    try {
      setIsSubmittingAssignment(true);
      setSubmitError(null);
      await assignHardware({
        employee_details_id: numericEmployeeId,
        hardware_ids: assignedHardwareItems.map((item) => item.id),
        date_assigned: new Date().toISOString().slice(0, 10),
        status: "Assigned",
      });
      setAssignedHardwareItems([]);
      router.push("/assignment");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to assign hardware.",
      );
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const employeeName = employee
    ? getEmployeeFullName(employee) || `Employee #${employee.id}`
    : `Employee #${displayValue(employeeId)}`;

  return (
    <main className="page-shell min-h-full flex-1">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <Link
            href="/assignment"
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Assignments
          </Link>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">New deployment</p>
          <h1 className="page-title">
            Assign Hardware
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select hardware for {employeeName}
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Hardware List
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredHardwareItems.length} item
                {filteredHardwareItems.length === 1 ? "" : "s"} shown
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-56 max-w-md flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search hardware..."
                  value={searchTerm}
                  onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-600 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={hardwareTypeFilter}
                  onChange={(event) => { setHardwareTypeFilter(event.target.value); setCurrentPage(1); }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 outline-none transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="All">All Hardware Types</option>
                  {hardwareTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {assignedHardwareItems.length > 0 && (
            <div className="border-b border-gray-100 bg-purple-50/40 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Assigned Hardware
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {assignedHardwareItems.length} selected item
                    {assignedHardwareItems.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSubmitAssignment()}
                  disabled={
                    isSubmittingAssignment || assignedHardwareItems.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingAssignment && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {isSubmittingAssignment ? "Assigning..." : "Submit Assignment"}
                </button>
              </div>
              {submitError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              <div className="max-h-[260px] overflow-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        CKT#
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Hardware Type
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Brand
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Model
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Serial Number
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assignedHardwareItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                          {displayValue(item.ckt_item_number)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {displayValue(item.hardware_type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {displayValue(item.manufacturer)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {displayValue(item.model_number)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {displayValue(item.serial_number)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() => handleUnassignHardware(item.id)}
                            className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-slate-500">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-600" />
              <p className="font-medium">Fetching hardware list...</p>
            </div>
          ) : error ? (
            <div className="mx-auto flex min-h-72 max-w-md flex-col items-center justify-center p-8 text-center">
              <p className="mb-2 font-semibold text-red-700">
                Error loading hardware list
              </p>
              <p className="mb-4 text-sm text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadPageData()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          ) : filteredHardwareItems.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No hardware items found.
              </p>
            </div>
          ) : (
            <div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        CKT#
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Hardware Type
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Brand
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Model
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Serial Number
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Condition
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Date Tested
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedHardwareItems.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-6 py-4 text-sm font-medium">
                          <Link
                            href={`/hardware/${item.id}`}
                            className="font-semibold text-purple-600 transition-colors hover:text-purple-800 hover:underline"
                          >
                            {displayValue(item.ckt_item_number)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {displayValue(item.hardware_type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {displayValue(item.manufacturer)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {displayValue(item.model_number)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {displayValue(item.serial_number)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                              item.operational,
                            )}`}
                          >
                            {displayValue(item.operational)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getConditionStyle(
                              item.new_or_used,
                            )}`}
                          >
                            {displayValue(item.new_or_used)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {displayValue(item.date_tested)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            type="button"
                            onClick={() => handleAssignHardware(item)}
                            disabled={assignedHardwareIds.has(item.id)}
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                          >
                            {assignedHardwareIds.has(item.id)
                              ? "Assigned"
                              : "Assign"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4 text-sm text-gray-500">
                <p>
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * ASSIGN_HARDWARE_ITEMS_PER_PAGE + 1,
                    filteredHardwareItems.length,
                  )}{" "}
                  to{" "}
                  {Math.min(
                    currentPage * ASSIGN_HARDWARE_ITEMS_PER_PAGE,
                    filteredHardwareItems.length,
                  )}{" "}
                  of {filteredHardwareItems.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded border border-gray-200 px-3 py-1 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-500">
                    Page {currentPage} of {Math.max(totalPages, 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, Math.max(totalPages, 1)),
                      )
                    }
                    disabled={currentPage >= totalPages}
                    className="rounded border border-gray-200 px-3 py-1 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
