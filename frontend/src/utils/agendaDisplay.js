export function formatAgendaDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' })
}

export function formatAgendaDate(value) {
  if (!value) return 'Sin fecha'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-PE', { dateStyle: 'medium', timeZone: match ? 'UTC' : 'America/Lima' })
}

export function getAppointmentEnd(cita) {
  if (cita?.fecha_fin) return cita.fecha_fin
  if (!cita?.fecha_hora) return null

  const start = new Date(cita.fecha_hora)
  if (Number.isNaN(start.getTime())) return null

  const duration = Number(cita.duracion_min)
  const minutes = Number.isFinite(duration) && duration >= 0 ? duration : 30
  return new Date(start.getTime() + minutes * 60000).toISOString()
}
