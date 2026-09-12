import { Request, Response } from "express";
import { processPayment } from "../services/payment.service.js";
import {
  getCachedResponse,
  saveCachedResponse,
  acquireLock,
  releaseLock,
} from "../services/idempotency.service.js";

const SUPPORTED_CURRENCIES = ["INR"];

export async function createPayment(
    req: Request,
    res: Response
) {
    const idempotencyKey = req.header("Idempotency-Key");

    if (!idempotencyKey) {
        return res.status(400).json({
            error: "Idempotency-Key header is required",
        });
    }
    const cachedResponse = await getCachedResponse(idempotencyKey);

    if (cachedResponse) {
        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
    }
    const lockAcquired = await acquireLock(idempotencyKey);

if (!lockAcquired) {
  return res.status(409).json({
    error: "Payment with this Idempotency-Key is already being processed",
  });
}

    try{
    const { userId, amount, currency } = req.body;

    if (!userId || amount === undefined || !currency) {
        return res.status(400).json({
            error: "userId, amount and currency are required",
        });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({
            error:
                "amount must be a positive integer in the smallest currency unit",
        });
    }

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return res.status(400).json({
            error: `Unsupported currency: ${currency}`,
        });
    }

    const payment = await processPayment({
        userId,
        amount,
        currency,
        idempotencyKey,
    });

  const responseBody = {
  payment,
};

const statusCode = payment.status === "PENDING" ? 202 : 201;

await saveCachedResponse(idempotencyKey, {
  statusCode,
  body: responseBody,
});

return res.status(statusCode).json(responseBody);
    }
    finally{
        await releaseLock(idempotencyKey);
    }
}