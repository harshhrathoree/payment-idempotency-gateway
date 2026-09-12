import express from "express";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/v1", paymentRoutes);

export default app;