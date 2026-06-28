import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminSoporte from './AdminSoporte'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import {
    getStatsCitas, getTodasCitas, getDoctores,
    getPacientes, getListaEspera, getEspecialidades,
    confirmarCita, cancelarCita, completarCita,
    crearHorarioDisponible, getNotificacionesCitasPendientes,
    marcarNotificacionLeida, eliminarNotificacion,
} from '../../services/api'
import AdminInicio from './AdminInicio'
import AdminCitas from './AdminCitas'
import AdminDoctores from './AdminDoctores'
import AdminPacientes from './AdminPacientes'
import AdminEspecialidades from './AdminEspecialidades'
import AdminEspera from './AdminEspera'
import AdminReportes from './AdminReportes'
import AdminConfiguracion from './AdminConfiguracion'

const NOTIFICATION_REFRESH_MS = 60 * 1000

function getNotificationTitle(tipo) {
    if (tipo === 'cita_finalizada_pendiente_gestion') return 'Cita finalizada pendiente de gestionar'
    if (tipo === 'recordatorio_cita_pendiente') return 'Recordatorio de cita pendiente'
    return 'Tienes una cita pendiente por aprobar'
}

export default function DashboardAdmin() {
    const [tab, setTab] = useState('inicio')
    const [stats, setStats] = useState({})
    const [citas, setCitas] = useState([])
    const [doctores, setDoctores] = useState([])
    const [pacientes, setPacientes] = useState([])
    const [especialidades, setEspecialidades] = useState([])
    const [listaEspera, setListaEspera] = useState([])
    const [citasPendientesNotif, setCitasPendientesNotif] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [citaNotificada, setCitaNotificada] = useState(null)
    const [message, setMessage] = useState(null)
    const [actionLoading, setActionLoading] = useState('')

    // ── Fetches individuales ─────────────────────────────────
    const fetchStats = useCallback(async () => { try { const r = await getStatsCitas(); setStats(r.data) } catch (e) { console.warn('fetchStats:', e.message) } }, [])
    const fetchCitas = useCallback(async () => { try { const r = await getTodasCitas(); setCitas(r.data) } catch (e) { console.warn('fetchCitas:', e.message) } }, [])
    const fetchDoctores = useCallback(async () => { try { const r = await getDoctores(); setDoctores(r.data) } catch (e) { console.warn('fetchDoctores:', e.message) } }, [])
    const fetchPacientes = useCallback(async () => { try { const r = await getPacientes(); setPacientes(r.data) } catch (e) { console.warn('fetchPacientes:', e.message) } }, [])
    const fetchEspecialidades = useCallback(async () => { try { const r = await getEspecialidades(); setEspecialidades(r.data) } catch (e) { console.warn('fetchEspecialidades:', e.message) } }, [])
    const fetchListaEspera = useCallback(async () => { try { const r = await getListaEspera(); setListaEspera(r.data) } catch (e) { console.warn('fetchListaEspera:', e.message) } }, [])
    const fetchCitasPendientesNotif = useCallback(async () => { try { const r = await getNotificacionesCitasPendientes('administrador'); setCitasPendientesNotif(r.data || []) } catch (e) { console.warn('fetchCitasPendientesNotif:', e.message) } }, [])

    // ── Carga inicial con reintento ──────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true)
        const cargar = async (fn, setter) => {
            let intentos = 0
            while (intentos < 5) {
                try { const r = await fn(); setter(r.data); return }
                catch { intentos++; if (intentos < 5) await new Promise(res => setTimeout(res, 1000)) }
            }
        }
        await Promise.all([
            cargar(getStatsCitas, setStats),
            cargar(getTodasCitas, setCitas),
            cargar(getDoctores, setDoctores),
            cargar(getPacientes, setPacientes),
            cargar(getListaEspera, setListaEspera),
            cargar(getEspecialidades, setEspecialidades),
        ])
        fetchCitasPendientesNotif()
        setLoading(false)
    }, [fetchCitasPendientesNotif])

    useEffect(() => {
        const timer = window.setTimeout(fetchAll, 0)
        return () => window.clearTimeout(timer)
    }, [fetchAll])

    // ── Auto-refresh de recordatorios cada 5 minutos ─────────
    useEffect(() => {
        const refreshRecordatorios = () => {
            fetchStats()
            fetchCitas()
            fetchCitasPendientesNotif()
        }
        const handleVisibility = () => {
            if (!document.hidden) refreshRecordatorios()
        }
        const interval = window.setInterval(refreshRecordatorios, NOTIFICATION_REFRESH_MS)
        document.addEventListener('visibilitychange', handleVisibility)
        return () => {
            window.clearInterval(interval)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [fetchStats, fetchCitas, fetchCitasPendientesNotif])

    // ── Acciones de citas ────────────────────────────────────
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type })
        window.setTimeout(() => setMessage(null), 3500)
    }

    const accionCita = async (id, accion) => {
        const acciones = {
            confirmar: { run: confirmarCita, success: 'Cita confirmada correctamente.' },
            cancelar: { run: cancelarCita, success: 'Cita cancelada correctamente.' },
            completar: { run: completarCita, success: 'Cita completada correctamente.' },
        }
        const seleccion = acciones[accion]
        if (!seleccion) throw new Error('Accion de cita no permitida.')

        setActionLoading(`${accion}-${id}`)
        try {
            await seleccion.run(id)
            await Promise.all([fetchStats(), fetchCitas(), fetchCitasPendientesNotif()])
            showMessage(seleccion.success)
        } catch (error) {
            const detail = error.response?.data?.detail || 'No se pudo actualizar la cita.'
            showMessage(detail, 'error')
            throw new Error(detail, { cause: error })
        } finally {
            setActionLoading('')
        }
    }

    const abrirNotificacionCita = useCallback(async (notificacion) => {
        if (!notificacion.leida) await marcarNotificacionLeida(notificacion.id_notif)
        const estadoObjetivo = notificacion.tipo === 'cita_finalizada_pendiente_gestion' ? 'confirmada' : 'pendiente'
        setTab('citas')
        setSearch('')
        setCitaNotificada({
            id_cita: notificacion.id_cita,
            estado: estadoObjetivo,
            doctor: notificacion.doctor || notificacion.nombre_doctor || '',
            fecha: notificacion.fecha_hora?.slice(0, 10) || notificacion.fecha_programada?.slice(0, 10) || '',
        })
        await fetchCitasPendientesNotif()
    }, [fetchCitasPendientesNotif])

    const borrarNotificacionCita = useCallback(async (id) => {
        await eliminarNotificacion(id)
        await fetchCitasPendientesNotif()
    }, [fetchCitasPendientesNotif])

    const marcarNotificacionCitaVista = useCallback(async (id) => {
        await marcarNotificacionLeida(id)
        await fetchCitasPendientesNotif()
    }, [fetchCitasPendientesNotif])

    const registrarHorarioDisponible = async (payload) => {
        const res = await crearHorarioDisponible(payload)
        await fetchStats()
        return res.data
    }

    // ── Buscador general ─────────────────────────────────────
    const searchResults = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return []
        const results = []
        doctores.forEach(d => {
            if (`${d.nombre} ${d.apellido}`.toLowerCase().includes(term) ||
                d.doctor?.especialidad?.nombre?.toLowerCase().includes(term)) {
                results.push({
                    title: `Dr. ${d.nombre} ${d.apellido}`,
                    description: d.doctor?.especialidad?.nombre || 'Doctor',
                    actionLabel: '→ Ir a Doctores',
                    onClick: () => { setTab('doctores'); setSearch('') }
                })
            }
        })
        pacientes.forEach(p => {
            if (`${p.nombre} ${p.apellido}`.toLowerCase().includes(term) ||
                p.paciente?.dni?.includes(term)) {
                results.push({
                    title: `${p.nombre} ${p.apellido}`,
                    description: `Paciente · DNI: ${p.paciente?.dni || '—'}`,
                    actionLabel: '→ Ir a Pacientes',
                    onClick: () => { setTab('pacientes'); setSearch('') }
                })
            }
        })
        citas.forEach(c => {
            if (c.nombre_paciente?.toLowerCase().includes(term) ||
                c.nombre_doctor?.toLowerCase().includes(term)) {
                results.push({
                    title: `Cita: ${c.nombre_paciente || '—'}`,
                    description: `Dr. ${c.nombre_doctor || '—'} · ${c.estado}`,
                    actionLabel: '→ Ir a Citas',
                    onClick: () => { setTab('citas'); setSearch('') }
                })
            }
        })
        especialidades.forEach(e => {
            if (e.nombre?.toLowerCase().includes(term)) {
                results.push({
                    title: e.nombre,
                    description: 'Especialidad médica',
                    actionLabel: '→ Ir a Especialidades',
                    onClick: () => { setTab('especialidades'); setSearch('') }
                })
            }
        })
        return results.slice(0, 8)
    }, [search, doctores, pacientes, citas, especialidades])

    // ── Notificaciones ───────────────────────────────────────
    const notificationItems = useMemo(() => {
        return citasPendientesNotif.slice(0, 10).map(n => ({
            key: n.id_notif,
            title: getNotificationTitle(n.tipo),
            description: n.mensaje || [
                n.paciente || n.nombre_paciente || 'Paciente sin registrar',
                n.fecha_hora ? new Date(n.fecha_hora).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha',
                n.especialidad,
                n.doctor || n.nombre_doctor ? `Dr. ${n.doctor || n.nombre_doctor}` : '',
            ].filter(Boolean).join(' · '),
            time: n.fecha_programada ? new Date(n.fecha_programada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '',
            actionLabel: n.leida ? 'Leída · Ir a Citas' : 'No leída · Ir a Citas',
            read: n.leida,
            onClick: () => abrirNotificacionCita(n),
            onMarkRead: () => marcarNotificacionCitaVista(n.id_notif),
            onDelete: () => borrarNotificacionCita(n.id_notif),
        }))
    }, [abrirNotificacionCita, borrarNotificacionCita, citasPendientesNotif, marcarNotificacionCitaVista])

    const unreadNotificationCount = useMemo(
        () => citasPendientesNotif.filter(n => !n.leida).length,
        [citasPendientesNotif]
    )

    // ── Ayuda rápida ─────────────────────────────────────────
    const helpItems = useMemo(() => [
        { title: 'Gestionar citas', description: 'Ver, confirmar o cancelar citas del día', actionLabel: '→ Ir al módulo', onClick: () => setTab('citas') },
        { title: 'Gestionar doctores', description: 'Editar información y disponibilidad', actionLabel: '→ Ir al módulo', onClick: () => setTab('doctores') },
        { title: 'Lista de espera', description: 'Atender o retirar pacientes en espera', actionLabel: '→ Ir al módulo', onClick: () => setTab('espera') },
        { title: 'Crear usuario', description: 'Agregar pacientes, doctores o recepcionistas', actionLabel: '→ Ir al módulo', onClick: () => setTab('configuracion') },
        { title: 'Ver reportes', description: 'Estadísticas y análisis del sistema', actionLabel: '→ Ir al módulo', onClick: () => setTab('reportes') },
    ], [])

    // ── Accesos rápidos ──────────────────────────────────────
    const appItems = useMemo(() => [
        { title: 'Dashboard', description: 'Resumen general del sistema', onClick: () => setTab('inicio') },
        { title: 'Gestión de Citas', description: `${citas.length} citas registradas`, onClick: () => setTab('citas') },
        { title: 'Doctores', description: `${doctores.length} doctores activos`, onClick: () => setTab('doctores') },
        { title: 'Pacientes', description: `${pacientes.length} pacientes registrados`, onClick: () => setTab('pacientes') },
        { title: 'Especialidades', description: `${especialidades.length} especialidades`, onClick: () => setTab('especialidades') },
        { title: 'Lista de Espera', description: `${listaEspera.length} en espera`, onClick: () => setTab('espera') },
        { title: 'Reportes', description: 'Análisis y estadísticas', onClick: () => setTab('reportes') },
        { title: 'Configuración', description: 'Usuarios y ajustes del sistema', onClick: () => setTab('configuracion') },
    ], [citas, doctores, pacientes, especialidades, listaEspera])

    // ── Sidebar ──────────────────────────────────────────────
    const sidebarItems = [
        { path: 'inicio',         icon: 'dashboard',       label: 'Dashboard' },
        { path: 'citas',          icon: 'calendar_month',  label: 'Gestión de Citas' },
        { path: 'doctores',       icon: 'stethoscope',     label: 'Doctores' },
        { path: 'pacientes',      icon: 'group',           label: 'Pacientes' },
        { path: 'especialidades', icon: 'local_hospital',  label: 'Especialidades' },
        { path: 'espera',         icon: 'hourglass_empty', label: 'Lista de Espera' },
        { path: 'reportes',       icon: 'bar_chart',       label: 'Reportes' },
        { path: 'soporte', icon: 'support_agent', label: 'Soporte' },
        { path: 'configuracion',  icon: 'settings',        label: 'Configuración' },
    ]

    const sidebar = (
        <PortalSidebar
            active={tab}
            items={sidebarItems}
            onSelect={setTab}
            ctaLabel="Actualizar datos"
            ctaIcon="refresh"
            onCta={fetchAll}
        />
    )

    if (loading) return (
        <Layout sidebar={sidebar} title="Portal Administrador">
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#12b8a3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#52615f]">Cargando datos...</p>
                </div>
            </div>
        </Layout>
    )

    return (
        <Layout
            sidebar={sidebar}
            title="Portal Administrador"
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar pacientes, doctores, citas..."
            notificationItems={search.trim() ? searchResults : notificationItems}
            notificationCount={search.trim() ? 0 : unreadNotificationCount}
            helpItems={helpItems}
            appItems={appItems}
        >
            <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
                {message && (
                    <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${
                        message.type === 'error'
                            ? 'border-[#ffb4ab] bg-[#fff0ef] text-[#93000a]'
                            : 'border-[#b7e8df] bg-[#e5fbf7] text-[#006b5d]'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {message.type === 'error' ? 'error' : 'check_circle'}
                        </span>
                        {message.text}
                    </div>
                )}
                {tab === 'inicio' && (
                    <AdminInicio
                        stats={stats} listaEspera={listaEspera}
                        doctores={doctores} especialidades={especialidades}
                        onRefresh={fetchAll}
                    />
                )}
                {tab === 'citas' && (
                    <AdminCitas
                        citas={citas} doctores={doctores} especialidades={especialidades}
                        citaNotificada={citaNotificada}
                        onAccion={accionCita}
                        actionLoading={actionLoading}
                        onCrearHorario={registrarHorarioDisponible}
                        onRefresh={() => Promise.all([fetchStats(), fetchCitas()])}
                    />
                )}
                {tab === 'doctores' && (
                    <AdminDoctores
                        doctores={doctores}
                        especialidades={especialidades}
                        onRefresh={fetchDoctores}
                        onUpdateDoctor={(id, doc) =>
                            setDoctores(prev => prev.map(d => d.id_usuario === id ? doc : d))
                        }
                    />
                )}
                {tab === 'soporte' && <AdminSoporte />}
                {tab === 'pacientes' && (
                    <AdminPacientes
                        pacientes={pacientes}
                        onRefresh={fetchPacientes}
                        onUpdatePaciente={(id, pac) =>
                            setPacientes(prev => prev.map(p => p.id_usuario === id ? pac : p))
                        }
                    />
                )}
                {tab === 'especialidades' && (
                    <AdminEspecialidades
                        especialidades={especialidades}
                        doctores={doctores}
                        onRefresh={() => Promise.all([fetchEspecialidades(), fetchDoctores()])}
                    />
                )}
                {tab === 'espera' && (
                    <AdminEspera
                        listaEspera={listaEspera}
                        onRefresh={fetchListaEspera}
                    />
                )}
                {tab === 'reportes' && (
                    <AdminReportes
                        stats={stats}
                        especialidades={especialidades}
                        doctores={doctores}
                    />
                )}
                {tab === 'configuracion' && (
                    <AdminConfiguracion />
                )}
            </div>
        </Layout>
    )
}
