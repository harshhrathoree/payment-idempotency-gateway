import { randomUUID } from "node:crypto";
import { prisma } from "../src/config/prisma.js";

async function main() {
  const userId = `db-test-user-${randomUUID()}`;
  const idempotencyKey = `db-test-key-${randomUUID()}`;

  console.log("Creating first payment...");

  const firstPayment = await prisma.payment.create({
    data: {
      id: randomUUID(),
      userId,
      idempotencyKey,
      amount: BigInt(50000),
      currency: "INR",
      status: "SUCCESS",
    },
  });

  console.log("First payment created:", firstPayment.id);

  console.log("\nCreating duplicate payment...");

  try {
    await prisma.payment.create({
      data: {
        id: randomUUID(),
        userId,
        idempotencyKey,
        amount: BigInt(50000),
        currency: "INR",
        status: "SUCCESS",
      },
    });

    console.log("❌ Duplicate was allowed!");
  } catch (error) {
    console.log("✅ PostgreSQL rejected the duplicate.");
    console.log(error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });