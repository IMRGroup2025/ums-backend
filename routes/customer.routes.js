import express from "express";
import { addCustomer, updateCustomer, deleteCustomer, getCustomers } from "../controllers/customer.controller.js";

const router = express.Router();


router.get("/",getCustomers);


router.post("/", addCustomer);


router.put("/:id", updateCustomer);
   
        

router.delete("/:id", deleteCustomer)



export default router;
