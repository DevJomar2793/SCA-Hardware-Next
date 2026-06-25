type Profile = {
  avatar: string;
  name: string;
};

const profiles: Profile[] = [
  { avatar: "AC", name: "Avery Carter" },
  { avatar: "BM", name: "Blake Morgan" },
  { avatar: "CR", name: "Casey Rivera" },
  { avatar: "DJ", name: "Drew Johnson" },
];

export function AssignmentDirectory() {
  return (
    <main className="min-h-full bg-gray-100 px-6 py-10 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {profiles.map((profile) => (
            <article
              key={profile.name}
              className="overflow-hidden rounded-xl bg-white shadow-md shadow-slate-200/70"
            >
              <div className="h-20 bg-blue-100" />

              <div className="px-6 pb-6 text-center">
                <div className="-mt-10 mb-5 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xl font-bold text-white shadow-sm">
                    {profile.avatar}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  {profile.name}
                </h2>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Check Deployed Hardware
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
