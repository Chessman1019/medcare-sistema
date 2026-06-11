import { useState } from 'react'

export default function AdminPacientes({ pacientes, onRefresh }) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const selected = pacientes.find(p => p.id_usuario === selectedId) || null

  const filtered = pacientes.filter(p => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return [p.nombre, p.apellido, p.email, p.paciente?.dni, p.telefono]
      .some(f => String(f || '').toLowerCase().includes(term))
  })

  const calcEdad = (fecha) => {
    if (!fecha) return '—'
    return Math.floor((new Date() - new Date(fecha)) / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Pacientes</h2>
          <p className="mt-2 text-lg text-[#52615f]">{pacientes.length} pacientes registrados</p>
        </div>
        <div className="relative max-w-sm w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#52615f] text-[18px]">search</span>
          <input className="w-full rounded-xl border border-[#bdcbc7] bg-white py-2.5 pl-9 pr-4 text-sm focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15"
            placeholder="Buscar por nombre, DNI, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px] xl:gap-6">
        {/* Lista */}
        <div className="medcare-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
                <tr>
                  {['Paciente', 'DNI', 'Edad', 'Género', 'Seguro', 'Teléfono', 'Estado'].map(h => (
                    <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bdcbc7]">
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-5 py-10 text-center text-[#52615f]">No se encontraron pacientes.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id_usuario}
                    onClick={() => setSelectedId(p.id_usuario)}
                    className={`cursor-pointer transition ${selectedId === p.id_usuario ? 'bg-[#f4fffc]' : 'bg-white hover:bg-[#f8fbff]'}`}>
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
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.paciente?.dni || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{calcEdad(p.paciente?.fecha_nacimiento)} {p.paciente?.fecha_nacimiento ? 'años' : ''}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.paciente?.genero || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.paciente?.seguro_medico || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#52615f]">{p.telefono || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${p.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel detalle */}
        {selected ? (
          <div className="medcare-card overflow-hidden h-fit xl:sticky xl:top-28">
            <div className="bg-[#007a68] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold">
                    {selected.nombre?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-lg">{selected.nombre} {selected.apellido}</p>
                    <p className="text-sm text-white/80">{selected.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedId(null)}
                  className="rounded-full p-1.5 text-white/80 hover:bg-white/20 transition">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['DNI', selected.paciente?.dni || '—'],
                  ['Edad', selected.paciente?.fecha_nacimiento ? `${calcEdad(selected.paciente.fecha_nacimiento)} años` : '—'],
                  ['Género', selected.paciente?.genero || '—'],
                  ['Teléfono', selected.telefono || '—'],
                  ['Seguro', selected.paciente?.seguro_medico || '—'],
                  ['Dirección', selected.paciente?.direccion || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f8fbff] p-3">
                    <p className="text-xs font-bold text-[#52615f] uppercase tracking-wide">{label}</p>
                    <p className="mt-1 font-bold text-[#101828] truncate">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-[#f8fbff] p-3 text-sm">
                <p className="text-xs font-bold text-[#52615f] uppercase tracking-wide mb-1">Fecha de registro</p>
                <p className="font-bold text-[#101828]">
                  {selected.fecha_registro ? new Date(selected.fecha_registro).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <span className={`text-center text-xs px-3 py-2 rounded-xl font-extrabold ${selected.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                  {selected.activo ? '✓ Paciente Activo' : '✗ Paciente Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="medcare-card p-8 text-center text-[#52615f] h-fit">
            <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">person_search</span>
            <p className="mt-3 font-bold">Selecciona un paciente para ver su detalle</p>
          </div>
        )}
      </div>
    </div>
  )
}