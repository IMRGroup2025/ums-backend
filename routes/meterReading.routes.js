import express from "express"
import db from "../db.js"

const router = express.Router()

/* =========================
   GET all meter readings
========================= */
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      mr.reading_id,
      mr.reading_date,
      mr.previous_reading,
      mr.current_reading,
      mr.consumption,
      m.meter_number
    FROM MeterReading mr
    JOIN Meter m ON mr.meter_id = m.meter_id
    ORDER BY mr.reading_date DESC
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

/* =========================
   ADD meter reading
========================= */
router.post("/", (req, res) => {
  const { meter_id, current_reading, reading_date } = req.body

  if (!meter_id || !current_reading || !reading_date) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  const meterId = Number(meter_id)
  const current = Number(current_reading)

  if (Number.isNaN(meterId) || Number.isNaN(current)) {
    return res.status(400).json({ message: "Invalid values" })
  }

  /* Get previous reading */
  const prevSql = `
    SELECT current_reading 
    FROM MeterReading
    WHERE meter_id = ?
    ORDER BY reading_date DESC
    LIMIT 1
  `

  db.query(prevSql, [meterId], (err, prevRows) => {
    if (err) return res.status(500).json(err)

    const previous = prevRows.length ? prevRows[0].current_reading : 0
    const consumption = current - previous

    if (consumption < 0) {
      return res.status(400).json({ message: "Current reading cannot be less than previous" })
    }

    const insertSql = `
      INSERT INTO MeterReading
      (meter_id, reading_date, previous_reading, current_reading, consumption)
      VALUES (?, ?, ?, ?, ?)
    `

    db.query(
      insertSql,
      [meterId, reading_date, previous, current, consumption],
      (err, result) => {
        if (err) return res.status(500).json(err)

        res.json({
          message: "Meter reading added successfully",
          reading_id: result.insertId
        })
      }
    )
  })
})

export default router
