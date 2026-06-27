import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import { useAuth } from '../../context/AuthContext'
import {
  cancelarCita, crearCita, getCitasPaciente, getDoctoresPorEspecialidad,
  getEspecialidades, getHistorial, getHorarios, getNotificacionesPaciente,
  enviarSoporte, marcarNotificacionEnviada, reprogramarCita, getSoporteTickets,
} from '../../services/api'
import PacienteInicio from './PacienteInicio'
import PacienteAgendar from './PacienteAgendar'
import PacienteCitas from './PacienteCitas'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function isManageable(cita) { return cita && !['cancelada', 'completada'].includes(cita.estado) }
function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return error?.message || fallback
}

export default function DashboardPaciente() {
  const { user } = useAuth()
  const [especialidades, setEspecialidades] = useState([])
  const [doctores, setDoctores] = useState([])
  const [horarios, setHorarios] = useState([])
  const [citas, setCitas] = useState([])
  const [historial, setHistorial] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [soporteTickets, setSoporteTickets] = useState([])
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

  const requestFocus = () => setFocusVersion(c => c + 1)
  const showSuccess = (message) => { setError(''); setSuccess(message); requestFocus(); window.setTimeout(() => setSuccess(''), 3200) }

  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => { contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 0)
  }, [focusVersion])

  useEffect(() => {
    if (!quickPanel) return
    window.setTimeout(() => { quickPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 0)
  }, [quickPanel])

  useEffect(() => {
    let mounted = true
    getEspecialidades()
      .then(res => { if (mounted) setEspecialidades(res.data || []) })
      .catch(e => { if (mounted) setError(getErrorMessage(e, 'No se pudieron cargar las especialidades.')) })
    if (user?.id) {
      Promise.all([
        getCitasPaciente(user.id),
        getHistorial(user.id),
        getNotificacionesPaciente(user.id),
        getSoporteTickets({ id_usuario: user.id }),
      ]).then(([citasRes, historialRes, notificacionesRes, soporteRes]) => {
          if (!mounted) return
          setCitas(citasRes.data || [])
          setHistorial(historialRes.data || [])
          setNotificaciones(notificacionesRes.data || [])
          setSoporteTickets(soporteRes.data || [])
        }).catch(e => { if (mounted) setError(getErrorMessage(e, 'No se pudieron cargar tus datos.')) })
    }
    return () => { mounted = false }
  }, [user?.id])

  const proximaCita = useMemo(() => {
    return [...citas].filter(c => isManageable(c) && new Date(c.fecha_hora) >= new Date())
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]
  }, [citas])

  const filteredCitas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return citas
    return citas.filter(c => [c.doctor, c.especialidad, c.estado, c.motivo, formatDate(c.fecha_hora)]
      .some(f => String(f || '').toLowerCase().includes(term)))
  }, [citas, searchTerm])

  const activeAppointments = citas.filter(c => isManageable(c)).length

  const handleSelectTab = (nextTab) => { setTab(nextTab); if (nextTab !== 'inicio') setQuickPanel(null); requestFocus() }
  const openInicioPanel = (panel) => { setTab('inicio'); setQuickPanel(panel); setError(''); requestFocus() }

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
  const refreshSoporte = async () => {
    if (!user?.id) return
    try {
      const res = await getSoporteTickets({ id_usuario: user.id })
      setSoporteTickets(res.data || [])
    } catch (e) { console.warn('refreshSoporte:', e.message) }
  }

  const handleNotificacion = async (notificacion) => {
    try {
      if (!notificacion.enviada) { await marcarNotificacionEnviada(notificacion.id_notif); await refreshNotificaciones() }
      handleSelectTab('citas')
    } catch (e) { setError(getErrorMessage(e, 'No se pudo actualizar la notificación.')) }
  }

  const handleEnviarSoporte = async (contexto, mensaje = supportMessage) => {
    const cita = proximaCita || citas.find(c => isManageable(c)) || citas[0]
    setSupportLoading(true)
    try {
      await enviarSoporte({ id_usuario: user.id, rol: 'paciente', contexto, mensaje, id_cita: cita?.id_cita })
      await refreshNotificaciones()
      await refreshSoporte()
      showSuccess('Solicitud registrada. Recepción podrá verla desde soporte.')
    } catch (e) { setError(getErrorMessage(e, 'No se pudo registrar la solicitud de soporte.')) }
    finally { setSupportLoading(false) }
  }

  const onEspecialidad = async (e) => {
    const id = e.target.value
    setError(''); setForm(f => ({ ...f, id_especialidad: id, id_doctor: '', id_horario: '' })); setHorarios([])
    if (!id) { setDoctores([]); return }
    setLoadingOptions(true)
    try { const res = await getDoctoresPorEspecialidad(id); setDoctores(res.data || []) }
    catch (e) { setDoctores([]); setError(getErrorMessage(e, 'No se pudieron cargar los doctores.')) }
    finally { setLoadingOptions(false) }
  }

  const onDoctor = async (e) => {
    const id = e.target.value
    setError(''); setForm(f => ({ ...f, id_doctor: id, id_horario: '' }))
    if (!id) { setHorarios([]); return }
    setLoadingHorarios(true)
    try { const res = await getHorarios(id); setHorarios(res.data || []) }
    catch (e) { setHorarios([]); setError(getErrorMessage(e, 'No se pudieron cargar los horarios.')) }
    finally { setLoadingHorarios(false) }
  }

  const selectedHorario = horarios.find(i => String(i.id_horario) === String(form.id_horario))

  const handleAgendar = async (e) => {
    e.preventDefault(); setError('')
    if (!selectedHorario || !user?.id) { setError('Selecciona un horario disponible.'); return }
    setLoading(true)
    try {
      await crearCita({
        id_doctor: Number(form.id_doctor), id_horario: Number(form.id_horario),
        fecha_hora: `${selectedHorario.fecha}T${selectedHorario.hora_inicio}`,
        motivo: form.motivo, tipo_atencion: 'web'
      }, user.id)
      setForm({ id_especialidad: '', id_doctor: '', id_horario: '', motivo: '' })
      setDoctores([]); setHorarios([])
      await refreshCitas(); handleSelectTab('citas')
      showSuccess('Cita registrada. Recepción la validará.')
    } catch (e) { setError(getErrorMessage(e, 'No se pudo registrar la cita.')) }
    finally { setLoading(false) }
  }

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return
    setError(''); setCancelingId(id)
    try { await cancelarCita(id); await refreshCitas(); showSuccess('Cita cancelada correctamente.') }
    catch (e) { setError(getErrorMessage(e, 'No se pudo cancelar la cita.')) }
    finally { setCancelingId(null) }
  }

  const abrirReprogramacion = async (cita) => {
    setError(''); handleSelectTab('citas'); setQuickPanel(null)
    setReprogramacion({ cita, id_horario: '', horarios: [], loading: true })
    try { const res = await getHorarios(cita.id_doctor); setReprogramacion({ cita, id_horario: '', horarios: res.data || [], loading: false }) }
    catch (e) { setReprogramacion(null); setError(getErrorMessage(e, 'No se pudieron cargar horarios.')) }
  }

  const guardarReprogramacion = async (e) => {
    e.preventDefault()
    const horario = reprogramacion?.horarios.find(i => String(i.id_horario) === String(reprogramacion.id_horario))
    if (!horario) { setError('Selecciona un nuevo horario.'); return }
    setError(''); setSavingReprogramacion(true)
    try {
      await reprogramarCita(reprogramacion.cita.id_cita, {
        id_horario: Number(reprogramacion.id_horario),
        fecha_hora: `${horario.fecha}T${horario.hora_inicio}`
      })
      setReprogramacion(null); await refreshCitas()
      showSuccess('Cita reprogramada correctamente.')
    } catch (e) { setError(getErrorMessage(e, 'No se pudo reprogramar la cita.')) }
    finally { setSavingReprogramacion(false) }
  }

  const quickActions = [
    { key: 'recetas',    icon: 'clinical_notes', label: 'Recetas médicas',  detail: `${historial.length} registros clínicos` },
    { key: 'resultados', icon: 'biotech',         label: 'Resultados',       detail: 'Revisa documentos clínicos' },
    { key: 'pagos',      icon: 'payments',        label: 'Pagos',            detail: `${activeAppointments} citas activas` },
    { key: 'soporte',    icon: 'support_agent',   label: 'Soporte',          detail: `${soporteTickets.length} solicitudes` },
  ]

  const notificationItems = notificaciones.length ? notificaciones.slice(0, 6).map(item => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje,
    time: formatDate(item.fecha_programada),
    actionLabel: item.enviada ? 'Ver citas' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    {
      title: activeAppointments ? `${activeAppointments} citas activas` : 'Sin citas activas',
      description: activeAppointments ? 'Puedes revisar, cancelar o reprogramar tus citas.' : 'Agenda una nueva cita.',
      time: 'Ahora',
      actionLabel: activeAppointments ? 'Ver mis citas' : 'Agendar cita',
      onClick: () => handleSelectTab(activeAppointments ? 'citas' : 'agendar')
    },
    ...(proximaCita ? [{
      title: 'Recordatorio de próxima cita',
      description: `Tu siguiente atención es con Dr. ${proximaCita.doctor} el ${formatDate(proximaCita.fecha_hora)}.`,
      time: '24 h antes', actionLabel: 'Ver detalle',
      onClick: () => openInicioPanel('notificaciones')
    }] : []),
  ]

  const helpItems = [
    { title: 'Soporte del paciente', description: 'Pide ayuda para horarios o reprogramaciones.', actionLabel: 'Solicitar apoyo', onClick: () => openInicioPanel('soporte') },
    { title: 'Nueva solicitud', description: 'Abre el formulario para elegir especialidad y horario.', actionLabel: 'Agendar cita', onClick: () => handleSelectTab('agendar') },
  ]
  const appItems = quickActions.map(action => ({ title: action.label, description: action.detail, actionLabel: 'Abrir', onClick: () => openInicioPanel(action.key) }))

  const sidebarItems = [
    { path: 'inicio',  icon: 'dashboard',       label: 'Panel' },
    { path: 'agendar', icon: 'event',            label: 'Citas' },
    { path: 'citas',   icon: 'clinical_notes',   label: 'Historial' },
  ]

  const sidebar = (
    <PortalSidebar active={tab} items={sidebarItems} onSelect={handleSelectTab}
      ctaLabel="Nueva cita" onCta={() => handleSelectTab('agendar')}
      onSupport={() => openInicioPanel('soporte')} ctaFirst />
  )

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
        {success && <div className="mb-5 rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-5 py-4 text-sm font-bold text-[#006b5d]">{success}</div>}
        {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-5 py-4 text-sm font-bold text-[#93000a]"><span className="material-symbols-outlined">error</span><span>{error}</span></div>}

        {tab === 'inicio' && (
          <PacienteInicio
            user={user} proximaCita={proximaCita} filteredCitas={filteredCitas}
            historial={historial} notificaciones={notificaciones}
            quickPanel={quickPanel} setQuickPanel={setQuickPanel}
            activeAppointments={activeAppointments} supportMessage={supportMessage}
            setSupportMessage={setSupportMessage} supportLoading={supportLoading}
            searchTerm={searchTerm} cancelingId={cancelingId}
            quickPanelRef={quickPanelRef} onAgendar={() => handleSelectTab('agendar')}
            onCancelar={handleCancelar} onReprogramar={abrirReprogramacion}
            onEnviarSoporte={handleEnviarSoporte} onSelectTab={handleSelectTab}
            quickActions={quickActions} soporteTickets={soporteTickets}
          />
        )}
        {tab === 'agendar' && (
          <PacienteAgendar
            form={form} setForm={setForm} especialidades={especialidades}
            doctores={doctores} horarios={horarios} loading={loading}
            loadingOptions={loadingOptions} loadingHorarios={loadingHorarios}
            error={error} onEspecialidad={onEspecialidad} onDoctor={onDoctor}
            onSubmit={handleAgendar}
          />
        )}
        {tab === 'citas' && (
          <PacienteCitas
            filteredCitas={filteredCitas} reprogramacion={reprogramacion}
            setReprogramacion={setReprogramacion} searchTerm={searchTerm}
            savingReprogramacion={savingReprogramacion} cancelingId={cancelingId}
            onCancelar={handleCancelar} onReprogramar={abrirReprogramacion}
            onGuardarReprogramacion={guardarReprogramacion}
            onAgendar={() => handleSelectTab('agendar')}
          />
        )}
      </div>
    </Layout>
  )
}