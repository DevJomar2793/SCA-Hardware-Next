"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, HardDrive, Loader2, RefreshCw } from "lucide-react";
import { fetchHardwareReturnHistory } from "@/services/api";
import { HardwareReturnHistory } from "@/types/history";

const displayValue = (value: string | null | undefined) => value?.trim() || "—";

const getHardwareName = (record: HardwareReturnHistory) => {
  const name = [record.hardware.manufacturer, record.hardware.model_number]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || record.hardware.hardware_type || `Hardware #${record.device_id}`;
};

const getEmployeeName = (record: HardwareReturnHistory) => {
  const name = [record.employee.first_name, record.employee.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || record.employee.employee_digit_code || `Employee #${record.employee_id}`;
};

const formatReturnedDate = (value: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

export default function HistoryPage() {
  const [records, setRecords] = useState<HardwareReturnHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRecords(await fetchHardwareReturnHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load return history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHistory(), 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Audit trail</p>
            <h1 className="page-title">Hardware Return History</h1>
            <p className="page-description">Permanent, read-only records of hardware returned to inventory.</p>
          </div>
          <button type="button" onClick={() => void loadHistory()} disabled={isLoading} className="button-secondary self-start md:self-auto">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </header>

        <section className="surface-card mt-7 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Returned assets</h2>
              <p className="mt-0.5 text-xs text-slate-500">Newest returns appear first</p>
            </div>
            {!isLoading && !error && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {records.length} {records.length === 1 ? "record" : "records"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-slate-500">
              <Loader2 className="mb-4 h-9 w-9 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Loading return history…</p>
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><RefreshCw size={20} /></div>
              <h2 className="font-semibold text-slate-900">Unable to load history</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{error}</p>
              <button type="button" onClick={() => void loadHistory()} className="button-primary mt-5">Retry</button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardList size={25} /></div>
              <h2 className="font-semibold text-slate-900">No hardware returns yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Records will appear here automatically after hardware is unassigned with a return reason.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3.5 font-semibold uppercase">Hardware</th>
                    <th className="px-5 py-3.5 font-semibold uppercase">Asset Tag</th>
                    <th className="px-5 py-3.5 font-semibold uppercase">Employee Name</th>
                    <th className="px-5 py-3.5 font-semibold uppercase">Returned Date</th>
                    <th className="px-5 py-3.5 font-semibold uppercase">Return Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><HardDrive size={17} /></div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{getHardwareName(record)}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{displayValue(record.hardware.hardware_type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-indigo-700">{displayValue(record.hardware.ckt_item_number)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Serial: {displayValue(record.hardware.serial_number)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">{getEmployeeName(record)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{displayValue(record.employee.employee_digit_code)}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatReturnedDate(record.date_returned)}</td>
                      <td className="max-w-sm px-5 py-4 text-sm leading-6 text-slate-600">{displayValue(record.return_reason)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
