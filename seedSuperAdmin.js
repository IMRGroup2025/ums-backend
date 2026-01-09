import bcrypt from "bcryptjs";
import db from "./db.js";

async function createSuperAdmin() {
  const password = "Admin@123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO Users (name, email, password, user_type)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    ["Super Admin", "admin@ums.com", hashedPassword, "ADMINISTRATIVE STAFF"],
    (err, result) => {
      if (err) {
        console.error("Error creating super admin:", err);
      } else {
        console.log("Super Admin created successfully");
        console.log("Email: admin@ums.com");
        console.log("Password: Admin@123");
      }
      process.exit(); // stop script
    }
  );
}

createSuperAdmin();
