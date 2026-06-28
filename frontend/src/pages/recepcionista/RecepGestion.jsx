import { useEffect, useRef } from 'react'

const estadoClass = {
  pendiente:    'bg-[#faeeda] text-[#854F0B]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
  completada:   'bg-[#f5f5f2] text-[#46514f]',
}
const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-[#f8fbff]'

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

export default function RecepGestion({ citasFiltradas, doctores, citaNotificada, reprogramacion, setReprogramacion, actionLoading, onCambiarEstado, onAbrirReprogramacion, onGuardarReprogramacion, onCambiarDoctorReprogramacion }) {
  const rowRefs = useRef({})

  useEffect(() => {
    if (!citaNotificada?.id_cita) return
    window.setTimeout(() => {
      rowRefs.current[citaNotificada.id_cita]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }, [citaNotificada])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Gestión de citas</h2>
        <p className="mt-2 text-lg text-[#52615f]">Confirmación, reprogramación, asistencia y salida.</p>
      </div>

      {reprogramacion && (
        <form onSubmit={onGuardarReprogramacion} className="medcare-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8edff] text-[#355382]">
              <span className="material-symbols-outlined">edit_calendar</span>
            </span>
            <div>
              <h3 className="font-extrabold text-[#101828]">Reprogramar cita #{reprogramacion.cita.id_cita}</h3>
              <p className="text-sm text-[#52615f]">{reprogramacion.cita.paciente}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <select className={inputClass} value={reprogramacion.id_doctor}
              onChange={e => onCambiarDoctorReprogramacion(e.target.value)}>
              {doctores.map(doctor => (
                <option key={doctor.id_usuario} value={doctor.id_usuario}>Dr. {doctorLabel(doctor)}</option>
              ))}
            </select>
            <select className={inputClass} required value={reprogramacion.id_horario}
              onChange={e => setReprogramacion({ ...reprogramacion, id_horario: e.target.value })}
              disabled={reprogramacion.loading}>
              <option value="">{reprogramacion.loading ? 'Cargando horarios...' : 'Nuevo horario'}</option>
              {reprogramacion.horarios.map(h => (
                <option key={h.id_horario} value={h.id_horario}>{h.fecha} - {h.hora_inicio} a {h.hora_fin}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={actionLoading === 'reprogramar'}
                className="medcare-primary-button px-5 py-2.5 disabled:opacity-60">
                {actionLoading === 'reprogramar' ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setReprogramacion(null)}
                className="rounded-xl border border-[#bdcbc7] bg-white px-4 py-2.5 text-sm font-extrabold text-[#223330] hover:bg-[#f8fbff]">
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="medcare-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
              <tr>
                {['Paciente', 'Doctor', 'Fecha', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {citasFiltradas.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-[#52615f]">No hay citas con esos filtros.</td></tr>
              ) : citasFiltradas.map(cita => (
                <tr
                  key={cita.id_cita}
                  ref={node => { if (node) rowRefs.current[cita.id_cita] = node }}
                  className={`${String(cita.id_cita) === String(citaNotificada?.id_cita) ? 'bg-[#f4fffc] ring-2 ring-inset ring-[#12b8a3]/45' : 'bg-white'} transition hover:bg-[#f8fbff]`}
                >
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-[#101828]">{cita.paciente}</p>
                    <p className="text-xs text-[#52615f]">{cita.dni}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">Dr. {cita.doctor}</td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">{formatDateTime(cita.fecha_hora)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                      {formatEstado(cita.estado)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {cita.estado === 'pendiente' && (
                        <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'confirmar')}
                          disabled={actionLoading === `confirmar-${cita.id_cita}`}
                          className="medcare-primary-button px-3 py-1.5 text-xs disabled:opacity-60">
                          {actionLoading === `confirmar-${cita.id_cita}` ? '...' : 'Confirmar'}
                        </button>
                      )}
                      {['pendiente', 'confirmada', 'reprogramada'].includes(cita.estado) && (
                        <button type="button" onClick={() => onAbrirReprogramacion(cita)}
                          className="rounded-xl border border-[#bdcbc7] bg-white px-3 py-1.5 text-xs font-extrabold text-[#223330] hover:bg-[#f4fffc] hover:border-[#12b8a3]">
                          Reprogramar
                        </button>
                      )}
                      {['confirmada', 'reprogramada'].includes(cita.estado) && (
                        <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'asistencia')}
                          disabled={actionLoading === `asistencia-${cita.id_cita}`}
                          className="medcare-primary-button px-3 py-1.5 text-xs disabled:opacity-60">
                          {actionLoading === `asistencia-${cita.id_cita}` ? '...' : 'Asistencia'}
                        </button>
                      )}
                      {cita.estado === 'confirmada' && (
                        <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'completar')}
                          disabled={actionLoading === `completar-${cita.id_cita}`}
                          className="rounded-xl bg-[#355382] px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-[#263f66] disabled:opacity-60">
                          {actionLoading === `completar-${cita.id_cita}` ? '...' : 'Completar'}
                        </button>
                      )}
                      {cita.estado === 'en_atencion' && (
                        <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'salida')}
                          disabled={actionLoading === `salida-${cita.id_cita}`}
                          className="medcare-primary-button px-3 py-1.5 text-xs disabled:opacity-60">
                          {actionLoading === `salida-${cita.id_cita}` ? '...' : 'Salida'}
                        </button>
                      )}
                      {!['cancelada', 'completada'].includes(cita.estado) && (
                        <button type="button" onClick={() => onCambiarEstado(cita.id_cita, 'cancelar')}
                          disabled={actionLoading === `cancelar-${cita.id_cita}`}
                          className="rounded-xl border border-[#ffb4ab] bg-white px-3 py-1.5 text-xs font-extrabold text-[#93000a] hover:bg-[#fff0ef] disabled:opacity-60">
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
      </div>
    </div>
  )
}
