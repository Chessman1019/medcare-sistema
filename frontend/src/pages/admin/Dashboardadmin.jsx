import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import {
    getStatsCitas, getTodasCitas, getDoctores,
    getPacientes, getListaEspera, getEspecialidades,
    confirmarCita, cancelarCita, completarCita,
    getNotificacionesAdmin, marcarNotificacionEnviada,
    crearHorarioDisponible,
} from '../../services/api'
import AdminInicio from './AdminInicio'
import AdminCitas from './AdminCitas'
import AdminDoctores from './AdminDoctores'
import AdminPacientes from './AdminPacientes'
import AdminEspecialidades from './AdminEspecialidades'
import AdminEspera from './AdminEspera'
import AdminReportes from './AdminReportes'
import AdminConfiguracion from './AdminConfiguracion'

export default function DashboardAdmin() {
    const [tab, setTab] = useState('inicio')
    const [stats, setStats] = useState({})
    const [citas, setCitas] = useState([])
    const [doctores, setDoctores] = useState([])
    const [pacientes, setPacientes] = useState([])
    const [especialidades, setEspecialidades] = useState([])
    const [listaEspera, setListaEspera] = useState([])
    const [notificaciones, setNotificaciones] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // ── Fetches individuales ─────────────────────────────────
    const fetchStats = useCallback(async () => { try { const r = await getStatsCitas(); setStats(r.data) } catch (e) { console.warn('fetchStats:', e.message) } }, [])
    const fetchCitas = useCallback(async () => { try { const r = await getTodasCitas(); setCitas(r.data) } catch (e) { console.warn('fetchCitas:', e.message) } }, [])
    const fetchDoctores = useCallback(async () => { try { const r = await getDoctores(); setDoctores(r.data) } catch (e) { console.warn('fetchDoctores:', e.message) } }, [])
    const fetchPacientes = useCallback(async () => { try { const r = await getPacientes(); setPacientes(r.data) } catch (e) { console.warn('fetchPacientes:', e.message) } }, [])
    const fetchEspecialidades = useCallback(async () => { try { const r = await getEspecialidades(); setEspecialidades(r.data) } catch (e) { console.warn('fetchEspecialidades:', e.message) } }, [])
    const fetchListaEspera = useCallback(async () => { try { const r = await getListaEspera(); setListaEspera(r.data) } catch (e) { console.warn('fetchListaEspera:', e.message) } }, [])
    const fetchNotificaciones = useCallback(async () => { try { const r = await getNotificacionesAdmin(); setNotificaciones(r.data || []) } catch (e) { console.warn('fetchNotifs:', e.message) } }, [])

    // ── Carga inicial con reintento ──────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true)
        const cargar = async (fn, setter) => {
            let intentos = 0
            while (intentos < 5) {
                try { const r = await fn(); setter(r.data); return }
                catch (e) { intentos++; if (intentos < 5) await new Promise(res => setTimeout(res, 1000)) }
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
        fetchNotificaciones()
        setLoading(false)
    }, [fetchNotificaciones])

    useEffect(() => { fetchAll() }, [fetchAll])

    // ── Auto-refresh cada 60 segundos ────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats()
            fetchCitas()
            fetchNotificaciones()
        }, 60000)
        return () => clearInterval(interval)
    }, [fetchStats, fetchCitas, fetchNotificaciones])

    // ── Acciones de citas ────────────────────────────────────
    const accionCita = async (id, accion) => {
        if (accion === 'confirmar') await confirmarCita(id)
        else if (accion === 'cancelar') await cancelarCita(id)
        else if (accion === 'completar') await completarCita(id)
        await Promise.all([fetchStats(), fetchCitas()])
    }

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
        if (!notificaciones.length) return []
        return notificaciones.slice(0, 10).map(n => ({
            title: n.tipo_notif_enum || n.tipo || 'Notificación',
            description: n.mensaje || '',
            time: n.fecha_envio ? new Date(n.fecha_envio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '',
        }))
    }, [notificaciones])

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
            helpItems={helpItems}
            appItems={appItems}
        >
            <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
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
                        onAccion={accionCita}
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
