import { randomUUID } from "node:crypto";

import {
  CreatePaymentInput,
  Payment,
} from "../types/payment.js";

import {
  createPayment,
  findPaymentByIdempotencyKey,
} from "../repositories/payment.repository.js";

import { chargePayment } from "./payment-processor.service.js";

export async function processPayment(
  input: CreatePaymentInput
): Promise<Payment> {
  const paymentId = randomUUID();

  await chargePayment();

  try {
    return await createPayment({
      ...input,
      id: paymentId,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      const existingPayment = await findPaymentByIdempotencyKey(
        input.userId,
        input.idempotencyKey
      );

      if (existingPayment) {
        return existingPayment;
      }
    }

    throw error;
  }
}