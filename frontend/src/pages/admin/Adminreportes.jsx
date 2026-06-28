export default function AdminReportes({ stats, especialidades, doctores }) {
  const totalCitas = stats.total_citas ?? 0
  const maxDocs = Math.max(...especialidades.map(e =>
    doctores.filter(d => d.doctor?.id_especialidad === e.id_especialidad).length
  ), 1)

  const disponibles = doctores.filter(d => d.doctor?.disponible).length
  const ocupados = doctores.length - disponibles

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Reportes</h2>
        <p className="mt-2 text-lg text-[#52615f]">Análisis general del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: 'calendar_month', label: 'Total citas',      value: stats.total_citas ?? 0,      color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]' },
          { icon: 'group',          label: 'Total pacientes',  value: stats.total_pacientes ?? 0,  color: 'text-[#355382]', bg: 'bg-[#edf2ff]' },
          { icon: 'stethoscope',    label: 'Doctores activos', value: stats.doctores_activos ?? 0, color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]' },
          { icon: 'schedule',       label: 'Horarios libres',  value: stats.horarios_libres ?? 0,  color: 'text-[#854F0B]', bg: 'bg-[#faeeda]' },
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribución de citas */}
        <div className="medcare-card p-6">
          <h3 className="text-lg font-extrabold text-[#101828] mb-5">Distribución de citas</h3>
          <div className="space-y-4">
            {[
              { label: 'Pendientes',       count: stats.pendientes ?? 0,        color: 'bg-[#f5c842]' },
              { label: 'Confirmadas hoy',  count: stats.confirmadas_hoy ?? 0,   color: 'bg-[#12b8a3]' },
              { label: 'Completadas hoy',  count: stats.completadas_hoy ?? 0,   color: 'bg-[#006b5d]' },
              { label: 'Canceladas hoy',   count: stats.canceladas_hoy ?? 0,    color: 'bg-[#ba1a1a]' },
              { label: 'En atención hoy',  count: stats.en_atencion_hoy ?? 0,   color: 'bg-[#6366f1]' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-[#52615f] w-32 shrink-0">{item.label}</span>
                <div className="flex-1 bg-[#edf2ff] rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full transition-all`}
                    style={{ width: totalCitas ? `${Math.min((item.count / totalCitas) * 100, 100)}%` : '0%' }} />
                </div>
                <span className="text-xs font-extrabold text-[#101828] w-6 text-right">{item.count}</span>
              </div>
            ))}
            <p className="text-xs text-[#52615f] pt-2 border-t border-[#edf2ff]">Total: <span className="font-extrabold text-[#101828]">{totalCitas}</span> citas registradas</p>
          </div>
        </div>

        {/* Doctores por especialidad */}
        <div className="medcare-card p-6">
          <h3 className="text-lg font-extrabold text-[#101828] mb-5">Doctores por especialidad</h3>
          <div className="space-y-3">
            {especialidades
              .map(e => ({
                ...e,
                docs: doctores.filter(d => d.doctor?.id_especialidad === e.id_especialidad).length
              }))
              .sort((a, b) => b.docs - a.docs)
              .map(e => (
                <div key={e.id_especialidad} className="flex items-center gap-3">
                  <span className="text-xs text-[#52615f] w-32 truncate shrink-0">{e.nombre}</span>
                  <div className="flex-1 bg-[#edf2ff] rounded-full h-3">
                    <div className="bg-[#12b8a3] h-3 rounded-full transition-all"
                      style={{ width: `${(e.docs / maxDocs) * 100}%` }} />
                  </div>
                  <span className="text-xs font-extrabold text-[#101828] w-4 text-right">{e.docs}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Disponibilidad doctores */}
        <div className="medcare-card p-6">
          <h3 className="text-lg font-extrabold text-[#101828] mb-5">Disponibilidad de doctores</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#edf2ff" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#12b8a3" strokeWidth="3"
                  strokeDasharray={`${doctores.length ? (disponibles / doctores.length) * 100 : 0} 100`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-extrabold text-[#101828]">{disponibles}</p>
                <p className="text-xs text-[#52615f]">disponibles</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#12b8a3]" />
                <span className="text-sm text-[#52615f]">Disponibles: <span className="font-extrabold text-[#101828]">{disponibles}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#bdcbc7]" />
                <span className="text-sm text-[#52615f]">Ocupados: <span className="font-extrabold text-[#101828]">{ocupados}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#edf2ff]" />
                <span className="text-sm text-[#52615f]">Total: <span className="font-extrabold text-[#101828]">{doctores.length}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de espera */}
        <div className="medcare-card p-6">
          <h3 className="text-lg font-extrabold text-[#101828] mb-5">Resumen del sistema</h3>
          <div className="space-y-3">
            {[
              { label: 'Citas hoy',          value: stats.citas_hoy ?? 0,        icon: 'today' },
              { label: 'En atención ahora',   value: stats.en_atencion_hoy ?? 0, icon: 'medical_services' },
              { label: 'Lista de espera',     value: stats.lista_espera ?? 0,     icon: 'hourglass_empty' },
              { label: 'Especialidades',      value: especialidades.length,        icon: 'local_hospital' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between rounded-xl bg-[#f8fbff] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-[#006b5d]">{s.icon}</span>
                  <span className="text-sm font-bold text-[#223330]">{s.label}</span>
                </div>
                <span className="text-lg font-extrabold text-[#101828]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}