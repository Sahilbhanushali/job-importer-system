import { Queue } from "bullmq";

import redisClient from "../config/redis.js";

const jobQueue = new Queue("job-importer", {
  connection: redisClient,
});
export { jobQueue };
