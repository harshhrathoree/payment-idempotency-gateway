import { redis } from "../config/redis.js";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60; // 1 hour

interface CachedResponse {
  statusCode: number;
  body: unknown;
}

function getRedisKey(idempotencyKey: string): string {
  return `idempotency:${idempotencyKey}`;
}

export async function getCachedResponse(
  idempotencyKey: string
): Promise<CachedResponse | null> {
  const key = getRedisKey(idempotencyKey);

  const cached = await redis.get(key);

  if (!cached) {
    return null;
  }

  return JSON.parse(cached) as CachedResponse;
}

export async function saveCachedResponse(
  idempotencyKey: string,
  response: CachedResponse
): Promise<void> {
  const key = getRedisKey(idempotencyKey);

  await redis.set(
    key,
    JSON.stringify(response),
    "EX",
    IDEMPOTENCY_TTL_SECONDS
  );
}

export async function deleteCachedResponse(
  idempotencyKey: string
): Promise<void> {
  const key = getRedisKey(idempotencyKey);

  await redis.del(key);
}

const IDEMPOTENCY_LOCK_TTL_SECONDS = 10;

function getLockKey(idempotencyKey: string): string {
  return `idempotency:lock:${idempotencyKey}`;
}

export async function acquireLock(
  idempotencyKey: string
): Promise<boolean> {
  const key = getLockKey(idempotencyKey);

  const result = await redis.set(
    key,
    "LOCKED",
    "EX",
    IDEMPOTENCY_LOCK_TTL_SECONDS,
    "NX"
  );

  return result === "OK";
}

export async function releaseLock(
  idempotencyKey: string
): Promise<void> {
  const key = getLockKey(idempotencyKey);

  await redis.del(key);
}