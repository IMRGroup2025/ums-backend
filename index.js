import express from "express";
import cors from "cors";
import customerRoutes from "./routes/customer.routes.js";
import meterRoutes from "./routes/meter.routes.js"
import meterReadingRoutes from "./routes/meterReading.routes.js"
import billRoutes from "./routes/bill.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import exportRoutes from "./routes/export.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import userRoutes from "./routes/user.routes.js";


const app = express();


app.use(cors());
app.use(express.json());
app.use("/api/bills", billRoutes);
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/export", exportRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/meter-readings", meterReadingRoutes)
app.use("/api/meters", meterRoutes)
app.use("/api/customers", customerRoutes);  
app.use("/api/users", userRoutes);




app.get("/", (req, res) => {
  res.send("Utility Management System API is running");
});




const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
