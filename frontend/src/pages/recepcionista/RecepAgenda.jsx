import { useState } from 'react'
import HorarioDisponibleForm from '../../components/HorarioDisponibleForm'
import MedCareSelect from '../../components/MedCareSelect'
import { DateWheelPicker } from '../../components/WheelPickers'
import { formatTime12h } from '../../utils/timeFormat'

const estadoClass = {
  pendiente:    'bg-[#faeeda] text-[#854F0B]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
  completada:   'bg-[#f5f5f2] text-[#46514f]',
}
const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'

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

export default function RecepAgenda({ citasFiltradas, filtros, setFiltros, doctores, horariosAgenda, agendaDoctor, onCargarDisponibilidad, onCrearHorario, onGoToTab }) {
  const [mostrarHorarioForm, setMostrarHorarioForm] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Agenda global</h2>
        <p className="mt-2 text-lg text-[#52615f]">Calendario operativo y disponibilidad por doctor.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="medcare-card overflow-hidden">
          <div className="border-b border-[#bdcbc7] bg-[#f8fbff] px-6 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <DateWheelPicker
                value={filtros.fecha}
                onChange={fecha => setFiltros({ ...filtros, fecha })}
                clearable
                inputClassName={`w-full ${inputClass}`}
              />
              <input className={inputClass} placeholder="Buscar doctor" value={filtros.doctor}
                onChange={e => setFiltros({ ...filtros, doctor: e.target.value })} />
              <MedCareSelect
                className={inputClass}
                value={filtros.estado}
                onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'pendiente', label: 'Pendiente' },
                  { value: 'confirmada', label: 'Confirmada' },
                  { value: 'reprogramada', label: 'Reprogramada' },
                  { value: 'en_atencion', label: 'En atención' },
                  { value: 'completada', label: 'Completada' },
                  { value: 'cancelada', label: 'Cancelada' },
                ]}
              />
            </div>
          </div>
          <div className="divide-y divide-[#bdcbc7]">
            {citasFiltradas.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">event_note</span>
                <p className="mt-3 font-bold text-[#52615f]">No hay citas con esos filtros.</p>
              </div>
            ) : citasFiltradas.slice(0, 12).map(cita => (
              <button key={cita.id_cita} type="button"
                onClick={() => onGoToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })}
                className="grid w-full grid-cols-1 items-start gap-2 bg-white px-6 py-4 text-left transition hover:bg-[#f8fbff] md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
                <span className="font-extrabold text-[#101828]">{cita.paciente}</span>
                <span className="text-sm text-[#52615f]">Dr. {cita.doctor}</span>
                <span className="text-sm text-[#52615f]">{formatDateTime(cita.fecha_hora)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                  {formatEstado(cita.estado)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 h-fit xl:sticky xl:top-28">
          {mostrarHorarioForm && (
            <HorarioDisponibleForm
              key={agendaDoctor || 'nuevo-horario'}
              doctores={doctores}
              initialDoctorId={agendaDoctor}
              onSubmit={onCrearHorario}
              onCancel={() => setMostrarHorarioForm(false)}
            />
          )}

          <div className="medcare-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-extrabold text-[#101828]">Disponibilidad</h3>
              <button type="button" onClick={() => setMostrarHorarioForm(value => !value)}
                className="rounded-xl bg-[#007a68] px-3 py-2 text-xs font-extrabold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                Agregar más fechas y horas disponibles
              </button>
            </div>
            <MedCareSelect
              className={`w-full ${inputClass}`}
              value={agendaDoctor}
              onChange={e => onCargarDisponibilidad(e.target.value)}
              options={[
                { value: '', label: 'Selecciona doctor' },
                ...doctores.map(doctor => ({
                  value: doctor.id_usuario,
                  label: `Dr. ${doctorLabel(doctor)}`,
                })),
              ]}
            />
            <div className="mt-4 space-y-2">
              {horariosAgenda.length === 0 ? (
                <p className="rounded-xl bg-[#edf2ff] p-4 text-sm text-[#52615f]">Sin horarios libres.</p>
              ) : horariosAgenda.slice(0, 8).map(horario => (
                <div key={horario.id_horario}
                  className="rounded-xl bg-[#f8fbff] px-4 py-3 text-sm font-bold text-[#223330]">
                  {horario.fecha} · {formatTime12h(horario.hora_inicio) || horario.hora_inicio} a {formatTime12h(horario.hora_fin) || horario.hora_fin}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
