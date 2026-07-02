import MedCareSelect from '../../components/MedCareSelect'
import { DateWheelPicker } from '../../components/WheelPickers'
import { formatTime12h } from '../../utils/timeFormat'

const estadoClass = {
  disponible:  'bg-[#d8f4ee] text-[#006b5d]',
  pendiente:    'bg-[#faeeda] text-[#854F0B]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
  completada:   'bg-[#f5f5f2] text-[#46514f]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
}

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatEstado(value) {
  const labels = {
    disponible: 'Disponible',
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    reprogramada: 'Reprogramada',
    en_atencion: 'En atencion',
    completada: 'Completada',
    cancelada: 'Cancelada',
  }
  return labels[value] || (value || 'Pendiente').replaceAll('_', ' ')
}

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Citas visibles', value: citasAgenda.length, icon: 'calendar_month', color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]' },
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
        </div>
        <div className="divide-y divide-[#bdcbc7]">
          {agendaLoading ? (
            <div className="p-10 text-center text-sm font-bold text-[#52615f]">Cargando agenda...</div>
          ) : agendaError ? (
            <div className="p-10 text-center text-sm font-bold text-[#93000a]">{agendaError}</div>
          ) : agendaItems.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">event_busy</span>
              <p className="mt-3 font-bold text-[#52615f]">No hay horarios o citas con esos filtros.</p>
            </div>
          ) : agendaItems.map((item, index) => (
            <div key={agendaKey(item, index)}
              className="flex flex-col gap-4 bg-white px-6 py-4 transition hover:bg-[#f8fbff] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] font-extrabold text-[#006b5d]">
                  {item.paciente?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-extrabold text-[#101828]">{item.paciente || 'Horario sin paciente asignado'}</p>
                  <p className="text-xs text-[#52615f]">
                    {item.dni ? `DNI ${item.dni}` : item.especialidad || 'Sin especialidad'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-[#52615f]">
                  {agendaFecha(item)} - {formatTime12h(agendaHoraInicio(item)) || agendaHoraInicio(item)} a {formatTime12h(agendaHoraFin(item)) || agendaHoraFin(item)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estadoClass[item.estado] || estadoClass.pendiente}`}>
                  {formatEstado(item.estado)}
                </span>
                {item.tipo === 'cita' && ['confirmada', 'reprogramada', 'en_atencion'].includes(item.estado) ? (
                  <button type="button" onClick={() => onAtender(item)} className="medcare-primary-button px-5 py-2">
                    Atender
                  </button>
                ) : (
                  <span className="text-xs text-[#52615f]">{item.tipo === 'cita' ? formatDateTime(item.fecha_hora) : 'Sin cita'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
