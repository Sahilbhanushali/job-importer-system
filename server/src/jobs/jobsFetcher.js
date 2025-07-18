import { parseJobXml } from "../utils/xmlParser.js";
import { jobQueue } from "./jobQueue.js";

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

const fetchJobsFromUrl = async (url) => {
  try {
    const jobItems = await parseJobXml(url);
    console.log(` Fetched ${jobItems.length} jobs from ${url}`);
    return jobItems;
  } catch (err) {
    console.error(` Failed to fetch from ${url}:`, err.message);
    return [];
  }
};

export const fetchJobs = async () => {
  const allJobs = [];

  for (const url of jobFeedURLs) {
    const jobs = await fetchJobsFromUrl(url);
    allJobs.push(...jobs);
  }

  if (allJobs.length === 0) {
    console.warn(" No jobs fetched from any feed.");
    return;
  }

  try {
    console.log(` Total jobs fetched: ${allJobs.length}`);
    await jobQueue.add("import-jobs", {
      jobs: allJobs,
    });
    console.log(" Jobs successfully added to the queue.");
  } catch (err) {
    console.error(" Failed to add jobs to queue:", err.message);
  }
};

setInterval(async () => {
  console.log(" Running scheduled job fetch...");
  await fetchJobs();
}, 60 * 60 * 1000);
