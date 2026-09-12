import { env } from "../config/env.js";

export type ProcessorResult =
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT";

export async function chargePayment(): Promise<ProcessorResult> {
  await new Promise((resolve) => {
    setTimeout(resolve, env.processingDelayMs);
  });

  return env.processorResult;
}