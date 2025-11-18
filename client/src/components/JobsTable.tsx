"use client";

import { useState, useEffect, useCallback } from "react";
import { Job, PaginatedResponse } from "../lib/types";
import {
  ArrowUpDown,
  Search,
  Trash2,
  Undo2,
  Plus,
  Download,
  Edit,
  X,
} from "lucide-react";

interface JobsTableProps {
  jobs: Job[];
  pagination: PaginatedResponse<Job>["pagination"];
  loading?: boolean;
  onViewJob: (job: Job) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkRetry: (ids: string[]) => Promise<void>;
  onPageChange: (page: number) => void;
  onSearch: (query: string, status: string, sort: string) => void;
  onCreateJob?: () => void;
  onEditJob?: (job: Job) => void;
  onDeleteJob?: (id: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  imported:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200",
  updated:
    "bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200",
  failed: "bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-200",
  retrying:
    "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200",
};

export const JobsTable = ({
  jobs,
  pagination,
  loading,
  onViewJob,
  onBulkDelete,
  onBulkRetry,
  onPageChange,
  onSearch,
  onCreateJob,
  onEditJob,
  onDeleteJob,
}: JobsTableProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDirection, setSortDirection] = useState("desc");
  const [localSearch, setLocalSearch] = useState("");

  // Sync with parent search state with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localSearch, statusFilter, sortDirection);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, statusFilter, sortDirection]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((jobId) => jobId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === jobs.length && jobs.length > 0) {
      setSelected([]);
    } else {
      setSelected(jobs.map((job) => job._id));
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    onSearch(localSearch || search, newStatus, sortDirection);
  };

  const handleSortToggle = () => {
    const newSort = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(newSort);
    onSearch(localSearch || search, statusFilter, newSort);
  };

  const handleExportCSV = useCallback(() => {
    const headers = [
      "Title",
      "Company",
      "Job Type",
      "Location",
      "Status",
      "Published Date",
      "Link",
      "Description",
    ];
    const rows = jobs.map((job) => [
      job.title || "",
      job.company || "",
      job.jobType || "",
      job.jobLocation || "",
      job.status || "",
      job.publishedAt
        ? new Date(job.publishedAt).toLocaleDateString()
        : "",
      job.link || "",
      (job.description || "").replace(/\n/g, " ").replace(/,/g, ";"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `jobs-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [jobs]);

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (onDeleteJob && confirm("Are you sure you want to delete this job?")) {
      await onDeleteJob(jobId);
    }
  };

  const handleEditJob = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (onEditJob) {
      onEditJob(job);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Imported Jobs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search, filter, and manage imported records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onCreateJob && (
            <button
              onClick={onCreateJob}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus size={14} /> Add Job
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={async () => {
              await onBulkRetry(selected);
              setSelected([]);
            }}
            disabled={!selected.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Undo2 size={14} /> Retry
          </button>
          <button
            onClick={async () => {
              if (
                confirm(
                  `Are you sure you want to delete ${selected.length} job(s)?`
                )
              ) {
                await onBulkDelete(selected);
                setSelected([]);
              }
            }}
            disabled={!selected.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </header>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search title, company, description, location..."
            className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">All statuses</option>
            <option value="imported">Imported</option>
            <option value="updated">Updated</option>
            <option value="retrying">Retrying</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={handleSortToggle}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowUpDown size={14} />{" "}
            {sortDirection === "asc" ? "Oldest" : "Newest"}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selected.length === jobs.length && jobs.length > 0
                  }
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                Title
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                Company
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                Type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                Location
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                Published
              </th>
              {(onEditJob || onDeleteJob) && (
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {loading ? (
              <tr>
                <td
                  colSpan={onEditJob || onDeleteJob ? 8 : 7}
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    Loading jobs...
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={onEditJob || onDeleteJob ? 8 : 7}
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  No jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job._id}
                  className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  onClick={() => onViewJob(job)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(job._id)}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleSelect(job._id);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {job.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {job.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {job.jobType || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {job.jobLocation || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusColors[job.status] ||
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {job.publishedAt
                      ? new Date(job.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  {(onEditJob || onDeleteJob) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {onEditJob && (
                          <button
                            onClick={(e) => handleEditJob(e, job)}
                            className="rounded p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                            title="Edit job"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onDeleteJob && (
                          <button
                            onClick={(e) => handleDeleteJob(e, job._id)}
                            className="rounded p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                            title="Delete job"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing page {pagination.page} of {pagination.pages} (
          {pagination.total} total)
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
