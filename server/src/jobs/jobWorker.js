import { Worker } from "bullmq";
import { redisConnectionOptions } from "../config/redis.js";
import Job from "../models/jobs.js";
import ImportLog from "../models/importLogs.js";
import logger from "../config/logger.js";

const normalizeJob = (jobPayload) => {
  const jobId = jobPayload.link || jobPayload.id || jobPayload.guid;
  if (!jobId) {
    throw new Error("Missing job ID");
  }

  return {
    jobId,
    title: jobPayload.title?.trim() || "Untitled role",
    link: jobPayload.link,
    publishedAt: jobPayload.pubDate ? new Date(jobPayload.pubDate) : new Date(),
    description: jobPayload.description,
    company: jobPayload.company || jobPayload["dc:creator"] || "Unknown",
    jobType: jobPayload.jobType || jobPayload["job:jobtype"] || "Unknown",
    jobLocation:
      jobPayload.jobLocation ||
      jobPayload["job:location"] ||
      jobPayload.location ||
      "Remote",
    source: jobPayload.source,
    tags: jobPayload.categories
      ? Array.isArray(jobPayload.categories)
        ? jobPayload.categories
        : [jobPayload.categories]
      : [],
  };
};

export const startWorker = () => {
  const worker = new Worker(
    "job-importer",
    async (job) => {
      const startedAt = Date.now();
      const jobs = job.data.jobs || [];

      let newJobs = 0;
      let updatedJobs = 0;
      const failedJobs = [];

      for (const item of jobs) {
        try {
          const normalized = normalizeJob(item);
          const writeResult = await Job.updateOne(
            { jobId: normalized.jobId },
            {
              $set: {
                ...normalized,
                status: "imported",
                lastImportedAt: new Date(),
                rawPayload: item,
                errorReason: undefined,
              },
            },
            { upsert: true }
          );

          if (writeResult.upsertedCount) {
            newJobs += 1;
          } else if (writeResult.modifiedCount) {
            updatedJobs += 1;
          }
        } catch (err) {
          failedJobs.push({
            jobId: item.link || item.id || "unknown",
            reason: err.message,
          });

          await Job.updateOne(
            { jobId: item.link || item.id || "unknown" },
            {
              $set: {
                status: "failed",
                errorReason: err.message,
                rawPayload: item,
              },
            }
          ).catch(() => {});
        }
      }

      await ImportLog.create({
        totalFetched: jobs.length,
        totalImported: newJobs + updatedJobs,
        newJobs,
        updatedJobs,
        failedJobs,
        durationMs: Date.now() - startedAt,
        queueJobId: job.id,
        status:
          failedJobs.length === 0
            ? "completed"
            : newJobs + updatedJobs > 0
            ? "partial"
            : "failed",
        source: job.data.source || "manual",
      });

      return `Import Summary: ${newJobs} new, ${updatedJobs} updated, ${failedJobs.length} failed`;
    },
    {
      connection: redisConnectionOptions,
      concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
      lockDuration: 600000,
    }
  );

  worker.on("active", (job) => {
    logger.info({ jobId: job.id }, "Worker started processing job");
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Worker finished job");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Worker failed job");
  });

  return worker;
};
