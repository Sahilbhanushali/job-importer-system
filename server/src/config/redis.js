import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const isTlsEnabled = String(process.env.REDIS_TLS).toLowerCase() === "true";

const sharedOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 500, 5000),
  reconnectOnError: (err) => {
    const targetErrors = ["READONLY", "ECONNRESET"];
    if (targetErrors.some((code) => err.message.includes(code))) {
      return true;
    }
    return false;
  },
  tls: isTlsEnabled
    ? {
        rejectUnauthorized:
          String(process.env.REDIS_TLS_REJECT_UNAUTHORIZED || "true") ===
          "true",
      }
    : undefined,
};

const defaultConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
};

const buildBullConnection = () =>
  process.env.REDIS_URL
    ? {
        ...sharedOptions,
        url: process.env.REDIS_URL,
      }
    : {
        ...sharedOptions,
        ...defaultConnection,
      };

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, sharedOptions)
  : new Redis({ ...defaultConnection, ...sharedOptions });

redisClient.on("connect", () => logger.info("Redis connected"));
redisClient.on("ready", () => logger.debug("Redis ready to accept commands"));
redisClient.on("reconnecting", () => logger.warn("Redis reconnecting..."));
redisClient.on("error", (err) => logger.error({ err }, "Redis error"));

export const redisConnectionOptions = buildBullConnection();
export const getRedisClient = () => redisClient;

export const getRedisLatency = async () => {
  const start = Date.now();
  await redisClient.ping();
  return Date.now() - start;
};

export const shutdownRedis = async () => {
  try {
    await redisClient.quit();
    logger.info("Redis connection closed gracefully");
  } catch (err) {
    logger.error({ err }, "Error shutting down Redis, forcing disconnect");
    redisClient.disconnect();
  }
};

export default redisClient;
