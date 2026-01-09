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
   ADD METER (ONE PER CUSTOMER)
========================= */
export const addMeter = (req, res) => {
  const { meter_number, installation_date, status, customer_id, utility_id } =
    req.body;

  if (!customer_id || !utility_id) {
    return res.status(400).json({
      message: "Customer and Utility are required",
    });
  }

  // 🔒 Enforce ONE meter per customer
  const checkSql = `SELECT meter_id FROM Meter WHERE customer_id = ?`;

  db.query(checkSql, [customer_id], (err, rows) => {
    if (err) {
      console.error("CHECK METER ERROR:", err);
      return res.status(500).json({ message: "Validation failed" });
    }

    if (rows.length > 0) {
      return res.status(409).json({
        message: "This customer already has a meter",
      });
    }

    const insertSql = `
      INSERT INTO Meter
      (meter_number, installation_date, status, customer_id, utility_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [
        meter_number || null,
        installation_date || null,
        status || "Active",
        customer_id,
        utility_id,
      ],
      (err, result) => {
        if (err) {
          console.error("ADD METER ERROR:", err);
          return res.status(500).json({ message: "Failed to add meter" });
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
   UPDATE METER STATUS
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
