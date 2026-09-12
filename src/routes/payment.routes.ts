import { Router } from "express";
import { createPayment } from "../controllers/payment.controller.js";

const router = Router();

router.post("/payments", createPayment);

export default router;