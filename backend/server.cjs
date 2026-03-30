const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // in case you want to handle POST requests later

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  port: 3307,
  user: "root",
  password: "roshan8747",
  database: "veloxx",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("MySQL Connected");
});

// Helper function for queries
function fetchTable(tableName, res) {
  db.query(`SELECT * FROM \`${tableName}\``, (err, result) => {
    if (err) {
      console.error(`Error fetching ${tableName}:`, err);
      res.status(500).json({ error: `Failed to fetch ${tableName}` });
      return;
    }
    res.json(result);
  });
}

// Routes
app.get("/members", (req, res) => fetchTable("members", res));
app.get("/events", (req, res) => fetchTable("event", res));
app.get("/registrations", (req, res) => fetchTable("registration", res));
app.get("/attendance", (req, res) => fetchTable("attendance", res));
app.get("/eventsummary", (req, res) => fetchTable("eventsummary", res));

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
