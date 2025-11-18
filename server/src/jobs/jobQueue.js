import pkg from "bullmq";
import logger from "../config/logger.js";
import { redisConnectionOptions } from "../config/redis.js";

const { Queue, QueueEvents } = pkg;

const queueName = "job-importer";

// Create queue
const jobQueue = new Queue(queueName, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600,
      count: 500,
    },
    removeOnFail: {
      age: 24 * 3600,
      count: 1000,
    },
  },
});

// Queue events
const queueEvents = new QueueEvents(queueName, {
  connection: redisConnectionOptions,
});

// Event: job failed
queueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, "Queue job failed");
});

// Event: job completed
queueEvents.on("completed", ({ jobId }) => {
  logger.debug({ jobId }, "Queue job completed");
});

export { jobQueue, queueEvents };

// Graceful shutdown
export const shutdownQueueInfrastructure = async () => {
  await Promise.allSettled([
    jobQueue.close(),
    queueEvents.close(),
  ]);
};
