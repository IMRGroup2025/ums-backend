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
  const { payment_method, paymentMethod, amount_paid } = req.body;

  console.log("Mark Bill Paid Request:", { id, body: req.body });

  if (!id) {
    return res.status(400).json({ message: "Bill ID is required" });
  }

  const method = payment_method || paymentMethod;
  const allowedMethods = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "CHEQUE"];

  console.log("Payment method received:", method);

  if (!method) {
    return res.status(400).json({ message: "Payment method is required" });
  }

  const normalizedMethod = String(method).toUpperCase();
  if (!allowedMethods.includes(normalizedMethod)) {
    return res.status(400).json({
      message: `Invalid payment method. Allowed: ${allowedMethods.join(", ")}`,
    });
  }

  // First, get the bill amount
  const getBillSql = "SELECT amount FROM Bill WHERE bill_id = ?";

  db.query(getBillSql, [id], (err, billResults) => {
    if (err) {
      console.error("GET BILL ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch bill details" });
    }

    if (!billResults || billResults.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const billAmount = billResults[0].amount;
    const paidAmount = amount_paid || billAmount;

    // Insert payment record
    const insertPaymentSql = `
      INSERT INTO Payment (bill_id, amount_paid, payment_method)
      VALUES (?, ?, ?)
    `;

    db.query(
      insertPaymentSql,
      [id, paidAmount, normalizedMethod],
      (err, paymentResult) => {
        if (err) {
          console.error("INSERT PAYMENT ERROR:", err);
          return res
            .status(500)
            .json({ message: "Failed to record payment", error: err.message });
        }

        // Update bill status to PAID
        const updateBillSql = `
          UPDATE Bill
          SET status = ?
          WHERE bill_id = ?
        `;

        db.query(updateBillSql, ["PAID", id], (err, updateResult) => {
          if (err) {
            console.error("UPDATE BILL ERROR:", err);
            return res
              .status(500)
              .json({ message: "Failed to mark bill as paid" });
          }

          res.status(200).json({
            message: "Bill marked as paid successfully",
            payment_id: paymentResult.insertId,
            bill_id: id,
            amount_paid: paidAmount,
            payment_method: normalizedMethod,
          });
        });
      }
    );
  });
};
