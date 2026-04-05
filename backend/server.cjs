const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // in case you want to handle POST requests later

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "roshan8747";
const DB_NAME = process.env.DB_NAME || "veloxx";
const APP_PORT = Number(process.env.PORT || 5050);

const TABLE_CONFIG = {
  members: {
    tableName: "members",
    allowedFields: ["m_id", "m_name", "email", "phone", "city", "age", "join_date", "fitness_level", "role", "password"],
    primaryKey: "m_id",
  },
  events: {
    tableName: "event",
    allowedFields: ["e_id", "e_name", "e_type", "e_date", "e_time", "location", "distance", "max_capacity"],
    primaryKey: "e_id",
  },
  registrations: {
    tableName: "registration",
    allowedFields: ["reg_id", "m_id", "e_id", "reg_date", "reg_status"],
    primaryKey: "reg_id",
  },
  attendance: {
    tableName: "attendance",
    allowedFields: ["reg_id", "attended"],
    primaryKey: "reg_id",
  },
};

// MySQL connection
const db = mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("MySQL Connected");
});

function formatDbError(err, fallbackMessage) {
  switch (err?.code) {
    case "ER_DUP_ENTRY":
      return "That record already exists. Use a different ID or unique value.";
    case "ER_NO_REFERENCED_ROW_2":
      return "This record references another row that does not exist yet.";
    case "ER_ROW_IS_REFERENCED_2":
      return "This record cannot be deleted because other rows still depend on it.";
    case "ER_BAD_NULL_ERROR":
      return "A required database field is missing.";
    case "ER_TRUNCATED_WRONG_VALUE":
    case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
    case "ER_WRONG_VALUE":
      return "One of the values has the wrong format for this table.";
    case "ER_DATA_TOO_LONG":
      return "One of the values is too long for the database column.";
    case "ER_NO_DEFAULT_FOR_FIELD":
      return "A required database column does not have a value.";
    default:
      return fallbackMessage;
  }
}

function sendDbError(res, err, fallbackMessage) {
  console.error(fallbackMessage, err);
  res.status(500).json({ error: formatDbError(err, fallbackMessage) });
}

function fetchTable(tableName, res) {
  db.query(`SELECT * FROM \`${tableName}\``, (err, result) => {
    if (err) {
      sendDbError(res, err, `Failed to fetch ${tableName}.`);
      return;
    }
    res.json(result);
  });
}

function insertRow(tableName, allowedFields, payload, res) {
  const filteredEntries = Object.entries(payload ?? {}).filter(([, value]) => (
    value !== undefined && value !== null && value !== ""
  ));

  const invalidField = filteredEntries.find(([field]) => !allowedFields.includes(field));

  if (invalidField) {
    res.status(400).json({ error: `Unsupported field: ${invalidField[0]}` });
    return;
  }

  if (!filteredEntries.length) {
    res.status(400).json({ error: "At least one field is required." });
    return;
  }

  const columns = filteredEntries.map(([field]) => `\`${field}\``).join(", ");
  const placeholders = filteredEntries.map(() => "?").join(", ");
  const values = filteredEntries.map(([, value]) => value);

  db.query(
    `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
    values,
    (err, result) => {
      if (err) {
        sendDbError(res, err, `Failed to add ${tableName} row.`);
        return;
      }

      res.status(201).json({
        success: true,
        insertedId: result.insertId,
      });
    }
  );
}

function updateRow(tableName, allowedFields, primaryKey, recordId, payload, res) {
  const filteredEntries = Object.entries(payload ?? {}).filter(([field, value]) => (
    field !== primaryKey && value !== undefined && value !== null && value !== ""
  ));

  const invalidField = filteredEntries.find(([field]) => !allowedFields.includes(field));

  if (invalidField) {
    res.status(400).json({ error: `Unsupported field: ${invalidField[0]}` });
    return;
  }

  if (!filteredEntries.length) {
    res.status(400).json({ error: "At least one field is required to update." });
    return;
  }

  const assignments = filteredEntries.map(([field]) => `\`${field}\` = ?`).join(", ");
  const values = filteredEntries.map(([, value]) => value);

  db.query(
    `UPDATE \`${tableName}\` SET ${assignments} WHERE \`${primaryKey}\` = ?`,
    [...values, recordId],
    (err, result) => {
      if (err) {
        sendDbError(res, err, `Failed to update ${tableName} row.`);
        return;
      }

      if (!result.affectedRows) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      res.json({ success: true });
    }
  );
}

function deleteRow(tableName, primaryKey, recordId, res) {
  db.query(
    `DELETE FROM \`${tableName}\` WHERE \`${primaryKey}\` = ?`,
    [recordId],
    (err, result) => {
      if (err) {
        sendDbError(res, err, `Failed to delete ${tableName} row.`);
        return;
      }

      if (!result.affectedRows) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      res.json({ success: true });
    }
  );
}

app.post("/auth/admin-login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const query = `
    SELECT m_id, m_name, email, phone, city, age, join_date, fitness_level, role
    FROM members
    WHERE email = ? AND password = ? AND role = 'admin'
    LIMIT 1
  `;

  db.query(query, [email.trim(), password], (err, result) => {
    if (err) {
      sendDbError(res, err, "Failed to log in.");
      return;
    }

    if (!result.length) {
      res.status(401).json({ error: "Invalid admin email or password." });
      return;
    }

    res.json(result[0]);
  });
});

// Routes
app.get("/members", (req, res) => fetchTable("members", res));
app.get("/events", (req, res) => fetchTable("event", res));
app.get("/registrations", (req, res) => fetchTable("registration", res));
app.get("/attendance", (req, res) => fetchTable("attendance", res));
app.get("/eventsummary", (req, res) => fetchTable("eventsummary", res));

app.post("/members", (req, res) => {
  const config = TABLE_CONFIG.members;
  insertRow(config.tableName, config.allowedFields, req.body, res);
});

app.post("/events", (req, res) => {
  const config = TABLE_CONFIG.events;
  insertRow(config.tableName, config.allowedFields, req.body, res);
});

app.post("/registrations", (req, res) => {
  const config = TABLE_CONFIG.registrations;
  insertRow(config.tableName, config.allowedFields, req.body, res);
});

app.post("/attendance", (req, res) => {
  const config = TABLE_CONFIG.attendance;
  insertRow(config.tableName, config.allowedFields, req.body, res);
});

app.put("/members/:id", (req, res) => {
  const config = TABLE_CONFIG.members;
  updateRow(config.tableName, config.allowedFields, config.primaryKey, req.params.id, req.body, res);
});

app.put("/events/:id", (req, res) => {
  const config = TABLE_CONFIG.events;
  updateRow(config.tableName, config.allowedFields, config.primaryKey, req.params.id, req.body, res);
});

app.put("/registrations/:id", (req, res) => {
  const config = TABLE_CONFIG.registrations;
  updateRow(config.tableName, config.allowedFields, config.primaryKey, req.params.id, req.body, res);
});

app.put("/attendance/:id", (req, res) => {
  const config = TABLE_CONFIG.attendance;
  updateRow(config.tableName, config.allowedFields, config.primaryKey, req.params.id, req.body, res);
});

app.delete("/members/:id", (req, res) => {
  const config = TABLE_CONFIG.members;
  deleteRow(config.tableName, config.primaryKey, req.params.id, res);
});

app.delete("/events/:id", (req, res) => {
  const config = TABLE_CONFIG.events;
  deleteRow(config.tableName, config.primaryKey, req.params.id, res);
});

app.delete("/registrations/:id", (req, res) => {
  const config = TABLE_CONFIG.registrations;
  deleteRow(config.tableName, config.primaryKey, req.params.id, res);
});

app.delete("/attendance/:id", (req, res) => {
  const config = TABLE_CONFIG.attendance;
  deleteRow(config.tableName, config.primaryKey, req.params.id, res);
});

// Start server
app.listen(APP_PORT, () => {
  console.log(`Server running on port ${APP_PORT}`);
});
