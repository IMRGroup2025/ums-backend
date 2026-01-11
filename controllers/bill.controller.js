import db from "../db.js";

/* =========================
   GET ALL BILLS
========================= */
export const getBills = (req, res) => {
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
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET BILLS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch bills" });
    }
    res.json(results);
  });
};

/* =========================
   MARK BILL AS PAID
========================= */
export const markBillPaid = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Bill ID is required" });
  }

  // Get bill details (amount + status)
  const getBillSql = "SELECT amount, status FROM Bill WHERE bill_id = ?";

  db.query(getBillSql, [id], (err, billRows) => {
    if (err) {
      console.error("GET BILL ERROR:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch bill details" });
    }

    if (!billRows || billRows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const { amount, status } = billRows[0];

    if (status === "PAID") {
      return res.status(409).json({ message: "Bill already marked as PAID" });
    }

    const insertPaymentSql = `
      INSERT INTO Payment (bill_id, amount_paid, payment_method)
      VALUES (?, ?, ?)
    `;

    // Default payment method to CASH since UI no longer collects it
    db.query(
      insertPaymentSql,
      [id, amount, "CASH"],
      (err, paymentResult) => {
        if (err) {
          console.error("INSERT PAYMENT ERROR:", err);
          return res
            .status(500)
            .json({ message: "Failed to record payment" });
        }

        const updateBillSql = `
          UPDATE Bill
          SET status = ?
          WHERE bill_id = ?
        `;

        db.query(updateBillSql, ["PAID", id], (err, result) => {
          if (err) {
            console.error("UPDATE BILL ERROR:", err);
            return res
              .status(500)
              .json({ message: "Failed to mark bill as paid" });
          }

          res.status(200).json({
            message: "Bill marked as paid successfully",
            bill_id: id,
            payment_id: paymentResult.insertId,
            amount_paid: amount,
            payment_method: "CASH",
          });
        });
      }
    );
  });
};
