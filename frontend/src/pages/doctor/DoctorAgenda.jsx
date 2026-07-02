import AgendaEmptyState from '../../components/AgendaEmptyState'
import AgendaStatusBadge from '../../components/AgendaStatusBadge'
import MedCareSelect from '../../components/MedCareSelect'
import { DateWheelPicker } from '../../components/WheelPickers'
import { formatAgendaDate, formatAgendaDateTime } from '../../utils/agendaDisplay'
import { formatTime12h } from '../../utils/timeFormat'

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'

function agendaKey(item, index) {
  return `${item.tipo || 'item'}-${item.id_cita || item.id_horario || index}-${item.estado || 'estado'}`
}

function agendaHoraInicio(item) {
  return item.hora_inicio || item.fecha_hora?.slice(11, 16) || ''
}

function agendaHoraFin(item) {
  return item.hora_fin || item.fecha_fin?.slice(11, 16) || ''
}

function agendaFecha(item) {
  return item.fecha || item.fecha_hora?.slice(0, 10) || ''
}

function isTodayAgendaItem(item) {
  const rawDate = item.fecha || item.fecha_hora?.slice(0, 10)
  if (!rawDate) return false
  return rawDate === new Date().toISOString().slice(0, 10)
}

export default function DoctorAgenda({
  agendaItems,
  agendaLoading,
  agendaError,
  agendaFiltros,
  setAgendaFiltros,
  enAtencion,
  pacientesUnicos,
  onAtender,
  onRefresh,
}) {
  const citasAgenda = agendaItems.filter(item => item.tipo === 'cita')
  const horariosDisponibles = agendaItems.filter(item => item.estado === 'disponible')
  const citasHoy = agendaItems.filter(item => item.tipo === 'cita' && isTodayAgendaItem(item) && item.estado !== 'cancelada')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Mi agenda</h2>
          <p className="mt-2 text-lg text-[#52615f]">Citas y horarios asignados a tu cuenta medica.</p>
        </div>
        <button type="button" onClick={onRefresh} className="flex items-center gap-2 medcare-secondary-button px-4 py-2">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Citas visibles', value: citasAgenda.length, icon: 'calendar_month', color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]' },
          { label: 'Citas de hoy', value: citasHoy.length, icon: 'today', color: 'text-[#006b5d]', bg: 'bg-[#e5fbf7]' },
          { label: 'En atencion', value: enAtencion.length, icon: 'medical_services', color: 'text-[#355382]', bg: 'bg-[#edf2ff]' },
          { label: 'Horarios libres', value: horariosDisponibles.length, icon: 'schedule', color: 'text-[#854F0B]', bg: 'bg-[#faeeda]' },
          { label: 'Pacientes', value: pacientesUnicos.length, icon: 'group', color: 'text-[#46514f]', bg: 'bg-[#f5f5f2]' },
        ].map(s => (
          <div key={s.label} className="medcare-card p-5 text-center">
            <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center mx-auto`}>
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#52615f] mt-1 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="medcare-card p-5">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#006b5d] mb-4">Filtros de agenda</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-[#223330] mb-1">Fecha</label>
            <DateWheelPicker
              value={agendaFiltros.fecha}
              onChange={fecha => setAgendaFiltros({ ...agendaFiltros, fecha })}
              clearable
              inputClassName={`w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#223330] mb-1">Estado</label>
            <MedCareSelect
              className={inputClass}
              value={agendaFiltros.estado}
              onChange={e => setAgendaFiltros({ ...agendaFiltros, estado: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'disponible', label: 'Disponible' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'confirmada', label: 'Confirmada' },
                { value: 'reprogramada', label: 'Reprogramada' },
                { value: 'en_atencion', label: 'En atencion' },
                { value: 'cancelada', label: 'Cancelada' },
                { value: 'completada', label: 'Completada' },
              ]}
            />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={() => setAgendaFiltros({ fecha: '', estado: '' })}
              className="rounded-xl border border-[#bdcbc7] bg-white px-4 py-2.5 text-sm font-extrabold text-[#223330] transition hover:bg-[#f8fbff]">
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="medcare-card overflow-hidden">
        <div className="border-b border-[#bdcbc7] bg-[#f8fbff] px-6 py-4">
          <h3 className="font-extrabold text-[#101828]">Agenda medica</h3>
          <p className="mt-1 text-sm font-semibold text-[#52615f]">Ordenada por horario para ubicar rapido al siguiente paciente.</p>
        </div>
        <div className="divide-y divide-[#bdcbc7]">
          {agendaLoading ? (
            <div className="p-10 text-center text-sm font-bold text-[#52615f]">Cargando agenda...</div>
          ) : agendaError ? (
            <div className="p-10 text-center text-sm font-bold text-[#93000a]">{agendaError}</div>
          ) : agendaItems.length === 0 ? (
            <div className="p-5">
              <AgendaEmptyState
                icon="event_busy"
                title="No hay horarios o citas con esos filtros"
                description="Ajusta la fecha o el estado para revisar tu agenda medica."
              />
            </div>
          ) : agendaItems.map((item, index) => (
            <div key={agendaKey(item, index)}
              className="grid gap-4 bg-white px-6 py-4 transition hover:bg-[#f8fbff] lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] font-extrabold text-[#006b5d]">
                  {item.paciente?.charAt(0) || 'H'}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-[#101828]">{item.paciente || 'Horario sin paciente asignado'}</p>
                  <p className="text-xs text-[#52615f]">
                    {item.dni ? `DNI ${item.dni}` : item.especialidad || 'Sin especialidad'}
                  </p>
                </div>
              </div>
              <div className="grid gap-1 text-sm text-[#52615f]">
                <span className="font-bold text-[#223330]">{formatAgendaDate(agendaFecha(item))}</span>
                <span>
                  {formatTime12h(agendaHoraInicio(item)) || agendaHoraInicio(item) || 'Sin inicio'} a {formatTime12h(agendaHoraFin(item)) || agendaHoraFin(item) || 'Sin fin'}
                </span>
                {item.especialidad && <span className="text-xs font-semibold">{item.especialidad}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <AgendaStatusBadge status={item.estado} />
                {item.tipo === 'cita' && ['confirmada', 'reprogramada', 'en_atencion'].includes(item.estado) ? (
                  <button type="button" onClick={() => onAtender(item)} className="medcare-primary-button px-5 py-2">
                    Atender
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#52615f]">{item.tipo === 'cita' ? formatAgendaDateTime(item.fecha_hora) : 'Sin cita'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
