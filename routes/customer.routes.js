import express from "express"
import db from "../db.js"

const router = express.Router()

// GET all customers
router.get("/", (req, res) => {
  db.query("SELECT * FROM Customer", (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

// POST add customer
router.post("/", (req, res) => {
  const { name, customer_type, address, phone, email } = req.body

  const sql = `
    INSERT INTO Customer (name, customer_type, address, phone, email)
    VALUES (?, ?, ?, ?, ?)
  `

  db.query(
    sql,
    [name, customer_type, address, phone, email],
    (err) => {
      if (err) return res.status(500).json(err)
      res.json({ message: "Customer added successfully" })
    }
  )
})

export default router
