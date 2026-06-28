const estadoClass = {
  pendiente:    'bg-[#faeeda] text-[#854F0B]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
  completada:   'bg-[#f5f5f2] text-[#46514f]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatEstado(value) {
  const labels = { pendiente: 'Pendiente', confirmada: 'Confirmada', reprogramada: 'Reprogramada', en_atencion: 'En atención', completada: 'Completada', cancelada: 'Cancelada' }
  return labels[value] || (value || 'Pendiente').replaceAll('_', ' ')
}

export default function DoctorAgenda({ agendaDiaria, enAtencion, pacientesUnicos, onAtender }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Agenda diaria</h2>
        <p className="mt-2 text-lg text-[#52615f]">Lista cronológica de pacientes para atención hoy.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Citas hoy',     value: agendaDiaria.length,   icon: 'calendar_month',   color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]' },
          { label: 'En atención',   value: enAtencion.length,     icon: 'medical_services', color: 'text-[#355382]', bg: 'bg-[#edf2ff]' },
          { label: 'Total pacientes', value: pacientesUnicos.length, icon: 'group',          color: 'text-[#854F0B]', bg: 'bg-[#faeeda]' },
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

      {/* Lista citas */}
      <div className="medcare-card overflow-hidden">
        <div className="border-b border-[#bdcbc7] bg-[#f8fbff] px-6 py-4">
          <h3 className="font-extrabold text-[#101828]">Pacientes del día</h3>
        </div>
        <div className="divide-y divide-[#bdcbc7]">
          {agendaDiaria.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">event_busy</span>
              <p className="mt-3 font-bold text-[#52615f]">No tienes citas programadas para hoy.</p>
            </div>
          ) : agendaDiaria.map(cita => (
            <div key={cita.id_cita} className="flex flex-col gap-4 bg-white px-6 py-4 transition hover:bg-[#f8fbff] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] font-extrabold text-[#006b5d]">
                  {cita.paciente?.charAt(0) || 'P'}
                </div>
                <div>
                  <p className="font-extrabold text-[#101828]">{cita.paciente}</p>
                  <p className="text-xs text-[#52615f]">DNI {cita.dni || 'sin registrar'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-[#52615f]">{formatDateTime(cita.fecha_hora)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                  {formatEstado(cita.estado)}
                </span>
                {['confirmada', 'reprogramada', 'en_atencion'].includes(cita.estado) ? (
                  <button type="button" onClick={() => onAtender(cita)}
                    className="medcare-primary-button px-5 py-2">
                    Atender
                  </button>
                ) : (
                  <span className="text-xs text-[#52615f]">Sin confirmar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}