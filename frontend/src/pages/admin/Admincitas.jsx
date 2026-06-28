import { useEffect, useMemo, useRef, useState } from 'react'
import HorarioDisponibleForm from '../../components/HorarioDisponibleForm'

const statusClass = {
  pendiente:    'bg-[#f5f5f2] text-[#46514f]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
  completada:   'bg-[#d8e5e2] text-[#293533]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
}

const actionModalConfig = {
  confirmar: {
    icon: 'check_circle',
    title: 'Confirmar cita',
    question: 'Quieres confirmar esta cita?',
    confirmLabel: 'Si, confirmar',
    loadingLabel: 'Confirmando...',
    iconClass: 'bg-[#d8f4ee] text-[#006b5d]',
    buttonClass: 'medcare-primary-button px-5 py-2.5 disabled:opacity-60',
  },
  cancelar: {
    icon: 'cancel',
    title: 'Cancelar cita',
    question: 'Quieres cancelar esta cita?',
    confirmLabel: 'Si, cancelar',
    loadingLabel: 'Cancelando...',
    iconClass: 'bg-[#fff0ef] text-[#93000a]',
    buttonClass: 'rounded-xl bg-[#93000a] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#ba1a1a] disabled:opacity-60',
  },
  completar: {
    icon: 'task_alt',
    title: 'Completar cita',
    question: 'Quieres marcar esta cita como completada?',
    confirmLabel: 'Si, completar',
    loadingLabel: 'Completando...',
    iconClass: 'bg-[#e8edff] text-[#355382]',
    buttonClass: 'rounded-xl bg-[#355382] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#263f66] disabled:opacity-60',
  },
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' })
}

function getFechaFinCita(cita) {
  if (cita.fecha_fin) return cita.fecha_fin
  if (!cita.fecha_hora) return null

  const inicio = new Date(cita.fecha_hora)
  if (Number.isNaN(inicio.getTime())) return null

  const duracion = Number(cita.duracion_min)
  const minutos = Number.isFinite(duracion) && duracion >= 0 ? duracion : 30
  return new Date(inicio.getTime() + minutos * 60000).toISOString()
}

export default function AdminCitas({ citas, doctores = [], especialidades, citaNotificada, onAccion, actionLoading = '', onRefresh, onCrearHorario }) {
  const [filtros, setFiltros] = useState({ estado: '', especialidad: '', doctor: '', fecha: '' })
  const [mostrarHorarioForm, setMostrarHorarioForm] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)
  const [modalError, setModalError] = useState('')
  const rowRefs = useRef({})

  useEffect(() => {
    if (!citaNotificada?.id_cita) return
    const scrollTimer = window.setTimeout(() => {
      rowRefs.current[citaNotificada.id_cita]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    return () => window.clearTimeout(scrollTimer)
  }, [citaNotificada])

  useEffect(() => {
    if (!accionPendiente) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !actionLoading) {
        setAccionPendiente(null)
        setModalError('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [accionPendiente, actionLoading])

  const citasFiltradas = useMemo(() => {
    let resultado = [...citas]
    if (filtros.estado) resultado = resultado.filter(c => c.estado === filtros.estado)
    if (filtros.especialidad) resultado = resultado.filter(c => c.especialidad === filtros.especialidad)
    if (filtros.doctor) resultado = resultado.filter(c => c.doctor?.toLowerCase().includes(filtros.doctor.toLowerCase()))
    if (filtros.fecha) resultado = resultado.filter(c => c.fecha_hora?.startsWith(filtros.fecha))
    if (citaNotificada?.id_cita && !resultado.some(c => String(c.id_cita) === String(citaNotificada.id_cita))) {
      const citaEnfocada = citas.find(c => String(c.id_cita) === String(citaNotificada.id_cita))
      if (citaEnfocada) resultado = [citaEnfocada, ...resultado]
    }
    return resultado
  }, [citas, filtros, citaNotificada])

  const aplicarFiltros = (nuevosFiltros) => setFiltros(nuevosFiltros)
  const abrirConfirmacion = (cita, accion) => {
    setModalError('')
    setAccionPendiente({ cita, accion })
  }
  const cerrarConfirmacion = () => {
    if (actionLoading) return
    setAccionPendiente(null)
    setModalError('')
  }
  const ejecutarAccionPendiente = async () => {
    if (!accionPendiente) return
    setModalError('')
    try {
      await onAccion(accionPendiente.cita.id_cita, accionPendiente.accion)
      setAccionPendiente(null)
    } catch (error) {
      setModalError(error.message || 'No se pudo actualizar la cita.')
    }
  }

  const modalConfig = accionPendiente ? actionModalConfig[accionPendiente.accion] : null
  const modalLoading = accionPendiente && actionLoading === `${accionPendiente.accion}-${accionPendiente.cita.id_cita}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Gestión de Citas</h2>
          <p className="mt-2 text-lg text-[#52615f]">{citasFiltradas.length} citas encontradas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMostrarHorarioForm(value => !value)} className="flex items-center gap-2 medcare-primary-button px-4 py-2">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Agregar más fechas y horas disponibles
          </button>
          <button onClick={onRefresh} className="flex items-center gap-2 medcare-secondary-button px-4 py-2">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {mostrarHorarioForm && (
        <HorarioDisponibleForm
          doctores={doctores}
          onSubmit={onCrearHorario}
          onCancel={() => setMostrarHorarioForm(false)}
        />
      )}

      <div className="medcare-card p-5">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#006b5d] mb-4">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-bold text-[#223330] mb-1">Estado</label>
            <select className="medcare-input" value={filtros.estado} onChange={e => aplicarFiltros({ ...filtros, estado: e.target.value })}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="completada">Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#223330] mb-1">Especialidad</label>
            <select className="medcare-input" value={filtros.especialidad} onChange={e => aplicarFiltros({ ...filtros, especialidad: e.target.value })}>
              <option value="">Todas</option>
              {especialidades.map(e => <option key={e.id_especialidad} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#223330] mb-1">Doctor</label>
            <input className="medcare-input" placeholder="Buscar doctor..." value={filtros.doctor} onChange={e => aplicarFiltros({ ...filtros, doctor: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#223330] mb-1">Fecha</label>
            <input type="date" className="medcare-input" value={filtros.fecha} onChange={e => aplicarFiltros({ ...filtros, fecha: e.target.value })} />
          </div>
        </div>
        <button onClick={() => aplicarFiltros({ estado: '', especialidad: '', doctor: '', fecha: '' })}
          className="mt-3 text-xs font-bold text-[#006b5d] hover:underline">
          Limpiar filtros
        </button>
      </div>

      <div className="medcare-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
              <tr>
                {['#', 'Paciente', 'Doctor', 'Especialidad', 'Inicio', 'Fin', 'Tipo', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {citasFiltradas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-[#52615f]">No hay citas con esos filtros</td></tr>
              ) : citasFiltradas.map((c, i) => (
                <tr
                  key={c.id_cita}
                  ref={node => { if (node) rowRefs.current[c.id_cita] = node }}
                  className={`${String(c.id_cita) === String(citaNotificada?.id_cita) ? 'bg-[#f4fffc] ring-2 ring-inset ring-[#12b8a3]/45' : 'bg-white'} transition hover:bg-[#f8fbff]`}
                >
                  <td className="px-5 py-4 text-xs text-[#52615f]">{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#d8f4ee] flex items-center justify-center text-[#006b5d] text-xs font-extrabold">
                        {c.paciente?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#101828]">{c.paciente}</p>
                        <p className="text-xs text-[#52615f]">{c.dni}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">Dr. {c.doctor}</td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">{c.especialidad}</td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">{formatDate(c.fecha_hora)}</td>
                  <td className="px-5 py-4 text-sm text-[#52615f]">{formatDate(getFechaFinCita(c))}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-[#edf2ff] text-[#355382] px-2 py-0.5 rounded-full font-bold">{c.tipo_atencion}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${statusClass[c.estado] || statusClass.pendiente}`}>{c.estado}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {c.estado === 'pendiente' && (
                        <button type="button" onClick={() => abrirConfirmacion(c, 'confirmar')}
                          disabled={actionLoading === `confirmar-${c.id_cita}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#006b5d] transition hover:bg-[#d8f4ee] disabled:opacity-60" title="Confirmar" aria-label="Confirmar cita">
                          <span className={`material-symbols-outlined text-[18px] ${actionLoading === `confirmar-${c.id_cita}` ? 'animate-spin' : ''}`}>
                            {actionLoading === `confirmar-${c.id_cita}` ? 'progress_activity' : 'check_circle'}
                          </span>
                        </button>
                      )}
                      {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                        <button type="button" onClick={() => abrirConfirmacion(c, 'cancelar')}
                          disabled={actionLoading === `cancelar-${c.id_cita}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#93000a] transition hover:bg-[#fff0ef] disabled:opacity-60" title="Cancelar" aria-label="Cancelar cita">
                          <span className={`material-symbols-outlined text-[18px] ${actionLoading === `cancelar-${c.id_cita}` ? 'animate-spin' : ''}`}>
                            {actionLoading === `cancelar-${c.id_cita}` ? 'progress_activity' : 'cancel'}
                          </span>
                        </button>
                      )}
                      {['confirmada', 'en_atencion'].includes(c.estado) && (
                        <button type="button" onClick={() => abrirConfirmacion(c, 'completar')}
                          disabled={actionLoading === `completar-${c.id_cita}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#355382] transition hover:bg-[#e8edff] disabled:opacity-60" title="Completar" aria-label="Completar cita">
                          <span className={`material-symbols-outlined text-[18px] ${actionLoading === `completar-${c.id_cita}` ? 'animate-spin' : ''}`}>
                            {actionLoading === `completar-${c.id_cita}` ? 'progress_activity' : 'task_alt'}
                          </span>
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

      {accionPendiente && modalConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#08284d]/40 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-cita-modal-title">
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-2xl shadow-[#08284d]/25">
            <div className="flex items-start gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${modalConfig.iconClass}`}>
                <span className="material-symbols-outlined">{modalConfig.icon}</span>
              </span>
              <div className="min-w-0">
                <h3 id="admin-cita-modal-title" className="text-xl font-extrabold text-[#101828]">{modalConfig.title}</h3>
                <p className="mt-1 text-sm font-semibold text-[#52615f]">{modalConfig.question}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#d8e3fb] bg-[#f8fbff] p-4 text-sm">
              <p className="font-extrabold text-[#101828]">{accionPendiente.cita.paciente || `Cita #${accionPendiente.cita.id_cita}`}</p>
              <p className="mt-1 text-[#52615f]">Dr. {accionPendiente.cita.doctor || 'Sin doctor asignado'}</p>
              <p className="mt-1 text-[#52615f]">{formatDate(accionPendiente.cita.fecha_hora)}</p>
            </div>

            {modalError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-3 py-2 text-sm font-bold text-[#93000a]">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {modalError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={cerrarConfirmacion} disabled={modalLoading}
                className="rounded-xl border border-[#bdcbc7] bg-white px-5 py-2.5 text-sm font-extrabold text-[#223330] transition hover:bg-[#f8fbff] disabled:opacity-60">
                No
              </button>
              <button type="button" onClick={ejecutarAccionPendiente} disabled={modalLoading}
                className={modalConfig.buttonClass}>
                {modalLoading ? modalConfig.loadingLabel : modalConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
