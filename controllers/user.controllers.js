import db from "../db.js";

export const getUsers = (req, res) => {
  const sql = "SELECT * FROM Users";
    db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch users",
      });
    }
    res.status(200).json(results);
  }
    );

}

export const addUser = (req, res) => {
  const { name, user_type, phone, email, password } = req.body;
    if (!name || !user_type) {
    return res.status(400).json({
      message: "Name and user type are required",
    });
  } 
    const sql = `
    INSERT INTO Users (name, user_type, phone, email, password)
    VALUES (?, ?, ?, ?, ?)
  `;
    db.query(
    sql,
    [name, user_type, phone, email, password],
    (err, result) => {
        if (err) {
        console.error(err);
        return res.status(500).json({
            message: "Failed to add user",
        });
        }
        res.status(201).json({
        message: "User added successfully",
        user_id: result.insertId,
      });
    }

    );
}
export const updateUser = (req, res) => {
  const { id } = req.params;
  const { name, user_type, phone, email, password } = req.body;
    const sql = `
    UPDATE Users
    SET name=?, user_type=?, phone=?, email=?, password=?
    WHERE user_id=?
    `;
    db.query(
    sql,
    [name, user_type, phone, email, password, id],
    (err, result) => {
        if (err) {

        console.error(err);
        return res.status(500).json({
            message: "Failed to update user",
        });
        }
        res.status(200).json({
        message: "User updated successfully",
      });
    }
    );
}

export const deleteUser = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM Users WHERE user_id=?";
    db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
        return res.status(500).json({
        message: "Failed to delete user",
        });
    }
    res.status(200).json({
      message: "User deleted successfully",
    });
  }
    );
}



