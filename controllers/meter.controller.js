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

export const getMetersGrouped = (req, res) => {
  const sql = `
    SELECT
      m.meter_id,
      m.meter_number,
      m.installation_date,
      m.status,
      c.customer_id,
      c.name AS customer_name,
      u.utility_id,
      UPPER(u.utility_name) AS utility_name
    FROM Meter m
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    ORDER BY u.utility_name, m.meter_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET GROUPED METERS ERROR:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch grouped meter data" });
    }

    const grouped = results.reduce((acc, meter) => {
      if (!acc[meter.utility_name]) {
        acc[meter.utility_name] = [];
      }
      acc[meter.utility_name].push(meter);
      return acc;
    }, {});

    res.status(200).json(grouped);
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

  const existsSql = `
    SELECT meter_id
    FROM Meter
    WHERE customer_id = ? AND utility_id = ?
    LIMIT 1
  `;

  db.query(existsSql, [customer_id, utility_id], (existErr, rows) => {
    if (existErr) {
      console.error("CHECK METER EXISTS ERROR:", existErr);
      return res.status(500).json({ message: "Failed to validate meter uniqueness" });
    }

    if (rows.length) {
      return res.status(409).json({
        message: "Customer already has a meter for this utility",
      });
    }

    const insertSql = `
      INSERT INTO Meter
      (meter_number, installation_date, status, customer_id, utility_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    // Normalize date to YYYY-MM-DD for MySQL
    let normalizedDate = null;
    if (installation_date) {
      const d = new Date(installation_date);
      if (!Number.isNaN(d.getTime())) {
        normalizedDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      }
    }

    db.query(
      insertSql,
      [
        meter_number,
        normalizedDate,
        status || "Active",
        customer_id,
        utility_id,
      ],
      (err, result) => {
        if (err) {
          console.error("ADD METER ERROR:", err);
          if (err.code === "ER_DUP_ENTRY") {
            const msg = /uq_customer_utility/i.test(err.message)
              ? "Customer already has a meter for this utility"
              : "Meter number already exists";
            return res.status(409).json({ message: msg });
          }
          if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ message: "Invalid customer or utility reference" });
          }
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
  });
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

  db.getConnection((err, connection) => {
    if (err) {
      console.error("GET CONNECTION ERROR:", err);
      return res.status(500).json({ message: "Failed to start delete transaction" });
    }

    connection.beginTransaction((transErr) => {
      if (transErr) {
        connection.release();
        console.error("BEGIN TRANSACTION ERROR:", transErr);
        return res.status(500).json({ message: "Failed to start delete transaction" });
      }

      // Step 1: Delete all meter readings for this meter
      const deleteMeterReadingsSql = "DELETE FROM MeterReading WHERE meter_id = ?";
      connection.query(deleteMeterReadingsSql, [id], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("DELETE METER READINGS ERROR:", err);
            res.status(500).json({ message: "Failed to delete meter" });
          });
        }

        // Step 2: Delete all bills for this meter
        const deleteBillsSql = "DELETE FROM Bill WHERE meter_id = ?";
        connection.query(deleteBillsSql, [id], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("DELETE BILLS ERROR:", err);
              res.status(500).json({ message: "Failed to delete meter" });
            });
          }

          // Step 3: Delete the meter
          const deleteMeterSql = "DELETE FROM Meter WHERE meter_id = ?";
          connection.query(deleteMeterSql, [id], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("DELETE METER ERROR:", err);
                res.status(500).json({ message: "Failed to delete meter" });
              });
            }

            if (result.affectedRows === 0) {
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({ message: "Meter not found" });
              });
            }

            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("COMMIT ERROR:", commitErr);
                  res.status(500).json({ message: "Failed to finalize delete" });
                });
              }

              connection.release();
              res.status(200).json({ message: "Meter and all related records deleted successfully" });
            });
          });
        });
      });
    });
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
