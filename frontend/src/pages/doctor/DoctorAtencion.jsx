const inputClass = 'mt-1 w-full rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DoctorAtencion({ selected, form, setForm, historial, saving, onGuardar, onVerHistorial }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Atención médica</h2>
        <p className="mt-2 text-lg text-[#52615f]">Ficha del paciente, diagnóstico y observaciones.</p>
      </div>

      {!selected ? (
        <div className="medcare-card p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">clinical_notes</span>
          <p className="mt-4 font-bold text-[#52615f]">Selecciona un paciente desde la agenda diaria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
          {/* Ficha paciente */}
          <div className="medcare-card overflow-hidden h-fit xl:sticky xl:top-28">
            <div className="bg-[#007a68] p-6 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold">
                {selected.paciente?.charAt(0) || 'P'}
              </div>
              <p className="mt-3 text-xl font-extrabold">{selected.paciente}</p>
              <p className="text-sm text-white/80">DNI: {selected.dni || 'Sin registrar'}</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Fecha cita', formatDateTime(selected.fecha_hora)],
                ['Especialidad', selected.especialidad || '—'],
                ['Motivo', selected.motivo || 'Sin motivo registrado'],
                ['Estado', selected.estado],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f8fbff] p-3">
                  <p className="text-xs font-bold text-[#52615f] uppercase tracking-wide">{label}</p>
                  <p className="mt-1 font-bold text-[#101828] capitalize">{value}</p>
                </div>
              ))}
              <button type="button" onClick={onVerHistorial}
                className="w-full rounded-xl border border-[#bdcbc7] bg-white py-2.5 text-sm font-extrabold text-[#223330] transition hover:border-[#12b8a3] hover:bg-[#f4fffc] mt-2">
                Ver historial completo
              </button>
            </div>
          </div>

          {/* Formulario atención */}
          <form onSubmit={onGuardar} className="medcare-card p-6 space-y-5">
            <h3 className="text-xl font-extrabold text-[#101828]">Registro de atención</h3>

            {historial.length > 0 && (
              <div className="rounded-xl bg-[#f8fbff] p-4">
                <p className="text-xs font-extrabold text-[#006b5d] uppercase tracking-wide mb-2">Última atención registrada</p>
                <p className="text-sm font-bold text-[#101828]">{historial[0].diagnostico || 'Sin diagnóstico'}</p>
                {historial[0].tratamiento && <p className="text-xs text-[#52615f] mt-1">Tratamiento: {historial[0].tratamiento}</p>}
              </div>
            )}

            <label className="block text-sm font-bold text-[#223330]">
              Diagnóstico *
              <textarea required rows={3} className={inputClass}
                value={form.diagnostico}
                onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                placeholder="Describe el diagnóstico..." />
            </label>
            <label className="block text-sm font-bold text-[#223330]">
              Observaciones
              <textarea rows={3} className={inputClass}
                value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..." />
            </label>
            <label className="block text-sm font-bold text-[#223330]">
              Tratamiento
              <textarea rows={2} className={inputClass}
                value={form.tratamiento}
                onChange={e => setForm({ ...form, tratamiento: e.target.value })}
                placeholder="Indica el tratamiento..." />
            </label>
            <button type="submit" disabled={saving}
              className="medcare-primary-button w-full py-3 disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar atención y registrar salida'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}