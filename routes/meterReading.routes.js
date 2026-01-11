import express from "express";
import {
  getMeterReadings,
  createMeterReading
} from "../controllers/meterReading.controller.js";

const router = express.Router();

router.get("/", getMeterReadings);
router.post("/", createMeterReading);

export default router;
