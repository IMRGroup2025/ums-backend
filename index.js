import express from "express"
import cors from "cors"
import customerRoutes from "./routes/customer.routes.js"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/customers", customerRoutes)
app.get("/", (req, res) => {
  res.send("API is running")
})


app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000")
})
