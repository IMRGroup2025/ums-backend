import db from "../db.js";

/* =========================
   GET ALL METER READINGS
========================= */
export const getMeterReadings = (req, res) => {
  const sql = `
    SELECT 
      mr.reading_id,
      m.meter_number,
      mr.current_reading,
      mr.previous_reading,
      mr.consumption,
      mr.reading_date
    FROM MeterReading mr
    JOIN Meter m ON mr.meter_id = m.meter_id
    ORDER BY mr.reading_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET METER READINGS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch meter readings" });
    }
    res.json(results);
  });
};

/* =========================
   CREATE METER READING
   (AUTO GENERATES BILL)
========================= */
export const createMeterReading = (req, res) => {
  const { meter_id, current_reading, reading_date } = req.body;

  const getLast = `
    SELECT current_reading 
    FROM MeterReading 
    WHERE meter_id = ? 
    ORDER BY reading_date DESC 
    LIMIT 1
  `;

  db.query(getLast, [meter_id], (err, rows) => {
    const previous = rows.length ? rows[0].current_reading : 0;
    const consumption = current_reading - previous;

    const insertReading = `
      INSERT INTO MeterReading 
      (meter_id, current_reading, previous_reading, consumption, reading_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertReading,
      [meter_id, current_reading, previous, consumption, reading_date],
      (err, result) => {
        if (err) {
          console.error("INSERT READING ERROR:", err);
          return res.status(500).json({ message: "Failed to save reading" });
        }

        /* AUTO CREATE BILL */
        const billSql = `
          INSERT INTO Bill (meter_id, billing_month, consumption, amount, status)
          SELECT 
            m.meter_id,
            DATE_FORMAT(?, '%Y-%m'),
            ?,
            (? * t.rate),
            'UNPAID'
          FROM Meter m
          JOIN TariffPlan t ON m.utility_id = t.utility_id
          WHERE m.meter_id = ?
        `;

        db.query(
          billSql,
          [reading_date, consumption, consumption, meter_id],
          (err) => {
            if (err) {
              console.error("BILL CREATE ERROR:", err);
              return res.status(500).json({ message: "Reading saved but bill failed" });
            }

            res.status(201).json({ message: "Reading & bill created successfully" });
          }
        );
      }
    );
  });
};
