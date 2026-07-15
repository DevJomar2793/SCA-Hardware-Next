"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Loader2, MinusCircle } from "lucide-react";
import Swal from "sweetalert2";
import {
  fetchAssignedHardwareByAssignmentId,
  returnHardwareAssignment,
} from "@/services/api";
import { DeployedHardwareItem } from "@/types/assignment";
import { ReturnHardwareModal } from "@/components/ReturnHardwareModal";

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

export default function AssignmentHardwarePage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;
  const [deployedItems, setDeployedItems] = useState<DeployedHardwareItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveActions, setShowRemoveActions] = useState(false);
  const [returnCandidate, setReturnCandidate] =
    useState<DeployedHardwareItem | null>(null);

  const loadAssignedHardware = useCallback(async () => {
    if (!assignmentId || Number.isNaN(Number(assignmentId))) {
      setError("Invalid assignment id.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAssignedHardwareByAssignmentId(assignmentId);
      setDeployedItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch deployed hardware.",
      );
      setDeployedItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  const handleReturnHardware = async (
    assignmentToReturnId: number,
    returnReason: string,
  ) => {
    const itemToReturn = deployedItems.find(
      (item) => item.assignment.id === assignmentToReturnId,
    );
    const modelName = itemToReturn?.hardware.model_number || "hardware";

    setError(null);
    await returnHardwareAssignment(assignmentToReturnId, returnReason);
    setDeployedItems((currentItems) =>
      currentItems.filter(
        (item) => item.assignment.id !== assignmentToReturnId,
      ),
    );
    setReturnCandidate(null);
    void Swal.fire({
      icon: "success",
      title: "Hardware unassigned",
      text: `You successfully unassigned "${modelName}"`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAssignedHardware();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAssignedHardware]);

  return (
    <main className="page-shell min-h-full flex-1">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/assignment"
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back to Assignments
            </Link>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Deployment record
            </p>
            <h1 className="page-title">Deployed Hardware</h1>
            <p className="mt-1 text-sm text-slate-500">
              Assignment #{displayValue(assignmentId)}
            </p>
          </div>
        </div>

        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Hardware Details
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {deployedItems.length} deployed item
                {deployedItems.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isLoading && deployedItems.length > 0 && (
                <>
                  <Link
                    href={`/assignment/${assignmentId}/acknowledgement`}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FileText size={15} />
                    Acknowledgement Report
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowRemoveActions((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <MinusCircle size={15} />
                    Unassigned Hardware
                  </button>
                </>
              )}
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                Assignment #{displayValue(assignmentId)}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-slate-500">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-600" />
              <p className="font-medium">Fetching deployed hardware...</p>
            </div>
          ) : error && deployedItems.length === 0 ? (
            <div className="mx-auto flex min-h-72 max-w-md flex-col items-center justify-center p-8 text-center">
              <p className="mb-2 font-semibold text-red-700">
                Error loading deployed hardware
              </p>
              <p className="mb-4 text-sm text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadAssignedHardware()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          ) : deployedItems.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No deployed hardware found for this assignment.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              {error && (
                <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              <table
                className={`w-full border-collapse text-left ${
                  showRemoveActions ? "min-w-[1220px]" : "min-w-[1100px]"
                }`}
              >
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
                      Created At
                    </th>
                    {showRemoveActions && (
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deployedItems.map((deployedItem) => {
                    const item = deployedItem.hardware;
                    return (
                      <tr
                        key={deployedItem.assignment.id}
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
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {displayValue(item.created_at)}
                        </td>
                        {showRemoveActions && (
                          <td className="px-6 py-4 text-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setReturnCandidate(deployedItem)
                              }
                              className="inline-flex min-w-24 items-center justify-center rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 transition-colors hover:bg-amber-100"
                            >
                              Unassign
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {returnCandidate && (
        <ReturnHardwareModal
          hardwareName={
            returnCandidate.hardware.model_number ||
            returnCandidate.hardware.ckt_item_number ||
            "this hardware"
          }
          onClose={() => setReturnCandidate(null)}
          onConfirm={(returnReason) =>
            handleReturnHardware(returnCandidate.assignment.id, returnReason)
          }
        />
      )}
    </main>
  );
}
