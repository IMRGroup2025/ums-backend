import db from "../db.js";

const normalizeValue = (value, allowed, fallback) => {
  if (!value) return fallback;
  const match = allowed.find(
    (option) => option.toLowerCase() === String(value).toLowerCase()
  );
  return match || fallback;
};


export const getComplaints = (_req, res) => {
  const sql = `
    SELECT 
      c.complaint_id,
      cu.name AS customer_name,
      c.subject,
      c.priority,
      c.status,
      c.last_updated
    FROM Complaints c
    JOIN Customer cu ON c.customer_id = cu.customer_id
    ORDER BY c.last_updated DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET COMPLAINTS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch complaints" });
    }

    res.status(200).json(results);
  });
};


export const addComplaint = (req, res) => {
  const { customer_name, subject, description, priority } = req.body;

  if (!customer_name || !subject) {
    return res.status(400).json({
      message: "Customer name and subject are required",
    });
  }

  const allowedPriorities = ["Low", "Medium", "High"];
  const finalPriority = normalizeValue(priority, allowedPriorities, "Medium");


  const findCustomerSql =
    "SELECT customer_id FROM Customer WHERE name = ? LIMIT 1";

  db.query(findCustomerSql, [customer_name], (err, rows) => {
    if (err) {
      console.error("FIND CUSTOMER ERROR:", err);
      return res.status(500).json({ message: "Failed to find customer" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer_id = rows[0].customer_id;

    const insertSql = `
      INSERT INTO Complaints (customer_id, subject, description, priority, status)
      VALUES (?, ?, ?, ?, 'Open')
    `;

    db.query(
      insertSql,
      [customer_id, subject, description || "", finalPriority],
      (err, result) => {
        if (err) {
          console.error("ADD COMPLAINT ERROR:", err);
          return res
            .status(500)
            .json({ message: "Failed to add complaint" });
        }

        res.status(201).json({
          message: "Complaint added successfully",
          complaint_id: result.insertId,
        });
      }
    );
  });
};


export const updateComplaint = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["Open", "In Progress", "Resolved", "Closed"];
  const finalStatus = normalizeValue(status, allowedStatuses, "Open");

  const sql = `
    UPDATE Complaints
    SET status = ?, last_updated = CURRENT_TIMESTAMP
    WHERE complaint_id = ?
  `;

  db.query(sql, [finalStatus, id], (err, result) => {
    if (err) {
      console.error("UPDATE COMPLAINT ERROR:", err);
      return res.status(500).json({ message: "Failed to update complaint" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.status(200).json({ message: "Complaint updated successfully" });
  });
};


export const deleteComplaint = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM Complaints WHERE complaint_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DELETE COMPLAINT ERROR:", err);
      return res.status(500).json({ message: "Failed to delete complaint" });
    }

    res.status(200).json({ message: "Complaint deleted successfully" });
  });
};
