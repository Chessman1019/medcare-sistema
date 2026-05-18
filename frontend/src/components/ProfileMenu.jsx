/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { actualizarPerfil, cambiarContrasenaPerfil, getPerfil } from '../services/api'

const roleLabel = {
  paciente: 'Paciente',
  doctor: 'Médico',
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
}

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

function splitSavedName(name = '') {
  const parts = name.trim().split(/\s+/)
  return {
    nombre: parts[0] || '',
    apellido: parts.slice(1).join(' '),
  }
}

function getInitial(user) {
  return (user?.nombre || 'M').trim().charAt(0).toUpperCase()
}

function getDisplayName(user, profile) {
  if (profile?.nombre || profile?.apellido) return `${profile.nombre || ''} ${profile.apellido || ''}`.trim()
  return user?.nombre || 'Usuario MedCare'
}

export default function ProfileMenu() {
  const { user, logoutUser, updateUser } = useAuth()
  const savedName = splitSavedName(user?.nombre)
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState(null)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    nombre: savedName.nombre,
    apellido: savedName.apellido,
    telefono: '',
    direccion: '',
    seguro_medico: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!panel) return

    let mounted = true
    setLoading(true)
    setError('')

    getPerfil()
      .then((res) => {
        if (!mounted) return
        const data = res.data
        setProfile(data)
        setForm({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          direccion: data.paciente?.direccion || '',
          seguro_medico: data.paciente?.seguro_medico || '',
        })
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.response?.data?.detail || 'No se pudo cargar el perfil.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [panel])

  const closePanel = () => {
    setPanel(null)
    setMessage('')
    setError('')
    setPasswordForm({ contrasena_actual: '', nueva_contrasena: '', confirmar: '' })
  }

  const handleLogout = () => {
    logoutUser()
    window.location.href = '/login'
  }

  const openPanel = (nextPanel) => {
    setOpen(false)
    setPanel(nextPanel)
    setMessage('')
    setError('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await actualizarPerfil({
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
        direccion: form.direccion,
        seguro_medico: form.seguro_medico,
      })
      const data = res.data
      setProfile(data)
      updateUser({
        nombre: `${data.nombre || ''} ${data.apellido || ''}`.trim(),
        email: data.email,
        telefono: data.telefono,
      })
      setMessage('Perfil actualizado correctamente.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudo actualizar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (passwordForm.nueva_contrasena !== passwordForm.confirmar) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    try {
      await cambiarContrasenaPerfil({
        contrasena_actual: passwordForm.contrasena_actual,
        nueva_contrasena: passwordForm.nueva_contrasena,
      })
      setPasswordForm({ contrasena_actual: '', nueva_contrasena: '', confirmar: '' })
      setMessage('Contraseña actualizada correctamente.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudo cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const detailRows = [
    ['Correo', profile?.email || user?.email || 'Sin correo'],
    ['Rol', roleLabel[profile?.tipo_usuario || user?.rol] || 'Portal clínico'],
    ...(profile?.doctor ? [
      ['CMP', profile.doctor.cmp || 'Sin registrar'],
      ['Especialidad', profile.doctor.especialidad?.nombre || 'Sin especialidad'],
    ] : []),
    ...(profile?.administrador ? [
      ['Código de empleado', profile.administrador.codigo_empleado || 'Sin registrar'],
      ['Turno', profile.administrador.turno || 'Sin turno'],
    ] : []),
    ...(profile?.paciente ? [
      ['DNI', profile.paciente.dni || 'Sin registrar'],
      ['Fecha de nacimiento', profile.paciente.fecha_nacimiento || 'Sin registrar'],
    ] : []),
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-[#edf2ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]"
        aria-label="Abrir menú de perfil"
        aria-expanded={open}
      >
        <div className="hidden text-right sm:block">
          <p className="max-w-36 truncate text-sm font-extrabold text-[#101828]">{getDisplayName(user, profile)}</p>
          <p className="text-xs text-[#52615f]">{roleLabel[user?.rol] || 'Portal clínico'}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#12b8a3] bg-white text-base font-extrabold text-[#006b5d] sm:h-12 sm:w-12">
          {getInitial(user)}
        </span>
        <span className="material-symbols-outlined hidden text-[#223330] sm:inline">expand_more</span>
      </button>

      {open && (
        <div className="fixed right-3 top-20 z-50 w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#bdcbc7] bg-white shadow-2xl shadow-[#08284d]/12 sm:absolute sm:right-0 sm:top-14 sm:w-72">
          <div className="border-b border-[#d8e3fb] bg-[#f8fbff] px-4 py-4">
            <p className="font-extrabold text-[#101828]">{getDisplayName(user, profile)}</p>
            <p className="text-sm text-[#52615f]">{user?.email || profile?.email || roleLabel[user?.rol]}</p>
          </div>
          <div className="p-2">
            <button type="button" onClick={() => openPanel('perfil')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-[#223330] transition hover:bg-[#edf2ff] hover:text-[#006b5d]">
              <span className="material-symbols-outlined">person</span>
              Ver perfil
            </button>
            <button type="button" onClick={() => openPanel('contrasena')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-[#223330] transition hover:bg-[#edf2ff] hover:text-[#006b5d]">
              <span className="material-symbols-outlined">lock_reset</span>
              Cambiar contraseña
            </button>
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-[#93000a] transition hover:bg-[#fff0ef]">
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#08284d]/30 px-4 py-6 backdrop-blur-sm sm:py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#bdcbc7] bg-white shadow-2xl shadow-[#08284d]/20">
            <div className="flex items-start justify-between gap-4 border-b border-[#d8e3fb] bg-[#f8fbff] px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#006b5d]">Cuenta MedCare</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#101828]">{panel === 'perfil' ? 'Mi perfil' : 'Cambiar contraseña'}</h2>
              </div>
              <button type="button" onClick={closePanel} className="rounded-lg p-2 text-[#52615f] transition hover:bg-white hover:text-[#006b5d]" aria-label="Cerrar perfil">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div>}
              {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div>}

              {panel === 'perfil' && (
                <form onSubmit={saveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nombre
                      <input className={inputClass} value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Apellido
                      <input className={inputClass} value={form.apellido} onChange={(event) => setForm({ ...form, apellido: event.target.value })} required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Teléfono
                      <input className={inputClass} value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Correo
                      <input className={inputClass} value={profile?.email || user?.email || ''} disabled />
                    </label>
                    {profile?.tipo_usuario === 'paciente' && (
                      <>
                        <label className="text-sm font-medium text-slate-700">
                          Seguro médico
                          <input className={inputClass} value={form.seguro_medico} onChange={(event) => setForm({ ...form, seguro_medico: event.target.value })} />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Dirección
                          <input className={inputClass} value={form.direccion} onChange={(event) => setForm({ ...form, direccion: event.target.value })} />
                        </label>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-2">
                    {detailRows.map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                        <p className="mt-1 font-semibold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="submit" disabled={loading} className={primaryButton}>
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button type="button" onClick={() => openPanel('contrasena')} className={secondaryButton}>
                      Cambiar contraseña
                    </button>
                  </div>
                </form>
              )}

              {panel === 'contrasena' && (
                <form onSubmit={savePassword} className="max-w-xl space-y-4">
                  <label className="text-sm font-medium text-slate-700">
                    Contraseña actual
                    <input type="password" className={inputClass} value={passwordForm.contrasena_actual} onChange={(event) => setPasswordForm({ ...passwordForm, contrasena_actual: event.target.value })} required />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Nueva contraseña
                    <input type="password" className={inputClass} value={passwordForm.nueva_contrasena} onChange={(event) => setPasswordForm({ ...passwordForm, nueva_contrasena: event.target.value })} minLength={6} required />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Confirmar nueva contraseña
                    <input type="password" className={inputClass} value={passwordForm.confirmar} onChange={(event) => setPasswordForm({ ...passwordForm, confirmar: event.target.value })} minLength={6} required />
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="submit" disabled={loading} className={primaryButton}>
                      {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                    <button type="button" onClick={() => openPanel('perfil')} className={secondaryButton}>
                      Volver al perfil
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
