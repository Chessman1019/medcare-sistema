const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'
const primaryButton = 'rounded-lg bg-[#007a68] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DoctorAtencion({ selected, form, setForm, historial, saving, onGuardar, onVerHistorial }) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Atención médica</h2>
        <p className="mt-1 text-sm text-slate-500">Ficha del paciente, diagnóstico y observaciones.</p>
      </div>

      {!selected ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm sm:p-8">
          Selecciona un paciente desde la agenda diaria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.2fr] xl:gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Ficha del paciente</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Paciente</dt><dd className="font-medium text-slate-900">{selected.paciente}</dd></div>
              <div><dt className="text-slate-500">DNI</dt><dd className="font-medium text-slate-900">{selected.dni || 'Sin registrar'}</dd></div>
              <div><dt className="text-slate-500">Cita</dt><dd className="font-medium text-slate-900">{formatDateTime(selected.fecha_hora)}</dd></div>
              <div><dt className="text-slate-500">Motivo</dt><dd className="font-medium text-slate-900">{selected.motivo || 'Sin motivo registrado'}</dd></div>
            </dl>
            <button type="button" onClick={onVerHistorial} className={`mt-5 ${secondaryButton}`}>
              Ver historial
            </button>
          </div>

          <form onSubmit={onGuardar} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Registro de atención</h3>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Diagnóstico
              <textarea required rows={3} className={inputClass} value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Observaciones
              <textarea rows={3} className={inputClass} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Tratamiento
              <textarea rows={2} className={inputClass} value={form.tratamiento} onChange={e => setForm({ ...form, tratamiento: e.target.value })} />
            </label>
            <button type="submit" disabled={saving} className={`mt-5 ${primaryButton}`}>
              {saving ? 'Guardando...' : 'Guardar atención y registrar salida'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}