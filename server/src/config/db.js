import mongoose from "mongoose";
import logger from "./logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error({ error }, "MongoDB connection error");
    process.exit(1);
  }
};
