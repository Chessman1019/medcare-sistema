export default function AdminReportes({ stats, especialidades, doctores }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Reportes</h2>
        <p className="mt-2 text-lg text-[#52615f]">Análisis general del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="medcare-card p-6">
          <h3 className="text-lg font-extrabold text-[#101828] mb-5">Distribución de citas</h3>
          <div className="space-y-4">
            {[
              { label: 'Pendientes',  count: stats.pendientes ?? 0,      color: 'bg-[#f5c842]' },
              { label: 'Confirmadas', count: stats.confirmadas_hoy ?? 0, color: 'bg-[#12b8a3]' },
              { label: 'Canceladas',  count: stats.canceladas_hoy ?? 0,  color: 'bg-[#ba1a1a]' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-[#52615f] w-24">{item.label}</span>
                <div className="flex-1 bg-[#edf2ff] rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full`}
                    style={{ width: stats.total_citas ? `${Math.min((item.count / stats.total_citas) * 100, 100)}%` : '0%' }} />
                </div>
                <span className="text-xs font-extrabold text-[#101828] w-6">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="medcare-card p-6">
          <h3 className="text-lg font-extrabold text-[#101828] mb-5">Doctores por especialidad</h3>
          <div className="space-y-3">
            {especialidades.map(e => {
              const docs = doctores.filter(d => d.doctor?.especialidad?.nombre === e.nombre).length
              return (
                <div key={e.id_especialidad} className="flex items-center gap-3">
                  <span className="text-xs text-[#52615f] w-28 truncate">{e.nombre}</span>
                  <div className="flex-1 bg-[#edf2ff] rounded-full h-3">
                    <div className="bg-[#12b8a3] h-3 rounded-full"
                      style={{ width: doctores.length ? `${(docs / doctores.length) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-xs font-extrabold text-[#101828] w-4">{docs}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: 'calendar_month', label: 'Total citas',     value: stats.total_citas ?? 0 },
          { icon: 'group',          label: 'Total pacientes', value: stats.total_pacientes ?? 0 },
          { icon: 'schedule',       label: 'Horarios libres', value: stats.horarios_libres ?? 0 },
        ].map(s => (
          <div key={s.label} className="medcare-card p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-[#006b5d]">{s.icon}</span>
            <p className="text-3xl font-extrabold text-[#101828] mt-2">{s.value}</p>
            <p className="text-sm text-[#52615f] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}