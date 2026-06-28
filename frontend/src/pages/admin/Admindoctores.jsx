
import { useMemo, useState } from 'react'
import { actualizarDoctor, toggleDisponibleDoctor } from '../../services/api'
import { formatPhoneInput, phoneInputProps } from '../../utils/numericFields'

const inputClass = 'rounded-lg border border-[#bdcbc7] px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 w-full mt-1'
const primaryButton = 'medcare-primary-button px-5 py-2.5 disabled:opacity-60'
const secondaryButton = 'rounded-xl border border-[#bdcbc7] bg-white px-4 py-2 text-sm font-extrabold text-[#223330] transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

export default function AdminDoctores({ doctores, especialidades = [], onRefresh, onUpdateDoctor }) {
  const [filtros, setFiltros] = useState({ busqueda: '', especialidad: '', turno: '', disponibilidad: '', estado: '' })
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 3000) }

  const turnos = useMemo(() => {
    const unique = new Set(doctores.map(d => d.doctor?.turno).filter(Boolean))
    return [...unique].sort((a, b) => a.localeCompare(b, 'es-PE'))
  }, [doctores])

  const especialidadesFiltro = useMemo(() => {
    const presentes = new Set(doctores.map(d => d.doctor?.especialidad?.nombre).filter(Boolean))
    return especialidades
      .filter(esp => presentes.has(esp.nombre))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-PE'))
  }, [doctores, especialidades])

  const filtered = useMemo(() => doctores.filter(d => {
    const term = filtros.busqueda.trim().toLowerCase()
    const coincideBusqueda = !term || [d.nombre, d.apellido, d.email, d.doctor?.especialidad?.nombre, d.doctor?.cmp, d.doctor?.turno]
      .some(f => String(f || '').toLowerCase().includes(term))
    const coincideEspecialidad = !filtros.especialidad || d.doctor?.especialidad?.nombre === filtros.especialidad
    const coincideTurno = !filtros.turno || d.doctor?.turno === filtros.turno
    const coincideDisponibilidad = !filtros.disponibilidad ||
      (filtros.disponibilidad === 'disponible' ? d.doctor?.disponible : !d.doctor?.disponible)
    const coincideEstado = !filtros.estado || (filtros.estado === 'activo' ? d.activo : !d.activo)
    return coincideBusqueda && coincideEspecialidad && coincideTurno && coincideDisponibilidad && coincideEstado
  }), [doctores, filtros])

  const limpiarFiltros = () => setFiltros({ busqueda: '', especialidad: '', turno: '', disponibilidad: '', estado: '' })

  const abrirDetalle = (doctor) => {
    setSelected(doctor)
    setEditing(false)
    setForm({
      nombre: doctor.nombre || '',
      apellido: doctor.apellido || '',
      email: doctor.email || '',
      telefono: doctor.telefono || '',
      cmp: doctor.doctor?.cmp || '',
      turno: doctor.doctor?.turno || 'mañana',
      id_especialidad: doctor.doctor?.id_especialidad || '',
    })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await actualizarDoctor(selected.id_usuario, form)

      const espSeleccionada = especialidades.find(
        esp => Number(esp.id_especialidad) === Number(form.id_especialidad)
      )

      const doctorActualizado = {
        ...selected,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        doctor: {
          ...selected.doctor,
          cmp: form.cmp,
          turno: form.turno,
          id_especialidad: Number(form.id_especialidad),
          especialidad: espSeleccionada || selected.doctor?.especialidad,
        }
      }

      setSelected(doctorActualizado)
      setEditing(false)
      showMsg('Doctor actualizado correctamente.')
      onUpdateDoctor?.(selected.id_usuario, doctorActualizado)

    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Error desconocido'
      setError(`Error: ${msg}`)
      console.error('[AdminDoctores] guardar:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleDisponible = async (doctor) => {
    setToggling(doctor.id_usuario)
    try {
      await toggleDisponibleDoctor(doctor.id_usuario, !doctor.doctor?.disponible)
      setSelected(prev => ({
        ...prev,
        doctor: { ...prev.doctor, disponible: !prev.doctor?.disponible }
      }))
      showMsg(`Doctor marcado como ${!doctor.doctor?.disponible ? 'disponible' : 'ocupado'}.`)
      onRefresh?.()
    } catch (err) {
      showError(err.response?.data?.detail || 'No se pudo cambiar disponibilidad.')
    } finally { setToggling(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Doctores</h2>
          <p className="mt-2 text-lg text-[#52615f]">{filtered.length} de {doctores.length} doctores registrados</p>
        </div>
      </div>

      {msg && <div className="rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-4 py-3 text-sm font-bold text-[#006b5d]">✓ {msg}</div>}
      {error && <div className="rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-4 py-3 text-sm font-bold text-[#93000a]">{error}</div>}

      <div className="medcare-card p-5">
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-[#006b5d]">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Búsqueda</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#52615f] text-[18px]">search</span>
              <input className="medcare-input medcare-input-with-icon" placeholder="Nombre, CMP, correo..."
                value={filtros.busqueda} onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Especialidad</label>
            <select className="medcare-input" value={filtros.especialidad} onChange={e => setFiltros({ ...filtros, especialidad: e.target.value })}>
              <option value="">Todas</option>
              {especialidadesFiltro.map(esp => <option key={esp.id_especialidad} value={esp.nombre}>{esp.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Turno</label>
            <select className="medcare-input" value={filtros.turno} onChange={e => setFiltros({ ...filtros, turno: e.target.value })}>
              <option value="">Todos</option>
              {turnos.map(turno => <option key={turno} value={turno}>{turno}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Disponibilidad</label>
            <select className="medcare-input" value={filtros.disponibilidad} onChange={e => setFiltros({ ...filtros, disponibilidad: e.target.value })}>
              <option value="">Todas</option>
              <option value="disponible">Disponible</option>
              <option value="ocupado">Ocupado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Estado</label>
            <select className="medcare-input" value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}>
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <button type="button" onClick={limpiarFiltros} className="mt-3 text-xs font-bold text-[#006b5d] hover:underline">
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px] xl:gap-6">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="medcare-card p-8 text-center text-[#52615f]">No se encontraron doctores.</div>
          ) : filtered.map(d => (
            <button key={d.id_usuario} type="button" onClick={() => abrirDetalle(d)}
              className={`medcare-card w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 ${selected?.id_usuario === d.id_usuario ? 'border-[#12b8a3] bg-[#f4fffc]' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d8f4ee] text-[#006b5d] text-xl font-extrabold">
                  {d.nombre?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-extrabold text-[#101828]">Dr. {d.nombre} {d.apellido}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${d.doctor?.disponible ? 'bg-[#12b8a3]' : 'bg-[#bdcbc7]'}`} />
                      <span className={`text-xs font-bold ${d.doctor?.disponible ? 'text-[#006b5d]' : 'text-[#52615f]'}`}>
                        {d.doctor?.disponible ? 'Disponible' : 'Ocupado'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${d.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                        {d.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#006b5d] font-bold mt-1">{d.doctor?.especialidad?.nombre || 'Sin especialidad'}</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-xs text-[#52615f]">CMP: {d.doctor?.cmp || '—'}</span>
                    <span className="text-xs text-[#52615f]">Turno: {d.doctor?.turno || '—'}</span>
                    <span className="text-xs text-[#52615f]">{d.email}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="medcare-card overflow-hidden h-fit xl:sticky xl:top-28">
            <div className="bg-[#007a68] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold">
                    {selected.nombre?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-lg">Dr. {selected.nombre} {selected.apellido}</p>
                    <p className="text-sm text-white/80">{selected.doctor?.especialidad?.nombre}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelected(null)}
                  className="rounded-full p-1.5 text-white/80 hover:bg-white/20 transition">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {!editing ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Email', selected.email],
                      ['Teléfono', selected.telefono || '—'],
                      ['CMP', selected.doctor?.cmp || '—'],
                      ['Turno', selected.doctor?.turno || '—'],
                      ['Especialidad', selected.doctor?.especialidad?.nombre || '—'],
                      ['Disponible', selected.doctor?.disponible ? 'Sí' : 'No'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-[#f8fbff] p-3">
                        <p className="text-xs font-bold text-[#52615f] uppercase tracking-wide">{label}</p>
                        <p className="mt-1 font-bold text-[#101828] truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button type="button" onClick={() => setEditing(true)} className={primaryButton}>
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Editar información
                      </span>
                    </button>
                    <button type="button" onClick={() => toggleDisponible(selected)}
                      disabled={toggling === selected.id_usuario} className={secondaryButton}>
                      {toggling === selected.id_usuario ? 'Actualizando...' : selected.doctor?.disponible ? 'Marcar como ocupado' : 'Marcar como disponible'}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={guardar} className="space-y-3">
                  <h3 className="font-extrabold text-[#101828]">Editar información</h3>
                  {[
                    ['nombre', 'Nombre', 'text'],
                    ['apellido', 'Apellido', 'text'],
                    ['email', 'Correo', 'email'],
                    ['telefono', 'Teléfono', 'text'],
                    ['cmp', 'CMP', 'text'],
                  ].map(([field, label, type]) => (
                    <label key={field} className="block text-sm font-bold text-[#223330]">
                      {label}
                      <input type={type} className={inputClass} value={form[field] || ''}
                        {...(field === 'telefono' ? phoneInputProps : {})}
                        onChange={e => setForm(f => ({ ...f, [field]: field === 'telefono' ? formatPhoneInput(e.target.value) : e.target.value }))} />
                    </label>
                  ))}
                  <label className="block text-sm font-bold text-[#223330]">
                    Especialidad
                    <select className={inputClass} value={form.id_especialidad}
                      onChange={e => setForm(f => ({ ...f, id_especialidad: e.target.value }))}>
                      <option value="">Sin especialidad</option>
                      {especialidades.map(esp => (
                        <option key={esp.id_especialidad} value={esp.id_especialidad}>{esp.nombre}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Turno
                    <select className={inputClass} value={form.turno}
                      onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}>
                      <option value="mañana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="noche">Noche</option>
                    </select>
                  </label>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={saving} className={`flex-1 ${primaryButton}`}>
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className={secondaryButton}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="medcare-card p-8 text-center text-[#52615f] h-fit">
            <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">person_search</span>
            <p className="mt-3 font-bold">Selecciona un doctor para ver su detalle</p>
          </div>
        )}
      </div>
    </div>
  )
}
