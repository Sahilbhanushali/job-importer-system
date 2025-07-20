import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import importLogsRoute from "./routes/importLogs.js";
import jobsRoute from "./routes/jobs.js";
import { fetchJobs } from "./jobs/jobsFetcher.js";

// Worker-related imports
import { Worker } from "bullmq";
import redisConfig from "./config/redis.js";
import Job from "./models/jobs.js";
import ImportLog from "./models/importLogs.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());
app.use(cors());

// API routes
app.use("/api/import-logs", importLogsRoute);
app.use("/api/jobs", jobsRoute);

app.listen(PORT, async () => {
  await connectDB();
  console.log(` Server is running on port ${PORT}`);

  await fetchJobs();

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
            jobId: jobId,
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
      connection: redisConfig,
      lockDuration: 600000,
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 3600,
        count: 500,
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
    console.error(` Worker failed job ${job.id}:`, err.message);
  });
});
