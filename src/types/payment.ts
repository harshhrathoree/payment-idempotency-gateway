export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface CreatePaymentInput {
  userId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}