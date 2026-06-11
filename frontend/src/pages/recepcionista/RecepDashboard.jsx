const estadoClass = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
}
const estadoMetricColors = {
  pendiente: '#f59e0b', confirmada: '#10b981', reprogramada: '#7c3aed',
  en_atencion: '#0284c7', completada: '#64748b', cancelada: '#e11d48',
}
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

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
  const roleLabels = { paciente: 'Paciente', doctor: 'Médico', recepcionista: 'Recepcionista', administrador: 'Administrador' }
  const usuarioMetricas = ['paciente', 'doctor', 'recepcionista', 'administrador'].map(rol => ({
    key: rol, label: roleLabels[rol],
    value: (isAdmin && usuarios.length ? usuarios : [...pacientes, ...doctores]).filter(u => u.tipo_usuario === rol).length,
  }))
  const maxUsuarios = Math.max(...usuarioMetricas.map(i => i.value), 1)
  const todayInputValue = () => new Date().toISOString().slice(0, 10)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Panel administrativo' : 'Recepción'}</h2>
        <p className="mt-1 text-sm text-slate-500">Citas del día, validaciones pendientes y actividad general.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Citas hoy', stats.citas_hoy ?? 0, () => onGoToTab('agenda', { fecha: todayInputValue() })],
          ['Pendientes', stats.pendientes ?? 0, () => onGoToTab('gestion', { estado: 'pendiente' })],
          ['Confirmadas hoy', stats.confirmadas_hoy ?? 0, () => onGoToTab('gestion', { estado: 'confirmada', fecha: todayInputValue() })],
          ['En atención', stats.en_atencion_hoy ?? 0, () => onGoToTab('gestion', { estado: 'en_atencion', fecha: todayInputValue() })],
        ].map(([label, value, action]) => (
          <button key={label} type="button" onClick={action} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#12b8a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.2fr] xl:gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-44 w-44 shrink-0 rounded-full sm:mx-0" style={{ background: donutGradient }}>
              <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <span className="text-3xl font-bold text-slate-900">{totalCitas}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Citas</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Distribución de estados</h3>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {estadoMetricas.map(item => (
                  <button key={item.key} type="button" onClick={() => onGoToTab('gestion', { estado: item.key })}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left text-sm transition hover:border-[#12b8a3] hover:bg-[#f4fffc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Demanda por especialidad</h3>
          <div className="mt-5 space-y-4">
            {especialidadMetricas.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">Sin datos suficientes.</p>
            ) : especialidadMetricas.map(item => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#007a68]" style={{ width: `${Math.max(8, percentage(item.value, maxEspecialidad))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAdmin && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Cuentas por rol</h3>
            <button type="button" onClick={() => onGoToTab('usuarios')} className={secondaryButton}>Gestionar usuarios</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {usuarioMetricas.map(item => (
              <div key={item.key} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#12b8a3]" style={{ width: `${Math.max(8, percentage(item.value, maxUsuarios))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Citas programadas para hoy</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {citasHoy.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No hay citas registradas para hoy.</p>
          ) : citasHoy.map(cita => (
            <button key={cita.id_cita} type="button" onClick={() => onGoToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })}
              className="grid w-full grid-cols-1 items-start gap-3 px-5 py-4 text-left transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15 md:grid-cols-[1.4fr_1.4fr_1fr_auto] md:items-center md:gap-4">
              <div>
                <p className="font-medium text-slate-900">{cita.paciente}</p>
                <p className="text-xs text-slate-500">DNI {cita.dni || 'sin registrar'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-700">Dr. {cita.doctor}</p>
                <p className="text-xs text-slate-500">{cita.especialidad}</p>
              </div>
              <p className="text-sm text-slate-600">{formatDateTime(cita.fecha_hora)}</p>
              <span className={`rounded-md border px-2 py-1 text-xs font-medium ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                {formatEstado(cita.estado)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}