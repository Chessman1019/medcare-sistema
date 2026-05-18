import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  login,
  restablecerContrasena,
  solicitarRecuperacionContrasena,
  verificarCodigoRecuperacion,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [recovery, setRecovery] = useState({ email: '', codigo: '', nueva_contrasena: '', confirmar: '' })
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState('email')
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setRecoveryMessage('')
    try {
      const res = await login(form)
      const { access_token, rol, id_usuario, nombre, apellido } = res.data
      loginUser({ id: id_usuario, email: form.email, rol, nombre: `${nombre} ${apellido}` }, access_token)
      if (rol === 'paciente') navigate('/dashboard/paciente')
      else if (rol === 'doctor') navigate('/dashboard/doctor')
      else if (rol === 'recepcionista' || rol === 'administrador') navigate('/dashboard/recepcionista')
      else navigate('/login')
    } catch {
      setError('Correo o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const openRecovery = () => {
    setRecoveryOpen(true)
    setRecoveryStep('email')
    setRecoveryMessage('')
    setError('')
    setRecovery((current) => ({ ...current, email: form.email }))
  }

  const requestRecoveryCode = async (event) => {
    event.preventDefault()
    setRecoveryLoading(true)
    setRecoveryMessage('')
    setError('')
    try {
      await solicitarRecuperacionContrasena({ email: recovery.email })
      setRecoveryStep('code')
      setRecoveryMessage('Te enviamos un codigo de 6 digitos si el correo existe en el sistema.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudo enviar el codigo de recuperacion.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const verifyRecoveryCode = async (event) => {
    event.preventDefault()
    setRecoveryLoading(true)
    setRecoveryMessage('')
    setError('')
    try {
      await verificarCodigoRecuperacion({ email: recovery.email, codigo: recovery.codigo })
      setRecoveryStep('password')
      setRecoveryMessage('Codigo validado. Ahora registra tu nueva contrasena.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Codigo invalido o expirado.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    setRecoveryLoading(true)
    setRecoveryMessage('')
    setError('')

    if (recovery.nueva_contrasena !== recovery.confirmar) {
      setError('Las contrasenas no coinciden.')
      setRecoveryLoading(false)
      return
    }

    try {
      await restablecerContrasena({
        email: recovery.email,
        codigo: recovery.codigo,
        nueva_contrasena: recovery.nueva_contrasena,
      })
      setForm((current) => ({ ...current, email: recovery.email, password: '' }))
      setRecovery({ email: '', codigo: '', nueva_contrasena: '', confirmar: '' })
      setRecoveryOpen(false)
      setRecoveryStep('email')
      setRecoveryMessage('Contrasena restablecida. Ya puedes iniciar sesion.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudo restablecer la contrasena.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  return (
    <Layout>
      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-[#bdcbc7] bg-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(18,184,163,0.20),transparent_28rem),radial-gradient(circle_at_75%_70%,rgba(8,40,77,0.12),transparent_24rem)]" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div>
              <img src="/medcare-logo.png" alt="Clinica MedCare S.A.C." className="h-28 w-auto object-contain object-left" />
              <p className="mt-10 max-w-xl text-5xl font-extrabold leading-tight tracking-tight text-[#08284d]">
                Gestion medica moderna para citas, atencion e historial clinico.
              </p>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#52615f]">
                Portal clinico integrado para pacientes, recepcionistas y doctores de Clinica MedCare S.A.C.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-3 gap-4">
              {[
                ['Citas', 'Agendamiento claro'],
                ['Atencion', 'Flujo clinico completo'],
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
              <img src="/medcare-logo.png" alt="Clinica MedCare S.A.C." className="mx-auto h-24 w-auto object-contain" />
            </div>

            <div className="medcare-card p-6 sm:p-8">
              <div className="mb-7">
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#006b5d]">Portal Clinico</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#101828]">Iniciar sesion</h1>
                <p className="mt-2 text-sm text-[#52615f]">Ingresa con tus credenciales para continuar.</p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-[#ffdad6] bg-[#fff0ef] px-4 py-3 text-sm font-semibold text-[#93000a]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block text-sm font-bold text-[#223330]">
                  Correo electronico
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
                  Contrasena
                  <input
                    className="medcare-input mt-2"
                    type="password"
                    placeholder="********"
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
                  <button type="button" onClick={openRecovery} className="font-bold text-[#006b5d] hover:underline">
                    Olvidaste tu contrasena?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="medcare-primary-button flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
                  {loading ? 'Ingresando...' : 'Ingresar al portal'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>

              {recoveryMessage && (
                <div className="mt-5 rounded-xl border border-[#d8f4ee] bg-[#f4fffc] px-4 py-3 text-sm font-semibold text-[#006b5d]">
                  {recoveryMessage}
                </div>
              )}

              {recoveryOpen && (
                <div className="mt-6 rounded-2xl border border-[#bdcbc7] bg-[#f8fbff] p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#101828]">Recuperar contrasena</h2>
                      <p className="mt-1 text-sm text-[#52615f]">Recibiras un codigo temporal en tu correo.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecoveryOpen(false)}
                      className="rounded-lg p-1.5 text-[#52615f] transition hover:bg-white hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20"
                      aria-label="Cerrar recuperacion"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  {recoveryStep === 'email' && (
                    <form onSubmit={requestRecoveryCode} className="space-y-4">
                      <label className="block text-sm font-bold text-[#223330]">
                        Correo electronico
                        <input
                          className="medcare-input mt-2"
                          type="email"
                          value={recovery.email}
                          onChange={(event) => setRecovery({ ...recovery, email: event.target.value })}
                          placeholder="correo@medcare.pe"
                          required
                        />
                      </label>
                      <button type="submit" disabled={recoveryLoading} className="medcare-primary-button flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60">
                        {recoveryLoading ? 'Enviando...' : 'Enviar codigo'}
                        <span className="material-symbols-outlined">mail</span>
                      </button>
                    </form>
                  )}

                  {recoveryStep === 'code' && (
                    <form onSubmit={verifyRecoveryCode} className="space-y-4">
                      <label className="block text-sm font-bold text-[#223330]">
                        Codigo recibido
                        <input
                          className="medcare-input mt-2 text-center text-xl font-extrabold tracking-[0.35em]"
                          inputMode="numeric"
                          maxLength={6}
                          value={recovery.codigo}
                          onChange={(event) => setRecovery({ ...recovery, codigo: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                          placeholder="000000"
                          required
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button type="button" onClick={requestRecoveryCode} disabled={recoveryLoading} className="medcare-secondary-button px-4 py-3">
                          Reenviar
                        </button>
                        <button type="submit" disabled={recoveryLoading || recovery.codigo.length !== 6} className="medcare-primary-button px-4 py-3 disabled:opacity-60">
                          Verificar
                        </button>
                      </div>
                    </form>
                  )}

                  {recoveryStep === 'password' && (
                    <form onSubmit={resetPassword} className="space-y-4">
                      <label className="block text-sm font-bold text-[#223330]">
                        Nueva contrasena
                        <input
                          className="medcare-input mt-2"
                          type="password"
                          value={recovery.nueva_contrasena}
                          onChange={(event) => setRecovery({ ...recovery, nueva_contrasena: event.target.value })}
                          minLength={6}
                          required
                        />
                      </label>
                      <label className="block text-sm font-bold text-[#223330]">
                        Confirmar contrasena
                        <input
                          className="medcare-input mt-2"
                          type="password"
                          value={recovery.confirmar}
                          onChange={(event) => setRecovery({ ...recovery, confirmar: event.target.value })}
                          minLength={6}
                          required
                        />
                      </label>
                      <button type="submit" disabled={recoveryLoading} className="medcare-primary-button flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60">
                        {recoveryLoading ? 'Guardando...' : 'Restablecer contrasena'}
                        <span className="material-symbols-outlined">lock_reset</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              <p className="mt-7 text-center text-sm text-[#52615f]">
                No tienes cuenta?{' '}
                <Link to="/register" className="font-extrabold text-[#006b5d] hover:underline">
                  Registrate como paciente
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
