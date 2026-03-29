import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function renderCell(row, column) {
  const value = row[column.key];

  if (column.render) {
    return column.render(value, row);
  }

  if (column.type === "pill") {
    return (
      <span
        className={`status-pill status-pill--${String(value).toLowerCase()}`}
      >
        {value}
      </span>
    );
  }

  return value;
}

export default function Dashboard({ onLogout, currentAdmin }) {
  const [activeTab, setActiveTab] = useState("members");

  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [eventSummary, setEventSummary] = useState([]);

  // 🔥 FETCH DATA FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:5000/members")
      .then((res) => res.json())
      .then((data) => setMembers(data));

    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => setEvents(data));

    fetch("http://localhost:5000/registrations")
      .then((res) => res.json())
      .then((data) => setRegistrations(data));

    fetch("http://localhost:5000/attendance")
      .then((res) => res.json())
      .then((data) => setAttendance(data));

    fetch("http://localhost:5000/eventsummary")
      .then((res) => res.json())
      .then((data) => setEventSummary(data));
  }, []);

  // 🔥 TABLE CONFIG (USES REAL DATA NOW)
  const tableConfig = {
    members: {
      title: "Members Table",
      subtitle: "Real data from MySQL members table",
      rows: members,
      columns: [
        { key: "m_id", label: "Member ID" },
        { key: "m_name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" },
        { key: "age", label: "Age" },
        { key: "fitness_level", label: "Fitness Level" },
        { key: "role", label: "Role", type: "pill" },
        { key: "join_date", label: "Joined" },
      ],
    },
    events: {
      title: "Event Table",
      subtitle: "Real event data",
      rows: events,
      columns: [
        { key: "e_id", label: "Event ID" },
        { key: "e_name", label: "Event Name" },
        { key: "e_type", label: "Type", type: "pill" },
        { key: "e_date", label: "Date" },
        { key: "e_time", label: "Time" },
        { key: "location", label: "Location" },
        {
          key: "distance",
          label: "Distance",
          render: (value) => `${value} km`,
        },
        { key: "max_capacity", label: "Capacity" },
      ],
    },
    registrations: {
      title: "Registration Table",
      subtitle: "Joined data",
      rows: registrations.map((r) => {
        const member = members.find((m) => m.m_id === r.m_id);
        const event = events.find((e) => e.e_id === r.e_id);
        return {
          ...r,
          member_name: member?.m_name || "Unknown",
          event_name: event?.e_name || "Unknown",
        };
      }),
      columns: [
        { key: "reg_id", label: "Registration ID" },
        { key: "member_name", label: "Member" },
        { key: "event_name", label: "Event" },
        { key: "reg_date", label: "Registered On" },
        { key: "reg_status", label: "Status", type: "pill" },
      ],
    },
    attendance: {
      title: "Attendance Table",
      subtitle: "Attendance data",
      rows: attendance.map((a) => {
        const reg = registrations.find((r) => r.reg_id === a.reg_id);
        const member = members.find((m) => m.m_id === reg?.m_id);
        const event = events.find((e) => e.e_id === reg?.e_id);
        return {
          ...a,
          member_name: member?.m_name || "Unknown",
          event_name: event?.e_name || "Unknown",
          attendance_status: a.attended ? "attended" : "missed",
        };
      }),
      columns: [
        { key: "reg_id", label: "Registration ID" },
        { key: "member_name", label: "Member" },
        { key: "event_name", label: "Event" },
        { key: "attended", label: "Raw Value" },
        { key: "attendance_status", label: "Status", type: "pill" },
      ],
    },
    eventsummary: {
      title: "Event Summary",
      subtitle: "From SQL view",
      rows: eventSummary,
      columns: [
        { key: "e_name", label: "Event Name" },
        { key: "e_date", label: "Date" },
        { key: "location", label: "Location" },
        { key: "total_registered", label: "Registered" },
        { key: "total_attended", label: "Attended" },
      ],
    },
  };

  const currentTable = tableConfig[activeTab];

  return (
    <div className="admin-shell">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        currentAdmin={currentAdmin}
      />

      <main className="admin-content">
        <section className="admin-overview">
          <article className="admin-stat">
            <p className="admin-stat__label">Members</p>
            <p className="admin-stat__value">{members.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Events</p>
            <p className="admin-stat__value">{events.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Registrations</p>
            <p className="admin-stat__value">{registrations.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Attendance Rows</p>
            <p className="admin-stat__value">{attendance.length}</p>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <h2 className="admin-panel__title">{currentTable.title}</h2>
              <p className="admin-panel__subtitle">{currentTable.subtitle}</p>
            </div>
            <div className="admin-panel__badge">
              {currentTable.rows.length} rows
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {currentTable.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTable.rows.map((row, index) => (
                  <tr
                    key={
                      row.id ??
                      row.reg_id ??
                      row.m_id ??
                      row.e_id ??
                      `${activeTab}-${index}`
                    }
                  >
                    {currentTable.columns.map((column) => (
                      <td key={column.key}>{renderCell(row, column)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
