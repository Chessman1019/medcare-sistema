/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import PortalSidebar from '../components/PortalSidebar'
import { useAuth } from '../context/AuthContext'
import {
  actualizarSoporteTicket,
  cancelarCita,
  confirmarCita,
  crearUsuario,
  enviarSoporte,
  getCitasHoy,
  getDoctores,
  getEspecialidades,
  getHorarios,
  getNotificacionesAdmin,
  getPacientes,
  getSoporteTickets,
  getStatsCitas,
  getTodasCitas,
  getUsuarios,
  marcarNotificacionEnviada,
  registrarAsistencia,
  registrarPaciente,
  registrarSalida,
  reprogramarCita,
} from '../services/api'

const estadoClass = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
}

const ticketEstadoClass = {
  abierto: 'bg-amber-50 text-amber-700 border-amber-200',
  en_revision: 'bg-sky-50 text-sky-700 border-sky-200',
  resuelto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cerrado: 'bg-slate-100 text-slate-700 border-slate-200',
}

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const dangerButton = 'rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

const emptyRegistro = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
  dni: '',
  fecha_nacimiento: '',
  genero: 'M',
  seguro_medico: '',
  direccion: '',
}

const emptyUsuarioAdmin = {
  tipo_usuario: 'doctor',
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
  dni: '',
  fecha_nacimiento: '',
  genero: 'M',
  seguro_medico: '',
  direccion: '',
  cmp: '',
  id_especialidad: '',
  codigo_empleado: '',
  turno: 'mañana',
}

const roleLabels = {
  paciente: 'Paciente',
  doctor: 'Médico',
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
}

const estadoMetricColors = {
  pendiente: '#f59e0b',
  confirmada: '#10b981',
  reprogramada: '#7c3aed',
  en_atencion: '#0284c7',
  completada: '#64748b',
  cancelada: '#e11d48',
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function doctorLabel(doctor) {
  if (!doctor) return 'Doctor no asignado'
  const source = doctor.usuario || doctor
  return [source.nombre, source.apellido].filter(Boolean).join(' ') || doctor.doctor || 'Doctor'
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatEstado(value) {
  const labels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    reprogramada: 'Reprogramada',
    en_atencion: 'En atención',
    cancelada: 'Cancelada',
    completada: 'Completada',
  }
  return labels[value] || (value || 'Pendiente').replaceAll('_', ' ')
}

function formatTicketEstado(value) {
  const labels = {
    abierto: 'Abierto',
    en_revision: 'En revisión',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
  }
  return labels[value] || (value || 'Abierto').replaceAll('_', ' ')
}

function buildDonutGradient(items, total) {
  if (!total) return '#edf2ff'

  let cursor = 0
  const segments = items
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = cursor
      const end = cursor + (item.value / total) * 100
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })

  return `conic-gradient(${segments.join(', ')})`
}

function percentage(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default function DashboardRecepcionista() {
  const { user } = useAuth()
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
  const isAdmin = user?.rol === 'administrador'

  const requestFocus = () => setFocusVersion((current) => current + 1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsR, todasR, hoyR, doctoresR, pacientesR, especialidadesR, notificacionesR, soporteR] = await Promise.all([
        getStatsCitas(),
        getTodasCitas(),
        getCitasHoy(),
        getDoctores(),
        getPacientes(),
        getEspecialidades(),
        getNotificacionesAdmin(),
        getSoporteTickets(),
      ])
      setStats(statsR.data)
      setCitas(todasR.data)
      setCitasHoy(hoyR.data)
      setDoctores(doctoresR.data)
      setPacientes(pacientesR.data)
      setEspecialidades(especialidadesR.data)
      setNotificaciones(notificacionesR.data || [])
      setSoporteTickets(soporteR.data || [])
      if (isAdmin) {
        const usuariosR = await getUsuarios()
        setUsuarios(usuariosR.data || [])
      } else {
        setUsuarios([])
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudieron cargar los datos.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (isAdmin && tab === 'registro') setTab('usuarios')
  }, [isAdmin, tab])

  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      contentRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [focusVersion])

  const citasFiltradas = useMemo(() => {
    return citas.filter((cita) => {
      const coincideEstado = !filtros.estado || cita.estado === filtros.estado
      const coincideDoctor = !filtros.doctor || cita.doctor?.toLowerCase().includes(filtros.doctor.toLowerCase())
      const coincideFecha = !filtros.fecha || cita.fecha_hora?.startsWith(filtros.fecha)
      const term = searchTerm.trim().toLowerCase()
      const coincideBusqueda = !term || [cita.paciente, cita.doctor, cita.especialidad, cita.estado, cita.dni, cita.motivo]
        .some((field) => String(field || '').toLowerCase().includes(term))
      return coincideEstado && coincideDoctor && coincideFecha && coincideBusqueda
    })
  }, [citas, filtros, searchTerm])

  const goToTab = (nextTab, nextFilters = {}) => {
    setTab(nextTab)
    setFiltros((actual) => ({ ...actual, ...nextFilters }))
    requestFocus()
  }

  const showMessage = (text) => {
    setMessage(text)
    requestFocus()
    window.setTimeout(() => setMessage(''), 3500)
  }

  const refreshNotificaciones = async () => {
    const res = await getNotificacionesAdmin()
    setNotificaciones(res.data || [])
  }

  const refreshSoporte = async () => {
    const res = await getSoporteTickets()
    setSoporteTickets(res.data || [])
  }

  const handleNotificacion = async (notificacion) => {
    try {
      if (!notificacion.enviada) {
        await marcarNotificacionEnviada(notificacion.id_notif)
        await refreshNotificaciones()
      }
      goToTab('gestion', { doctor: notificacion.doctor || '', fecha: notificacion.fecha_hora?.slice(0, 10) || '' })
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo actualizar la notificación.')
    }
  }

  const registrarSoporteInterno = async () => {
    setActionLoading('soporte')
    try {
      await enviarSoporte({
        id_usuario: user?.id,
        rol: user?.rol || 'recepcionista',
        contexto: 'soporte recepción',
        mensaje: 'Recepción solicita apoyo operativo desde el portal.',
      })
      await refreshSoporte()
      goToTab('soporte')
      showMessage('Ticket de soporte registrado en Supabase.')
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo registrar soporte.')
    } finally {
      setActionLoading('')
    }
  }

  const actualizarTicket = async (ticket, estado) => {
    setActionLoading(`ticket-${ticket.id_ticket}`)
    try {
      await actualizarSoporteTicket(ticket.id_ticket, {
        estado,
        asignado_a: user?.id,
        respuesta: estado === 'resuelto' ? 'Ticket atendido por recepción.' : 'Ticket en revisión por recepción.',
      })
      await refreshSoporte()
      showMessage('Ticket de soporte actualizado.')
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo actualizar el ticket de soporte.')
    } finally {
      setActionLoading('')
    }
  }

  const cambiarEstado = async (id, accion) => {
    const acciones = {
      confirmar: confirmarCita,
      asistencia: registrarAsistencia,
      salida: registrarSalida,
      cancelar: cancelarCita,
    }
    setActionLoading(`${accion}-${id}`)
    try {
      await acciones[accion](id)
      showMessage('Cita actualizada correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo actualizar la cita.')
    } finally {
      setActionLoading('')
    }
  }

  const abrirReprogramacion = async (cita) => {
    goToTab('gestion')
    setReprogramacion({ cita, id_doctor: cita.id_doctor, id_horario: '', horarios: [], loading: true })
    try {
      const res = await getHorarios(cita.id_doctor)
      setReprogramacion({ cita, id_doctor: cita.id_doctor, id_horario: '', horarios: res.data || [], loading: false })
    } catch (error) {
      setReprogramacion(null)
      showMessage(error.response?.data?.detail || 'No se pudieron cargar horarios para reprogramar.')
    }
  }

  const cambiarDoctorReprogramacion = async (idDoctor) => {
    setReprogramacion((actual) => ({ ...actual, id_doctor: idDoctor, id_horario: '', horarios: [], loading: true }))
    try {
      const res = await getHorarios(idDoctor)
      setReprogramacion((actual) => ({
        ...actual,
        id_doctor: idDoctor,
        id_horario: '',
        horarios: res.data || [],
        loading: false,
      }))
    } catch (error) {
      setReprogramacion((actual) => ({ ...actual, loading: false }))
      showMessage(error.response?.data?.detail || 'No se pudo cargar disponibilidad del doctor.')
    }
  }

  const guardarReprogramacion = async (event) => {
    event.preventDefault()
    const horario = reprogramacion.horarios.find((h) => String(h.id_horario) === String(reprogramacion.id_horario))
    if (!horario) return

    setActionLoading('reprogramar')
    try {
      await reprogramarCita(reprogramacion.cita.id_cita, {
        id_horario: Number(reprogramacion.id_horario),
        fecha_hora: `${horario.fecha}T${horario.hora_inicio}`,
      })
      setReprogramacion(null)
      showMessage('Cita reprogramada correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo reprogramar la cita.')
    } finally {
      setActionLoading('')
    }
  }

  const cargarDisponibilidad = async (idDoctor) => {
    setAgendaDoctor(idDoctor)
    if (!idDoctor) {
      setHorariosAgenda([])
      return
    }
    try {
      const res = await getHorarios(idDoctor)
      setHorariosAgenda(res.data || [])
    } catch (error) {
      setHorariosAgenda([])
      showMessage(error.response?.data?.detail || 'No se pudo cargar la disponibilidad.')
    }
  }

  const registrarNuevoPaciente = async (event) => {
    event.preventDefault()
    setActionLoading('registro')
    try {
      await registrarPaciente(registro)
      setRegistro(emptyRegistro)
      showMessage('Paciente registrado correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo registrar el paciente.')
    } finally {
      setActionLoading('')
    }
  }

  const registrarUsuarioAdmin = async (event) => {
    event.preventDefault()
    if (!isAdmin) return

    const payload = {
      ...usuarioAdmin,
      id_especialidad: usuarioAdmin.id_especialidad ? Number(usuarioAdmin.id_especialidad) : undefined,
      fecha_nacimiento: usuarioAdmin.fecha_nacimiento || undefined,
    }

    setActionLoading('usuario-admin')
    try {
      await crearUsuario(payload)
      setUsuarioAdmin(emptyUsuarioAdmin)
      showMessage('Cuenta creada correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo crear la cuenta.')
    } finally {
      setActionLoading('')
    }
  }

  const updateUsuarioAdmin = (field, value) => {
    setUsuarioAdmin((current) => ({ ...current, [field]: value }))
  }

  const totalCitas = citas.length
  const estadoMetricas = useMemo(() => {
    return ['pendiente', 'confirmada', 'reprogramada', 'en_atencion', 'completada', 'cancelada'].map((estado) => ({
      key: estado,
      label: formatEstado(estado),
      value: citas.filter((cita) => cita.estado === estado).length,
      color: estadoMetricColors[estado],
    }))
  }, [citas])

  const donutGradient = useMemo(() => buildDonutGradient(estadoMetricas, totalCitas), [estadoMetricas, totalCitas])

  const especialidadMetricas = useMemo(() => {
    const counts = citas.reduce((acc, cita) => {
      const key = cita.especialidad || 'Sin especialidad'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [citas])

  const usuarioMetricas = useMemo(() => {
    const source = isAdmin && usuarios.length ? usuarios : [
      ...pacientes.map((item) => ({ ...item, tipo_usuario: 'paciente' })),
      ...doctores.map((item) => ({ ...item, tipo_usuario: 'doctor' })),
    ]

    return ['paciente', 'doctor', 'recepcionista', 'administrador'].map((rol) => ({
      key: rol,
      label: roleLabels[rol],
      value: source.filter((item) => item.tipo_usuario === rol).length,
    }))
  }, [doctores, isAdmin, pacientes, usuarios])

  const maxEspecialidad = Math.max(...especialidadMetricas.map((item) => item.value), 1)
  const maxUsuarios = Math.max(...usuarioMetricas.map((item) => item.value), 1)
  const ticketsActivos = soporteTickets.filter((ticket) => ['abierto', 'en_revision'].includes(ticket.estado))
  const citaNotificationItems = notificaciones.length ? notificaciones.slice(0, 8).map((item) => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje,
    time: formatDateTime(item.fecha_programada),
    actionLabel: item.enviada ? 'Abrir gestión' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    {
      title: `${stats.pendientes ?? 0} citas pendientes`,
      description: 'Valida solicitudes nuevas para que los pacientes reciban confirmación.',
      time: 'Ahora',
      actionLabel: 'Ir a gestión',
      onClick: () => goToTab('gestion', { estado: 'pendiente' }),
    },
    {
      title: `${stats.citas_hoy ?? 0} citas hoy`,
      description: 'Revisa la agenda diaria y disponibilidad operativa.',
      time: 'Hoy',
      actionLabel: 'Ver agenda',
      onClick: () => goToTab('agenda', { fecha: todayInputValue() }),
    },
  ]

  const notificationItems = [
    ...ticketsActivos.slice(0, 3).map((ticket) => ({
      title: `Soporte ${ticket.rol}`,
      description: ticket.mensaje,
      time: formatDateTime(ticket.fecha_actualizacion),
      actionLabel: 'Abrir soporte',
      onClick: () => goToTab('soporte'),
    })),
    ...citaNotificationItems.slice(0, 5),
  ]

  const helpItems = [
    ...(isAdmin ? [{
      title: 'Gestionar usuarios',
      description: 'Crea cuentas de administradores, recepcionistas, médicos y pacientes desde un solo lugar.',
      actionLabel: 'Abrir usuarios',
      onClick: () => goToTab('usuarios'),
    }] : [{
      title: 'Registrar paciente',
      description: 'Crea una ficha de paciente para poder agendar o validar citas.',
      actionLabel: 'Abrir registro',
      onClick: () => goToTab('registro'),
    }]),
    {
      title: 'Gestionar asistencia',
      description: 'Confirma asistencia, salida, cancelación o reprogramación desde gestión.',
      actionLabel: 'Abrir gestión',
      onClick: () => goToTab('gestion'),
    },
  ]

  const appItems = [
    { title: 'Panel', description: 'Métricas rápidas del día.', actionLabel: 'Abrir', onClick: () => goToTab('dashboard') },
    { title: 'Agenda global', description: 'Calendario y disponibilidad por doctor.', actionLabel: 'Abrir', onClick: () => goToTab('agenda') },
    ...(!isAdmin ? [{ title: 'Registro paciente', description: 'Alta de nuevos pacientes.', actionLabel: 'Abrir', onClick: () => goToTab('registro') }] : []),
    ...(isAdmin ? [{ title: 'Usuarios', description: `${usuarios.length} cuentas registradas.`, actionLabel: 'Abrir', onClick: () => goToTab('usuarios') }] : []),
    { title: 'Soporte', description: `${ticketsActivos.length} tickets activos.`, actionLabel: 'Abrir', onClick: () => goToTab('soporte') },
  ]

  const sidebarItems = [
    { path: 'dashboard', icon: 'dashboard', label: 'Panel' },
    { path: 'agenda', icon: 'calendar_month', label: 'Agenda global' },
    { path: 'gestion', icon: 'event_note', label: 'Gestión de citas' },
    ...(!isAdmin ? [{ path: 'registro', icon: 'person_add', label: 'Registro paciente' }] : []),
    ...(isAdmin ? [{ path: 'usuarios', icon: 'admin_panel_settings', label: 'Usuarios' }] : []),
    { path: 'soporte', icon: 'support_agent', label: 'Soporte' },
  ]

  const Sidebar = (
    <PortalSidebar
      active={tab}
      items={sidebarItems}
      onSelect={(nextTab) => goToTab(nextTab)}
      ctaLabel="Nueva cita"
      onCta={() => goToTab('gestion')}
      onSupport={() => goToTab('soporte')}
    />
  )

  if (loading) {
    return (
      <Layout sidebar={Sidebar} title={isAdmin ? 'Administración' : 'Recepción'} notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando datos...</div>
      </Layout>
    )
  }

  return (
    <Layout
      sidebar={Sidebar}
      title={isAdmin ? 'Administración' : 'Recepción'}
      searchValue={searchTerm}
      searchPlaceholder="Buscar pacientes, doctores o citas..."
      onSearchChange={setSearchTerm}
      notificationItems={notificationItems}
      helpItems={helpItems}
      appItems={appItems}
    >
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] space-y-6 p-4 focus:outline-none sm:p-6 lg:space-y-7 lg:p-8">
        {message && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            {message}
          </div>
        )}

        {tab === 'dashboard' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Panel administrativo' : 'Recepción'}</h2>
              <p className="mt-1 text-sm text-slate-500">Citas del día, validaciones pendientes y actividad general.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Citas hoy', stats.citas_hoy ?? 0, () => goToTab('agenda', { fecha: todayInputValue() })],
                ['Pendientes', stats.pendientes ?? 0, () => goToTab('gestion', { estado: 'pendiente' })],
                ['Confirmadas hoy', stats.confirmadas_hoy ?? 0, () => goToTab('gestion', { estado: 'confirmada', fecha: todayInputValue() })],
                ['En atención', stats.en_atencion_hoy ?? 0, () => goToTab('gestion', { estado: 'en_atencion', fecha: todayInputValue() })],
              ].map(([label, value, action]) => (
                <button key={label} type="button" onClick={action} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#12b8a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.2fr] xl:gap-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative mx-auto h-44 w-44 shrink-0 rounded-full sm:mx-0" style={{ background: donutGradient }}>
                    <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                      <span className="text-3xl font-bold text-slate-900">{totalCitas}</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Citas</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Distribución de estados</h3>
                    <p className="mt-1 text-sm text-slate-500">Vista general para detectar acumulación de pendientes, cancelaciones o atenciones abiertas.</p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {estadoMetricas.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => goToTab('gestion', { estado: item.key })}
                          className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left text-sm transition hover:border-[#12b8a3] hover:bg-[#f4fffc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15"
                        >
                          <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.label}
                          </span>
                          <span className="font-bold text-slate-900">{item.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Demanda por especialidad</h3>
                    <p className="mt-1 text-sm text-slate-500">Ayuda a decidir disponibilidad, turnos y médicos con mayor carga.</p>
                  </div>
                  <span className="rounded-full bg-[#e5fbf7] px-3 py-1 text-xs font-bold text-[#006b5d]">{especialidadMetricas.length} áreas</span>
                </div>
                <div className="mt-5 space-y-4">
                  {especialidadMetricas.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">Aún no hay citas suficientes para generar el gráfico.</p>
                  ) : especialidadMetricas.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-bold text-slate-900">{item.value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#007a68]" style={{ width: `${Math.max(8, percentage(item.value, maxEspecialidad))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {isAdmin && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Cuentas por rol</h3>
                    <p className="mt-1 text-sm text-slate-500">Resumen de personal y pacientes registrados en el sistema.</p>
                  </div>
                  <button type="button" onClick={() => goToTab('usuarios')} className={secondaryButton}>
                    Gestionar usuarios
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                  {usuarioMetricas.map((item) => (
                    <div key={item.key} className="rounded-lg bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-600">{item.label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[#12b8a3]" style={{ width: `${Math.max(8, percentage(item.value, maxUsuarios))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">Citas programadas para hoy</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {citasHoy.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-500">No hay citas registradas para hoy.</p>
                ) : (
                  citasHoy.map((cita) => (
                    <button key={cita.id_cita} type="button" onClick={() => goToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })} className="grid w-full grid-cols-1 items-start gap-3 px-5 py-4 text-left transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15 md:grid-cols-[1.4fr_1.4fr_1fr_auto] md:items-center md:gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{cita.paciente}</p>
                        <p className="text-xs text-slate-500">DNI {cita.dni || 'sin registrar'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">Dr. {cita.doctor}</p>
                        <p className="text-xs text-slate-500">{cita.especialidad}</p>
                      </div>
                      <p className="text-sm text-slate-600">{formatDateTime(cita.fecha_hora)}</p>
                      <span className={`rounded-md border px-2 py-1 text-xs font-medium ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                        {formatEstado(cita.estado)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {tab === 'agenda' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Agenda global</h2>
              <p className="mt-1 text-sm text-slate-500">Calendario operativo y disponibilidad por doctor.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr] xl:gap-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    type="date"
                    className={inputClass}
                    value={filtros.fecha}
                    onChange={(event) => setFiltros({ ...filtros, fecha: event.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Buscar doctor"
                    value={filtros.doctor}
                    onChange={(event) => setFiltros({ ...filtros, doctor: event.target.value })}
                  />
                  <select
                    className={inputClass}
                    value={filtros.estado}
                    onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="reprogramada">Reprogramada</option>
                    <option value="en_atencion">En atención</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="divide-y divide-slate-100">
                  {citasFiltradas.slice(0, 12).map((cita) => (
                    <button key={cita.id_cita} type="button" onClick={() => goToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })} className="grid w-full grid-cols-1 items-start gap-2 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-3">
                      <span className="font-medium text-slate-900">{cita.paciente}</span>
                      <span className="text-slate-600">Dr. {cita.doctor}</span>
                      <span className="text-slate-500">{formatDateTime(cita.fecha_hora)}</span>
                      <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                        {formatEstado(cita.estado)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">Disponibilidad</h3>
                <select
                  className={`mt-4 w-full ${inputClass}`}
                  value={agendaDoctor}
                  onChange={(event) => cargarDisponibilidad(event.target.value)}
                >
                  <option value="">Selecciona doctor</option>
                  {doctores.map((doctor) => (
                    <option key={doctor.id_usuario} value={doctor.id_usuario}>
                      Dr. {doctorLabel(doctor)}
                    </option>
                  ))}
                </select>
                <div className="mt-4 space-y-2">
                  {horariosAgenda.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin horarios libres seleccionados.</p>
                  ) : (
                    horariosAgenda.slice(0, 8).map((horario) => (
                      <button key={horario.id_horario} type="button" onClick={() => showMessage(`Horario libre seleccionado: ${horario.fecha} ${horario.hora_inicio}`)} className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[#e5fbf7] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15">
                        {horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'gestion' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Gestión de citas</h2>
              <p className="mt-1 text-sm text-slate-500">Confirmación, reprogramación, asistencia y salida.</p>
            </div>

            {reprogramacion && (
              <form onSubmit={guardarReprogramacion} className="rounded-lg border border-violet-200 bg-violet-50 p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-violet-950">Reprogramar cita #{reprogramacion.cita.id_cita}</h3>
                  <p className="text-sm text-violet-700">{reprogramacion.cita.paciente}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <select
                    className={inputClass}
                    value={reprogramacion.id_doctor}
                    onChange={(event) => cambiarDoctorReprogramacion(event.target.value)}
                  >
                    {doctores.map((doctor) => (
                      <option key={doctor.id_usuario} value={doctor.id_usuario}>
                        Dr. {doctorLabel(doctor)}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    required
                    value={reprogramacion.id_horario}
                    onChange={(event) => setReprogramacion({ ...reprogramacion, id_horario: event.target.value })}
                    disabled={reprogramacion.loading}
                  >
                    <option value="">{reprogramacion.loading ? 'Cargando horarios...' : 'Nuevo horario'}</option>
                    {reprogramacion.horarios.map((horario) => (
                      <option key={horario.id_horario} value={horario.id_horario}>
                        {horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading === 'reprogramar'} className={primaryButton}>
                      {actionLoading === 'reprogramar' ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => setReprogramacion(null)} className={secondaryButton}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Doctor</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citasFiltradas.map((cita) => (
                    <tr key={cita.id_cita} className="transition hover:bg-[#f8fbff]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{cita.paciente}</p>
                        <p className="text-xs text-slate-500">{cita.dni}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">Dr. {cita.doctor}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(cita.fecha_hora)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                          {formatEstado(cita.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {cita.estado === 'pendiente' && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'confirmar')} disabled={actionLoading === `confirmar-${cita.id_cita}`} className={primaryButton}>
                              {actionLoading === `confirmar-${cita.id_cita}` ? '...' : 'Confirmar'}
                            </button>
                          )}
                          {['pendiente', 'confirmada', 'reprogramada'].includes(cita.estado) && (
                            <button type="button" onClick={() => abrirReprogramacion(cita)} className={secondaryButton}>
                              Reprogramar
                            </button>
                          )}
                          {['confirmada', 'reprogramada'].includes(cita.estado) && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'asistencia')} disabled={actionLoading === `asistencia-${cita.id_cita}`} className={primaryButton}>
                              {actionLoading === `asistencia-${cita.id_cita}` ? '...' : 'Asistencia'}
                            </button>
                          )}
                          {cita.estado === 'en_atencion' && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'salida')} disabled={actionLoading === `salida-${cita.id_cita}`} className={primaryButton}>
                              {actionLoading === `salida-${cita.id_cita}` ? '...' : 'Salida'}
                            </button>
                          )}
                          {!['cancelada', 'completada'].includes(cita.estado) && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'cancelar')} disabled={actionLoading === `cancelar-${cita.id_cita}`} className={dangerButton}>
                              {actionLoading === `cancelar-${cita.id_cita}` ? '...' : 'Cancelar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'registro' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Alta de paciente</h2>
              <p className="mt-1 text-sm text-slate-500">{pacientes.length} pacientes registrados. {especialidades.length} especialidades disponibles.</p>
            </div>
            <form onSubmit={registrarNuevoPaciente} className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['nombre', 'Nombre', 'text'],
                  ['apellido', 'Apellido', 'text'],
                  ['email', 'Correo', 'email'],
                  ['password', 'Contraseña inicial', 'password'],
                  ['dni', 'DNI', 'text'],
                  ['telefono', 'Teléfono', 'text'],
                  ['fecha_nacimiento', 'Fecha de nacimiento', 'date'],
                  ['seguro_medico', 'Seguro médico', 'text'],
                  ['direccion', 'Dirección', 'text'],
                ].map(([field, label, type]) => (
                  <label key={field} className="text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type={type}
                      required={!['telefono', 'seguro_medico', 'direccion'].includes(field)}
                      className={`mt-1 w-full ${inputClass}`}
                      value={registro[field]}
                      onChange={(event) => setRegistro({ ...registro, [field]: event.target.value })}
                    />
                  </label>
                ))}
                <label className="text-sm font-medium text-slate-700">
                  Género
                  <select
                    className={`mt-1 w-full ${inputClass}`}
                    value={registro.genero}
                    onChange={(event) => setRegistro({ ...registro, genero: event.target.value })}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
              </div>
              <button type="submit" disabled={actionLoading === 'registro'} className={`mt-5 ${primaryButton}`}>
                {actionLoading === 'registro' ? 'Registrando...' : 'Registrar paciente'}
              </button>
            </form>
          </section>
        )}

        {tab === 'usuarios' && isAdmin && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Gestión de usuarios</h2>
              <p className="mt-1 text-sm text-slate-500">Alta de administradores, recepcionistas, médicos y pacientes.</p>
            </div>

            <form onSubmit={registrarUsuarioAdmin} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">
                  Rol
                  <select
                    className={`mt-1 w-full ${inputClass}`}
                    value={usuarioAdmin.tipo_usuario}
                    onChange={(event) => updateUsuarioAdmin('tipo_usuario', event.target.value)}
                  >
                    <option value="doctor">Médico</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="administrador">Administrador</option>
                    <option value="paciente">Paciente</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Nombre
                  <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.nombre} onChange={(event) => updateUsuarioAdmin('nombre', event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Apellido
                  <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.apellido} onChange={(event) => updateUsuarioAdmin('apellido', event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Correo
                  <input type="email" className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.email} onChange={(event) => updateUsuarioAdmin('email', event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Contraseña temporal
                  <input type="password" className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.password} onChange={(event) => updateUsuarioAdmin('password', event.target.value)} required minLength={6} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Teléfono
                  <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.telefono} onChange={(event) => updateUsuarioAdmin('telefono', event.target.value)} />
                </label>

                {usuarioAdmin.tipo_usuario === 'doctor' && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      CMP
                      <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.cmp} onChange={(event) => updateUsuarioAdmin('cmp', event.target.value)} required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Especialidad
                      <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.id_especialidad} onChange={(event) => updateUsuarioAdmin('id_especialidad', event.target.value)} required>
                        <option value="">Selecciona especialidad</option>
                        {especialidades.map((item) => (
                          <option key={item.id_especialidad} value={item.id_especialidad}>{item.nombre}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Turno
                      <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.turno} onChange={(event) => updateUsuarioAdmin('turno', event.target.value)} required>
                        <option value="mañana">Mañana</option>
                        <option value="tarde">Tarde</option>
                        <option value="noche">Noche</option>
                      </select>
                    </label>
                  </>
                )}

                {['recepcionista', 'administrador'].includes(usuarioAdmin.tipo_usuario) && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      Código de empleado
                      <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.codigo_empleado} onChange={(event) => updateUsuarioAdmin('codigo_empleado', event.target.value)} required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Turno
                      <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.turno} onChange={(event) => updateUsuarioAdmin('turno', event.target.value)} required>
                        <option value="mañana">Mañana</option>
                        <option value="tarde">Tarde</option>
                        <option value="noche">Noche</option>
                      </select>
                    </label>
                  </>
                )}

                {usuarioAdmin.tipo_usuario === 'paciente' && (
                  <>
                    <label className="text-sm font-medium text-slate-700">
                      DNI
                      <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.dni} onChange={(event) => updateUsuarioAdmin('dni', event.target.value)} required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Fecha de nacimiento
                      <input type="date" className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.fecha_nacimiento} onChange={(event) => updateUsuarioAdmin('fecha_nacimiento', event.target.value)} required />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Género
                      <select className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.genero} onChange={(event) => updateUsuarioAdmin('genero', event.target.value)} required>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Seguro médico
                      <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.seguro_medico} onChange={(event) => updateUsuarioAdmin('seguro_medico', event.target.value)} />
                    </label>
                    <label className="text-sm font-medium text-slate-700 md:col-span-2">
                      Dirección
                      <input className={`mt-1 w-full ${inputClass}`} value={usuarioAdmin.direccion} onChange={(event) => updateUsuarioAdmin('direccion', event.target.value)} />
                    </label>
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="submit" disabled={actionLoading === 'usuario-admin'} className={primaryButton}>
                  {actionLoading === 'usuario-admin' ? 'Creando...' : `Crear ${roleLabels[usuarioAdmin.tipo_usuario].toLowerCase()}`}
                </button>
                <p className="text-sm text-slate-500">La contraseña se puede cambiar luego con recuperación por correo.</p>
              </div>
            </form>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Contacto</th>
                    <th className="px-4 py-3 text-left">Detalle</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-slate-500">No hay usuarios para mostrar.</td>
                    </tr>
                  ) : usuarios.map((item) => (
                    <tr key={item.id_usuario} className="transition hover:bg-[#f8fbff]">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{item.nombre} {item.apellido}</p>
                        <p className="text-xs text-slate-500">ID #{item.id_usuario}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                          {roleLabels[item.tipo_usuario] || item.tipo_usuario}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <p>{item.email}</p>
                        <p className="text-xs text-slate-500">{item.telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.tipo_usuario === 'doctor' && <span>{item.doctor?.especialidad?.nombre || 'Sin especialidad'} · CMP {item.doctor?.cmp || 'sin registrar'}</span>}
                        {item.tipo_usuario === 'paciente' && <span>DNI {item.paciente?.dni || 'sin registrar'}</span>}
                        {['recepcionista', 'administrador'].includes(item.tipo_usuario) && <span>{item.administrador?.codigo_empleado || item.administrador?.legajo || 'Código de empleado sin registrar'}</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${item.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'soporte' && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tickets de soporte</h2>
                <p className="mt-1 text-sm text-slate-500">Solicitudes de pacientes, médicos y recepción para seguimiento operativo.</p>
              </div>
              <button type="button" onClick={registrarSoporteInterno} disabled={actionLoading === 'soporte'} className={primaryButton}>
                {actionLoading === 'soporte' ? 'Registrando...' : 'Crear ticket interno'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Abiertos', soporteTickets.filter((ticket) => ticket.estado === 'abierto').length],
                ['En revisión', soporteTickets.filter((ticket) => ticket.estado === 'en_revision').length],
                ['Resueltos', soporteTickets.filter((ticket) => ticket.estado === 'resuelto').length],
                ['Total', soporteTickets.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Solicitante</th>
                    <th className="px-4 py-3 text-left">Mensaje</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {soporteTickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-slate-500">No hay tickets de soporte registrados.</td>
                    </tr>
                  ) : soporteTickets.map((ticket) => (
                    <tr key={ticket.id_ticket} className="transition hover:bg-[#f8fbff]">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{ticket.solicitante || `Usuario #${ticket.id_usuario || 'sin registrar'}`}</p>
                        <p className="text-xs text-slate-500">{ticket.rol}{ticket.contexto ? ` - ${ticket.contexto}` : ''}</p>
                      </td>
                      <td className="max-w-md px-4 py-4 text-slate-700">
                        <p>{ticket.mensaje}</p>
                        {ticket.id_cita && <p className="mt-1 text-xs text-slate-500">Cita #{ticket.id_cita}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${ticketEstadoClass[ticket.estado] || ticketEstadoClass.abierto}`}>
                          {formatTicketEstado(ticket.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDateTime(ticket.fecha_actualizacion)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {ticket.estado === 'abierto' && (
                            <button type="button" onClick={() => actualizarTicket(ticket, 'en_revision')} disabled={actionLoading === `ticket-${ticket.id_ticket}`} className={secondaryButton}>
                              Revisar
                            </button>
                          )}
                          {!['resuelto', 'cerrado'].includes(ticket.estado) && (
                            <button type="button" onClick={() => actualizarTicket(ticket, 'resuelto')} disabled={actionLoading === `ticket-${ticket.id_ticket}`} className={primaryButton}>
                              Resolver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
