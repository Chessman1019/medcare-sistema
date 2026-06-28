/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()
const AUTH_CLEARED_EVENT = 'medcare:auth-cleared'

function notifyAuthCleared() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT))
  }
}

function clearSessionStorage() {
  try {
    sessionStorage.clear()
  } catch {
    // El navegador puede bloquear sessionStorage en algunos modos privados.
  }
}

function getSavedUser() {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return null

  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const ready = true

  const loginUser = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', accessToken)
  }

  const logoutUser = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    clearSessionStorage()
    notifyAuthCleared()
  }

  const updateUser = (updates) => {
    setUser((current) => {
      const nextUser = { ...(current || {}), ...updates }
      localStorage.setItem('user', JSON.stringify(nextUser))
      return nextUser
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, ready, loginUser, logoutUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
