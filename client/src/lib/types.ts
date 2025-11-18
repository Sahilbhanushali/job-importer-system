export type JobStatus = "imported" | "updated" | "failed" | "retrying";

export interface Job {
  _id: string;
  title: string;
  company?: string;
  jobType?: string;
  jobLocation?: string;
  description?: string;
  link?: string;
  publishedAt?: string;
  status: JobStatus;
  source?: string;
  lastImportedAt?: string;
  errorReason?: string;
  tags?: string[];
}

export interface ImportLog {
  _id: string;
  timestamp: string;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: { jobId: string; reason: string }[];
  durationMs?: number;
  status: "completed" | "partial" | "failed";
}

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface DashboardResponse {
  summary: {
    totalJobs: number;
    lastImportAt?: string;
    lastImportDuration?: number;
    lastImportStatus?: string;
    failedJobs: number;
    retryingJobs: number;
  };
  queue: QueueCounts;
  recentImports: ImportLog[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pages: number;
    limit: number;
    total: number;
  };
}


