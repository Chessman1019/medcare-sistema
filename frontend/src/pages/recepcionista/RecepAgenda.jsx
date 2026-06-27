import { useState } from 'react'
import HorarioDisponibleForm from '../../components/HorarioDisponibleForm'

const estadoClass = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
}
const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'

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

export default function RecepAgenda({ citasFiltradas, filtros, setFiltros, doctores, horariosAgenda, agendaDoctor, onCargarDisponibilidad, onCrearHorario, onGoToTab, onShowMessage }) {
  const [mostrarHorarioForm, setMostrarHorarioForm] = useState(false)

  function doctorLabel(doctor) {
    if (!doctor) return 'Doctor no asignado'
    const source = doctor.usuario || doctor
    return [source.nombre, source.apellido].filter(Boolean).join(' ') || doctor.doctor || 'Doctor'
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Agenda global</h2>
        <p className="mt-1 text-sm text-slate-500">Calendario operativo y disponibilidad por doctor.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr] xl:gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="date" className={inputClass} value={filtros.fecha} onChange={e => setFiltros({ ...filtros, fecha: e.target.value })} />
            <input className={inputClass} placeholder="Buscar doctor" value={filtros.doctor} onChange={e => setFiltros({ ...filtros, doctor: e.target.value })} />
            <select className={inputClass} value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="reprogramada">Reprogramada</option>
              <option value="en_atencion">En atención</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="divide-y divide-slate-100">
            {citasFiltradas.slice(0, 12).map(cita => (
              <button key={cita.id_cita} type="button" onClick={() => onGoToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })}
                className="grid w-full grid-cols-1 items-start gap-2 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-3">
                <span className="font-medium text-slate-900">{cita.paciente}</span>
                <span className="text-slate-600">Dr. {cita.doctor}</span>
                <span className="text-slate-500">{formatDateTime(cita.fecha_hora)}</span>
                <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>{formatEstado(cita.estado)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {mostrarHorarioForm && (
            <HorarioDisponibleForm
              key={agendaDoctor || 'nuevo-horario'}
              doctores={doctores}
              initialDoctorId={agendaDoctor}
              onSubmit={onCrearHorario}
              onCancel={() => setMostrarHorarioForm(false)}
            />
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">Disponibilidad</h3>
              <button type="button" onClick={() => setMostrarHorarioForm(value => !value)}
                className="rounded-lg bg-[#007a68] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                Agregar más fechas y horas disponibles
              </button>
            </div>
            <select className={`mt-4 w-full ${inputClass}`} value={agendaDoctor} onChange={e => onCargarDisponibilidad(e.target.value)}>
              <option value="">Selecciona doctor</option>
              {doctores.map(doctor => (
                <option key={doctor.id_usuario} value={doctor.id_usuario}>Dr. {doctorLabel(doctor)}</option>
              ))}
            </select>
            <div className="mt-4 space-y-2">
              {horariosAgenda.length === 0 ? (
                <p className="text-sm text-slate-500">Sin horarios libres seleccionados.</p>
              ) : horariosAgenda.slice(0, 8).map(horario => (
                <button key={horario.id_horario} type="button" onClick={() => onShowMessage(`Horario libre: ${horario.fecha} ${horario.hora_inicio}`)}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[#e5fbf7] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15">
                  {horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
