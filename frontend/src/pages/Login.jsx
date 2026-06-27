
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  login,
  restablecerContrasena,
  solicitarRecuperacionContrasena,
  verificarCodigoRecuperacion,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

const CAROUSEL = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=90',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=90',
  'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=1600&q=90',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=90',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1600&q=90',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=90',
]

const INTERVAL_MS = 7000
const SF_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'

const VALUES = [
  { icon: 'verified_user', label: 'Confianza', desc: 'Cuidamos de ti con ética y profesionalismo.' },
  { icon: 'favorite', label: 'Calidad', desc: 'Tecnología avanzada y atención personalizada.' },
  { icon: 'groups', label: 'Compromiso', desc: 'Estamos contigo en cada etapa de tu bienestar.' },
]

export default function Login() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [recovery, setRecovery] = useState({ email: '', codigo: '', nueva_contrasena: '', confirmar: '' })
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState('email')
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % CAROUSEL.length)
        setFading(false)
      }, 800)
    }, INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [])

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
      setError(err.response?.data?.detail || 'No se pudo enviar el código.')
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

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    fontFamily: SF_FONT,
    color: '#101828',
    background: '#f5f9f8',
    border: '1.5px solid #e2eeec',
    borderRadius: 12,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    boxSizing: 'border-box',
  }

  const focusIn = (e) => {
    e.target.style.borderColor = '#006b5d'
    e.target.style.boxShadow = '0 0 0 3px rgba(0,107,93,0.10)'
    e.target.style.background = '#fff'
  }
  const focusOut = (e) => {
    e.target.style.borderColor = '#e2eeec'
    e.target.style.boxShadow = 'none'
    e.target.style.background = '#f5f9f8'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: SF_FONT,
      background: 'linear-gradient(135deg, #e8f4f1 0%, #d4ecec 50%, #e0f0f5 100%)',
    }}>

      {/* ══════════ LADO IZQUIERDO — solo carrusel limpio ══════════ */}
      <div style={{
        flex: '0 0 52%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Imágenes carrusel sin óvalo */}
        {CAROUSEL.map((src, i) => (
          <div key={i} style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === current ? (fading ? 0 : 1) : 0,
            transition: 'opacity 1.4s ease',
            zIndex: 0,
          }} />
        ))}

        {/* Overlay verde semitransparente */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'linear-gradient(160deg, rgba(0,60,50,0.70) 0%, rgba(6,108,90,0.55) 50%, rgba(0,40,32,0.72) 100%)',
        }} />

        {/* Contenido izquierdo */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 48px',
        }}>

          {/* Texto central */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 380 }}>
            <p style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7fffd4',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              margin: '0 0 14px',
              fontFamily: SF_FONT,
            }}>
              Clínica MedCare S.A.C.
            </p>
            <h2 style={{
              fontSize: 40,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: '0 0 10px',
              fontFamily: SF_FONT,
              letterSpacing: '-0.8px',
            }}>
              Tu salud,<br />
              nuestra <span style={{ color: '#12b8a3' }}>prioridad</span>
            </h2>
            <div style={{ width: 48, height: 3, background: '#12b8a3', borderRadius: 99, margin: '0 0 18px' }} />
            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.68)',
              lineHeight: 1.65,
              margin: 0,
              fontFamily: SF_FONT,
            }}>
              Brindamos atención médica integral con calidez, tecnología y compromiso.
            </p>
          </div>

          {/* Tarjetas valores */}
          <div style={{
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(16px)',
            borderRadius: 20,
            padding: '22px 28px',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
              {VALUES.map(({ icon, label, desc }, idx) => (
                <div key={label} style={{
                  textAlign: 'center',
                  padding: '0 16px',
                  borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(18,184,163,0.22)',
                    border: '1px solid rgba(18,184,163,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#12b8a3' }}>
                      {icon}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: SF_FONT }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5, fontFamily: SF_FONT }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ LADO DERECHO — formulario ══════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '20px 24px',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 510,
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Card blanco ocupa todo el alto */}
          <div style={{
            background: '#ffffff',
            borderRadius: 28,
            padding: '58px 52px',
            boxShadow: '0 20px 60px rgba(0,107,93,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: '1px solid rgba(18,184,163,0.12)',
          }}>

            {/* Logo centrado */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <img
                src="/medcare-logo.png"
                alt="Clínica MedCare S.A.C."
                style={{ height: 68, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 12px' }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <p style={{ fontSize: 11, fontWeight: 700, color: '#12b8a3', letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0, fontFamily: SF_FONT }}>
                SALUD · BIENESTAR · CONFIANZA
              </p>
            </div>

            {/* Bienvenido */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#003d33', margin: '0 0 6px', fontFamily: SF_FONT, letterSpacing: '-0.3px' }}>
                Bienvenido
              </h1>
              <p style={{ fontSize: 14, color: '#7a9e98', margin: 0, fontFamily: SF_FONT }}>
                Inicia sesión para continuar
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 20, padding: '12px 16px',
                background: '#fff0ef', border: '1px solid #ffdad6',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: '#93000a', fontFamily: SF_FONT,
              }}>
                {error}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 20, color: '#9ab8b2', pointerEvents: 'none',
                }}>person</span>
                <input
                  style={{ ...inputStyle, paddingLeft: 44 }}
                  type="email"
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  required
                />
              </div>

              {/* Contraseña */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 20, color: '#9ab8b2', pointerEvents: 'none',
                }}>lock</span>
                <input
                  style={{ ...inputStyle, paddingLeft: 44, paddingRight: 48 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ab8b2', padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Olvidé */}
              <div style={{ textAlign: 'right', marginBottom: 28 }}>
                <button type="button" onClick={openRecovery} style={{
                  background: 'none', border: 'none', fontSize: 13,
                  fontWeight: 600, color: '#006b5d', cursor: 'pointer',
                  fontFamily: SF_FONT, padding: 0,
                }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '16px 24px',
                  background: loading ? '#52a89e' : '#006b5d',
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 700, fontFamily: SF_FONT,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 16px rgba(0,107,93,0.28)',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#00574a' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#006b5d' }}
              >
                <span>{loading ? 'Ingresando...' : 'Iniciar sesión'}</span>
                {!loading && <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>}
              </button>
            </form>

            {/* Recuperación exitosa */}
            {recoveryMessage && !recoveryOpen && (
              <div style={{
                marginTop: 16, padding: '11px 14px',
                background: '#f4fffc', border: '1px solid #d8f4ee',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: '#006b5d', fontFamily: SF_FONT,
              }}>
                {recoveryMessage}
              </div>
            )}

            {/* Panel recuperación */}
            {recoveryOpen && (
              <div style={{
                marginTop: 24, background: '#f5f9f8',
                border: '1.5px solid #e2eeec', borderRadius: 16, padding: '22px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#003d33', fontFamily: SF_FONT, margin: 0 }}>
                      Recuperar contraseña
                    </h2>
                    <p style={{ marginTop: 3, fontSize: 12, color: '#7a9e98', fontFamily: SF_FONT, margin: '3px 0 0' }}>
                      Recibirás un código temporal en tu correo.
                    </p>
                  </div>
                  <button type="button" onClick={() => setRecoveryOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ab8b2', padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>

                {recoveryMessage && (
                  <div style={{
                    marginBottom: 12, padding: '9px 12px',
                    background: '#f4fffc', border: '1px solid #d8f4ee',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: '#006b5d', fontFamily: SF_FONT,
                  }}>
                    {recoveryMessage}
                  </div>
                )}

                {recoveryStep === 'email' && (
                  <form onSubmit={requestRecoveryCode}>
                    <input
                      style={{ ...inputStyle, fontSize: 14, padding: '12px 14px', marginBottom: 12 }}
                      type="email"
                      value={recovery.email}
                      onChange={(e) => setRecovery({ ...recovery, email: e.target.value })}
                      onFocus={focusIn}
                      onBlur={focusOut}
                      placeholder="correo@medcare.pe"
                      required
                    />
                    <button type="submit" disabled={recoveryLoading} style={{
                      width: '100%', padding: '12px', background: '#006b5d', color: '#fff',
                      border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      fontFamily: SF_FONT, cursor: 'pointer', opacity: recoveryLoading ? 0.6 : 1,
                    }}>
                      {recoveryLoading ? 'Enviando...' : 'Enviar código'}
                    </button>
                  </form>
                )}

                {recoveryStep === 'code' && (
                  <form onSubmit={verifyRecoveryCode}>
                    <input
                      style={{ ...inputStyle, fontSize: 22, padding: '12px 14px', textAlign: 'center', letterSpacing: '0.35em', fontWeight: 700, marginBottom: 12 }}
                      inputMode="numeric"
                      maxLength={6}
                      value={recovery.codigo}
                      onChange={(e) => setRecovery({ ...recovery, codigo: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      onFocus={focusIn}
                      onBlur={focusOut}
                      placeholder="000000"
                      required
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button type="button" onClick={requestRecoveryCode} disabled={recoveryLoading} style={{
                        padding: '11px', background: '#fff', color: '#006b5d',
                        border: '1.5px solid #006b5d', borderRadius: 12, fontSize: 13,
                        fontWeight: 600, fontFamily: SF_FONT, cursor: 'pointer', opacity: recoveryLoading ? 0.6 : 1,
                      }}>Reenviar</button>
                      <button type="submit" disabled={recoveryLoading || recovery.codigo.length !== 6} style={{
                        padding: '11px', background: '#006b5d', color: '#fff',
                        border: 'none', borderRadius: 12, fontSize: 13,
                        fontWeight: 600, fontFamily: SF_FONT, cursor: 'pointer',
                        opacity: (recoveryLoading || recovery.codigo.length !== 6) ? 0.6 : 1,
                      }}>Verificar</button>
                    </div>
                  </form>
                )}

                {recoveryStep === 'password' && (
                  <form onSubmit={resetPassword}>
                    <input
                      style={{ ...inputStyle, fontSize: 14, padding: '12px 14px', marginBottom: 12 }}
                      type="password"
                      placeholder="Nueva contraseña"
                      value={recovery.nueva_contrasena}
                      onChange={(e) => setRecovery({ ...recovery, nueva_contrasena: e.target.value })}
                      onFocus={focusIn}
                      onBlur={focusOut}
                      minLength={6}
                      required
                    />
                    <input
                      style={{ ...inputStyle, fontSize: 14, padding: '12px 14px', marginBottom: 12 }}
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={recovery.confirmar}
                      onChange={(e) => setRecovery({ ...recovery, confirmar: e.target.value })}
                      onFocus={focusIn}
                      onBlur={focusOut}
                      minLength={6}
                      required
                    />
                    <button type="submit" disabled={recoveryLoading} style={{
                      width: '100%', padding: '12px', background: '#006b5d', color: '#fff',
                      border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      fontFamily: SF_FONT, cursor: 'pointer', opacity: recoveryLoading ? 0.6 : 1,
                    }}>
                      {recoveryLoading ? 'Guardando...' : 'Restablecer contraseña'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Divisor o */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 18px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2eeec' }} />
              <span style={{ fontSize: 12, color: '#9ab8b2', fontFamily: SF_FONT }}>o</span>
              <div style={{ flex: 1, height: 1, background: '#e2eeec' }} />
            </div>

            {/* Registro */}
            <p style={{ textAlign: 'center', fontSize: 14, color: '#7a9e98', fontFamily: SF_FONT, margin: '0 0 22px' }}>
              ¿No tienes cuenta?{' '}
              <Link to="/register" style={{ fontWeight: 700, color: '#006b5d', textDecoration: 'none' }}>
                Regístrate como paciente
              </Link>
            </p>

            {/* Badge seguro */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, color: '#9ab8b2', fontSize: 12, fontFamily: SF_FONT,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>shield</span>
              Sistema seguro y confidencial
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}