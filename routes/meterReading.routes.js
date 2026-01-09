import express from "express";
import {
  getMeterReadings,
  addMeterReading,
} from "../controllers/meterReading.controller.js";

const router = express.Router();

/* =========================
   ROUTES
========================= */
router.get("/", getMeterReadings);
router.post("/", addMeterReading);

export default router;
