const estadoClass = {
  pendiente:    'bg-[#faeeda] text-[#854F0B]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
  completada:   'bg-[#f5f5f2] text-[#46514f]',
}
const estadoMetricColors = {
  pendiente: '#f5c842', confirmada: '#12b8a3', reprogramada: '#6366f1',
  en_atencion: '#0284c7', completada: '#52615f', cancelada: '#ba1a1a',
}

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
function buildDonutGradient(items, total) {
  if (!total) return '#edf2ff'
  let cursor = 0
  const segments = items.filter(i => i.value > 0).map(i => {
    const start = cursor; const end = cursor + (i.value / total) * 100; cursor = end
    return `${i.color} ${start}% ${end}%`
  })
  return `conic-gradient(${segments.join(', ')})`
}
function percentage(value, total) { if (!total) return 0; return Math.round((value / total) * 100) }

export default function RecepDashboard({ stats, citas, citasHoy, doctores, pacientes, usuarios, especialidades, isAdmin, onGoToTab }) {
  const totalCitas = citas.length
  const estadoMetricas = ['pendiente', 'confirmada', 'reprogramada', 'en_atencion', 'completada', 'cancelada'].map(estado => ({
    key: estado, label: formatEstado(estado),
    value: citas.filter(c => c.estado === estado).length,
    color: estadoMetricColors[estado],
  }))
  const donutGradient = buildDonutGradient(estadoMetricas, totalCitas)
  const especialidadMetricas = Object.entries(
    citas.reduce((acc, c) => { const k = c.especialidad || 'Sin especialidad'; acc[k] = (acc[k] || 0) + 1; return acc }, {})
  ).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  const maxEspecialidad = Math.max(...especialidadMetricas.map(i => i.value), 1)
  const todayInputValue = () => new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">{isAdmin ? 'Panel administrativo' : 'Recepción'}</h2>
        <p className="mt-2 text-lg text-[#52615f]">Citas del día, validaciones pendientes y actividad general.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Citas hoy',       value: stats.citas_hoy ?? 0,        icon: 'today',            color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]', action: () => onGoToTab('agenda', { fecha: todayInputValue() }) },
          { label: 'Pendientes',      value: stats.pendientes ?? 0,        icon: 'pending',          color: 'text-[#854F0B]', bg: 'bg-[#faeeda]', action: () => onGoToTab('gestion', { estado: 'pendiente' }) },
          { label: 'Confirmadas hoy', value: stats.confirmadas_hoy ?? 0,  icon: 'check_circle',     color: 'text-[#355382]', bg: 'bg-[#edf2ff]', action: () => onGoToTab('gestion', { estado: 'confirmada', fecha: todayInputValue() }) },
          { label: 'En atención',     value: stats.en_atencion_hoy ?? 0,  icon: 'medical_services', color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]', action: () => onGoToTab('gestion', { estado: 'en_atencion' }) },
        ].map(s => (
          <button key={s.label} type="button" onClick={s.action}
            className="medcare-card p-5 text-center transition hover:-translate-y-1 hover:shadow-lg">
            <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center mx-auto`}>
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#52615f] mt-1 font-bold">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.2fr]">
        {/* Donut distribución */}
        <div className="medcare-card p-6">
          <h3 className="font-extrabold text-[#101828] mb-5">Distribución de estados</h3>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-44 w-44 shrink-0 rounded-full" style={{ background: donutGradient }}>
              <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <span className="text-3xl font-extrabold text-[#101828]">{totalCitas}</span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#52615f]">Citas</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {estadoMetricas.map(item => (
                <button key={item.key} type="button" onClick={() => onGoToTab('gestion', { estado: item.key })}
                  className="flex items-center justify-between rounded-xl border border-[#edf2ff] px-3 py-2 text-left transition hover:border-[#12b8a3] hover:bg-[#f4fffc]">
                  <span className="flex items-center gap-2 text-sm text-[#52615f]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-extrabold text-[#101828]">{item.value}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Especialidades */}
        <div className="medcare-card p-6">
          <h3 className="font-extrabold text-[#101828] mb-5">Demanda por especialidad</h3>
          <div className="space-y-4">
            {especialidadMetricas.length === 0 ? (
              <p className="rounded-xl bg-[#edf2ff] p-4 text-sm text-[#52615f]">Sin datos suficientes.</p>
            ) : especialidadMetricas.map(item => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-[#223330]">{item.label}</span>
                  <span className="font-extrabold text-[#101828]">{item.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#edf2ff]">
                  <div className="h-full rounded-full bg-[#12b8a3]" style={{ width: `${Math.max(8, percentage(item.value, maxEspecialidad))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citas hoy */}
      <div className="medcare-card overflow-hidden">
        <div className="border-b border-[#bdcbc7] bg-[#f8fbff] px-6 py-4">
          <h3 className="font-extrabold text-[#101828]">Citas programadas para hoy</h3>
        </div>
        <div className="divide-y divide-[#bdcbc7]">
          {citasHoy.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">event_busy</span>
              <p className="mt-3 font-bold text-[#52615f]">No hay citas para hoy.</p>
            </div>
          ) : citasHoy.map(cita => (
            <button key={cita.id_cita} type="button"
              onClick={() => onGoToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })}
              className="grid w-full grid-cols-1 items-start gap-3 bg-white px-6 py-4 text-left transition hover:bg-[#f8fbff] md:grid-cols-[1.4fr_1.4fr_1fr_auto] md:items-center">
              <div>
                <p className="font-extrabold text-[#101828]">{cita.paciente}</p>
                <p className="text-xs text-[#52615f]">DNI {cita.dni || 'sin registrar'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#223330]">Dr. {cita.doctor}</p>
                <p className="text-xs text-[#52615f]">{cita.especialidad}</p>
              </div>
              <p className="text-sm text-[#52615f]">{formatDateTime(cita.fecha_hora)}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                {formatEstado(cita.estado)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}