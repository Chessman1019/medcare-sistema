/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { actualizarPerfil, cambiarContrasenaPerfil, getPerfil } from '../services/api'
import { isPasswordValid, PasswordField } from './PasswordControls'

const roleLabel = {
  paciente: 'Paciente',
  doctor: 'Médico',
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
}

const roleIcon = {
  paciente: 'personal_injury',
  doctor: 'stethoscope',
  recepcionista: 'support_agent',
  administrador: 'admin_panel_settings',
}

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'
const primaryButton = 'rounded-lg bg-[#007a68] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

function splitSavedName(name = '') {
  const parts = name.trim().split(/\s+/)
  return {
    nombre: parts[0] || '',
    apellido: parts.slice(1).join(' '),
  }
}

function getInitial(user, profile) {
  return (profile?.nombre || user?.nombre || 'M').trim().charAt(0).toUpperCase()
}

function getDisplayName(user, profile) {
  if (profile?.nombre || profile?.apellido) return `${profile.nombre || ''} ${profile.apellido || ''}`.trim()
  return user?.nombre || 'Usuario MedCare'
}

function normalizeValue(value) {
  return value || 'Sin registrar'
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5fbf7] text-[#006b5d]">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function PasswordStrength({ password }) {
  const checks = [
    ['Mínimo 6 caracteres', password.length >= 6],
    ['Incluye letras', /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(password)],
    ['Incluye números', /\d/.test(password)],
  ]
  const strength = checks.filter(([, ok]) => ok).length

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="mb-3 flex gap-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-full transition ${index < strength ? 'bg-[#12b8a3]' : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        {checks.map(([label, ok]) => (
          <span key={label} className={`flex items-center gap-2 ${ok ? 'text-[#006b5d]' : 'text-slate-500'}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${ok ? 'border-[#007a68] bg-[#007a68]' : 'border-slate-400 bg-white'}`}>
              {ok && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
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
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeRole = profile?.tipo_usuario || user?.rol
  const displayName = getDisplayName(user, profile)

  useEffect(() => {
    if (!panel) return

    let mounted = true
    setLoadingProfile(true)
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
        if (mounted) setLoadingProfile(false)
      })

    return () => {
      mounted = false
    }
  }, [panel])

  const detailRows = useMemo(() => {
    return [
      ['alternate_email', 'Correo', normalizeValue(profile?.email || user?.email)],
      ['badge', 'Rol', roleLabel[activeRole] || 'Portal clínico'],
      ['phone_iphone', 'Teléfono', normalizeValue(profile?.telefono || user?.telefono)],
      ...(profile?.doctor ? [
        ['verified', 'CMP', normalizeValue(profile.doctor.cmp)],
        ['medical_services', 'Especialidad', normalizeValue(profile.doctor.especialidad?.nombre)],
        ['schedule', 'Turno', normalizeValue(profile.doctor.turno)],
      ] : []),
      ...(profile?.administrador ? [
        ['id_card', 'Código de empleado', normalizeValue(profile.administrador.codigo_empleado)],
        ['schedule', 'Turno', normalizeValue(profile.administrador.turno)],
      ] : []),
      ...(profile?.paciente ? [
        ['credit_card', 'DNI', normalizeValue(profile.paciente.dni)],
        ['cake', 'Fecha de nacimiento', normalizeValue(profile.paciente.fecha_nacimiento)],
        ['health_and_safety', 'Seguro médico', normalizeValue(profile.paciente.seguro_medico)],
        ['home_pin', 'Dirección', normalizeValue(profile.paciente.direccion)],
      ] : []),
    ]
  }, [activeRole, profile, user?.email, user?.telefono])

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

    if (!isPasswordValid(passwordForm.nueva_contrasena)) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres, letras y números.')
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

  const modal = panel && typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#08284d]/40 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-10" role="dialog" aria-modal="true">
      <div className="flex max-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-[#08284d]/25">
        <div className="relative overflow-hidden border-b border-[#d8e3fb] bg-[linear-gradient(135deg,#f8fbff_0%,#eef8f6_55%,#ffffff_100%)] px-5 py-5 sm:px-7">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#12b8a3]/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#12b8a3]/30 bg-white text-2xl font-extrabold text-[#006b5d] shadow-sm">
                {getInitial(user, profile)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5d]">Cuenta MedCare</p>
                <h2 className="mt-1 truncate text-2xl font-extrabold text-[#101828] sm:text-3xl">
                  {panel === 'perfil' ? 'Mi perfil' : 'Cambiar contraseña'}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#52615f]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold text-[#006b5d] shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">{roleIcon[activeRole] || 'account_circle'}</span>
                    {roleLabel[activeRole] || 'Portal clínico'}
                  </span>
                  <span className="truncate">{profile?.email || user?.email || displayName}</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={closePanel} className="rounded-lg p-2 text-[#52615f] transition hover:bg-white hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20" aria-label="Cerrar perfil">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto bg-[#fbfcff]">
          <div className="space-y-5 p-5 sm:p-7">
            {message && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {message}
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            {panel === 'perfil' && (
              <form onSubmit={saveProfile} className="space-y-5">
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.85fr]">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5fbf7] text-[#006b5d]">
                        <span className="material-symbols-outlined">edit_square</span>
                      </span>
                      <div>
                        <h3 className="font-extrabold text-slate-900">Datos editables</h3>
                        <p className="text-sm text-slate-500">{loadingProfile ? 'Cargando tus datos...' : 'Mantén actualizada tu información de contacto.'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <input className={inputClass} value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} placeholder="Ej. 987654321" />
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
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf2ff] text-[#355382]">
                        <span className="material-symbols-outlined">verified_user</span>
                      </span>
                      <div>
                        <h3 className="font-extrabold text-slate-900">Resumen de cuenta</h3>
                        <p className="text-sm text-slate-500">{loadingProfile ? 'Sincronizando con Supabase.' : 'Datos de identificación del sistema.'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {detailRows.map(([icon, label, value]) => (
                        <DetailItem key={`${label}-${value}`} icon={icon} label={label} value={value} />
                      ))}
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">Los cambios se reflejan en tu sesión actual.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => openPanel('contrasena')} className={secondaryButton}>
                      Cambiar contraseña
                    </button>
                    <button type="submit" disabled={loading} className={primaryButton}>
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {panel === 'contrasena' && (
              <form onSubmit={savePassword} className="grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1fr]">
                <section className="rounded-xl border border-[#bcece4] bg-[#f4fffc] p-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#006b5d] shadow-sm">
                    <span className="material-symbols-outlined">lock_reset</span>
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold text-slate-900">Seguridad de la cuenta</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Usa una contraseña que no compartas en otros servicios. Al actualizarla, tus próximas sesiones usarán la nueva clave.
                  </p>
                  <div className="mt-5 rounded-lg bg-white/80 p-4 text-sm text-slate-600">
                    <p className="font-bold text-slate-800">Recomendación</p>
                    <p className="mt-1">Combina letras y números para que sea más fácil de recordar y más difícil de adivinar.</p>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="space-y-4">
                    <PasswordField
                      label="Contraseña actual"
                      value={passwordForm.contrasena_actual}
                      onChange={(event) => setPasswordForm({ ...passwordForm, contrasena_actual: event.target.value })}
                      inputClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15"
                      autoComplete="current-password"
                      required
                    />
                    <PasswordField
                      label="Nueva contraseña"
                      value={passwordForm.nueva_contrasena}
                      onChange={(event) => setPasswordForm({ ...passwordForm, nueva_contrasena: event.target.value })}
                      inputClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                    <PasswordStrength password={passwordForm.nueva_contrasena} />
                    <PasswordField
                      label="Confirmar nueva contraseña"
                      value={passwordForm.confirmar}
                      onChange={(event) => setPasswordForm({ ...passwordForm, confirmar: event.target.value })}
                      inputClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => openPanel('perfil')} className={secondaryButton}>
                      Volver al perfil
                    </button>
                    <button type="submit" disabled={loading} className={primaryButton}>
                      {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </div>
                </section>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  ) : null

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
          <p className="max-w-36 truncate text-sm font-extrabold text-[#101828]">{displayName}</p>
          <p className="text-xs text-[#52615f]">{roleLabel[user?.rol] || 'Portal clínico'}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#12b8a3] bg-white text-base font-extrabold text-[#006b5d] sm:h-12 sm:w-12">
          {getInitial(user, profile)}
        </span>
        <span className={`material-symbols-outlined hidden text-[#223330] transition sm:inline ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && (
        <div className="fixed right-3 top-20 z-50 w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#bdcbc7] bg-white shadow-2xl shadow-[#08284d]/12 sm:absolute sm:right-0 sm:top-14 sm:w-72">
          <div className="bg-[linear-gradient(135deg,#f8fbff_0%,#eef8f6_100%)] px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#12b8a3]/30 bg-white font-extrabold text-[#006b5d]">
                {getInitial(user, profile)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-[#101828]">{displayName}</p>
                <p className="truncate text-sm text-[#52615f]">{user?.email || profile?.email || roleLabel[user?.rol]}</p>
              </div>
            </div>
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

      {modal}
    </div>
  )
}
