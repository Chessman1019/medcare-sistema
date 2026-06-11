export default function AdminPacientes({ pacientes }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Pacientes</h2>
        <p className="mt-2 text-lg text-[#52615f]">{pacientes.length} pacientes registrados</p>
      </div>
      <div className="medcare-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
              <tr>
                {['Paciente', 'DNI', 'Edad', 'Género', 'Seguro', 'Teléfono', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {pacientes.map(p => {
                const edad = p.paciente?.fecha_nacimiento
                  ? Math.floor((new Date() - new Date(p.paciente.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
                  : '—'
                return (
                  <tr key={p.id_usuario} className="bg-white hover:bg-[#f8fbff] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#edf2ff] flex items-center justify-center text-[#355382] text-xs font-extrabold">
                          {p.nombre?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#101828]">{p.nombre} {p.apellido}</p>
                          <p className="text-xs text-[#52615f]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.paciente?.dni}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{edad} años</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.paciente?.genero}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.paciente?.seguro_medico || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.telefono || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${p.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}