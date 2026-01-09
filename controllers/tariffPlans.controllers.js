import db from "../db.js";


export const getTariffPlans = (req, res) => {
  const sql = "SELECT * FROM Tariff_Plan";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET ERROR:", err);
      return res.status(500).json({
        message: "Failed to fetch tariff plans",
      });
    }

    res.status(200).json(results);
  });
};


export const addTariffPlan = (req, res) => {
  const { name, utility, rate, description } = req.body;

  if (!name || !utility) {
    return res.status(400).json({
      message: "Name and utility are required",
    });
  }

  const sql = `
    INSERT INTO Tariff_Plan (name, utility, rate, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, utility, rate, description], (err, result) => {
    if (err) {
      console.error("INSERT ERROR:", err);
      return res.status(500).json({
        message: "Failed to add tariff plan",
      });
    }

    res.status(201).json({
      message: "Tariff plan added successfully",
      tariff_plan_id: result.insertId,
    });
  });
};


export const updateTariffPlan = (req, res) => {
  const { id } = req.params;
  const { name, utility, rate, description } = req.body;

  console.log("UPDATE ID:", id);
  console.log("DATA:", req.body);

  const sql = `
    UPDATE Tariff_Plan
    SET name = ?, utility = ?, rate = ?, description = ?
    WHERE tariff_plan_id = ?
  `;

  db.query(
    sql,
    [name, utility, rate, description, id],
    (err, result) => {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({
          message: "Failed to update tariff plan",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Tariff plan not found",
        });
      }

      res.status(200).json({
        message: "Tariff plan updated successfully",
      });
    }
  );
};


export const deleteTariffPlan = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM Tariff_Plan WHERE tariff_plan_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DELETE ERROR:", err);
      return res.status(500).json({
        message: "Failed to delete tariff plan",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tariff plan not found",
      });
    }

    res.status(200).json({
      message: "Tariff plan deleted successfully",
    });
  });
};
