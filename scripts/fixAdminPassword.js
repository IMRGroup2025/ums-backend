import bcrypt from "bcryptjs";
import db from "../db.js";

const run = async () => {
  try {
    const plain = "Admin@123";
    const hashed = await bcrypt.hash(plain, 10);
    db.query(
      "UPDATE Users SET password=? WHERE LOWER(email)=LOWER('admin@ums.com')",
      [hashed],
      (err, result) => {
        if (err) {
          console.error(" Failed to update password:", err.message);
          process.exit(1);
        }
        console.log(`Updated ${result.affectedRows || 0} row(s) for admin@ums.com`);
        process.exit(0);
      }
    );
  } catch (e) {
    console.error(" Hash error:", e.message);
    process.exit(1);
  }
};

run();
