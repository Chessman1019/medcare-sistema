/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import PortalSidebar from '../components/PortalSidebar'
import {
  enviarSoporte,
  getCitasDoctor,
  getHistorial,
  getNotificacionesDoctor,
  marcarNotificacionEnviada,
  registrarAtencion,
} from '../services/api'

const estadoClass = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion: 'bg-sky-50 text-sky-700 border-sky-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
}

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'
const primaryButton = 'rounded-lg bg-[#007a68] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]'

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

  const requestFocus = () => setFocusVersion((current) => current + 1)

  const goToTab = (nextTab) => {
    setTab(nextTab)
    requestFocus()
  }

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

  useEffect(() => {
    fetchCitas()
  }, [fetchCitas])

  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      contentRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [focusVersion])

  const agendaDiaria = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return citas
      .filter((cita) => isToday(cita.fecha_hora) && cita.estado !== 'cancelada')
      .filter((cita) => !term || [cita.paciente, cita.dni, cita.especialidad, cita.estado, cita.motivo]
        .some((field) => String(field || '').toLowerCase().includes(term)))
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  }, [citas, searchTerm])

  const pacientesUnicos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return [...new Map(citas.map((cita) => [cita.id_paciente, cita])).values()]
      .filter((cita) => !term || [cita.paciente, cita.dni, cita.especialidad, cita.estado]
        .some((field) => String(field || '').toLowerCase().includes(term)))
  }, [citas, searchTerm])

  const abrirAtencion = async (cita) => {
    setSelected(cita)
    setForm(emptyAtencion)
    goToTab('atencion')
    try {
      const res = await getHistorial(cita.id_paciente)
      setHistorial(res.data)
    } catch {
      setHistorial([])
    }
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
      const cita = citas.find((item) => item.id_cita === notificacion.id_cita)
      if (cita) abrirAtencion(cita)
      else goToTab('agenda')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo actualizar la notificación.')
    }
  }

  const registrarSoporteMedico = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await enviarSoporte({
        id_usuario: userId,
        rol: 'doctor',
        contexto: 'soporte médico',
        mensaje: 'El médico solicita apoyo operativo desde el portal.',
        id_cita: selected?.id_cita,
      })
      await refreshNotificaciones()
      setMessage('Ticket de soporte medico registrado en Supabase.')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo registrar soporte.')
    } finally {
      setSaving(false)
    }
  }

  const guardarAtencion = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await registrarAtencion(selected.id_cita, form)
      setMessage('Atención registrada y cita cerrada correctamente.')
      setSelected(null)
      setForm(emptyAtencion)
      setHistorial([])
      await fetchCitas()
      goToTab('agenda')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudo registrar la atención.')
    } finally {
      setSaving(false)
    }
  }

  const enAtencion = citas.filter((cita) => cita.estado === 'en_atencion')
  const proximas = agendaDiaria.filter((cita) => ['confirmada', 'reprogramada', 'en_atencion'].includes(cita.estado))

  const notificationItems = notificaciones.length ? notificaciones.slice(0, 6).map((item) => ({
    title: item.tipo?.replaceAll('_', ' ') || 'Notificación',
    description: item.mensaje,
    time: formatDateTime(item.fecha_programada),
    actionLabel: item.enviada ? 'Abrir atención' : 'Marcar como vista',
    onClick: () => handleNotificacion(item),
  })) : [
    {
      title: `${agendaDiaria.length} pacientes hoy`,
      description: agendaDiaria.length ? 'Revisa la agenda cronológica y empieza la atención desde cada ficha.' : 'No tienes pacientes programados para hoy.',
      time: 'Hoy',
      actionLabel: 'Ver agenda',
      onClick: () => goToTab('agenda'),
    },
    {
      title: `${enAtencion.length} en atención`,
      description: enAtencion.length ? 'Hay consultas abiertas que pueden requerir cierre clínico.' : 'No hay atenciones abiertas en este momento.',
      time: 'Ahora',
      actionLabel: 'Abrir atención',
      onClick: () => {
        if (enAtencion[0]) abrirAtencion(enAtencion[0])
        else goToTab('agenda')
      },
    },
  ]

  const helpItems = [
    {
      title: 'Registrar atención',
      description: 'Selecciona un paciente confirmado y completa diagnóstico, tratamiento y observaciones.',
      actionLabel: 'Ir a agenda',
      onClick: () => goToTab('agenda'),
    },
    {
      title: 'Consultar historial',
      description: 'Elige un paciente para revisar atenciones previas antes de guardar la consulta.',
      actionLabel: 'Abrir historial',
      onClick: () => goToTab('historial'),
    },
  ]

  const appItems = [
    { title: 'Agenda diaria', description: `${proximas.length} citas listas para atender.`, actionLabel: 'Abrir', onClick: () => goToTab('agenda') },
    { title: 'Atención', description: selected ? `Ficha activa: ${selected.paciente}` : 'Selecciona un paciente desde agenda.', actionLabel: 'Abrir', onClick: () => goToTab('atencion') },
    { title: 'Historial', description: `${pacientesUnicos.length} pacientes con citas registradas.`, actionLabel: 'Abrir', onClick: () => goToTab('historial') },
  ]

  const sidebarItems = [
    { path: 'agenda', icon: 'dashboard', label: 'Agenda diaria' },
    { path: 'atencion', icon: 'clinical_notes', label: 'Atención' },
    { path: 'historial', icon: 'folder_open', label: 'Historial' },
  ]

  const Sidebar = (
    <PortalSidebar
      active={tab}
      items={sidebarItems}
      onSelect={goToTab}
      ctaLabel="Ver agenda"
      ctaIcon="event"
      onCta={() => goToTab('agenda')}
      onSupport={registrarSoporteMedico}
    />
  )

  if (loading) {
    return (
      <Layout sidebar={Sidebar} title="Panel médico" notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando agenda...</div>
      </Layout>
    )
  }

  return (
    <Layout
      sidebar={Sidebar}
      title="Panel médico"
      searchValue={searchTerm}
      searchPlaceholder="Buscar pacientes, DNI o estados..."
      onSearchChange={setSearchTerm}
      notificationItems={notificationItems}
      helpItems={helpItems}
      appItems={appItems}
    >
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] space-y-6 p-4 focus:outline-none sm:p-6 lg:space-y-7 lg:p-8">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button type="button" onClick={() => goToTab('agenda')} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#12b8a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                <p className="text-sm text-slate-500">Citas hoy</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{agendaDiaria.length}</p>
              </button>
              <button type="button" onClick={() => enAtencion[0] ? abrirAtencion(enAtencion[0]) : goToTab('agenda')} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#12b8a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                <p className="text-sm text-slate-500">En atencion</p>
                <p className="mt-2 text-3xl font-bold text-sky-700">{enAtencion.length}</p>
              </button>
              <button type="button" onClick={() => goToTab('historial')} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#12b8a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                <p className="text-sm text-slate-500">Pacientes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{pacientesUnicos.length}</p>
              </button>
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
                    <div key={cita.id_cita} className="grid grid-cols-1 items-start gap-3 px-5 py-4 transition hover:bg-[#f8fbff] md:grid-cols-[1.2fr_1fr_auto_auto] md:items-center md:gap-4">
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
                          className={primaryButton}
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
              <h2 className="text-2xl font-bold text-slate-900">Atención médica</h2>
              <p className="mt-1 text-sm text-slate-500">Ficha del paciente, diagnóstico y observaciones.</p>
            </div>

            {!selected ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm sm:p-8">
                Selecciona un paciente desde la agenda diaria.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.2fr] xl:gap-6">
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
                  <button type="button" onClick={() => goToTab('historial')} className={`mt-5 ${secondaryButton}`}>
                    Ver historial
                  </button>
                </div>

                <form onSubmit={guardarAtencion} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">Registro de atencion</h3>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Diagnóstico
                    <textarea
                      required
                      rows={3}
                      className={inputClass}
                      value={form.diagnostico}
                      onChange={(event) => setForm({ ...form, diagnostico: event.target.value })}
                    />
                  </label>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Observaciones
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={form.observaciones}
                      onChange={(event) => setForm({ ...form, observaciones: event.target.value })}
                    />
                  </label>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Tratamiento
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={form.tratamiento}
                      onChange={(event) => setForm({ ...form, tratamiento: event.target.value })}
                    />
                  </label>
                  <button type="submit" disabled={saving} className={`mt-5 ${primaryButton}`}>
                    {saving ? 'Guardando...' : 'Guardar atencion y registrar salida'}
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr] lg:gap-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Pacientes atendidos</h3>
                <div className="space-y-2">
                  {pacientesUnicos.map((cita) => (
                    <button
                      key={cita.id_paciente}
                      type="button"
                      onClick={() => abrirAtencion(cita).then(() => goToTab('historial'))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]"
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
                        <p className="font-semibold text-slate-900">{item.diagnostico || 'Sin diagnóstico'}</p>
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
