const TOTAL_REQUESTS = 3100;

const userId = `rate-limit-test-${Date.now()}`;

async function sendRequest(requestNumber: number) {
  try {
    const response = await fetch(
      "http://localhost:3000/api/v1/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `rate-limit-${requestNumber}-${Date.now()}`,
        },
        body: JSON.stringify({
          userId,
          amount: 100,
          currency: "INR",
        }),
      }
    );

    return response.status;
  } catch {
    return 0;
  }
}

async function main() {
  console.log(`Sending ${TOTAL_REQUESTS} requests...`);
  console.log(`User: ${userId}`);

  const start = Date.now();

  const results = await Promise.all(
    Array.from(
      { length: TOTAL_REQUESTS },
      (_, index) => sendRequest(index + 1)
    )
  );

  const durationMs = Date.now() - start;

  const successful = results.filter(
    (status) => status === 201 || status === 202
  ).length;

  const rateLimited = results.filter(
    (status) => status === 429
  ).length;

  const errors = results.filter(
    (status) => status !== 201 &&
               status !== 202 &&
               status !== 429
  ).length;

  console.log("\n--- Rate Limit Results ---");
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful: ${successful}`);
  console.log(`Rate limited: ${rateLimited}`);
  console.log(`Other errors: ${errors}`);
  console.log(`Duration: ${durationMs}ms`);
  console.log(
    `Throughput: ${(
      TOTAL_REQUESTS /
      (durationMs / 1000)
    ).toFixed(2)} req/sec`
  );

  if (rateLimited > 0) {
    console.log("\n✅ Rate limiter rejected excess traffic.");
  } else {
    console.log("\n❌ No requests were rate limited.");
  }
}

main();