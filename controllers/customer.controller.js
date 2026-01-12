import db from "../db.js";



export const getCustomers = (req, res) => {
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
}

export const addCustomer = (req, res) => {
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
}
export const updateCustomer = (req, res) => {
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
}



export const deleteCustomer = (req, res) => {
  const { id } = req.params;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("GET CONNECTION ERROR:", err);
      return res.status(500).json({ message: "Failed to start delete transaction" });
    }

    connection.beginTransaction((transErr) => {
      if (transErr) {
        connection.release();
        console.error("BEGIN TRANSACTION ERROR:", transErr);
        return res.status(500).json({ message: "Failed to start delete transaction" });
      }

      // Step 1: Get all meters for this customer
      const getMetersSql = "SELECT meter_id FROM Meter WHERE customer_id = ?";
      
      connection.query(getMetersSql, [id], (err, meters) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("GET METERS ERROR:", err);
            res.status(500).json({ message: "Failed to delete customer" });
          });
        }

        const meterIds = meters.map(m => m.meter_id);

        // Step 2: Delete all meter readings for these meters
        if (meterIds.length > 0) {
          const deleteMeterReadingsSql = "DELETE FROM MeterReading WHERE meter_id IN (?)";
          connection.query(deleteMeterReadingsSql, [meterIds], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("DELETE METER READINGS ERROR:", err);
                res.status(500).json({ message: "Failed to delete customer" });
              });
            }

            // Step 3: Delete all bills for these meters
            const deleteBillsSql = "DELETE FROM Bill WHERE meter_id IN (?)";
            connection.query(deleteBillsSql, [meterIds], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("DELETE BILLS ERROR:", err);
                  res.status(500).json({ message: "Failed to delete customer" });
                });
              }

              // Step 4: Delete all meters
              const deleteMetersSql = "DELETE FROM Meter WHERE customer_id = ?";
              connection.query(deleteMetersSql, [id], (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("DELETE METERS ERROR:", err);
                    res.status(500).json({ message: "Failed to delete customer" });
                  });
                }

                // Step 5: Delete customer
                const deleteCustomerSql = "DELETE FROM Customer WHERE customer_id = ?";
                connection.query(deleteCustomerSql, [id], (err, result) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("DELETE CUSTOMER ERROR:", err);
                      res.status(500).json({ message: "Failed to delete customer" });
                    });
                  }

                  if (result.affectedRows === 0) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(404).json({ message: "Customer not found" });
                    });
                  }

                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("COMMIT ERROR:", commitErr);
                        res.status(500).json({ message: "Failed to finalize delete" });
                      });
                    }

                    connection.release();
                    res.status(200).json({
                      message: "Customer and all related records deleted successfully",
                    });
                  });
                });
              });
            });
          });
        } else {
          // No meters, just delete customer
          const deleteCustomerSql = "DELETE FROM Customer WHERE customer_id = ?";
          connection.query(deleteCustomerSql, [id], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("DELETE CUSTOMER ERROR:", err);
                res.status(500).json({ message: "Failed to delete customer" });
              });
            }

            if (result.affectedRows === 0) {
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({ message: "Customer not found" });
              });
            }

            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("COMMIT ERROR:", commitErr);
                  res.status(500).json({ message: "Failed to finalize delete" });
                });
              }

              connection.release();
              res.status(200).json({
                message: "Customer deleted successfully",
              });
            });
          });
        }
      });
    });
  });
}