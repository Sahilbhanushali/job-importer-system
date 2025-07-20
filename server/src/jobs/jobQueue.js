import { Queue } from "bullmq";

import redis from "../config/redis.js";

const jobQueue = new Queue("job-importer", {
  connection: redis,
});
export { jobQueue };
