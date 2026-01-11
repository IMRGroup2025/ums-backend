import express from "express";
import {
  createMeterReading,
  deleteMeterReading,
  getMeterReadings,
  getMeterReadingsGrouped,
} from "../controllers/meterReading.controller.js";

const router = express.Router();

router.get("/grouped", getMeterReadingsGrouped);
router.get("/", getMeterReadings);
router.post("/", createMeterReading);
router.delete("/:id", deleteMeterReading);

export default router;
