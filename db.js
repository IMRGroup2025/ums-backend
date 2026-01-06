import mysql from "mysql2"

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senumi@2005",
  database: "ums_db"
})

db.connect(err => {
  if (err) {
    console.error("MySQL connection failed:", err)
  } else {
    console.log("MySQL Connected")
  }
})

export default db
