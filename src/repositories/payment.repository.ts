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
    idempotencyKey: input.idempotencyKey,
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

export async function findPaymentByIdempotencyKey(
  userId: string,
  idempotencyKey: string
): Promise<Payment | null> {
  const payment = await prisma.payment.findUnique({
    where: {
      userId_idempotencyKey: {
        userId,
        idempotencyKey,
      },
    },
  });

  if (!payment) {
    return null;
  }

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