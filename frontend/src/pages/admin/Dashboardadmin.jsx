import { useCallback, useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import PortalSidebar from '../../components/PortalSidebar'
import {
    getStatsCitas, getTodasCitas, getDoctores,
    getPacientes, getListaEspera, getEspecialidades,
    confirmarCita, cancelarCita, completarCita,
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
    const [loading, setLoading] = useState(true)

    // ── Fetches individuales por módulo ──────────────────────
    const fetchStats = useCallback(async () => { try { const r = await getStatsCitas(); setStats(r.data) } catch (e) { console.warn('fetchStats:', e.message) } }, [])
    const fetchCitas = useCallback(async () => { try { const r = await getTodasCitas(); setCitas(r.data) } catch (e) { console.warn('fetchCitas:', e.message) } }, [])
    const fetchDoctores = useCallback(async () => { try { const r = await getDoctores(); setDoctores(r.data) } catch (e) { console.warn('fetchDoctores:', e.message) } }, [])
    const fetchPacientes = useCallback(async () => { try { const r = await getPacientes(); setPacientes(r.data) } catch (e) { console.warn('fetchPacientes:', e.message) } }, [])
    const fetchEspecialidades = useCallback(async () => { try { const r = await getEspecialidades(); setEspecialidades(r.data) } catch (e) { console.warn('fetchEspecialidades:', e.message) } }, [])
    const fetchListaEspera = useCallback(async () => { try { const r = await getListaEspera(); setListaEspera(r.data) } catch (e) { console.warn('fetchListaEspera:', e.message) } }, [])

    // ── Carga inicial con reintento automático ───────────────
    const fetchAll = useCallback(async () => {
        setLoading(true)

        const cargar = async (fn, setter) => {
            let intentos = 0
            while (intentos < 5) {
                try {
                    const r = await fn()
                    setter(r.data)
                    return
                } catch (e) {
                    intentos++
                    if (intentos < 5) await new Promise(res => setTimeout(res, 1000))
                }
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

        setLoading(false)
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    // ── Auto-refresh cada 60 segundos ────────────────────────
    useEffect(() => {
        // Esperar 500ms para que el backend esté completamente listo
        const timer = setTimeout(() => { fetchAll() }, 500)
        return () => clearTimeout(timer)
    }, [fetchAll])

    // ── Acciones de citas ────────────────────────────────────
    const accionCita = async (id, accion) => {
        if (accion === 'confirmar') await confirmarCita(id)
        else if (accion === 'cancelar') await cancelarCita(id)
        else if (accion === 'completar') await completarCita(id)
        await Promise.all([fetchStats(), fetchCitas()])
    }

    const sidebarItems = [
        { path: 'inicio', icon: 'dashboard', label: 'Dashboard' },
        { path: 'citas', icon: 'calendar_month', label: 'Gestión de Citas' },
        { path: 'doctores', icon: 'stethoscope', label: 'Doctores' },
        { path: 'pacientes', icon: 'group', label: 'Pacientes' },
        { path: 'especialidades', icon: 'local_hospital', label: 'Especialidades' },
        { path: 'espera', icon: 'hourglass_empty', label: 'Lista de Espera' },
        { path: 'reportes', icon: 'bar_chart', label: 'Reportes' },
        { path: 'configuracion', icon: 'settings', label: 'Configuración' },
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
        <Layout sidebar={sidebar} title="Portal Administrador">
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
                        citas={citas} especialidades={especialidades}
                        onAccion={accionCita}
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