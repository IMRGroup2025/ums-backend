import express from "express"
import db from "../db.js"

const router = express.Router()
const pool = db.promise()

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

// AUTO-GENERATE BILLS BASED ON LATEST READINGS
router.post("/generate", async (req, res) => {
  try {
    const billingMonth = req.body?.billing_month || new Date().toISOString().slice(0, 7)
    const DEFAULT_RATE = 20 // fallback when utility has no rate configured

    const readingsSql = `
      SELECT 
        latest.meter_id,
        latest.current_reading,
        (
          SELECT mr_prev.current_reading
          FROM MeterReading mr_prev
          WHERE mr_prev.meter_id = latest.meter_id
            AND mr_prev.reading_id < latest.reading_id
          ORDER BY mr_prev.reading_id DESC
          LIMIT 1
        ) AS previous_reading,
        u.rate_per_unit
      FROM MeterReading latest
      JOIN Meter m ON latest.meter_id = m.meter_id
      JOIN Utility u ON m.utility_id = u.utility_id
      WHERE latest.reading_id IN (
        SELECT MAX(reading_id) FROM MeterReading GROUP BY meter_id
      )
    `

    const [readings] = await pool.query(readingsSql)

    if (!readings.length) {
      return res.status(404).json({
        message: "No meter readings available to generate bills"
      })
    }

    let created = 0
    let skipped = 0

    for (const reading of readings) {
      const previous = Number(reading.previous_reading ?? 0)
      const current = Number(reading.current_reading ?? 0)
      const consumption = Math.max(0, current - previous)
      const ratePerUnit = Number(reading.rate_per_unit ?? DEFAULT_RATE)
      const amount = consumption * ratePerUnit

      const [existing] = await pool.query(
        "SELECT bill_id FROM Bill WHERE meter_id = ? AND billing_month = ? LIMIT 1",
        [reading.meter_id, billingMonth]
      )

      if (existing.length) {
        skipped += 1
        continue
      }

      await pool.query(
        `INSERT INTO Bill (meter_id, billing_month, consumption, amount, status)
         VALUES (?, ?, ?, ?, 'UNPAID')`,
        [reading.meter_id, billingMonth, consumption, amount]
      )

      created += 1
    }

    res.json({
      message: `Bills generated for ${billingMonth}`,
      created,
      skipped
    })
  } catch (error) {
    console.error("Auto bill generation failed", error)
    res.status(500).json({ message: "Failed to auto-generate bills", error })
  }
})

export default router
