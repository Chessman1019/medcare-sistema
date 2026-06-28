function getLimaParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  return Object.fromEntries(parts.map(part => [part.type, part.value]))
}

export function getLimaDateInputValue() {
  const parts = getLimaParts()
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function getLimaTimeInputValue() {
  const parts = getLimaParts()
  return `${parts.hour}:${parts.minute}`
}

export function normalizeTimeValue(value) {
  if (!value) return ''
  return value.length === 5 ? `${value}:00` : value.slice(0, 8)
}

export function isPastLimaSlot(fecha, horaInicio) {
  if (!fecha || !horaInicio) return false
  const today = getLimaDateInputValue()
  if (fecha < today) return true
  if (fecha > today) return false
  return horaInicio <= getLimaTimeInputValue()
}
