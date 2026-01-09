import db from "../db.js";

/* =========================
   GET ALL METER READINGS
========================= */
export const getMeterReadings = (req, res) => {
  const sql = `
    SELECT
      mr.reading_id,
      mr.reading_date,
      mr.previous_reading,
      mr.current_reading,
      mr.consumption,
      m.meter_id,
      m.meter_number,
      c.customer_id,
      c.name AS customer_name
    FROM MeterReading mr
    JOIN Meter m ON mr.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    ORDER BY mr.reading_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET METER READINGS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch meter readings" });
    }
    res.status(200).json(results);
  });
};

/* =========================
   ADD METER READING
   + AUTO GENERATE BILL
========================= */
export const addMeterReading = (req, res) => {
  const { meter_id, current_reading, reading_date } = req.body;

  if (!meter_id || !current_reading || !reading_date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  /* Get previous reading */
  const prevSql = `
    SELECT current_reading
    FROM MeterReading
    WHERE meter_id = ?
    ORDER BY reading_date DESC
    LIMIT 1
  `;

  db.query(prevSql, [meter_id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch previous reading" });
    }

    const previous = rows.length ? rows[0].current_reading : 0;
    const consumption = current_reading - previous;

    if (consumption < 0) {
      return res.status(400).json({
        message: "Current reading cannot be less than previous reading",
      });
    }

    /* Insert meter reading */
    const insertReadingSql = `
      INSERT INTO MeterReading
      (meter_id, reading_date, previous_reading, current_reading, consumption)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertReadingSql,
      [meter_id, reading_date, previous, current_reading, consumption],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Failed to add meter reading" });
        }

        /* AUTO GENERATE BILL */
        const billSql = `
          INSERT INTO Bill (meter_id, billing_month, consumption, amount, due_date, status)
          SELECT
            m.meter_id,
            DATE_FORMAT(?, '%Y-%m'),
            ?,
            (? * tp.rate),
            DATE_ADD(?, INTERVAL 30 DAY),
            'UNPAID'
          FROM Meter m
          JOIN Utility u ON m.utility_id = u.utility_id
          JOIN Tariff_Plan tp ON tp.utility = u.utility_name
          WHERE m.meter_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM Bill
            WHERE meter_id = m.meter_id
            AND billing_month = DATE_FORMAT(?, '%Y-%m')
          );
        `;

        db.query(
          billSql,
          [
            reading_date,
            consumption,
            consumption,
            reading_date,
            meter_id,
            reading_date,
          ],
          (err) => {
            if (err) {
              console.error("BILL GENERATION ERROR:", err);
            }

            res.status(201).json({
              message: "Meter reading added and bill generated",
            });
          }
        );
      }
    );
  });
};
