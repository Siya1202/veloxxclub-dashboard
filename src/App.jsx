import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MemberDashboard from './pages/MemberDashboard'

function App() {
  const [session, setSession] = useState(null)

  function handleLogout() {
    setSession(null)
  }

  function handleMemberProfileUpdate(nextProfile) {
    setSession((currentSession) => {
      if (!currentSession || currentSession.role !== 'member') {
        return currentSession
      }

      return {
        ...currentSession,
        profile: nextProfile,
      }
    })
  }

  if (session?.role === 'admin') {
    return <Dashboard currentAdmin={session.profile} onLogout={handleLogout} />
  }

  if (session?.role === 'member') {
    return (
      <MemberDashboard
        currentMember={session.profile}
        onLogout={handleLogout}
        onProfileUpdate={handleMemberProfileUpdate}
      />
    )
  }

  return <Login onLogin={setSession} />
}

export default App
