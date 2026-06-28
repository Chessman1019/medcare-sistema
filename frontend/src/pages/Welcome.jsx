import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=85',
    alt: 'Clínica médica moderna',
  },
  {
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=85',
    alt: 'Doctor atendiendo paciente',
  },
  {
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&q=85',
    alt: 'Sala de consulta médica',
  },
  {
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1600&q=85',
    alt: 'Equipo médico profesional',
  },
  {
    image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1600&q=85',
    alt: 'Atención médica especializada',
  },
  {
    image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1600&q=85',
    alt: 'Tecnología médica avanzada',
  },
]

const INTERVAL_MS = 4000

export default function Welcome() {
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState([0])
  const [transitioning, setTransitioning] = useState(false)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  // Fade-in al montar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Preload siguiente imagen
  useEffect(() => {
    const next = (current + 1) % SLIDES.length
    if (!loaded.includes(next)) {
      const img = new Image()
      img.src = SLIDES[next].image
      setLoaded((prev) => [...prev, next])
    }
  }, [current, loaded])

  // Auto-avance cada 4 s
  useEffect(() => {
    timerRef.current = setInterval(() => advance(), INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  })

  function advance(idx = null) {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent((prev) => (idx !== null ? idx : (prev + 1) % SLIDES.length))
      setTransitioning(false)
    }, 600)
  }

  function goToSlide(idx) {
    if (idx === current || transitioning) return
    clearInterval(timerRef.current)
    advance(idx)
  }

  function handleEnter() {
    navigate('/login')
  }

  return (
    <div
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center gap-6 overflow-x-hidden px-4 py-6 sm:gap-8 lg:py-8"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity .6s ease' }}
    >
      {/* ── Slides de fondo ── */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${slide.image})`,
            opacity: i === current ? (transitioning ? 0 : 1) : 0,
            transition: 'opacity 1s ease',
            zIndex: 0,
          }}
          role="img"
          aria-label={slide.alt}
        />
      ))}

      {/* ── Overlay gradiente ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(8,40,77,0.78) 0%, rgba(6,108,90,0.62) 55%, rgba(4,52,44,0.70) 100%)',
          zIndex: 1,
        }}
      />

      {/* ── Contenido central ── */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-5 text-center sm:gap-6">
        {/* Logo */}
        <img
          src="/medcare-logo.png"
          alt="Clínica MedCare S.A.C."
          className="h-20 w-auto drop-shadow-lg sm:h-24"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />

        {/* Badge */}
        <span
          className="rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest"
          style={{
            background: 'rgba(18,184,163,0.20)',
            border: '1px solid rgba(18,184,163,0.45)',
            color: '#7fffd4',
            letterSpacing: '0.14em',
          }}
        >
          Clínica MedCare S.A.C.
        </span>

        {/* Título */}
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
          Tu salud,{' '}
          <span style={{ color: '#12b8a3' }}>nuestra prioridad</span>
        </h1>

        {/* Subtítulo */}
        <p className="max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
          Agenda citas, consulta tu historial clínico y accede a atención
          médica especializada desde un solo portal.
        </p>

        {/* Botón principal */}
        <button
          onClick={handleEnter}
          className="group mt-2 flex items-center gap-3 rounded-full px-9 py-4 text-base font-extrabold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 sm:text-lg"
          style={{ background: '#12b8a3' }}
        >
          Ingresar al portal
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-1"
            style={{ background: 'rgba(255,255,255,0.20)' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </span>
        </button>

        {/* Puntos de navegación */}
        <div className="mt-2 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Imagen ${i + 1}`}
              className="transition-all duration-300"
              style={{
                height: 8,
                width: i === current ? 24 : 8,
                borderRadius: 999,
                background: i === current ? '#12b8a3' : 'rgba(255,255,255,0.35)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Tarjetas info (parte inferior) ── */}
      <div className="relative z-10 hidden w-full max-w-4xl grid-cols-3 gap-4 lg:grid">
        {[
          { icon: 'calendar_month', label: 'Citas', desc: 'Agendamiento claro y rápido' },
          { icon: 'medical_services', label: 'Atención', desc: 'Flujo clínico completo' },
          { icon: 'history', label: 'Historial', desc: 'Registro centralizado' },
        ].map(({ icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(18,184,163,0.25)', color: '#7fffd4' }}
            >
              <span className="material-symbols-outlined block text-[22px] leading-none">
                {icon}
              </span>
            </span>
            <div>
              <p className="font-extrabold text-white">{label}</p>
              <p className="text-sm text-white/65">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
