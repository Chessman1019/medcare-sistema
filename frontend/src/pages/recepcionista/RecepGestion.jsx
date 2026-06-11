const estadoClass = { pendiente: 'bg-amber-50 text-amber-700 border-amber-200', confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200', reprogramada: 'bg-violet-50 text-violet-700 border-violet-200', en_atencion: 'bg-sky-50 text-sky-700 border-sky-200', cancelada: 'bg-rose-50 text-rose-700 border-rose-200', completada: 'bg-slate-100 text-slate-700 border-slate-200' }
const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const dangerButton = 'rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatEstado(value) {
  const labels = { pendiente: 'Pendiente', confirmada: 'Confirmada', reprogramada: 'Reprogramada', en_atencion: 'En atención', cancelada: 'Cancelada', completada: 'Completada' }
  return labels[value] || (value || 'Pendiente').replaceAll('_', ' ')
}
function doctorLabel(doctor) {
  if (!doctor) return 'Doctor no asignado'
  const source = doctor.usuario || doctor
  return [source.nombre, source.apellido].filter(Boolean).join(' ') || 'Doctor'
}

export default function RecepGestion({ citasFiltradas, doctores, reprogramacion, setReprogramacion, actionLoading, onCambiarEstado, onAbrirReprogramacion, onGuardarReprogramacion, onCambiarDoctorReprogramacion }) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gestión de citas</h2>
        <p className="mt-1 text-sm text-slate-500">Confirmación, reprogramación, asistencia y salida.</p>
      </div>

      {reprogramacion && (
        <form onSubmit={onGuardarReprogramacion} className="rounded-lg border border-violet-200 bg-violet-50 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-violet-950">Reprogramar cita #{reprogramacion.cita.id_cita}</h3>
            <p className="text-sm text-violet-700">{reprogramacion.cita.paciente}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <select className={inputClass} value={reprogramacion.id_doctor} onChange={e => onCambiarDoctorReprogramacion(e.target.value)}>
              {doctores.map(doctor => (
                <option key={doctor.id_usuario} value={doctor.id_usuario}>Dr. {doctorLabel(doctor)}</option>
              ))}
            </select>
            <select className={inputClass} required value={reprogramacion.id_horario} onChange={e => setReprogramacion({ ...reprogramacion, id_horario: e.target.value })} disabled={reprogramacion.loading}>
              <option value="">{reprogramacion.loading ? 'Cargando horarios...' : 'Nuevo horario'}</option>
              {reprogramacion.horarios.map(h => (
                <option key={h.id_horario} value={h.id_horario}>{h.fecha} - {h.hora_inicio} a {h.hora_fin}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={actionLoading === 'reprogramar'} className={primaryButton}>
                {actionLoading === 'reprogramar' ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setReprogramacion(null)} className={secondaryButton}>Cancelar</button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Paciente', 'Doctor', 'Fecha', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {citasFiltradas.map(cita => (
              <tr key={cita.id_cita} className="transition hover:bg-[#f8fbff]">
                <td className="px-4 py-3"><p className="font-medium text-slate-900">{cita.paciente}</p><p className="text-xs text-slate-500">{cita.dni}</p></td>
                <td className="px-4 py-3 text-slate-600">Dr. {cita.doctor}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(cita.fecha_hora)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>{formatEstado(cita.estado)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {cita.estado === 'pendiente' && (
                      <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'confirmar')} disabled={actionLoading === `confirmar-${cita.id_cita}`} className={primaryButton}>
                        {actionLoading === `confirmar-${cita.id_cita}` ? '...' : 'Confirmar'}
                      </button>
                    )}
                    {['pendiente', 'confirmada', 'reprogramada'].includes(cita.estado) && (
                      <button type="button" onClick={() => onAbrirReprogramacion(cita)} className={secondaryButton}>Reprogramar</button>
                    )}
                    {['confirmada', 'reprogramada'].includes(cita.estado) && (
                      <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'asistencia')} disabled={actionLoading === `asistencia-${cita.id_cita}`} className={primaryButton}>
                        {actionLoading === `asistencia-${cita.id_cita}` ? '...' : 'Asistencia'}
                      </button>
                    )}
                    {cita.estado === 'en_atencion' && (
                      <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'salida')} disabled={actionLoading === `salida-${cita.id_cita}`} className={primaryButton}>
                        {actionLoading === `salida-${cita.id_cita}` ? '...' : 'Salida'}
                      </button>
                    )}
                    {!['cancelada', 'completada'].includes(cita.estado) && (
                      <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'cancelar')} disabled={actionLoading === `cancelar-${cita.id_cita}`} className={dangerButton}>
                        {actionLoading === `cancelar-${cita.id_cita}` ? '...' : 'Cancelar'}
                      </button>
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