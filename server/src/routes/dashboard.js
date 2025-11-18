import express from "express";
import Job from "../models/jobs.js";
import ImportLog from "../models/importLogs.js";
import { jobQueue } from "../jobs/jobQueue.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [latestImport, totalJobs, failedJobs, retryingJobs, queueCounts] =
      await Promise.all([
        ImportLog.findOne().sort({ timestamp: -1 }),
        Job.countDocuments(),
        Job.countDocuments({ status: "failed" }),
        Job.countDocuments({ status: "retrying" }),
        jobQueue.getJobCounts(),
      ]);

    const recentImports = await ImportLog.find()
      .sort({ timestamp: -1 })
      .limit(5);

    res.json({
      summary: {
        totalJobs,
        lastImportAt: latestImport?.timestamp,
        lastImportDuration: latestImport?.durationMs,
        lastImportStatus: latestImport?.status,
        failedJobs,
        retryingJobs,
      },
      queue: queueCounts,
      recentImports,
    });
  })
);

export default router;


