import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar({ menuItems }) {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const rolColor = {
    paciente: 'bg-blue-500',
    doctor: 'bg-green-500',
    administrador: 'bg-purple-500'
  }

  const rolBadge = {
    paciente: 'bg-blue-100 text-blue-700',
    doctor: 'bg-green-100 text-green-700',
    administrador: 'bg-purple-100 text-purple-700'
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 shadow-sm flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <div>
            <h1 className="text-lg font-bold text-blue-600">MedCare</h1>
            <p className="text-xs text-gray-400">Sistema Médico</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${rolColor[user?.rol]} text-white flex items-center justify-center text-sm font-bold`}>
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate w-36">{user?.nombre}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolBadge[user?.rol]}`}>
              {user?.rol}
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              location.pathname === item.path
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <span className="text-lg">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}