import { ImportLog, PaginatedResponse } from "../lib/types";

interface ImportHistoryProps {
  logs: ImportLog[];
  pagination: PaginatedResponse<ImportLog>["pagination"];
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export const ImportHistory = ({
  logs,
  pagination,
  loading,
  onPageChange,
}: ImportHistoryProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-lg font-semibold">Recent Imports</h2>
      <p className="text-sm text-slate-500">
        Latest worker runs with success, retries, and failure counts.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-100 dark:bg-slate-900">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Timestamp
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Totals
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Duration
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  Loading import history...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  No import runs recorded.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{log.newJobs}
                    </span>{" "}
                    new /{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {log.updatedJobs}
                    </span>{" "}
                    updates /{" "}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {log.failedJobs.length}
                    </span>{" "}
                    failed
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {log.durationMs ? `${Math.round(log.durationMs / 1000)}s` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        log.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200"
                          : log.status === "partial"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200"
                          : "bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-200"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Page {pagination.page} of {pagination.pages}
        </p>
        <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() =>
                onPageChange(Math.min(pagination.pages, pagination.page + 1))
              }
              disabled={pagination.page === pagination.pages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Next
            </button>
        </div>
      </div>
    </section>
  );
};


