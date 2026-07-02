import { useAuth } from '../../context/AuthContext'

export default function AdminInicio({ stats, listaEspera }) {
    const { user } = useAuth()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Hola, {user?.nombre?.split(' ')[0]}</h2>
                <p className="mt-2 text-lg text-[#52615f]">Resumen completo del sistema MedCare.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { icon: 'calendar_month', label: 'Citas hoy', value: stats.citas_hoy ?? 0, badge: 'Hoy' },
                    { icon: 'check_circle', label: 'Confirmadas hoy', value: stats.confirmadas_hoy ?? 0, badge: 'Activas' },
                    { icon: 'cancel', label: 'Canceladas hoy', value: stats.canceladas_hoy ?? 0, badge: 'Hoy' },
                    { icon: 'pending', label: 'Pendientes', value: stats.pendientes ?? 0, badge: 'Total' },
                ].map(s => (
                    <div key={s.label} className="medcare-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
                                <span className="material-symbols-outlined">{s.icon}</span>
                            </span>
                            <span className="text-xs bg-[#edf2ff] text-[#355382] px-2 py-1 rounded-full font-bold">{s.badge}</span>
                        </div>
                        <p className="text-3xl font-extrabold text-[#101828]">{s.value}</p>
                        <p className="text-sm text-[#52615f] mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { icon: 'group', label: 'Pacientes', value: stats.total_pacientes ?? 0 },
                    { icon: 'stethoscope', label: 'Doctores activos', value: stats.doctores_activos ?? 0 },
                    { icon: 'local_hospital', label: 'Especialidades', value: stats.total_especialidades ?? 0 },
                    { icon: 'schedule', label: 'Horarios libres', value: stats.horarios_libres ?? 0 },
                ].map(s => (
                    <div key={s.label} className="medcare-card-soft p-5 text-center">
                        <span className="material-symbols-outlined text-[#006b5d] text-3xl">{s.icon}</span>
                        <p className="text-2xl font-extrabold text-[#101828] mt-2">{s.value}</p>
                        <p className="text-xs text-[#52615f] mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="medcare-card p-6">
                    <h3 className="text-lg font-extrabold text-[#101828] mb-5">Citas por estado</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Pendientes', count: stats.pendientes ?? 0, color: 'bg-[#f5c842]' },
                            { label: 'Confirmadas', count: stats.confirmadas_hoy ?? 0, color: 'bg-[#12b8a3]' },
                            { label: 'Canceladas', count: stats.canceladas_hoy ?? 0, color: 'bg-[#ba1a1a]' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                                <span className="text-xs text-[#52615f] w-24">{item.label}</span>
                                <div className="flex-1 bg-[#edf2ff] rounded-full h-3">
                                    <div className={`${item.color} h-3 rounded-full transition-all`}
                                        style={{ width: stats.total_citas ? `${Math.min((item.count / stats.total_citas) * 100, 100)}%` : '0%' }} />
                                </div>
                                <span className="text-xs font-extrabold text-[#101828] w-5">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="medcare-card p-6">
                    <h3 className="text-lg font-extrabold text-[#101828] mb-5">Lista de espera</h3>
                    {listaEspera.length === 0 ? (
                        <div className="text-center py-6">
                            <span className="material-symbols-outlined text-4xl text-[#12b8a3]">check_circle</span>
                            <p className="text-[#52615f] text-sm mt-2">No hay pacientes en espera</p>
                        </div>
                    ) : listaEspera.slice(0, 4).map(e => (
                        <div key={e.id_espera} className="flex items-center gap-3 py-2 border-b border-[#edf2ff] last:border-0">
                            <div className="w-8 h-8 rounded-full bg-[#d8f4ee] flex items-center justify-center text-[#006b5d] text-xs font-extrabold">
                                {e.paciente?.usuario?.nombre?.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#101828]">{e.paciente?.usuario?.nombre} {e.paciente?.usuario?.apellido}</p>
                                <p className="text-xs text-[#52615f]">{e.especialidad?.nombre}</p>
                            </div>
                            <span className="text-xs bg-[#faeeda] text-[#854F0B] px-2 py-0.5 rounded-full font-bold">En espera</span>
                        </div>
                    ))}
                </div>
            </div>


        </div>
    )
}
