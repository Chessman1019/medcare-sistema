const LIMA_TIME_ZONE = 'America/Lima'

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: LIMA_TIME_ZONE,
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: LIMA_TIME_ZONE,
})

const timeFormatter = new Intl.DateTimeFormat('es-PE', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: LIMA_TIME_ZONE,
})

const patientTitleByType = {
  cita_confirmada: 'Tu cita fue aprobada',
  cita_cancelada: 'Tu cita fue cancelada',
  cita_reprogramada: 'Tu cita fue reprogramada',
  recordatorio_cita_pendiente: 'Recordatorio de cita',
  recordatorio_24h: 'Recordatorio de cita',
  cita_creada: 'Solicitud de cita registrada',
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getAppointmentEnd(notification) {
  const explicitEnd = parseDate(notification.fecha_fin)
  if (explicitEnd) return explicitEnd

  const start = parseDate(notification.fecha_hora || notification.fecha_programada)
  if (!start) return null

  const duration = Number(notification.duracion_min)
  const minutes = Number.isFinite(duration) && duration > 0 ? duration : 30
  return new Date(start.getTime() + (minutes * 60 * 1000))
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : parseDate(value)
  return date ? dateTimeFormatter.format(date) : 'Sin fecha'
}

function formatDate(value) {
  const date = value instanceof Date ? value : parseDate(value)
  return date ? dateFormatter.format(date) : 'Sin fecha'
}

export function formatNotificationTime(value) {
  const date = parseDate(value)
  return date ? timeFormatter.format(date) : ''
}

function normalizePatient(notification) {
  const patient = notification.paciente || notification.nombre_paciente || ''
  if (!patient || String(patient).toLowerCase().includes('sin registrar')) return 'Sin registrar'
  return patient
}

function normalizeDoctor(notification) {
  const doctor = notification.doctor || notification.nombre_doctor || ''
  if (!doctor) return 'Sin asignar'
  return /^dr(a)?\.?\s/i.test(doctor.trim()) ? doctor : `Dr. ${doctor}`
}

export function buildAppointmentNotificationDetails(notification) {
  const details = [
    { label: 'Paciente', value: normalizePatient(notification) },
    { label: 'Inicio', value: formatDateTime(notification.fecha_hora || notification.fecha_programada) },
    { label: 'Fin', value: formatDateTime(getAppointmentEnd(notification)) },
    { label: 'Doctor', value: normalizeDoctor(notification) },
    { label: 'Especialidad', value: notification.especialidad || 'Sin especialidad' },
  ]

  if (notification.tipo === 'cita_finalizada_pendiente_gestion') {
    details.push({
      label: 'Acción requerida',
      value: 'Completar si fue atendida o cancelar si el paciente no asistió.',
    })
  }

  return details
}

function getPatientTitleFromMessage(message = '') {
  const firstSentence = String(message).split('·')[0].split('. ')[0].trim()
  if (!firstSentence) return ''
  if (/confirmada asignada/i.test(firstSentence)) return 'Tienes una cita confirmada'
  return firstSentence.replace(/\.$/, '')
}

export function getPatientAppointmentNotificationTitle(notification) {
  const fromMessage = getPatientTitleFromMessage(notification.mensaje)
  if (fromMessage) return fromMessage
  return patientTitleByType[notification.tipo] || 'Actualizacion de tu cita'
}

export function buildPatientAppointmentNotificationDetails(notification) {
  const start = parseDate(notification.fecha_hora || notification.fecha_programada)
  const end = getAppointmentEnd(notification)
  const details = [
    { label: 'Especialidad', value: notification.especialidad || 'Sin especialidad' },
    { label: 'Doctor', value: normalizeDoctor(notification) },
  ]

  if (start) {
    details.push({ label: 'Fecha', value: formatDate(start) })
    if (end) {
      details.push({ label: 'Inicio', value: timeFormatter.format(start) })
      details.push({ label: 'Fin', value: timeFormatter.format(end) })
    } else {
      details.push({ label: 'Hora', value: timeFormatter.format(start) })
    }
  }

  return details
}

export function getPatientAppointmentNotificationDescription(notification) {
  const details = buildPatientAppointmentNotificationDetails(notification)
  if (details.length > 2) return ''

  const patient = normalizePatient(notification).toLowerCase()
  return String(notification.mensaje || '')
    .split('·')
    .map(part => part.trim())
    .filter(part => part && part.toLowerCase() !== patient)
    .filter(part => !/^\d{4}-\d{2}-\d{2}t/i.test(part))
    .join(' · ')
}

export function getAppointmentNotificationTime(notification) {
  const source = notification.tipo === 'cita_finalizada_pendiente_gestion'
    ? notification.fecha_fin || notification.fecha_programada || notification.fecha_hora
    : notification.fecha_hora || notification.fecha_programada || notification.fecha_fin

  return formatNotificationTime(source)
}
