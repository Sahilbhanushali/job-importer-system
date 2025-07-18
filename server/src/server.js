import express from "express";
import dotenv from "dotenv";
import importLogsRoute from "./routes/importLogs.js";
import jobsRoute from "./routes/jobs.js";
import cors from "cors";
import { fetchJobs } from "./jobs/jobsFetcher.js";

import { connectDB } from "./config/db.js";
const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5003;

app.use("/api/import-logs", importLogsRoute);
app.use("/api/jobs", jobsRoute);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
  // Fetch jobs immediately on server start
  await fetchJobs();
});
