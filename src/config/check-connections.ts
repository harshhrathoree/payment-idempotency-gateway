import { prisma } from "./prisma.js";
import { redis } from "./redis.js";

export async function checkPostgresConnection() {
  await prisma.$queryRaw`SELECT 1`;

  console.log("PostgreSQL connected");
}

export async function checkRedisConnection() {
  const result = await redis.ping();

  console.log("Redis connected:", result);
}