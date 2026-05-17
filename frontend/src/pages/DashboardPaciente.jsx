import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import PortalSidebar from '../components/PortalSidebar'
import { useAuth } from '../context/AuthContext'
import {
  cancelarCita,
  crearCita,
  getCitasPaciente,
  getDoctoresPorEspecialidad,
  getEspecialidades,
  getHorarios,
  reprogramarCita,
} from '../services/api'

const statusClass = {
  pendiente: 'bg-[#f5f5f2] text-[#46514f]',
  confirmada: 'bg-[#d8f4ee] text-[#006b5d]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  cancelada: 'bg-[#ffdad6] text-[#93000a]',
  completada: 'bg-[#d8e5e2] text-[#293533]',
  en_atencion: 'bg-[#dff8fb] text-[#006b5d]',
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

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
    getEspecialidades().then((res) => setEspecialidades(res.data))
    if (user?.id) getCitasPaciente(user.id).then((res) => setCitas(res.data))
  }, [user?.id])

  const proximaCita = useMemo(() => {
    return [...citas]
      .filter((cita) => !['cancelada', 'completada'].includes(cita.estado) && new Date(cita.fecha_hora) >= new Date())
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]
  }, [citas])

  const sidebarItems = [
    { path: 'inicio', icon: 'dashboard', label: 'Panel' },
    { path: 'agendar', icon: 'event', label: 'Citas' },
    { path: 'citas', icon: 'clinical_notes', label: 'Historial' },
  ]

  const sidebar = (
    <PortalSidebar
      active={tab}
      items={sidebarItems}
      onSelect={setTab}
      ctaLabel="Nueva cita"
      onCta={() => setTab('agendar')}
      ctaFirst
    />
  )

  const refreshCitas = async () => {
    if (!user?.id) return
    const res = await getCitasPaciente(user.id)
    setCitas(res.data)
  }

  const onEspecialidad = async (event) => {
    const id = event.target.value
    setForm({ ...form, id_especialidad: id, id_doctor: '', id_horario: '' })
    setHorarios([])
    if (!id) {
      setDoctores([])
      return
    }
    const res = await getDoctoresPorEspecialidad(id)
    setDoctores(res.data)
  }

  const onDoctor = async (event) => {
    const id = event.target.value
    setForm({ ...form, id_doctor: id, id_horario: '' })
    if (!id) {
      setHorarios([])
      return
    }
    const res = await getHorarios(id)
    setHorarios(res.data)
  }

  const handleAgendar = async (event) => {
    event.preventDefault()
    setLoading(true)
    const horario = horarios.find((item) => String(item.id_horario) === String(form.id_horario))
    await crearCita({
      id_doctor: Number(form.id_doctor),
      id_horario: Number(form.id_horario),
      fecha_hora: `${horario.fecha}T${horario.hora_inicio}`,
      motivo: form.motivo,
      tipo_atencion: 'web',
    }, user.id)
    setForm({ id_especialidad: '', id_doctor: '', id_horario: '', motivo: '' })
    setSuccess('Cita registrada. Recepción la validará y confirmará.')
    setTab('citas')
    await refreshCitas()
    setLoading(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleCancelar = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return
    await cancelarCita(id)
    await refreshCitas()
  }

  const abrirReprogramacion = async (cita) => {
    const res = await getHorarios(cita.id_doctor)
    setReprogramacion({ cita, id_horario: '', horarios: res.data })
  }

  const guardarReprogramacion = async (event) => {
    event.preventDefault()
    const horario = reprogramacion.horarios.find((item) => String(item.id_horario) === String(reprogramacion.id_horario))
    if (!horario) return
    await reprogramarCita(reprogramacion.cita.id_cita, {
      id_horario: Number(reprogramacion.id_horario),
      fecha_hora: `${horario.fecha}T${horario.hora_inicio}`,
    })
    setReprogramacion(null)
    setSuccess('Cita reprogramada correctamente.')
    await refreshCitas()
    setTimeout(() => setSuccess(''), 3000)
  }

  const selectedEspecialidad = especialidades.find((item) => String(item.id_especialidad) === String(form.id_especialidad))
  const selectedDoctor = doctores.find((item) => String(item.id_usuario) === String(form.id_doctor))
  const selectedHorario = horarios.find((item) => String(item.id_horario) === String(form.id_horario))

  return (
    <Layout sidebar={sidebar} title={tab === 'agendar' ? 'Agendar cita' : 'Portal del paciente'}>
      <div className="mx-auto w-full max-w-[1440px] p-8">
        {success && (
          <div className="mb-5 rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-5 py-4 text-sm font-bold text-[#006b5d]">
            {success}
          </div>
        )}

        {tab === 'inicio' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Hola, {user?.nombre?.split(' ')[0] || 'paciente'}</h2>
              <p className="mt-2 text-lg text-[#52615f]">Aquí tienes el resumen de tu atención médica.</p>
            </div>

            <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1fr_380px]">
              <section className="medcare-card overflow-hidden">
                <div className="bg-gradient-to-br from-white via-white to-[#ecfffb] p-8">
                  <p className="mb-6 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-[#006b5d]">
                    <span className="material-symbols-outlined">event_upcoming</span>
                    Próxima cita
                  </p>
                  {proximaCita ? (
                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-[#d8e5e2] text-5xl font-extrabold text-[#006b5d]">
                        {proximaCita.doctor?.charAt(0) || 'M'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-extrabold text-[#101828]">Dr. {proximaCita.doctor}</h3>
                        <p className="mt-2 text-xl font-bold text-[#006b5d]">{proximaCita.especialidad}</p>
                        <div className="mt-5 grid gap-3 text-base text-[#46514f] md:grid-cols-2">
                          <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[#12b8a3]">calendar_month</span>{formatDate(proximaCita.fecha_hora)}</span>
                          <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[#12b8a3]">verified</span>{proximaCita.estado}</span>
                        </div>
                      </div>
                      <button onClick={() => abrirReprogramacion(proximaCita)} className="medcare-secondary-button px-6 py-4">
                        Reprogramar
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#edf2ff] p-8 text-[#52615f]">
                      No tienes citas próximas. Puedes solicitar una nueva cita cuando lo necesites.
                    </div>
                  )}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-5">
                {[
                  ['clinical_notes', 'Recetas médicas'],
                  ['biotech', 'Resultados'],
                  ['payments', 'Pagos'],
                  ['support_agent', 'Soporte'],
                ].map(([icon, label]) => (
                  <button key={label} className="medcare-card-soft flex min-h-44 flex-col items-center justify-center gap-4 p-5 text-center text-lg font-extrabold text-[#101828]">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#006b5d]">
                      <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </span>
                    {label}
                  </button>
                ))}
              </section>
            </div>

            <section className="medcare-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#bdcbc7] px-8 py-6">
                <h3 className="text-2xl font-extrabold text-[#101828]">Actividad reciente</h3>
                <button onClick={() => setTab('citas')} className="font-extrabold text-[#006b5d]">Ver historial</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-white text-sm uppercase text-[#223330]">
                    <tr>
                      <th className="px-8 py-5">Especialista</th>
                      <th className="px-8 py-5">Servicio</th>
                      <th className="px-8 py-5">Fecha y hora</th>
                      <th className="px-8 py-5">Estado</th>
                      <th className="px-8 py-5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bdcbc7]">
                    {citas.slice(0, 5).map((cita) => (
                      <tr key={cita.id_cita} className="bg-white">
                        <td className="px-8 py-5">
                          <p className="font-extrabold text-[#101828]">Dr. {cita.doctor}</p>
                          <p className="text-sm text-[#52615f]">{cita.especialidad}</p>
                        </td>
                        <td className="px-8 py-5 text-[#101828]">{cita.motivo || 'Consulta'}</td>
                        <td className="px-8 py-5 text-[#101828]">{formatDate(cita.fecha_hora)}</td>
                        <td className="px-8 py-5">
                          <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass[cita.estado] || statusClass.pendiente}`}>
                            {cita.estado}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {!['cancelada', 'completada'].includes(cita.estado) && (
                            <button onClick={() => abrirReprogramacion(cita)} className="text-[#006b5d]">
                              <span className="material-symbols-outlined">edit_calendar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === 'agendar' && (
          <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1fr_420px]">
            <div className="space-y-7">
              <div className="medcare-card-soft grid gap-4 p-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                {[
                  ['1', 'Especialidad', selectedEspecialidad?.nombre || 'Seleccionar'],
                  ['2', 'Doctor', selectedDoctor?.usuario ? `Dr. ${selectedDoctor.usuario.nombre} ${selectedDoctor.usuario.apellido}` : 'Seleccionar'],
                  ['3', 'Fecha y hora', selectedHorario ? `${selectedHorario.fecha} ${selectedHorario.hora_inicio}` : 'Elegir horario'],
                ].map(([step, title, detail], index) => (
                  <div key={step} className="contents">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold ${index === 0 || detail !== 'Seleccionar' && detail !== 'Elegir horario' ? 'bg-[#007a68] text-white' : 'bg-[#dbe6fb] text-[#223330]'}`}>
                        {step}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#101828]">{title}</p>
                        <p className="text-sm text-[#52615f]">{detail}</p>
                      </div>
                    </div>
                    {index < 2 && <div className="hidden h-px w-16 bg-[#bdcbc7] md:block" />}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAgendar} className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                <section className="medcare-card p-7">
                  <h3 className="text-2xl font-extrabold text-[#101828]">Selecciona especialista</h3>
                  <div className="mt-6 space-y-5">
                    <label className="block text-sm font-bold text-[#223330]">
                      Especialidad
                      <select className="medcare-input mt-2" onChange={onEspecialidad} value={form.id_especialidad} required>
                        <option value="">Selecciona una especialidad</option>
                        {especialidades.map((item) => <option key={item.id_especialidad} value={item.id_especialidad}>{item.nombre}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-bold text-[#223330]">
                      Doctor
                      <select className="medcare-input mt-2" onChange={onDoctor} value={form.id_doctor} required disabled={!doctores.length}>
                        <option value="">Selecciona un doctor</option>
                        {doctores.map((doctor) => (
                          <option key={doctor.id_usuario} value={doctor.id_usuario}>Dr. {doctor.usuario?.nombre} {doctor.usuario?.apellido}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-bold text-[#223330]">
                      Motivo de consulta
                      <textarea className="medcare-input mt-2 min-h-28" placeholder="Describe brevemente el motivo..." value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} />
                    </label>
                  </div>
                </section>

                <section className="medcare-card p-7">
                  <h3 className="text-2xl font-extrabold text-[#101828]">Fecha y hora</h3>
                  <p className="mt-2 text-sm text-[#52615f]">Horarios disponibles para el doctor seleccionado.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {horarios.length === 0 ? (
                      <p className="col-span-2 rounded-xl bg-[#edf2ff] p-5 text-sm text-[#52615f]">Selecciona un doctor para ver disponibilidad.</p>
                    ) : horarios.map((horario) => (
                      <button
                        key={horario.id_horario}
                        type="button"
                        onClick={() => setForm({ ...form, id_horario: horario.id_horario })}
                        className={`rounded-xl border px-3 py-4 text-sm font-extrabold transition ${String(form.id_horario) === String(horario.id_horario) ? 'border-[#006b5d] bg-[#e5fbf7] text-[#006b5d]' : 'border-[#bdcbc7] bg-white text-[#101828] hover:border-[#006b5d]'}`}
                      >
                        {horario.fecha}<br />{horario.hora_inicio} a {horario.hora_fin}
                      </button>
                    ))}
                  </div>
                  <button type="submit" disabled={loading || !form.id_horario} className="medcare-primary-button mt-7 flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
                    {loading ? 'Registrando...' : 'Confirmar solicitud'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </section>
              </form>
            </div>

            <aside className="medcare-card sticky top-28 h-fit overflow-hidden">
              <div className="bg-[#007a68] p-7 text-white">
                <h3 className="text-2xl font-extrabold">Resumen de cita</h3>
              </div>
              <div className="space-y-6 p-7">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Especialidad</p>
                  <p className="mt-1 text-lg font-extrabold">{selectedEspecialidad?.nombre || 'Pendiente'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Doctor</p>
                  <p className="mt-1 text-lg font-extrabold">{selectedDoctor?.usuario ? `Dr. ${selectedDoctor.usuario.nombre} ${selectedDoctor.usuario.apellido}` : 'Pendiente'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#006b5d]">Fecha y hora</p>
                  <p className="mt-1 text-lg font-extrabold">{selectedHorario ? `${selectedHorario.fecha} - ${selectedHorario.hora_inicio}` : 'Pendiente'}</p>
                </div>
                <div className="border-t border-dashed border-[#bdcbc7] pt-6 text-sm text-[#52615f]">
                  Recibirás la confirmación cuando recepción valide la disponibilidad.
                </div>
              </div>
            </aside>
          </div>
        )}

        {tab === 'citas' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Mis citas</h2>
              <p className="mt-2 text-lg text-[#52615f]">Historial, estados y gestión de tus atenciones.</p>
            </div>

            {reprogramacion && (
              <form onSubmit={guardarReprogramacion} className="medcare-card-soft p-6">
                <h3 className="text-xl font-extrabold text-[#101828]">Reprogramar cita</h3>
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <select className="medcare-input" required value={reprogramacion.id_horario} onChange={(event) => setReprogramacion({ ...reprogramacion, id_horario: event.target.value })}>
                    <option value="">Nuevo horario</option>
                    {reprogramacion.horarios.map((horario) => <option key={horario.id_horario} value={horario.id_horario}>{horario.fecha} - {horario.hora_inicio} a {horario.hora_fin}</option>)}
                  </select>
                  <button type="submit" className="medcare-primary-button px-6 py-3">Guardar</button>
                  <button type="button" onClick={() => setReprogramacion(null)} className="medcare-secondary-button px-6 py-3">Cancelar</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {citas.length === 0 ? (
                <div className="medcare-card p-10 text-center text-[#52615f]">No tienes citas registradas.</div>
              ) : citas.map((cita) => (
                <article key={cita.id_cita} className="medcare-card flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-extrabold text-[#101828]">Dr. {cita.doctor}</h3>
                      <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${statusClass[cita.estado] || statusClass.pendiente}`}>{cita.estado}</span>
                    </div>
                    <p className="mt-2 text-[#52615f]">{cita.especialidad} · {formatDate(cita.fecha_hora)}</p>
                    {cita.motivo && <p className="mt-1 text-sm text-[#52615f]">{cita.motivo}</p>}
                  </div>
                  {!['cancelada', 'completada'].includes(cita.estado) && (
                    <div className="flex gap-3">
                      <button onClick={() => abrirReprogramacion(cita)} className="medcare-secondary-button px-4 py-3">Reprogramar</button>
                      <button onClick={() => handleCancelar(cita.id_cita)} className="rounded-xl border border-[#ffb4ab] bg-white px-4 py-3 font-extrabold text-[#93000a]">Cancelar</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
