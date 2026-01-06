import db from "../db.js";

/* GET all customers */
export const getCustomers = (req, res, next) => {
  db.query("SELECT * FROM Customer", (err, results) => {
    if (err) return next(err);
    res.status(200).json(results);
  });
};

/* DELETE customer safely */
export const deleteCustomer = (req, res, next) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM Customer WHERE customer_id = ?",
    [id],
    (err, result) => {
      if (err) return next(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      res.status(200).json({
        message: "Customer deleted successfully",
      });
    }
  );
};
