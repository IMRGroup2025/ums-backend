import express from "express";
import {
  getCustomersWithRelations,
  getCustomerWithRelations,
  getMeterWithRelations,
  getRelationshipSummary
} from "../controllers/relationships.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = express.Router();


router.get("/customers", authenticate, getCustomersWithRelations);


router.get("/customers/:id", authenticate, getCustomerWithRelations);


router.get("/meters/:id", authenticate, getMeterWithRelations);


router.get("/summary", authenticate, getRelationshipSummary);

export default router;
