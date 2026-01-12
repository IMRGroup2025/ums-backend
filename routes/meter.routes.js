import express from "express";
import {
  getMeters,
  getMetersGrouped,
  addMeter,
  updateMeter,
  deleteMeter,
  getUtilities,
} from "../controllers/meter.controller.js";

const router = express.Router();

router.get("/utilities", getUtilities);
router.get("/grouped", getMetersGrouped);
router.get("/", getMeters);
router.post("/", addMeter);
router.put("/:id", updateMeter);
router.delete("/:id", deleteMeter);

export default router;