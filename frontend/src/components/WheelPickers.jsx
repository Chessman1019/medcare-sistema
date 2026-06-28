import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { getLimaDateInputValue } from '../utils/limaTime'
import { formatTime12h, parseTimeValue } from '../utils/timeFormat'

const ITEM_HEIGHT = 44
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function pad2(value) {
  return String(value).padStart(2, '0')
}

function parseDateValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  if (month < 1 || month > 12) return null
  const maxDay = getDaysInMonth(year, month)
  if (day < 1 || day > maxDay) return null
  return { year, month, day }
}

function datePartsToValue(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function compareDateValues(left, right) {
  if (!left || !right) return 0
  return left.localeCompare(right)
}

function clampDateParts(parts, min, max) {
  const normalized = {
    year: parts.year,
    month: parts.month,
    day: Math.min(parts.day, getDaysInMonth(parts.year, parts.month)),
  }
  const value = datePartsToValue(normalized)
  if (min && compareDateValues(value, min) < 0) return parseDateValue(min)
  if (max && compareDateValues(value, max) > 0) return parseDateValue(max)
  return normalized
}

function formatDateDisplay(value) {
  const parts = parseDateValue(value)
  if (!parts) return ''
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function timePartsToValue(parts) {
  const hour24 = parts.period === 'PM'
    ? (parts.hour12 % 12) + 12
    : parts.hour12 % 12
  return `${pad2(hour24)}:${pad2(parts.minute)}`
}

function timeValueToParts(value, fallback = '09:00') {
  const parsed = parseTimeValue(value) || parseTimeValue(fallback) || { hour: 9, minute: 0 }
  return {
    hour12: parsed.hour % 12 || 12,
    minute: parsed.minute,
    period: parsed.hour >= 12 ? 'PM' : 'AM',
  }
}

function clampTimeValue(value, min, max) {
  if (min && value < min.slice(0, 5)) return min.slice(0, 5)
  if (max && value > max.slice(0, 5)) return max.slice(0, 5)
  return value
}

function usePickerSurface(open, setOpen, wrapperRef) {
  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setOpen, wrapperRef])
}

function WheelColumn({ label, items, value, onChange }) {
  const listRef = useRef(null)
  const scrollTimer = useRef(null)

  useEffect(() => {
    const index = items.findIndex(item => item.value === value)
    if (index < 0 || !listRef.current) return
    listRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
  }, [items, value])

  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  const handleScroll = () => {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => {
      const index = Math.round((listRef.current?.scrollTop || 0) / ITEM_HEIGHT)
      const item = items[Math.max(0, Math.min(index, items.length - 1))]
      if (item && !item.disabled && item.value !== value) onChange(item.value)
    }, 80)
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[11px] font-extrabold uppercase text-[#006b5d]">{label}</p>
      <div className="medcare-wheel-column">
        <div className="medcare-wheel-selection" aria-hidden="true" />
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="medcare-wheel-list"
          role="listbox"
          aria-label={label}
          tabIndex={0}
        >
          {items.map(item => (
            <button
              type="button"
              key={item.value}
              disabled={item.disabled}
              className={`medcare-wheel-option ${item.value === value ? 'is-active' : ''}`}
              onClick={() => !item.disabled && onChange(item.value)}
              role="option"
              aria-selected={item.value === value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DateWheelPicker({
  value,
  onChange,
  min,
  max,
  initialValue,
  placeholder = 'Seleccionar fecha',
  className = '',
  inputClassName = 'medcare-input',
  disabled = false,
  clearable = false,
}) {
  const generatedId = useId()
  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const today = getLimaDateInputValue()
  const minValue = parseDateValue(min) ? min : undefined
  const maxValue = parseDateValue(max) ? max : undefined
  const fallback = parseDateValue(initialValue) ? initialValue : minValue || maxValue || today
  const selected = clampDateParts(parseDateValue(value) || parseDateValue(fallback), minValue, maxValue)

  usePickerSurface(open, setOpen, wrapperRef)

  const years = useMemo(() => {
    const minYear = minValue ? parseDateValue(minValue).year : 1900
    const maxYear = maxValue ? parseDateValue(maxValue).year : new Date().getFullYear() + 5
    const start = Math.min(minYear, selected.year)
    const end = Math.max(maxYear, selected.year)
    return Array.from({ length: end - start + 1 }, (_, index) => {
      const year = start + index
      return { value: year, label: String(year) }
    })
  }, [maxValue, minValue, selected.year])

  const monthItems = MONTHS.map((label, index) => {
    const month = index + 1
    const firstDay = `${selected.year}-${pad2(month)}-01`
    const lastDay = `${selected.year}-${pad2(month)}-${pad2(getDaysInMonth(selected.year, month))}`
    return {
      value: month,
      label,
      disabled: (minValue && lastDay < minValue) || (maxValue && firstDay > maxValue),
    }
  })

  const dayItems = Array.from({ length: getDaysInMonth(selected.year, selected.month) }, (_, index) => {
    const day = index + 1
    const dateValue = datePartsToValue({ ...selected, day })
    return {
      value: day,
      label: pad2(day),
      disabled: (minValue && dateValue < minValue) || (maxValue && dateValue > maxValue),
    }
  })

  const updateParts = (nextParts) => {
    const clamped = clampDateParts(nextParts, minValue, maxValue)
    onChange(datePartsToValue(clamped))
  }

  const displayValue = formatDateDisplay(value)

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        id={generatedId}
        disabled={disabled}
        onClick={() => setOpen(current => !current)}
        className={`${inputClassName} medcare-wheel-trigger ${!displayValue ? 'text-[#52615f]' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <span className="material-symbols-outlined text-[18px] text-[#006b5d]">calendar_month</span>
      </button>

      {open && (
        <div className="medcare-wheel-panel" role="dialog" aria-labelledby={generatedId}>
          <div className="flex items-center justify-between gap-3 border-b border-[#edf2ff] px-4 py-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-[#006b5d]">Fecha</p>
              <p className="text-sm font-bold text-[#101828]">{displayValue || 'Elige dia, mes y anio'}</p>
            </div>
            <button type="button" className="rounded-lg p-2 text-[#52615f] transition hover:bg-[#f4fffc]" onClick={() => setOpen(false)} aria-label="Cerrar selector de fecha">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 p-4">
            <WheelColumn label="Dia" items={dayItems} value={selected.day} onChange={day => updateParts({ ...selected, day })} />
            <WheelColumn label="Mes" items={monthItems} value={selected.month} onChange={month => updateParts({ ...selected, month })} />
            <WheelColumn label="Anio" items={years} value={selected.year} onChange={year => updateParts({ ...selected, year })} />
          </div>
          {clearable && value && (
            <div className="border-t border-[#edf2ff] px-4 py-3">
              <button type="button" className="text-sm font-extrabold text-[#006b5d] hover:underline" onClick={() => onChange('')}>
                Limpiar fecha
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TimeWheelPicker({
  value,
  onChange,
  min,
  max,
  initialValue = '09:00',
  placeholder = 'Seleccionar hora',
  className = '',
  inputClassName = 'medcare-input',
  disabled = false,
}) {
  const generatedId = useId()
  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selected = timeValueToParts(value, initialValue)

  usePickerSurface(open, setOpen, wrapperRef)

  const updateParts = (nextParts) => {
    const nextValue = clampTimeValue(timePartsToValue(nextParts), min, max)
    onChange(nextValue)
  }

  const displayValue = formatTime12h(value)
  const hourItems = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 1
    return { value: hour, label: String(hour) }
  })
  const minuteItems = Array.from({ length: 60 }, (_, minute) => ({ value: minute, label: pad2(minute) }))
  const periodItems = [
    { value: 'AM', label: 'A. M.' },
    { value: 'PM', label: 'P. M.' },
  ]

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        id={generatedId}
        disabled={disabled}
        onClick={() => setOpen(current => !current)}
        className={`${inputClassName} medcare-wheel-trigger ${!displayValue ? 'text-[#52615f]' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <span className="material-symbols-outlined text-[18px] text-[#006b5d]">schedule</span>
      </button>

      {open && (
        <div className="medcare-wheel-panel medcare-wheel-panel-time" role="dialog" aria-labelledby={generatedId}>
          <div className="flex items-center justify-between gap-3 border-b border-[#edf2ff] px-4 py-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-[#006b5d]">Hora</p>
              <p className="text-sm font-bold text-[#101828]">{displayValue || 'Elige hora y minutos'}</p>
            </div>
            <button type="button" className="rounded-lg p-2 text-[#52615f] transition hover:bg-[#f4fffc]" onClick={() => setOpen(false)} aria-label="Cerrar selector de hora">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-3 p-4">
            <WheelColumn label="Hora" items={hourItems} value={selected.hour12} onChange={hour12 => updateParts({ ...selected, hour12 })} />
            <WheelColumn label="Min" items={minuteItems} value={selected.minute} onChange={minute => updateParts({ ...selected, minute })} />
            <WheelColumn label="Periodo" items={periodItems} value={selected.period} onChange={period => updateParts({ ...selected, period })} />
          </div>
        </div>
      )}
    </div>
  )
}
