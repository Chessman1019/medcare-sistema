import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import PortalSidebar from '../components/PortalSidebar'
import { useAuth } from '../context/AuthContext'
import {
  cancelarCita,
  crearCita,
  getCitasPaciente,
  getDoctoresPorEspecialidad,
  getEspecialidades,
  getHistorial,
  getHorarios,
  getNotificacionesPaciente,
  enviarSoporte,
  marcarNotificacionEnviada,
  reprogramarCita,
} from '../services/api'

const statusClass = {
  pendiente: 'bg-[#f5f5f2] text-[#46514f]',
  confirmada: 'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  cancelada: 'bg-[#ffdad6] text-[#93000a]',
  completada: 'bg-[#d8e5e2] text-[#293533]',
  en_atencion: 'bg-[#dff8fb] text-[#006b5d]',
}

const quickCardClass = 'medcare-card-soft flex min-h-44 flex-col items-center justify-center gap-4 p-5 text-center text-lg font-extrabold text-[#101828] transition hover:-translate-y-1 hover:border-[#12b8a3] hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'
const iconButtonClass = 'rounded-xl p-2 text-[#006b5d] transition hover:-translate-y-0.5 hover:bg-[#e5fbf7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.95]'
const dangerButtonClass = 'rounded-xl border border-[#ffb4ab] bg-white px-4 py-3 font-extrabold text-[#93000a] transition hover:-translate-y-0.5 hover:bg-[#fff0ef] hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffb4ab]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatStatus(value) {
  return (value || 'pendiente').replaceAll('_', ' ')
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return error?.message || fallback
}

function isManageable(cita) {
  return cita && !['cancelada', 'completada'].includes(cita.estado)
}

function doctorFullName(doctor) {
  if (!doctor) return ''
  const name = `${doctor.usuario?.nombre || doctor.nombre || ''} ${doctor.usuario?.apellido || doctor.apellido || ''}`.trim()
  return name || 'Doctor disponible'
}

export default function DashboardPaciente() {
  const { user } = useAuth()
  const [especialidades, setEspecialidades] = useState([])
  const [doctores, setDoctores] = useState([])
  const [horarios, setHorarios] = useState([])
  const [citas, setCitas] = useState([])
  const [historial, setHistorial] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [form, setForm] = useState({ id_especialidad: '', id_doctor: '', id_horario: '', motivo: '' })
  const [tab, setTab] = useState('inicio')
  const [quickPanel, setQuickPanel] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [supportMessage, setSupportMessage] = useState('Necesito ayuda con mi cita.')
  const [loading, setLoading] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [cancelingId, setCancelingId] = useState(null)
  const [savingReprogramacion, setSavingReprogramacion] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [reprogramacion, setReprogramacion] = useState(null)
  const [focusVersion, setFocusVersion] = useState(0)
  const contentRef = useRef(null)
  const quickPanelRef = useRef(null)

  const requestFocus = () => setFocusVersion((current) => current + 1)

  const showSuccess = (message) => {
    setError('')
    setSuccess(message)
    requestFocus()
    window.setTimeout(() => setSuccess(''), 3200)
  }

  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      contentRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [focusVersion])

  useEffect(() => {
    if (!quickPanel) return
    window.setTimeout(() => {
      quickPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      quickPanelRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [quickPanel])

  useEffect(() => {
    let mounted = true

    getEspecialidades()
      .then((res) => {
        if (mounted) setEspecialidades(res.data || [])
      })
      .catch((requestError) => {
        if (mounted) setError(getErrorMessage(requestError, 'No se pudieron cargar las especialidades.'))
      })

    if (user?.id) {
      Promise.all([
        getCitasPaciente(user.id),
        getHistorial(user.id),
        getNotificacionesPaciente(user.id),
      ])
        .then(([citasRes, historialRes, notificacionesRes]) => {
          if (!mounted) return
          setCitas(citasRes.data || [])
          setHistorial(historialRes.data || [])
          setNotificaciones(notificacionesRes.data || [])
        })
        .catch((requestError) => {
          if (mounted) setError(getErrorMessage(requestError, 'No se pudieron cargar tus datos.'))
        })
    }

    return () => {
      mounted = false
    }
  }, [user?.id])

  const proximaCita = useMemo(() => {
    return [...citas]
      .filter((cita) => isManageable(cita) && new Date(cita.fecha_hora) >= new Date())
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]
  }, [citas])

  const filteredCitas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return citas

    return citas.filter((cita) => {
      const fields = [
        cita.doctor,
        cita.especialidad,
        cita.estado,
        cita.motivo,
        formatDate(cita.fecha_hora),
      ]
      return fields.some((field) => String(field || '').toLowerCase().includes(term))
    })
  }, [citas, searchTerm])

  const selectedEspecialidad = especialidades.find((item) => String(item.id_especialidad) === String(form.id_especialidad))
  const selectedDoctor = doctores.find((item) => String(item.id_usuario) === String(form.id_doctor))
  const selectedHorario = horarios.find((item) => String(item.id_horario) === String(form.id_horario))
  const activeAppointments = citas.filter((cita) => isManageable(cita)).length

  const handleSelectTab = (nextTab) => {
    setTab(nextTab)
    if (nextTab !== 'inicio') setQuickPanel(null)
    requestFocus()
  }

  const openInicioPanel = (panel) => {
    setTab('inicio')
    setQuickPanel(panel)
    setError('')
    requestFocus()
  }

  const sidebarItems = [
    { path: 'inicio', icon: 'dashboard', label: 'Panel' },
    { path: 'agendar', icon: 'event', label: 'Citas' },
    { path: 'citas', icon: 'clinical_notes', label: 'Historial' },
  ]

  const sidebar = (
    <PortalSidebar
      active={tab}
      items={sidebarItems}
      onSelect={handleSelectTab}
      ctaLabel="Nueva cita"
      onCta={() => handleSelectTab('agendar')}
      onSupport={() => openInicioPanel('soporte')}
      ctaFirst
    />
  )

  const refreshCitas = async () => {
    if (!user?.id) return
    const res = await getCitasPaciente(user.id)
    setCitas(res.data || [])
  }

  const refreshNotificaciones = async () => {
    if (!user?.id) return
    const res = await getNotificacionesPaciente(user.id)
    setNotificaciones(res.data || [])
  }

  const getCitaParaSoporte = () => proximaCita || citas.find((cita) => isManageable(cita)) || citas[0]

  const handleNotificacion = async (notificacion) => {
    try {
      if (!notificacion.enviada) {
        await marcarNotificacionEnviada(notificacion.id_notif)
        await refreshNotificaciones()
      }
      handleSelectTab('citas')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo actualizar la notificación.'))
    }
  }

  const handleEnviarSoporte = async (contexto, mensaje = supportMessage) => {
    const cita = getCitaParaSoporte()

    setSupportLoading(true)
    try {
      await enviarSoporte({
        id_usuario: user.id,
        rol: 'paciente',
        contexto,
        mensaje,
        id_cita: cita?.id_cita,
      })
      await refreshNotificaciones()
      showSuccess('Solicitud registrada en Supabase. Recepcion podra verla desde soporte.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo registrar la solicitud de soporte.'))
    } finally {
      setSupportLoading(false)
    }
  }

  const onEspecialidad = async (event) => {
    const id = event.target.value
    setError('')
    setForm((current) => ({ ...current, id_especialidad: id, id_doctor: '', id_horario: '' }))
    setHorarios([])

    if (!id) {
      setDoctores([])
      return
    }

    setLoadingOptions(true)
    try {
      const res = await getDoctoresPorEspecialidad(id)
      setDoctores(res.data || [])
    } catch (requestError) {
      setDoctores([])
      setError(getErrorMessage(requestError, 'No se pudieron cargar los doctores de esta especialidad.'))
    } finally {
      setLoadingOptions(false)
    }
  }

  const onDoctor = async (event) => {
    const id = event.target.value
    setError('')
    setForm((current) => ({ ...current, id_doctor: id, id_horario: '' }))

    if (!id) {
      setHorarios([])
      return
    }

    setLoadingHorarios(true)
    try {
      const res = await getHorarios(id)
      setHorarios(res.data || [])
    } catch (requestError) {
      setHorarios([])
      setError(getErrorMessage(requestError, 'No se pudieron cargar los horarios disponibles.'))
    } finally {
      setLoadingHorarios(false)
    }
  }

  const handleAgendar = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedHorario || !user?.id) {
      setError('Selecciona un horario disponible antes de confirmar la solicitud.')
      return
    }

    setLoading(true)
    try {
      await crearCita({
        id_doctor: Number(form.id_doctor),
        id_horario: Number(form.id_horario),
        fecha_hora: `${selectedHorario.fecha}T${selectedHorario.hora_inicio}`,
        motivo: form.motivo,
        tipo_atencion: 'web',
      }, user.id)

      setForm({ id_especialidad: '', id_doctor: '', id_horario: '', motivo: '' })
      setDoctores([])
      setHorarios([])
      await refreshCitas()
      handleSelectTab('citas')
      showSuccess('Cita registrada. Recepción la validará y confirmará.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo registrar la cita. Intenta con otro horario.'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta cita? El horario quedará liberado.')) return

    setError('')
    setCancelingId(id)
    try {
      await cancelarCita(id)
      await refreshCitas()
      showSuccess('Cita cancelada correctamente.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo cancelar la cita.'))
    } finally {
      setCancelingId(null)
    }
  }

  const abrirReprogramacion = async (cita) => {
    setError('')
    handleSelectTab('citas')
    setQuickPanel(null)
    setReprogramacion({ cita, id_horario: '', horarios: [], loading: true })

    try {
      const res = await getHorarios(cita.id_doctor)
      setReprogramacion({ cita, id_horario: '', horarios: res.data || [], loading: false })
    } catch (requestError) {
      setReprogramacion(null)
      setError(getErrorMessage(requestError, 'No se pudieron cargar horarios para reprogramar.'))
    }
  }

  const guardarReprogramacion = async (event) => {
    event.preventDefault()
    const horario = reprogramacion?.horarios.find((item) => String(item.id_horario) === String(reprogramacion.id_horario))

    if (!horario) {
      setError('Selecciona un nuevo horario para guardar la reprogramación.')
      return
    }

    setError('')
    setSavingReprogramacion(true)
    try {
      await reprogramarCita(reprogramacion.cita.id_cita, {
        id_horario: Number(reprogramacion.id_horario),
        fecha_hora: `${horario.fecha}T${horario.hora_inicio}`,
      })
      setReprogramacion(null)
      await refreshCitas()
      showSuccess('Cita reprogramada correctamente.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo reprogramar la cita.'))
    } finally {
      setSavingReprogramacion(false)
    }
  }

  const quickActions = [
    { key: 'recetas', icon: 'clinical_notes', label: 'Recetas médicas', detail: `${historial.length} registros clínicos` },
    { key: 'resultados', icon: 'biotech', label: 'Resultados', detail: 'Revisa documentos clínicos' },
    { key: 'pagos', icon: 'payments', label: 'Pagos', detail: `${activeAppointments} citas activas` },
    { key: 'soporte', icon: 'support_agent', label: 'Soporte', detail: 'Ayuda con coordinación' },
  ]

  const renderQuickPanel = () => {
    if (!quickPanel) return null

    const panelHeader = {
      recetas: ['clinical_notes', 'Recetas médicas', 'Indicaciones y documentos emitidos después de tus atenciones.'],
      resultados: ['biotech', 'Resultados de laboratorio', 'Consulta los resultados asociados a tus citas y exámenes.'],
      pagos: ['payments', 'Pagos y comprobantes', 'Resumen visual de importes pendientes y constancias.'],
      soporte: ['support_agent', 'Soporte del paciente', 'Solicita ayuda de coordinación sin salir del portal.'],
      notificaciones: ['notifications', 'Notificaciones', 'Recordatorios y avisos importantes de tus citas.'],
      apps: ['apps', 'Accesos rápidos', 'Atajos del portal para moverte sin perder contexto.'],
    }[quickPanel]

    if (!panelHeader) return null
    const [icon, title, description] = panelHeader

    return (
      <section ref={quickPanelRef} tabIndex={-1} className="medcare-card overflow-hidden focus:outline-none">
        <div className="flex flex-col gap-4 border-b border-[#bdcbc7] bg-white px-7 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
              <span className="material-symbols-outlined">{icon}</span>
            </span>
            <div>
              <h3 className="text-2xl font-extrabold text-[#101828]">{title}</h3>
              <p className="mt-1 text-sm text-[#52615f]">{description}</p>
            </div>
          </div>
          <button type="button" onClick={() => setQuickPanel(null)} className={iconButtonClass} aria-label="Cerrar panel">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-7">
          {quickPanel === 'recetas' && (
            <div className="space-y-4">
              {historial.length ? (
                historial.slice(0, 3).map((item) => (
                  <div key={item.id_historial} className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                    <p className="font-extrabold text-[#101828]">{item.tratamiento || 'Tratamiento registrado'}</p>
                    <p className="mt-1 text-sm text-[#52615f]">Atención del {item.fecha_atencion}</p>
                    <p className="mt-3 rounded-xl bg-[#edf2ff] px-4 py-3 text-sm text-[#46514f]">{item.observaciones || 'Sin observaciones adicionales.'}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-[#edf2ff] p-5 text-[#52615f]">Aún no tienes atenciones completadas con receta digital.</p>
              )}
            </div>
          )}

          {quickPanel === 'resultados' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="font-extrabold text-[#101828]">Resultados disponibles</p>
                <p className="mt-2 text-3xl font-extrabold text-[#006b5d]">{historial.length}</p>
                <p className="mt-2 text-sm text-[#52615f]">{historial[0]?.diagnostico || 'Cuando un doctor registre diagnóstico, aparecerá aquí.'}</p>
              </div>
              <button type="button" onClick={() => handleSelectTab('citas')} className="rounded-2xl border border-[#bdcbc7] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                <p className="font-extrabold text-[#101828]">Ver historial</p>
                <p className="mt-2 text-sm text-[#52615f]">Revisa tus citas y estados asociados.</p>
              </button>
            </div>
          )}

          {quickPanel === 'pagos' && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-[#006b5d]">Citas activas</p>
                <p className="mt-2 text-4xl font-extrabold text-[#101828]">{activeAppointments}</p>
              </div>
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-[#006b5d]">Pendiente</p>
                <p className="mt-2 text-4xl font-extrabold text-[#101828]">S/ 0.00</p>
              </div>
              <button type="button" onClick={() => handleEnviarSoporte('comprobante', 'Solicito apoyo con comprobante o estado de pago.')} disabled={supportLoading} className="medcare-primary-button rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 disabled:cursor-not-allowed disabled:opacity-60">
                Solicitar comprobante
              </button>
            </div>
          )}

          {quickPanel === 'soporte' && (
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="rounded-2xl bg-[#edf2ff] p-5 text-[#52615f]">
                Un coordinador puede ayudarte con horarios, cancelaciones o información de tu atención. Usa el botón para dejar una solicitud rápida.
                <textarea
                  className="medcare-input mt-4 min-h-24"
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  placeholder="Describe qué necesitas..."
                />
              </div>
              <button type="button" onClick={() => handleEnviarSoporte('soporte paciente')} disabled={supportLoading} className="medcare-primary-button px-6 py-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 disabled:cursor-not-allowed disabled:opacity-60">
                {supportLoading ? 'Enviando...' : 'Solicitar apoyo'}
              </button>
            </div>
          )}

          {quickPanel === 'notificaciones' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#bdcbc7] bg-white p-5">
                <p className="font-extrabold text-[#101828]">{notificaciones.filter((item) => !item.enviada).length} notificaciones pendientes</p>
                <p className="mt-1 text-sm text-[#52615f]">{notificaciones[0]?.mensaje || 'Recibirás avisos cuando recepción confirme o cambie una cita.'}</p>
              </div>
              {proximaCita && (
                <div className="rounded-2xl bg-[#e5fbf7] p-5 text-[#006b5d]">
                  Próximo recordatorio: {formatDate(proximaCita.fecha_hora)} con Dr. {proximaCita.doctor}.
                </div>
              )}
            </div>
          )}

          {quickPanel === 'apps' && (
            <div className="grid gap-3 md:grid-cols-3">
              {quickActions.map((action) => (
                <button key={action.key} type="button" onClick={() => setQuickPanel(action.key)} className="rounded-2xl border border-[#bdcbc7] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                  <span className="material-symbols-outlined text-[#006b5d]">{action.icon}</span>
                  <p className="mt-3 font-extrabold text-[#101828]">{action.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  const notificationItems = notificaciones.length ? notificaciones.slice(0, 6).map((item) => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje,
    time: formatDate(item.fecha_programada),
    actionLabel: item.enviada ? 'Ver citas' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    {
      title: activeAppointments ? `${activeAppointments} citas activas` : 'Sin citas activas',
      description: activeAppointments
        ? 'Puedes revisar, cancelar o reprogramar tus citas desde el historial.'
        : 'Agenda una nueva cita cuando necesites atención.',
      time: 'Ahora',
      actionLabel: activeAppointments ? 'Ver mis citas' : 'Agendar cita',
      onClick: () => handleSelectTab(activeAppointments ? 'citas' : 'agendar'),
    },
    ...(proximaCita ? [{
      title: 'Recordatorio de próxima cita',
      description: `Tu siguiente atención es con Dr. ${proximaCita.doctor} el ${formatDate(proximaCita.fecha_hora)}.`,
      time: '24 h antes',
      actionLabel: 'Ver detalle',
      onClick: () => openInicioPanel('notificaciones'),
    }] : []),
  ]

  const helpItems = [
    {
      title: 'Soporte del paciente',
      description: 'Pide ayuda para horarios, reprogramaciones o información de tu atención.',
      actionLabel: 'Solicitar apoyo',
      onClick: () => openInicioPanel('soporte'),
    },
    {
      title: 'Nueva solicitud',
      description: 'Abre el formulario para elegir especialidad, doctor y horario.',
      actionLabel: 'Agendar cita',
      onClick: () => handleSelectTab('agendar'),
    },
  ]

  const appItems = quickActions.map((action) => ({
    title: action.label,
    description: action.detail,
    actionLabel: 'Abrir',
    onClick: () => openInicioPanel(action.key),
  }))

  return (
    <Layout
      sidebar={sidebar}
      title={tab === 'agendar' ? 'Agendar cita' : 'Portal del paciente'}
      searchValue={searchTerm}
      searchPlaceholder="Buscar mis citas, doctores o estados..."
      onSearchChange={setSearchTerm}
      notificationItems={notificationItems}
      helpItems={helpItems}
      appItems={appItems}
    >
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] p-4 focus:outline-none sm:p-6 lg:p-8">
        {success && (
          <div className="mb-5 rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-5 py-4 text-sm font-bold text-[#006b5d]">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-5 py-4 text-sm font-bold text-[#93000a]">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {tab === 'inicio' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Hola, {user?.nombre?.split(' ')[0] || 'paciente'}</h2>
              <p className="mt-2 text-lg text-[#52615f]">Aquí tienes el resumen de tu atención médica.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:gap-7 xl:grid-cols-[1fr_380px]">
              <section className="medcare-card overflow-hidden">
                <div className="bg-gradient-to-br from-white via-white to-[#ecfffb] p-5 sm:p-8">
                  <p className="mb-6 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-[#006b5d]">
                    <span className="material-symbols-outlined">event_upcoming</span>
                    Próxima cita
                  </p>
                  {proximaCita ? (
                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-[#d8e5e2] text-5xl font-extrabold text-[#006b5d]">
                        {proximaCita.doctor?.charAt(0) || 'M'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-extrabold text-[#101828]">Dr. {proximaCita.doctor}</h3>
                        <p className="mt-2 text-xl font-bold text-[#006b5d]">{proximaCita.especialidad}</p>
                        <div className="mt-5 grid gap-3 text-base text-[#46514f] md:grid-cols-2">
                          <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[#12b8a3]">calendar_month</span>{formatDate(proximaCita.fecha_hora)}</span>
                          <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[#12b8a3]">verified</span>{formatStatus(proximaCita.estado)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => abrirReprogramacion(proximaCita)} className="medcare-secondary-button px-6 py-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                          Reprogramar
                        </button>
                        <button type="button" onClick={() => handleCancelar(proximaCita.id_cita)} disabled={cancelingId === proximaCita.id_cita} className={dangerButtonClass}>
                          {cancelingId === proximaCita.id_cita ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#edf2ff] p-5 text-[#52615f] sm:p-8">
                      <p>No tienes citas próximas. Puedes solicitar una nueva cita cuando lo necesites.</p>
                      <button type="button" onClick={() => handleSelectTab('agendar')} className="medcare-primary-button mt-5 px-6 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                        Agendar cita
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => setQuickPanel((current) => (current === action.key ? null : action.key))}
                    aria-pressed={quickPanel === action.key}
                    className={`${quickCardClass} ${quickPanel === action.key ? 'border-[#12b8a3] bg-white shadow-lg' : ''}`}
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#006b5d] shadow-sm">
                      <span className="material-symbols-outlined text-3xl">{action.icon}</span>
                    </span>
                    <span>{action.label}</span>
                    <span className="text-sm font-semibold text-[#52615f]">{action.detail}</span>
                  </button>
                ))}
              </section>
            </div>

            {renderQuickPanel()}

            <section className="medcare-card overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[#bdcbc7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#101828]">Actividad reciente</h3>
                  {searchTerm && <p className="mt-1 text-sm text-[#52615f]">Filtrado por: “{searchTerm}”</p>}
                </div>
                <button type="button" onClick={() => handleSelectTab('citas')} className="rounded-xl px-4 py-2 font-extrabold text-[#006b5d] transition hover:bg-[#e5fbf7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                  Ver historial
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-white text-sm uppercase text-[#223330]">
                    <tr>
                      <th className="px-8 py-5">Especialista</th>
                      <th className="px-8 py-5">Servicio</th>
                      <th className="px-8 py-5">Fecha y hora</th>
                      <th className="px-8 py-5">Estado</th>
                      <th className="px-8 py-5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bdcbc7]">
                    {filteredCitas.slice(0, 5).map((cita) => (
                      <tr key={cita.id_cita} className="bg-white transition hover:bg-[#f8fbff]">
                        <td className="px-8 py-5">
                          <p className="font-extrabold text-[#101828]">Dr. {cita.doctor}</p>
                          <p className="text-sm text-[#52615f]">{cita.especialidad}</p>
                        </td>
                        <td className="px-8 py-5 text-[#101828]">{cita.motivo || 'Consulta'}</td>
                        <td className="px-8 py-5 text-[#101828]">{formatDate(cita.fecha_hora)}</td>
                        <td className="px-8 py-5">
                          <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass[cita.estado] || statusClass.pendiente}`}>
                            {formatStatus(cita.estado)}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {isManageable(cita) ? (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => abrirReprogramacion(cita)} className={iconButtonClass} aria-label="Reprogramar cita">
                                <span className="material-symbols-outlined">edit_calendar</span>
                              </button>
                              <button type="button" onClick={() => handleCancelar(cita.id_cita)} disabled={cancelingId === cita.id_cita} className="rounded-xl p-2 text-[#93000a] transition hover:-translate-y-0.5 hover:bg-[#fff0ef] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffb4ab]/30 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60" aria-label="Cancelar cita">
                                <span className="material-symbols-outlined">event_busy</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-[#52615f]">Sin acciones</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredCitas.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-8 py-10 text-center text-[#52615f]">
                          {searchTerm ? 'No encontramos citas con esa búsqueda.' : 'Aún no tienes citas registradas.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === 'agendar' && (
          <div className="grid grid-cols-1 gap-5 lg:gap-7 xl:grid-cols-[1fr_420px]">
            <div className="space-y-7">
              <div className="medcare-card-soft grid gap-4 p-5 sm:p-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                {[
                  ['1', 'Especialidad', selectedEspecialidad?.nombre || 'Seleccionar'],
                  ['2', 'Doctor', selectedDoctor ? `Dr. ${doctorFullName(selectedDoctor)}` : 'Seleccionar'],
                  ['3', 'Fecha y hora', selectedHorario ? `${selectedHorario.fecha} ${selectedHorario.hora_inicio}` : 'Elegir horario'],
                ].map(([step, title, detail], index) => {
                  const isComplete = index === 0 ? Boolean(selectedEspecialidad) : index === 1 ? Boolean(selectedDoctor) : Boolean(selectedHorario)
                  return (
                    <div key={step} className="contents">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold transition ${isComplete ? 'bg-[#007a68] text-white shadow-sm' : 'bg-[#dbe6fb] text-[#223330]'}`}>
                          {step}
                        </div>
                        <div>
                          <p className="font-extrabold text-[#101828]">{title}</p>
                          <p className="text-sm text-[#52615f]">{detail}</p>
                        </div>
                      </div>
                      {index < 2 && <div className="hidden h-px w-16 bg-[#bdcbc7] md:block" />}
                    </div>
                  )
                })}
              </div>

              <form onSubmit={handleAgendar} className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                <section className="medcare-card p-5 sm:p-7">
                  <h3 className="text-2xl font-extrabold text-[#101828]">Selecciona especialista</h3>
                  <div className="mt-6 space-y-5">
                    <label className="block text-sm font-bold text-[#223330]">
                      Especialidad
                      <select className="medcare-input mt-2" onChange={onEspecialidad} value={form.id_especialidad} required>
                        <option value="">Selecciona una especialidad</option>
                        {especialidades.map((item) => <option key={item.id_especialidad} value={item.id_especialidad}>{item.nombre}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-bold text-[#223330]">
                      Doctor
                      <select className="medcare-input mt-2 disabled:cursor-not-allowed disabled:bg-[#f5f7ff] disabled:text-[#798684]" onChange={onDoctor} value={form.id_doctor} required disabled={!doctores.length || loadingOptions}>
                        <option value="">{loadingOptions ? 'Cargando doctores...' : 'Selecciona un doctor'}</option>
                        {doctores.map((doctor) => (
                          <option key={doctor.id_usuario} value={doctor.id_usuario}>Dr. {doctorFullName(doctor)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-bold text-[#223330]">
                      Motivo de consulta
                      <textarea className="medcare-input mt-2 min-h-28" placeholder="Describe brevemente el motivo..." value={form.motivo} onChange={(event) => setForm((current) => ({ ...current, motivo: event.target.value }))} />
                    </label>
                  </div>
                </section>

                <section className="medcare-card p-5 sm:p-7">
                  <h3 className="text-2xl font-extrabold text-[#101828]">Fecha y hora</h3>
                  <p className="mt-2 text-sm text-[#52615f]">Horarios disponibles para el doctor seleccionado.</p>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {loadingHorarios ? (
                      <p className="col-span-2 rounded-xl bg-[#edf2ff] p-5 text-sm text-[#52615f]">Cargando horarios disponibles...</p>
                    ) : horarios.length === 0 ? (
                      <p className="col-span-2 rounded-xl bg-[#edf2ff] p-5 text-sm text-[#52615f]">
                        {form.id_doctor ? 'No hay horarios libres para este doctor.' : 'Selecciona un doctor para ver disponibilidad.'}
                      </p>
                    ) : horarios.map((horario) => {
                      const selected = String(form.id_horario) === String(horario.id_horario)
                      return (
                        <button
                          key={horario.id_horario}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, id_horario: horario.id_horario }))}
                          aria-pressed={selected}
                          className={`rounded-xl border px-3 py-4 text-sm font-extrabold transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] ${selected ? 'border-[#006b5d] bg-[#e5fbf7] text-[#006b5d]' : 'border-[#bdcbc7] bg-white text-[#101828] hover:border-[#006b5d]'}`}
                        >
                          {horario.fecha}<br />{horario.hora_inicio} a {horario.hora_fin}
                        </button>
                      )
                    })}
                  </div>
                  <button type="submit" disabled={loading || !form.id_horario} className="medcare-primary-button mt-7 flex w-full items-center justify-center gap-2 py-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? 'Registrando...' : 'Confirmar solicitud'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </section>
              </form>
            </div>

            <aside className="medcare-card h-fit overflow-hidden xl:sticky xl:top-28">
              <div className="bg-[#007a68] p-7 text-white">
                <h3 className="text-2xl font-extrabold">Resumen de cita</h3>
              </div>
              <div className="space-y-6 p-7">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Especialidad</p>
                  <p className="mt-1 text-lg font-extrabold">{selectedEspecialidad?.nombre || 'Pendiente'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Doctor</p>
                  <p className="mt-1 text-lg font-extrabold">{selectedDoctor ? `Dr. ${doctorFullName(selectedDoctor)}` : 'Pendiente'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Fecha y hora</p>
                  <p className="mt-1 text-lg font-extrabold">{selectedHorario ? `${selectedHorario.fecha} - ${selectedHorario.hora_inicio}` : 'Pendiente'}</p>
                </div>
                <div className="border-t border-dashed border-[#bdcbc7] pt-6 text-sm text-[#52615f]">
                  Recibirás la confirmación cuando recepción valide la disponibilidad.
                </div>
              </div>
            </aside>
          </div>
        )}

        {tab === 'citas' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Mis citas</h2>
              <p className="mt-2 text-lg text-[#52615f]">Historial, estados y gestión de tus atenciones.</p>
              {searchTerm && <p className="mt-1 text-sm text-[#52615f]">Mostrando resultados para: “{searchTerm}”</p>}
            </div>

            {reprogramacion && (
              <form onSubmit={guardarReprogramacion} className="medcare-card-soft p-6">
                <h3 className="text-xl font-extrabold text-[#101828]">Reprogramar cita con Dr. {reprogramacion.cita.doctor}</h3>
                <p className="mt-1 text-sm text-[#52615f]">Elige un nuevo horario libre. La cita quedará marcada como reprogramada.</p>
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <select
                    className="medcare-input"
                    required
                    value={reprogramacion.id_horario}
                    onChange={(event) => setReprogramacion((current) => ({ ...current, id_horario: event.target.value }))}
                    disabled={reprogramacion.loading}
                  >
                    <option value="">{reprogramacion.loading ? 'Cargando horarios...' : 'Nuevo horario'}</option>
                    {reprogramacion.horarios.map((horario) => <option key={horario.id_horario} value={horario.id_horario}>{horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}</option>)}
                  </select>
                  <button type="submit" disabled={savingReprogramacion || reprogramacion.loading || !reprogramacion.id_horario} className="medcare-primary-button px-6 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 disabled:cursor-not-allowed disabled:opacity-60">
                    {savingReprogramacion ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setReprogramacion(null)} className="medcare-secondary-button px-6 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">Cancelar</button>
                </div>
                {!reprogramacion.loading && reprogramacion.horarios.length === 0 && (
                  <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-[#52615f]">No hay horarios libres para reprogramar esta cita.</p>
                )}
              </form>
            )}

            <div className="space-y-4">
              {filteredCitas.length === 0 ? (
                <div className="medcare-card p-10 text-center text-[#52615f]">
                  <p>{searchTerm ? 'No encontramos citas con esa búsqueda.' : 'No tienes citas registradas.'}</p>
                  <button type="button" onClick={() => handleSelectTab('agendar')} className="medcare-primary-button mt-5 px-6 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">
                    Nueva cita
                  </button>
                </div>
              ) : filteredCitas.map((cita) => (
                <article key={cita.id_cita} className="medcare-card flex flex-col gap-5 p-6 transition hover:-translate-y-0.5 hover:shadow-lg md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-extrabold text-[#101828]">Dr. {cita.doctor}</h3>
                      <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass[cita.estado] || statusClass.pendiente}`}>{formatStatus(cita.estado)}</span>
                    </div>
                    <p className="mt-2 text-[#52615f]">{cita.especialidad} · {formatDate(cita.fecha_hora)}</p>
                    {cita.motivo && <p className="mt-1 text-sm text-[#52615f]">{cita.motivo}</p>}
                  </div>
                  {isManageable(cita) ? (
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => abrirReprogramacion(cita)} className="medcare-secondary-button px-4 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20">Reprogramar</button>
                      <button type="button" onClick={() => handleCancelar(cita.id_cita)} disabled={cancelingId === cita.id_cita} className={dangerButtonClass}>
                        {cancelingId === cita.id_cita ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full bg-[#f5f5f2] px-4 py-2 text-sm font-bold text-[#52615f]">Cita cerrada</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
