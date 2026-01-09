import express from "express";
import {
  getComplaints,
  addComplaint,
  updateComplaint,
  deleteComplaint,
} from "../controllers/complaints.controllers.js";

const router = express.Router();

router.get("/", getComplaints);
router.post("/", addComplaint);
router.put("/:id", updateComplaint);
router.delete("/:id", deleteComplaint);

export default router;
