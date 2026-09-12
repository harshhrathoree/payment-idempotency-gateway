import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const successfulPayments = new Counter("successful_payments");

export const options = {
  vus: 100,
  duration: "30s",

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<4000"],
  },
};

export default function () {
  const payload = JSON.stringify({
    userId: `load-test-user-${__VU}`,
    amount: 500,
    currency: "INR",
  });

  const response = http.post(
    "http://localhost:3000/api/v1/payments",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": `load-test-${__VU}-${__ITER}`,
      },
    }
  );

  const success = check(response, {
    "status is 201": (r) => r.status === 201,
    "response contains payment": (r) =>
      r.body.includes('"payment"'),
  });

  if (success) {
    successfulPayments.add(1);
  }
}