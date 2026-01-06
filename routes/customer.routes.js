import express from "express";
import db from "../db.js";

const router = express.Router();


router.get("/", (req, res) => {
  const sql = "SELECT * FROM Customer";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch customers",
      });
    }

    res.status(200).json(results);
  });
});


router.post("/", (req, res) => {
  const { name, customer_type, address, phone, email } = req.body;

  if (!name || !customer_type) {
    return res.status(400).json({
      message: "Name and customer type are required",
    });
  }

  const sql = `
    INSERT INTO Customer (name, customer_type, address, phone, email)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, customer_type, address, phone, email],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to add customer",
        });
      }

      res.status(201).json({
        message: "Customer added successfully",
        customer_id: result.insertId,
      });
    }
  );
});


router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, customer_type, address, phone, email } = req.body;

  const sql = `
    UPDATE Customer
    SET name=?, customer_type=?, address=?, phone=?, email=?
    WHERE customer_id=?
  `;

  db.query(
    sql,
    [name, customer_type, address, phone, email, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to update customer",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      res.status(200).json({
        message: "Customer updated successfully",
      });
    }
  );
});


router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM Customer WHERE customer_id=?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);

      // Foreign key constraint error
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          message:
            "Cannot delete customer because related records exist",
        });
      }

      return res.status(500).json({
        message: "Failed to delete customer",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  });
});

export default router;
