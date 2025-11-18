"use client";

import { ReactNode, useEffect } from "react";
import { Job } from "../lib/types";
import { ExternalLink, X } from "lucide-react";

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
}

export const JobDetailModal = ({ job, onClose }: JobDetailModalProps) => {
  useEffect(() => {
    if (job) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [job]);

  if (!job) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <article className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          aria-label="Close job details"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={20} />
        </button>

        <header>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Job detail
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {job.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {job.company || "—"} {job.jobLocation ? `• ${job.jobLocation}` : ""}
          </p>
          {job.link && (
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 underline transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View posting <ExternalLink size={14} />
            </a>
          )}
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard label="Status" value={job.status} />
          <InfoCard
            label="Last imported"
            value={
              job.lastImportedAt
                ? new Date(job.lastImportedAt).toLocaleString()
                : "—"
            }
          />
          <InfoCard label="Job type" value={job.jobType || "—"} />
          <InfoCard label="Source" value={job.source || "—"} />
        </section>

        {job.errorReason && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/40 dark:text-red-200">
            <p className="font-semibold">Error log</p>
            <p className="mt-1">{job.errorReason}</p>
          </div>
        )}

        {job.description && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Description
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
              {job.description}
            </p>
          </section>
        )}

        {job.tags && job.tags.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tags
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Timeline
          </h3>
          <ol className="mt-2 space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            {job.publishedAt && (
              <li>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Published
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(job.publishedAt).toLocaleString()}
                </p>
              </li>
            )}
            {job.lastImportedAt && (
              <li>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Imported via worker
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(job.lastImportedAt).toLocaleString()}
                </p>
              </li>
            )}
            {job.status === "retrying" && (
              <li>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Retry scheduled
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Awaiting worker pickup
                </p>
              </li>
            )}
          </ol>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Raw payload
          </h3>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-emerald-200 dark:bg-slate-950">
            {JSON.stringify(job, null, 2)}
          </pre>
        </section>
      </article>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
      {value}
    </p>
  </div>
);
