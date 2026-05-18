import { useState } from 'react'
import ProfileMenu from './ProfileMenu'

function HeaderDropdown({ title, icon, items = [], emptyText, onClose }) {
  return (
    <div className="fixed right-3 top-20 z-50 w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#bdcbc7] bg-white shadow-2xl shadow-[#08284d]/12 sm:absolute sm:right-0 sm:top-12 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between border-b border-[#d8e3fb] bg-[#f8fbff] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
            <span className="material-symbols-outlined">{icon}</span>
          </span>
          <p className="font-extrabold text-[#101828]">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#52615f] transition hover:bg-white hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-95"
          aria-label="Cerrar menú"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="max-h-[min(420px,calc(100vh-7rem))] overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-[#edf2ff] p-4 text-sm text-[#52615f]">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const body = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-extrabold text-[#101828]">{item.title}</p>
                    {item.time && <span className="shrink-0 text-xs font-bold text-[#52615f]">{item.time}</span>}
                  </div>
                  {item.description && <p className="mt-1 text-sm leading-5 text-[#52615f]">{item.description}</p>}
                  {item.actionLabel && <p className="mt-3 text-sm font-extrabold text-[#006b5d]">{item.actionLabel}</p>}
                </>
              )

              if (item.onClick) {
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      item.onClick()
                      onClose()
                    }}
                    className="w-full rounded-xl border border-transparent p-4 text-left transition hover:-translate-y-0.5 hover:border-[#12b8a3]/35 hover:bg-[#f4fffc] hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]"
                  >
                    {body}
                  </button>
                )
              }

              return (
                <div key={item.title} className="rounded-xl border border-[#edf2ff] bg-white p-4">
                  {body}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Layout({
  children,
  sidebar,
  title,
  searchValue,
  searchPlaceholder = 'Buscar pacientes, citas o historiales...',
  onSearchChange,
  notificationItems = [],
  helpItems = [],
  appItems = [],
}) {
  const [openMenu, setOpenMenu] = useState(null)

  if (!sidebar) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(18,184,163,0.16),transparent_28rem),linear-gradient(135deg,#f8fbff_0%,#eef3ff_100%)]">
        {children}
      </div>
    )
  }

  const topButtonClass = 'rounded-xl p-2 text-[#223330] transition hover:-translate-y-0.5 hover:bg-[#edf2ff] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.95]'
  const toggleMenu = (menu) => setOpenMenu((current) => (current === menu ? null : menu))

  return (
    <div className="medcare-shell min-h-screen">
      {sidebar}
      <header className="fixed left-0 right-0 top-0 z-40 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-[#bdcbc7] bg-white/95 px-4 py-3 backdrop-blur lg:left-72 lg:h-20 lg:flex-nowrap lg:px-8 lg:py-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-5">
          <h1 className="min-w-0 truncate text-xl font-extrabold tracking-tight text-[#101828] sm:text-2xl">
            {title || 'Portal MedCare'}
          </h1>
          <div className="order-3 flex w-full basis-full items-center gap-3 rounded-full bg-[#edf2ff] px-4 py-2.5 text-[#52615f] transition focus-within:ring-4 focus-within:ring-[#12b8a3]/15 sm:basis-auto lg:order-none lg:max-w-xl lg:px-5 lg:py-3">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-6">
          <div className="relative">
            <button type="button" onClick={() => toggleMenu('notifications')} className={`relative ${topButtonClass}`} aria-label="Notificaciones" aria-expanded={openMenu === 'notifications'}>
              <span className="material-symbols-outlined">notifications</span>
              {notificationItems.length > 0 && <span className="absolute right-1.5 top-1 h-2.5 w-2.5 rounded-full bg-[#ba1a1a]" />}
            </button>
            {openMenu === 'notifications' && (
              <HeaderDropdown
                title="Notificaciones"
                icon="notifications"
                items={notificationItems}
                emptyText="No tienes notificaciones nuevas por ahora."
                onClose={() => setOpenMenu(null)}
              />
            )}
          </div>

          <div className="relative">
            <button type="button" onClick={() => toggleMenu('help')} className={topButtonClass} aria-label="Ayuda" aria-expanded={openMenu === 'help'}>
              <span className="material-symbols-outlined">help</span>
            </button>
            {openMenu === 'help' && (
              <HeaderDropdown
                title="Ayuda rápida"
                icon="help"
                items={helpItems}
                emptyText="No hay accesos de ayuda configurados para esta vista."
                onClose={() => setOpenMenu(null)}
              />
            )}
          </div>

          <div className="relative hidden sm:block">
            <button type="button" onClick={() => toggleMenu('apps')} className={topButtonClass} aria-label="Aplicaciones" aria-expanded={openMenu === 'apps'}>
              <span className="material-symbols-outlined">apps</span>
            </button>
            {openMenu === 'apps' && (
              <HeaderDropdown
                title="Accesos rápidos"
                icon="apps"
                items={appItems}
                emptyText="No hay accesos rápidos configurados."
                onClose={() => setOpenMenu(null)}
              />
            )}
          </div>

          <div className="hidden h-10 w-px bg-[#bdcbc7] md:block" />
          <ProfileMenu />
        </div>
      </header>
      <main className="min-h-screen pb-28 pt-32 sm:pt-28 lg:ml-72 lg:pb-0 lg:pt-20">
        {children}
      </main>
    </div>
  )
}
