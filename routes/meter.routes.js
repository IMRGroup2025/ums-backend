import express from "express";
import {
  getMeters,
  addMeter,
  updateMeter,
  deleteMeter,
  getUtilities,
} from "../controllers/meter.controller.js";

const router = express.Router();

router.get("/utilities", getUtilities);
router.get("/", getMeters);
router.post("/", addMeter);
router.put("/:id", updateMeter);
router.delete("/:id", deleteMeter);

export default router;