export default function Loading() {
  return (
    <main className="page-shell" aria-label="Loading page">
      <div className="page-container animate-pulse">
        <div className="h-3 w-28 rounded bg-indigo-100" />
        <div className="mt-4 h-9 w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="surface-card h-36 bg-white p-5">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="mt-5 h-8 w-16 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="surface-card mt-6 h-80 bg-white" />
      </div>
    </main>
  );
}
