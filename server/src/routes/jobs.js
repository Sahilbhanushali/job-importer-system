import express from "express";
import Job from "../models/jobs.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const jobs = await Job.find().sort({ timestamp: -1 });
  res.json(jobs);
});

export default router;
