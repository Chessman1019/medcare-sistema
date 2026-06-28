function doctorFullName(doctor) {
  if (!doctor) return ''
  const name = `${doctor.usuario?.nombre || doctor.nombre || ''} ${doctor.usuario?.apellido || doctor.apellido || ''}`.trim()
  return name || 'Doctor disponible'
}

export default function PacienteAgendar({ form, setForm, especialidades, doctores, horarios, loading, loadingOptions, loadingHorarios, onEspecialidad, onDoctor, onSubmit }) {
  const selectedEspecialidad = especialidades.find(i => String(i.id_especialidad) === String(form.id_especialidad))
  const selectedDoctor = doctores.find(i => String(i.id_usuario) === String(form.id_doctor))
  const selectedHorario = horarios.find(i => String(i.id_horario) === String(form.id_horario))

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-7 xl:grid-cols-[1fr_420px]">
      <div className="space-y-7">
        <div className="medcare-card-soft grid gap-4 p-5 sm:p-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          {[
            ['1', 'Especialidad', selectedEspecialidad?.nombre || 'Seleccionar'],
            ['2', 'Doctor', selectedDoctor ? `Dr. ${doctorFullName(selectedDoctor)}` : 'Seleccionar'],
            ['3', 'Fecha y hora', selectedHorario ? `${selectedHorario.fecha} ${selectedHorario.hora_inicio}` : 'Elegir horario'],
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

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <section className="medcare-card p-5 sm:p-7">
            <h3 className="text-2xl font-extrabold text-[#101828]">Selecciona especialista</h3>
            <div className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-[#223330]">
                Especialidad
                <select className="medcare-input mt-2" onChange={onEspecialidad} value={form.id_especialidad} required>
                  <option value="">Selecciona una especialidad</option>
                  {especialidades.map(i => <option key={i.id_especialidad} value={i.id_especialidad}>{i.nombre}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-[#223330]">
                Doctor
                <select className="medcare-input mt-2 disabled:cursor-not-allowed" onChange={onDoctor} value={form.id_doctor} required disabled={!doctores.length || loadingOptions}>
                  <option value="">{loadingOptions ? 'Cargando doctores...' : 'Selecciona un doctor'}</option>
                  {doctores.map(d => <option key={d.id_usuario} value={d.id_usuario}>Dr. {doctorFullName(d)}</option>)}
                </select>
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
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {loadingHorarios ? (
                <p className="col-span-2 rounded-xl bg-[#edf2ff] p-5 text-sm text-[#52615f]">Cargando horarios disponibles...</p>
              ) : horarios.length === 0 ? (
                <p className="col-span-2 rounded-xl bg-[#edf2ff] p-5 text-sm text-[#52615f]">
                  {form.id_doctor ? 'No hay citas disponibles por el momento. Vuelve a intentarlo más tarde.' : 'Selecciona un doctor para ver disponibilidad.'}
                </p>
              ) : horarios.map(horario => {
                const selected = String(form.id_horario) === String(horario.id_horario)
                return (
                  <button key={horario.id_horario} type="button" onClick={() => setForm(f => ({ ...f, id_horario: horario.id_horario }))}
                    aria-pressed={selected}
                    className={`rounded-xl border px-3 py-4 text-sm font-extrabold transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] ${selected ? 'border-[#006b5d] bg-[#e5fbf7] text-[#006b5d]' : 'border-[#bdcbc7] bg-white text-[#101828] hover:border-[#006b5d]'}`}>
                    {horario.fecha}<br />{horario.hora_inicio} a {horario.hora_fin}
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
          <div><p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Fecha y hora</p><p className="mt-1 text-lg font-extrabold">{selectedHorario ? `${selectedHorario.fecha} - ${selectedHorario.hora_inicio}` : 'Pendiente'}</p></div>
          <div className="border-t border-dashed border-[#bdcbc7] pt-6 text-sm text-[#52615f]">Recibirás la confirmación cuando recepción valide la disponibilidad.</div>
        </div>
      </aside>
    </div>
  )
}
