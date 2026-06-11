const estadoClass = {
  pendiente:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmada:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion:  'bg-sky-50 text-sky-700 border-sky-200',
  completada:   'bg-slate-100 text-slate-700 border-slate-200',
  cancelada:    'bg-rose-50 text-rose-700 border-rose-200',
}

const primaryButton = 'rounded-lg bg-[#007a68] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

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
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Agenda diaria</h2>
        <p className="mt-1 text-sm text-slate-500">Lista cronológica de pacientes para atención.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Citas hoy</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{agendaDiaria.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">En atención</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{enAtencion.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pacientes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{pacientesUnicos.length}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Pacientes del día</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {agendaDiaria.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No tienes citas programadas para hoy.</p>
          ) : agendaDiaria.map((cita) => (
            <div key={cita.id_cita} className="grid grid-cols-1 items-start gap-3 px-5 py-4 transition hover:bg-[#f8fbff] md:grid-cols-[1.2fr_1fr_auto_auto] md:items-center md:gap-4">
              <div>
                <p className="font-medium text-slate-900">{cita.paciente}</p>
                <p className="text-xs text-slate-500">DNI {cita.dni || 'sin registrar'}</p>
              </div>
              <p className="text-sm text-slate-600">{formatDateTime(cita.fecha_hora)}</p>
              <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                {formatEstado(cita.estado)}
              </span>
              {['confirmada', 'reprogramada', 'en_atencion'].includes(cita.estado) ? (
                <button type="button" onClick={() => onAtender(cita)} className={primaryButton}>
                  Atender
                </button>
              ) : (
                <span className="text-xs text-slate-400">Sin confirmar</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}