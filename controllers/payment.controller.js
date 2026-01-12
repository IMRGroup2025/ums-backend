import db from "../db.js";

/* =========================
   CREATE PAYMENT
========================= */
export const createPayment = (req, res) => {
  const { bill_id, amount, payment_method } = req.body;

  if (!bill_id || !amount || !payment_method) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  // 1️⃣ Check bill exists & status
  const billCheck = `
    SELECT status FROM Bill WHERE bill_id = ?
  `;

  db.query(billCheck, [bill_id], (err, rows) => {
    if (err) {
      console.error("BILL CHECK ERROR:", err);
      return res.status(500).json({ message: "Bill check failed" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (rows[0].status === "PAID") {
      return res.status(400).json({ message: "Bill already paid" });
    }

    // 2️⃣ Insert payment
    const paymentSql = `
      INSERT INTO Payment (bill_id, amount, payment_method, payment_date)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(
      paymentSql,
      [bill_id, amount, payment_method],
      (err) => {
        if (err) {
          console.error("PAYMENT INSERT ERROR:", err);
          return res.status(500).json({ message: "Payment insert failed" });
        }

        // 3️⃣ Update bill status
        const updateBill = `
          UPDATE Bill SET status = 'PAID' WHERE bill_id = ?
        `;

        db.query(updateBill, [bill_id], (err) => {
          if (err) {
            console.error("BILL UPDATE ERROR:", err);
            return res.status(500).json({ message: "Payment saved but bill update failed" });
          }

          res.status(201).json({ message: "Payment recorded successfully" });
        });
      }
    );
  });
};
