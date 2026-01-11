import db from "../db.js";

const BILL_DETAIL_SELECT = `
  SELECT
    b.bill_id,
    b.meter_id,
    c.customer_id,
    c.name AS customer,
    u.utility_name AS utility,
    b.billing_month,
    b.consumption,
    b.amount,
    b.status,
    b.created_at
  FROM Bill b
  JOIN Meter m ON b.meter_id = m.meter_id
  JOIN Customer c ON m.customer_id = c.customer_id
  JOIN Utility u ON m.utility_id = u.utility_id
  WHERE b.bill_id = ?
`;

export const getMeterReadings = (req, res) => {
  const sql = `
    SELECT
      mr.*, 
      m.meter_number,
      UPPER(u.utility_name) AS utility_name
    FROM MeterReading mr
    JOIN Meter m ON mr.meter_id = m.meter_id
    JOIN Utility u ON m.utility_id = u.utility_id
    ORDER BY mr.reading_date DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

export const getMeterReadingsGrouped = (req, res) => {
  const sql = `
    SELECT
      mr.reading_id,
      mr.meter_id,
      mr.reading_date,
      mr.previous_reading,
      mr.current_reading,
      mr.consumption,
      m.meter_number,
      UPPER(u.utility_name) AS utility_name,
      c.customer_id,
      c.name AS customer_name
    FROM MeterReading mr
    JOIN Meter m ON mr.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    ORDER BY u.utility_name, mr.reading_date DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("GET GROUPED READINGS ERROR:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch grouped meter readings" });
    }

    const grouped = {
      ELECTRICITY: [],
      WATER: [],
      GAS: [],
    };

    rows.forEach(reading => {
      const key = reading.utility_name || "OTHER";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(reading);
    });

    res.json(grouped);
  });
};

export const createMeterReading = (req, res) => {
  const { meter_id, current_reading, reading_date } = req.body;

  if (!meter_id || current_reading == null || !reading_date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("GET CONNECTION ERROR:", connErr);
      return res.status(500).json({ message: "Database connection failed" });
    }

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        console.error("BEGIN TRANSACTION ERROR:", txErr);
        return res.status(500).json({ message: "Failed to start transaction" });
      }

      const prevSql = `
        SELECT current_reading
        FROM MeterReading
        WHERE meter_id = ?
        ORDER BY reading_date DESC
        LIMIT 1
      `;

      connection.query(prevSql, [meter_id], (err, rows) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("FETCH PREVIOUS ERROR:", err);
            res.status(500).json({ message: "Failed to fetch previous reading" });
          });
        }

        const previous = rows.length ? Number(rows[0].current_reading) : 0;
        const consumption = Number(current_reading) - previous;

        if (consumption < 0) {
          connection.rollback(() => {
            connection.release();
          });
          return res.status(400).json({ message: "Current reading cannot be less than previous" });
        }

        const insertReading = `
          INSERT INTO MeterReading
          (meter_id, current_reading, previous_reading, consumption, reading_date)
          VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(
          insertReading,
          [meter_id, current_reading, previous, consumption, reading_date],
          (err, readingResult) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("INSERT READING ERROR:", err);
                res.status(500).json({ message: "Failed to save reading" });
              });
            }

            const readingId = readingResult.insertId;

            const rateSql = `
              SELECT tp.rate
              FROM Meter m
              LEFT JOIN Tariff_Plan tp ON m.utility_id = tp.utility
              WHERE m.meter_id = ?
              LIMIT 1
            `;

            connection.query(rateSql, [meter_id], (err, rateRows) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("RATE FETCH ERROR:", err);
                  res.status(500).json({ message: "Failed to fetch tariff rate" });
                });
              }

              // Use fetched rate or default to 10 if no tariff plan exists
              const rate = Number(rateRows[0]?.rate || 10);
              const amount = Number((consumption * rate).toFixed(2));
              const dateObj = new Date(reading_date);

              if (Number.isNaN(dateObj.getTime())) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(400).json({ message: "Invalid reading date" });
                });
              }

              const billingMonth = `${dateObj.getUTCFullYear()}-${String(
                dateObj.getUTCMonth() + 1
              ).padStart(2, "0")}`;

              const insertBillSql = `
                INSERT INTO Bill (meter_id, billing_month, consumption, amount, status)
                VALUES (?, ?, ?, ?, 'UNPAID')
              `;

              connection.query(
                insertBillSql,
                [meter_id, billingMonth, consumption, amount],
                (err, billResult) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("BILL CREATE ERROR:", err);
                      res.status(500).json({ message: "Failed to create bill" });
                    });
                  }

                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("COMMIT ERROR:", commitErr);
                        res.status(500).json({ message: "Failed to finalize transaction" });
                      });
                    }

                    connection.release();
                    res.status(201).json({
                      message: "Reading & bill created successfully",
                      reading: {
                        reading_id: readingId,
                        meter_id,
                        current_reading: Number(current_reading),
                        previous_reading: previous,
                        consumption,
                        reading_date,
                      },
                      bill: {
                        bill_id: billResult.insertId,
                        meter_id,
                        billing_month: billingMonth,
                        consumption,
                        amount,
                        status: 'UNPAID'
                      }
                    });
                  });
                }
              );
            });
          }
        );
      });
    });
  });
};

export const deleteMeterReading = (req, res) => {
  const { id } = req.params;

  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("DELETE READING CONNECTION ERROR:", connErr);
      return res.status(500).json({ message: "Database connection failed" });
    }

    const selectSql = `
      SELECT meter_id, reading_date
      FROM MeterReading
      WHERE reading_id = ?
    `;

    connection.query(selectSql, [id], (selectErr, rows) => {
      if (selectErr) {
        connection.release();
        console.error("FETCH READING ERROR:", selectErr);
        return res.status(500).json({ message: "Failed to fetch meter reading" });
      }

      if (!rows.length) {
        connection.release();
        return res.status(404).json({ message: "Meter reading not found" });
      }

      const reading = rows[0];
      const readingDate = new Date(reading.reading_date);
      const billingMonth = Number.isNaN(readingDate.getTime())
        ? null
        : `${readingDate.getUTCFullYear()}-${String(readingDate.getUTCMonth() + 1).padStart(2, "0")}`;

      connection.beginTransaction(txErr => {
        if (txErr) {
          connection.release();
          console.error("DELETE READING TX ERROR:", txErr);
          return res.status(500).json({ message: "Could not start delete transaction" });
        }

        const deleteReadingSql = `
          DELETE FROM MeterReading
          WHERE reading_id = ?
        `;

        connection.query(deleteReadingSql, [id], (delErr, deleteResult) => {
          if (delErr) {
            return connection.rollback(() => {
              connection.release();
              console.error("DELETE READING ERROR:", delErr);
              res.status(500).json({ message: "Failed to delete meter reading" });
            });
          }

          if (!deleteResult.affectedRows) {
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({ message: "Meter reading not found" });
            });
          }

          const deleteBillSql = billingMonth
            ? `
                DELETE FROM Bill
                WHERE meter_id = ?
                  AND billing_month = ?
                  AND status = 'UNPAID'
              `
            : null;

          const finalize = billDeleted => {
            connection.commit(commitErr => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("DELETE READING COMMIT ERROR:", commitErr);
                  res.status(500).json({ message: "Failed to finalize delete" });
                });
              }

              connection.release();
              res.json({
                message: "Meter reading deleted",
                billDeleted,
              });
            });
          };

          if (!deleteBillSql) {
            return finalize(0);
          }

          connection.query(
            deleteBillSql,
            [reading.meter_id, billingMonth],
            (billErr, billResult) => {
              if (billErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("DELETE BILL ERROR:", billErr);
                  res.status(500).json({ message: "Meter reading removed but bill cleanup failed" });
                });
              }

              finalize(billResult.affectedRows || 0);
            }
          );
        });
      });
    });
  });
};
