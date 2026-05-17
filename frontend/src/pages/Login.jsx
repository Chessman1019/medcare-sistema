import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-[#bdcbc7] bg-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(18,184,163,0.20),transparent_28rem),radial-gradient(circle_at_75%_70%,rgba(8,40,77,0.12),transparent_24rem)]" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div>
              <img src="/medcare-logo.png" alt="Clínica MedCare S.A.C." className="h-28 w-auto object-contain object-left" />
              <p className="mt-10 max-w-xl text-5xl font-extrabold leading-tight tracking-tight text-[#08284d]">
                Gestión médica moderna para citas, atención e historial clínico.
              </p>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#52615f]">
                Portal clínico integrado para pacientes, recepcionistas y doctores de Clínica MedCare S.A.C.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-3 gap-4">
              {[
                ['Citas', 'Agendamiento claro'],
                ['Atención', 'Flujo clínico completo'],
                ['Historial', 'Registro centralizado'],
              ].map(([title, text]) => (
                <div key={title} className="medcare-card-soft p-4">
                  <p className="font-extrabold text-[#006b5d]">{title}</p>
                  <p className="mt-1 text-sm text-[#52615f]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <img src="/medcare-logo.png" alt="Clínica MedCare S.A.C." className="mx-auto h-24 w-auto object-contain" />
            </div>

            <div className="medcare-card p-8">
              <div className="mb-7">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#006b5d]">Portal Clínico</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#101828]">Iniciar sesión</h1>
                <p className="mt-2 text-sm text-[#52615f]">Ingresa con tus credenciales para continuar.</p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-[#ffdad6] bg-[#fff0ef] px-4 py-3 text-sm font-semibold text-[#93000a]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block text-sm font-bold text-[#223330]">
                  Correo electrónico
                  <input
                    className="medcare-input mt-2"
                    type="email"
                    placeholder="correo@medcare.pe"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                  />
                </label>

                <label className="block text-sm font-bold text-[#223330]">
                  Contraseña
                  <input
                    className="medcare-input mt-2"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    required
                  />
                </label>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[#52615f]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#bdcbc7] text-[#006b5d]" />
                    Recordarme
                  </label>
                  <button type="button" className="font-bold text-[#006b5d]">¿Olvidaste tu contraseña?</button>
                </div>

                <button type="submit" disabled={loading} className="medcare-primary-button flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
                  {loading ? 'Ingresando...' : 'Ingresar al portal'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-[#52615f]">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-extrabold text-[#006b5d] hover:underline">
                  Regístrate como paciente
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
