import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const rolColor = {
    paciente: 'bg-blue-100 text-blue-700',
    doctor: 'bg-green-100 text-green-700',
    administrador: 'bg-purple-100 text-purple-700'
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="text-xl font-bold text-blue-600">MedCare</span>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-sm text-gray-500">Sistema de Citas Médicas</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {user.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">{user.nombre}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolColor[user.rol] || 'bg-gray-100 text-gray-600'}`}>
                  {user.rol}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}