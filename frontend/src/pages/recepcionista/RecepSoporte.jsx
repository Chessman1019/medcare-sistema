const ticketEstadoClass = {
  abierto: 'bg-amber-50 text-amber-700 border-amber-200',
  en_revision: 'bg-sky-50 text-sky-700 border-sky-200',
  resuelto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cerrado: 'bg-slate-100 text-slate-700 border-slate-200',
}
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatTicketEstado(value) {
  const labels = { abierto: 'Abierto', en_revision: 'En revisión', resuelto: 'Resuelto', cerrado: 'Cerrado' }
  return labels[value] || (value || 'Abierto').replaceAll('_', ' ')
}

export default function RecepSoporte({ soporteTickets, actionLoading, onActualizarTicket, onCrearTicketInterno }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tickets de soporte</h2>
          <p className="mt-1 text-sm text-slate-500">Solicitudes de pacientes, médicos y recepción.</p>
        </div>
        <button type="button" onClick={onCrearTicketInterno} disabled={actionLoading === 'soporte'} className={primaryButton}>
          {actionLoading === 'soporte' ? 'Registrando...' : 'Crear ticket interno'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Abiertos', soporteTickets.filter(t => t.estado === 'abierto').length],
          ['En revisión', soporteTickets.filter(t => t.estado === 'en_revision').length],
          ['Resueltos', soporteTickets.filter(t => t.estado === 'resuelto').length],
          ['Total', soporteTickets.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{['Solicitante', 'Mensaje', 'Estado', 'Fecha', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {soporteTickets.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No hay tickets de soporte registrados.</td></tr>
            ) : soporteTickets.map(ticket => (
              <tr key={ticket.id_ticket} className="transition hover:bg-[#f8fbff]">
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">{ticket.solicitante || `Usuario #${ticket.id_usuario || 'sin registrar'}`}</p>
                  <p className="text-xs text-slate-500">{ticket.rol}{ticket.contexto ? ` - ${ticket.contexto}` : ''}</p>
                </td>
                <td className="max-w-md px-4 py-4 text-slate-700">
                  <p>{ticket.mensaje}</p>
                  {ticket.id_cita && <p className="mt-1 text-xs text-slate-500">Cita #{ticket.id_cita}</p>}
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-md border px-2 py-1 text-xs font-medium ${ticketEstadoClass[ticket.estado] || ticketEstadoClass.abierto}`}>
                    {formatTicketEstado(ticket.estado)}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{formatDateTime(ticket.fecha_actualizacion)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {ticket.estado === 'abierto' && (
                      <button type="button" onClick={() => onActualizarTicket(ticket, 'en_revision')} disabled={actionLoading === `ticket-${ticket.id_ticket}`} className={secondaryButton}>Revisar</button>
                    )}
                    {!['resuelto', 'cerrado'].includes(ticket.estado) && (
                      <button type="button" onClick={() => onActualizarTicket(ticket, 'resuelto')} disabled={actionLoading === `ticket-${ticket.id_ticket}`} className={primaryButton}>Resolver</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}