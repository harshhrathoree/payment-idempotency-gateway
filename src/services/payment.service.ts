import { randomUUID } from "node:crypto";
import {
  CreatePaymentInput,
  Payment,
} from "../types/payment.js";
import { createPayment } from "../repositories/payment.repository.js";
import { chargePayment } from "./payment-processor.service.js";

export async function processPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const paymentId = randomUUID();

  await chargePayment();

  return createPayment({
    ...input,
    id: paymentId,
  });
}