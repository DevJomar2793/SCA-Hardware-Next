import Link from "next/link";
import { ArrowLeftRight, Clock3, Construction, RotateCw } from "lucide-react";

export default function HistoryPage() {
  return (
    <main className="page-shell">
      <div className="page-container">
        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Audit trail</p>
          <h1 className="page-title">History</h1>
          <p className="page-description">Review inventory movement and assignment activity.</p>
        </header>

        <section className="surface-card mt-7 overflow-hidden">
          <div className="grid min-h-[28rem] place-items-center px-6 py-14 text-center">
            <div className="max-w-lg">
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Clock3 size={34} />
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-amber-100 text-amber-700">
                  <Construction size={14} />
                </span>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Coming soon</span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">A clearer audit trail is on the way</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                History will provide a searchable record of assignments, returns, and hardware changes. Current inventory workflows remain fully available.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/assignment" className="button-primary"><RotateCw size={16} /> View assignments</Link>
                <Link href="/hardware" className="button-secondary"><ArrowLeftRight size={16} /> Browse inventory</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
