"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "../components/Layout";
import { DashboardStats } from "../components/DashboardStats";
import { ImportForm } from "../components/ImportForm";
import { JobsTable } from "../components/JobsTable";
import { ImportHistory } from "../components/ImportHistory";
import { JobDetailModal } from "../components/JobDetailModal";
import { JobForm } from "../components/JobForm";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/apiClient";
import {
  DashboardResponse,
  ImportLog,
  Job,
  PaginatedResponse,
} from "../lib/types";
import { useToast } from "../components/ToastProvider";

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [jobsResponse, setJobsResponse] =
    useState<PaginatedResponse<Job>>({
      data: [],
      pagination: { page: 1, pages: 1, limit: 20, total: 0 },
    });
  const [logsResponse, setLogsResponse] =
    useState<PaginatedResponse<ImportLog>>({
      data: [],
      pagination: { page: 1, pages: 1, limit: 10, total: 0 },
    });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const { pushToast } = useToast();
  const jobsQueryRef = useRef({
    page: 1,
    search: "",
    status: "all",
    sort: "desc",
  });
  const logsPageRef = useRef(1);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await apiGet<DashboardResponse>("/api/dashboard");
      setDashboard(response);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to load dashboard",
        "error"
      );
    }
  }, [pushToast]);

  const loadJobs = useCallback(
    async (params?: Partial<typeof jobsQueryRef.current>) => {
      const next = { ...jobsQueryRef.current, ...params };
      setLoadingJobs(true);
      try {
        const response = await apiGet<PaginatedResponse<Job>>("/api/jobs", next);
        jobsQueryRef.current = next;
        setJobsResponse(response);
      } catch (error) {
        pushToast(
          error instanceof Error ? error.message : "Failed to load jobs",
          "error"
        );
      } finally {
        setLoadingJobs(false);
      }
    },
    [pushToast]
  );

  const loadLogs = useCallback(
    async (page?: number) => {
      const targetPage = page ?? logsPageRef.current;
      setLoadingLogs(true);
      try {
        const response = await apiGet<PaginatedResponse<ImportLog>>(
          "/api/import-logs",
          { page: targetPage }
        );
        logsPageRef.current = targetPage;
        setLogsResponse(response);
      } catch (error) {
        pushToast(
          error instanceof Error ? error.message : "Failed to load logs",
          "error"
        );
      } finally {
        setLoadingLogs(false);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    loadDashboard();
    loadJobs({ page: 1 });
    loadLogs(1);
  }, [loadDashboard, loadJobs, loadLogs]);

  const handleBulkDelete = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await apiPost<{ deleted: number }>("/api/jobs/bulk/delete", { ids });
      pushToast(`Deleted ${ids.length} jobs`, "success");
      loadJobs();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to delete jobs",
        "error"
      );
    }
  };

  const handleBulkRetry = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await apiPost<{ queued: number }>("/api/jobs/bulk/retry", { ids });
      pushToast(`Queued ${ids.length} jobs for retry`, "success");
      loadJobs();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to queue retries",
        "error"
      );
    }
  };

  const handleSearch = useCallback(
    (search: string, status: string, sort: string) => {
      loadJobs({ page: 1, search, status, sort });
    },
    [loadJobs]
  );

  const handlePageChange = (page: number) => {
    loadJobs({ page });
  };

  const handleLogsPage = (page: number) => {
    loadLogs(page);
  };

  const handleViewJob = async (job: Job) => {
    try {
      const result = await apiGet<Job>(`/api/jobs/${job._id}`);
      setSelectedJob(result);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to load job details",
        "error"
      );
    }
  };

  const handleCreateJob = async (jobData: Partial<Job>) => {
    try {
      await apiPost<Job>("/api/jobs", jobData);
      pushToast("Job created successfully", "success");
      loadJobs();
      loadDashboard();
      setShowCreateForm(false);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to create job",
        "error"
      );
      throw error;
    }
  };

  const handleUpdateJob = async (jobData: Partial<Job>) => {
    if (!editingJob) return;
    try {
      await apiPut<Job>(`/api/jobs/${editingJob._id}`, jobData);
      pushToast("Job updated successfully", "success");
      loadJobs();
      loadDashboard();
      setEditingJob(null);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to update job",
        "error"
      );
      throw error;
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await apiDelete<{ message: string; deleted: number }>(`/api/jobs/${id}`);
      pushToast("Job deleted successfully", "success");
      loadJobs();
      loadDashboard();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to delete job",
        "error"
      );
      throw error;
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {dashboard && (
          <DashboardStats
            summary={dashboard.summary}
            queue={dashboard.queue}
          />
        )}

        <ImportForm
          onImportQueued={() => {
            loadDashboard();
            loadJobs();
            loadLogs();
          }}
        />

        <JobsTable
          jobs={jobsResponse.data}
          pagination={jobsResponse.pagination}
          loading={loadingJobs}
          onViewJob={handleViewJob}
          onBulkDelete={handleBulkDelete}
          onBulkRetry={handleBulkRetry}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onCreateJob={() => setShowCreateForm(true)}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
        />

        <ImportHistory
          logs={logsResponse.data}
          pagination={logsResponse.pagination}
          loading={loadingLogs}
          onPageChange={handleLogsPage}
        />
      </div>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

      {showCreateForm && (
        <JobForm
          job={null}
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreateJob}
        />
      )}

      {editingJob && (
        <JobForm
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={handleUpdateJob}
        />
      )}
    </Layout>
  );
}
