import { formatTime12h } from '../../utils/timeFormat'
import AgendaEmptyState from '../../components/AgendaEmptyState'
import AgendaStatusBadge from '../../components/AgendaStatusBadge'
import MedCareSelect from '../../components/MedCareSelect'
import { formatAgendaDateTime } from '../../utils/agendaDisplay'

const dangerButtonClass = 'rounded-xl border border-[#ffb4ab] bg-white px-4 py-3 font-extrabold text-[#93000a] transition hover:-translate-y-0.5 hover:bg-[#fff0ef] hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffb4ab]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

function isManageable(cita) { return cita && !['cancelada', 'completada'].includes(cita.estado) }

export default function PacienteCitas({ filteredCitas, reprogramacion, setReprogramacion, searchTerm, savingReprogramacion, cancelingId, onCancelar, onReprogramar, onGuardarReprogramacion, onAgendar }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Mis citas</h2>
        <p className="mt-2 text-lg text-[#52615f]">Historial, estados y gestión de tus atenciones.</p>
        {searchTerm && <p className="mt-1 text-sm text-[#52615f]">Mostrando resultados para: "{searchTerm}"</p>}
      </div>

      {reprogramacion && (
        <form noValidate onSubmit={onGuardarReprogramacion} className="medcare-card-soft p-6">
          <h3 className="text-xl font-extrabold text-[#101828]">Reprogramar cita con Dr. {reprogramacion.cita.doctor}</h3>
          <p className="mt-1 text-sm text-[#52615f]">Elige un nuevo horario libre.</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <MedCareSelect
              className="medcare-input"
              value={reprogramacion.id_horario}
              onChange={e => setReprogramacion(r => ({ ...r, id_horario: e.target.value }))}
              disabled={reprogramacion.loading}
              options={[
                { value: '', label: reprogramacion.loading ? 'Cargando horarios...' : 'Nuevo horario' },
                ...reprogramacion.horarios.map(h => ({
                  value: h.id_horario,
                  label: `${h.fecha} - ${formatTime12h(h.hora_inicio) || h.hora_inicio} a ${formatTime12h(h.hora_fin) || h.hora_fin}`,
                })),
              ]}
            />
            <button type="submit" disabled={savingReprogramacion || reprogramacion.loading || !reprogramacion.id_horario} className="medcare-primary-button px-6 py-3 disabled:opacity-60">
              {savingReprogramacion ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setReprogramacion(null)} className="medcare-secondary-button px-6 py-3">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {filteredCitas.length === 0 ? (
          <AgendaEmptyState
            icon={searchTerm ? 'manage_search' : 'event_available'}
            title={searchTerm ? 'No encontramos citas con esa busqueda' : 'Todavia no tienes citas registradas'}
            description={searchTerm ? 'Prueba con otro doctor, especialidad o estado.' : 'Agenda una cita y aqui veras el estado de tu solicitud.'}
            actionLabel="Nueva cita"
            onAction={onAgendar}
          />
        ) : filteredCitas.map(cita => (
          <article key={cita.id_cita} className="medcare-card flex flex-col gap-5 p-6 transition hover:-translate-y-0.5 hover:shadow-lg md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-extrabold text-[#101828]">Dr. {cita.doctor}</h3>
                <AgendaStatusBadge status={cita.estado} size="md" />
              </div>
              <p className="mt-2 text-[#52615f]">{cita.especialidad} · {formatAgendaDateTime(cita.fecha_hora)}</p>
              {cita.motivo && <p className="mt-1 text-sm text-[#52615f]">{cita.motivo}</p>}
            </div>
            {isManageable(cita) ? (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => onReprogramar(cita)} className="medcare-secondary-button px-4 py-3">Reprogramar</button>
                <button type="button" onClick={() => onCancelar(cita.id_cita)} disabled={cancelingId === cita.id_cita} className={dangerButtonClass}>
                  {cancelingId === cita.id_cita ? 'Cancelando...' : 'Cancelar'}
                </button>
              </div>
            ) : <span className="rounded-full bg-[#f5f5f2] px-4 py-2 text-sm font-bold text-[#52615f]">Cita cerrada</span>}
          </article>
        ))}
      </div>
    </div>
  )
}
