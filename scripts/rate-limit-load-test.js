import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 100,
  duration: "10s",
};

export default function () {
  const payload = JSON.stringify({
    userId: "rate-limit-test-user",
    amount: 500,
    currency: "INR",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `rate-limit-${__VU}-${__ITER}`,
    },
  };

  const response = http.post(
    "http://localhost:3000/api/v1/payments",
    payload,
    params
  );

  check(response, {
    "status is 201 or 429": (r) =>
      r.status === 201 || r.status === 429,
  });
}