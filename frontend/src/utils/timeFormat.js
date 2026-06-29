function pad2(value) {
  return String(value).padStart(2, '0')
}

export function parseTimeValue(value) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value || '')
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function formatTime12h(value) {
  const parsed = parseTimeValue(value)
  if (!parsed) return ''
  const hour12 = parsed.hour % 12 || 12
  const period = parsed.hour >= 12 ? 'p. m.' : 'a. m.'
  return `${hour12}:${pad2(parsed.minute)} ${period}`
}
