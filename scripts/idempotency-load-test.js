import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const successfulPayments = new Counter("successful_payments");
const concurrentConflicts = new Counter("concurrent_conflicts");

export const options = {
  vus: 100,
  iterations: 100,

  thresholds: {
    successful_payments: ["count==1"],
    concurrent_conflicts: ["count==99"],
  },
};

export default function () {
  const payload = JSON.stringify({
    userId: "concurrent-test-user-3",
    amount: 500,
    currency: "INR",
  });

  const response = http.post(
    "http://localhost:3000/api/v1/payments",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "concurrent-payment-test-3",
      },
    }
  );

  if (response.status === 201) {
    successfulPayments.add(1);
  }

  if (response.status === 409) {
    concurrentConflicts.add(1);
  }

  check(response, {
    "status is 201 or 409": (r) =>
      r.status === 201 || r.status === 409,
  });
}