import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";

const CAPACITY = 3000;
const REFILL_RATE = CAPACITY / 60;

const tokenBucketScript = `
local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call("HMGET", key, "tokens", "lastRefill")

local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
end

local elapsed = math.max(0, now - lastRefill)

tokens = math.min(
  capacity,
  tokens + (elapsed * refillRate)
)

local allowed = 0

if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call(
  "HMSET",
  key,
  "tokens",
  tokens,
  "lastRefill",
  now
)

redis.call(
  "EXPIRE",
  key,
  120
)

return {
  allowed,
  tokens
}
`;

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.body?.userId;

  if (!userId) {
    return res.status(400).json({
      error: "userId is required",
    });
  }

  const key = `rate-limit:${userId}`;
  const now = Date.now() / 1000;

  const result = await redis.eval(
    tokenBucketScript,
    1,
    key,
    CAPACITY,
    REFILL_RATE,
    now
  ) as [number, number];

  const [allowed, remainingTokens] = result;

  res.setHeader(
    "X-RateLimit-Limit",
    CAPACITY
  );

  res.setHeader(
    "X-RateLimit-Remaining",
    Math.floor(remainingTokens)
  );

  if (allowed === 0) {
    res.setHeader(
      "Retry-After",
      "1"
    );

    return res.status(429).json({
      error: "Too many requests",
    });
  }

  next();
}