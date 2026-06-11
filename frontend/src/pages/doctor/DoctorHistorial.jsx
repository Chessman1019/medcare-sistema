const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

export default function DoctorHistorial({ pacientesUnicos, selected, historial, onSeleccionarPaciente }) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Historial</h2>
        <p className="mt-1 text-sm text-slate-500">Consulta de atenciones previas por paciente.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr] lg:gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Pacientes atendidos</h3>
          <div className="space-y-2">
            {pacientesUnicos.map((cita) => (
              <button
                key={cita.id_paciente}
                type="button"
                onClick={() => onSeleccionarPaciente(cita)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]"
              >
                <p className="font-medium text-slate-900">{cita.paciente}</p>
                <p className="text-xs text-slate-500">{cita.dni}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? (
            <p className="text-sm text-slate-500">Selecciona un paciente para ver su historial.</p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-slate-500">No hay atenciones previas registradas para {selected.paciente}.</p>
          ) : (
            <div className="space-y-3">
              {historial.map((item, index) => (
                <article key={item.id_historial || index} className="rounded-lg bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-slate-900">{item.diagnostico || 'Sin diagnóstico'}</p>
                  {item.observaciones && <p className="mt-2 text-slate-600">{item.observaciones}</p>}
                  {item.tratamiento && <p className="mt-2 text-slate-600">Tratamiento: {item.tratamiento}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}