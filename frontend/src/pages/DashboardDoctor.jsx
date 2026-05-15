import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getCitasDoctor } from '../services/api'

export default function DashboardDoctor() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [tab, setTab] = useState('inicio')

  useEffect(() => {
    if (user?.id) getCitasDoctor(user.id).then(r => setCitas(r.data))
  }, [])

  const estadoColor = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700',
    completada: 'bg-blue-100 text-blue-700'
  }

  const sidebarItems = [
    { path: 'inicio', icon: '🏠', label: 'Inicio' },
    { path: 'citas', icon: '📋', label: 'Mis Citas' },
    { path: 'pacientes', icon: '👥', label: 'Pacientes' },
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
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">doctor</span>
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

  return (
    <Layout sidebar={Sidebar}>
      <div className="p-8">
        {tab === 'inicio' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Bienvenido, Dr. {user?.nombre?.split(' ')[0]} 👨‍⚕️</h2>
            <p className="text-gray-500 text-sm mb-8">Resumen de tu actividad médica</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <span className="text-3xl">📋</span>
                <p className="text-3xl font-bold text-gray-800 mt-2">{citas.length}</p>
                <p className="text-sm text-gray-500">Total citas</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <span className="text-3xl">⏳</span>
                <p className="text-3xl font-bold text-yellow-500 mt-2">{citas.filter(c => c.estado === 'pendiente').length}</p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <span className="text-3xl">👥</span>
                <p className="text-3xl font-bold text-cyan-500 mt-2">{[...new Set(citas.map(c => c.id_paciente))].length}</p>
                <p className="text-sm text-gray-500">Pacientes únicos</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-1">Próximas citas del día</h3>
              <p className="text-cyan-100 text-sm">Tienes {citas.filter(c => c.estado === 'pendiente').length} citas pendientes de atención</p>
            </div>
          </div>
        )}

        {tab === 'citas' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Mis Citas 📋</h2>
            <p className="text-gray-500 text-sm mb-8">Listado de citas asignadas</p>
            {citas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <span className="text-5xl">📭</span>
                <p className="text-gray-500 mt-4">No tienes citas asignadas aún.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {citas.map(c => (
                  <div key={c.id_cita} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                      {c.paciente?.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{c.paciente}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado]}`}>{c.estado}</span>
                      </div>
                      <p className="text-sm text-gray-500">🪪 DNI: {c.dni}</p>
                      <p className="text-sm text-gray-500">📅 {new Date(c.fecha_hora).toLocaleString('es-PE')}</p>
                      {c.motivo && <p className="text-sm text-gray-400">💬 {c.motivo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'pacientes' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Mis Pacientes 👥</h2>
            <p className="text-gray-500 text-sm mb-8">Pacientes que han tenido citas contigo</p>
            <div className="grid grid-cols-2 gap-4">
              {[...new Map(citas.map(c => [c.id_paciente, c])).values()].map(c => (
                <div key={c.id_paciente} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                    {c.paciente?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{c.paciente}</p>
                    <p className="text-sm text-gray-400">DNI: {c.dni}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}