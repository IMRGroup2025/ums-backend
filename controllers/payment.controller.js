import db from "../db.js";

/* =========================
   RECORD PAYMENT + MARK BILL PAID
========================= */
export const recordPayment = (req, res) => {
  const { bill_id, amount, payment_method } = req.body;

  if (!bill_id || !amount || !payment_method) {
    return res.status(400).json({ message: "Missing payment data" });
  }

  // Normalize payment method to uppercase
  const allowedMethods = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "CHEQUE"];
  const normalizedMethod = String(payment_method).toUpperCase();

  if (!allowedMethods.includes(normalizedMethod)) {
    return res.status(400).json({
      message: `Invalid payment method. Allowed: ${allowedMethods.join(", ")}`,
    });
  }

  const insertPaymentSql = `
    INSERT INTO Payment (bill_id, amount_paid, payment_method)
    VALUES (?, ?, ?)
  `;

  const updateBillSql = `
    UPDATE Bill
    SET status = 'PAID'
    WHERE bill_id = ?
  `;

  // 1️⃣ Insert payment
  db.query(
    insertPaymentSql,
    [bill_id, amount, normalizedMethod],
    (err, paymentResult) => {
      if (err) {
        console.error("PAYMENT INSERT ERROR:", err);
        return res
          .status(500)
          .json({ message: "Failed to record payment", error: err.message });
      }

      // 2️⃣ Update bill status
      db.query(updateBillSql, [bill_id], (err2) => {
        if (err2) {
          console.error("BILL UPDATE ERROR:", err2);
          return res.status(500).json({ message: "Failed to update bill" });
        }

        res.status(200).json({
          message: "Payment recorded & bill marked as PAID",
          payment_id: paymentResult.insertId,
        });
      });
    }
  );
};
