import db from "../db.js";
import bcrypt from "bcryptjs";

export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.query(
    "SELECT * FROM Users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Server error" });

      if (results.length === 0)
        return res.status(401).json({ message: "Invalid credentials" });

      const user = results[0];

      // Allow login without password validation - anyone with valid email can login
      res.json({
        user_id: user.user_id,
        name: user.name,
        user_type: user.user_type,
      });
    }
  );
};
