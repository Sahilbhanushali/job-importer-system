import { Worker } from "bullmq";
import redisConfig from "../config/redis.js";
import Job from "../models/jobs.js";
import ImportLog from "../models/importLogs.js";

export const startWorker = () => {
  const worker = new Worker(
    "job-importer",
    async (job) => {
      const jobs = job.data.jobs || [];

      let newJobs = 0;
      let updatedJobs = 0;
      let failedJobs = [];

      for (const j of jobs) {
        try {
          const jobId = j.link || j.id || j.guid;
          if (!jobId) throw new Error("Missing job ID");

          const jobData = {
            jobId,
            title: j.title,
            link: j.link,
            publishedAt: new Date(j.pubDate),
            description: j.description,
            company: j.company || "Unknown",
            jobType: j.jobType || "Unknown",
            jobLocation: j.jobLocation || "Remote",
          };

          const existing = await Job.findOne({ jobId });

          if (existing) {
            await Job.updateOne({ jobId }, jobData);
            updatedJobs++;
          } else {
            await Job.create(jobData);
            newJobs++;
          }
        } catch (err) {
          failedJobs.push({ jobId: j.link || "N/A", reason: err.message });
        }
      }

      await ImportLog.create({
        totalFetched: jobs.length,
        totalImported: newJobs + updatedJobs,
        newJobs,
        updatedJobs,
        failedJobs,
      });

      return `Import Summary: ${newJobs} new, ${updatedJobs} updated, ${failedJobs.length} failed`;
    },
    {
      connection: redis,
      lockDuration: 600000,
      removeOnComplete: {
        age: 3600,
        count: 100,
      },
      removeOnFail: {
        age: 3600,
        count: 50,
      },
    }
  );

  worker.on("active", (job) => {
    console.log(` Worker started processing job ${job.id}`);
  });

  worker.on("completed", (job) => {
    console.log(` Worker finished job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(` Worker failed job ${job?.id}:`, err.message);
  });

  return worker;
};
