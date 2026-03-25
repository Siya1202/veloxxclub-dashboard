import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const [currentAdmin, setCurrentAdmin] = useState(null)

  return currentAdmin
    ? <Dashboard currentAdmin={currentAdmin} onLogout={() => setCurrentAdmin(null)} />
    : <Login onLogin={setCurrentAdmin} />
}

export default App
