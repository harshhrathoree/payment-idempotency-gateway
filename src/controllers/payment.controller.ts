import { Request, Response } from "express";
import { processPayment } from "../services/payment.service.js";
import {
  getCachedResponse,
  saveCachedResponse,
  acquireLock,
  releaseLock,
} from "../services/idempotency.service.js";
import {
  paymentRequestsTotal,
  paymentSuccessTotal,
  paymentFailedTotal,
  paymentTimeoutTotal,
  idempotencyCacheHitTotal,
  idempotencyCacheMissTotal,
  idempotencyConflictTotal,
  paymentProcessingDuration,
} from "../config/metrics.js";

const SUPPORTED_CURRENCIES = ["INR"];

export async function createPayment(
  req: Request,
  res: Response
) {
    paymentRequestsTotal.inc();
  const idempotencyKey = req.header("Idempotency-Key");

  req.log.info("Payment request received");

  if (!idempotencyKey) {
    req.log.warn("Missing Idempotency-Key");

    return res.status(400).json({
      error: "Idempotency-Key header is required",
    });
  }

  const cachedResponse = await getCachedResponse(idempotencyKey);

  if (cachedResponse) {
     idempotencyCacheHitTotal.inc();

    req.log.info(
      "Idempotency cache hit"
    );

    return res
      .status(cachedResponse.statusCode)
      .json(cachedResponse.body);
  }

  req.log.info(
    "Idempotency cache miss"
  );
  idempotencyCacheMissTotal.inc();

  const lockAcquired = await acquireLock(idempotencyKey);

  if (!lockAcquired) {
    req.log.warn(
      { idempotencyKey },
      "Payment already processing"
    );
      idempotencyConflictTotal.inc();

    return res.status(409).json({
      error:
        "Payment with this Idempotency-Key is already being processed",
    });
  }

  req.log.info(
    "Idempotency lock acquired"
  );

  try {
    const { userId, amount, currency } = req.body;

    if (!userId || amount === undefined || !currency) {
      req.log.warn(
        { idempotencyKey },
        "Invalid payment request"
      );

      return res.status(400).json({
        error: "userId, amount and currency are required",
      });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      req.log.warn(
        { userId, amount, idempotencyKey },
        "Invalid payment amount"
      );

      return res.status(400).json({
        error:
          "amount must be a positive integer in the smallest currency unit",
      });
    }

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      req.log.warn(
        { userId, currency, idempotencyKey },
        "Unsupported currency"
      );

      return res.status(400).json({
        error: `Unsupported currency: ${currency}`,
      });
    }

    req.log.info(
  {
    amount,
    currency,
  },
  "Processing payment"
);

    const endTimer = paymentProcessingDuration.startTimer();
    const payment = await processPayment({
      userId,
      amount,
      currency,
      idempotencyKey,
    });
    endTimer();

   req.log.info(
  {
    paymentId: payment.id,
    status: payment.status,
  },
  "Payment processed"
);

    const responseBody = {
      payment,
    };

    const statusCode =
      payment.status === "PENDING" ? 202 : 201;

    if (payment.status === "SUCCESS") {
  paymentSuccessTotal.inc();
}

if (payment.status === "FAILED") {
  paymentFailedTotal.inc();
}

if (payment.status === "PENDING") {
  paymentTimeoutTotal.inc();
}

    await saveCachedResponse(idempotencyKey, {
      statusCode,
      body: responseBody,
    });

   req.log.info(
  {
    paymentId: payment.id,
    status: payment.status,
    statusCode,
  },
  "Payment response cached"
);

    return res.status(statusCode).json(responseBody);
  } catch (error) {
    req.log.error(
      {
        err: error,
        idempotencyKey,
      },
      "Payment processing failed"
    );

    throw error;
  } finally {
    await releaseLock(idempotencyKey);

    req.log.info(
      "Idempotency lock released"
    );
  }
}