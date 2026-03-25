import { useState } from 'react'
import Navbar from '../components/Navbar'
import { attendance, eventSummary, events, members, registrations } from '../data/mockDatabase'
import './Dashboard.css'

const tableConfig = {
  members: {
    title: 'Members Table',
    subtitle: 'Browse the `members` table from your VeloxxClub database.',
    rows: members,
    columns: [
      { key: 'm_id', label: 'Member ID' },
      { key: 'm_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'city', label: 'City' },
      { key: 'age', label: 'Age' },
      { key: 'fitness_level', label: 'Fitness Level' },
      { key: 'role', label: 'Role', type: 'pill' },
      { key: 'join_date', label: 'Joined' },
    ],
  },
  events: {
    title: 'Event Table',
    subtitle: 'All rows from the `event` table, including schedule and capacity.',
    rows: events,
    columns: [
      { key: 'e_id', label: 'Event ID' },
      { key: 'e_name', label: 'Event Name' },
      { key: 'e_type', label: 'Type', type: 'pill' },
      { key: 'e_date', label: 'Date' },
      { key: 'e_time', label: 'Time' },
      { key: 'location', label: 'Location' },
      { key: 'distance', label: 'Distance', render: (value) => `${value} km` },
      { key: 'max_capacity', label: 'Capacity' },
    ],
  },
  registrations: {
    title: 'Registration Table',
    subtitle: 'Registrations joined with member names and event titles for easier review.',
    rows: registrations.map((registration) => {
      const member = members.find((item) => item.m_id === registration.m_id)
      const event = events.find((item) => item.e_id === registration.e_id)
      return {
        ...registration,
        member_name: member?.m_name ?? 'Unknown member',
        event_name: event?.e_name ?? 'Unknown event',
      }
    }),
    columns: [
      { key: 'reg_id', label: 'Registration ID' },
      { key: 'member_name', label: 'Member' },
      { key: 'event_name', label: 'Event' },
      { key: 'reg_date', label: 'Registered On' },
      { key: 'reg_status', label: 'Status', type: 'pill' },
    ],
  },
  attendance: {
    title: 'Attendance Table',
    subtitle: 'Attendance records mapped back to the related registration, member, and event.',
    rows: attendance.map((entry) => {
      const registration = registrations.find((item) => item.reg_id === entry.reg_id)
      const member = members.find((item) => item.m_id === registration?.m_id)
      const event = events.find((item) => item.e_id === registration?.e_id)
      return {
        ...entry,
        member_name: member?.m_name ?? 'Unknown member',
        event_name: event?.e_name ?? 'Unknown event',
        attendance_status: entry.attended ? 'attended' : 'missed',
      }
    }),
    columns: [
      { key: 'reg_id', label: 'Registration ID' },
      { key: 'member_name', label: 'Member' },
      { key: 'event_name', label: 'Event' },
      { key: 'attended', label: 'Raw Value' },
      { key: 'attendance_status', label: 'Status', type: 'pill' },
    ],
  },
  eventsummary: {
    title: 'Event Summary View',
    subtitle: 'Derived from your `eventsummary` SQL view so admins can quickly compare turnout.',
    rows: eventSummary,
    columns: [
      { key: 'e_name', label: 'Event Name' },
      { key: 'e_date', label: 'Date' },
      { key: 'location', label: 'Location' },
      { key: 'total_registered', label: 'Registered' },
      { key: 'total_attended', label: 'Attended' },
    ],
  },
}

function renderCell(row, column) {
  const value = row[column.key]

  if (column.render) {
    return column.render(value, row)
  }

  if (column.type === 'pill') {
    return <span className={`status-pill status-pill--${String(value).toLowerCase()}`}>{value}</span>
  }

  return value
}

export default function Dashboard({ onLogout, currentAdmin }) {
  const [activeTab, setActiveTab] = useState('members')
  const currentTable = tableConfig[activeTab]

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
            <div className="admin-panel__badge">{currentTable.rows.length} rows</div>
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
                  <tr key={row.id ?? row.reg_id ?? row.m_id ?? row.e_id ?? `${activeTab}-${index}`}>
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
  )
}
