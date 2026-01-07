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
      m.meter_number,
      c.name AS customer_name
    FROM MeterReading mr
    JOIN Meter m ON mr.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    ORDER BY mr.reading_date DESC
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

/* =========================
   ADD new meter reading
========================= */
router.post("/", (req, res) => {
  const {
    meter_id,
    meterId,
    meter,
    reading_date,
    readingDate,
    date,
    previous_reading,
    previousReading,
    current_reading,
    currentReading,
    reading
  } = req.body

  const resolvedMeterId = meter_id ?? meterId ?? (typeof meter === "object" ? meter?.id ?? meter?.value : meter)
  const resolvedReadingDate = reading_date ?? readingDate ?? date
  const resolvedCurrentReading = current_reading ?? currentReading ?? reading
  const resolvedPreviousReading = previous_reading ?? previousReading ?? 0

  if (
    !resolvedMeterId ||
    !resolvedReadingDate ||
    resolvedCurrentReading === undefined ||
    resolvedCurrentReading === null
  ) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  const meterIdNumber = Number(resolvedMeterId)
  const prevReadingNumber = Number(resolvedPreviousReading) || 0
  const currentReadingNumber = Number(resolvedCurrentReading)

  if (Number.isNaN(meterIdNumber) || Number.isNaN(currentReadingNumber)) {
    return res.status(400).json({ message: "Invalid meter or reading value" })
  }

  const consumption = currentReadingNumber - prevReadingNumber

  const sql = `
    INSERT INTO MeterReading 
    (meter_id, reading_date, previous_reading, current_reading, consumption)
    VALUES (?, ?, ?, ?, ?)
  `

  db.query(
    sql,
    [meterIdNumber, resolvedReadingDate, prevReadingNumber, currentReadingNumber, consumption],
    (err, result) => {
      if (err) return res.status(500).json(err)

      res.json({
        message: "Meter reading added successfully",
        reading_id: result.insertId
      })
    }
  )
})

export default router
