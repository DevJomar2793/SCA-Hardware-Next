"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import {
  buildItemDescription,
  formatEmployeeName,
  formatIssuedDate,
  formatReportDate,
} from "@/lib/acknowledgement-report";
import {
  fetchAssignedHardwareByAssignmentId,
  fetchEmployeeById,
} from "@/services/api";
import { DeployedHardwareItem } from "@/types/assignment";
import { EmployeeDetails } from "@/types/employee";

const MINIMUM_TABLE_ROWS = 7;

const acknowledgementTerms = [
  "I am responsible for the equipment or company property issued to me.",
  "I will use the issued item(s) only in the manner intended.",
  "I will be responsible for any damage done, excluding normal wear and tear.",
  "Upon separation from the company, I will return the issued item(s) in proper working order, excluding normal wear and tear.",
  "I will replace, at my expense, any issued item(s) that are damaged or lost.",
  "I authorize a payroll deduction to cover the replacement cost of any issued item that is not returned, for any reason, or is not returned in good condition.",
];

export default function AcknowledgementReportPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;
  const [deployedItems, setDeployedItems] = useState<DeployedHardwareItem[]>(
    [],
  );
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!assignmentId || Number.isNaN(Number(assignmentId))) {
      setError("Invalid assignment id.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const items = await fetchAssignedHardwareByAssignmentId(assignmentId);

      if (items.length === 0) {
        setDeployedItems([]);
        setEmployee(null);
        return;
      }

      const employeeDetails = await fetchEmployeeById(
        items[0].assignment.employee_details_id,
      );
      setDeployedItems(items);
      setEmployee(employeeDetails);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load the acknowledgement report.",
      );
      setDeployedItems([]);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const reportDate = useMemo(() => formatReportDate(new Date()), []);
  const blankRowCount = Math.max(
    0,
    MINIMUM_TABLE_ROWS - deployedItems.length,
  );

  if (isLoading) {
    return (
      <ReportState>
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="font-medium text-slate-600">
          Preparing acknowledgement report...
        </p>
      </ReportState>
    );
  }

  if (error || !employee || deployedItems.length === 0) {
    return (
      <ReportState>
        <p className="text-lg font-semibold text-slate-800">
          {error ? "Unable to load report" : "No active hardware found"}
        </p>
        <p className="max-w-md text-center text-sm text-slate-500">
          {error ||
            "This assignment does not currently have any deployed hardware to acknowledge."}
        </p>
        <div className="flex gap-3">
          <Link
            href={`/assignment/${assignmentId}/hardware`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-gray-50"
          >
            Back
          </Link>
          {error && (
            <button
              type="button"
              onClick={() => void loadReport()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Retry
            </button>
          )}
        </div>
      </ReportState>
    );
  }

  return (
    <main className="acknowledgement-report-page min-h-full bg-slate-100 px-6 py-8">
      <div className="report-screen-controls mx-auto mb-5 flex w-full max-w-[210mm] items-center justify-between gap-4">
        <Link
          href={`/assignment/${assignmentId}/hardware`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Hardware
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <Printer size={16} />
          Print Report
        </button>
      </div>

      <article className="acknowledgement-paper mx-auto bg-white text-black shadow-xl">
        <h1 className="report-title text-center font-bold uppercase">
          Acknowledgement of Receipt of Company Property
        </h1>

        <section className="report-employee-details">
          <ReportField label="Date" value={reportDate} emphasized />
          <div className="report-employee-fields">
            <ReportField
              label="Employee Name"
              value={formatEmployeeName(employee.first_name, employee.last_name)}
            />
            <ReportField label="Contact #" value={employee.contact_number || ""} />
            <ReportField label="Department" value={employee.department || ""} />
          </div>
        </section>

        <table className="report-items-table w-full border-collapse">
          <thead>
            <tr>
              <th>Item Description</th>
              <th className="report-quantity-column">QTY</th>
              <th className="report-date-column">Issued Date</th>
            </tr>
          </thead>
          <tbody>
            {deployedItems.map(({ assignment, hardware }) => (
              <tr key={assignment.id}>
                <td>{buildItemDescription(hardware)}</td>
                <td className="text-center">{hardware.qty ?? 1}</td>
                <td className="text-center">
                  {formatIssuedDate(assignment.date_assigned)}
                </td>
              </tr>
            ))}
            {Array.from({ length: blankRowCount }, (_, index) => (
              <tr key={`blank-row-${index}`} aria-hidden="true">
                <td>&nbsp;</td>
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <section className="report-terms">
          <p>By signing this form, I agree to the following:</p>
          <ul>
            {acknowledgementTerms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </section>

        <section className="report-signatures">
          <div className="report-signature-column">
            <SignatureBlock
              label="Prepared By"
              name="Jomar Cerrado"
              position="IT Personnel"
            />
            <SignatureBlock
              label="Issued By"
              name="King Paulo Aquino"
              showDate
            />
            <SignatureBlock
              label="Approved By"
              name="Christopher Gaines"
              showDate
            />
          </div>
          <div className="report-receipt-fields">
            <LineField label="Received By" />
            <LineField label="Date" noLine />
            <div className="report-return-fields">
              <LineField label="Returned Date" />
              <LineField label="Reason" />
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function ReportState({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 bg-sky-50 p-8">
      {children}
    </main>
  );
}

function ReportField({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`report-field ${emphasized ? "font-semibold" : ""}`}>
      <span className="report-field-label">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function SignatureBlock({
  label,
  name,
  position,
  showDate = false,
}: {
  label: string;
  name: string;
  position?: string;
  showDate?: boolean;
}) {
  return (
    <div className="report-signature-block">
      <p>
        <span className="report-signature-label">{label}:</span>{" "}
        <span className="report-signatory-name">{name}</span>
      </p>
      {position && <p className="report-signature-position">{position}</p>}
      {showDate && <LineField label="Date" compact noLine />}
    </div>
  );
}

function LineField({
  label,
  compact = false,
  noLine = false,
}: {
  label: string;
  compact?: boolean;
  noLine?: boolean;
}) {
  return (
    <div className={`report-line-field ${compact ? "report-line-compact" : ""}`}>
      <span>{label}:</span>
      {!noLine && <span className="report-write-line" />}
    </div>
  );
}
