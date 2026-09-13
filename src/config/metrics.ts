import client from "prom-client";

export const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

export const paymentRequestsTotal = new client.Counter({
  name: "payment_requests_total",
  help: "Total number of payment requests received",
  registers: [register],
});

export const paymentSuccessTotal = new client.Counter({
  name: "payment_success_total",
  help: "Total number of successful payments",
  registers: [register],
});

export const paymentFailedTotal = new client.Counter({
  name: "payment_failed_total",
  help: "Total number of failed payments",
  registers: [register],
});

export const paymentTimeoutTotal = new client.Counter({
  name: "payment_timeout_total",
  help: "Total number of payment timeouts",
  registers: [register],
});

export const idempotencyCacheHitTotal = new client.Counter({
  name: "idempotency_cache_hit_total",
  help: "Total number of idempotency cache hits",
  registers: [register],
});

export const idempotencyCacheMissTotal = new client.Counter({
  name: "idempotency_cache_miss_total",
  help: "Total number of idempotency cache misses",
  registers: [register],
});

export const idempotencyConflictTotal = new client.Counter({
  name: "idempotency_conflict_total",
  help: "Total number of idempotency lock conflicts",
  registers: [register],
});

export const paymentProcessingDuration = new client.Histogram({
  name: "payment_processing_duration_seconds",
  help: "Payment processing duration in seconds",
  registers: [register],
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10],
});