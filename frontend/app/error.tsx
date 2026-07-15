"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Home, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="surface-card w-full max-w-lg p-8 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={26} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-red-600">System notice</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {error.message || "We could not load this view. Your data has not been changed."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="button-primary"><RefreshCcw size={16} /> Try again</button>
          <Link href="/" className="button-secondary"><Home size={16} /> Dashboard</Link>
          <button type="button" onClick={() => window.history.back()} className="button-secondary"><ArrowLeft size={16} /> Go back</button>
        </div>
        {error.digest && <p className="mt-6 font-mono text-[11px] text-slate-400">Reference: {error.digest}</p>}
      </section>
    </main>
  );
}
