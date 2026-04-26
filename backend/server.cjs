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
const eventSubscribers = new Set();

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

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}

async function fetchUpcomingEvents() {
  return runQuery(
    `
      SELECT
        e_id,
        e_name,
        e_type,
        e_date,
        e_time,
        location,
        distance,
        max_capacity,
        CASE WHEN e_date >= CURDATE() THEN 1 ELSE 0 END AS is_upcoming
      FROM event
      WHERE e_date >= CURDATE()
      ORDER BY e_date ASC, e_time ASC
    `,
  );
}

function sendSseMessage(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function broadcastUpcomingEvents() {
  if (!eventSubscribers.size) {
    return;
  }

  try {
    const upcomingEvents = await fetchUpcomingEvents();

    eventSubscribers.forEach((subscriber) => {
      sendSseMessage(subscriber, "events_updated", upcomingEvents);
    });
  } catch (err) {
    console.error("Failed to broadcast upcoming events.", err);
  }
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

function insertRow(tableName, allowedFields, payload, res, onSuccess) {
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
    async (err, result) => {
      if (err) {
        sendDbError(res, err, `Failed to add ${tableName} row.`);
        return;
      }

      if (onSuccess) {
        try {
          await onSuccess(result);
        } catch (callbackError) {
          sendDbError(res, callbackError, `Failed to finish adding ${tableName} row.`);
          return;
        }
      }

      res.status(201).json({
        success: true,
        insertedId: result.insertId,
      });
    }
  );
}

function updateRow(tableName, allowedFields, primaryKey, recordId, payload, res, onSuccess) {
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
    async (err, result) => {
      if (err) {
        sendDbError(res, err, `Failed to update ${tableName} row.`);
        return;
      }

      if (!result.affectedRows) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      if (onSuccess) {
        try {
          await onSuccess(result);
        } catch (callbackError) {
          sendDbError(res, callbackError, `Failed to finish updating ${tableName} row.`);
          return;
        }
      }

      res.json({ success: true });
    }
  );
}

function deleteRow(tableName, primaryKey, recordId, res, onSuccess) {
  db.query(
    `DELETE FROM \`${tableName}\` WHERE \`${primaryKey}\` = ?`,
    [recordId],
    async (err, result) => {
      if (err) {
        sendDbError(res, err, `Failed to delete ${tableName} row.`);
        return;
      }

      if (!result.affectedRows) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      if (onSuccess) {
        try {
          await onSuccess(result);
        } catch (callbackError) {
          sendDbError(res, callbackError, `Failed to finish deleting ${tableName} row.`);
          return;
        }
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

app.post("/auth/member-login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const query = `
    SELECT m_id, m_name, email, phone, city, age, join_date, fitness_level, role
    FROM members
    WHERE email = ? AND password = ? AND role = 'member'
    LIMIT 1
  `;

  db.query(query, [email.trim(), password], (err, result) => {
    if (err) {
      sendDbError(res, err, "Failed to log in.");
      return;
    }

    if (!result.length) {
      res.status(401).json({ error: "Invalid member email or password." });
      return;
    }

    res.json(result[0]);
  });
});

app.post("/auth/member-signup", (req, res) => {
  const {
    m_name,
    email,
    phone,
    city,
    age,
    fitness_level,
    password,
  } = req.body ?? {};

  if (!m_name || !email || !phone || !city || !age || !fitness_level || !password) {
    res.status(400).json({ error: "All signup fields are required." });
    return;
  }

  const query = `
    INSERT INTO members (m_name, email, phone, city, age, join_date, fitness_level, role, password)
    VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'member', ?)
  `;

  db.query(
    query,
    [m_name.trim(), email.trim(), phone.trim(), city.trim(), Number(age), fitness_level, password],
    async (err, result) => {
      if (err) {
        sendDbError(res, err, "Failed to sign up.");
        return;
      }

      try {
        const rows = await runQuery(
          `
            SELECT m_id, m_name, email, phone, city, age, join_date, fitness_level, role
            FROM members
            WHERE m_id = ?
            LIMIT 1
          `,
          [result.insertId],
        );

        res.status(201).json(rows[0]);
      } catch (queryError) {
        sendDbError(res, queryError, "Failed to finish sign up.");
      }
    },
  );
});

app.get("/events/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  eventSubscribers.add(res);

  try {
    const upcomingEvents = await fetchUpcomingEvents();
    sendSseMessage(res, "events_updated", upcomingEvents);
  } catch (err) {
    sendSseMessage(res, "stream_error", { error: "Could not load live event updates." });
  }

  const keepAliveTimer = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(keepAliveTimer);
    eventSubscribers.delete(res);
    res.end();
  });
});

app.get("/events/upcoming", async (req, res) => {
  try {
    const events = await fetchUpcomingEvents();

    res.json(events);
  } catch (err) {
    sendDbError(res, err, "Failed to fetch upcoming events.");
  }
});

app.get("/members/:id/registrations", async (req, res) => {
  try {
    const result = await runQuery(
      `
        SELECT
          r.reg_id,
          r.reg_date,
          r.reg_status,
          e.e_id,
          e.e_name,
          e.e_type,
          e.e_date,
          e.e_time,
          e.location,
          e.distance
        FROM registration r
        JOIN event e ON e.e_id = r.e_id
        WHERE r.m_id = ?
        ORDER BY e.e_date ASC, e.e_time ASC
      `,
      [req.params.id],
    );

    res.json(result);
  } catch (err) {
    sendDbError(res, err, "Failed to fetch member registrations.");
  }
});

app.post("/members/:id/register", async (req, res) => {
  const memberId = Number(req.params.id);
  const { e_id } = req.body ?? {};

  if (!memberId || !e_id) {
    res.status(400).json({ error: "Member ID and event ID are required." });
    return;
  }

  try {
    const existingRows = await runQuery(
      `
        SELECT reg_id
        FROM registration
        WHERE m_id = ? AND e_id = ? AND reg_status = 'registered'
        LIMIT 1
      `,
      [memberId, Number(e_id)],
    );

    if (existingRows.length) {
      res.status(409).json({ error: "You are already registered for this event." });
      return;
    }

    const result = await runQuery(
      `
        INSERT INTO registration (m_id, e_id, reg_date, reg_status)
        VALUES (?, ?, CURDATE(), 'registered')
      `,
      [memberId, Number(e_id)],
    );

    res.status(201).json({ success: true, insertedId: result.insertId });
  } catch (err) {
    if (err?.code === "ER_SIGNAL_EXCEPTION") {
      res.status(400).json({ error: err.sqlMessage || "Event registration is not allowed." });
      return;
    }

    sendDbError(res, err, "Failed to register for this event.");
  }
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
  insertRow(config.tableName, config.allowedFields, req.body, res, broadcastUpcomingEvents);
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
  updateRow(config.tableName, config.allowedFields, config.primaryKey, req.params.id, req.body, res, broadcastUpcomingEvents);
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
  deleteRow(config.tableName, config.primaryKey, req.params.id, res, broadcastUpcomingEvents);
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
