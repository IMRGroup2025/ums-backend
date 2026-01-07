import express from "express"
import db from "../db.js"

const router = express.Router()

router.get("/", (req, res) => {
  const sql = `
    SELECT 
      b.bill_id,
      c.name AS customer_name,
      u.utility_name,
      b.billing_month,
      b.consumption,
      b.amount,
      b.status
    FROM Bill b
    JOIN Meter m ON b.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    ORDER BY b.bill_id DESC
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

export default router
