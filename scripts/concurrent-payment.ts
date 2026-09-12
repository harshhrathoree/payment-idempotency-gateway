const TOTAL_REQUESTS = 100;
const IDEMPOTENCY_KEY = `concurrent-test-${Date.now()}`;

const paymentRequest = {
  userId: "user_concurrent",
  amount: 50000,
  currency: "INR",
};

async function sendRequest(requestNumber: number) {
  const start = Date.now();

  try {
    const response = await fetch(
      "http://localhost:3000/api/v1/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": IDEMPOTENCY_KEY,
        },
        body: JSON.stringify(paymentRequest),
      }
    );

    const body = await response.json();

    return {
      requestNumber,
      status: response.status,
      paymentId: body.payment?.id ?? null,
      error: body.error ?? null,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      requestNumber,
      status: 0,
      paymentId: null,
      error: String(error),
      durationMs: Date.now() - start,
    };
  }
}

async function main() {
  console.log(`Sending ${TOTAL_REQUESTS} concurrent requests...`);
  console.log(`Idempotency-Key: ${IDEMPOTENCY_KEY}`);

  const results = await Promise.all(
    Array.from(
      { length: TOTAL_REQUESTS },
      (_, index) => sendRequest(index + 1)
    )
  );

  const successful = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const otherErrors = results.filter(
    (r) => r.status !== 201 && r.status !== 409
  );

  const paymentIds = new Set(
    successful
      .map((r) => r.paymentId)
      .filter(Boolean)
  );

  console.log("\n--- Results ---");
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Already processing: ${conflicts.length}`);
  console.log(`Other errors: ${otherErrors.length}`);
  console.log(`Unique payment IDs: ${paymentIds.size}`);

  console.log("\nSuccessful payment IDs:");

  for (const paymentId of paymentIds) {
    console.log(`  ${paymentId}`);
  }

  if (paymentIds.size === 1) {
    console.log("\n✅ Exactly one payment was created.");
  } else {
    console.log("\n❌ Multiple payments were created!");
  }
}

main();