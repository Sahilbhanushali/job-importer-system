import express from "express";
import ImportLog from "../models/importLogs.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(Number(limit) || 10, 100);
    const skip = (Number(page) - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      ImportLog.find().sort({ timestamp: -1 }).skip(skip).limit(safeLimit),
      ImportLog.countDocuments(),
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    });
  })
);

export default router;
