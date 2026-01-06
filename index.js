import express from "express";
import cors from "cors";
import customerRoutes from "./routes/customer.routes.js";
import meterRoutes from "./routes/meter.routes.js"
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.send("Utility Management System API is running");
});

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/meters", meterRoutes)
// Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
