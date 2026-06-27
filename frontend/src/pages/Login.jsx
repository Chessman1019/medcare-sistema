import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  login,
  restablecerContrasena,
  solicitarRecuperacionContrasena,
  verificarCodigoRecuperacion,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

// ── Imágenes del carrusel (6 fotos médicas profesionales de Unsplash) ──────────
const CAROUSEL = [
  {
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=85',
    title: 'Atención médica de calidad',
    sub: 'Profesionales especializados a tu servicio',
  },
  {
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&q=85',
    title: 'Consultas rápidas y seguras',
    sub: 'Historial clínico centralizado y accesible',
  },
  {
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&q=85',
    title: 'Tecnología al servicio de tu salud',
    sub: 'Sistema integrado para toda la clínica',
  },
  {
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=900&q=85',
    title: 'Equipo médico comprometido',
    sub: 'Más de 10 especialidades en un solo lugar',
  },
  {
    image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=900&q=85',
    title: 'Cuidado integral del paciente',
    sub: 'Seguimiento médico personalizado',
  },
  {
    image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=900&q=85',
    title: 'Innovación en salud',
    sub: 'Diagnóstico y tratamiento con tecnología avanzada',
  },
]

const INTERVAL_MS = 4000

// ── Sub-componente carrusel ────────────────────────────────────────────────────
function LoginCarousel() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)

  const goTo = (idx) => {
    if (idx === current || fading) return
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setFading(false)
    }, 500)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % CAROUSEL.length)
        setFading(false)
      }, 500)
    }, INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [])

  const slide = CAROUSEL[current]

  return (
    <div className="relative hidden overflow-hidden lg:block" style={{ flex: '0 0 50%' }}>
      {/* Imagen de fondo con crossfade */}
      {CAROUSEL.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: `url(${s.image})`,
            opacity: i === current ? (fading ? 0 : 1) : 0,
          }}
        />
      ))}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg,rgba(8,40,77,0.70) 0%,rgba(6,108,90,0.50) 60%,rgba(4,52,44,0.65) 100%)',
        }}
      />

      {/* Logo arriba */}
      <div className="absolute left-8 top-8 z-10">
        <img
          src="/medcare-logo.png"
          alt="MedCare"
          className="h-12 w-auto brightness-0 invert"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      {/* Texto descriptivo abajo */}
      <div className="absolute bottom-10 left-8 right-8 z-10">
        <p
          className="text-xl font-extrabold leading-snug text-white transition-opacity duration-500"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {slide.title}
        </p>
        <p
          className="mt-1.5 text-sm text-white/70 transition-opacity duration-500"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {slide.sub}
        </p>

        {/* Puntos */}
        <div className="mt-4 flex items-center gap-2">
          {CAROUSEL.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className="transition-all duration-300"
              style={{
                height: 6,
                width: i === current ? 20 : 6,
                borderRadius: 999,
                background: i === current ? '#12b8a3' : 'rgba(255,255,255,0.40)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Login principal ───────────────────────────────────────────────────────────
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
      else if (rol === 'recepcionista') navigate('/dashboard/recepcionista')
      else if (rol === 'administrador') navigate('/dashboard/admin')
      else navigate('/login')
    } catch {
      setError('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const openRecovery = () => {
    setRecoveryOpen(true)
    setRecoveryStep('email')
    setRecoveryMessage('')
    setError('')
    setRecovery((cur) => ({ ...cur, email: form.email }))
  }

  const requestRecoveryCode = async (event) => {
    event.preventDefault()
    setRecoveryLoading(true)
    setRecoveryMessage('')
    setError('')
    try {
      await solicitarRecuperacionContrasena({ email: recovery.email })
      setRecoveryStep('code')
      setRecoveryMessage('Te enviamos un código de 6 dígitos si el correo existe en el sistema.')
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar el código de recuperación.')
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
      setRecoveryMessage('Código validado. Ahora registra tu nueva contraseña.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Código inválido o expirado.')
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
      setError('Las contraseñas no coinciden.')
      setRecoveryLoading(false)
      return
    }
    try {
      await restablecerContrasena({
        email: recovery.email,
        codigo: recovery.codigo,
        nueva_contrasena: recovery.nueva_contrasena,
      })
      setForm((cur) => ({ ...cur, email: recovery.email, password: '' }))
      setRecovery({ email: '', codigo: '', nueva_contrasena: '', confirmar: '' })
      setRecoveryOpen(false)
      setRecoveryStep('email')
      setRecoveryMessage('Contraseña restablecida. Ya puedes iniciar sesión.')
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo restablecer la contraseña.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Lado izquierdo: carrusel ── */}
      <LoginCarousel />

      {/* ── Lado derecho: formulario ── */}
      <div
        className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10"
        style={{ background: 'radial-gradient(circle at top left, rgba(18,184,163,0.10), transparent 28rem), linear-gradient(135deg,#f8fbff 0%,#eef3ff 100%)' }}
      >
        <div className="w-full max-w-md">
          {/* Logo solo en móvil */}
          <div className="mb-8 text-center lg:hidden">
            <img
              src="/medcare-logo.png"
              alt="Clínica MedCare S.A.C."
              className="mx-auto h-20 w-auto object-contain"
            />
          </div>

          <div className="medcare-card p-6 sm:p-8">
            {/* Encabezado */}
            <div className="mb-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5d]">
                Portal Clínico
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#101828]">
                Iniciar sesión
              </h1>
              <p className="mt-2 text-sm text-[#52615f]">
                Ingresa con tus credenciales para continuar.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-[#ffdad6] bg-[#fff0ef] px-4 py-3 text-sm font-semibold text-[#93000a]">
                {error}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-bold text-[#223330]">
                Correo electrónico
                <input
                  className="medcare-input mt-2"
                  type="email"
                  placeholder="correo@medcare.pe"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#52615f]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#bdcbc7] text-[#006b5d]" />
                  Recordarme
                </label>
                <button
                  type="button"
                  onClick={openRecovery}
                  className="font-bold text-[#006b5d] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="medcare-primary-button flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60"
              >
                {loading ? 'Ingresando...' : 'Ingresar al portal'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            {/* Mensaje recuperación exitosa */}
            {recoveryMessage && !recoveryOpen && (
              <div className="mt-5 rounded-xl border border-[#d8f4ee] bg-[#f4fffc] px-4 py-3 text-sm font-semibold text-[#006b5d]">
                {recoveryMessage}
              </div>
            )}

            {/* Panel recuperación */}
            {recoveryOpen && (
              <div className="mt-6 rounded-2xl border border-[#bdcbc7] bg-[#f8fbff] p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#101828]">Recuperar contraseña</h2>
                    <p className="mt-1 text-sm text-[#52615f]">
                      Recibirás un código temporal en tu correo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecoveryOpen(false)}
                    className="rounded-lg p-1.5 text-[#52615f] transition hover:bg-white hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20"
                    aria-label="Cerrar recuperación"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {recoveryMessage && (
                  <div className="mb-4 rounded-xl border border-[#d8f4ee] bg-[#f4fffc] px-4 py-3 text-sm font-semibold text-[#006b5d]">
                    {recoveryMessage}
                  </div>
                )}

                {recoveryStep === 'email' && (
                  <form onSubmit={requestRecoveryCode} className="space-y-4">
                    <label className="block text-sm font-bold text-[#223330]">
                      Correo electrónico
                      <input
                        className="medcare-input mt-2"
                        type="email"
                        value={recovery.email}
                        onChange={(e) => setRecovery({ ...recovery, email: e.target.value })}
                        placeholder="correo@medcare.pe"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="medcare-primary-button flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
                    >
                      {recoveryLoading ? 'Enviando...' : 'Enviar código'}
                      <span className="material-symbols-outlined">mail</span>
                    </button>
                  </form>
                )}

                {recoveryStep === 'code' && (
                  <form onSubmit={verifyRecoveryCode} className="space-y-4">
                    <label className="block text-sm font-bold text-[#223330]">
                      Código recibido
                      <input
                        className="medcare-input mt-2 text-center text-xl font-extrabold tracking-[0.35em]"
                        inputMode="numeric"
                        maxLength={6}
                        value={recovery.codigo}
                        onChange={(e) =>
                          setRecovery({ ...recovery, codigo: e.target.value.replace(/\D/g, '').slice(0, 6) })
                        }
                        placeholder="000000"
                        required
                      />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={requestRecoveryCode}
                        disabled={recoveryLoading}
                        className="medcare-secondary-button px-4 py-3"
                      >
                        Reenviar
                      </button>
                      <button
                        type="submit"
                        disabled={recoveryLoading || recovery.codigo.length !== 6}
                        className="medcare-primary-button px-4 py-3 disabled:opacity-60"
                      >
                        Verificar
                      </button>
                    </div>
                  </form>
                )}

                {recoveryStep === 'password' && (
                  <form onSubmit={resetPassword} className="space-y-4">
                    <label className="block text-sm font-bold text-[#223330]">
                      Nueva contraseña
                      <input
                        className="medcare-input mt-2"
                        type="password"
                        value={recovery.nueva_contrasena}
                        onChange={(e) => setRecovery({ ...recovery, nueva_contrasena: e.target.value })}
                        minLength={6}
                        required
                      />
                    </label>
                    <label className="block text-sm font-bold text-[#223330]">
                      Confirmar contraseña
                      <input
                        className="medcare-input mt-2"
                        type="password"
                        value={recovery.confirmar}
                        onChange={(e) => setRecovery({ ...recovery, confirmar: e.target.value })}
                        minLength={6}
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="medcare-primary-button flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
                    >
                      {recoveryLoading ? 'Guardando...' : 'Restablecer contraseña'}
                      <span className="material-symbols-outlined">lock_reset</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            <p className="mt-7 text-center text-sm text-[#52615f]">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-extrabold text-[#006b5d] hover:underline">
                Regístrate como paciente
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}