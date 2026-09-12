import { randomUUID } from "node:crypto";

import {
  CreatePaymentInput,
  Payment,
} from "../types/payment.js";

import {
  createPayment,
  findPaymentByIdempotencyKey,
  updatePaymentStatus,
} from "../repositories/payment.repository.js";

import { chargePayment } from "./payment-processor.service.js";

export async function processPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const paymentId = randomUUID();

  const pendingPayment = await createPayment({
    ...input,
    id: paymentId,
    status: "PENDING",
  });

  const processorResult = await chargePayment();

  if (processorResult === "SUCCESS") {
    return updatePaymentStatus(paymentId, "SUCCESS");
  }

  if (processorResult === "FAILED") {
    return updatePaymentStatus(paymentId, "FAILED");
  }

  return pendingPayment;
}