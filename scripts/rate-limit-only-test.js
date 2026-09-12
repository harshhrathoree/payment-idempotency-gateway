import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 100,
  duration: "10s",
};

export default function () {
  const response = http.get(
    "http://localhost:3000/api/v1/load-test",
    {
      headers: {
        "X-Test-User": "rate-limit-k6-user",
      },
    }
  );

  check(response, {
    "status is 200 or 429": (r) =>
      r.status === 200 || r.status === 429,
  });
}