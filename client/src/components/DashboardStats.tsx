import { Activity, AlertTriangle, Clock, Database } from "lucide-react";
import { DashboardResponse } from "../lib/types";

interface Props {
  summary: DashboardResponse["summary"];
  queue: DashboardResponse["queue"];
}

export const DashboardStats = ({ summary, queue }: Props) => {
  const cards = [
    {
      label: "Total Jobs",
      value: summary.totalJobs?.toLocaleString() ?? "—",
      icon: Database,
      helper: summary.lastImportAt
        ? `Updated ${new Date(summary.lastImportAt).toLocaleString()}`
        : "Awaiting first import",
    },
    {
      label: "Queue Waiting",
      value: queue.waiting ?? 0,
      icon: Activity,
      helper: `${queue.active ?? 0} active / ${queue.delayed ?? 0} delayed`,
    },
    {
      label: "Failed Imports",
      value: summary.failedJobs ?? 0,
      icon: AlertTriangle,
      helper: `${summary.retryingJobs ?? 0} retrying`,
    },
    {
      label: "Last Run",
      value: summary.lastImportDuration
        ? `${Math.round(summary.lastImportDuration / 1000)}s`
        : "—",
      icon: Clock,
      helper: summary.lastImportStatus
        ? `Status: ${summary.lastImportStatus}`
        : "No runs yet",
    },
  ];

  return (
    <section aria-label="Import statistics" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor ingestion health and queue pressure.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, helper }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <span className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
};


