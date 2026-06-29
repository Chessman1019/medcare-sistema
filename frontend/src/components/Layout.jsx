import { useEffect, useState } from 'react'
import ProfileMenu from './ProfileMenu'

function HeaderDropdown({ title, icon, items = [], emptyText, onClose }) {
  const [deleteItem, setDeleteItem] = useState(null)

  return (
    <div className="fixed right-3 top-32 z-50 w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#bdcbc7] bg-white shadow-2xl shadow-[#08284d]/12 sm:absolute sm:right-0 sm:top-12 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between border-b border-[#d8e3fb] bg-[#f8fbff] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
            <span className="material-symbols-outlined">{icon}</span>
          </span>
          <p className="font-extrabold text-[#101828]">{title}</p>
        </div>
        <button type="button" onClick={onClose}
          className="rounded-lg p-1.5 text-[#52615f] transition hover:bg-white hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-95"
          aria-label="Cerrar menú">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="max-h-[min(420px,calc(100vh-7rem))] overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-[#edf2ff] p-4 text-sm text-[#52615f]">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const itemClass = item.read
                ? 'border-[#edf2ff] bg-white opacity-75'
                : 'border-[#12b8a3]/30 bg-[#f4fffc]'
              const body = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-extrabold text-[#101828]">{item.title}</p>
                    {item.time && <span className="shrink-0 text-xs font-bold text-[#52615f]">{item.time}</span>}
                  </div>
                  {item.description && <p className="mt-1 text-sm leading-5 text-[#52615f]">{item.description}</p>}
                  {item.details?.length > 0 && (
                    <dl className="mt-3 space-y-1.5 text-sm leading-5 text-[#52615f]">
                      {item.details.map((detail) => (
                        <div key={`${item.key || item.title}-${detail.label}`} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                          <dt className="font-extrabold text-[#223330]">{detail.label}:</dt>
                          <dd className="min-w-0 text-[#52615f]">{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {item.actionLabel && <p className="mt-3 text-sm font-extrabold text-[#006b5d]">{item.actionLabel}</p>}
                </>
              )
              return (
                <div key={item.key || item.title} className={`rounded-xl border p-3 transition hover:-translate-y-0.5 hover:border-[#12b8a3]/35 hover:shadow-sm ${itemClass}`}>
                  <button type="button"
                    onClick={() => { item.onClick?.(); onClose() }}
                    className="w-full min-w-0 p-1 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                    {body}
                  </button>
                  {(item.onMarkRead || item.onDelete) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#d8e3fb] pt-3">
                      {item.onMarkRead && !item.read && (
                        <button type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            item.onMarkRead?.()
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#b7e8df] bg-white px-3 py-1.5 text-xs font-extrabold text-[#006b5d] transition hover:bg-[#e5fbf7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20"
                          aria-label="Marcar notificación como vista">
                          <span className="material-symbols-outlined text-[16px]">done</span>
                          Marcar como visto
                        </button>
                      )}
                      {item.read && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#edf2ff] px-3 py-1.5 text-xs font-extrabold text-[#52615f]">
                          <span className="material-symbols-outlined text-[16px]">done_all</span>
                          Vista
                        </span>
                      )}
                      {item.onDelete && (
                        <button type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleteItem(item)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffdad6] bg-white px-3 py-1.5 text-xs font-extrabold text-[#93000a] transition hover:bg-[#fff0ef] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ba1a1a]/15"
                          aria-label="Eliminar notificación">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {deleteItem && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 p-5 backdrop-blur-sm">
          <div className="w-full rounded-2xl border border-[#bdcbc7] bg-white p-5 shadow-2xl shadow-[#08284d]/12">
            <p className="font-extrabold text-[#101828]">¿Estás seguro de eliminar esta notificación?</p>
            <p className="mt-2 text-sm text-[#52615f]">Esta acción la ocultará de tu bandeja de notificaciones.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteItem(null)}
                className="rounded-xl border border-[#bdcbc7] bg-white px-4 py-2 text-sm font-extrabold text-[#223330] transition hover:bg-[#f8fbff]">
                Cancelar
              </button>
              <button type="button" onClick={() => { deleteItem.onDelete?.(); setDeleteItem(null) }}
                className="rounded-xl bg-[#ba1a1a] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#93000a]">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SearchDropdown({ value, items, onClose }) {
  if (!value.trim()) return null
  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-[#bdcbc7] bg-white shadow-2xl shadow-[#08284d]/12">
      <div className="flex items-center justify-between border-b border-[#d8e3fb] bg-[#f8fbff] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <p className="font-extrabold text-[#101828] text-sm">Resultados para "{value}"</p>
        </div>
        <button type="button" onClick={onClose}
          className="rounded-lg p-1 text-[#52615f] hover:bg-white hover:text-[#006b5d]">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="rounded-xl bg-[#edf2ff] p-4 text-sm text-[#52615f]">No se encontraron resultados.</p>
        ) : (
          <div className="space-y-1">
            {items.map((item, i) => (
              <button key={i} type="button"
                onClick={() => { item.onClick?.(); onClose() }}
                className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-[#f4fffc]">
                <p className="font-extrabold text-sm text-[#101828]">{item.title}</p>
                {item.description && <p className="text-xs text-[#52615f] mt-0.5">{item.description}</p>}
                {item.actionLabel && <p className="text-xs font-extrabold text-[#006b5d] mt-1">{item.actionLabel}</p>}
              </button>
            ))}
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
  notificationCount,
  helpItems = [],
  appItems = [],
}) {
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => {
    const closeMenus = () => setOpenMenu(null)
    window.addEventListener('medcare:auth-cleared', closeMenus)
    return () => window.removeEventListener('medcare:auth-cleared', closeMenus)
  }, [])

  if (!sidebar) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(18,184,163,0.16),transparent_28rem),linear-gradient(135deg,#f8fbff_0%,#eef3ff_100%)]">
        {children}
      </div>
    )
  }

  const topButtonClass = 'rounded-xl p-2 text-[#223330] transition hover:-translate-y-0.5 hover:bg-[#edf2ff] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.95]'
  const toggleMenu = (menu) => setOpenMenu((current) => (current === menu ? null : menu))
  const visibleNotificationCount = searchValue?.trim() ? 0 : (notificationCount ?? notificationItems.length)

  return (
    <div className="medcare-shell min-h-screen">
      {sidebar}
      <header className="fixed left-0 right-0 top-0 z-40 grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#bdcbc7] bg-white/95 px-4 py-3 backdrop-blur lg:left-72 lg:flex lg:h-20 lg:flex-nowrap lg:px-8 lg:py-0">
        <div className="min-w-0 lg:flex-none">
          <h1 className="min-w-0 truncate text-lg font-extrabold tracking-tight text-[#101828] min-[380px]:text-xl sm:text-2xl lg:overflow-visible lg:text-clip lg:whitespace-nowrap">
            {title || 'Portal MedCare'}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:order-3 lg:ml-auto lg:gap-6">
          <div className="relative">
            <button type="button" onClick={() => toggleMenu('notifications')} className={`relative ${topButtonClass}`} aria-label="Notificaciones" aria-expanded={openMenu === 'notifications'}>
              <span className="material-symbols-outlined">notifications</span>
              {visibleNotificationCount > 0 && (
                <span className="absolute -right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white">
                  {visibleNotificationCount > 9 ? '9+' : visibleNotificationCount}
                </span>
              )}
            </button>
            {openMenu === 'notifications' && (
              <HeaderDropdown
                title="Notificaciones"
                icon="notifications"
                items={searchValue?.trim() ? [] : notificationItems}
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

        <div className="relative col-span-2 w-full min-w-0 lg:order-2 lg:col-span-1 lg:max-w-xl">
          <div className="flex items-center gap-2 rounded-full bg-[#edf2ff] px-3 py-2.5 text-[#52615f] transition focus-within:ring-4 focus-within:ring-[#12b8a3]/15 sm:gap-3 sm:px-4 lg:px-5 lg:py-3">
            <span className="material-symbols-outlined shrink-0 text-[22px]">search</span>
            {onSearchChange ? (
              <>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#52615f]"
                />
                {searchValue?.trim() && (
                  <button type="button" onClick={() => onSearchChange('')}
                    className="shrink-0 text-[#52615f] hover:text-[#101828]">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </>
            ) : (
              <span className="min-w-0 truncate text-sm">{searchPlaceholder}</span>
            )}
          </div>
          {onSearchChange && searchValue?.trim() && (
            <SearchDropdown
              value={searchValue}
              items={notificationItems}
              onClose={() => onSearchChange('')}
            />
          )}
        </div>
      </header>
      <main className="min-h-screen min-w-0 overflow-x-hidden pb-32 pt-36 sm:pt-32 lg:ml-72 lg:pb-0 lg:pt-20">
        {children}
      </main>
    </div>
  )
}
