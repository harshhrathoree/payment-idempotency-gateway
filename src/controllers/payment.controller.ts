import { Request, Response } from "express";
import { processPayment } from "../services/payment.service.js";

const SUPPORTED_CURRENCIES = ["INR"];

export async function createPayment(
  req: Request,
  res: Response
) {
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
  });

  return res.status(201).json({
    payment,
  });
}