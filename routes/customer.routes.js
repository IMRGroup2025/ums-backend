import express from "express"
import db from "../db.js"

const router = express.Router()

// GET all customers
router.get("/", (req, res) => {
  const sql = "SELECT * FROM Customer"

  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).json(err)
    } else {
      res.json(results)
    }
  })
})
// ADD new customer
router.post("/", (req, res) => {
  const { name, customer_type, address, phone, email } = req.body

  const sql = `
    INSERT INTO Customer (name, customer_type, address, phone, email)
    VALUES (?, ?, ?, ?, ?)
  `

  db.query(
    sql,
    [name, customer_type, address, phone, email],
    (err, result) => {
      if (err) {
        res.status(500).json(err)
      } else {
        res.json({ message: "Customer added successfully" })
      }
    }
  )
})

// UPDATE customer
router.put("/:id", (req, res) => {
  const { name, customer_type, address, phone, email } = req.body
  const { id } = req.params

  const sql = `
    UPDATE Customer
    SET name=?, customer_type=?, address=?, phone=?, email=?
    WHERE customer_id=?
  `

  db.query(
    sql,
    [name, customer_type, address, phone, email, id],
    (err) => {
      if (err) {
        res.status(500).json(err)
      } else {
        res.json({ message: "Customer updated successfully" })
      }
    }
  )
})

// DELETE customer
router.delete("/:id", (req, res) => {
  const { id } = req.params

  const sql = "DELETE FROM Customer WHERE customer_id=?"

  db.query(sql, [id], (err) => {
    if (err) {
      res.status(500).json(err)
    } else {
      res.json({ message: "Customer deleted successfully" })
    }
  })
})



export default router
