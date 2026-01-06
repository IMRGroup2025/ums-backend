import express from "express"
import db from "../db.js"

const router = express.Router()

// GET all meters (with customer + utility)
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      m.meter_id,
      m.meter_number,
      m.status,
      c.name AS customer_name,
      u.utility_name
    FROM Meter m
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

// ADD meter
router.post("/", (req, res) => {
  const { meter_number, customer_id, utility_id } = req.body

  const sql = `
    INSERT INTO Meter (meter_number, customer_id, utility_id)
    VALUES (?, ?, ?)
  `

  db.query(sql, [meter_number, customer_id, utility_id], (err) => {
    if (err) return res.status(500).json(err)
    res.json({ message: "Meter added successfully" })
  })
})

// DELETE meter
router.delete("/:id", (req, res) => {
  const sql = "DELETE FROM Meter WHERE meter_id=?"

  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json(err)
    res.json({ message: "Meter deleted successfully" })
  })
})

export default router
