import { prisma } from "../config/prisma.js";
import {
  CreatePaymentInput,
  Payment,
} from "../types/payment.js";

export async function createPayment(
  input: CreatePaymentInput & { id: string }
): Promise<Payment> {
  const payment = await prisma.payment.create({
    data: {
      id: input.id,
      userId: input.userId,
      amount: BigInt(input.amount),
      currency: input.currency,
      status: "SUCCESS",
    },
  });

  return {
    id: payment.id,
    userId: payment.userId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}