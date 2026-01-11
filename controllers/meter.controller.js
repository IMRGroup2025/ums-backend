import db from "../db.js";

/* =========================
   GET ALL UTILITIES
========================= */
export const getUtilities = (req, res) => {
  const sql = "SELECT utility_id, utility_name FROM Utility ORDER BY utility_name";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET UTILITIES ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch utilities" });
    }
    res.status(200).json(results);
  });
};

/* =========================
   GET ALL METERS
========================= */
export const getMeters = (req, res) => {
  const sql = `
    SELECT
      m.meter_id,
      m.meter_number,
      m.installation_date,
      m.status,
      c.customer_id,
      c.name AS customer_name,
      u.utility_id,
      u.utility_name
    FROM Meter m
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    ORDER BY m.meter_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET METERS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch meters" });
    }
    res.status(200).json(results);
  });
};

/* =========================
   ADD METER
========================= */
export const addMeter = (req, res) => {
  const {
    meter_number,
    installation_date,
    status,
    customer_id,
    utility_id,
  } = req.body;

  console.log("ADD METER REQUEST:", req.body);

  if (!customer_id) {
    return res.status(400).json({
      message: "Customer is required",
    });
  }

  if (!meter_number) {
    return res.status(400).json({
      message: "Meter number is required",
    });
  }

  if (!utility_id) {
    return res.status(400).json({
      message: "Utility is required",
    });
  }

  const sql = `
    INSERT INTO Meter
    (meter_number, installation_date, status, customer_id, utility_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      meter_number,
      installation_date || null,
      status || "Active",
      customer_id,
      utility_id,
    ],
    (err, result) => {
      if (err) {
        console.error("ADD METER ERROR:", err);
        return res.status(500).json({ 
          message: "Failed to add meter",
          error: err.message 
        });
      }

      res.status(201).json({
        message: "Meter added successfully",
        meter_id: result.insertId,
      });
    }
  );
};

/* =========================
   UPDATE METER
========================= */
export const updateMeter = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE Meter
    SET status = ?
    WHERE meter_id = ?
  `;

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("UPDATE METER ERROR:", err);
      return res.status(500).json({ message: "Failed to update meter" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meter not found" });
    }

    res.status(200).json({ message: "Meter updated successfully" });
  });
};

/* =========================
   DELETE METER
========================= */
export const deleteMeter = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM Meter WHERE meter_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DELETE METER ERROR:", err);
      return res.status(500).json({ message: "Failed to delete meter" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meter not found" });
    }

    res.status(200).json({ message: "Meter deleted successfully" });
  });
};

/* =========================
   ADD METER READING
========================= */
export const addMeterReading = (req, res) => {
  const { meter_id, current_reading, reading_date } = req.body;

  // 1. Get previous reading
  const prevSql = `
    SELECT current_reading
    FROM MeterReading
    WHERE meter_id = ?
    ORDER BY reading_date DESC
    LIMIT 1
  `;

  db.query(prevSql, [meter_id], (err, rows) => {
    if (err) return res.status(500).json(err);

    const previous = rows.length ? rows[0].current_reading : 0;
    const consumption = current_reading - previous;

    if (consumption < 0) {
      return res.status(400).json({ message: "Invalid reading" });
    }

    // 2. Insert reading
    const insertReading = `
      INSERT INTO MeterReading
      (meter_id, reading_date, previous_reading, current_reading, consumption)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertReading,
      [meter_id, reading_date, previous, current_reading, consumption],
      (err) => {
        if (err) return res.status(500).json(err);

        // 3. Get tariff rate
        const tariffSql = `
          SELECT tp.rate
          FROM Meter m
          JOIN Tariff_Plan tp ON m.utility_id = tp.utility
          WHERE m.meter_id = ?
          LIMIT 1
        `;

        db.query(tariffSql, [meter_id], (err, rateRows) => {
          if (err) return res.status(500).json(err);

          const rate = Number(rateRows[0]?.rate || 10);
          const amount = consumption * rate;
          const month = reading_date.slice(0, 7);

          const billSql = `
            INSERT INTO Bill
            (meter_id, billing_month, consumption, amount, status)
            VALUES (?, ?, ?, ?, 'UNPAID')
          `;

          db.query(
            billSql,
            [meter_id, month, consumption, amount],
            (err) => {
              if (err) return res.status(500).json(err);

              res.json({ message: "Reading + Bill created" });
            }
          );
        });
      }
    );
  });
};
