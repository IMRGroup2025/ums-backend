import mysql from "mysql2";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "YOUR_PASSWORD",
  database: "ums_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export default db;

