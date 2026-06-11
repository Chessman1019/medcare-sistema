import { PasswordField, PasswordStrength, isPasswordValid } from '../../components/PasswordControls'

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const roleLabels = { paciente: 'Paciente', doctor: 'Médico', recepcionista: 'Recepcionista', administrador: 'Administrador' }

export default function RecepUsuarios({ usuarios, usuarioAdmin, setUsuarioAdmin, especialidades, actionLoading, onCrearUsuario, onShowMessage }) {
  const updateField = (field, value) => setUsuarioAdmin(c => ({ ...c, [field]: value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isPasswordValid(usuarioAdmin.password)) {
      onShowMessage('La contraseña debe tener mínimo 6 caracteres, letras y números.')
      return
    }
    onCrearUsuario(event)
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gestión de usuarios</h2>
        <p className="mt-1 text-sm text-slate-500">Alta de administradores, recepcionistas, médicos y pacientes.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            Rol
            <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.tipo_usuario} onChange={e => updateField('tipo_usuario', e.target.value)}>
              <option value="doctor">Médico</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="administrador">Administrador</option>
              <option value="paciente">Paciente</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Nombre<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.nombre} onChange={e => updateField('nombre', e.target.value)} required /></label>
          <label className="text-sm font-medium text-slate-700">Apellido<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.apellido} onChange={e => updateField('apellido', e.target.value)} required /></label>
          <label className="text-sm font-medium text-slate-700">Correo<input type="email" className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.email} onChange={e => updateField('email', e.target.value)} required /></label>
          <div className="md:col-span-2 xl:col-span-2">
            <PasswordField label="Contraseña temporal" value={usuarioAdmin.password} onChange={e => updateField('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" required minLength={6} />
            <PasswordStrength password={usuarioAdmin.password} className="mt-3" />
          </div>
          <label className="text-sm font-medium text-slate-700">Teléfono<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.telefono} onChange={e => updateField('telefono', e.target.value)} /></label>

          {usuarioAdmin.tipo_usuario === 'doctor' && (<>
            <label className="text-sm font-medium text-slate-700">CMP<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.cmp} onChange={e => updateField('cmp', e.target.value)} required /></label>
            <label className="text-sm font-medium text-slate-700">Especialidad
              <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.id_especialidad} onChange={e => updateField('id_especialidad', e.target.value)} required>
                <option value="">Selecciona especialidad</option>
                {especialidades.map(i => <option key={i.id_especialidad} value={i.id_especialidad}>{i.nombre}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Turno
              <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.turno} onChange={e => updateField('turno', e.target.value)} required>
                <option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
              </select>
            </label>
          </>)}

          {['recepcionista', 'administrador'].includes(usuarioAdmin.tipo_usuario) && (<>
            <label className="text-sm font-medium text-slate-700">Código empleado<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.codigo_empleado} onChange={e => updateField('codigo_empleado', e.target.value)} required /></label>
            <label className="text-sm font-medium text-slate-700">Turno
              <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.turno} onChange={e => updateField('turno', e.target.value)} required>
                <option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
              </select>
            </label>
          </>)}

          {usuarioAdmin.tipo_usuario === 'paciente' && (<>
            <label className="text-sm font-medium text-slate-700">DNI<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.dni} onChange={e => updateField('dni', e.target.value)} required /></label>
            <label className="text-sm font-medium text-slate-700">Fecha nacimiento<input type="date" className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.fecha_nacimiento} onChange={e => updateField('fecha_nacimiento', e.target.value)} required /></label>
            <label className="text-sm font-medium text-slate-700">Género
              <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.genero} onChange={e => updateField('genero', e.target.value)} required>
                <option value="M">Masculino</option><option value="F">Femenino</option><option value="Otro">Otro</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Seguro médico<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.seguro_medico} onChange={e => updateField('seguro_medico', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Dirección<input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.direccion} onChange={e => updateField('direccion', e.target.value)} /></label>
          </>)}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={actionLoading === 'usuario-admin'} className={primaryButton}>
            {actionLoading === 'usuario-admin' ? 'Creando...' : `Crear ${roleLabels[usuarioAdmin.tipo_usuario]?.toLowerCase()}`}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{['Usuario', 'Rol', 'Contacto', 'Detalle', 'Estado'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No hay usuarios para mostrar.</td></tr>
            ) : usuarios.map(item => (
              <tr key={item.id_usuario} className="transition hover:bg-[#f8fbff]">
                <td className="px-4 py-4"><p className="font-medium text-slate-900">{item.nombre} {item.apellido}</p><p className="text-xs text-slate-500">ID #{item.id_usuario}</p></td>
                <td className="px-4 py-4"><span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{roleLabels[item.tipo_usuario] || item.tipo_usuario}</span></td>
                <td className="px-4 py-4 text-slate-600"><p>{item.email}</p><p className="text-xs text-slate-500">{item.telefono || 'Sin teléfono'}</p></td>
                <td className="px-4 py-4 text-slate-600">
                  {item.tipo_usuario === 'doctor' && <span>{item.doctor?.especialidad?.nombre || 'Sin especialidad'} · CMP {item.doctor?.cmp || 'sin registrar'}</span>}
                  {item.tipo_usuario === 'paciente' && <span>DNI {item.paciente?.dni || 'sin registrar'}</span>}
                  {['recepcionista', 'administrador'].includes(item.tipo_usuario) && <span>{item.administrador?.codigo_empleado || 'Sin código'}</span>}
                </td>
                <td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${item.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{item.activo ? 'Activo' : 'Inactivo'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}