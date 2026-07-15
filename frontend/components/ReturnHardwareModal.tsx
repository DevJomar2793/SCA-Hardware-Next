"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, RotateCcw, X } from "lucide-react";
import { useDialogFocus } from "@/lib/use-dialog-focus";

interface ReturnHardwareModalProps {
  hardwareName: string;
  onClose: () => void;
  onConfirm: (returnReason: string) => Promise<void>;
}

export function ReturnHardwareModal({
  hardwareName,
  onClose,
  onConfirm,
}: ReturnHardwareModalProps) {
  const [returnReason, setReturnReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dialogRef, trapFocus } = useDialogFocus();
  const isValid = returnReason.trim().length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const reason = returnReason.trim();
    if (!reason) {
      setError("Return reason is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to return hardware.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close return dialog"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
      />
      <div
        ref={dialogRef}
        onKeyDown={trapFocus}
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-hardware-title"
        className="surface-card relative w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 id="return-hardware-title" className="text-lg font-semibold text-slate-900">
                Unassign hardware
              </h2>
              <p className="mt-1 text-sm text-slate-500">Return {hardwareName} to available inventory.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label htmlFor="return-reason" className="text-sm font-semibold text-slate-700">
            Return Reason <span className="text-red-600">*</span>
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">This reason becomes part of the permanent audit record.</p>
          <textarea
            id="return-reason"
            value={returnReason}
            onChange={(event) => {
              setReturnReason(event.target.value);
              if (error) setError(null);
            }}
            rows={4}
            autoFocus
            disabled={isSubmitting}
            placeholder="Example: Employee returned the laptop after replacement"
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          {error && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="button-secondary">Cancel</button>
            <button type="submit" disabled={!isValid || isSubmitting} className="button-primary">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Unassigning…" : "Confirm return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
