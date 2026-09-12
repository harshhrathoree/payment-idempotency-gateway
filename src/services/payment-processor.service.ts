export async function chargePayment(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
}