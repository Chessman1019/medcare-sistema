import { useState } from 'react'
import AgendaEmptyState from '../../components/AgendaEmptyState'
import AgendaStatusBadge from '../../components/AgendaStatusBadge'
import HorarioDisponibleForm from '../../components/HorarioDisponibleForm'
import MedCareSelect from '../../components/MedCareSelect'
import { DateWheelPicker } from '../../components/WheelPickers'
import { formatAgendaDate, formatAgendaDateTime } from '../../utils/agendaDisplay'
import { formatTime12h } from '../../utils/timeFormat'

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'

function doctorLabel(doctor) {
  if (!doctor) return 'Doctor no asignado'
  const source = doctor.usuario || doctor
  return [source.nombre, source.apellido].filter(Boolean).join(' ') || 'Doctor'
}

function agendaKey(item, index) {
  return `${item.tipo || 'item'}-${item.id_cita || item.id_horario || index}-${item.estado || 'estado'}`
}

function agendaFecha(item) {
  return item.fecha || item.fecha_hora?.slice(0, 10) || 'Sin fecha'
}

function agendaHoraInicio(item) {
  return item.hora_inicio || item.fecha_hora?.slice(11, 16) || ''
}

function agendaHoraFin(item) {
  return item.hora_fin || item.fecha_fin?.slice(11, 16) || ''
}

export default function RecepAgenda({
  citasFiltradas,
  filtros,
  setFiltros,
  doctores,
  especialidades = [],
  horariosAgenda,
  agendaDoctor,
  agendaFiltros,
  setAgendaFiltros,
  onCrearHorario,
  onGoToTab,
}) {
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
                  { value: 'disponible', label: 'Disponible' },
                  { value: 'ocupado', label: 'Ocupado' },
                  { value: 'pendiente', label: 'Pendiente' },
                  { value: 'confirmada', label: 'Confirmada' },
                  { value: 'reprogramada', label: 'Reprogramada' },
                  { value: 'en_atencion', label: 'En atencion' },
                  { value: 'completada', label: 'Completada' },
                  { value: 'cancelada', label: 'Cancelada' },
                ]}
              />
            </div>
          </div>
          <div className="divide-y divide-[#bdcbc7]">
            {citasFiltradas.length === 0 ? (
              <div className="p-5">
                <AgendaEmptyState
                  icon="event_note"
                  title="No hay citas para los filtros seleccionados"
                  description="Cambia la fecha, doctor o estado para revisar mas resultados."
                />
              </div>
            ) : citasFiltradas.map(cita => (
              <button key={cita.id_cita} type="button"
                onClick={() => onGoToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })}
                className="grid w-full grid-cols-1 items-start gap-3 bg-white px-6 py-4 text-left transition hover:bg-[#f8fbff] md:grid-cols-[1.1fr_1fr_1fr_auto] md:items-center">
                <span className="min-w-0">
                  <span className="block font-extrabold text-[#101828]">{cita.paciente}</span>
                  <span className="block text-xs font-semibold text-[#52615f]">{cita.especialidad || 'Sin especialidad'}</span>
                </span>
                <span className="text-sm font-semibold text-[#52615f]">Dr. {cita.doctor}</span>
                <span className="text-sm text-[#52615f]">{formatAgendaDateTime(cita.fecha_hora)}</span>
                <AgendaStatusBadge status={cita.estado} />
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
              <div>
                <h3 className="font-extrabold text-[#101828]">Disponibilidad</h3>
                <p className="mt-1 text-xs font-bold text-[#52615f]">Horarios libres y ocupados del doctor.</p>
              </div>
              <button type="button" onClick={() => setMostrarHorarioForm(value => !value)}
                className="rounded-xl bg-[#007a68] px-3 py-2 text-xs font-extrabold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                Agregar horas
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <MedCareSelect
                className={`w-full ${inputClass}`}
                value={agendaFiltros.id_doctor}
                onChange={e => setAgendaFiltros({ ...agendaFiltros, id_doctor: e.target.value })}
                options={[
                  { value: '', label: 'Todos los doctores' },
                  ...doctores.map(doctor => ({
                    value: doctor.id_usuario,
                    label: `Dr. ${doctorLabel(doctor)}`,
                  })),
                ]}
              />
              <MedCareSelect
                className={`w-full ${inputClass}`}
                value={agendaFiltros.id_especialidad}
                onChange={e => setAgendaFiltros({ ...agendaFiltros, id_especialidad: e.target.value })}
                options={[
                  { value: '', label: 'Todas las especialidades' },
                  ...especialidades.map(especialidad => ({
                    value: especialidad.id_especialidad,
                    label: especialidad.nombre,
                  })),
                ]}
              />
              <input
                className={`w-full ${inputClass}`}
                placeholder="Buscar paciente"
                value={agendaFiltros.paciente}
                onChange={e => setAgendaFiltros({ ...agendaFiltros, paciente: e.target.value })}
              />
              <DateWheelPicker
                value={agendaFiltros.fecha}
                onChange={fecha => setAgendaFiltros({ ...agendaFiltros, fecha })}
                clearable
                inputClassName={`w-full ${inputClass}`}
              />
              <MedCareSelect
                className={`w-full ${inputClass}`}
                value={agendaFiltros.estado}
                onChange={e => setAgendaFiltros({ ...agendaFiltros, estado: e.target.value })}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'disponible', label: 'Disponible' },
                  { value: 'ocupado', label: 'Ocupado' },
                  { value: 'pendiente', label: 'Pendiente' },
                  { value: 'confirmada', label: 'Confirmada' },
                  { value: 'reprogramada', label: 'Reprogramada' },
                  { value: 'en_atencion', label: 'En atencion' },
                  { value: 'cancelada', label: 'Cancelada' },
                  { value: 'completada', label: 'Completada' },
                ]}
              />
              <button type="button" onClick={() => setAgendaFiltros({ id_doctor: '', id_especialidad: '', paciente: '', fecha: '', estado: '' })}
                className="text-left text-xs font-bold text-[#006b5d] hover:underline">
                Limpiar filtros de agenda
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {horariosAgenda.length === 0 ? (
                <AgendaEmptyState
                  compact
                  icon="free_cancellation"
                  title="Sin horarios para mostrar"
                  description="Selecciona un doctor o fecha para revisar disponibilidad."
                />
              ) : horariosAgenda.map((item, index) => (
                <div key={agendaKey(item, index)}
                  className="rounded-xl border border-[#d5dfef] bg-[#f8fbff] px-4 py-3 text-sm text-[#223330]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">{formatAgendaDate(agendaFecha(item))}</p>
                      <p className="mt-1 font-extrabold">
                        {formatTime12h(agendaHoraInicio(item)) || agendaHoraInicio(item) || 'Sin inicio'} a {formatTime12h(agendaHoraFin(item)) || agendaHoraFin(item) || 'Sin fin'}
                      </p>
                    </div>
                    <AgendaStatusBadge status={item.estado} />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs font-bold text-[#52615f]">
                    <p>Doctor: Dr. {item.doctor || 'Sin doctor asignado'}</p>
                    <p>Paciente: {item.paciente || 'Sin paciente asignado'}</p>
                    <p>Especialidad: {item.especialidad || 'Sin especialidad'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
