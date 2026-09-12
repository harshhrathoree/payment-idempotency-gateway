import express from "express";
import paymentRoutes from "./routes/payment.routes.js";
import { rateLimit } from "./middleware/rate-limit.middleware.js";
import {pinoHttp} from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./config/logger.js";
const app = express();

app.use(express.json());

app.use(
  pinoHttp({
    logger,

    genReqId: () => randomUUID(),

    customProps: (req) => ({
      userId: req.body?.userId,
      idempotencyKey: req.headers["idempotency-key"],
    }),
  })
);


app.use(rateLimit);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});
app.use("/api/v1", paymentRoutes);

export default app;