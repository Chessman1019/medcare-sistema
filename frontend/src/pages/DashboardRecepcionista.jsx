/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import PortalSidebar from '../components/PortalSidebar'
import {
  cancelarCita,
  confirmarCita,
  getCitasHoy,
  getDoctores,
  getEspecialidades,
  getHorarios,
  getPacientes,
  getStatsCitas,
  getTodasCitas,
  registrarAsistencia,
  registrarPaciente,
  registrarSalida,
  reprogramarCita,
} from '../services/api'

const estadoClass = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reprogramada: 'bg-violet-50 text-violet-700 border-violet-200',
  en_atencion: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
}

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const dangerButton = 'rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

const emptyRegistro = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
  dni: '',
  fecha_nacimiento: '',
  genero: 'M',
  seguro_medico: '',
  direccion: '',
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

function doctorLabel(doctor) {
  if (!doctor) return 'Doctor no asignado'
  const source = doctor.usuario || doctor
  return [source.nombre, source.apellido].filter(Boolean).join(' ') || doctor.doctor || 'Doctor'
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardRecepcionista() {
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [citas, setCitas] = useState([])
  const [citasHoy, setCitasHoy] = useState([])
  const [doctores, setDoctores] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [filtros, setFiltros] = useState({ estado: '', doctor: '', fecha: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [agendaDoctor, setAgendaDoctor] = useState('')
  const [horariosAgenda, setHorariosAgenda] = useState([])
  const [reprogramacion, setReprogramacion] = useState(null)
  const [registro, setRegistro] = useState(emptyRegistro)
  const [message, setMessage] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [focusVersion, setFocusVersion] = useState(0)
  const contentRef = useRef(null)

  const requestFocus = () => setFocusVersion((current) => current + 1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsR, todasR, hoyR, doctoresR, pacientesR, especialidadesR] = await Promise.all([
        getStatsCitas(),
        getTodasCitas(),
        getCitasHoy(),
        getDoctores(),
        getPacientes(),
        getEspecialidades(),
      ])
      setStats(statsR.data)
      setCitas(todasR.data)
      setCitasHoy(hoyR.data)
      setDoctores(doctoresR.data)
      setPacientes(pacientesR.data)
      setEspecialidades(especialidadesR.data)
    } catch (error) {
      setMessage(error.response?.data?.detail || 'No se pudieron cargar los datos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!focusVersion) return
    window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      contentRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [focusVersion])

  const citasFiltradas = useMemo(() => {
    return citas.filter((cita) => {
      const coincideEstado = !filtros.estado || cita.estado === filtros.estado
      const coincideDoctor = !filtros.doctor || cita.doctor?.toLowerCase().includes(filtros.doctor.toLowerCase())
      const coincideFecha = !filtros.fecha || cita.fecha_hora?.startsWith(filtros.fecha)
      const term = searchTerm.trim().toLowerCase()
      const coincideBusqueda = !term || [cita.paciente, cita.doctor, cita.especialidad, cita.estado, cita.dni, cita.motivo]
        .some((field) => String(field || '').toLowerCase().includes(term))
      return coincideEstado && coincideDoctor && coincideFecha && coincideBusqueda
    })
  }, [citas, filtros, searchTerm])

  const goToTab = (nextTab, nextFilters = {}) => {
    setTab(nextTab)
    setFiltros((actual) => ({ ...actual, ...nextFilters }))
    requestFocus()
  }

  const showMessage = (text) => {
    setMessage(text)
    requestFocus()
    window.setTimeout(() => setMessage(''), 3500)
  }

  const cambiarEstado = async (id, accion) => {
    const acciones = {
      confirmar: confirmarCita,
      asistencia: registrarAsistencia,
      salida: registrarSalida,
      cancelar: cancelarCita,
    }
    setActionLoading(`${accion}-${id}`)
    try {
      await acciones[accion](id)
      showMessage('Cita actualizada correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo actualizar la cita.')
    } finally {
      setActionLoading('')
    }
  }

  const abrirReprogramacion = async (cita) => {
    goToTab('gestion')
    setReprogramacion({ cita, id_doctor: cita.id_doctor, id_horario: '', horarios: [], loading: true })
    try {
      const res = await getHorarios(cita.id_doctor)
      setReprogramacion({ cita, id_doctor: cita.id_doctor, id_horario: '', horarios: res.data || [], loading: false })
    } catch (error) {
      setReprogramacion(null)
      showMessage(error.response?.data?.detail || 'No se pudieron cargar horarios para reprogramar.')
    }
  }

  const cambiarDoctorReprogramacion = async (idDoctor) => {
    setReprogramacion((actual) => ({ ...actual, id_doctor: idDoctor, id_horario: '', horarios: [], loading: true }))
    try {
      const res = await getHorarios(idDoctor)
      setReprogramacion((actual) => ({
        ...actual,
        id_doctor: idDoctor,
        id_horario: '',
        horarios: res.data || [],
        loading: false,
      }))
    } catch (error) {
      setReprogramacion((actual) => ({ ...actual, loading: false }))
      showMessage(error.response?.data?.detail || 'No se pudo cargar disponibilidad del doctor.')
    }
  }

  const guardarReprogramacion = async (event) => {
    event.preventDefault()
    const horario = reprogramacion.horarios.find((h) => String(h.id_horario) === String(reprogramacion.id_horario))
    if (!horario) return

    setActionLoading('reprogramar')
    try {
      await reprogramarCita(reprogramacion.cita.id_cita, {
        id_horario: Number(reprogramacion.id_horario),
        fecha_hora: `${horario.fecha}T${horario.hora_inicio}`,
      })
      setReprogramacion(null)
      showMessage('Cita reprogramada correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo reprogramar la cita.')
    } finally {
      setActionLoading('')
    }
  }

  const cargarDisponibilidad = async (idDoctor) => {
    setAgendaDoctor(idDoctor)
    if (!idDoctor) {
      setHorariosAgenda([])
      return
    }
    try {
      const res = await getHorarios(idDoctor)
      setHorariosAgenda(res.data || [])
    } catch (error) {
      setHorariosAgenda([])
      showMessage(error.response?.data?.detail || 'No se pudo cargar la disponibilidad.')
    }
  }

  const registrarNuevoPaciente = async (event) => {
    event.preventDefault()
    setActionLoading('registro')
    try {
      await registrarPaciente(registro)
      setRegistro(emptyRegistro)
      showMessage('Paciente registrado correctamente.')
      await fetchData()
    } catch (error) {
      showMessage(error.response?.data?.detail || 'No se pudo registrar el paciente.')
    } finally {
      setActionLoading('')
    }
  }

  const notificationItems = [
    {
      title: `${stats.pendientes ?? 0} citas pendientes`,
      description: 'Valida solicitudes nuevas para que los pacientes reciban confirmación.',
      time: 'Ahora',
      actionLabel: 'Ir a gestión',
      onClick: () => goToTab('gestion', { estado: 'pendiente' }),
    },
    {
      title: `${stats.citas_hoy ?? 0} citas hoy`,
      description: 'Revisa la agenda diaria y disponibilidad operativa.',
      time: 'Hoy',
      actionLabel: 'Ver agenda',
      onClick: () => goToTab('agenda', { fecha: todayInputValue() }),
    },
  ]

  const helpItems = [
    {
      title: 'Registrar paciente',
      description: 'Crea una ficha de paciente para poder agendar o validar citas.',
      actionLabel: 'Abrir registro',
      onClick: () => goToTab('registro'),
    },
    {
      title: 'Gestionar asistencia',
      description: 'Confirma asistencia, salida, cancelación o reprogramación desde gestión.',
      actionLabel: 'Abrir gestión',
      onClick: () => goToTab('gestion'),
    },
  ]

  const appItems = [
    { title: 'Panel', description: 'Métricas rápidas del día.', actionLabel: 'Abrir', onClick: () => goToTab('dashboard') },
    { title: 'Agenda global', description: 'Calendario y disponibilidad por doctor.', actionLabel: 'Abrir', onClick: () => goToTab('agenda') },
    { title: 'Registro paciente', description: 'Alta de nuevos pacientes.', actionLabel: 'Abrir', onClick: () => goToTab('registro') },
  ]

  const sidebarItems = [
    { path: 'dashboard', icon: 'dashboard', label: 'Panel' },
    { path: 'agenda', icon: 'calendar_month', label: 'Agenda global' },
    { path: 'gestion', icon: 'event_note', label: 'Gestión de citas' },
    { path: 'registro', icon: 'person_add', label: 'Registro paciente' },
  ]

  const Sidebar = (
    <PortalSidebar
      active={tab}
      items={sidebarItems}
      onSelect={(nextTab) => goToTab(nextTab)}
      ctaLabel="Nueva cita"
      onCta={() => goToTab('gestion')}
      onSupport={() => showMessage('Soporte interno avisado. Revisa la campana para pendientes operativos.')}
    />
  )

  if (loading) {
    return (
      <Layout sidebar={Sidebar} title="Recepción" notificationItems={notificationItems} helpItems={helpItems} appItems={appItems}>
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando datos...</div>
      </Layout>
    )
  }

  return (
    <Layout
      sidebar={Sidebar}
      title="Recepción"
      searchValue={searchTerm}
      searchPlaceholder="Buscar pacientes, doctores o citas..."
      onSearchChange={setSearchTerm}
      notificationItems={notificationItems}
      helpItems={helpItems}
      appItems={appItems}
    >
      <div ref={contentRef} tabIndex={-1} className="mx-auto w-full max-w-[1440px] space-y-7 p-8 focus:outline-none">
        {message && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            {message}
          </div>
        )}

        {tab === 'dashboard' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recepción</h2>
              <p className="mt-1 text-sm text-slate-500">Citas del día, validaciones pendientes y actividad general.</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                ['Citas hoy', stats.citas_hoy ?? 0, () => goToTab('agenda', { fecha: todayInputValue() })],
                ['Pendientes', stats.pendientes ?? 0, () => goToTab('gestion', { estado: 'pendiente' })],
                ['Confirmadas hoy', stats.confirmadas_hoy ?? 0, () => goToTab('gestion', { estado: 'confirmada', fecha: todayInputValue() })],
                ['En atencion', stats.en_atencion_hoy ?? 0, () => goToTab('gestion', { estado: 'en_atencion', fecha: todayInputValue() })],
              ].map(([label, value, action]) => (
                <button key={label} type="button" onClick={action} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#12b8a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98]">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">Citas programadas para hoy</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {citasHoy.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-500">No hay citas registradas para hoy.</p>
                ) : (
                  citasHoy.map((cita) => (
                    <button key={cita.id_cita} type="button" onClick={() => goToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })} className="grid w-full grid-cols-[1.4fr_1.4fr_1fr_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15">
                      <div>
                        <p className="font-medium text-slate-900">{cita.paciente}</p>
                        <p className="text-xs text-slate-500">DNI {cita.dni || 'sin registrar'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">Dr. {cita.doctor}</p>
                        <p className="text-xs text-slate-500">{cita.especialidad}</p>
                      </div>
                      <p className="text-sm text-slate-600">{formatDateTime(cita.fecha_hora)}</p>
                      <span className={`rounded-md border px-2 py-1 text-xs font-medium ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                        {cita.estado}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {tab === 'agenda' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Agenda global</h2>
              <p className="mt-1 text-sm text-slate-500">Calendario operativo y disponibilidad por doctor.</p>
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <input
                    type="date"
                    className={inputClass}
                    value={filtros.fecha}
                    onChange={(event) => setFiltros({ ...filtros, fecha: event.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Buscar doctor"
                    value={filtros.doctor}
                    onChange={(event) => setFiltros({ ...filtros, doctor: event.target.value })}
                  />
                  <select
                    className={inputClass}
                    value={filtros.estado}
                    onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="reprogramada">Reprogramada</option>
                    <option value="en_atencion">En atencion</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="divide-y divide-slate-100">
                  {citasFiltradas.slice(0, 12).map((cita) => (
                    <button key={cita.id_cita} type="button" onClick={() => goToTab('gestion', { doctor: cita.doctor || '', fecha: cita.fecha_hora?.slice(0, 10) || '' })} className="grid w-full grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15">
                      <span className="font-medium text-slate-900">{cita.paciente}</span>
                      <span className="text-slate-600">Dr. {cita.doctor}</span>
                      <span className="text-slate-500">{formatDateTime(cita.fecha_hora)}</span>
                      <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                        {cita.estado}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">Disponibilidad</h3>
                <select
                  className={`mt-4 w-full ${inputClass}`}
                  value={agendaDoctor}
                  onChange={(event) => cargarDisponibilidad(event.target.value)}
                >
                  <option value="">Selecciona doctor</option>
                  {doctores.map((doctor) => (
                    <option key={doctor.id_usuario} value={doctor.id_usuario}>
                      Dr. {doctorLabel(doctor)}
                    </option>
                  ))}
                </select>
                <div className="mt-4 space-y-2">
                  {horariosAgenda.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin horarios libres seleccionados.</p>
                  ) : (
                    horariosAgenda.slice(0, 8).map((horario) => (
                      <button key={horario.id_horario} type="button" onClick={() => showMessage(`Horario libre seleccionado: ${horario.fecha} ${horario.hora_inicio}`)} className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[#e5fbf7] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/15">
                        {horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'gestion' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Gestión de citas</h2>
              <p className="mt-1 text-sm text-slate-500">Confirmación, reprogramación, asistencia y salida.</p>
            </div>

            {reprogramacion && (
              <form onSubmit={guardarReprogramacion} className="rounded-lg border border-violet-200 bg-violet-50 p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-violet-950">Reprogramar cita #{reprogramacion.cita.id_cita}</h3>
                  <p className="text-sm text-violet-700">{reprogramacion.cita.paciente}</p>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                  <select
                    className={inputClass}
                    value={reprogramacion.id_doctor}
                    onChange={(event) => cambiarDoctorReprogramacion(event.target.value)}
                  >
                    {doctores.map((doctor) => (
                      <option key={doctor.id_usuario} value={doctor.id_usuario}>
                        Dr. {doctorLabel(doctor)}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    required
                    value={reprogramacion.id_horario}
                    onChange={(event) => setReprogramacion({ ...reprogramacion, id_horario: event.target.value })}
                    disabled={reprogramacion.loading}
                  >
                    <option value="">{reprogramacion.loading ? 'Cargando horarios...' : 'Nuevo horario'}</option>
                    {reprogramacion.horarios.map((horario) => (
                      <option key={horario.id_horario} value={horario.id_horario}>
                        {horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading === 'reprogramar'} className={primaryButton}>
                      {actionLoading === 'reprogramar' ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => setReprogramacion(null)} className={secondaryButton}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Doctor</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citasFiltradas.map((cita) => (
                    <tr key={cita.id_cita} className="transition hover:bg-[#f8fbff]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{cita.paciente}</p>
                        <p className="text-xs text-slate-500">{cita.dni}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">Dr. {cita.doctor}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(cita.fecha_hora)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md border px-2 py-1 text-xs ${estadoClass[cita.estado] || estadoClass.pendiente}`}>
                          {cita.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {cita.estado === 'pendiente' && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'confirmar')} disabled={actionLoading === `confirmar-${cita.id_cita}`} className={primaryButton}>
                              {actionLoading === `confirmar-${cita.id_cita}` ? '...' : 'Confirmar'}
                            </button>
                          )}
                          {['pendiente', 'confirmada', 'reprogramada'].includes(cita.estado) && (
                            <button type="button" onClick={() => abrirReprogramacion(cita)} className={secondaryButton}>
                              Reprogramar
                            </button>
                          )}
                          {['confirmada', 'reprogramada'].includes(cita.estado) && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'asistencia')} disabled={actionLoading === `asistencia-${cita.id_cita}`} className={primaryButton}>
                              {actionLoading === `asistencia-${cita.id_cita}` ? '...' : 'Asistencia'}
                            </button>
                          )}
                          {cita.estado === 'en_atencion' && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'salida')} disabled={actionLoading === `salida-${cita.id_cita}`} className={primaryButton}>
                              {actionLoading === `salida-${cita.id_cita}` ? '...' : 'Salida'}
                            </button>
                          )}
                          {!['cancelada', 'completada'].includes(cita.estado) && (
                            <button type="button" onClick={() => cambiarEstado(cita.id_cita, 'cancelar')} disabled={actionLoading === `cancelar-${cita.id_cita}`} className={dangerButton}>
                              {actionLoading === `cancelar-${cita.id_cita}` ? '...' : 'Cancelar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'registro' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Alta de paciente</h2>
              <p className="mt-1 text-sm text-slate-500">{pacientes.length} pacientes registrados. {especialidades.length} especialidades disponibles.</p>
            </div>
            <form onSubmit={registrarNuevoPaciente} className="max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['nombre', 'Nombre', 'text'],
                  ['apellido', 'Apellido', 'text'],
                  ['email', 'Correo', 'email'],
                  ['password', 'Contrasena inicial', 'password'],
                  ['dni', 'DNI', 'text'],
                  ['telefono', 'Telefono', 'text'],
                  ['fecha_nacimiento', 'Fecha de nacimiento', 'date'],
                  ['seguro_medico', 'Seguro medico', 'text'],
                  ['direccion', 'Direccion', 'text'],
                ].map(([field, label, type]) => (
                  <label key={field} className="text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type={type}
                      required={!['telefono', 'seguro_medico', 'direccion'].includes(field)}
                      className={`mt-1 w-full ${inputClass}`}
                      value={registro[field]}
                      onChange={(event) => setRegistro({ ...registro, [field]: event.target.value })}
                    />
                  </label>
                ))}
                <label className="text-sm font-medium text-slate-700">
                  Genero
                  <select
                    className={`mt-1 w-full ${inputClass}`}
                    value={registro.genero}
                    onChange={(event) => setRegistro({ ...registro, genero: event.target.value })}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
              </div>
              <button type="submit" disabled={actionLoading === 'registro'} className={`mt-5 ${primaryButton}`}>
                {actionLoading === 'registro' ? 'Registrando...' : 'Registrar paciente'}
              </button>
            </form>
          </section>
        )}
      </div>
    </Layout>
  )
}
