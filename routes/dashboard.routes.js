import express from "express"
import db from "../db.js"

const router = express.Router()

router.get("/:utilityId", (req, res) => {
  const utilityId = req.params.utilityId

  const sql = `
    SELECT
      COUNT(DISTINCT m.customer_id) AS total_customers,
      COUNT(DISTINCT m.meter_id) AS total_meters,
      IFNULL(SUM(b.consumption), 0) AS total_consumption,
      IFNULL(SUM(p.amount_paid), 0) AS total_revenue,
      COUNT(CASE WHEN b.status = 'UNPAID' THEN 1 END) AS unpaid_bills
    FROM Meter m
    LEFT JOIN Bill b ON m.meter_id = b.meter_id
    LEFT JOIN Payment p ON b.bill_id = p.bill_id
    WHERE m.utility_id = ?
  `

  db.query(sql, [utilityId], (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results[0])
  })
})

export default router
