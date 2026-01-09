import express from "express";
import { getUtilities } from "../controllers/utility.controller.js";

const router = express.Router();

router.get("/", getUtilities);

export default router;
