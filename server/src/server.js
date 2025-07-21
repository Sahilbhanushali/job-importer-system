import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import importLogsRoute from "./routes/importLogs.js";
import jobsRoute from "./routes/jobs.js";
import { fetchJobs } from "./jobs/jobsFetcher.js";
import { startWorker } from "./jobs/jobWorker.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());
app.use(cors());

// API routes
app.use("/api/import-logs", importLogsRoute);
app.use("/api/jobs", jobsRoute);

app.get("/api/ping", (req, res) => {
  console.log("Ping received — keeping server awake");
  res.send(" Ping OK");
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(` Server is running on port ${PORT}`);

  setInterval(async () => {
    console.log(" Running scheduled job fetch...");
    await fetchJobs();
  }, 60 * 60 * 1000);

  startWorker();
});
