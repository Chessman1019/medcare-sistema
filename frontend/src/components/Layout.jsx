import { useAuth } from '../context/AuthContext'

const roleLabel = {
  paciente: 'Paciente',
  doctor: 'Doctor',
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
}

export default function Layout({
  children,
  sidebar,
  title,
  searchValue,
  searchPlaceholder = 'Buscar pacientes, citas o historiales...',
  onSearchChange,
  onNotifications,
  onHelp,
  onApps,
}) {
  const { user } = useAuth()

  if (!sidebar) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(18,184,163,0.16),transparent_28rem),linear-gradient(135deg,#f8fbff_0%,#eef3ff_100%)]">
        {children}
      </div>
    )
  }

  const topButtonClass = 'rounded-xl p-2 text-[#223330] transition hover:-translate-y-0.5 hover:bg-[#edf2ff] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.95]'

  return (
    <div className="medcare-shell min-h-screen">
      {sidebar}
      <header className="fixed left-72 right-0 top-0 z-40 flex h-20 items-center justify-between border-b border-[#bdcbc7] bg-white/95 px-8 backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <h1 className="min-w-fit text-2xl font-extrabold tracking-tight text-[#101828]">
            {title || 'Portal MedCare'}
          </h1>
          <div className="hidden w-full max-w-xl items-center gap-3 rounded-full bg-[#edf2ff] px-5 py-3 text-[#52615f] transition focus-within:ring-4 focus-within:ring-[#12b8a3]/15 lg:flex">
            <span className="material-symbols-outlined text-[22px]">search</span>
            {onSearchChange ? (
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#52615f]"
              />
            ) : (
              <span className="text-sm">{searchPlaceholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button type="button" onClick={onNotifications} className={`relative ${topButtonClass}`} aria-label="Notificaciones">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-1.5 top-1 h-2.5 w-2.5 rounded-full bg-[#ba1a1a]" />
          </button>
          <button type="button" onClick={onHelp} className={topButtonClass} aria-label="Ayuda">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button type="button" onClick={onApps} className={`hidden md:block ${topButtonClass}`} aria-label="Aplicaciones">
            <span className="material-symbols-outlined">apps</span>
          </button>
          <div className="hidden h-10 w-px bg-[#bdcbc7] md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-extrabold text-[#101828]">{user?.nombre || 'Usuario MedCare'}</p>
              <p className="text-xs text-[#52615f]">{roleLabel[user?.rol] || 'Portal clínico'}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#12b8a3] bg-white text-base font-extrabold text-[#006b5d]">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'M'}
            </div>
          </div>
        </div>
      </header>
      <main className="ml-72 min-h-screen pt-20">
        {children}
      </main>
    </div>
  )
}
