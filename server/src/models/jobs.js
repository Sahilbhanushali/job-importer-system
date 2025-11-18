import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    jobId: { type: String, unique: true, required: true },
    link: { type: String },
    publishedAt: { type: Date },
    description: { type: String },
    company: { type: String },
    jobType: { type: String },
    jobLocation: { type: String },
    status: {
      type: String,
      enum: ["imported", "updated", "failed", "retrying"],
      default: "imported",
    },
    source: { type: String },
    lastImportedAt: { type: Date, default: Date.now },
    errorReason: { type: String },
    rawPayload: { type: mongoose.Schema.Types.Mixed },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", description: "text" });
jobSchema.index({ status: 1 });
jobSchema.index({ lastImportedAt: -1 });

export default mongoose.model("Job", jobSchema);
