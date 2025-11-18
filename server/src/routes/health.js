import express from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRedisLatency } from "../config/redis.js";
import { jobQueue } from "../jobs/jobQueue.js";

const router = express.Router();

router.get(
  "/redis",
  asyncHandler(async (req, res) => {
    try {
      const latency = await getRedisLatency();
      res.json({
        status: "up",
        latencyMs: latency,
      });
    } catch (err) {
      res.status(500).json({
        status: "down",
        message: err.message,
      });
    }
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const redisHealth = await getRedisLatency().then(
      (latency) => ({ status: "up", latency }),
      (err) => ({ status: "down", message: err.message })
    );

    const mongooseState = mongoose.connection.readyState;
    const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][
      mongooseState
    ];

    const queueCounts = await jobQueue.getJobCounts();

    res.json({
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      redis: redisHealth,
      database: dbStatus,
      queue: queueCounts,
    });
  })
);

export default router;


