import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import {
  enviarSoporte, getCitasDoctor, getHistorial,
  getNotificacionesDoctor, marcarNotificacionEnviada, registrarAtencion,
  getSoporteTickets,
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
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
}

export default function DashboardDoctor() {
  const { user } = useAuth()
  const userId = user?.id
  const [tab, setTab] = useState('agenda')
  const [citas, setCitas] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [soporteTickets, setSoporteTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [historial, setHistorial] = useState([])
  const [form, setForm] = useState(emptyAtencion)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [focusVersion, setFocusVersion] = useState(0)
  const [showSoporte, setShowSoporte] = useState(false)
  const [mensajeSoporte, setMensajeSoporte] = useState('')
  const contentRef = useRef(null)

  const requestFocus = () => setFocusVersion(c => c + 1)
  const goToTab = (nextTab) => { setTab(nextTab); requestFocus() }

  // ── Definir refreshSoporte ANTES de fetchCitas ───────────
  const refreshSoporte = useCallback(async () => {
    if (!userId) return
    try {
      const res = await getSoporteTickets({ id_usuario: userId })
      setSoporteTickets(res.data || [])
    } catch (e) { console.warn('refreshSoporte:', e.message) }
  }, [userId])

  const fetchCitas = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    let intentos = 0
    while (intentos < 5) {
      try {
        const [citasRes, notificacionesRes] = await Promise.all([
          getCitasDoctor(userId),
          getNotificacionesDoctor(userId),
        ])
        setCitas(citasRes.data || [])
        setNotificaciones(notificacionesRes.data || [])
        setLoading(false)
        await refreshSoporte()
        return
      } catch (error) {
        intentos++
        if (intentos < 5) await new Promise(res => setTimeout(res, 1000))
      }
    }
    setLoading(false)
    setMessage('No se pudo cargar la agenda médica.')
  }, [userId, refreshSoporte])

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
    if (!mensajeSoporte.trim()) { setShowSoporte(true); return }
    setSaving(true)
    try {
      await enviarSoporte({
        id_usuario: userId, rol: 'doctor',
        contexto: 'soporte médico', mensaje: mensajeSoporte,
        id_cita: selected?.id_cita
      })
      await refreshNotificaciones()
      await refreshSoporte()
      setMessage('Ticket de soporte registrado correctamente.')
      setMensajeSoporte('')
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
      setSelected(null); setForm(emptyAtencion); setHistorial([])
      await fetchCitas(); goToTab('agenda')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo registrar la atención.')
    } finally { setSaving(false) }
  }

  const notificationItems = notificaciones.length ? notificaciones.slice(0, 6).map(item => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje, time: formatDateTime(item.fecha_programada),
    actionLabel: item.enviada ? 'Abrir atención' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    { title: `${agendaDiaria.length} pacientes hoy`, description: 'Revisa la agenda cronológica.', time: 'Hoy', actionLabel: 'Ver agenda', onClick: () => goToTab('agenda') },
    { title: `${enAtencion.length} en atención`, description: 'Consultas abiertas.', time: 'Ahora', actionLabel: 'Abrir atención', onClick: () => enAtencion[0] ? abrirAtencion(enAtencion[0]) : goToTab('agenda') },
  ]

  const helpItems = [
    { title: 'Registrar atención', description: 'Selecciona un paciente confirmado y completa el diagnóstico.', actionLabel: 'Ir a agenda', onClick: () => goToTab('agenda') },
    { title: 'Consultar historial', description: 'Revisa atenciones previas antes de guardar la consulta.', actionLabel: 'Abrir historial', onClick: () => goToTab('historial') },
    { title: 'Soporte médico', description: 'Solicita ayuda al equipo de recepción.', actionLabel: 'Abrir soporte', onClick: () => setShowSoporte(true) },
  ]

  const appItems = [
    { title: 'Agenda diaria', description: `${agendaDiaria.length} citas hoy.`, actionLabel: 'Abrir', onClick: () => goToTab('agenda') },
    { title: 'Atención', description: selected ? `Ficha activa: ${selected.paciente}` : 'Sin ficha activa.', actionLabel: 'Abrir', onClick: () => goToTab('atencion') },
    { title: 'Historial', description: `${pacientesUnicos.length} pacientes.`, actionLabel: 'Abrir', onClick: () => goToTab('historial') },
  ]

  const sidebarItems = [
    { path: 'agenda',   icon: 'dashboard',     label: 'Agenda diaria' },
    { path: 'atencion', icon: 'clinical_notes', label: 'Atención' },
    { path: 'historial',icon: 'folder_open',    label: 'Historial' },
  ]

  const sidebar = (
    <PortalSidebar active={tab} items={sidebarItems} onSelect={goToTab}
      ctaLabel="Ver agenda" ctaIcon="event" onCta={() => goToTab('agenda')}
      onSupport={() => setShowSoporte(s => !s)} />
  )

  if (loading) return (
    <Layout sidebar={sidebar} title="Panel médico" notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#12b8a3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#52615f]">Cargando agenda médica...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout sidebar={sidebar} title="Panel médico" searchValue={searchTerm}
      searchPlaceholder="Buscar pacientes, DNI o estados..." onSearchChange={setSearchTerm}
      notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] space-y-6 p-4 focus:outline-none sm:p-6 lg:p-8">

        {message && (
          <div className="rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-4 py-3 text-sm font-bold text-[#006b5d]">
            {message}
          </div>
        )}

        {/* Panel soporte */}
        {showSoporte && (
          <div className="medcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d]">
                  <span className="material-symbols-outlined">support_agent</span>
                </span>
                <div>
                  <h3 className="font-extrabold text-[#101828]">Soporte médico</h3>
                  <p className="text-sm text-[#52615f]">El equipo de recepción recibirá tu solicitud.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSoporte(false)}
                className="rounded-full p-1.5 text-[#52615f] hover:bg-[#f8fbff]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <textarea
              className="w-full rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 min-h-24"
              value={mensajeSoporte}
              onChange={e => setMensajeSoporte(e.target.value)}
              placeholder="Describe qué necesitas..."
            />
            <div className="flex gap-3">
              <button type="button" onClick={registrarSoporteMedico}
                disabled={saving || !mensajeSoporte.trim()}
                className="medcare-primary-button px-6 py-2.5 disabled:opacity-60">
                {saving ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <button type="button" onClick={() => setShowSoporte(false)}
                className="rounded-xl border border-[#bdcbc7] bg-white px-5 py-2.5 text-sm font-extrabold text-[#223330] hover:bg-[#f8fbff]">
                Cancelar
              </button>
            </div>

            {/* Tickets anteriores */}
            {soporteTickets.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#bdcbc7]">
                <p className="text-sm font-extrabold text-[#223330] uppercase tracking-wide">Mis solicitudes anteriores</p>
                {soporteTickets.map(t => (
                  <div key={t.id_ticket} className="rounded-xl border border-[#bdcbc7] bg-white p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-extrabold text-sm text-[#101828] flex-1">{t.mensaje}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                        t.estado === 'resuelto'    ? 'bg-[#d8f4ee] text-[#006b5d]' :
                        t.estado === 'en_revision' ? 'bg-[#edf2ff] text-[#355382]' :
                        t.estado === 'cerrado'     ? 'bg-[#f5f5f2] text-[#46514f]' :
                                                     'bg-[#faeeda] text-[#854F0B]'
                      }`}>{t.estado?.replace('_', ' ')}</span>
                    </div>
                    {t.respuesta ? (
                      <div className="rounded-xl bg-[#d8f4ee] p-3">
                        <p className="text-xs font-extrabold text-[#006b5d] mb-1">Respuesta:</p>
                        <p className="text-sm text-[#101828]">{t.respuesta}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#52615f] italic">Sin respuesta aún.</p>
                    )}
                    <p className="text-xs text-[#52615f] mt-2">
                      {new Date(t.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'agenda' && (
          <DoctorAgenda agendaDiaria={agendaDiaria} enAtencion={enAtencion}
            pacientesUnicos={pacientesUnicos} onAtender={abrirAtencion} />
        )}
        {tab === 'atencion' && (
          <DoctorAtencion selected={selected} form={form} setForm={setForm}
            historial={historial} saving={saving} onGuardar={guardarAtencion}
            onVerHistorial={() => goToTab('historial')} />
        )}
        {tab === 'historial' && (
          <DoctorHistorial pacientesUnicos={pacientesUnicos} selected={selected}
            historial={historial} onSeleccionarPaciente={abrirAtencion} />
        )}
      </div>
    </Layout>
  )
}