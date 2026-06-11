import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import { useAuth } from '../../context/AuthContext'
import {
  actualizarSoporteTicket, cancelarCita, confirmarCita, crearUsuario, enviarSoporte,
  getCitasHoy, getDoctores, getEspecialidades, getHorarios, getNotificacionesAdmin,
  getPacientes, getSoporteTickets, getStatsCitas, getTodasCitas, getUsuarios,
  marcarNotificacionEnviada, registrarAsistencia, registrarPaciente, registrarSalida, reprogramarCita,
} from '../../services/api'
import RecepDashboard from './RecepDashboard'
import RecepAgenda from './RecepAgenda'
import RecepGestion from './RecepGestion'
import RecepRegistro from './RecepRegistro'
import RecepUsuarios from './RecepUsuarios'
import RecepSoporte from './RecepSoporte'

const emptyRegistro = { nombre: '', apellido: '', email: '', password: '', telefono: '', dni: '', fecha_nacimiento: '', genero: 'M', seguro_medico: '', direccion: '' }
const emptyUsuarioAdmin = { tipo_usuario: 'doctor', nombre: '', apellido: '', email: '', password: '', telefono: '', dni: '', fecha_nacimiento: '', genero: 'M', seguro_medico: '', direccion: '', cmp: '', id_especialidad: '', codigo_empleado: '', turno: 'mañana' }

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function todayInputValue() { return new Date().toISOString().slice(0, 10) }

export default function DashboardRecepcionista() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'administrador'
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [citas, setCitas] = useState([])
  const [citasHoy, setCitasHoy] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [soporteTickets, setSoporteTickets] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [doctores, setDoctores] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [filtros, setFiltros] = useState({ estado: '', doctor: '', fecha: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [agendaDoctor, setAgendaDoctor] = useState('')
  const [horariosAgenda, setHorariosAgenda] = useState([])
  const [reprogramacion, setReprogramacion] = useState(null)
  const [registro, setRegistro] = useState(emptyRegistro)
  const [usuarioAdmin, setUsuarioAdmin] = useState(emptyUsuarioAdmin)
  const [message, setMessage] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [focusVersion, setFocusVersion] = useState(0)
  const contentRef = useRef(null)

  const requestFocus = () => setFocusVersion(c => c + 1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsR, todasR, hoyR, doctoresR, pacientesR, especialidadesR, notificacionesR, soporteR] = await Promise.all([
        getStatsCitas(), getTodasCitas(), getCitasHoy(), getDoctores(), getPacientes(),
        getEspecialidades(), getNotificacionesAdmin(), getSoporteTickets(),
      ])
      setStats(statsR.data); setCitas(todasR.data); setCitasHoy(hoyR.data)
      setDoctores(doctoresR.data); setPacientes(pacientesR.data); setEspecialidades(especialidadesR.data)
      setNotificaciones(notificacionesR.data || []); setSoporteTickets(soporteR.data || [])
      if (isAdmin) { const usuariosR = await getUsuarios(); setUsuarios(usuariosR.data || []) }
      else setUsuarios([])
    } catch (error) { setMessage(error.response?.data?.detail || 'No se pudieron cargar los datos.') }
    finally { setLoading(false) }
  }, [isAdmin])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (isAdmin && tab === 'registro') setTab('usuarios') }, [isAdmin, tab])
  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => { contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 0)
  }, [focusVersion])

  const citasFiltradas = useMemo(() => {
    return citas.filter(cita => {
      const coincideEstado = !filtros.estado || cita.estado === filtros.estado
      const coincideDoctor = !filtros.doctor || cita.doctor?.toLowerCase().includes(filtros.doctor.toLowerCase())
      const coincideFecha = !filtros.fecha || cita.fecha_hora?.startsWith(filtros.fecha)
      const term = searchTerm.trim().toLowerCase()
      const coincideBusqueda = !term || [cita.paciente, cita.doctor, cita.especialidad, cita.estado, cita.dni, cita.motivo].some(f => String(f || '').toLowerCase().includes(term))
      return coincideEstado && coincideDoctor && coincideFecha && coincideBusqueda
    })
  }, [citas, filtros, searchTerm])

  const goToTab = (nextTab, nextFilters = {}) => {
    setTab(nextTab); setFiltros(actual => ({ ...actual, ...nextFilters })); requestFocus()
  }
  const showMessage = (text) => { setMessage(text); requestFocus(); window.setTimeout(() => setMessage(''), 3500) }
  const refreshNotificaciones = async () => { const res = await getNotificacionesAdmin(); setNotificaciones(res.data || []) }
  const refreshSoporte = async () => { const res = await getSoporteTickets(); setSoporteTickets(res.data || []) }

  const handleNotificacion = async (notificacion) => {
    try {
      if (!notificacion.enviada) { await marcarNotificacionEnviada(notificacion.id_notif); await refreshNotificaciones() }
      goToTab('gestion', { doctor: notificacion.doctor || '', fecha: notificacion.fecha_hora?.slice(0, 10) || '' })
    } catch (error) { showMessage(error.response?.data?.detail || 'No se pudo actualizar.') }
  }

  const registrarSoporteInterno = async () => {
    setActionLoading('soporte')
    try {
      await enviarSoporte({ id_usuario: user?.id, rol: user?.rol || 'recepcionista', contexto: 'soporte recepción', mensaje: 'Recepción solicita apoyo operativo desde el portal.' })
      await refreshSoporte(); goToTab('soporte'); showMessage('Ticket de soporte registrado.')
    } catch (error) { showMessage(error.response?.data?.detail || 'No se pudo registrar soporte.') }
    finally { setActionLoading('') }
  }

  const actualizarTicket = async (ticket, estado) => {
    setActionLoading(`ticket-${ticket.id_ticket}`)
    try {
      await actualizarSoporteTicket(ticket.id_ticket, { estado, asignado_a: user?.id, respuesta: estado === 'resuelto' ? 'Ticket atendido por recepción.' : 'Ticket en revisión.' })
      await refreshSoporte(); showMessage('Ticket actualizado.')
    } catch (error) { showMessage(error.response?.data?.detail || 'No se pudo actualizar el ticket.') }
    finally { setActionLoading('') }
  }

  const cambiarEstado = async (id, accion) => {
    const acciones = { confirmar: confirmarCita, asistencia: registrarAsistencia, salida: registrarSalida, cancelar: cancelarCita }
    setActionLoading(`${accion}-${id}`)
    try { await acciones[accion](id); showMessage('Cita actualizada correctamente.'); await fetchData() }
    catch (error) { showMessage(error.response?.data?.detail || 'No se pudo actualizar la cita.') }
    finally { setActionLoading('') }
  }

  const abrirReprogramacion = async (cita) => {
    goToTab('gestion')
    setReprogramacion({ cita, id_doctor: cita.id_doctor, id_horario: '', horarios: [], loading: true })
    try { const res = await getHorarios(cita.id_doctor); setReprogramacion({ cita, id_doctor: cita.id_doctor, id_horario: '', horarios: res.data || [], loading: false }) }
    catch (error) { setReprogramacion(null); showMessage(error.response?.data?.detail || 'No se pudieron cargar horarios.') }
  }

  const cambiarDoctorReprogramacion = async (idDoctor) => {
    setReprogramacion(actual => ({ ...actual, id_doctor: idDoctor, id_horario: '', horarios: [], loading: true }))
    try { const res = await getHorarios(idDoctor); setReprogramacion(actual => ({ ...actual, id_doctor: idDoctor, id_horario: '', horarios: res.data || [], loading: false })) }
    catch { setReprogramacion(actual => ({ ...actual, loading: false })) }
  }

  const guardarReprogramacion = async (event) => {
    event.preventDefault()
    const horario = reprogramacion.horarios.find(h => String(h.id_horario) === String(reprogramacion.id_horario))
    if (!horario) return
    setActionLoading('reprogramar')
    try {
      await reprogramarCita(reprogramacion.cita.id_cita, { id_horario: Number(reprogramacion.id_horario), fecha_hora: `${horario.fecha}T${horario.hora_inicio}` })
      setReprogramacion(null); showMessage('Cita reprogramada correctamente.'); await fetchData()
    } catch (error) { showMessage(error.response?.data?.detail || 'No se pudo reprogramar.') }
    finally { setActionLoading('') }
  }

  const cargarDisponibilidad = async (idDoctor) => {
    setAgendaDoctor(idDoctor)
    if (!idDoctor) { setHorariosAgenda([]); return }
    try { const res = await getHorarios(idDoctor); setHorariosAgenda(res.data || []) }
    catch { setHorariosAgenda([]) }
  }

  const registrarNuevoPaciente = async (event) => {
    event.preventDefault()
    setActionLoading('registro')
    try { await registrarPaciente(registro); setRegistro(emptyRegistro); showMessage('Paciente registrado correctamente.'); await fetchData() }
    catch (error) { showMessage(error.response?.data?.detail || 'No se pudo registrar el paciente.') }
    finally { setActionLoading('') }
  }

  const registrarUsuarioAdmin = async (event) => {
    event.preventDefault()
    const payload = { ...usuarioAdmin, id_especialidad: usuarioAdmin.id_especialidad ? Number(usuarioAdmin.id_especialidad) : undefined, fecha_nacimiento: usuarioAdmin.fecha_nacimiento || undefined }
    setActionLoading('usuario-admin')
    try { await crearUsuario(payload); setUsuarioAdmin(emptyUsuarioAdmin); showMessage('Cuenta creada correctamente.'); await fetchData() }
    catch (error) { showMessage(error.response?.data?.detail || 'No se pudo crear la cuenta.') }
    finally { setActionLoading('') }
  }

  const ticketsActivos = soporteTickets.filter(t => ['abierto', 'en_revision'].includes(t.estado))

  const notificationItems = notificaciones.length ? notificaciones.slice(0, 8).map(item => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje, time: formatDateTime(item.fecha_programada),
    actionLabel: item.enviada ? 'Abrir gestión' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    { title: `${stats.pendientes ?? 0} citas pendientes`, description: 'Valida solicitudes nuevas.', time: 'Ahora', actionLabel: 'Ir a gestión', onClick: () => goToTab('gestion', { estado: 'pendiente' }) },
    { title: `${stats.citas_hoy ?? 0} citas hoy`, description: 'Revisa la agenda del día.', time: 'Hoy', actionLabel: 'Ver agenda', onClick: () => goToTab('agenda', { fecha: todayInputValue() }) },
  ]

  const helpItems = [
    ...(isAdmin ? [{ title: 'Gestionar usuarios', description: 'Crea cuentas desde un solo lugar.', actionLabel: 'Abrir usuarios', onClick: () => goToTab('usuarios') }] : [{ title: 'Registrar paciente', description: 'Crea una ficha de paciente.', actionLabel: 'Abrir registro', onClick: () => goToTab('registro') }]),
    { title: 'Gestionar asistencia', description: 'Confirma, cancela o reprograma citas.', actionLabel: 'Abrir gestión', onClick: () => goToTab('gestion') },
  ]

  const appItems = [
    { title: 'Panel', description: 'Métricas rápidas.', actionLabel: 'Abrir', onClick: () => goToTab('dashboard') },
    { title: 'Agenda global', description: 'Calendario y disponibilidad.', actionLabel: 'Abrir', onClick: () => goToTab('agenda') },
    ...(!isAdmin ? [{ title: 'Registro paciente', description: 'Alta de nuevos pacientes.', actionLabel: 'Abrir', onClick: () => goToTab('registro') }] : []),
    ...(isAdmin ? [{ title: 'Usuarios', description: `${usuarios.length} cuentas.`, actionLabel: 'Abrir', onClick: () => goToTab('usuarios') }] : []),
    { title: 'Soporte', description: `${ticketsActivos.length} tickets activos.`, actionLabel: 'Abrir', onClick: () => goToTab('soporte') },
  ]

  const sidebarItems = [
    { path: 'dashboard', icon: 'dashboard',             label: 'Panel' },
    { path: 'agenda',    icon: 'calendar_month',         label: 'Agenda global' },
    { path: 'gestion',   icon: 'event_note',             label: 'Gestión de citas' },
    ...(!isAdmin ? [{ path: 'registro', icon: 'person_add', label: 'Registro paciente' }] : []),
    ...(isAdmin  ? [{ path: 'usuarios', icon: 'admin_panel_settings', label: 'Usuarios' }] : []),
    { path: 'soporte',   icon: 'support_agent',          label: 'Soporte' },
  ]

  const sidebar = (
    <PortalSidebar active={tab} items={sidebarItems} onSelect={nextTab => goToTab(nextTab)}
      ctaLabel="Nueva cita" onCta={() => goToTab('gestion')} onSupport={() => goToTab('soporte')} />
  )

  if (loading) return (
    <Layout sidebar={sidebar} title={isAdmin ? 'Administración' : 'Recepción'} notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando datos...</div>
    </Layout>
  )

  return (
    <Layout sidebar={sidebar} title={isAdmin ? 'Administración' : 'Recepción'}
      searchValue={searchTerm} searchPlaceholder="Buscar pacientes, doctores o citas..."
      onSearchChange={setSearchTerm} notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] space-y-6 p-4 focus:outline-none sm:p-6 lg:p-8">
        {message && <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{message}</div>}

        {tab === 'dashboard' && <RecepDashboard stats={stats} citas={citas} citasHoy={citasHoy} doctores={doctores} pacientes={pacientes} usuarios={usuarios} especialidades={especialidades} isAdmin={isAdmin} onGoToTab={goToTab} />}
        {tab === 'agenda' && <RecepAgenda citasFiltradas={citasFiltradas} filtros={filtros} setFiltros={setFiltros} doctores={doctores} horariosAgenda={horariosAgenda} agendaDoctor={agendaDoctor} onCargarDisponibilidad={cargarDisponibilidad} onGoToTab={goToTab} onShowMessage={showMessage} />}
        {tab === 'gestion' && <RecepGestion citasFiltradas={citasFiltradas} doctores={doctores} reprogramacion={reprogramacion} setReprogramacion={setReprogramacion} actionLoading={actionLoading} onCambiarEstado={cambiarEstado} onAbrirReprogramacion={abrirReprogramacion} onGuardarReprogramacion={guardarReprogramacion} onCambiarDoctorReprogramacion={cambiarDoctorReprogramacion} />}
        {tab === 'registro' && !isAdmin && <RecepRegistro registro={registro} setRegistro={setRegistro} pacientes={pacientes} especialidades={especialidades} actionLoading={actionLoading} onRegistrar={registrarNuevoPaciente} onShowMessage={showMessage} />}
        {tab === 'usuarios' && isAdmin && <RecepUsuarios usuarios={usuarios} usuarioAdmin={usuarioAdmin} setUsuarioAdmin={setUsuarioAdmin} especialidades={especialidades} actionLoading={actionLoading} onCrearUsuario={registrarUsuarioAdmin} onShowMessage={showMessage} />}
        {tab === 'soporte' && <RecepSoporte soporteTickets={soporteTickets} actionLoading={actionLoading} onActualizarTicket={actualizarTicket} onCrearTicketInterno={registrarSoporteInterno} />}
      </div>
    </Layout>
  )
}