import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registrarPaciente } from '../services/api'
import Layout from '../components/Layout'

export default function Register() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '',
    telefono: '', dni: '', fecha_nacimiento: '', genero: 'M', seguro_medico: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registrarPaciente(form)
      alert('✅ Registro exitoso! Ya puedes iniciar sesión.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar')
    }
    setLoading(false)
  }

  const f = (field) => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) })
  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl mx-auto shadow-lg">🏥</div>
            <h1 className="text-3xl font-bold text-gray-800 mt-4">MedCare</h1>
            <p className="text-gray-500 mt-1 text-sm">Crear cuenta de paciente</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Registro de Paciente</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Nombre</label><input className={inputClass} placeholder="Ana" {...f('nombre')} required /></div>
                <div><label className={labelClass}>Apellido</label><input className={inputClass} placeholder="García" {...f('apellido')} required /></div>
              </div>
              <div><label className={labelClass}>Correo electrónico</label><input className={inputClass} type="email" placeholder="correo@ejemplo.com" {...f('email')} required /></div>
              <div><label className={labelClass}>Contraseña</label><input className={inputClass} type="password" placeholder="••••••••" {...f('password')} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>DNI</label><input className={inputClass} placeholder="12345678" maxLength={8} {...f('dni')} required /></div>
                <div><label className={labelClass}>Teléfono</label><input className={inputClass} placeholder="999999999" {...f('telefono')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Fecha nacimiento</label><input className={inputClass} type="date" {...f('fecha_nacimiento')} required /></div>
                <div><label className={labelClass}>Género</label>
                  <select className={inputClass} {...f('genero')}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div><label className={labelClass}>Seguro médico (opcional)</label><input className={inputClass} placeholder="SIS, EsSalud, etc." {...f('seguro_medico')} /></div>
              <button type="submit" disabled={loading}
                style={{background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)'}}
                className="w-full py-3 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-60 hover:opacity-90">
                {loading ? '⏳ Registrando...' : 'Crear cuenta →'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-cyan-500 font-medium hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}