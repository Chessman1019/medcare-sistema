import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import {
  enviarSoporte, getCitasDoctor, getHistorial,
  getNotificacionesDoctor, marcarNotificacionEnviada, registrarAtencion,
} from '../../services/api'
import DoctorAgenda from './DoctorAgenda'
import DoctorAtencion from './DoctorAtencion'
import DoctorHistorial from './DoctorHistorial'

const emptyAtencion = { diagnostico: '', observaciones: '', tratamiento: '' }

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

function isToday(value) {
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

export default function DashboardDoctor() {
  const { user } = useAuth()
  const userId = user?.id
  const [tab, setTab] = useState('agenda')
  const [citas, setCitas] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [historial, setHistorial] = useState([])
  const [form, setForm] = useState(emptyAtencion)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [focusVersion, setFocusVersion] = useState(0)
  const contentRef = useRef(null)

  const requestFocus = () => setFocusVersion(c => c + 1)
  const goToTab = (nextTab) => { setTab(nextTab); requestFocus() }

  const fetchCitas = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [citasRes, notificacionesRes] = await Promise.all([
        getCitasDoctor(userId),
        getNotificacionesDoctor(userId),
      ])
      setCitas(citasRes.data || [])
      setNotificaciones(notificacionesRes.data || [])
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo cargar la agenda médica.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => { contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 0)
  }, [focusVersion])

  const agendaDiaria = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return citas
      .filter(c => isToday(c.fecha_hora) && c.estado !== 'cancelada')
      .filter(c => !term || [c.paciente, c.dni, c.especialidad, c.estado, c.motivo].some(f => String(f || '').toLowerCase().includes(term)))
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  }, [citas, searchTerm])

  const pacientesUnicos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return [...new Map(citas.map(c => [c.id_paciente, c])).values()]
      .filter(c => !term || [c.paciente, c.dni, c.especialidad, c.estado].some(f => String(f || '').toLowerCase().includes(term)))
  }, [citas, searchTerm])

  const enAtencion = citas.filter(c => c.estado === 'en_atencion')

  const abrirAtencion = async (cita) => {
    setSelected(cita)
    setForm(emptyAtencion)
    goToTab('atencion')
    try {
      const res = await getHistorial(cita.id_paciente)
      setHistorial(res.data)
    } catch { setHistorial([]) }
  }

  const refreshNotificaciones = async () => {
    if (!userId) return
    const res = await getNotificacionesDoctor(userId)
    setNotificaciones(res.data || [])
  }

  const handleNotificacion = async (notificacion) => {
    try {
      if (!notificacion.enviada) {
        await marcarNotificacionEnviada(notificacion.id_notif)
        await refreshNotificaciones()
      }
      const cita = citas.find(c => c.id_cita === notificacion.id_cita)
      if (cita) abrirAtencion(cita)
      else goToTab('agenda')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo actualizar la notificación.')
    }
  }

  const registrarSoporteMedico = async () => {
    setSaving(true)
    try {
      await enviarSoporte({ id_usuario: userId, rol: 'doctor', contexto: 'soporte médico', mensaje: 'El médico solicita apoyo operativo desde el portal.', id_cita: selected?.id_cita })
      await refreshNotificaciones()
      setMessage('Ticket de soporte médico registrado.')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo registrar soporte.')
    } finally { setSaving(false) }
  }

  const guardarAtencion = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await registrarAtencion(selected.id_cita, form)
      setMessage('Atención registrada correctamente.')
      setSelected(null)
      setForm(emptyAtencion)
      setHistorial([])
      await fetchCitas()
      goToTab('agenda')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo registrar la atención.')
    } finally { setSaving(false) }
  }

  const notificationItems = notificaciones.length ? notificaciones.slice(0, 6).map(item => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje,
    time: formatDateTime(item.fecha_programada),
    actionLabel: item.enviada ? 'Abrir atención' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    { title: `${agendaDiaria.length} pacientes hoy`, description: 'Revisa la agenda cronológica.', time: 'Hoy', actionLabel: 'Ver agenda', onClick: () => goToTab('agenda') },
    { title: `${enAtencion.length} en atención`, description: 'Consultas abiertas.', time: 'Ahora', actionLabel: 'Abrir atención', onClick: () => enAtencion[0] ? abrirAtencion(enAtencion[0]) : goToTab('agenda') },
  ]

  const helpItems = [
    { title: 'Registrar atención', description: 'Selecciona un paciente confirmado y completa el diagnóstico.', actionLabel: 'Ir a agenda', onClick: () => goToTab('agenda') },
    { title: 'Consultar historial', description: 'Revisa atenciones previas antes de guardar la consulta.', actionLabel: 'Abrir historial', onClick: () => goToTab('historial') },
  ]

  const appItems = [
    { title: 'Agenda diaria', description: `${agendaDiaria.length} citas hoy.`, actionLabel: 'Abrir', onClick: () => goToTab('agenda') },
    { title: 'Atención', description: selected ? `Ficha activa: ${selected.paciente}` : 'Sin ficha activa.', actionLabel: 'Abrir', onClick: () => goToTab('atencion') },
    { title: 'Historial', description: `${pacientesUnicos.length} pacientes.`, actionLabel: 'Abrir', onClick: () => goToTab('historial') },
  ]

  const sidebarItems = [
    { path: 'agenda',   icon: 'dashboard',      label: 'Agenda diaria' },
    { path: 'atencion', icon: 'clinical_notes',  label: 'Atención' },
    { path: 'historial',icon: 'folder_open',     label: 'Historial' },
  ]

  const sidebar = (
    <PortalSidebar active={tab} items={sidebarItems} onSelect={goToTab}
      ctaLabel="Ver agenda" ctaIcon="event" onCta={() => goToTab('agenda')} onSupport={registrarSoporteMedico} />
  )

  if (loading) return (
    <Layout sidebar={sidebar} title="Panel médico" notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando agenda...</div>
    </Layout>
  )

  return (
    <Layout sidebar={sidebar} title="Panel médico" searchValue={searchTerm}
      searchPlaceholder="Buscar pacientes, DNI o estados..." onSearchChange={setSearchTerm}
      notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] space-y-6 p-4 focus:outline-none sm:p-6 lg:p-8">
        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
        )}
        {tab === 'agenda' && (
          <DoctorAgenda agendaDiaria={agendaDiaria} enAtencion={enAtencion} pacientesUnicos={pacientesUnicos} onAtender={abrirAtencion} />
        )}
        {tab === 'atencion' && (
          <DoctorAtencion selected={selected} form={form} setForm={setForm} historial={historial} saving={saving} onGuardar={guardarAtencion} onVerHistorial={() => goToTab('historial')} />
        )}
        {tab === 'historial' && (
          <DoctorHistorial pacientesUnicos={pacientesUnicos} selected={selected} historial={historial} onSeleccionarPaciente={abrirAtencion} />
        )}
      </div>
    </Layout>
  )
}