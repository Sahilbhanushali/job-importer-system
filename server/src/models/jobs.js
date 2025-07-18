import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String },
    jobId: { type: String, unique: true },
    link: { type: String },
    publishedAt: { type: Date },
    description: { type: String },
    company: { type: String },
    jobType: { type: String },
    jobLocation: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
