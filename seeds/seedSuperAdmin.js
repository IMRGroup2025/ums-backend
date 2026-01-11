import bcrypt from "bcryptjs";
import db from "../db.js";

const run = async () => {
  const password = "Admin@123"; // THIS is the login password
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    `INSERT INTO Users (name, email, password, user_type)
     VALUES (?, ?, ?, ?)`,
    ["Super Admin", "admin@ums.com", hashedPassword, "SUPER ADMIN"],
    (err) => {
      if (err) console.error(err);
      else console.log("✅ Super Admin created successfully");
      process.exit();
    }
  );
};

run();
