import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getLimaDateInputValue } from '../utils/limaTime'
import { formatTime12h, parseTimeValue } from '../utils/timeFormat'

const ITEM_HEIGHT = 44
const PANEL_MARGIN = 16
const DATE_PANEL_WIDTH = 384
const DATE_PANEL_HEIGHT = 470
const TIME_PANEL_WIDTH = 352
const TIME_PANEL_HEIGHT = 430
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
  const month = Math.max(1, Math.min(parts.month, 12))
  const normalized = {
    year: parts.year,
    month,
    day: Math.max(1, Math.min(parts.day, getDaysInMonth(parts.year, month))),
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

    const handleOutsidePointerDown = (event) => {
      const wrapper = wrapperRef.current
      const path = typeof event.composedPath === 'function' ? event.composedPath() : []
      const isInsidePicker = wrapper && (wrapper.contains(event.target) || path.includes(wrapper))
      if (!isInsidePicker) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setOpen, wrapperRef])
}

function useWheelPanelPosition(open, wrapperRef, preferredWidth, preferredHeight) {
  const [panelStyle, setPanelStyle] = useState(null)

  const updatePosition = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight
    const availableWidth = Math.max(220, viewportWidth - PANEL_MARGIN * 2)
    const panelWidth = Math.min(preferredWidth, availableWidth)
    const maxLeft = viewportWidth - panelWidth - PANEL_MARGIN
    const left = Math.max(PANEL_MARGIN, Math.min(rect.left, maxLeft))
    const belowTop = rect.bottom + 8
    const aboveTop = rect.top - preferredHeight - 8
    const top = belowTop + preferredHeight > viewportHeight - PANEL_MARGIN && aboveTop >= PANEL_MARGIN
      ? aboveTop
      : Math.max(PANEL_MARGIN, Math.min(belowTop, viewportHeight - PANEL_MARGIN - Math.min(preferredHeight, viewportHeight - PANEL_MARGIN * 2)))

    setPanelStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
      maxHeight: `${Math.max(260, viewportHeight - top - PANEL_MARGIN)}px`,
    })
  }, [preferredHeight, preferredWidth, wrapperRef])

  useLayoutEffect(() => {
    if (!open) return undefined

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  return panelStyle
}

function WheelColumn({ label, items, value, onChange }) {
  const listRef = useRef(null)
  const wheelResetTimer = useRef(null)
  const wheelAccumulator = useRef(0)
  const wheelTargetIndex = useRef(null)
  const currentIndex = items.findIndex(item => item.value === value)

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

  const getAdjacentIndex = useCallback((direction, fromIndex = currentIndex) => {
    if (!items.length) return -1

    const start = fromIndex >= 0
      ? fromIndex + direction
      : direction > 0 ? 0 : items.length - 1

    for (let index = start; index >= 0 && index < items.length; index += direction) {
      if (!items[index]?.disabled) return index
    }
    return -1
  }, [currentIndex, items])

  const scrollToIndex = useCallback((index) => {
    if (!listRef.current) return

    listRef.current.scrollTop = index * ITEM_HEIGHT
  }, [])

  const selectIndex = useCallback((index, direction = 0) => {
    const selectableIndex = getSelectableIndex(index, direction)
    if (selectableIndex < 0) return

    wheelTargetIndex.current = selectableIndex
    scrollToIndex(selectableIndex)
    const item = items[selectableIndex]
    if (item && item.value !== value) onChange(item.value)
  }, [getSelectableIndex, items, onChange, scrollToIndex, value])

  useLayoutEffect(() => {
    const index = items.findIndex(item => item.value === value)
    if (index < 0) return
    wheelTargetIndex.current = index
    scrollToIndex(index)
  }, [items, scrollToIndex, value])

  useEffect(() => () => {
    window.clearTimeout(wheelResetTimer.current)
  }, [])

  const handleWheel = (event) => {
    if (!listRef.current) return
    event.preventDefault()
    event.stopPropagation()
    window.clearTimeout(wheelResetTimer.current)

    const deltaUnit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? ITEM_HEIGHT : 1
    const delta = event.deltaY * deltaUnit
    if (!delta) return

    wheelAccumulator.current += delta
    if (Math.abs(wheelAccumulator.current) >= 20) {
      const direction = Math.sign(wheelAccumulator.current)
      const baseIndex = Number.isInteger(wheelTargetIndex.current) ? wheelTargetIndex.current : currentIndex
      const nextIndex = getAdjacentIndex(direction, baseIndex)

      wheelAccumulator.current = 0
      if (nextIndex >= 0) selectIndex(nextIndex, direction)
    }

    wheelResetTimer.current = window.setTimeout(() => {
      wheelAccumulator.current = 0
      wheelTargetIndex.current = null
    }, 180)
  }

  const handleMouseDown = (event) => {
    event.stopPropagation()
    listRef.current?.focus({ preventScroll: true })
  }

  const handleKeyDown = (event) => {
    const currentIndex = items.findIndex(item => item.value === value)
    if (currentIndex < 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectIndex(currentIndex + 1, 1)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectIndex(currentIndex - 1, -1)
    }
    if (event.key === 'PageDown') {
      event.preventDefault()
      selectIndex(currentIndex + 5, 1)
    }
    if (event.key === 'PageUp') {
      event.preventDefault()
      selectIndex(currentIndex - 5, -1)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectIndex(0, 1)
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectIndex(items.length - 1, -1)
    }
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }

  const handleOptionClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    listRef.current?.focus({ preventScroll: true })
  }

  const handleStepClick = (event, direction) => {
    event.preventDefault()
    event.stopPropagation()
    const nextIndex = getAdjacentIndex(direction)
    if (nextIndex >= 0) selectIndex(nextIndex, direction)
  }

  const previousIndex = getAdjacentIndex(-1)
  const nextIndex = getAdjacentIndex(1)

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[11px] font-extrabold uppercase text-[#006b5d]">{label}</p>
      <button
        type="button"
        className="medcare-wheel-arrow"
        onClick={event => handleStepClick(event, -1)}
        disabled={previousIndex < 0}
        aria-label={`Valor anterior de ${label}`}
      >
        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
      </button>
      <div className="medcare-wheel-column">
        <div className="medcare-wheel-selection" aria-hidden="true" />
        <div
          ref={listRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          className="medcare-wheel-list"
          role="listbox"
          aria-label={label}
          tabIndex={0}
        >
          {items.map((item, index) => (
            <button
              type="button"
              key={item.value}
              data-wheel-option-index={index}
              aria-disabled={item.disabled || undefined}
              className={`medcare-wheel-option ${item.value === value ? 'is-active' : ''} ${item.disabled ? 'is-disabled' : ''}`}
              onClick={handleOptionClick}
              role="option"
              aria-selected={item.value === value}
              tabIndex={-1}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="medcare-wheel-arrow"
        onClick={event => handleStepClick(event, 1)}
        disabled={nextIndex < 0}
        aria-label={`Valor siguiente de ${label}`}
      >
        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
      </button>
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
  const panelStyle = useWheelPanelPosition(open, wrapperRef, DATE_PANEL_WIDTH, DATE_PANEL_HEIGHT)

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
  const maxDay = getDaysInMonth(selected.year, selected.month)
  const yearMin = years[0]?.value || 1900
  const yearMax = years[years.length - 1]?.value || new Date().getFullYear() + 5

  const handleManualDay = (event) => {
    const day = Number(event.target.value)
    if (!Number.isInteger(day) || day < 1 || day > 31) return
    updateParts({ ...selected, day })
  }

  const handleManualMonth = (event) => {
    const month = Number(event.target.value)
    if (!Number.isInteger(month) || month < 1 || month > 12) return
    updateParts({ ...selected, month })
  }

  const handleManualYear = (event) => {
    const year = Number(event.target.value)
    if (!Number.isInteger(year) || year < 1) return
    updateParts({ ...selected, year })
  }

  const stopPickerInteraction = (event) => {
    event.stopPropagation()
  }

  const stopEnterSubmit = (event) => {
    if (event.key === 'Enter') event.preventDefault()
  }

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
        <div
          className="medcare-wheel-panel"
          style={panelStyle || undefined}
          role="dialog"
          aria-labelledby={generatedId}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#edf2ff] px-4 py-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-[#006b5d]">Fecha</p>
              <p className="text-sm font-bold text-[#101828]">{displayValue || 'Elige día, mes y año'}</p>
            </div>
            <button type="button" className="rounded-lg p-2 text-[#52615f] transition hover:bg-[#f4fffc]" onClick={() => setOpen(false)} aria-label="Cerrar selector de fecha">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="medcare-wheel-grid medcare-wheel-grid-date">
            <WheelColumn label="Día" items={dayItems} value={selected.day} onChange={day => updateParts({ ...selected, day })} />
            <WheelColumn label="Mes" items={monthItems} value={selected.month} onChange={month => updateParts({ ...selected, month })} />
            <WheelColumn label="Año" items={years} value={selected.year} onChange={year => updateParts({ ...selected, year })} />
          </div>
          <div className="medcare-wheel-manual">
            <label className="medcare-wheel-field">
              <span>Día</span>
              <input
                type="number"
                min="1"
                max={maxDay}
                value={selected.day}
                onChange={handleManualDay}
                onPointerDown={stopPickerInteraction}
                onClick={stopPickerInteraction}
                onWheel={stopPickerInteraction}
                onKeyDown={stopEnterSubmit}
                className="medcare-wheel-manual-control"
              />
            </label>
            <label className="medcare-wheel-field">
              <span>Mes</span>
              <select
                value={selected.month}
                onChange={handleManualMonth}
                onPointerDown={stopPickerInteraction}
                onClick={stopPickerInteraction}
                onWheel={stopPickerInteraction}
                className="medcare-wheel-manual-control"
              >
                {monthItems.map(item => (
                  <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="medcare-wheel-field">
              <span>Año</span>
              <input
                type="number"
                min={yearMin}
                max={yearMax}
                value={selected.year}
                onChange={handleManualYear}
                onPointerDown={stopPickerInteraction}
                onClick={stopPickerInteraction}
                onWheel={stopPickerInteraction}
                onKeyDown={stopEnterSubmit}
                className="medcare-wheel-manual-control"
              />
            </label>
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
  const panelStyle = useWheelPanelPosition(open, wrapperRef, TIME_PANEL_WIDTH, TIME_PANEL_HEIGHT)

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

  const handleManualHour = (event) => {
    const hour12 = Number(event.target.value)
    if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) return
    updateParts({ ...selected, hour12 })
  }

  const handleManualMinute = (event) => {
    const minute = Number(event.target.value)
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return
    updateParts({ ...selected, minute })
  }

  const handleManualPeriod = (event) => {
    updateParts({ ...selected, period: event.target.value })
  }

  const stopPickerInteraction = (event) => {
    event.stopPropagation()
  }

  const stopEnterSubmit = (event) => {
    if (event.key === 'Enter') event.preventDefault()
  }

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
        <div
          className="medcare-wheel-panel medcare-wheel-panel-time"
          style={panelStyle || undefined}
          role="dialog"
          aria-labelledby={generatedId}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#edf2ff] px-4 py-3">
            <div>
              <p className="text-xs font-extrabold uppercase text-[#006b5d]">Hora</p>
              <p className="text-sm font-bold text-[#101828]">{displayValue || 'Elige hora y minutos'}</p>
            </div>
            <button type="button" className="rounded-lg p-2 text-[#52615f] transition hover:bg-[#f4fffc]" onClick={() => setOpen(false)} aria-label="Cerrar selector de hora">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="medcare-wheel-grid medcare-wheel-grid-time">
            <WheelColumn label="Hora" items={hourItems} value={selected.hour12} onChange={hour12 => updateParts({ ...selected, hour12 })} />
            <WheelColumn label="Min" items={minuteItems} value={selected.minute} onChange={minute => updateParts({ ...selected, minute })} />
            <WheelColumn label="Periodo" items={periodItems} value={selected.period} onChange={period => updateParts({ ...selected, period })} />
          </div>
          <div className="medcare-wheel-manual medcare-wheel-manual-time">
            <label className="medcare-wheel-field">
              <span>Hora</span>
              <input
                type="number"
                min="1"
                max="12"
                value={selected.hour12}
                onChange={handleManualHour}
                onPointerDown={stopPickerInteraction}
                onClick={stopPickerInteraction}
                onWheel={stopPickerInteraction}
                onKeyDown={stopEnterSubmit}
                className="medcare-wheel-manual-control"
              />
            </label>
            <label className="medcare-wheel-field">
              <span>Min</span>
              <input
                type="number"
                min="0"
                max="59"
                value={selected.minute}
                onChange={handleManualMinute}
                onPointerDown={stopPickerInteraction}
                onClick={stopPickerInteraction}
                onWheel={stopPickerInteraction}
                onKeyDown={stopEnterSubmit}
                className="medcare-wheel-manual-control"
              />
            </label>
            <label className="medcare-wheel-field">
              <span>Periodo</span>
              <select
                value={selected.period}
                onChange={handleManualPeriod}
                onPointerDown={stopPickerInteraction}
                onClick={stopPickerInteraction}
                onWheel={stopPickerInteraction}
                className="medcare-wheel-manual-control"
              >
                {periodItems.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
