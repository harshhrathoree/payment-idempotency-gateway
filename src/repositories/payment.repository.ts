import { prisma } from "../config/prisma.js";
import {
  CreatePaymentInput,
  Payment,
  PaymentStatus,
} from "../types/payment.js";

export async function createPayment(
  input: CreatePaymentInput & {
    id: string;
    status: PaymentStatus;
  }
): Promise<Payment> {
  const payment = await prisma.payment.create({
    data: {
      id: input.id,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      amount: BigInt(input.amount),
      currency: input.currency,
      status: input.status,
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

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<Payment> {
  const payment = await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status,
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