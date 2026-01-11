import express from "express";
import {
	getBills,
	getBillsByMeter,
	markBillPaid,
	getBillPrintable,
} from "../controllers/bill.controller.js";

const router = express.Router();

router.get("/", getBills);
router.get("/meter/:meterId", getBillsByMeter);
router.get("/:id/print", getBillPrintable);
router.put("/:id/pay", markBillPaid);


export default router;
