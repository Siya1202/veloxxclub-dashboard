import veloxxLogo from '../assets/veloxx_posters.png'

const TABS = [
  { key: 'members', label: 'Members' },
  { key: 'events', label: 'Events' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'eventsummary', label: 'Event Summary' },
]

export default function Navbar({ activeTab, onTabChange, onLogout, currentAdmin }) {
  return (
    <header className="admin-navbar">
      <div className="admin-navbar__brand">
        <div>
          <img src={veloxxLogo} alt="VeloxxClub" className="admin-navbar__logo" />
        </div>
        <p className="admin-navbar__user">
          Signed in as <strong>{currentAdmin.m_name}</strong>
        </p>
      </div>

      <div className="admin-navbar__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-tab ${activeTab === tab.key ? 'admin-tab--active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button type="button" className="admin-logout" onClick={onLogout}>
        Logout
      </button>
    </header>
  )
}
