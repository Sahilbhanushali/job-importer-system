import express from "express";
import { z } from "zod";
import { jobQueue } from "../jobs/jobQueue.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const uploadSchema = z.object({
  source: z.string().default("manual-upload"),
  jobs: z
    .array(
      z.object({
        title: z.string().min(1),
        link: z.string().url().optional(),
        company: z.string().optional(),
        jobType: z.string().optional(),
        jobLocation: z.string().optional(),
        description: z.string().optional(),
        publishedAt: z.string().optional(),
      })
    )
    .min(1),
});

const chunkJobs = (jobs, size = 100) => {
  const chunks = [];
  for (let i = 0; i < jobs.length; i += size) {
    chunks.push(jobs.slice(i, i + size));
  }
  return chunks;
};

router.post(
  "/upload",
  asyncHandler(async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payload",
        issues: parsed.error.issues,
      });
    }

    const { jobs, source } = parsed.data;
    const batches = chunkJobs(jobs);
    const queuedJobs = [];

    for (const [index, batch] of batches.entries()) {
      const bullJob = await jobQueue.add(
        "manual-upload",
        { jobs: batch, source, batchNumber: index + 1 },
        { priority: 1 }
      );
      queuedJobs.push(bullJob.id);
    }

    res.status(202).json({
      message: "Jobs queued for import",
      queued: jobs.length,
      batchIds: queuedJobs,
    });
  })
);

export default router;


