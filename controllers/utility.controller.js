import db from "../db.js";

export const getUtilities = (req, res) => {
  const sql = `
    SELECT utility_id, utility_name
    FROM Utility
    ORDER BY utility_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET UTILITIES ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch utilities" });
    }
    res.status(200).json(results);
  });
};
