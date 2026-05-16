import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(form)
      const { access_token, rol, id_usuario, nombre, apellido } = res.data
      loginUser({ id: id_usuario, email: form.email, rol, nombre: `${nombre} ${apellido}` }, access_token)
      if (rol === 'paciente') navigate('/dashboard/paciente')
      else if (rol === 'doctor') navigate('/dashboard/doctor')
      else if (rol === 'recepcionista' || rol === 'administrador') navigate('/dashboard/recepcionista')
      else navigate('/login')
    } catch {
      setError('Correo o contraseña incorrectos')
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl mx-auto shadow-lg">🏥</div>
            <h1 className="text-3xl font-bold text-gray-800 mt-4">MedCare</h1>
            <p className="text-gray-500 mt-1 text-sm">Sistema de Gestión de Citas Médicas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar Sesión</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input type="email" placeholder="correo@ejemplo.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition" required />
              </div>
              <button type="submit" disabled={loading}
                style={{background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)'}}
                className="w-full py-3 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-60 hover:opacity-90">
                {loading ? '⏳ Ingresando...' : 'Ingresar →'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-cyan-500 font-medium hover:underline">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
