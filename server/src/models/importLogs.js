import mongoose from "mongoose";

const importLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  totalFetched: Number,
  totalImported: Number,
  newJobs: Number,
  updatedJobs: Number,
  failedJobs: [
    {
      jobId: String,
      reason: String,
    },
  ],
  durationMs: Number,
  queueJobId: String,
  status: {
    type: String,
    enum: ["completed", "partial", "failed"],
    default: "completed",
  },
  source: String,
});

importLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model("ImportLog", importLogSchema);
