import express from "express";
import Job from "../models/jobs.js";
import { jobQueue } from "../jobs/jobQueue.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "", status, sort = "desc" } =
      req.query;

    const filter = {};
    if (search) {
      // Improved search: works with or without text index
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { jobLocation: { $regex: search, $options: "i" } },
        { jobType: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      filter.status = status;
    }

    const sortOrder = sort === "asc" ? 1 : -1;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const skip = (Number(page) - 1) * safeLimit;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ publishedAt: sortOrder })
        .skip(skip)
        .limit(safeLimit),
      Job.countDocuments(filter),
    ]);

    res.json({
      data: jobs,
      pagination: {
        total,
        page: Number(page),
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    });
  })
);

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [totalJobs, latestJob] = await Promise.all([
      Job.countDocuments(),
      Job.findOne().sort({ updatedAt: -1 }),
    ]);

    const queueCounts = await jobQueue.getJobCounts();

    res.json({
      totalJobs,
      lastImportedAt: latestJob?.updatedAt,
      queue: queueCounts,
    });
  })
);

// Create a new job (must be before /:id route)
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      title,
      company,
      jobType,
      jobLocation,
      description,
      link,
      publishedAt,
      source,
      tags,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Generate a unique jobId if not provided
    const jobId = `${source || "manual"}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job = new Job({
      title: title.trim(),
      jobId,
      company: company?.trim() || undefined,
      jobType: jobType?.trim() || undefined,
      jobLocation: jobLocation?.trim() || undefined,
      description: description?.trim() || undefined,
      link: link?.trim() || undefined,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      source: source || "manual",
      status: "imported",
      tags: Array.isArray(tags) ? tags : undefined,
      rawPayload: req.body,
      lastImportedAt: new Date(),
    });

    await job.save();
    res.status(201).json(job);
  })
);

router.post(
  "/bulk/delete",
  asyncHandler(async (req, res) => {
    const ids = req.body.ids || [];
    if (!ids.length) {
      return res.status(400).json({ message: "No job ids supplied" });
    }
    const result = await Job.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: result.deletedCount });
  })
);

router.post(
  "/bulk/retry",
  asyncHandler(async (req, res) => {
    const ids = req.body.ids || [];
    if (!ids.length) {
      return res.status(400).json({ message: "No job ids supplied" });
    }

    const jobs = await Job.find({ _id: { $in: ids } });
    if (!jobs.length) {
      return res.status(404).json({ message: "No jobs found for retry" });
    }

    const payload = jobs.map((job) => ({
      ...job.rawPayload,
      link: job.link,
      title: job.title,
      source: job.source || "manual-retry",
    }));

    await jobQueue.add("manual-retry", { jobs: payload, source: "retry" });
    await Job.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "retrying", errorReason: null } }
    );

    res.json({ queued: jobs.length });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  })
);

// Update a job
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const {
      title,
      company,
      jobType,
      jobLocation,
      description,
      link,
      publishedAt,
      status,
      tags,
    } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      job.title = title.trim();
    }

    if (company !== undefined) job.company = company?.trim() || undefined;
    if (jobType !== undefined) job.jobType = jobType?.trim() || undefined;
    if (jobLocation !== undefined)
      job.jobLocation = jobLocation?.trim() || undefined;
    if (description !== undefined)
      job.description = description?.trim() || undefined;
    if (link !== undefined) job.link = link?.trim() || undefined;
    if (publishedAt !== undefined)
      job.publishedAt = publishedAt ? new Date(publishedAt) : undefined;
    if (status !== undefined) {
      if (!["imported", "updated", "failed", "retrying"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      job.status = status;
    }
    if (tags !== undefined) job.tags = Array.isArray(tags) ? tags : undefined;

    // Update rawPayload to reflect changes
    job.rawPayload = {
      ...(job.rawPayload || {}),
      title: job.title,
      company: job.company,
      jobType: job.jobType,
      jobLocation: job.jobLocation,
      description: job.description,
      link: job.link,
      publishedAt: job.publishedAt,
    };

    await job.save();
    res.json(job);
  })
);

// Delete a single job
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted successfully", deleted: 1 });
  })
);

export default router;
