import express from "express";
import { getBills, markBillPaid } from "../controllers/bill.controller.js";

const router = express.Router();

router.get("/", getBills);
router.put("/:id/pay", markBillPaid);

export default router;
