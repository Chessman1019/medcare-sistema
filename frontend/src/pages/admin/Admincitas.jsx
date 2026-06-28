import { useMemo, useState } from 'react'
import HorarioDisponibleForm from '../../components/HorarioDisponibleForm'

const statusClass = {
  pendiente:    'bg-[#f5f5f2] text-[#46514f]',
  confirmada:   'bg-[#d8f4ee] text-[#006b5d]',
  cancelada:    'bg-[#ffdad6] text-[#93000a]',
  completada:   'bg-[#d8e5e2] text-[#293533]',
  reprogramada: 'bg-[#e8edff] text-[#355382]',
  en_atencion:  'bg-[#dff8fb] text-[#006b5d]',
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminCitas({ citas, doctores = [], especialidades, onAccion, onRefresh, onCrearHorario }) {
  const [filtros, setFiltros] = useState({ estado: '', especialidad: '', doctor: '', fecha: '' })
  const [mostrarHorarioForm, setMostrarHorarioForm] = useState(false)

  const citasFiltradas = useMemo(() => {
    let resultado = [...citas]
    if (filtros.estado) resultado = resultado.filter(c => c.estado === filtros.estado)
    if (filtros.especialidad) resultado = resultado.filter(c => c.especialidad === filtros.especialidad)
    if (filtros.doctor) resultado = resultado.filter(c => c.doctor?.toLowerCase().includes(filtros.doctor.toLowerCase()))
    if (filtros.fecha) resultado = resultado.filter(c => c.fecha_hora?.startsWith(filtros.fecha))
    return resultado
  }, [citas, filtros])

  const aplicarFiltros = (nuevosFiltros) => setFiltros(nuevosFiltros)

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
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f8fbff] text-xs uppercase text-[#223330]">
              <tr>
                {['#', 'Paciente', 'Doctor', 'Especialidad', 'Fecha', 'Tipo', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-4 font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bdcbc7]">
              {citasFiltradas.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#52615f]">No hay citas con esos filtros</td></tr>
              ) : citasFiltradas.map((c, i) => (
                <tr key={c.id_cita} className="bg-white transition hover:bg-[#f8fbff]">
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
                  <td className="px-5 py-4">
                    <span className="text-xs bg-[#edf2ff] text-[#355382] px-2 py-0.5 rounded-full font-bold">{c.tipo_atencion}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${statusClass[c.estado] || statusClass.pendiente}`}>{c.estado}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {c.estado === 'pendiente' && (
                        <button onClick={() => onAccion(c.id_cita, 'confirmar')}
                          className="rounded-lg p-2 text-[#006b5d] hover:bg-[#d8f4ee] transition" title="Confirmar">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                      )}
                      {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                        <button onClick={() => onAccion(c.id_cita, 'cancelar')}
                          className="rounded-lg p-2 text-[#93000a] hover:bg-[#fff0ef] transition" title="Cancelar">
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                        </button>
                      )}
                      {c.estado === 'confirmada' && (
                        <button onClick={() => onAccion(c.id_cita, 'completar')}
                          className="rounded-lg p-2 text-[#355382] hover:bg-[#e8edff] transition" title="Completar">
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
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
    </div>
  )
}
