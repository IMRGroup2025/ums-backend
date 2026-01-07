import express from "express"
import db from "../db.js"

const router = express.Router()

// GET all payments
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      p.payment_id,
      c.name AS customer_name,
      p.bill_id,
      p.amount_paid,
      p.payment_method,
      p.payment_date
    FROM Payment p
    JOIN Bill b ON p.bill_id = b.bill_id
    JOIN Meter m ON b.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    ORDER BY p.payment_date DESC
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

// PAY BILL
router.post("/", (req, res) => {
  const { bill_id, amount_paid, payment_method } = req.body

  const paymentSql = `
    INSERT INTO Payment (bill_id, payment_date, amount_paid, payment_method)
    VALUES (?, CURDATE(), ?, ?)
  `

  const updateBillSql = `
    UPDATE Bill SET status = 'PAID' WHERE bill_id = ?
  `

  db.query(paymentSql, [bill_id, amount_paid, payment_method], (err) => {
    if (err) return res.status(500).json(err)

    db.query(updateBillSql, [bill_id], (err2) => {
      if (err2) return res.status(500).json(err2)

      res.json({ message: "Payment successful, bill marked as PAID" })
    })
  })
})

export default router
