# Payment Idempotency Gateway

A production-oriented payment API demonstrating **idempotency, concurrency control, distributed rate limiting, durable database guarantees, structured logging, observability, and load testing**.

The project simulates a payment gateway where clients may retry requests because of network failures or timeouts. The system guarantees that the same idempotency key does not result in duplicate payment records, even when multiple requests arrive concurrently.

---

## Architecture

```text
                         ┌──────────────────┐
                         │      Client      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Node.js API    │
                         │ Express + TS     │
                         └────────┬─────────┘
                                  │
                         Rate Limiter
                                  │
                         Idempotency Layer
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
              ┌───────────┐              ┌─────────────┐
              │   Redis   │              │ PostgreSQL  │
              │           │              │   + Prisma  │
              │ Cache     │              │             │
              │ Lock      │              │ Durable     │
              │ Rate limit│              │ uniqueness  │
              └─────┬─────┘              └──────┬──────┘
                    │                            │
                    └──────────┬─────────────────┘
                               │
                               ▼
                       ┌────────────────┐
                       │ Payment        │
                       │ Processor      │
                       │ (Simulated)    │
                       └────────────────┘


        Observability
        ─────────────

        Node.js API
             │
          /metrics
             │
             ▼
        ┌────────────┐
        │ Prometheus │
        └─────┬──────┘
              │
              ▼
        ┌────────────┐
        │  Grafana   │
        └────────────┘
```

---

## Problem

Payment APIs are vulnerable to duplicate operations when clients retry requests.

For example:

```text
Client
  │
  │ POST /payments
  ▼
Payment API
  │
  │ processing...
  │
  │────── network timeout ──────► Client
  │
  │
Client retries the same payment
  │
  ▼
Payment API
```

Without idempotency, both requests can create separate payments.

The goal of this project is to make the payment operation **safe to retry**.

---

## Core Design

The API accepts an `Idempotency-Key` with every payment request.

```http
POST /api/v1/payments
Idempotency-Key: payment-123
```

The system uses multiple layers of protection.

### 1. Redis response cache

Completed responses are cached using:

```text
idempotency:<key>
```

A retry can therefore return the original response without processing the payment again.

---

### 2. Redis distributed lock

Concurrent requests use:

```text
idempotency:lock:<key>
```

The lock is acquired atomically using Redis:

```text
SET key value NX EX
```

Only one request can process a particular idempotency key at a time.

Concurrent requests receive:

```http
409 Conflict
```

instead of creating duplicate payments.

---

### 3. PostgreSQL durable uniqueness

Redis is not the final source of truth.

The database contains:

```text
UNIQUE(user_id, idempotency_key)
```

This provides a durable correctness guarantee even if Redis state is lost or multiple application instances race.

---

## Payment States

```text
             ┌──────────┐
             │ PENDING  │
             └────┬─────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
      SUCCESS            FAILED
```

### SUCCESS

```http
201 Created
```

### FAILED

```http
201 Created
```

The payment operation was processed successfully, but the simulated processor rejected the payment.

### TIMEOUT

```http
202 Accepted
```

The payment remains:

```text
PENDING
```

This models a situation where the processor does not provide a definitive result.

A production implementation could later reconcile such payments through webhooks or an asynchronous reconciliation worker.

---

## Rate Limiting

The API uses a Redis-backed **token bucket** rate limiter.

Configuration:

```text
Capacity:       3000 tokens
Refill rate:    50 tokens/second
```

The rate limiter is implemented using a Redis Lua script so that token calculation and consumption happen atomically.

When the bucket is exhausted:

```http
429 Too Many Requests
```

The API also returns:

```http
X-RateLimit-Limit
X-RateLimit-Remaining
Retry-After
```

---

## Observability

The application uses **Pino** for structured JSON logging.

Example events include:

```text
Payment request received
Idempotency cache miss
Idempotency lock acquired
Processing payment
Payment processed
Payment response cached
Idempotency lock released
```

Prometheus metrics are exposed through:

```text
GET /metrics
```

Custom metrics include:

```text
payment_requests_total
payment_success_total
payment_failed_total
payment_timeout_total

idempotency_cache_hit_total
idempotency_cache_miss_total
idempotency_conflict_total

payment_processing_duration_seconds
```

Grafana is used to visualize the collected metrics.

---

## Load Testing

Load testing was performed using **k6**.

### Payment Processing Benchmark

Configuration:

```text
Virtual users:     100
Duration:          30 seconds
```

Observed local benchmark:

```text
Requests:          1000
Throughput:        ~32.56 req/s
Average latency:   ~3.06 s
p95 latency:       ~3.09 s
Failures:          0%
```

The payment processor intentionally introduces a 3-second processing delay.

These numbers are **local benchmark observations**, not a claimed production capacity.

---

## Concurrent Idempotency Test

Configuration:

```text
Concurrent requests: 100
Same user:            yes
Same idempotency key: yes
```

Result:

```text
Successful payments:       1
Concurrent conflicts:     99
Unique payment records:    1
```

This demonstrates the core invariant:

> 100 concurrent requests using the same idempotency key must not create 100 payments.

The Redis lock prevents concurrent processing, while PostgreSQL provides the durable uniqueness guarantee.

---

## Rate Limiter Benchmark

A lightweight endpoint was used to isolate the Redis rate limiter from payment-processing latency.

Observed local benchmark:

```text
Requests:       ~141,701
Generated rate: ~14,163 req/s
Average latency: ~7 ms
p95 latency:     ~10 ms
```

Approximately:

```text
~3,499 accepted
~138,202 rate limited
```

The high throughput applies to the lightweight rate-limit endpoint and should **not** be interpreted as payment-processing throughput.

---

## Failure Testing

The system supports simulated processor outcomes through:

```env
PAYMENT_PROCESSOR_RESULT=SUCCESS
```

```env
PAYMENT_PROCESSOR_RESULT=FAILED
```

```env
PAYMENT_PROCESSOR_RESULT=TIMEOUT
```

Verified behavior:

| Processor Result | Payment Status | HTTP Status |
| ---------------- | -------------- | ----------: |
| SUCCESS          | SUCCESS        |         201 |
| FAILED           | FAILED         |         201 |
| TIMEOUT          | PENDING        |         202 |

---

## Technology Stack

### Backend

* Node.js
* TypeScript
* Express

### Database

* PostgreSQL
* Prisma ORM

### Distributed Systems

* Redis
* Redis Lua scripts
* Distributed locking
* Token bucket rate limiting

### Observability

* Pino
* pino-http
* Prometheus
* Grafana

### Testing / Benchmarking

* k6

### Infrastructure

* Docker
* Docker Compose

---

## Project Structure

```text
payment-idempotency-gateway/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   ├── check-connections.ts
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   ├── metrics.ts
│   │   ├── prisma.ts
│   │   └── redis.ts
│   │
│   ├── controllers/
│   │   └── payment.controller.ts
│   │
│   ├── middleware/
│   │   └── rate-limit.middleware.ts
│   │
│   ├── repositories/
│   │   └── payment.repository.ts
│   │
│   ├── services/
│   │   ├── idempotency.service.ts
│   │   ├── payment-processor.service.ts
│   │   └── payment.service.ts
│   │
│   ├── types/
│   │   └── payment.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── scripts/
│   ├── concurrent-payment.ts
│   ├── idempotency-load-test.js
│   ├── load-test.js
│   ├── rate-limit-load-test.js
│   ├── rate-limit-only-test.js
│   ├── test-db-uniqueness.ts
│   └── test-rate-limit.ts
│
├── docker-compose.yml
├── prometheus.yml
├── prisma.config.ts
├── package.json
└── README.md
```

---

## Running Locally

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts:

```text
PostgreSQL
Redis
Prometheus
Grafana
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy:

```text
.env.example
```

to:

```text
.env
```

Configure the required environment variables.

### 4. Apply Prisma migrations

```bash
npx prisma migrate dev
```

### 5. Start the API

```bash
npm run dev
```

API:

```text
http://localhost:3000
```

Prometheus:

```text
http://localhost:9090
```

Grafana:

```text
http://localhost:3001
```

Metrics:

```text
http://localhost:3000/metrics
```

---

## Example Payment Request

```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment-123" \
  -d '{
    "userId": "user-123",
    "amount": 500,
    "currency": "INR"
  }'
```

Retrying the same request with:

```text
Idempotency-Key: payment-123
```

returns the cached response instead of creating another payment.

---

## Key Engineering Decisions

### Why Redis?

Redis provides low-latency access for:

* idempotency response caching
* distributed locks
* rate limiting

### Why PostgreSQL uniqueness as well?

Redis provides coordination, but PostgreSQL provides **durable correctness**.

The database constraint protects against duplicate records even if:

* Redis restarts
* the cache expires
* multiple application instances race
* application-level coordination fails

### Why both cache and lock?

They solve different problems.

```text
Cache → prevents repeated processing after completion

Lock  → prevents concurrent processing before completion
```

### Why Lua for rate limiting?

The token calculation and token consumption need to be atomic.

A Lua script executes as a single Redis operation, avoiding race conditions between multiple clients.

---

## Future Improvements

The project intentionally stops short of implementing several production extensions.

Potential next steps include:

* asynchronous payment reconciliation worker
* payment processor webhooks
* Kafka/RabbitMQ for asynchronous processing
* stronger distributed lock ownership tokens
* lock renewal for long-running payments
* authenticated user identity instead of test headers
* multi-instance deployment
* Kubernetes deployment
* distributed tracing with OpenTelemetry
* alerting through Grafana/Prometheus
* Redis/PostgreSQL failure recovery strategies

These are deliberately kept outside the current scope to keep the project focused on its core idempotency problem.

---

## Interview Talking Points

This project demonstrates practical understanding of:

* API idempotency
* distributed locking
* race conditions
* Redis atomic operations
* database uniqueness constraints
* eventual consistency
* failure semantics
* rate limiting
* token bucket algorithms
* structured logging
* Prometheus metrics
* observability
* load testing
* Dockerized infrastructure
* performance benchmarking

The central design principle is:

> **Redis coordinates requests; PostgreSQL guarantees durable correctness.**
