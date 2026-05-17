import { useAuth } from '../context/AuthContext'

export default function PortalSidebar({
  active,
  items,
  onSelect,
  ctaLabel = 'Nueva cita',
  ctaIcon = 'add',
  onCta,
  onSupport,
  ctaFirst = false,
}) {
  const { logoutUser } = useAuth()

  const cta = onCta && (
    <button
      type="button"
      onClick={onCta}
      className="medcare-primary-button flex w-full items-center justify-center gap-3 px-4 py-4 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/25"
    >
      <span className="material-symbols-outlined">{ctaIcon}</span>
      {ctaLabel}
    </button>
  )

  return (
    <aside className="medcare-sidebar fixed left-0 top-0 z-50 flex h-screen w-72 flex-col px-5 py-7">
      <div className="mb-9">
        <img src="/medcare-logo.png" alt="Clínica MedCare S.A.C." className="mb-4 h-14 w-28 rounded-sm object-contain object-left" />
        <h2 className="text-xl font-extrabold text-[#006b5d]">Portal Clínico</h2>
        <p className="text-sm font-medium tracking-wide text-[#52615f]">Excelencia en salud</p>
      </div>

      {ctaFirst && <div className="mb-8">{cta}</div>}

      <nav className="space-y-2">
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => onSelect(item.path)}
            className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-base font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] ${
              active === item.path
                ? 'bg-[#12b8a3] text-[#06221f] shadow-sm'
                : 'text-[#223330] hover:-translate-y-0.5 hover:bg-[#edf2ff] hover:text-[#006b5d]'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4 border-t border-[#bdcbc7] pt-5">
        {!ctaFirst && cta}
        <button
          type="button"
          onClick={onSupport}
          className="flex w-full items-center gap-4 rounded-xl px-5 py-3 text-left text-base font-semibold text-[#223330] transition hover:-translate-y-0.5 hover:bg-[#edf2ff] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">contact_support</span>
          Soporte
        </button>
        <button
          type="button"
          onClick={() => {
            logoutUser()
            window.location.href = '/login'
          }}
          className="flex w-full items-center gap-4 rounded-xl px-5 py-3 text-left text-base font-semibold text-[#223330] transition hover:-translate-y-0.5 hover:bg-[#fff0ef] hover:text-[#ba1a1a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffb4ab]/30 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
