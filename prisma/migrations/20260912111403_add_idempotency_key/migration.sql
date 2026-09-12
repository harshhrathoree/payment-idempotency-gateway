/*
  Warnings:

  - A unique constraint covering the columns `[user_id,idempotency_key]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotency_key` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "idempotency_key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_user_id_idempotency_key_key" ON "payments"("user_id", "idempotency_key");
