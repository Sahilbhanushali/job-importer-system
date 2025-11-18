import { parseJobXml } from "../utils/xmlParser.js";
import { jobQueue } from "./jobQueue.js";
import logger from "../config/logger.js";
import { getRedisClient } from "../config/redis.js";

const redis = getRedisClient();
const jobFeedURLs = [
  "https://jobicy.com/?feed=job_feed",
  "https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time",
  "https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france",
  "https://jobicy.com/?feed=job_feed&job_categories=design-multimedia",
  "https://jobicy.com/?feed=job_feed&job_categories=data-science",
  "https://jobicy.com/?feed=job_feed&job_categories=copywriting",
  "https://jobicy.com/?feed=job_feed&job_categories=business",
  "https://jobicy.com/?feed=job_feed&job_categories=management",
  "https://www.higheredjobs.com/rss/articleFeed.cfm",
];

const FETCH_LOCK_KEY = "job-importer:feed-lock";
const LAST_RUN_KEY = "job-importer:last-run";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJobsFromUrl = async (url) => {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const jobItems = await parseJobXml(url);
      logger.info({ url, count: jobItems.length }, "Fetched jobs from feed");
      return jobItems.map((item) => ({ ...item, source: url }));
    } catch (err) {
      logger.warn(
        { url, attempt, err },
        "Failed to fetch from feed, retrying if possible"
      );
      if (attempt === maxRetries) {
        return [];
      }
      await wait(500 * attempt);
    }
  }
  return [];
};

const chunkJobs = (jobs, chunkSize = 200) => {
  const chunks = [];
  for (let i = 0; i < jobs.length; i += chunkSize) {
    chunks.push(jobs.slice(i, i + chunkSize));
  }
  return chunks;
};

export const fetchJobs = async () => {
  const lockAcquired = await redis.set(FETCH_LOCK_KEY, "locked", "NX", "EX", 60);
  if (!lockAcquired) {
    logger.warn("Job fetch already in progress, skipping this tick");
    return;
  }

  try {
    const lastRun = await redis.get(LAST_RUN_KEY);
    const now = Date.now();
    if (lastRun && now - Number(lastRun) < 5 * 60 * 1000) {
      logger.info("Fetch skipped because last run was less than 5 minutes ago");
      return;
    }

    const allJobs = [];
    for (const url of jobFeedURLs) {
      const jobs = await fetchJobsFromUrl(url);
      allJobs.push(...jobs);
    }

    if (allJobs.length === 0) {
      logger.warn("No jobs fetched from any feed");
      return;
    }

    const chunks = chunkJobs(allJobs);
    for (const [index, batch] of chunks.entries()) {
      await jobQueue.add(
        "import-jobs",
        {
          jobs: batch,
          source: "job-feeds",
          batchNumber: index + 1,
        },
        {
          jobId: `scheduled-${Date.now()}-${index}`,
          priority: 2,
        }
      );
    }

    await redis.set(LAST_RUN_KEY, `${now}`, "EX", 60 * 60);
    logger.info({ batches: chunks.length }, "Jobs successfully queued");
  } catch (err) {
    logger.error({ err }, "Failed to add jobs to queue");
  } finally {
    await redis.del(FETCH_LOCK_KEY);
  }
};
