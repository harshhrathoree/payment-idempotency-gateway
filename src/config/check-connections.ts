import { prisma } from "./prisma.js";
import { redis } from "./redis.js";
import { logger } from "./logger.js";

export async function checkPostgresConnection() {
  await prisma.$queryRaw`SELECT 1`;

  logger.info(
    "PostgreSQL connected"
  );
}

export async function checkRedisConnection() {
  const result = await redis.ping();

  logger.info(
    { response: result },
    "Redis connected"
  );
}