import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const PANEL_MARGIN = 12
const MAX_PANEL_HEIGHT = 280

function normalizeValue(value) {
  return value == null ? '' : String(value)
}

function useSelectSurface(open, setOpen, wrapperRef, panelRef) {
  useEffect(() => {
    if (!open) return undefined

    const handleOutsidePointerDown = (event) => {
      const wrapper = wrapperRef.current
      const panel = panelRef.current
      const path = typeof event.composedPath === 'function' ? event.composedPath() : []
      const isInside = (wrapper && (wrapper.contains(event.target) || path.includes(wrapper)))
        || (panel && (panel.contains(event.target) || path.includes(panel)))
      if (!isInside) setOpen(false)
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
  }, [open, panelRef, setOpen, wrapperRef])
}

function useSelectPanelPosition(open, wrapperRef, panelRef) {
  const [panelStyle, setPanelStyle] = useState(null)

  const updatePosition = useCallback(() => {
    const wrapper = wrapperRef.current
    const panel = panelRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight
    const panelHeight = panel?.offsetHeight || MAX_PANEL_HEIGHT
    const width = rect.width
    const left = Math.max(PANEL_MARGIN, Math.min(rect.left, viewportWidth - width - PANEL_MARGIN))
    const belowTop = rect.bottom + 6
    const aboveTop = rect.top - panelHeight - 6
    const top = belowTop + panelHeight > viewportHeight - PANEL_MARGIN && aboveTop >= PANEL_MARGIN
      ? aboveTop
      : Math.max(PANEL_MARGIN, Math.min(belowTop, viewportHeight - PANEL_MARGIN - 120))

    setPanelStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `${Math.min(MAX_PANEL_HEIGHT, viewportHeight - top - PANEL_MARGIN)}px`,
    })
  }, [panelRef, wrapperRef])

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

export default function MedCareSelect({
  value = '',
  onChange,
  options = [],
  disabled = false,
  required = false,
  className = 'medcare-input',
  id,
  name,
  'aria-label': ariaLabel,
  placeholder,
  error = false,
}) {
  const generatedId = useId()
  const triggerId = id || generatedId
  const listboxId = `${triggerId}-listbox`
  const wrapperRef = useRef(null)
  const panelRef = useRef(null)
  const listRef = useRef(null)
  const hiddenSelectRef = useRef(null)
  const typeBuffer = useRef('')
  const typeResetTimer = useRef(null)
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const stringValue = normalizeValue(value)

  const enabledOptions = useMemo(
    () => options.map((option, index) => ({ ...option, index })).filter(option => !option.disabled),
    [options],
  )

  const selectedIndex = useMemo(
    () => options.findIndex(option => normalizeValue(option.value) === stringValue),
    [options, stringValue],
  )

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null

  const emptyOption = useMemo(
    () => options.find(option => normalizeValue(option.value) === ''),
    [options],
  )

  const displayLabel = selectedOption?.label
    || emptyOption?.label
    || placeholder
    || 'Seleccionar'

  const isPlaceholder = !selectedOption
    || (normalizeValue(selectedOption.value) === '' && Boolean(emptyOption || placeholder))

  useSelectSurface(open, setOpen, wrapperRef, panelRef)
  const panelStyle = useSelectPanelPosition(open, wrapperRef, panelRef)

  const emitChange = useCallback((nextValue) => {
    onChange?.({ target: { value: nextValue, name } })
  }, [name, onChange])

  const scrollOptionIntoView = useCallback((index) => {
    const list = listRef.current
    if (!list || index < 0) return
    const optionNode = list.querySelector(`[data-select-option-index="${index}"]`)
    optionNode?.scrollIntoView({ block: 'nearest' })
  }, [])

  const selectOption = useCallback((option) => {
    if (!option || option.disabled) return
    emitChange(option.value)
    setOpen(false)
    setFocusedIndex(option.index)
  }, [emitChange])

  const moveFocus = useCallback((direction) => {
    if (!enabledOptions.length) return

    const currentEnabledIndex = enabledOptions.findIndex(option => option.index === focusedIndex)
    const baseIndex = currentEnabledIndex >= 0 ? currentEnabledIndex : enabledOptions.findIndex(option => option.index === selectedIndex)
    const nextEnabledIndex = Math.max(0, Math.min(
      (baseIndex >= 0 ? baseIndex : 0) + direction,
      enabledOptions.length - 1,
    ))
    const nextIndex = enabledOptions[nextEnabledIndex]?.index ?? -1
    setFocusedIndex(nextIndex)
    scrollOptionIntoView(nextIndex)
  }, [enabledOptions, focusedIndex, scrollOptionIntoView, selectedIndex])

  const openPanel = useCallback(() => {
    if (disabled) return
    setOpen(true)
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : enabledOptions[0]?.index ?? -1)
  }, [disabled, enabledOptions, selectedIndex])

  useEffect(() => {
    if (!open) return undefined
    scrollOptionIntoView(focusedIndex >= 0 ? focusedIndex : selectedIndex)
    return undefined
  }, [focusedIndex, open, scrollOptionIntoView, selectedIndex])

  useEffect(() => () => {
    window.clearTimeout(typeResetTimer.current)
  }, [])

  useEffect(() => {
    const hiddenSelect = hiddenSelectRef.current
    if (!hiddenSelect) return undefined

    const handleInvalid = (event) => {
      event.preventDefault()
      wrapperRef.current?.querySelector('.medcare-select-trigger')?.focus()
    }

    hiddenSelect.addEventListener('invalid', handleInvalid)
    return () => hiddenSelect.removeEventListener('invalid', handleInvalid)
  }, [])

  const resetTypeBufferSoon = () => {
    window.clearTimeout(typeResetTimer.current)
    typeResetTimer.current = window.setTimeout(() => {
      typeBuffer.current = ''
    }, 700)
  }

  const findTypedIndex = (text) => {
    const normalized = text.trim().toLowerCase()
    if (!normalized) return -1

    const exactIndex = options.findIndex(option => !option.disabled && String(option.label).toLowerCase() === normalized)
    if (exactIndex >= 0) return exactIndex

    return options.findIndex(option => !option.disabled && String(option.label).toLowerCase().startsWith(normalized))
  }

  const handleTriggerKeyDown = (event) => {
    if (disabled) return

    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openPanel()
      return
    }

    if (!open) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(1)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(-1)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      const first = enabledOptions[0]
      if (first) {
        setFocusedIndex(first.index)
        scrollOptionIntoView(first.index)
      }
    }
    if (event.key === 'End') {
      event.preventDefault()
      const last = enabledOptions[enabledOptions.length - 1]
      if (last) {
        setFocusedIndex(last.index)
        scrollOptionIntoView(last.index)
      }
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const option = options[focusedIndex]
      if (option) selectOption(option)
    }
    if (/^[a-zA-Z0-9]$/.test(event.key)) {
      event.preventDefault()
      typeBuffer.current += event.key.toLowerCase()
      const typedIndex = findTypedIndex(typeBuffer.current)
      if (typedIndex >= 0) {
        setFocusedIndex(typedIndex)
        scrollOptionIntoView(typedIndex)
      } else {
        typeBuffer.current = event.key.toLowerCase()
        const fallbackIndex = findTypedIndex(typeBuffer.current)
        if (fallbackIndex >= 0) {
          setFocusedIndex(fallbackIndex)
          scrollOptionIntoView(fallbackIndex)
        }
      }
      resetTypeBufferSoon()
    }
  }

  const panel = open ? createPortal(
    <div
      ref={panelRef}
      className="medcare-select-panel"
      style={panelStyle || undefined}
      role="presentation"
    >
      <ul
        ref={listRef}
        id={listboxId}
        className="medcare-select-list"
        role="listbox"
        aria-labelledby={triggerId}
      >
        {options.map((option, index) => {
          const optionValue = normalizeValue(option.value)
          const isSelected = optionValue === stringValue
          const isFocused = index === focusedIndex

          return (
            <li key={`${optionValue}-${index}`} role="presentation">
              <button
                type="button"
                data-select-option-index={index}
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                className={`medcare-select-option ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}`}
                onMouseEnter={() => setFocusedIndex(index)}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  selectOption({ ...option, index })
                }}
              >
                <span className="medcare-select-option-label">{option.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined medcare-select-option-check" aria-hidden="true">check</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>,
    document.body,
  ) : null

  return (
    <div ref={wrapperRef} className="medcare-select">
      <button
        type="button"
        id={triggerId}
        className={`medcare-select-trigger ${className} ${isPlaceholder ? 'is-placeholder' : ''} ${open ? 'is-open' : ''} ${error ? 'medcare-input-invalid' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="medcare-select-value truncate">{displayLabel}</span>
        <span className="material-symbols-outlined medcare-select-icon" aria-hidden="true">expand_more</span>
      </button>

      {panel}

      <select
        ref={hiddenSelectRef}
        tabIndex={-1}
        aria-hidden="true"
        className="medcare-select-native"
        value={stringValue}
        name={name}
        required={required}
        disabled={disabled}
        onChange={() => {}}
      >
        {options.map((option, index) => (
          <option key={`${normalizeValue(option.value)}-${index}`} value={normalizeValue(option.value)} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
