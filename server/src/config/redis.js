import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on("error", (err) => console.error(" Redis error:", err));
redisClient.on("connect", () => console.log(" Redis connected"));

await redisClient.connect();

export default {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: "default",
  password: process.env.REDIS_PASSWORD,
};
