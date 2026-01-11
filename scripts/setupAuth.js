import bcrypt from "bcryptjs";
import db from "../db.js";

const testAndFixAuth = async () => {
  console.log("🔧 Testing and fixing authentication...\n");

  // Step 1: Check if Users table exists and has records
  console.log("1️⃣ Checking Users table...");
  db.query("SELECT COUNT(*) as count FROM Users", async (err, rows) => {
    if (err) {
      console.error("❌ Cannot access Users table:", err.message);
      process.exit(1);
    }

    const userCount = rows[0]?.count || 0;
    console.log(`   Found ${userCount} user(s)\n`);

    // Step 2: Check password column length
    console.log("2️⃣ Checking password column...");
    db.query(
      "SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='password'",
      async (err, cols) => {
        if (err) {
          console.error("❌ Cannot check column:", err.message);
          process.exit(1);
        }

        const maxLen = cols[0]?.CHARACTER_MAXIMUM_LENGTH;
        console.log(`   Password column max length: ${maxLen}\n`);

        // Ensure password column is long enough for bcrypt (60+ chars)
        if (maxLen < 100) {
          console.log("3️⃣ Expanding password column to VARCHAR(100)...");
          db.query("ALTER TABLE Users MODIFY password VARCHAR(100) NOT NULL", (err) => {
            if (err) {
              console.warn("⚠️  Could not expand column (may already be large):", err.message);
            } else {
              console.log("   ✅ Password column expanded\n");
            }
            seedOrUpdateAdmin();
          });
        } else {
          console.log("   ✅ Password column is large enough\n");
          seedOrUpdateAdmin();
        }
      }
    );
  });

  const seedOrUpdateAdmin = async () => {
    console.log("4️⃣ Setting up admin@ums.com with password Admin@123...");
    try {
      const plain = "Admin@123";
      const hashed = await bcrypt.hash(plain, 10);

      // Try updating first
      db.query(
        "UPDATE Users SET password=? WHERE LOWER(email)=LOWER('admin@ums.com')",
        [hashed],
        (err, result) => {
          if (err) {
            console.error("❌ Update failed:", err.message);
            process.exit(1);
          }

          if ((result.affectedRows || 0) > 0) {
            console.log(`   ✅ Updated ${result.affectedRows} row(s)\n`);
            finish();
          } else {
            // No rows updated, try inserting
            console.log("   No existing admin found, creating new one...");
            db.query(
              "INSERT INTO Users (name, email, password, user_type) VALUES (?, ?, ?, ?)",
              ["Super Admin", "admin@ums.com", hashed, "SUPER ADMIN"],
              (err, result) => {
                if (err) {
                  console.error("❌ Insert failed:", err.message);
                  process.exit(1);
                }
                console.log(`   ✅ Created new admin user\n`);
                finish();
              }
            );
          }
        }
      );
    } catch (e) {
      console.error("❌ Hash error:", e.message);
      process.exit(1);
    }
  };

  const finish = () => {
    console.log("✨ Authentication setup complete!");
    console.log("📝 Login credentials:");
    console.log("   Email: admin@ums.com");
    console.log("   Password: Admin@123\n");
    process.exit(0);
  };
};

testAndFixAuth();
