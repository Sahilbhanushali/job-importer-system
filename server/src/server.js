import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";

import { connectDB } from "./config/db.js";
import importLogsRoute from "./routes/importLogs.js";
import jobsRoute from "./routes/jobs.js";
import dashboardRoute from "./routes/dashboard.js";
import healthRoute from "./routes/health.js";
import importsRoute from "./routes/imports.js";
import { fetchJobs } from "./jobs/jobsFetcher.js";
import { startWorker } from "./jobs/jobWorker.js";
import { jobQueue, queueEvents } from "./jobs/jobQueue.js";
import logger from "./config/logger.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { shutdownRedis } from "./config/redis.js";
import { shutdownQueueInfrastructure } from "./jobs/jobQueue.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5003;
const JOB_FETCH_INTERVAL =
  Number(process.env.JOB_FETCH_INTERVAL_MS) || 60 * 60 * 1000;

let allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.includes("*")) {
  allowedOrigins = [];
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn({ origin }, "Blocked by CORS policy");
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

app.use(pinoHttp({ logger }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(compression());

if (process.env.ENABLE_RATE_LIMITER !== "false") {
  app.use("/api", apiLimiter);
}

// API routes
app.use("/api/health", healthRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/import-logs", importLogsRoute);
app.use("/api/jobs", jobsRoute);
app.use("/api/imports", importsRoute);

app.get("/api/ping", (req, res) => {
  logger.debug("Ping received — keeping server awake");
  res.send("Ping OK");
});

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();

    // Removed queueScheduler — BullMQ v5 does not use it

    const worker = startWorker();

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    const interval = setInterval(async () => {
      logger.info("Running scheduled job fetch...");
      await fetchJobs();
    }, JOB_FETCH_INTERVAL);
    interval.unref?.();

    if (process.env.JOB_FETCH_ON_BOOT !== "false") {
      fetchJobs().catch((err) =>
        logger.error({ err }, "Initial job fetch failed")
      );
    }

    const gracefulShutdown = async () => {
      logger.info("Received shutdown signal, cleaning up...");

      clearInterval(interval);

      await worker?.close();
      await shutdownQueueInfrastructure();  // <-- fixed: now exists

      server.close(async () => {
        logger.info("HTTP server closed");
        await shutdownRedis();
        process.exit(0);
      });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);

  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

start();
