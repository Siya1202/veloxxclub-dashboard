import { useEffect, useMemo, useState } from 'react'
import veloxxLogo from '../assets/veloxx_posters.png'
import './Dashboard.css'

const API_BASE_URL = 'http://localhost:5050'
const PROFILE_INITIAL_VALUES = {
  m_name: '',
  email: '',
  phone: '',
  city: '',
  age: '',
  fitness_level: 'Beginner',
}

function buildProfileFormValues(member) {
  return {
    m_name: member.m_name ?? '',
    email: member.email ?? '',
    phone: member.phone ?? '',
    city: member.city ?? '',
    age: member.age ?? '',
    fitness_level: member.fitness_level ?? 'Beginner',
  }
}

export default function MemberDashboard({ currentMember, onLogout, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('events')
  const [memberProfile, setMemberProfile] = useState(currentMember)
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [profileValues, setProfileValues] = useState(() => buildProfileFormValues(currentMember))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [registeringEventId, setRegisteringEventId] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isLiveConnected, setIsLiveConnected] = useState(false)

  useEffect(() => {
    setMemberProfile(currentMember)
    setProfileValues(buildProfileFormValues(currentMember))
  }, [currentMember])

  useEffect(() => {
    setError('')
    setSuccess('')
  }, [activeTab])

  useEffect(() => {
    if (!error && !success) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [error, success])

  async function loadPortalData({ showRefreshingState = false } = {}) {
    if (showRefreshingState) {
      setIsRefreshing(true)
    }

    const [eventsResponse, registrationsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/events/upcoming`),
      fetch(`${API_BASE_URL}/members/${memberProfile.m_id}/registrations`),
    ])

    if (!eventsResponse.ok || !registrationsResponse.ok) {
      throw new Error('Failed to load member portal data.')
    }

    const [eventsData, registrationsData] = await Promise.all([
      eventsResponse.json(),
      registrationsResponse.json(),
    ])

    setEvents(eventsData)
    setRegistrations(registrationsData)

    if (showRefreshingState) {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const hydratePortal = async () => {
      try {
        await loadPortalData()
      } catch {
        if (isMounted) {
          setError('Could not load your member portal. Make sure the backend server is running.')
        }
      }
    }

    hydratePortal()

    return () => {
      isMounted = false
    }
  }, [memberProfile.m_id])

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/events/stream`)

    eventSource.addEventListener('open', () => {
      setIsLiveConnected(true)
    })

    eventSource.addEventListener('events_updated', (event) => {
      try {
        const nextEvents = JSON.parse(event.data)
        setEvents(nextEvents)
        setIsLiveConnected(true)
      } catch {
        setError('Received an invalid live update from the server.')
      }
    })

    eventSource.addEventListener('stream_error', () => {
      setIsLiveConnected(false)
      setError('Live event sync is temporarily unavailable.')
    })

    eventSource.onerror = () => {
      setIsLiveConnected(false)
    }

    return () => {
      eventSource.close()
      setIsLiveConnected(false)
    }
  }, [])

  const registrationMap = useMemo(
    () => new Map(registrations.map((registration) => [registration.e_id, registration])),
    [registrations],
  )

  async function handleRegister(eventId) {
    try {
      setRegisteringEventId(eventId)
      setError('')
      setSuccess('')

      const response = await fetch(`${API_BASE_URL}/members/${memberProfile.m_id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ e_id: eventId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Could not register for this event.')
        return
      }

      await loadPortalData()
      setSuccess('You are registered for the event.')
    } catch {
      setError('Could not register right now. Make sure the backend server is running.')
    } finally {
      setRegisteringEventId(null)
    }
  }

  function handleProfileFieldChange(field, value) {
    setProfileValues((current) => ({
      ...current,
      [field]: value,
    }))
    setError('')
    setSuccess('')
  }

  async function handleRefreshPortal() {
    try {
      setError('')
      await loadPortalData({ showRefreshingState: true })
      setSuccess('Member portal refreshed.')
    } catch {
      setError('Could not refresh the member portal right now.')
      setIsRefreshing(false)
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()

    try {
      setIsSavingProfile(true)
      setError('')
      setSuccess('')

      const response = await fetch(`${API_BASE_URL}/members/${memberProfile.m_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          m_name: profileValues.m_name.trim(),
          email: profileValues.email.trim(),
          phone: profileValues.phone.trim(),
          city: profileValues.city.trim(),
          age: Number(profileValues.age),
          fitness_level: profileValues.fitness_level,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Could not update your profile.')
        return
      }

      const nextProfile = {
        ...memberProfile,
        ...profileValues,
        age: Number(profileValues.age),
      }

      setMemberProfile(nextProfile)
      onProfileUpdate?.(nextProfile)
      setProfileValues(buildProfileFormValues(nextProfile))
      setSuccess('Your profile was updated successfully.')
    } catch {
      setError('Could not update your profile right now.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-navbar">
        <div className="admin-navbar__brand">
          <img src={veloxxLogo} alt="VeloxxClub" className="admin-navbar__logo" />
          <p className="admin-navbar__user">
            Signed in as <strong>{memberProfile.m_name}</strong>
          </p>
        </div>

        <div className="admin-navbar__tabs member-dashboard__tabs">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'events' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'profile' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
        </div>

        <div>
          <p className="admin-navbar__eyebrow">Member Portal</p>
          <h1 className="admin-navbar__title">{activeTab === 'events' ? 'Event Feed' : 'Your Profile'}</h1>
        </div>

        <button type="button" className="admin-logout" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main className="admin-content">
        <section className="member-overview">
          <article className="admin-stat">
            <p className="admin-stat__label">Total Events</p>
            <p className="admin-stat__value">{events.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Upcoming Events</p>
            <p className="admin-stat__value">{events.filter((event) => Number(event.is_upcoming) === 1).length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Registered Events</p>
            <p className="admin-stat__value">{registrations.length}</p>
          </article>
        </section>

        {(error || success) && (
          <section className="admin-panel member-panel__notice">
            <div className="admin-panel__header admin-panel__header--stacked">
              {success && <p className="record-form__message record-form__message--success">{success}</p>}
              {error && <p className="record-form__message record-form__message--error">{error}</p>}
            </div>
          </section>
        )}

        {activeTab === 'events' ? (
          <>
            <section className="admin-panel member-panel__toolbar">
              <div className="admin-panel__header">
                <div>
                  <h2 className="admin-panel__title">Upcoming Events</h2>
                  <p className="admin-panel__subtitle">
                    {isLiveConnected
                      ? 'Live sync is on. Admin event changes appear here instantly.'
                      : 'Reconnecting to live event sync. You can still refresh manually.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="record-form__secondary member-panel__refresh"
                  onClick={handleRefreshPortal}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                </button>
              </div>
            </section>

            <section className="member-events">
              {events.length ? events.map((event) => {
                const registration = registrationMap.get(event.e_id)

                return (
                  <article key={event.e_id} className="admin-panel member-event-card">
                    <div className="admin-panel__header admin-panel__header--stacked">
                      <div>
                        <h2 className="admin-panel__title member-event-card__title">{event.e_name}</h2>
                        <p className="admin-panel__subtitle">{event.location}</p>
                      </div>
                      <div className="member-event-card__badges">
                        {Number(event.is_upcoming) === 1 && (
                          <span className="status-pill status-pill--upcoming">
                            upcoming
                          </span>
                        )}
                        <span className={`status-pill status-pill--${String(event.e_type).toLowerCase()}`}>{event.e_type}</span>
                      </div>
                    </div>

                    <div className="member-event-card__content">
                      <p><strong>Date:</strong> {event.e_date}</p>
                      <p><strong>Time:</strong> {event.e_time}</p>
                      <p><strong>Distance:</strong> {event.distance} km</p>
                      <p><strong>Capacity:</strong> {event.max_capacity}</p>
                    </div>

                    <div className="member-event-card__footer">
                      {registration ? (
                        <span className={`status-pill status-pill--${registration.reg_status}`}>{registration.reg_status}</span>
                      ) : (
                        <button
                          type="button"
                          className="record-form__submit member-event-card__button"
                          onClick={() => handleRegister(event.e_id)}
                          disabled={registeringEventId === event.e_id}
                        >
                          {registeringEventId === event.e_id ? 'Registering...' : 'Register'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              }) : (
                <section className="admin-panel member-panel__empty">
                  <div className="admin-panel__header admin-panel__header--stacked">
                    <h2 className="admin-panel__title">No Events Yet</h2>
                    <p className="admin-panel__subtitle">Ask an admin to create a new event and it will appear here for registration.</p>
                  </div>
                </section>
              )}
            </section>
          </>
        ) : (
          <section className="admin-layout admin-layout--single">
            <aside className="admin-panel admin-panel--form">
              <div className="admin-panel__header admin-panel__header--stacked">
                <div>
                  <h2 className="admin-panel__title">Edit Your Information</h2>
                  <p className="admin-panel__subtitle">Keep your member details up to date for registrations and contact info.</p>
                </div>
              </div>

              <form className="record-form" onSubmit={handleProfileSubmit}>
                <div className="record-form__grid">
                  <label className="record-form__field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={profileValues.m_name ?? PROFILE_INITIAL_VALUES.m_name}
                      onChange={(event) => handleProfileFieldChange('m_name', event.target.value)}
                      required
                    />
                  </label>
                  <label className="record-form__field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={profileValues.email ?? PROFILE_INITIAL_VALUES.email}
                      onChange={(event) => handleProfileFieldChange('email', event.target.value)}
                      required
                    />
                  </label>
                  <label className="record-form__field">
                    <span>Phone</span>
                    <input
                      type="text"
                      value={profileValues.phone ?? PROFILE_INITIAL_VALUES.phone}
                      onChange={(event) => handleProfileFieldChange('phone', event.target.value)}
                      required
                    />
                  </label>
                  <label className="record-form__field">
                    <span>City</span>
                    <input
                      type="text"
                      value={profileValues.city ?? PROFILE_INITIAL_VALUES.city}
                      onChange={(event) => handleProfileFieldChange('city', event.target.value)}
                      required
                    />
                  </label>
                  <label className="record-form__field">
                    <span>Age</span>
                    <input
                      type="number"
                      min="1"
                      value={profileValues.age ?? PROFILE_INITIAL_VALUES.age}
                      onChange={(event) => handleProfileFieldChange('age', event.target.value)}
                      required
                    />
                  </label>
                  <label className="record-form__field">
                    <span>Fitness Level</span>
                    <select
                      value={profileValues.fitness_level ?? PROFILE_INITIAL_VALUES.fitness_level}
                      onChange={(event) => handleProfileFieldChange('fitness_level', event.target.value)}
                      required
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </label>
                </div>

                <div className="record-form__actions">
                  <button type="submit" className="record-form__submit" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}
