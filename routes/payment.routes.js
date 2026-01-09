import express from "express";
import { recordPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", recordPayment);

export default router;
