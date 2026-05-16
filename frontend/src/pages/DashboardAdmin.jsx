/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000/api' })
API.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
  return config
})

export default function DashboardAdmin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('inicio')
  const [stats, setStats] = useState({})
  const [citas, setCitas] = useState([])
  const [citasFiltradas, setCitasFiltradas] = useState([])
  const [doctores, setDoctores] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [listaEspera, setListaEspera] = useState([])
  const [filtros, setFiltros] = useState({ estado: '', especialidad: '', doctor: '', fecha: '' })
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsR, citasR, doctoresR, pacientesR, espR, espR2] = await Promise.all([
        API.get('/citas/stats'),
        API.get('/citas/todas'),
        API.get('/usuarios/doctores'),
        API.get('/usuarios/pacientes'),
        API.get('/usuarios/lista-espera'),
        API.get('/usuarios/especialidades'),
      ])
      setStats(statsR.data)
      setCitas(citasR.data)
      setCitasFiltradas(citasR.data)
      setDoctores(doctoresR.data)
      setPacientes(pacientesR.data)
      setListaEspera(espR.data)
      setEspecialidades(espR2.data)
    } catch(e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros)
    let resultado = [...citas]
    if (nuevosFiltros.estado) resultado = resultado.filter(c => c.estado === nuevosFiltros.estado)
    if (nuevosFiltros.especialidad) resultado = resultado.filter(c => c.especialidad === nuevosFiltros.especialidad)
    if (nuevosFiltros.doctor) resultado = resultado.filter(c => c.doctor?.toLowerCase().includes(nuevosFiltros.doctor.toLowerCase()))
    if (nuevosFiltros.fecha) resultado = resultado.filter(c => c.fecha_hora?.startsWith(nuevosFiltros.fecha))
    setCitasFiltradas(resultado)
  }

  const accionCita = async (id, accion) => {
    await API.put(`/citas/${id}/${accion}`)
    fetchAll()
  }

  const estadoColor = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700',
    completada: 'bg-blue-100 text-blue-700',
    reprogramada: 'bg-purple-100 text-purple-700'
  }

  const sidebarItems = [
    { path: 'inicio',        icon: '🏠', label: 'Dashboard' },
    { path: 'citas',         icon: '📅', label: 'Gestión de Citas' },
    { path: 'doctores',      icon: '👨‍⚕️', label: 'Doctores' },
    { path: 'pacientes',     icon: '👥', label: 'Pacientes' },
    { path: 'especialidades',icon: '🏥', label: 'Especialidades' },
    { path: 'espera',        icon: '⏳', label: 'Lista de Espera' },
    { path: 'reportes',      icon: '📊', label: 'Reportes' },
  ]

  const Sidebar = (
    <aside style={{background: 'linear-gradient(180deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)'}}
      className="w-64 flex flex-col fixed left-0 top-14 bottom-12 z-40 overflow-y-auto shadow-xl">
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/30 text-white flex items-center justify-center text-sm font-bold">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white truncate w-36">{user?.nombre}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">administrador</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map(item => (
          <button key={item.path} onClick={() => setTab(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === item.path ? 'bg-white text-cyan-600 shadow-md' : 'text-white hover:bg-white/20'
            }`}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/20">
        <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-white/20 transition-all">
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )

  if (loading) return (
    <Layout sidebar={Sidebar}>
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout sidebar={Sidebar}>
      <div className="p-8">

        {/* ── DASHBOARD ── */}
        {tab === 'inicio' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard General 🛡️</h2>
                <p className="text-gray-500 text-sm mt-1">Resumen completo del sistema MedCare</p>
              </div>
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                🔄 Actualizar
              </button>
            </div>

            {/* Stats principales */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: '📅', label: 'Citas hoy', value: stats.citas_hoy ?? 0, color: 'text-cyan-600', bg: 'bg-cyan-50', badge: 'Hoy' },
                { icon: '✅', label: 'Confirmadas hoy', value: stats.confirmadas_hoy ?? 0, color: 'text-green-600', bg: 'bg-green-50', badge: 'Activas' },
                { icon: '❌', label: 'Canceladas hoy', value: stats.canceladas_hoy ?? 0, color: 'text-red-500', bg: 'bg-red-50', badge: 'Hoy' },
                { icon: '⏳', label: 'Pendientes', value: stats.pendientes ?? 0, color: 'text-yellow-500', bg: 'bg-yellow-50', badge: 'Total' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl`}>{s.icon}</div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{s.badge}</span>
                  </div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: '👥', label: 'Pacientes', value: stats.total_pacientes ?? 0, color: 'text-purple-600' },
                { icon: '👨‍⚕️', label: 'Doctores activos', value: stats.doctores_activos ?? 0, color: 'text-green-600' },
                { icon: '🏥', label: 'Especialidades', value: stats.total_especialidades ?? 0, color: 'text-blue-600' },
                { icon: '🕐', label: 'Horarios libres', value: stats.horarios_libres ?? 0, color: 'text-orange-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                  <p className="text-3xl mb-1">{s.icon}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Gráfica barras */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-5">📊 Citas por estado</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Pendientes', count: stats.pendientes ?? 0, color: 'bg-yellow-400', total: stats.total_citas },
                    { label: 'Confirmadas', count: stats.confirmadas_hoy ?? 0, color: 'bg-green-400', total: stats.total_citas },
                    { label: 'Canceladas', count: stats.canceladas_hoy ?? 0, color: 'bg-red-400', total: stats.total_citas },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-20">{item.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className={`${item.color} h-3 rounded-full transition-all`}
                          style={{width: item.total ? `${Math.min((item.count / item.total) * 100, 100)}%` : '0%'}} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-5">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-5">⏳ Lista de espera</h3>
                {listaEspera.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-4xl">✅</p>
                    <p className="text-gray-400 text-sm mt-2">No hay pacientes en espera</p>
                  </div>
                ) : listaEspera.slice(0, 4).map(e => (
                  <div key={e.id_espera} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                      {e.paciente?.usuario?.nombre?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{e.paciente?.usuario?.nombre} {e.paciente?.usuario?.apellido}</p>
                      <p className="text-xs text-gray-400">{e.especialidad?.nombre}</p>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">En espera</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">Sistema MedCare operativo ✅</h3>
                  <p className="text-cyan-100 text-sm">Python FastAPI + Supabase PostgreSQL + React Vite</p>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-white text-sm font-medium">En línea</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── GESTIÓN DE CITAS ── */}
        {tab === 'citas' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Citas 📅</h2>
                <p className="text-gray-500 text-sm mt-1">{citasFiltradas.length} citas encontradas</p>
              </div>
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                🔄 Actualizar
              </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">🔍 Filtros</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Estado</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={filtros.estado} onChange={e => aplicarFiltros({...filtros, estado: e.target.value})}>
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Especialidad</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={filtros.especialidad} onChange={e => aplicarFiltros({...filtros, especialidad: e.target.value})}>
                    <option value="">Todas</option>
                    {especialidades.map(e => <option key={e.id_especialidad} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Buscar doctor</label>
                  <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Nombre del doctor..."
                    value={filtros.doctor} onChange={e => aplicarFiltros({...filtros, doctor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                  <input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={filtros.fecha} onChange={e => aplicarFiltros({...filtros, fecha: e.target.value})} />
                </div>
              </div>
              <button onClick={() => aplicarFiltros({ estado: '', especialidad: '', doctor: '', fecha: '' })}
                className="mt-3 text-xs text-cyan-500 hover:underline">
                Limpiar filtros
              </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'Paciente', 'Doctor', 'Especialidad', 'Fecha', 'Tipo', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No hay citas con esos filtros</td></tr>
                  ) : citasFiltradas.map((c, i) => (
                    <tr key={c.id_cita} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-xs font-bold">
                            {c.paciente?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{c.paciente}</p>
                            <p className="text-xs text-gray-400">{c.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">Dr. {c.doctor}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.especialidad}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{new Date(c.fecha_hora).toLocaleString('es-PE')}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.tipo_atencion}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoColor[c.estado]}`}>{c.estado}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {c.estado === 'pendiente' && (
                            <button onClick={() => accionCita(c.id_cita, 'confirmar')}
                              className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                              ✅
                            </button>
                          )}
                          {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                            <button onClick={() => accionCita(c.id_cita, 'cancelar')}
                              className="text-xs px-2 py-1 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition">
                              ❌
                            </button>
                          )}
                          {c.estado === 'confirmada' && (
                            <button onClick={() => accionCita(c.id_cita, 'completar')}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                              🏁
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOCTORES ── */}
        {tab === 'doctores' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Gestión de Doctores 👨‍⚕️</h2>
            <p className="text-gray-500 text-sm mb-6">{doctores.length} doctores registrados</p>
            <div className="grid grid-cols-2 gap-4">
              {doctores.map(d => (
                <div key={d.id_usuario} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {d.nombre?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800">Dr. {d.nombre} {d.apellido}</p>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${d.doctor?.disponible ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                          <span className={`text-xs ${d.doctor?.disponible ? 'text-green-600' : 'text-gray-400'}`}>
                            {d.doctor?.disponible ? 'Disponible' : 'Ocupado'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-cyan-600 font-medium">{d.doctor?.especialidad?.nombre}</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-gray-500">📋 CMP: {d.doctor?.cmp}</span>
                        <span className="text-xs text-gray-500">🕐 {d.doctor?.turno}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">✉️ {d.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PACIENTES ── */}
        {tab === 'pacientes' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Gestión de Pacientes 👥</h2>
            <p className="text-gray-500 text-sm mb-6">{pacientes.length} pacientes registrados</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Paciente', 'DNI', 'Edad', 'Género', 'Seguro', 'Teléfono', 'Estado'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map(p => {
                    const edad = p.paciente?.fecha_nacimiento
                      ? Math.floor((new Date() - new Date(p.paciente.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
                      : '—'
                    return (
                      <tr key={p.id_usuario} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
                              {p.nombre?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{p.nombre} {p.apellido}</p>
                              <p className="text-xs text-gray-400">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.paciente?.dni}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{edad} años</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.paciente?.genero}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.paciente?.seguro_medico || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.telefono || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ESPECIALIDADES ── */}
        {tab === 'especialidades' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Especialidades 🏥</h2>
            <p className="text-gray-500 text-sm mb-6">{especialidades.length} especialidades disponibles</p>
            <div className="grid grid-cols-2 gap-4">
              {especialidades.map(e => {
                const docs = doctores.filter(d => d.doctor?.especialidad?.nombre === e.nombre).length
                return (
                  <div key={e.id_especialidad} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                        {e.id_especialidad}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{e.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.descripcion}</p>
                        <p className="text-xs text-cyan-600 mt-1">👨‍⚕️ {docs} doctor{docs !== 1 ? 'es' : ''}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── LISTA DE ESPERA ── */}
        {tab === 'espera' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Lista de Espera ⏳</h2>
            <p className="text-gray-500 text-sm mb-6">{listaEspera.length} pacientes en espera</p>
            {listaEspera.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <span className="text-5xl">✅</span>
                <p className="text-gray-500 mt-4">No hay pacientes en lista de espera.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listaEspera.map((e, i) => (
                  <div key={e.id_espera} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{e.paciente?.usuario?.nombre} {e.paciente?.usuario?.apellido}</p>
                      <p className="text-sm text-gray-500">🏥 {e.especialidad?.nombre}</p>
                      <p className="text-xs text-gray-400">📅 {new Date(e.fecha_solicitud).toLocaleDateString('es-PE')}</p>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">En espera</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REPORTES ── */}
        {tab === 'reportes' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Reportes y Estadísticas 📊</h2>
            <p className="text-gray-500 text-sm mb-6">Análisis general del sistema</p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-5">📊 Distribución de citas</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Pendientes', count: stats.pendientes ?? 0, color: 'bg-yellow-400', emoji: '⏳' },
                    { label: 'Confirmadas', count: stats.confirmadas_hoy ?? 0, color: 'bg-green-400', emoji: '✅' },
                    { label: 'Canceladas', count: stats.canceladas_hoy ?? 0, color: 'bg-red-400', emoji: '❌' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm">{item.emoji}</span>
                      <span className="text-xs text-gray-600 w-20">{item.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className={`${item.color} h-3 rounded-full`}
                          style={{width: stats.total_citas ? `${Math.min((item.count / stats.total_citas) * 100, 100)}%` : '0%'}} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-6">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-5">🏥 Doctores por especialidad</h3>
                <div className="space-y-3">
                  {especialidades.map(e => {
                    const docs = doctores.filter(d => d.doctor?.especialidad?.nombre === e.nombre).length
                    return (
                      <div key={e.id_especialidad} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-28 truncate">{e.nombre}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div className="bg-cyan-400 h-3 rounded-full"
                            style={{width: doctores.length ? `${(docs / doctores.length) * 100}%` : '0%'}} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-4">{docs}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '📅', label: 'Total citas sistema', value: stats.total_citas ?? 0, color: 'text-cyan-600' },
                { icon: '👥', label: 'Total pacientes', value: stats.total_pacientes ?? 0, color: 'text-purple-600' },
                { icon: '🕐', label: 'Horarios disponibles', value: stats.horarios_libres ?? 0, color: 'text-orange-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-3xl mb-2">{s.icon}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
