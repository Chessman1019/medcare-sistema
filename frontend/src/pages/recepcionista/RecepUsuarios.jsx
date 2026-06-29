import { useMemo, useState } from 'react'
import FormError from '../../components/FormError'
import MedCareSelect from '../../components/MedCareSelect'
import { PasswordField, PasswordStrength } from '../../components/PasswordControls'
import SeguroMedicoField from '../../components/SeguroMedicoField'
import CodigoSugeridoField from '../../components/CodigoSugeridoField'
import { DateWheelPicker } from '../../components/WheelPickers'
import { useFormValidation } from '../../hooks/useFormValidation'
import { validateUserCreationForm } from '../../utils/formValidation'
import { dniInputProps, formatDniInput, formatPhoneInput, phoneInputProps } from '../../utils/numericFields'
import { getLimaDateInputValue } from '../../utils/limaTime'

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 w-full mt-1 disabled:cursor-not-allowed disabled:bg-[#f8fbff]'
const roleLabels = { paciente: 'Paciente', doctor: 'Médico', recepcionista: 'Recepcionista', administrador: 'Administrador' }
const turnoOptions = [
  { value: 'mañana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
]
const generoOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
]

export default function RecepUsuarios({ usuarios, usuarioAdmin, setUsuarioAdmin, especialidades, codigosSugeridos = {}, actionLoading, onCrearUsuario, onShowMessage }) {
  const [filtros, setFiltros] = useState({ busqueda: '', rol: '', estado: '' })
  const maxBirthDate = getLimaDateInputValue()
  const { fieldErrors, applyErrors, clearFieldError, inputClass: fieldInputClass } = useFormValidation()
  const updateField = (field, value) => {
    setUsuarioAdmin(c => ({ ...c, [field]: value }))
    clearFieldError(field)
  }
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
    const validation = validateUserCreationForm(usuarioAdmin, usuarioAdmin.tipo_usuario)
    if (!validation.valid) {
      applyErrors(validation.errors)
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

      <form noValidate onSubmit={handleSubmit} className="medcare-card p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-bold text-[#223330]">
            Rol
            <MedCareSelect
              className={fieldInputClass('tipo_usuario', inputClass)}
              value={usuarioAdmin.tipo_usuario}
              onChange={e => updateRole(e.target.value)}
              options={[
                { value: 'doctor', label: 'Médico' },
                { value: 'recepcionista', label: 'Recepcionista' },
                { value: 'paciente', label: 'Paciente' },
              ]}
            />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Nombre
            <input data-field="nombre" className={fieldInputClass('nombre', inputClass)} value={usuarioAdmin.nombre} onChange={e => updateField('nombre', e.target.value)} />
            <FormError message={fieldErrors.nombre} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Apellido
            <input data-field="apellido" className={fieldInputClass('apellido', inputClass)} value={usuarioAdmin.apellido} onChange={e => updateField('apellido', e.target.value)} />
            <FormError message={fieldErrors.apellido} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Correo
            <input data-field="email" type="text" inputMode="email" autoComplete="email" className={fieldInputClass('email', inputClass)} value={usuarioAdmin.email} onChange={e => updateField('email', e.target.value)} />
            <FormError message={fieldErrors.email} />
          </label>

          <div className="md:col-span-2 xl:col-span-2">
            <PasswordField label="Contraseña temporal" data-field="password" value={usuarioAdmin.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
              inputClassName={inputClass.replace(' mt-1', '')}
              error={Boolean(fieldErrors.password)} />
            <FormError message={fieldErrors.password} />
            <PasswordStrength password={usuarioAdmin.password} className="mt-3" />
          </div>
          <label className="block text-sm font-bold text-[#223330]">
            Teléfono
            <input data-field="telefono" className={fieldInputClass('telefono', inputClass)} {...phoneInputProps}
              value={usuarioAdmin.telefono} onChange={e => updateField('telefono', formatPhoneInput(e.target.value))} />
            <FormError message={fieldErrors.telefono} />
          </label>

          {usuarioAdmin.tipo_usuario === 'doctor' && (<>
            <CodigoSugeridoField
              label="CMP"
              value={usuarioAdmin.cmp}
              onChange={(value) => updateField('cmp', value)}
              suggested={codigosSugeridos.cmp}
              inputClassName={fieldInputClass('cmp', inputClass)}
            />
            <FormError message={fieldErrors.cmp} />
            <label className="block text-sm font-bold text-[#223330]">Especialidad
              <MedCareSelect
                className={fieldInputClass('id_especialidad', inputClass)}
                value={usuarioAdmin.id_especialidad}
                onChange={e => updateField('id_especialidad', e.target.value)}
                error={Boolean(fieldErrors.id_especialidad)}
                options={[
                  { value: '', label: 'Selecciona especialidad' },
                  ...especialidades.map(i => ({ value: i.id_especialidad, label: i.nombre })),
                ]}
              />
              <FormError message={fieldErrors.id_especialidad} />
            </label>
            <label className="block text-sm font-bold text-[#223330]">Turno
              <MedCareSelect
                className={fieldInputClass('turno', inputClass)}
                value={usuarioAdmin.turno}
                onChange={e => updateField('turno', e.target.value)}
                error={Boolean(fieldErrors.turno)}
                options={turnoOptions}
              />
              <FormError message={fieldErrors.turno} />
            </label>
          </>)}

          {['recepcionista', 'administrador'].includes(usuarioAdmin.tipo_usuario) && (<>
            <CodigoSugeridoField
              label="Código de empleado"
              value={usuarioAdmin.codigo_empleado}
              onChange={(value) => updateField('codigo_empleado', value)}
              suggested={codigosSugeridos.codigo_empleado}
              inputClassName={fieldInputClass('codigo_empleado', inputClass)}
            />
            <FormError message={fieldErrors.codigo_empleado} />
            <label className="block text-sm font-bold text-[#223330]">Turno
              <MedCareSelect
                className={fieldInputClass('turno', inputClass)}
                value={usuarioAdmin.turno}
                onChange={e => updateField('turno', e.target.value)}
                error={Boolean(fieldErrors.turno)}
                options={turnoOptions}
              />
              <FormError message={fieldErrors.turno} />
            </label>
          </>)}

          {usuarioAdmin.tipo_usuario === 'paciente' && (<>
            <label className="block text-sm font-bold text-[#223330]">
              DNI
              <input data-field="dni" className={fieldInputClass('dni', inputClass)} {...dniInputProps}
                value={usuarioAdmin.dni} onChange={e => updateField('dni', formatDniInput(e.target.value))} />
              <FormError message={fieldErrors.dni} />
            </label>
            <label className="block text-sm font-bold text-[#223330]">Fecha nacimiento
              <DateWheelPicker
                value={usuarioAdmin.fecha_nacimiento}
                onChange={value => updateField('fecha_nacimiento', value)}
                min="1900-01-01"
                max={maxBirthDate}
                initialValue="1990-01-01"
                inputClassName={fieldInputClass('fecha_nacimiento', inputClass)}
              />
              <FormError message={fieldErrors.fecha_nacimiento} />
            </label>
            <label className="block text-sm font-bold text-[#223330]">Género
              <MedCareSelect
                className={fieldInputClass('genero', inputClass)}
                value={usuarioAdmin.genero}
                onChange={e => updateField('genero', e.target.value)}
                error={Boolean(fieldErrors.genero)}
                options={generoOptions}
              />
              <FormError message={fieldErrors.genero} />
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
            <MedCareSelect
              className="medcare-input"
              value={filtros.rol}
              onChange={e => setFiltros({ ...filtros, rol: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                ...rolesFiltro.map(rol => ({ value: rol, label: roleLabels[rol] || rol })),
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
