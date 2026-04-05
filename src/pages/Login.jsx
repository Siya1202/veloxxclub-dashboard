import { useState } from 'react'
import './Login.css'
import veloxxLogo from '../assets/veloxx_posters.png'
import loginBackground from '../assets/WhatsApp Image 2026-03-25 at 12.43.06.jpeg'
import { members } from '../data/mockDatabase'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  function handleSubmit(e) {
    e.preventDefault()

    const adminMatch = members.find(
      (member) => member.role === 'admin' && member.email === email.trim() && member.password === password,
    )

    if (!adminMatch) {
      setError('Invalid admin email or password.')
      return
    }

    setError('')
    onLogin(adminMatch)
  }

  return (
    <div
      className="login-bg"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.58)), url(${loginBackground})` }}
    >
      <div className="login-card">

        <div className="login-logo">
          <img src={veloxxLogo} alt="VeloxxClub" className="logo-image" />
        </div>

        <p className="login-tagline">Admin Login</p>

        <form onSubmit={handleSubmit}  className="login-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn">Log In</button>
        </form>

      </div>
    </div>
  )
}
