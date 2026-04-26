import { useState } from 'react'
import './Login.css'
import veloxxLogo from '../assets/veloxx_posters.png'
import loginBackground from '../assets/WhatsApp Image 2026-03-25 at 12.43.06.jpeg'

const API_BASE_URL = 'http://localhost:5050'

const initialSignupValues = {
  m_name: '',
  email: '',
  phone: '',
  city: '',
  age: '',
  fitness_level: 'Beginner',
  password: '',
}

export default function Login({ onLogin }) {
  const [authMode, setAuthMode] = useState('admin')
  const [memberPanel, setMemberPanel] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupValues, setSignupValues] = useState(initialSignupValues)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLoginSubmit(event) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const endpoint = authMode === 'admin' ? 'admin-login' : 'member-login'
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Unable to log in right now.')
        return
      }

      onLogin({
        role: authMode,
        profile: data,
      })
    } catch {
      setError('Could not connect to the backend. Make sure the API server is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const response = await fetch(`${API_BASE_URL}/auth/member-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...signupValues,
          age: Number(signupValues.age),
          email: signupValues.email.trim(),
          phone: signupValues.phone.trim(),
          city: signupValues.city.trim(),
          m_name: signupValues.m_name.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Could not create your account.')
        return
      }

      setSignupValues(initialSignupValues)
      setSuccess('Signup successful. You can now log in as a member.')
      setMemberPanel('login')
      setEmail(data.email)
      setPassword('')
    } catch {
      setError('Could not connect to the backend. Make sure the API server is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleMemberFieldChange(field, value) {
    setSignupValues((current) => ({
      ...current,
      [field]: value,
    }))
    setError('')
    setSuccess('')
  }

  function switchAuthMode(nextMode) {
    setAuthMode(nextMode)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
  }

  return (
    <div
      className="login-bg"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.58)), url(${loginBackground})` }}
    >
      <div className="login-card login-card--wide">
        <div className="login-logo">
          <img src={veloxxLogo} alt="VeloxxClub" className="logo-image" />
        </div>

        <div className="login-switcher">
          <button
            type="button"
            className={`login-switcher__btn ${authMode === 'admin' ? 'login-switcher__btn--active' : ''}`}
            onClick={() => switchAuthMode('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className={`login-switcher__btn ${authMode === 'member' ? 'login-switcher__btn--active' : ''}`}
            onClick={() => switchAuthMode('member')}
          >
            Member
          </button>
        </div>

        <p className="login-tagline">{authMode === 'admin' ? 'Admin Login' : 'Member Access'}</p>

        {authMode === 'member' && (
          <div className="member-toggle">
            <button
              type="button"
              className={`member-toggle__btn ${memberPanel === 'login' ? 'member-toggle__btn--active' : ''}`}
              onClick={() => {
                setMemberPanel('login')
                setError('')
                setSuccess('')
              }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`member-toggle__btn ${memberPanel === 'signup' ? 'member-toggle__btn--active' : ''}`}
              onClick={() => {
                setMemberPanel('signup')
                setError('')
                setSuccess('')
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {authMode === 'admin' || memberPanel === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(''); setSuccess('') }}
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
                onChange={(event) => { setPassword(event.target.value); setError(''); setSuccess('') }}
                required
              />
            </div>

            {success && <p className="login-success">{success}</p>}
            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : authMode === 'admin' ? 'Log In as Admin' : 'Log In as Member'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="field">
              <label htmlFor="m_name">Full Name</label>
              <input
                id="m_name"
                type="text"
                placeholder="Your full name"
                value={signupValues.m_name}
                onChange={(event) => handleMemberFieldChange('m_name', event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="member@email.com"
                value={signupValues.email}
                onChange={(event) => handleMemberFieldChange('email', event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="text"
                placeholder="10-digit phone"
                value={signupValues.phone}
                onChange={(event) => handleMemberFieldChange('phone', event.target.value)}
                required
              />
            </div>

            <div className="login-form__row">
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  placeholder="Pune"
                  value={signupValues.city}
                  onChange={(event) => handleMemberFieldChange('city', event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  min="1"
                  placeholder="21"
                  value={signupValues.age}
                  onChange={(event) => handleMemberFieldChange('age', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="fitness_level">Fitness Level</label>
              <select
                id="fitness_level"
                value={signupValues.fitness_level}
                onChange={(event) => handleMemberFieldChange('fitness_level', event.target.value)}
                required
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={signupValues.password}
                onChange={(event) => handleMemberFieldChange('password', event.target.value)}
                required
              />
            </div>

            {success && <p className="login-success">{success}</p>}
            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Sign Up as Member'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
