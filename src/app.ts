import express from "express";
import paymentRoutes from "./routes/payment.routes.js";
import { rateLimit } from "./middleware/rate-limit.middleware.js";
const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(rateLimit);
app.use("/api/v1", paymentRoutes);

export default app;