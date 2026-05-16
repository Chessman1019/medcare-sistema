import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, rol, roles }) {
  const { user, ready } = useAuth()
  const allowedRoles = roles || (rol ? [rol] : [])

  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  if (allowedRoles.length && !allowedRoles.includes(user.rol)) return <Navigate to="/login" />

  return children
}
