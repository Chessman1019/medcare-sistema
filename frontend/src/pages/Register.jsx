import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarPaciente } from '../services/api'
import Layout from '../components/Layout'
import { isPasswordValid, PasswordField, PasswordStrength } from '../components/PasswordControls'
import SeguroMedicoField from '../components/SeguroMedicoField'
import { dniInputProps, formatDniInput, formatPhoneInput, phoneInputProps } from '../utils/numericFields'

const initialForm = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
  dni: '',
  fecha_nacimiento: '',
  genero: 'M',
  seguro_medico: '',
}

export default function Register() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!isPasswordValid(form.password)) {
      setError('La contraseña debe tener mínimo 6 caracteres, letras y números.')
      setLoading(false)
      return
    }

    try {
      await registrarPaciente(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo registrar al paciente.')
    } finally {
      setLoading(false)
    }
  }

  const bind = (field) => ({
    value: form[field],
    onChange: (event) => setForm({ ...form, [field]: event.target.value }),
  })

  return (
    <Layout>
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-4xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/medcare-logo.png" alt="Clínica MedCare S.A.C." className="h-24 w-auto object-contain" />
            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#006b5d]">Alta de paciente</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#08284d]">Crear cuenta en MedCare</h1>
          </div>

          <div className="medcare-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="bg-[#eef3ff] p-8">
                <h2 className="text-2xl font-extrabold text-[#101828]">Tu portal de salud</h2>
                <p className="mt-3 text-sm leading-6 text-[#52615f]">
                  Regístrate para solicitar citas, consultar tu historial y gestionar tus atenciones médicas.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    ['event_available', 'Agenda citas con especialistas'],
                    ['clinical_notes', 'Consulta tus atenciones previas'],
                    ['support_agent', 'Recibe soporte de recepción'],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                      <span className="material-symbols-outlined text-[#006b5d]">{icon}</span>
                      <span className="text-sm font-bold text-[#223330]">{text}</span>
                    </div>
                  ))}
                </div>
              </aside>

              <form onSubmit={handleSubmit} className="space-y-5 p-8">
                {error && (
                  <div className="rounded-xl border border-[#ffdad6] bg-[#fff0ef] px-4 py-3 text-sm font-semibold text-[#93000a]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-[#223330]">
                    Nombre
                    <input className="medcare-input mt-2" placeholder="Ana" {...bind('nombre')} required />
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Apellido
                    <input className="medcare-input mt-2" placeholder="García" {...bind('apellido')} required />
                  </label>
                </div>

                <label className="block text-sm font-bold text-[#223330]">
                  Correo electrónico
                  <input className="medcare-input mt-2" type="email" placeholder="correo@ejemplo.com" {...bind('email')} required />
                </label>

                <div>
                  <PasswordField
                    label="Contraseña"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <PasswordStrength password={form.password} className="mt-3" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-[#223330]">
                    DNI
                    <input className="medcare-input mt-2" placeholder="12345678" {...dniInputProps}
                      value={form.dni} onChange={(event) => setForm({ ...form, dni: formatDniInput(event.target.value) })} required />
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Teléfono
                    <input className="medcare-input mt-2" placeholder="999999999" {...phoneInputProps}
                      value={form.telefono} onChange={(event) => setForm({ ...form, telefono: formatPhoneInput(event.target.value) })} />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-[#223330]">
                    Fecha de nacimiento
                    <input className="medcare-input mt-2" type="date" {...bind('fecha_nacimiento')} required />
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Género
                    <select className="medcare-input mt-2" {...bind('genero')}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>
                </div>

                <SeguroMedicoField
                  value={form.seguro_medico}
                  onChange={(value) => setForm({ ...form, seguro_medico: value })}
                />

                <button type="submit" disabled={loading} className="medcare-primary-button flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <p className="text-center text-sm text-[#52615f]">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="font-extrabold text-[#006b5d] hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
