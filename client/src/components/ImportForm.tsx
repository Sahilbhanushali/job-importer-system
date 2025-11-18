"use client";

import Papa from "papaparse";
import { useCallback, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { apiPost } from "../lib/apiClient";
import { useToast } from "./ToastProvider";

type CsvRow = Record<string, string>;

const REQUIRED_FIELDS = ["title"];
const OPTIONAL_FIELDS = [
  "company",
  "jobType",
  "jobLocation",
  "description",
  "link",
  "publishedAt",
];

interface ImportFormProps {
  onImportQueued?: () => void;
}

export const ImportForm = ({ onImportQueued }: ImportFormProps) => {
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [sourceName, setSourceName] = useState("csv-upload");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { pushToast } = useToast();

  const handleFile = useCallback((file: File) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvRows(results.data);
        const cols = results.meta.fields || [];
        setColumns(cols);
        const defaultMappings: Record<string, string> = {};
        REQUIRED_FIELDS.forEach((field) => {
          const match = cols.find((col) =>
            col.toLowerCase().includes(field.toLowerCase())
          );
          if (match) {
            defaultMappings[field] = match;
          }
        });
        OPTIONAL_FIELDS.forEach((field) => {
          const match = cols.find((col) =>
            col.toLowerCase().includes(field.toLowerCase())
          );
          if (match) {
            defaultMappings[field] = match;
          }
        });
        setMappings(defaultMappings);
      },
      error: (error) => {
        pushToast(`Failed to parse CSV: ${error.message}`, "error");
      },
    });
  }, [pushToast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const hasRequiredMappings = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => Boolean(mappings[field]));
  }, [mappings]);

  const previewRows = csvRows.slice(0, 5);

  const queueImport = async () => {
    if (!hasRequiredMappings) {
      pushToast("Please map all required fields before importing.", "error");
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const jobs = csvRows.map((row) => {
        const mapped: Record<string, string> = {};
        Object.entries(mappings).forEach(([field, column]) => {
          if (column) {
            mapped[field] = row[column]?.trim();
          }
        });
        return mapped;
      });
      setProgress(50);
      await apiPost("/api/imports/upload", { jobs, source: sourceName });
      setProgress(100);
      pushToast(`Queued ${jobs.length} jobs for import`, "success");
      setCsvRows([]);
      setColumns([]);
      setMappings({});
      onImportQueued?.();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to queue import",
        "error"
      );
    } finally {
      setTimeout(() => setProgress(0), 800);
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Manual CSV Import</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload a CSV, map columns, and queue it directly into Redis/BullMQ.
          </p>
        </div>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900">
          <Upload className="mb-2" />
          <span className="text-sm font-medium">
            Drop CSV or click to select
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Source label
          </label>
          <input
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="job-board-name"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Appears in logs to trace who queued the import.
          </p>
        </div>
      </div>

      {columns.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Column mapping
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
              <label key={field} className="text-sm text-slate-600 dark:text-slate-300">
                <span className="flex items-center justify-between">
                  {field}
                  {REQUIRED_FIELDS.includes(field) && (
                    <span className="text-xs text-red-500 dark:text-red-400">Required</span>
                  )}
                </span>
                <select
                  value={mappings[field] || ""}
                  onChange={(event) =>
                    setMappings((prev) => ({
                      ...prev,
                      [field]: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="">-- Select column --</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      {previewRows.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Preview ({previewRows.length} rows)
          </h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="bg-white dark:bg-slate-950">
                    {columns.map((column) => (
                      <td key={column} className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {progress > 0 && (
          <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <button
          onClick={queueImport}
          disabled={!csvRows.length || uploading}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {uploading ? "Queueing..." : "Queue Import"}
        </button>
      </div>
    </section>
  );
};


