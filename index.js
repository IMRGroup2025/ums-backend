import express from "express"
import cors from "cors"
import customerRoutes from "./routes/customer.routes.js"

const app = express()

// Enable CORS
app.use(cors())

// Parse JSON
app.use(express.json())

// Routes
app.use("/api/customers", customerRoutes)

const PORT = 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
