const statusClass = { pendiente: 'bg-[#f5f5f2] text-[#46514f]', confirmada: 'bg-[#d8f4ee] text-[#006b5d]', reprogramada: 'bg-[#e8edff] text-[#355382]', cancelada: 'bg-[#ffdad6] text-[#93000a]', completada: 'bg-[#d8e5e2] text-[#293533]', en_atencion: 'bg-[#dff8fb] text-[#006b5d]' }
const iconButtonClass = 'rounded-xl p-2 text-[#006b5d] transition hover:-translate-y-0.5 hover:bg-[#e5fbf7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.95]'
const dangerButtonClass = 'rounded-xl border border-[#ffb4ab] bg-white px-4 py-3 font-extrabold text-[#93000a] transition hover:-translate-y-0.5 hover:bg-[#fff0ef] hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffb4ab]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const quickCardClass = 'medcare-card-soft flex min-h-44 flex-col items-center justify-center gap-4 p-5 text-center text-lg font-extrabold text-[#101828] transition hover:-translate-y-1 hover:border-[#12b8a3] hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatStatus(value) {
  const labels = { pendiente: 'Pendiente', confirmada: 'Confirmada', reprogramada: 'Reprogramada', cancelada: 'Cancelada', completada: 'Completada', en_atencion: 'En atención' }
  return labels[value] || (value || 'Pendiente').replaceAll('_', ' ')
}
function isManageable(cita) { return cita && !['cancelada', 'completada'].includes(cita.estado) }

export default function PacienteInicio({ user, proximaCita, filteredCitas, historial, notificaciones, quickPanel, setQuickPanel, activeAppointments, supportMessage, setSupportMessage, supportLoading, searchTerm, cancelingId, quickPanelRef, onAgendar, onCancelar, onReprogramar, onEnviarSoporte, onSelectTab, quickActions }) {
  const renderQuickPanel = () => {
    if (!quickPanel) return null
    const panelHeader = {
      recetas: ['clinical_notes', 'Recetas médicas', 'Indicaciones y documentos emitidos después de tus atenciones.'],
      resultados: ['biotech', 'Resultados de laboratorio', 'Consulta los resultados asociados a tus citas y exámenes.'],
      pagos: ['payments', 'Pagos y comprobantes', 'Resumen visual de importes pendientes y constancias.'],
      soporte: ['support_agent', 'Soporte del paciente', 'Solicita ayuda de coordinación sin salir del portal.'],
    }[quickPanel]
    if (!panelHeader) return null
    const [icon, title, description] = panelHeader

    return (
      <section ref={quickPanelRef} tabIndex={-1} className="medcare-card overflow-hidden focus:outline-none">
        <div className="flex flex-col gap-4 border-b border-[#bdcbc7] bg-white px-7 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
              <span className="material-symbols-outlined">{icon}</span>
            </span>
            <div>
              <h3 className="text-2xl font-extrabold text-[#101828]">{title}</h3>
              <p className="mt-1 text-sm text-[#52615f]">{description}</p>
            </div>
          </div>
          <button type="button" onClick={() => setQuickPanel(null)} className={iconButtonClass} aria-label="Cerrar panel">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-7">
          {quickPanel === 'recetas' && (
            <div className="space-y-4">
              {historial.length ? historial.slice(0, 3).map(item => (
                <div key={item.id_historial} className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                  <p className="font-extrabold text-[#101828]">{item.tratamiento || 'Tratamiento registrado'}</p>
                  <p className="mt-1 text-sm text-[#52615f]">Atención del {item.fecha_atencion}</p>
                  <p className="mt-3 rounded-xl bg-[#edf2ff] px-4 py-3 text-sm text-[#46514f]">{item.observaciones || 'Sin observaciones.'}</p>
                </div>
              )) : <p className="rounded-2xl bg-[#edf2ff] p-5 text-[#52615f]">Aún no tienes atenciones completadas.</p>}
            </div>
          )}
          {quickPanel === 'resultados' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="font-extrabold text-[#101828]">Resultados disponibles</p>
                <p className="mt-2 text-3xl font-extrabold text-[#006b5d]">{historial.length}</p>
                <p className="mt-2 text-sm text-[#52615f]">{historial[0]?.diagnostico || 'Cuando un doctor registre diagnóstico, aparecerá aquí.'}</p>
              </div>
              <button type="button" onClick={() => onSelectTab('citas')} className="rounded-2xl border border-[#bdcbc7] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:shadow-md">
                <p className="font-extrabold text-[#101828]">Ver historial</p>
                <p className="mt-2 text-sm text-[#52615f]">Revisa tus citas y estados.</p>
              </button>
            </div>
          )}
          {quickPanel === 'pagos' && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-[#006b5d]">Citas activas</p>
                <p className="mt-2 text-4xl font-extrabold text-[#101828]">{activeAppointments}</p>
              </div>
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-[#006b5d]">Pendiente</p>
                <p className="mt-2 text-4xl font-extrabold text-[#101828]">S/ 0.00</p>
              </div>
              <button type="button" onClick={() => onEnviarSoporte('comprobante', 'Solicito apoyo con comprobante.')} disabled={supportLoading} className="medcare-primary-button rounded-2xl px-5 py-4 text-left disabled:opacity-60">
                Solicitar comprobante
              </button>
            </div>
          )}
          {quickPanel === 'soporte' && (
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="rounded-2xl bg-[#edf2ff] p-5 text-[#52615f]">
                Un coordinador puede ayudarte con horarios, cancelaciones o información de tu atención.
                <textarea className="medcare-input mt-4 min-h-24" value={supportMessage} onChange={e => setSupportMessage(e.target.value)} placeholder="Describe qué necesitas..." />
              </div>
              <button type="button" onClick={() => onEnviarSoporte('soporte paciente')} disabled={supportLoading} className="medcare-primary-button px-6 py-4 disabled:opacity-60">
                {supportLoading ? 'Enviando...' : 'Solicitar apoyo'}
              </button>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Hola, {user?.nombre?.split(' ')[0] || 'paciente'}</h2>
        <p className="mt-2 text-lg text-[#52615f]">Aquí tienes el resumen de tu atención médica.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:gap-7 xl:grid-cols-[1fr_380px]">
        <section className="medcare-card overflow-hidden">
          <div className="bg-gradient-to-br from-white via-white to-[#ecfffb] p-5 sm:p-8">
            <p className="mb-6 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-[#006b5d]">
              <span className="material-symbols-outlined">event_upcoming</span>Próxima cita
            </p>
            {proximaCita ? (
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-[#d8e5e2] text-5xl font-extrabold text-[#006b5d]">
                  {proximaCita.doctor?.charAt(0) || 'M'}
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-extrabold text-[#101828]">Dr. {proximaCita.doctor}</h3>
                  <p className="mt-2 text-xl font-bold text-[#006b5d]">{proximaCita.especialidad}</p>
                  <div className="mt-5 grid gap-3 text-base text-[#46514f] md:grid-cols-2">
                    <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[#12b8a3]">calendar_month</span>{formatDate(proximaCita.fecha_hora)}</span>
                    <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[#12b8a3]">verified</span>{formatStatus(proximaCita.estado)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => onReprogramar(proximaCita)} className="medcare-secondary-button px-6 py-4">Reprogramar</button>
                  <button type="button" onClick={() => onCancelar(proximaCita.id_cita)} disabled={cancelingId === proximaCita.id_cita} className={dangerButtonClass}>
                    {cancelingId === proximaCita.id_cita ? 'Cancelando...' : 'Cancelar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#edf2ff] p-5 text-[#52615f] sm:p-8">
                <p>No tienes citas próximas.</p>
                <button type="button" onClick={() => onSelectTab('agendar')} className="medcare-primary-button mt-5 px-6 py-3">Agendar cita</button>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {quickActions.map(action => (
            <button key={action.key} type="button" onClick={() => setQuickPanel(qp => qp === action.key ? null : action.key)}
              aria-pressed={quickPanel === action.key}
              className={`${quickCardClass} ${quickPanel === action.key ? 'border-[#12b8a3] bg-white shadow-lg' : ''}`}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#006b5d] shadow-sm">
                <span className="material-symbols-outlined text-3xl">{action.icon}</span>
              </span>
              <span>{action.label}</span>
              <span className="text-sm font-semibold text-[#52615f]">{action.detail}</span>
            </button>
          ))}
        </section>
      </div>

      {renderQuickPanel()}

      <section className="medcare-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#bdcbc7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div>
            <h3 className="text-2xl font-extrabold text-[#101828]">Actividad reciente</h3>
            {searchTerm && <p className="mt-1 text-sm text-[#52615f]">Filtrado por: "{searchTerm}"</p>}
          </div>
          <button type="button" onClick={() => onSelectTab('citas')} className="rounded-xl px-4 py-2 font-extrabold text-[#006b5d] transition hover:bg-[#e5fbf7]">Ver historial</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white text-sm uppercase text-[#223330]">
              <tr>
                {['Especialista', 'Servicio', 'Fecha y hora', 'Estado', 'Acciones'].map(h => <th key={h} className="px-8 py-5">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {filteredCitas.slice(0, 5).map(cita => (
                <tr key={cita.id_cita} className="bg-white transition hover:bg-[#f8fbff]">
                  <td className="px-8 py-5"><p className="font-extrabold text-[#101828]">Dr. {cita.doctor}</p><p className="text-sm text-[#52615f]">{cita.especialidad}</p></td>
                  <td className="px-8 py-5 text-[#101828]">{cita.motivo || 'Consulta'}</td>
                  <td className="px-8 py-5 text-[#101828]">{formatDate(cita.fecha_hora)}</td>
                  <td className="px-8 py-5"><span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass[cita.estado] || statusClass.pendiente}`}>{formatStatus(cita.estado)}</span></td>
                  <td className="px-8 py-5">
                    {isManageable(cita) ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => onReprogramar(cita)} className={iconButtonClass}><span className="material-symbols-outlined">edit_calendar</span></button>
                        <button type="button" onClick={() => onCancelar(cita.id_cita)} disabled={cancelingId === cita.id_cita} className="rounded-xl p-2 text-[#93000a] transition hover:-translate-y-0.5 hover:bg-[#fff0ef] disabled:opacity-60"><span className="material-symbols-outlined">event_busy</span></button>
                      </div>
                    ) : <span className="text-sm text-[#52615f]">Sin acciones</span>}
                  </td>
                </tr>
              ))}
              {filteredCitas.length === 0 && (
                <tr><td colSpan="5" className="px-8 py-10 text-center text-[#52615f]">{searchTerm ? 'No encontramos citas con esa búsqueda.' : 'Aún no tienes citas registradas.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}