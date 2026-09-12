import { postgres } from "./postgres.js";
import { redis } from "./redis.js";

export async function checkPostgresConnection() {
  const result = await postgres.query("SELECT NOW()");

  console.log("PostgreSQL connected:", result.rows[0]);
}

export async function checkRedisConnection() {
  const result = await redis.ping();

  console.log("Redis connected:", result);
}