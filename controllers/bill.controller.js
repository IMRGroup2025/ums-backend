import db from "../db.js";

const BILL_BASE_SELECT = `
  SELECT
    b.bill_id,
    b.meter_id,
    c.customer_id,
    c.name AS customer,
    u.utility_name AS utility,
    b.billing_month,
    b.consumption,
    b.amount,
    b.status
  FROM Bill b
  JOIN Meter m ON b.meter_id = m.meter_id
  JOIN Customer c ON m.customer_id = c.customer_id
  JOIN Utility u ON m.utility_id = u.utility_id
`;

export const getBills = (req, res) => {
  const sql = `${BILL_BASE_SELECT} ORDER BY b.bill_id DESC`;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("FETCH BILLS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch bills" });
    }
    res.json(rows);
  });
};

export const getBillsByMeter = (req, res) => {
  const { meterId } = req.params;
  const sql = `${BILL_BASE_SELECT} WHERE b.meter_id = ? ORDER BY b.billing_month DESC, b.bill_id DESC`;

  db.query(sql, [meterId], (err, rows) => {
    if (err) {
      console.error("FETCH BILLS BY METER ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch bills for meter" });
    }
    res.json(rows);
  });
};

export const markBillPaid = (req, res) => {
  const { id } = req.params;
  const allowedMethods = new Set([
    "CASH",
    "CARD",
    "BANK_TRANSFER",
    "ONLINE",
    "CHEQUE",
  ]);
  const requestedMethod = (req.body?.paymentMethod || "CASH")
    .toString()
    .trim()
    .toUpperCase();
  const paymentMethod = allowedMethods.has(requestedMethod)
    ? requestedMethod
    : null;

  if (!paymentMethod) {
    return res.status(400).json({
      message: "Invalid payment method",
      allowedMethods: Array.from(allowedMethods),
    });
  }

  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("PAYMENT CONNECTION ERROR:", connErr);
      return res.status(500).json({ message: "Database connection failed" });
    }

    connection.beginTransaction(txErr => {
      if (txErr) {
        connection.release();
        console.error("PAYMENT TX ERROR:", txErr);
        return res
          .status(500)
          .json({ message: "Could not start payment transaction" });
      }

      const getBillSql = `
        SELECT amount, status
        FROM Bill
        WHERE bill_id = ?
        FOR UPDATE
      `;

      connection.query(getBillSql, [id], (err, billRows) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("GET BILL ERROR:", err);
            res.status(500).json({ message: "Failed to fetch bill" });
          });
        }

        if (!billRows.length) {
          connection.rollback(() => connection.release());
          return res.status(404).json({ message: "Bill not found" });
        }

        const { amount, status } = billRows[0];

        if (status === "PAID") {
          connection.rollback(() => connection.release());
          return res.status(409).json({ message: "Bill already paid" });
        }

        if (Number(amount) <= 0) {
          connection.rollback(() => connection.release());
          return res.status(400).json({ message: "Cannot pay zero amount bill" });
        }

        const insertPaymentSql = `
          INSERT INTO Payment (bill_id, amount, method, payment_date)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;

        connection.query(insertPaymentSql, [id, amount, paymentMethod], err => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("PAYMENT INSERT ERROR:", err);
              res.status(500).json({ message: "Failed to record payment", error: err.message });
            });
          }

          const updateBillSql = `
            UPDATE Bill
            SET status = 'PAID'
            WHERE bill_id = ?
          `;

          connection.query(updateBillSql, [id], err => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("BILL UPDATE ERROR:", err);
                res
                  .status(500)
                  .json({ message: "Payment saved but bill update failed" });
              });
            }

            connection.commit(commitErr => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("PAYMENT COMMIT ERROR:", commitErr);
                  res.status(500).json({ message: "Failed to finalize payment" });
                });
              }

              connection.release();
              res.json({ message: "Payment recorded successfully" });
            });
          });
        });
      });
    });
  });
};

export const getBillPrintable = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      b.bill_id,
      b.meter_id,
      b.billing_month,
      b.consumption,
      b.amount,
      b.status,
      c.customer_id,
      c.name AS customer_name,
      c.email,
      c.phone,
      c.address,
      u.utility_name,
      u.rate_per_unit,
      m.meter_number
    FROM Bill b
    JOIN Meter m ON b.meter_id = m.meter_id
    JOIN Customer c ON m.customer_id = c.customer_id
    JOIN Utility u ON m.utility_id = u.utility_id
    WHERE b.bill_id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("PRINT BILL ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch bill for printing" });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(rows[0]);
  });
};
