import { useMemo, useState } from 'react'
import { PasswordField, PasswordStrength, isPasswordValid } from '../../components/PasswordControls'
import SeguroMedicoField from '../../components/SeguroMedicoField'
import CodigoSugeridoField from '../../components/CodigoSugeridoField'
import { dniInputProps, formatDniInput, formatPhoneInput, phoneInputProps } from '../../utils/numericFields'

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 w-full mt-1 disabled:cursor-not-allowed disabled:bg-[#f8fbff]'
const roleLabels = { paciente: 'Paciente', doctor: 'Médico', recepcionista: 'Recepcionista', administrador: 'Administrador' }

export default function RecepUsuarios({ usuarios, usuarioAdmin, setUsuarioAdmin, especialidades, codigosSugeridos = {}, actionLoading, onCrearUsuario, onShowMessage }) {
  const [filtros, setFiltros] = useState({ busqueda: '', rol: '', estado: '' })
  const updateField = (field, value) => setUsuarioAdmin(c => ({ ...c, [field]: value }))
  const updateRole = (rol) => setUsuarioAdmin(current => ({
    ...current,
    tipo_usuario: rol,
    cmp: rol === 'doctor' && !current.cmp ? codigosSugeridos.cmp || '' : current.cmp,
    codigo_empleado: ['recepcionista', 'administrador'].includes(rol) && !current.codigo_empleado
      ? codigosSugeridos.codigo_empleado || ''
      : current.codigo_empleado,
  }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isPasswordValid(usuarioAdmin.password)) {
      onShowMessage('La contraseña debe tener mínimo 6 caracteres, letras y números.')
      return
    }
    onCrearUsuario(event)
  }

  const rolesFiltro = useMemo(() => {
    const unique = new Set(usuarios.map(item => item.tipo_usuario).filter(Boolean))
    return [...unique].sort((a, b) => (roleLabels[a] || a).localeCompare(roleLabels[b] || b, 'es-PE'))
  }, [usuarios])

  const usuariosFiltrados = useMemo(() => usuarios.filter(item => {
    const term = filtros.busqueda.trim().toLowerCase()
    const detalle = item.tipo_usuario === 'doctor'
      ? [item.doctor?.especialidad?.nombre, item.doctor?.cmp, item.doctor?.turno]
      : item.tipo_usuario === 'paciente'
        ? [item.paciente?.dni, item.paciente?.seguro_medico, item.paciente?.genero]
        : [item.administrador?.codigo_empleado, item.administrador?.turno]
    const coincideBusqueda = !term || [
      item.nombre, item.apellido, item.email, item.telefono, item.tipo_usuario, ...detalle,
    ].some(value => String(value || '').toLowerCase().includes(term))
    const coincideRol = !filtros.rol || item.tipo_usuario === filtros.rol
    const coincideEstado = !filtros.estado || (filtros.estado === 'activo' ? item.activo : !item.activo)
    return coincideBusqueda && coincideRol && coincideEstado
  }), [filtros, usuarios])

  const limpiarFiltros = () => setFiltros({ busqueda: '', rol: '', estado: '' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Gestión de usuarios</h2>
        <p className="mt-2 text-lg text-[#52615f]">{usuariosFiltrados.length} de {usuarios.length} usuarios registrados.</p>
      </div>

      <form onSubmit={handleSubmit} className="medcare-card p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-bold text-[#223330]">
            Rol
            <select className={inputClass} value={usuarioAdmin.tipo_usuario}
              onChange={e => updateRole(e.target.value)}>
              <option value="doctor">Médico</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="paciente">Paciente</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-[#223330]">Nombre<input className={inputClass} value={usuarioAdmin.nombre} onChange={e => updateField('nombre', e.target.value)} required /></label>
          <label className="block text-sm font-bold text-[#223330]">Apellido<input className={inputClass} value={usuarioAdmin.apellido} onChange={e => updateField('apellido', e.target.value)} required /></label>
          <label className="block text-sm font-bold text-[#223330]">Correo<input type="email" className={inputClass} value={usuarioAdmin.email} onChange={e => updateField('email', e.target.value)} required /></label>

          <div className="md:col-span-2 xl:col-span-2">
            <PasswordField label="Contraseña temporal" value={usuarioAdmin.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="••••••••" autoComplete="new-password" required minLength={6} />
            <PasswordStrength password={usuarioAdmin.password} className="mt-3" />
          </div>
          <label className="block text-sm font-bold text-[#223330]">Teléfono<input className={inputClass} {...phoneInputProps}
            value={usuarioAdmin.telefono} onChange={e => updateField('telefono', formatPhoneInput(e.target.value))} /></label>

          {usuarioAdmin.tipo_usuario === 'doctor' && (<>
            <CodigoSugeridoField
              label="CMP"
              value={usuarioAdmin.cmp}
              onChange={(value) => updateField('cmp', value)}
              suggested={codigosSugeridos.cmp}
              inputClassName={inputClass}
            />
            <label className="block text-sm font-bold text-[#223330]">Especialidad
              <select className={inputClass} value={usuarioAdmin.id_especialidad} onChange={e => updateField('id_especialidad', e.target.value)} required>
                <option value="">Selecciona especialidad</option>
                {especialidades.map(i => <option key={i.id_especialidad} value={i.id_especialidad}>{i.nombre}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-[#223330]">Turno
              <select className={inputClass} value={usuarioAdmin.turno} onChange={e => updateField('turno', e.target.value)} required>
                <option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
              </select>
            </label>
          </>)}

          {['recepcionista', 'administrador'].includes(usuarioAdmin.tipo_usuario) && (<>
            <CodigoSugeridoField
              label="Código de empleado"
              value={usuarioAdmin.codigo_empleado}
              onChange={(value) => updateField('codigo_empleado', value)}
              suggested={codigosSugeridos.codigo_empleado}
              inputClassName={inputClass}
            />
            <label className="block text-sm font-bold text-[#223330]">Turno
              <select className={inputClass} value={usuarioAdmin.turno} onChange={e => updateField('turno', e.target.value)} required>
                <option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
              </select>
            </label>
          </>)}

          {usuarioAdmin.tipo_usuario === 'paciente' && (<>
            <label className="block text-sm font-bold text-[#223330]">DNI<input className={inputClass} {...dniInputProps}
              value={usuarioAdmin.dni} onChange={e => updateField('dni', formatDniInput(e.target.value))} required /></label>
            <label className="block text-sm font-bold text-[#223330]">Fecha nacimiento<input type="date" className={inputClass} value={usuarioAdmin.fecha_nacimiento} onChange={e => updateField('fecha_nacimiento', e.target.value)} required /></label>
            <label className="block text-sm font-bold text-[#223330]">Género
              <select className={inputClass} value={usuarioAdmin.genero} onChange={e => updateField('genero', e.target.value)} required>
                <option value="M">Masculino</option><option value="F">Femenino</option><option value="Otro">Otro</option>
              </select>
            </label>
            <SeguroMedicoField
              value={usuarioAdmin.seguro_medico}
              onChange={(value) => updateField('seguro_medico', value)}
              inputClassName={inputClass}
            />
            <label className="block text-sm font-bold text-[#223330] md:col-span-2">Dirección<input className={inputClass} value={usuarioAdmin.direccion} onChange={e => updateField('direccion', e.target.value)} /></label>
          </>)}
        </div>
        <button type="submit" disabled={actionLoading === 'usuario-admin'}
          className="medcare-primary-button px-6 py-3 disabled:opacity-60">
          {actionLoading === 'usuario-admin' ? 'Creando...' : `Crear ${roleLabels[usuarioAdmin.tipo_usuario]?.toLowerCase()}`}
        </button>
      </form>

      <div className="medcare-card p-5">
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-[#006b5d]">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Búsqueda</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#52615f] text-[18px]">search</span>
              <input className="medcare-input medcare-input-with-icon" placeholder="Nombre, correo, DNI, CMP..."
                value={filtros.busqueda} onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#223330]">Rol</label>
            <select className="medcare-input" value={filtros.rol} onChange={e => setFiltros({ ...filtros, rol: e.target.value })}>
              <option value="">Todos</option>
              {rolesFiltro.map(rol => <option key={rol} value={rol}>{roleLabels[rol] || rol}</option>)}
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

      {/* Tabla usuarios */}
      <div className="medcare-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
              <tr>
                {['Usuario', 'Rol', 'Contacto', 'Detalle', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {usuariosFiltrados.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-[#52615f]">No hay usuarios para mostrar.</td></tr>
              ) : usuariosFiltrados.map(item => (
                <tr key={item.id_usuario} className="bg-white transition hover:bg-[#f8fbff]">
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-[#101828]">{item.nombre} {item.apellido}</p>
                    <p className="text-xs text-[#52615f]">ID #{item.id_usuario}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-[#bdcbc7] bg-[#f8fbff] px-3 py-1 text-xs font-extrabold text-[#223330]">
                      {roleLabels[item.tipo_usuario] || item.tipo_usuario}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">
                    <p>{item.email}</p>
                    <p className="text-xs">{item.telefono || 'Sin teléfono'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">
                    {item.tipo_usuario === 'doctor' && <span>{item.doctor?.especialidad?.nombre || 'Sin especialidad'} · CMP {item.doctor?.cmp || '—'}</span>}
                    {item.tipo_usuario === 'paciente' && <span>DNI {item.paciente?.dni || '—'}</span>}
                    {['recepcionista', 'administrador'].includes(item.tipo_usuario) && <span>{item.administrador?.codigo_empleado || 'Sin código'}</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${item.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
