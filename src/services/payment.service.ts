import { randomUUID } from "node:crypto";
import {
  CreatePaymentInput,
  Payment,
} from "../types/payment.js";
import { createPayment } from "../repositories/payment.repository.js";

export async function processPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const paymentId = randomUUID();

  return createPayment({
    ...input,
    id: paymentId,
  });
}