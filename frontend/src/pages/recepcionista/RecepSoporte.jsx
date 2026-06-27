const estadoClass = {
  abierto:     'bg-[#faeeda] text-[#854F0B]',
  en_revision: 'bg-[#edf2ff] text-[#355382]',
  resuelto:    'bg-[#d8f4ee] text-[#006b5d]',
  cerrado:     'bg-[#f5f5f2] text-[#46514f]',
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatEstado(value) {
  const labels = { abierto: 'Abierto', en_revision: 'En revisión', resuelto: 'Resuelto', cerrado: 'Cerrado' }
  return labels[value] || (value || 'Abierto').replaceAll('_', ' ')
}

export default function RecepSoporte({ soporteTickets, actionLoading, onActualizarTicket, onCrearTicketInterno }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Tickets de soporte</h2>
          <p className="mt-2 text-lg text-[#52615f]">Solicitudes de pacientes, médicos y recepción.</p>
        </div>
        <button type="button" onClick={onCrearTicketInterno} disabled={actionLoading === 'soporte'}
          className="medcare-primary-button px-5 py-2.5 disabled:opacity-60">
          {actionLoading === 'soporte' ? 'Registrando...' : 'Crear ticket interno'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Abiertos',    value: soporteTickets.filter(t => t.estado === 'abierto').length,     icon: 'inbox',         color: 'text-[#854F0B]', bg: 'bg-[#faeeda]' },
          { label: 'En revisión', value: soporteTickets.filter(t => t.estado === 'en_revision').length, icon: 'rate_review',   color: 'text-[#355382]', bg: 'bg-[#edf2ff]' },
          { label: 'Resueltos',   value: soporteTickets.filter(t => t.estado === 'resuelto').length,    icon: 'check_circle',  color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]' },
          { label: 'Total',       value: soporteTickets.length,                                          icon: 'support_agent', color: 'text-[#52615f]', bg: 'bg-[#f5f5f2]' },
        ].map(s => (
          <div key={s.label} className="medcare-card p-5 text-center">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center mx-auto`}>
              <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
            </div>
            <p className={`text-2xl font-extrabold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#52615f] mt-1 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="medcare-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
              <tr>
                {['Solicitante', 'Mensaje', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {soporteTickets.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-[#52615f]">No hay tickets registrados.</td></tr>
              ) : soporteTickets.map(ticket => (
                <tr key={ticket.id_ticket} className="bg-white transition hover:bg-[#f8fbff]">
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-[#101828]">{ticket.solicitante || `Usuario #${ticket.id_usuario}`}</p>
                    <p className="text-xs text-[#52615f] capitalize">{ticket.rol}{ticket.contexto ? ` · ${ticket.contexto}` : ''}</p>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-sm text-[#223330]">{ticket.mensaje}</p>
                    {ticket.id_cita && <p className="text-xs text-[#52615f] mt-1">Cita #{ticket.id_cita}</p>}
                    {ticket.respuesta && (
                      <div className="mt-2 rounded-lg bg-[#d8f4ee] px-3 py-2">
                        <p className="text-xs font-extrabold text-[#006b5d]">Respuesta:</p>
                        <p className="text-xs text-[#101828]">{ticket.respuesta}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estadoClass[ticket.estado] || estadoClass.abierto}`}>
                      {formatEstado(ticket.estado)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">{formatDateTime(ticket.fecha_actualizacion)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {ticket.estado === 'abierto' && (
                        <button type="button" onClick={() => onActualizarTicket(ticket, 'en_revision')}
                          disabled={actionLoading === `ticket-${ticket.id_ticket}`}
                          className="rounded-xl border border-[#bdcbc7] bg-white px-3 py-1.5 text-xs font-extrabold text-[#355382] hover:bg-[#edf2ff] disabled:opacity-60">
                          Revisar
                        </button>
                      )}
                      {!['resuelto', 'cerrado'].includes(ticket.estado) && (
                        <button type="button" onClick={() => onActualizarTicket(ticket, 'resuelto')}
                          disabled={actionLoading === `ticket-${ticket.id_ticket}`}
                          className="medcare-primary-button px-3 py-1.5 text-xs disabled:opacity-60">
                          Resolver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}