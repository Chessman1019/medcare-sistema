import { formatTime12h } from '../../utils/timeFormat'
import AgendaEmptyState from '../../components/AgendaEmptyState'
import AgendaStatusBadge from '../../components/AgendaStatusBadge'
import FormError from '../../components/FormError'
import MedCareSelect from '../../components/MedCareSelect'
import { useFormValidation } from '../../hooks/useFormValidation'
import { validateAppointmentForm } from '../../utils/formValidation'

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function doctorFullName(doctor) {
  if (!doctor) return ''
  const name = `${doctor.usuario?.nombre || doctor.nombre || ''} ${doctor.usuario?.apellido || doctor.apellido || ''}`.trim()
  return name || 'Doctor disponible'
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function getHorarioDateValue(horario) {
  return horario?.fecha || horario?.fecha_hora?.slice(0, 10) || ''
}

function normalizeTimeValue(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || '')
  if (!match) return ''
  return `${pad2(Number(match[1]))}:${pad2(Number(match[2]))}`
}

function getHorarioStartTime(horario) {
  return normalizeTimeValue(horario?.hora_inicio || horario?.fecha_hora?.slice(11, 16))
}

function formatDateFriendly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '')
  if (!match) return value || 'Sin fecha'

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return dateFormatter.format(date)
}

function parseTimeMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || '')
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }
  return hour * 60 + minute
}

function minutesToTime(value) {
  const normalized = ((value % 1440) + 1440) % 1440
  return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`
}

function formatDurationLong(minutes) {
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
}

function getHorarioDurationMinutes(horario) {
  const start = parseTimeMinutes(getHorarioStartTime(horario))
  const end = parseTimeMinutes(horario?.hora_fin)
  if (start !== null && end !== null) {
    const diff = end > start ? end - start : end + 1440 - start
    return diff || 30
  }

  const configuredDuration = Number(horario?.duracion_min || horario?.duracion || horario?.duracionMin)
  return Number.isFinite(configuredDuration) && configuredDuration > 0 ? configuredDuration : 30
}

function getHorarioEndTime(horario) {
  const explicitEnd = normalizeTimeValue(horario?.hora_fin)
  if (explicitEnd) return explicitEnd

  const start = parseTimeMinutes(getHorarioStartTime(horario))
  if (start === null) return ''
  return minutesToTime(start + getHorarioDurationMinutes(horario))
}

function getHorarioDetails(horario) {
  if (!horario) return null

  const inicio = getHorarioStartTime(horario)
  const fin = getHorarioEndTime(horario)
  const duration = getHorarioDurationMinutes(horario)

  return {
    fecha: formatDateFriendly(getHorarioDateValue(horario)),
    inicio: formatTime12h(inicio) || inicio || 'Sin hora',
    fin: formatTime12h(fin) || fin || 'Sin hora',
    duracion: `${duration} min`,
    duracionLarga: formatDurationLong(duration),
  }
}

export default function PacienteAgendar({ form, setForm, especialidades, doctores, horarios, loading, loadingOptions, loadingHorarios, onEspecialidad, onDoctor, onSubmit }) {
  const { fieldErrors, applyErrors, clearFieldError, inputClass } = useFormValidation()
  const selectedEspecialidad = especialidades.find(i => String(i.id_especialidad) === String(form.id_especialidad))
  const selectedDoctor = doctores.find(i => String(i.id_usuario) === String(form.id_doctor))
  const selectedHorario = horarios.find(i => String(i.id_horario) === String(form.id_horario))
  const selectedHorarioDetails = getHorarioDetails(selectedHorario)

  const handleSubmit = (event) => {
    event.preventDefault()
    const validation = validateAppointmentForm(form)
    if (!validation.valid) {
      applyErrors(validation.errors)
      return
    }
    onSubmit(event)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-7 xl:grid-cols-[1fr_420px]">
      <div className="space-y-7">
        <div className="medcare-card-soft grid gap-4 p-5 sm:p-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          {[
            ['1', 'Especialidad', selectedEspecialidad?.nombre || 'Seleccionar'],
            ['2', 'Doctor', selectedDoctor ? `Dr. ${doctorFullName(selectedDoctor)}` : 'Seleccionar'],
            ['3', 'Fecha y hora', selectedHorarioDetails ? (
              <span className="block">
                <span className="block">{selectedHorarioDetails.fecha}</span>
                <span className="block">{selectedHorarioDetails.inicio} - {selectedHorarioDetails.fin} · {selectedHorarioDetails.duracion}</span>
              </span>
            ) : 'Elegir horario'],
          ].map(([step, title, detail], index) => {
            const isComplete = index === 0 ? Boolean(selectedEspecialidad) : index === 1 ? Boolean(selectedDoctor) : Boolean(selectedHorario)
            return (
              <div key={step} className="contents">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold transition ${isComplete ? 'bg-[#007a68] text-white shadow-sm' : 'bg-[#dbe6fb] text-[#223330]'}`}>{step}</div>
                  <div><p className="font-extrabold text-[#101828]">{title}</p><p className="text-sm text-[#52615f]">{detail}</p></div>
                </div>
                {index < 2 && <div className="hidden h-px w-16 bg-[#bdcbc7] md:block" />}
              </div>
            )
          })}
        </div>

        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <section className="medcare-card p-5 sm:p-7">
            <h3 className="text-2xl font-extrabold text-[#101828]">Selecciona especialista</h3>
            <div className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-[#223330]">
                Especialidad
                <MedCareSelect
                  className={inputClass('id_especialidad', 'medcare-input mt-2')}
                  onChange={(event) => {
                    clearFieldError('id_especialidad')
                    onEspecialidad(event)
                  }}
                  value={form.id_especialidad}
                  error={Boolean(fieldErrors.id_especialidad)}
                  options={[
                    { value: '', label: 'Selecciona una especialidad' },
                    ...especialidades.map(i => ({ value: i.id_especialidad, label: i.nombre })),
                  ]}
                />
                <FormError message={fieldErrors.id_especialidad} />
              </label>
              <label className="block text-sm font-bold text-[#223330]">
                Doctor
                <MedCareSelect
                  className={inputClass('id_doctor', 'medcare-input mt-2 disabled:cursor-not-allowed')}
                  onChange={(event) => {
                    clearFieldError('id_doctor')
                    onDoctor(event)
                  }}
                  value={form.id_doctor}
                  disabled={!doctores.length || loadingOptions}
                  error={Boolean(fieldErrors.id_doctor)}
                  options={[
                    { value: '', label: loadingOptions ? 'Cargando doctores...' : 'Selecciona un doctor' },
                    ...doctores.map(d => ({ value: d.id_usuario, label: `Dr. ${doctorFullName(d)}` })),
                  ]}
                />
                <FormError message={fieldErrors.id_doctor} />
              </label>
              <label className="block text-sm font-bold text-[#223330]">
                Motivo de consulta
                <textarea className="medcare-input mt-2 min-h-28" placeholder="Describe brevemente el motivo..." value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} />
              </label>
            </div>
          </section>

          <section className="medcare-card p-5 sm:p-7">
            <h3 className="text-2xl font-extrabold text-[#101828]">Fecha y hora</h3>
            <p className="mt-2 text-sm text-[#52615f]">Horarios disponibles para el doctor seleccionado.</p>
            <div className="mt-6 grid grid-cols-1 gap-3 2xl:grid-cols-2">
              {loadingHorarios ? (
                <p className="col-span-2 rounded-xl bg-[#edf2ff] p-5 text-sm text-[#52615f]">Cargando horarios disponibles...</p>
              ) : horarios.length === 0 ? (
                <div className="col-span-2">
                  <AgendaEmptyState
                    compact
                    icon={form.id_doctor ? 'event_busy' : 'person_search'}
                    title={form.id_doctor ? 'No hay horarios disponibles' : 'Selecciona un doctor para ver disponibilidad'}
                    description={form.id_doctor ? 'Este doctor no tiene horarios libres para solicitar en este momento.' : 'Cuando elijas un doctor, solo veras horarios realmente disponibles.'}
                  />
                </div>
              ) : horarios.map(horario => {
                const selected = String(form.id_horario) === String(horario.id_horario)
                const details = getHorarioDetails(horario)
                return (
                  <button key={horario.id_horario} type="button" onClick={() => setForm(f => ({ ...f, id_horario: horario.id_horario }))}
                    aria-pressed={selected}
                    className={`rounded-xl border p-4 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] ${selected ? 'border-[#006b5d] bg-[#e5fbf7] text-[#006b5d] shadow-sm' : 'border-[#bdcbc7] bg-white text-[#101828] hover:border-[#006b5d]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Fecha</p>
                        <p className="mt-1 text-lg font-extrabold text-[#101828]">{details.fecha}</p>
                      </div>
                      {selected ? <span className="material-symbols-outlined text-[20px] text-[#006b5d]">check_circle</span> : <AgendaStatusBadge status="disponible" showIcon={false} />}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white/75 p-2">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#52615f]">Inicio</p>
                        <p className="mt-0.5 font-extrabold text-[#101828]">{details.inicio}</p>
                      </div>
                      <div className="rounded-lg bg-white/75 p-2">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#52615f]">Fin</p>
                        <p className="mt-0.5 font-extrabold text-[#101828]">{details.fin}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-extrabold text-[#006b5d]">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      Duración: {details.duracionLarga}
                    </p>
                  </button>
                )
              })}
            </div>
            <button type="submit" disabled={loading || !form.id_horario} className="medcare-primary-button mt-7 flex w-full items-center justify-center gap-2 py-4 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Registrando...' : 'Confirmar solicitud'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </section>
        </form>
      </div>

      <aside className="medcare-card h-fit overflow-hidden xl:sticky xl:top-28">
        <div className="bg-[#007a68] p-7 text-white"><h3 className="text-2xl font-extrabold">Resumen de cita</h3></div>
        <div className="space-y-6 p-7">
          <div><p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Especialidad</p><p className="mt-1 text-lg font-extrabold">{selectedEspecialidad?.nombre || 'Pendiente'}</p></div>
          <div><p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Doctor</p><p className="mt-1 text-lg font-extrabold">{selectedDoctor ? `Dr. ${doctorFullName(selectedDoctor)}` : 'Pendiente'}</p></div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Estado</p>
            <div className="mt-2">
              <AgendaStatusBadge status={selectedHorario ? 'pendiente' : 'disponible'} size="md" />
            </div>
            <p className="mt-2 text-sm font-semibold text-[#52615f]">
              {selectedHorario ? 'Al confirmar, la cita quedara pendiente de validacion.' : 'Elige un horario disponible para completar la solicitud.'}
            </p>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Fecha y hora</p>
            {selectedHorarioDetails ? (
              <div className="mt-3 rounded-xl border border-[#d8e3fb] bg-[#f8fbff] p-4">
                <p className="text-lg font-extrabold text-[#101828]">{selectedHorarioDetails.fecha}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-extrabold uppercase tracking-wide text-[#006b5d]">Inicio</dt>
                    <dd className="mt-1 font-extrabold text-[#101828]">{selectedHorarioDetails.inicio}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-extrabold uppercase tracking-wide text-[#006b5d]">Fin</dt>
                    <dd className="mt-1 font-extrabold text-[#101828]">{selectedHorarioDetails.fin}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-extrabold uppercase tracking-wide text-[#006b5d]">Duración</dt>
                    <dd className="mt-1 font-extrabold text-[#101828]">{selectedHorarioDetails.duracionLarga}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-1 text-lg font-extrabold">Pendiente</p>
            )}
          </div>
          <div className="border-t border-dashed border-[#bdcbc7] pt-6 text-sm text-[#52615f]">Recibirás la confirmación cuando recepción valide la disponibilidad.</div>
        </div>
      </aside>
    </div>
  )
}
