import express from "express";
import ImportLog from "../models/importLogs.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const logs = await ImportLog.find().sort({ timestamp: -1 });
  res.json(logs);
});

export default router;
