import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: "default",
  password: process.env.REDIS_PASSWORD,
});

redis.on("connect", () => console.log("Redis connected (ioredis)"));
redis.on("error", (err) => console.error("Redis error:", err));

export default redis;
