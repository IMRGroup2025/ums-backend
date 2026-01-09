import express from "express";
import {
  getTariffPlans,
  addTariffPlan,
  updateTariffPlan,
  deleteTariffPlan,
} from "../controllers/tariffPlans.controllers.js";

const router = express.Router();

router.get("/", getTariffPlans);
router.post("/", addTariffPlan);
router.put("/:id", updateTariffPlan);
router.delete("/:id", deleteTariffPlan);

export default router;
