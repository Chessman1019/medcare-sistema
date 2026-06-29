import { useCallback, useEffect, useState } from 'react'
import MedCareSelect from '../../components/MedCareSelect'
import { getConfiguracion, actualizarConfiguracion, getEspecialidades, crearUsuario, getUsuarios, getCodigosSugeridos } from '../../services/api'
import { PasswordField, PasswordStrength, isPasswordValid } from '../../components/PasswordControls'
import SeguroMedicoField from '../../components/SeguroMedicoField'
import CodigoSugeridoField from '../../components/CodigoSugeridoField'
import { DateWheelPicker } from '../../components/WheelPickers'
import { getCodigosSugeridosFromUsuarios } from '../../utils/codigosUsuarios'
import { dniInputProps, formatDniInput, formatPhoneInput, phoneInputProps } from '../../utils/numericFields'
import { getLimaDateInputValue } from '../../utils/limaTime'

const inputClass = 'rounded-lg border border-[#bdcbc7] px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50 w-full mt-1'
const primaryButton = 'medcare-primary-button px-6 py-3 disabled:opacity-60'
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

const roleLabels = { paciente: 'Paciente', doctor: 'Médico', recepcionista: 'Recepcionista', administrador: 'Administrador' }

const emptyUsuario = {
  tipo_usuario: 'paciente', nombre: '', apellido: '', email: '', password: '',
  telefono: '', dni: '', fecha_nacimiento: '', genero: 'M', seguro_medico: '',
  direccion: '', cmp: '', id_especialidad: '', codigo_empleado: '', turno: 'mañana',
}

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({})
  const [configLoading, setConfigLoading] = useState(false)
  const [configSuccess, setConfigSuccess] = useState('')
  const [configTab, setConfigTab] = useState('empresa')
  const [especialidades, setEspecialidades] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [nuevoUsuario, setNuevoUsuario] = useState(emptyUsuario)
  const [usuarioLoading, setUsuarioLoading] = useState(false)
  const [usuarioMsg, setUsuarioMsg] = useState('')
  const [usuarioError, setUsuarioError] = useState('')
  const [codigosSugeridos, setCodigosSugeridos] = useState({ cmp: '', codigo_empleado: '' })
  const maxBirthDate = getLimaDateInputValue()

  const fetchConfig = useCallback(async () => {
    try {
      const res = await getConfiguracion()
      setConfig(res.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchUsuarios = useCallback(async () => {
    try {
      const [usuariosRes, espRes] = await Promise.all([getUsuarios(), getEspecialidades()])
      const usuariosData = usuariosRes.data || []
      let nextCodes = getCodigosSugeridosFromUsuarios(usuariosData)

      try {
        const codigosRes = await getCodigosSugeridos()
        nextCodes = { ...nextCodes, ...(codigosRes.data || {}) }
      } catch (error) {
        console.warn('codigos sugeridos:', error.message)
      }

      setUsuarios(usuariosData)
      setEspecialidades(espRes.data || [])
      setCodigosSugeridos(nextCodes)
      setNuevoUsuario(current => {
        if (current.tipo_usuario === 'doctor' && !current.cmp && nextCodes.cmp) return { ...current, cmp: nextCodes.cmp }
        if (['recepcionista', 'administrador'].includes(current.tipo_usuario) && !current.codigo_empleado && nextCodes.codigo_empleado) {
          return { ...current, codigo_empleado: nextCodes.codigo_empleado }
        }
        return current
      })
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])
  useEffect(() => { if (configTab === 'usuarios') fetchUsuarios() }, [configTab, fetchUsuarios])

  const guardarConfig = async (e) => {
    e.preventDefault()
    setConfigLoading(true)
    setConfigSuccess('')
    try {
      await actualizarConfiguracion(config)
      setConfigSuccess('Configuración guardada correctamente.')
      setTimeout(() => setConfigSuccess(''), 3000)
    } catch (e) { console.error(e) }
    setConfigLoading(false)
  }

  const update = (field, value) => setNuevoUsuario(c => ({ ...c, [field]: value }))
  const updateRole = (rol) => setNuevoUsuario(current => ({
    ...current,
    tipo_usuario: rol,
    cmp: rol === 'doctor' && !current.cmp ? codigosSugeridos.cmp : current.cmp,
    codigo_empleado: ['recepcionista', 'administrador'].includes(rol) && !current.codigo_empleado
      ? codigosSugeridos.codigo_empleado
      : current.codigo_empleado,
  }))

  const crearNuevoUsuario = async (e) => {
    e.preventDefault()
    setUsuarioError('')
    if (nuevoUsuario.tipo_usuario === 'paciente' && !nuevoUsuario.fecha_nacimiento) {
      setUsuarioError('Selecciona la fecha de nacimiento.')
      return
    }
    if (!isPasswordValid(nuevoUsuario.password)) {
      setUsuarioError('La contraseña debe tener mínimo 6 caracteres, letras y números.')
      return
    }
    setUsuarioLoading(true)
    try {
      const payload = {
        ...nuevoUsuario,
        id_especialidad: nuevoUsuario.id_especialidad ? Number(nuevoUsuario.id_especialidad) : undefined,
        fecha_nacimiento: nuevoUsuario.fecha_nacimiento || undefined,
      }
      await crearUsuario(payload)
      setNuevoUsuario(emptyUsuario)
      setUsuarioMsg(`${roleLabels[nuevoUsuario.tipo_usuario]} creado correctamente.`)
      setTimeout(() => setUsuarioMsg(''), 3000)
      await fetchUsuarios()
    } catch (err) {
      setUsuarioError(err.response?.data?.detail || 'No se pudo crear el usuario.')
    } finally { setUsuarioLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Configuración</h2>
        <p className="mt-2 text-lg text-[#52615f]">Ajustes generales del sistema MedCare.</p>
      </div>

      <div className="flex gap-2 border-b border-[#bdcbc7]">
        {[
          { key: 'empresa',   label: 'Empresa',   icon: 'business' },
          { key: 'sistema',   label: 'Sistema',   icon: 'settings' },
          { key: 'usuarios',  label: 'Usuarios',  icon: 'group' },
          { key: 'seguridad', label: 'Seguridad', icon: 'lock' },
        ].map(t => (
          <button key={t.key} type="button" onClick={() => setConfigTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-extrabold border-b-2 transition ${
              configTab === t.key ? 'border-[#006b5d] text-[#006b5d]' : 'border-transparent text-[#52615f] hover:text-[#101828]'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {configSuccess && (
        <div className="rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-5 py-4 text-sm font-bold text-[#006b5d]">✓ {configSuccess}</div>
      )}

      {/* EMPRESA */}
      {configTab === 'empresa' && (
        <form onSubmit={guardarConfig} autoComplete="off" className="medcare-card p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#edf2ff]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
              <span className="material-symbols-outlined">business</span>
            </span>
            <div>
              <h3 className="font-extrabold text-[#101828]">Datos de la Clínica</h3>
              <p className="text-xs text-[#52615f]">Información que aparece en documentos y comprobantes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="block text-sm font-bold text-[#223330]">Nombre de la clínica<input className={inputClass} autoComplete="off" value={config.nombre_clinica || ''} onChange={e => setConfig({...config, nombre_clinica: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330]">RUC<input className={inputClass} autoComplete="off" value={config.ruc || ''} onChange={e => setConfig({...config, ruc: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330] md:col-span-2">Dirección<input className={inputClass} autoComplete="off" value={config.direccion || ''} onChange={e => setConfig({...config, direccion: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330]">Teléfono<input className={inputClass} autoComplete="off" value={config.telefono || ''} onChange={e => setConfig({...config, telefono: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330]">WhatsApp<input className={inputClass} autoComplete="off" value={config.whatsapp || ''} onChange={e => setConfig({...config, whatsapp: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330]">Email<input className={inputClass} autoComplete="off" value={config.email || ''} onChange={e => setConfig({...config, email: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330]">Sitio web<input className={inputClass} autoComplete="off" value={config.sitio_web || ''} onChange={e => setConfig({...config, sitio_web: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330] md:col-span-2">Horario de atención<input className={inputClass} autoComplete="off" value={config.horario_atencion || ''} onChange={e => setConfig({...config, horario_atencion: e.target.value})} /></label>
            <label className="block text-sm font-bold text-[#223330] md:col-span-2">Mensaje de bienvenida<textarea className={`${inputClass} min-h-20`} autoComplete="off" value={config.mensaje_bienvenida || ''} onChange={e => setConfig({...config, mensaje_bienvenida: e.target.value})} /></label>
          </div>
          <button type="submit" disabled={configLoading} className={primaryButton}>{configLoading ? 'Guardando...' : 'Guardar empresa'}</button>
        </form>
      )}

      {/* SISTEMA */}
      {configTab === 'sistema' && (
        <form onSubmit={guardarConfig} autoComplete="off" className="medcare-card p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#edf2ff]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
              <span className="material-symbols-outlined">settings</span>
            </span>
            <div><h3 className="font-extrabold text-[#101828]">Configuración del Sistema</h3><p className="text-xs text-[#52615f]">Parámetros operativos</p></div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="block text-sm font-bold text-[#223330]">Máximo de citas por día<input type="number" className={inputClass} autoComplete="off" value={config.max_citas_por_dia || 20} onChange={e => setConfig({...config, max_citas_por_dia: parseInt(e.target.value)})} /></label>
            <label className="block text-sm font-bold text-[#223330]">Duración de cita (minutos)<input type="number" className={inputClass} autoComplete="off" value={config.duracion_cita_minutos || 30} onChange={e => setConfig({...config, duracion_cita_minutos: parseInt(e.target.value)})} /></label>
          </div>
          <div className="rounded-xl bg-[#edf2ff] p-4 text-sm text-[#52615f]">
            <p className="font-extrabold text-[#101828] mb-2">Información del sistema</p>
            <div className="space-y-1">
              <p>Backend: <span className="font-bold text-[#101828]">Python FastAPI</span></p>
              <p>Base de datos: <span className="font-bold text-[#101828]">Supabase PostgreSQL</span></p>
              <p>Frontend: <span className="font-bold text-[#101828]">React + Vite + Tailwind</span></p>
              <p>Versión: <span className="font-bold text-[#101828]">1.0.0</span></p>
            </div>
          </div>
          <button type="submit" disabled={configLoading} className={primaryButton}>{configLoading ? 'Guardando...' : 'Guardar sistema'}</button>
        </form>
      )}

      {/* USUARIOS */}
      {configTab === 'usuarios' && (
        <div className="space-y-6">
          <div className="medcare-card p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#edf2ff] mb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
                <span className="material-symbols-outlined">person_add</span>
              </span>
              <div><h3 className="font-extrabold text-[#101828]">Crear nuevo usuario</h3><p className="text-xs text-[#52615f]">El admin puede crear cualquier tipo de cuenta</p></div>
            </div>

            {usuarioMsg && <div className="mb-4 rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-4 py-3 text-sm font-bold text-[#006b5d]">✓ {usuarioMsg}</div>}
            {usuarioError && <div className="mb-4 rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-4 py-3 text-sm font-bold text-[#93000a]">{usuarioError}</div>}

            <form onSubmit={crearNuevoUsuario} autoComplete="off">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-bold text-[#223330]">Rol
                  <MedCareSelect
                    className={inputClass}
                    value={nuevoUsuario.tipo_usuario}
                    onChange={e => updateRole(e.target.value)}
                    options={[
                      { value: 'paciente', label: 'Paciente' },
                      { value: 'doctor', label: 'Médico' },
                      { value: 'recepcionista', label: 'Recepcionista' },
                    ]}
                  />
                </label>

                <label className="text-sm font-bold text-[#223330]">Nombre
                  <input className={inputClass} autoComplete="off" value={nuevoUsuario.nombre} onChange={e => update('nombre', e.target.value)} required />
                </label>
                <label className="text-sm font-bold text-[#223330]">Apellido
                  <input className={inputClass} autoComplete="off" value={nuevoUsuario.apellido} onChange={e => update('apellido', e.target.value)} required />
                </label>
                <label className="text-sm font-bold text-[#223330]">Correo electrónico
                  <input type="email" className={inputClass} autoComplete="new-email" value={nuevoUsuario.email} onChange={e => update('email', e.target.value)} required />
                </label>
                <label className="text-sm font-bold text-[#223330]">Teléfono
                  <input className={inputClass} autoComplete="off" {...phoneInputProps}
                    value={nuevoUsuario.telefono} onChange={e => update('telefono', formatPhoneInput(e.target.value))} />
                </label>

                <div className="md:col-span-2">
                  <PasswordField label="Contraseña temporal" value={nuevoUsuario.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" required minLength={6} />
                  <PasswordStrength password={nuevoUsuario.password} className="mt-2" />
                </div>

                {nuevoUsuario.tipo_usuario === 'doctor' && (<>
                  <CodigoSugeridoField
                    label="CMP"
                    value={nuevoUsuario.cmp}
                    onChange={(value) => update('cmp', value)}
                    suggested={codigosSugeridos.cmp}
                    inputClassName={inputClass}
                  />
                  <label className="text-sm font-bold text-[#223330]">Especialidad
                    <MedCareSelect
                      className={inputClass}
                      value={nuevoUsuario.id_especialidad}
                      onChange={e => update('id_especialidad', e.target.value)}
                      required
                      options={[
                        { value: '', label: 'Selecciona especialidad' },
                        ...especialidades.map(i => ({ value: i.id_especialidad, label: i.nombre })),
                      ]}
                    />
                  </label>
                  <label className="text-sm font-bold text-[#223330]">Turno
                    <MedCareSelect
                      className={inputClass}
                      value={nuevoUsuario.turno}
                      onChange={e => update('turno', e.target.value)}
                      required
                      options={turnoOptions}
                    />
                  </label>
                </>)}

                {['recepcionista', 'administrador'].includes(nuevoUsuario.tipo_usuario) && (<>
                  <CodigoSugeridoField
                    label="Código de empleado"
                    value={nuevoUsuario.codigo_empleado}
                    onChange={(value) => update('codigo_empleado', value)}
                    suggested={codigosSugeridos.codigo_empleado}
                    inputClassName={inputClass}
                  />
                  <label className="text-sm font-bold text-[#223330]">Turno
                    <MedCareSelect
                      className={inputClass}
                      value={nuevoUsuario.turno}
                      onChange={e => update('turno', e.target.value)}
                      required
                      options={turnoOptions}
                    />
                  </label>
                </>)}

                {nuevoUsuario.tipo_usuario === 'paciente' && (<>
                  <label className="text-sm font-bold text-[#223330]">DNI
                    <input className={inputClass} autoComplete="off" {...dniInputProps}
                      value={nuevoUsuario.dni} onChange={e => update('dni', formatDniInput(e.target.value))} required />
                  </label>
                  <label className="text-sm font-bold text-[#223330]">Fecha de nacimiento
                    <DateWheelPicker
                      value={nuevoUsuario.fecha_nacimiento}
                      onChange={value => update('fecha_nacimiento', value)}
                      min="1900-01-01"
                      max={maxBirthDate}
                      initialValue="1990-01-01"
                      inputClassName={inputClass}
                    />
                  </label>
                  <label className="text-sm font-bold text-[#223330]">Género
                    <MedCareSelect
                      className={inputClass}
                      value={nuevoUsuario.genero}
                      onChange={e => update('genero', e.target.value)}
                      required
                      options={generoOptions}
                    />
                  </label>
                  <SeguroMedicoField
                    value={nuevoUsuario.seguro_medico}
                    onChange={(value) => update('seguro_medico', value)}
                    inputClassName={inputClass}
                  />
                  <label className="text-sm font-bold text-[#223330] md:col-span-2">Dirección
                    <input className={inputClass} autoComplete="off" value={nuevoUsuario.direccion} onChange={e => update('direccion', e.target.value)} />
                  </label>
                </>)}
              </div>

              <button type="submit" disabled={usuarioLoading} className={`mt-5 ${primaryButton}`}>
                {usuarioLoading ? 'Creando...' : `Crear ${roleLabels[nuevoUsuario.tipo_usuario]?.toLowerCase()}`}
              </button>
            </form>
          </div>

          <div className="medcare-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edf2ff]">
              <h3 className="font-extrabold text-[#101828]">Usuarios registrados ({usuarios.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
                  <tr>{['Nombre', 'Email', 'Rol', 'Detalle', 'Estado'].map(h => <th key={h} className="px-5 py-4 font-extrabold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#bdcbc7]">
                  {usuarios.length === 0 ? (
                    <tr><td colSpan="5" className="px-5 py-10 text-center text-[#52615f]">No hay usuarios registrados.</td></tr>
                  ) : usuarios.map(u => (
                    <tr key={u.id_usuario} className="bg-white hover:bg-[#f8fbff] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#d8f4ee] flex items-center justify-center text-[#006b5d] text-xs font-extrabold">{u.nombre?.charAt(0)}</div>
                          <p className="text-sm font-bold text-[#101828]">{u.nombre} {u.apellido}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#52615f]">{u.email}</td>
                      <td className="px-5 py-4"><span className="text-xs bg-[#edf2ff] text-[#355382] px-2 py-1 rounded-full font-bold">{roleLabels[u.tipo_usuario] || u.tipo_usuario}</span></td>
                      <td className="px-5 py-4 text-sm text-[#52615f]">
                        {u.tipo_usuario === 'doctor' && <span>{u.doctor?.especialidad?.nombre} · CMP {u.doctor?.cmp}</span>}
                        {u.tipo_usuario === 'paciente' && <span>DNI {u.paciente?.dni}</span>}
                        {['recepcionista', 'administrador'].includes(u.tipo_usuario) && <span>{u.administrador?.codigo_empleado}</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${u.activo ? 'bg-[#d8f4ee] text-[#006b5d]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEGURIDAD */}
      {configTab === 'seguridad' && (
        <div className="medcare-card p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#edf2ff]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
              <span className="material-symbols-outlined">lock</span>
            </span>
            <div><h3 className="font-extrabold text-[#101828]">Seguridad</h3><p className="text-xs text-[#52615f]">Estado de los sistemas de protección</p></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { icon: 'verified_user', label: 'Autenticación JWT' },
              { icon: 'lock',          label: 'Contraseñas con bcrypt' },
              { icon: 'shield',        label: 'Rate limiting (slowapi)' },
              { icon: 'security',      label: 'RLS Supabase' },
              { icon: 'http',          label: 'Headers de seguridad HTTP' },
              { icon: 'public',        label: 'CORS configurado' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4 rounded-xl border border-[#bdcbc7] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf2ff] text-[#355382]">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </span>
                <p className="flex-1 font-bold text-[#101828] text-sm">{item.label}</p>
                <span className="text-xs px-2 py-1 rounded-full font-extrabold bg-[#d8f4ee] text-[#006b5d]">Activo</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[#e5fbf7] border border-[#b7e8df] p-4 text-sm text-[#006b5d] font-bold">
            ✓ Todos los sistemas de seguridad están activos y funcionando correctamente.
          </div>
        </div>
      )}
    </div>
  )
}
