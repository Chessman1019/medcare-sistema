import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
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

function usePickerSurface(open, setOpen, wrapperRef, closeLockedRef) {
  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (closeLockedRef.current) return
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeLockedRef, open, setOpen, wrapperRef])
}

function WheelColumn({ label, items, value, onChange, onDragLockChange }) {
  const listRef = useRef(null)
  const scrollTimer = useRef(null)
  const dragState = useRef({ dragging: false, moved: false, startY: 0, startTop: 0 })
  const ignoreClick = useRef(false)
  const [dragging, setDragging] = useState(false)

  const getSelectableIndex = useCallback((index, direction = 0) => {
    if (!items.length) return -1
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1))
    if (!items[clampedIndex]?.disabled) return clampedIndex

    const preferredDirection = direction || 1
    for (let offset = 1; offset < items.length; offset += 1) {
      const first = clampedIndex + (offset * preferredDirection)
      if (items[first] && !items[first].disabled) return first

      const second = clampedIndex - (offset * preferredDirection)
      if (items[second] && !items[second].disabled) return second
    }
    return -1
  }, [items])

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    listRef.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior })
  }, [])

  const selectIndex = useCallback((index, behavior = 'smooth', direction = 0) => {
    const selectableIndex = getSelectableIndex(index, direction)
    if (selectableIndex < 0) return

    scrollToIndex(selectableIndex, behavior)
    const item = items[selectableIndex]
    if (item && item.value !== value) onChange(item.value)
  }, [getSelectableIndex, items, onChange, scrollToIndex, value])

  const commitFromScroll = useCallback((behavior = 'smooth', direction = 0) => {
    const top = listRef.current?.scrollTop || 0
    selectIndex(Math.round(top / ITEM_HEIGHT), behavior, direction)
  }, [selectIndex])

  const beginDrag = useCallback((clientY) => {
    if (!listRef.current) return
    window.clearTimeout(scrollTimer.current)
    onDragLockChange?.(true)
    dragState.current = {
      dragging: true,
      moved: false,
      startY: clientY,
      startTop: listRef.current.scrollTop,
    }
    setDragging(true)
  }, [onDragLockChange])

  const moveDrag = useCallback((clientY) => {
    const state = dragState.current
    if (!state.dragging || !listRef.current) return

    const delta = clientY - state.startY
    if (Math.abs(delta) > 3) state.moved = true
    listRef.current.scrollTop = state.startTop - delta
  }, [])

  const endDrag = useCallback(() => {
    const moved = dragState.current.moved
    dragState.current.dragging = false
    setDragging(false)

    if (moved) {
      ignoreClick.current = true
      window.setTimeout(() => { ignoreClick.current = false }, 140)
    }
    onDragLockChange?.(false)
    commitFromScroll('smooth')
  }, [commitFromScroll, onDragLockChange])

  const scheduleCommit = useCallback((direction = 0) => {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => commitFromScroll('smooth', direction), 70)
  }, [commitFromScroll])

  useEffect(() => {
    const index = items.findIndex(item => item.value === value)
    if (index < 0 || !listRef.current) return
    listRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
  }, [items, value])

  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  useEffect(() => {
    if (!dragging) return undefined

    const handleMouseMove = (event) => {
      event.preventDefault()
      moveDrag(event.clientY)
    }
    const handleMouseUp = (event) => {
      event.preventDefault()
      endDrag()
    }
    const handleTouchMove = (event) => {
      if (!event.touches[0]) return
      event.preventDefault()
      moveDrag(event.touches[0].clientY)
    }
    const handleTouchEnd = (event) => {
      event.preventDefault()
      endDrag()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [dragging, moveDrag, endDrag])

  const handleScroll = () => {
    if (dragState.current.dragging) return
    scheduleCommit()
  }

  const handleWheel = (event) => {
    if (!listRef.current) return
    event.preventDefault()
    event.stopPropagation()

    const deltaUnit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? ITEM_HEIGHT : 1
    const delta = event.deltaY * deltaUnit
    const direction = Math.sign(delta)
    listRef.current.scrollTop += direction * Math.min(Math.abs(delta), ITEM_HEIGHT)
    scheduleCommit(direction)
  }

  const handleMouseDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    beginDrag(event.clientY)
  }

  const handleTouchStart = (event) => {
    if (!event.touches[0]) return
    beginDrag(event.touches[0].clientY)
  }

  const handleKeyDown = (event) => {
    const currentIndex = items.findIndex(item => item.value === value)
    if (currentIndex < 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectIndex(currentIndex + 1, 'smooth', 1)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectIndex(currentIndex - 1, 'smooth', -1)
    }
    if (event.key === 'PageDown') {
      event.preventDefault()
      selectIndex(currentIndex + 5, 'smooth', 1)
    }
    if (event.key === 'PageUp') {
      event.preventDefault()
      selectIndex(currentIndex - 5, 'smooth', -1)
    }
  }

  const handleOptionClick = (event, item, index) => {
    if (ignoreClick.current || item.disabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    selectIndex(index)
  }

  const handleOptionMouseDown = (event) => {
    event.preventDefault()
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[11px] font-extrabold uppercase text-[#006b5d]">{label}</p>
      <div className="medcare-wheel-column">
        <div className="medcare-wheel-selection" aria-hidden="true" />
        <div
          ref={listRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onKeyDown={handleKeyDown}
          className={`medcare-wheel-list ${dragging ? 'is-dragging' : ''}`}
          role="listbox"
          aria-label={label}
          tabIndex={0}
        >
          {items.map((item, index) => (
            <button
              type="button"
              key={item.value}
              disabled={item.disabled}
              className={`medcare-wheel-option ${item.value === value ? 'is-active' : ''}`}
              onMouseDown={handleOptionMouseDown}
              onClick={event => handleOptionClick(event, item, index)}
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
  const closeLockedRef = useRef(false)
  const unlockTimer = useRef(null)
  const [open, setOpen] = useState(false)
  const today = getLimaDateInputValue()
  const minValue = parseDateValue(min) ? min : undefined
  const maxValue = parseDateValue(max) ? max : undefined
  const fallback = parseDateValue(initialValue) ? initialValue : minValue || maxValue || today
  const selected = clampDateParts(parseDateValue(value) || parseDateValue(fallback), minValue, maxValue)

  const setDragCloseLock = useCallback((locked) => {
    window.clearTimeout(unlockTimer.current)
    if (locked) {
      closeLockedRef.current = true
      return
    }
    unlockTimer.current = window.setTimeout(() => {
      closeLockedRef.current = false
    }, 220)
  }, [])

  useEffect(() => () => window.clearTimeout(unlockTimer.current), [])

  usePickerSurface(open, setOpen, wrapperRef, closeLockedRef)

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
              <p className="text-sm font-bold text-[#101828]">{displayValue || 'Elige día, mes y año'}</p>
            </div>
            <button type="button" className="rounded-lg p-2 text-[#52615f] transition hover:bg-[#f4fffc]" onClick={() => setOpen(false)} aria-label="Cerrar selector de fecha">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 p-4">
            <WheelColumn label="Día" items={dayItems} value={selected.day} onChange={day => updateParts({ ...selected, day })} onDragLockChange={setDragCloseLock} />
            <WheelColumn label="Mes" items={monthItems} value={selected.month} onChange={month => updateParts({ ...selected, month })} onDragLockChange={setDragCloseLock} />
            <WheelColumn label="Año" items={years} value={selected.year} onChange={year => updateParts({ ...selected, year })} onDragLockChange={setDragCloseLock} />
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
  const closeLockedRef = useRef(false)
  const unlockTimer = useRef(null)
  const [open, setOpen] = useState(false)
  const selected = timeValueToParts(value, initialValue)

  const setDragCloseLock = useCallback((locked) => {
    window.clearTimeout(unlockTimer.current)
    if (locked) {
      closeLockedRef.current = true
      return
    }
    unlockTimer.current = window.setTimeout(() => {
      closeLockedRef.current = false
    }, 220)
  }, [])

  useEffect(() => () => window.clearTimeout(unlockTimer.current), [])

  usePickerSurface(open, setOpen, wrapperRef, closeLockedRef)

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
            <WheelColumn label="Hora" items={hourItems} value={selected.hour12} onChange={hour12 => updateParts({ ...selected, hour12 })} onDragLockChange={setDragCloseLock} />
            <WheelColumn label="Min" items={minuteItems} value={selected.minute} onChange={minute => updateParts({ ...selected, minute })} onDragLockChange={setDragCloseLock} />
            <WheelColumn label="Periodo" items={periodItems} value={selected.period} onChange={period => updateParts({ ...selected, period })} onDragLockChange={setDragCloseLock} />
          </div>
        </div>
      )}
    </div>
  )
}
