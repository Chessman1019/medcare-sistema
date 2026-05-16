import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getEspecialidades, getDoctoresPorEspecialidad, getHorarios, crearCita, getCitasPaciente, cancelarCita, reprogramarCita } from '../services/api'

export default function DashboardPaciente() {
  const { user } = useAuth()
  const [especialidades, setEspecialidades] = useState([])
  const [doctores, setDoctores] = useState([])
  const [horarios, setHorarios] = useState([])
  const [citas, setCitas] = useState([])
  const [form, setForm] = useState({ id_especialidad: '', id_doctor: '', id_horario: '', motivo: '' })
  const [tab, setTab] = useState('inicio')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [reprogramacion, setReprogramacion] = useState(null)

  useEffect(() => {
    getEspecialidades().then(r => setEspecialidades(r.data))
    if (user?.id) getCitasPaciente(user.id).then(r => setCitas(r.data))
  }, [user?.id])

  const onEspecialidad = async (e) => {
    const id = e.target.value
    setForm({...form, id_especialidad: id, id_doctor: '', id_horario: ''})
    const res = await getDoctoresPorEspecialidad(id)
    setDoctores(res.data)
    setHorarios([])
  }

  const onDoctor = async (e) => {
    const id = e.target.value
    setForm({...form, id_doctor: id, id_horario: ''})
    const res = await getHorarios(id)
    setHorarios(res.data)
  }

  const handleAgendar = async (e) => {
    e.preventDefault()
    setLoading(true)
    const horario = horarios.find(h => h.id_horario == form.id_horario)
    await crearCita({
      id_doctor: parseInt(form.id_doctor),
      id_horario: parseInt(form.id_horario),
      fecha_hora: `${horario.fecha}T${horario.hora_inicio}`,
      motivo: form.motivo,
      tipo_atencion: 'web'
    }, user.id)
    setSuccess('¡Cita agendada exitosamente!')
    const res = await getCitasPaciente(user.id)
    setCitas(res.data)
    setForm({ id_especialidad: '', id_doctor: '', id_horario: '', motivo: '' })
    setLoading(false)
    setTab('citas')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleCancelar = async (id) => {
    if (confirm('¿Cancelar esta cita?')) {
      await cancelarCita(id)
      const res = await getCitasPaciente(user.id)
      setCitas(res.data)
    }
  }

  const abrirReprogramacion = async (cita) => {
    const res = await getHorarios(cita.id_doctor)
    setReprogramacion({ cita, id_horario: '', horarios: res.data })
  }

  const guardarReprogramacion = async (e) => {
    e.preventDefault()
    const horario = reprogramacion.horarios.find(h => String(h.id_horario) === String(reprogramacion.id_horario))
    if (!horario) return

    await reprogramarCita(reprogramacion.cita.id_cita, {
      id_horario: parseInt(reprogramacion.id_horario),
      fecha_hora: `${horario.fecha}T${horario.hora_inicio}`
    })
    const res = await getCitasPaciente(user.id)
    setCitas(res.data)
    setReprogramacion(null)
    setSuccess('Cita reprogramada correctamente')
    setTimeout(() => setSuccess(''), 3000)
  }

  const estadoColor = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700',
    completada: 'bg-blue-100 text-blue-700',
    reprogramada: 'bg-purple-100 text-purple-700'
  }

  const sidebarItems = [
    { path: 'inicio', icon: '🏠', label: 'Inicio' },
    { path: 'agendar', icon: '📅', label: 'Agendar Cita' },
    { path: 'citas', icon: '📋', label: 'Mis Citas' },
  ]

  const selectClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm bg-white"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

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
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">paciente</span>
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

  const citasActivas = citas.filter(c => !['cancelada', 'completada'].includes(c.estado))
  const proximaCita = [...citasActivas]
    .filter(c => new Date(c.fecha_hora) >= new Date())
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]

  return (
    <Layout sidebar={Sidebar}>
      <div className="p-8">
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">✅ {success}</div>
        )}

        {tab === 'inicio' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Bienvenido, {user?.nombre?.split(' ')[0]} 👋</h2>
            <p className="text-gray-500 text-sm mb-8">Gestiona tus citas médicas desde aquí</p>
            <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Próxima cita</h3>
                  {proximaCita ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-lg font-bold text-cyan-700">Dr. {proximaCita.doctor}</p>
                      <p className="text-sm text-gray-500">{proximaCita.especialidad} · {new Date(proximaCita.fecha_hora).toLocaleString('es-PE')}</p>
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium ${estadoColor[proximaCita.estado]}`}>
                        {proximaCita.estado}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">No tienes citas activas próximas.</p>
                  )}
                </div>
                <button onClick={() => setTab('agendar')}
                  className="bg-cyan-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-cyan-700 transition">
                  Nueva cita
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">📋</span>
                  <span className="text-xs bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full">Total</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{citas.length}</p>
                <p className="text-sm text-gray-500 mt-1">Citas registradas</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">⏳</span>
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">Pendiente</span>
                </div>
                <p className="text-3xl font-bold text-yellow-500">{citas.filter(c => c.estado === 'pendiente').length}</p>
                <p className="text-sm text-gray-500 mt-1">Por confirmar</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">✅</span>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Activas</span>
                </div>
                <p className="text-3xl font-bold text-green-500">{citas.filter(c => c.estado === 'confirmada').length}</p>
                <p className="text-sm text-gray-500 mt-1">Confirmadas</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-white mb-6">
              <h3 className="text-lg font-bold mb-1">¿Necesitas una cita médica?</h3>
              <p className="text-cyan-100 text-sm mb-4">Agenda tu cita en minutos con nuestros especialistas</p>
              <button onClick={() => setTab('agendar')}
                className="bg-white text-cyan-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-cyan-50 transition">
                Agendar ahora →
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Últimas citas</h3>
              {citas.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No tienes citas aún</p>
              ) : citas.slice(0, 3).map(c => (
                <div key={c.id_cita} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-sm font-bold">
                      {c.doctor?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Dr. {c.doctor}</p>
                      <p className="text-xs text-gray-400">{c.especialidad} · {new Date(c.fecha_hora).toLocaleDateString('es-PE')}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoColor[c.estado]}`}>{c.estado}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'agendar' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Agendar Cita 📅</h2>
            <p className="text-gray-500 text-sm mb-8">Selecciona especialidad, doctor y horario disponible</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-xl">
              <form onSubmit={handleAgendar} className="space-y-5">
                <div>
                  <label className={labelClass}>Especialidad</label>
                  <select className={selectClass} onChange={onEspecialidad} value={form.id_especialidad} required>
                    <option value="">Selecciona una especialidad</option>
                    {especialidades.map(e => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Doctor</label>
                  <select className={selectClass} onChange={onDoctor} value={form.id_doctor} required disabled={!doctores.length}>
                    <option value="">Selecciona un doctor</option>
                    {doctores.map(d => <option key={d.id_usuario} value={d.id_usuario}>Dr. {d.usuario?.nombre} {d.usuario?.apellido}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Horario disponible</label>
                  <select className={selectClass} onChange={e => setForm({...form, id_horario: e.target.value})} value={form.id_horario} required disabled={!horarios.length}>
                    <option value="">Selecciona un horario</option>
                    {horarios.map(h => <option key={h.id_horario} value={h.id_horario}>📅 {h.fecha} · {h.hora_inicio} - {h.hora_fin}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Motivo de la consulta</label>
                  <textarea className={selectClass} placeholder="Describe brevemente el motivo..." rows={3}
                    value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} />
                </div>
                <button type="submit" disabled={loading}
                  style={{background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)'}}
                  className="w-full py-3 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-60">
                  {loading ? '⏳ Agendando...' : '📅 Confirmar Cita'}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'citas' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Mis Citas 📋</h2>
            <p className="text-gray-500 text-sm mb-8">Historial y estado de tus citas médicas</p>
            {reprogramacion && (
              <form onSubmit={guardarReprogramacion} className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6">
                <h3 className="text-base font-semibold text-purple-900 mb-1">Reprogramar cita</h3>
                <p className="text-sm text-purple-700 mb-4">Selecciona un nuevo horario con el mismo doctor.</p>
                <div className="flex gap-3">
                  <select className={selectClass} required value={reprogramacion.id_horario}
                    onChange={e => setReprogramacion({...reprogramacion, id_horario: e.target.value})}>
                    <option value="">Nuevo horario</option>
                    {reprogramacion.horarios.map(h => (
                      <option key={h.id_horario} value={h.id_horario}>{h.fecha} - {h.hora_inicio} a {h.hora_fin}</option>
                    ))}
                  </select>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold">Guardar</button>
                  <button type="button" onClick={() => setReprogramacion(null)}
                    className="px-5 py-2 rounded-xl border border-purple-200 text-purple-700 text-sm font-semibold">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            {citas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <span className="text-5xl">📭</span>
                <p className="text-gray-500 mt-4 mb-4">No tienes citas registradas aún.</p>
                <button onClick={() => setTab('agendar')} className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold"
                  style={{background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)'}}>
                  Agendar primera cita
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {citas.map(c => (
                  <div key={c.id_cita} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                        {c.doctor?.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">Dr. {c.doctor}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado]}`}>{c.estado}</span>
                        </div>
                        <p className="text-sm text-gray-500">🏥 {c.especialidad}</p>
                        <p className="text-sm text-gray-500">📅 {new Date(c.fecha_hora).toLocaleString('es-PE')}</p>
                        {c.motivo && <p className="text-sm text-gray-400">💬 {c.motivo}</p>}
                      </div>
                    </div>
                    {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                      <div className="flex gap-2">
                        <button onClick={() => abrirReprogramacion(c)}
                          className="text-sm px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition">
                          Reprogramar
                        </button>
                        <button onClick={() => handleCancelar(c.id_cita)}
                          className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
