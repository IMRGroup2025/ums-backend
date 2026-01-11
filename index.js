import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

import customerRoutes from "./routes/customer.routes.js";
import meterRoutes from "./routes/meter.routes.js";
import meterReadingRoutes from "./routes/meterReading.routes.js";
import billRoutes from "./routes/bill.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import exportRoutes from "./routes/export.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import tariffPlansRoutes from "./routes/tariffPlans.routes.js";
import complaintRoutes from "./routes/complaints.routes.js";
import paymentRoutes from "./routes/payment.routes.js"; 
import utilityRoutes from "./routes/utility.routes.js";
import { authenticate } from "./middlewares/authenticate.middleware.js";
import { authorize } from "./middlewares/authorize.middleware.js";

dotenv.config();

const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.options("*", cors());

app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/meters", meterRoutes);
app.use("/api/meter-readings", meterReadingRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/tariff-plans", tariffPlansRoutes);
app.use("/api/utilities", utilityRoutes);
app.use("/api/payments", paymentRoutes);





app.get("/", (req, res) => {
  res.send("Utility Management System API is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/api/health/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({ status: "OK", db: rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ status: "ERROR", message: err.message });
  }
});


app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});


const PORT = process.env.PORT || 5000;

db.getConnection((err, connection) => {
  if (err) {
    console.error(" Database connection failed:", err.message);
  } else {
    console.log("Database connected successfully");
    connection.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;
