import { useMemo, useState } from 'react'
import MedCareSelect from '../../components/MedCareSelect'

export default function AdminPacientes({ pacientes }) {
  const [filtros, setFiltros] = useState({ busqueda: '', genero: '', seguro: '', estado: '' })
  const [selectedId, setSelectedId] = useState(null)

  const selected = pacientes.find(p => p.id_usuario === selectedId) || null

  const generos = useMemo(() => {
    const unique = new Set(pacientes.map(p => p.paciente?.genero).filter(Boolean))
    return [...unique].sort((a, b) => a.localeCompare(b, 'es-PE'))
  }, [pacientes])

  const seguros = useMemo(() => {
    const unique = new Map()
    pacientes.forEach(p => {
      const seguro = String(p.paciente?.seguro_medico || '').trim()
      if (seguro) unique.set(seguro.toLocaleLowerCase('es-PE'), seguro)
    })
    return [...unique.values()].sort((a, b) => a.localeCompare(b, 'es-PE'))
  }, [pacientes])

  const filtered = useMemo(() => pacientes.filter(p => {
    const term = filtros.busqueda.trim().toLowerCase()
    const coincideBusqueda = !term || [p.nombre, p.apellido, p.email, p.paciente?.dni, p.telefono]
      .some(f => String(f || '').toLowerCase().includes(term))
    const coincideGenero = !filtros.genero || p.paciente?.genero === filtros.genero
    const coincideSeguro = !filtros.seguro || String(p.paciente?.seguro_medico || '').toLocaleLowerCase('es-PE') === filtros.seguro
    const coincideEstado = !filtros.estado || (filtros.estado === 'activo' ? p.activo : !p.activo)
    return coincideBusqueda && coincideGenero && coincideSeguro && coincideEstado
  }), [pacientes, filtros])

  const limpiarFiltros = () => setFiltros({ busqueda: '', genero: '', seguro: '', estado: '' })

  const calcEdad = (fecha) => {
    if (!fecha) return '—'
    return Math.floor((new Date() - new Date(fecha)) / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Pacientes</h2>
          <p className="mt-2 text-lg text-[#52615f]">{filtered.length} de {pacientes.length} pacientes registrados</p>
        </div>
      </div>

      <div className="medcare-card p-5">
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-[#006b5d]">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Búsqueda</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#52615f] text-[18px]">search</span>
              <input className="medcare-input medcare-input-with-icon" placeholder="Nombre, DNI, email..."
                value={filtros.busqueda} onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Género</label>
            <MedCareSelect
              className="medcare-input"
              value={filtros.genero}
              onChange={e => setFiltros({ ...filtros, genero: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                ...generos.map(genero => ({ value: genero, label: genero })),
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Seguro</label>
            <MedCareSelect
              className="medcare-input"
              value={filtros.seguro}
              onChange={e => setFiltros({ ...filtros, seguro: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                ...seguros.map(seguro => ({ value: seguro.toLocaleLowerCase('es-PE'), label: seguro })),
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Estado</label>
            <MedCareSelect
              className="medcare-input"
              value={filtros.estado}
              onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' },
              ]}
            />
          </div>
        </div>
        <button type="button" onClick={limpiarFiltros} className="mt-3 text-xs font-bold text-[#006b5d] hover:underline">
          Limpiar filtros
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
        {/* Lista */}
        <div className="medcare-card min-w-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed text-left">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
                <tr>
                  {['Paciente', 'DNI', 'Edad', 'Género', 'Seguro', 'Teléfono', 'Estado'].map(h => (
                    <th key={h} className="px-4 py-4 font-extrabold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bdcbc7]">
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-10 text-center text-[#52615f]">No se encontraron pacientes.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id_usuario}
                    onClick={() => setSelectedId(p.id_usuario)}
                    className={`cursor-pointer transition ${selectedId === p.id_usuario ? 'bg-[#f4fffc]' : 'bg-white hover:bg-[#f8fbff]'}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#edf2ff] flex items-center justify-center text-[#355382] text-xs font-extrabold">
                          {p.nombre?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#101828]">{p.nombre} {p.apellido}</p>
                          <p className="truncate text-xs text-[#52615f]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#52615f]">{p.paciente?.dni || '—'}</td>
                    <td className="px-4 py-4 text-sm text-[#52615f]">{calcEdad(p.paciente?.fecha_nacimiento)} {p.paciente?.fecha_nacimiento ? 'años' : ''}</td>
                    <td className="px-4 py-4 text-sm text-[#52615f]">{p.paciente?.genero || '—'}</td>
                    <td className="truncate px-4 py-4 text-sm text-[#52615f]">{p.paciente?.seguro_medico || '—'}</td>
                    <td className="px-4 py-4 text-sm text-[#52615f]">{p.telefono || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`whitespace-nowrap text-xs px-3 py-1 rounded-full font-extrabold ${p.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
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
