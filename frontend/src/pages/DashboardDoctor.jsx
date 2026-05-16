/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getCitasDoctor, getHistorial, registrarAtencion } from '../services/api'

const estadoClass = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion: 'bg-sky-50 text-sky-700 border-sky-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
}

const emptyAtencion = {
  diagnostico: '',
  observaciones: '',
  tratamiento: '',
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

function isToday(value) {
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

export default function DashboardDoctor() {
  const { user, logoutUser } = useAuth()
  const [tab, setTab] = useState('agenda')
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [historial, setHistorial] = useState([])
  const [form, setForm] = useState(emptyAtencion)
  const [message, setMessage] = useState('')

  const fetchCitas = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await getCitasDoctor(user.id)
      setCitas(res.data)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCitas()
  }, [fetchCitas])

  const agendaDiaria = useMemo(() => {
    return citas
      .filter((cita) => isToday(cita.fecha_hora) && cita.estado !== 'cancelada')
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  }, [citas])

  const pacientesUnicos = useMemo(() => {
    return [...new Map(citas.map((cita) => [cita.id_paciente, cita])).values()]
  }, [citas])

  const abrirAtencion = async (cita) => {
    setSelected(cita)
    setForm(emptyAtencion)
    setTab('atencion')
    try {
      const res = await getHistorial(cita.id_paciente)
      setHistorial(res.data)
    } catch {
      setHistorial([])
    }
  }

  const guardarAtencion = async (event) => {
    event.preventDefault()
    await registrarAtencion(selected.id_cita, form)
    setMessage('Atencion registrada y cita cerrada correctamente.')
    setSelected(null)
    setForm(emptyAtencion)
    setHistorial([])
    await fetchCitas()
    setTab('agenda')
  }

  const sidebarItems = [
    { path: 'agenda', label: 'Agenda diaria' },
    { path: 'atencion', label: 'Atencion' },
    { path: 'historial', label: 'Historial' },
  ]

  const Sidebar = (
    <aside className="fixed left-0 top-14 bottom-12 z-40 flex w-64 flex-col overflow-y-auto bg-sky-700 text-white shadow-lg">
      <div className="border-b border-white/20 p-4">
        <p className="truncate text-sm font-semibold">Dr. {user?.nombre}</p>
        <span className="mt-1 inline-flex rounded-md bg-white/15 px-2 py-1 text-xs">doctor</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => setTab(item.path)}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
              tab === item.path ? 'bg-white text-sky-700' : 'text-white hover:bg-white/15'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-white/20 p-4">
        <button
          type="button"
          onClick={() => {
            logoutUser()
            window.location.href = '/login'
          }}
          className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-white/15"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  )

  if (loading) {
    return (
      <Layout sidebar={Sidebar}>
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando agenda...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebar={Sidebar}>
      <div className="space-y-6 p-8">
        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {tab === 'agenda' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Agenda diaria</h2>
              <p className="mt-1 text-sm text-slate-500">Lista cronologica de pacientes para atencion.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Citas hoy</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{agendaDiaria.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">En atencion</p>
                <p className="mt-2 text-3xl font-bold text-sky-700">{citas.filter(c => c.estado === 'en_atencion').length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pacientes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{pacientesUnicos.length}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">Pacientes del dia</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {agendaDiaria.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-500">No tienes citas programadas para hoy.</p>
                ) : (
                  agendaDiaria.map((cita) => (
                    <div key={cita.id_cita} className="grid grid-cols-[1.2fr_1fr_auto_auto] items-center gap-4 px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{cita.paciente}</p>
                        <p className="text-xs text-slate-500">DNI {cita.dni || 'sin registrar'}</p>
                      </div>
                      <p className="text-sm text-slate-600">{formatDateTime(cita.fecha_hora)}</p>
                      <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                        {cita.estado}
                      </span>
                      {['confirmada', 'reprogramada', 'en_atencion'].includes(cita.estado) ? (
                        <button
                          type="button"
                          onClick={() => abrirAtencion(cita)}
                          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Atender
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Sin confirmar</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {tab === 'atencion' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Atencion medica</h2>
              <p className="mt-1 text-sm text-slate-500">Ficha del paciente, diagnostico y observaciones.</p>
            </div>

            {!selected ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
                Selecciona un paciente desde la agenda diaria.
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_1.2fr] gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">Ficha del paciente</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Paciente</dt>
                      <dd className="font-medium text-slate-900">{selected.paciente}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">DNI</dt>
                      <dd className="font-medium text-slate-900">{selected.dni || 'Sin registrar'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Cita</dt>
                      <dd className="font-medium text-slate-900">{formatDateTime(selected.fecha_hora)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Motivo</dt>
                      <dd className="font-medium text-slate-900">{selected.motivo || 'Sin motivo registrado'}</dd>
                    </div>
                  </dl>
                </div>

                <form onSubmit={guardarAtencion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">Registro de atencion</h3>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Diagnostico
                    <textarea
                      required
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={form.diagnostico}
                      onChange={(event) => setForm({ ...form, diagnostico: event.target.value })}
                    />
                  </label>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Observaciones
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={form.observaciones}
                      onChange={(event) => setForm({ ...form, observaciones: event.target.value })}
                    />
                  </label>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Tratamiento
                    <textarea
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={form.tratamiento}
                      onChange={(event) => setForm({ ...form, tratamiento: event.target.value })}
                    />
                  </label>
                  <button type="submit" className="mt-5 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white">
                    Guardar atencion y registrar salida
                  </button>
                </form>
              </div>
            )}
          </section>
        )}

        {tab === 'historial' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Historial</h2>
              <p className="mt-1 text-sm text-slate-500">Consulta de atenciones previas por paciente.</p>
            </div>

            <div className="grid grid-cols-[280px_1fr] gap-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Pacientes atendidos</h3>
                <div className="space-y-2">
                  {pacientesUnicos.map((cita) => (
                    <button
                      key={cita.id_paciente}
                      type="button"
                      onClick={() => abrirAtencion(cita).then(() => setTab('historial'))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-900">{cita.paciente}</p>
                      <p className="text-xs text-slate-500">{cita.dni}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                {!selected ? (
                  <p className="text-sm text-slate-500">Selecciona un paciente para ver su historial.</p>
                ) : historial.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay atenciones previas registradas para {selected.paciente}.</p>
                ) : (
                  <div className="space-y-3">
                    {historial.map((item, index) => (
                      <article key={item.id_historial || index} className="rounded-lg bg-slate-50 p-4 text-sm">
                        <p className="font-semibold text-slate-900">{item.diagnostico || 'Sin diagnostico'}</p>
                        {item.observaciones && <p className="mt-2 text-slate-600">{item.observaciones}</p>}
                        {item.tratamiento && <p className="mt-2 text-slate-600">Tratamiento: {item.tratamiento}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
