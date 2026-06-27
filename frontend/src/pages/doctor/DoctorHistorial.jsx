export default function DoctorHistorial({ pacientesUnicos, selected, historial, onSeleccionarPaciente }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Historial clínico</h2>
        <p className="mt-2 text-lg text-[#52615f]">Consulta de atenciones previas por paciente.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Lista pacientes */}
        <div className="medcare-card overflow-hidden h-fit lg:sticky lg:top-28">
          <div className="border-b border-[#bdcbc7] bg-[#f8fbff] px-5 py-4">
            <h3 className="font-extrabold text-[#101828]">Pacientes atendidos</h3>
            <p className="text-xs text-[#52615f] mt-0.5">{pacientesUnicos.length} pacientes</p>
          </div>
          <div className="divide-y divide-[#bdcbc7] max-h-[500px] overflow-y-auto">
            {pacientesUnicos.length === 0 ? (
              <p className="p-5 text-sm text-[#52615f]">No hay pacientes registrados.</p>
            ) : pacientesUnicos.map(cita => (
              <button key={cita.id_paciente} type="button"
                onClick={() => onSeleccionarPaciente(cita)}
                className={`w-full px-5 py-4 text-left transition hover:bg-[#f4fffc] ${selected?.id_paciente === cita.id_paciente ? 'bg-[#f4fffc] border-l-4 border-[#007a68]' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] font-extrabold text-[#006b5d] text-sm">
                    {cita.paciente?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-[#101828]">{cita.paciente}</p>
                    <p className="text-xs text-[#52615f]">DNI {cita.dni || '—'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Historial */}
        <div className="space-y-4">
          {!selected ? (
            <div className="medcare-card p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">folder_open</span>
              <p className="mt-4 font-bold text-[#52615f]">Selecciona un paciente para ver su historial.</p>
            </div>
          ) : historial.length === 0 ? (
            <div className="medcare-card p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-[#bdcbc7]">history</span>
              <p className="mt-3 font-bold text-[#52615f]">No hay atenciones previas para {selected.paciente}.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] font-extrabold text-[#006b5d]">
                  {selected.paciente?.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-[#101828]">{selected.paciente}</p>
                  <p className="text-xs text-[#52615f]">{historial.length} atenciones registradas</p>
                </div>
              </div>
              {historial.map((item, index) => (
                <div key={item.id_historial || index} className="medcare-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-extrabold text-[#006b5d] uppercase tracking-wide">
                      Atención #{historial.length - index}
                    </p>
                    <p className="text-xs text-[#52615f]">{item.fecha_atencion || '—'}</p>
                  </div>
                  <p className="font-extrabold text-[#101828]">{item.diagnostico || 'Sin diagnóstico'}</p>
                  {item.observaciones && (
                    <p className="mt-2 text-sm text-[#52615f] rounded-xl bg-[#f8fbff] p-3">{item.observaciones}</p>
                  )}
                  {item.tratamiento && (
                    <div className="mt-2 rounded-xl bg-[#d8f4ee] p-3">
                      <p className="text-xs font-extrabold text-[#006b5d] mb-1">Tratamiento:</p>
                      <p className="text-sm text-[#101828]">{item.tratamiento}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}