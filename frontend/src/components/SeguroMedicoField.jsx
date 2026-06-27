import { useEffect, useMemo, useRef, useState } from 'react'
import { getSegurosMedicos } from '../services/api'

const NEW_VALUE = '__nuevo_seguro_medico__'
const selectAdornmentClass = 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#52615f]'
const helperButtonClass = 'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold text-[#006b5d] transition hover:bg-[#e5fbf7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20'

function normalizeSeguro(value = '') {
  return String(value).normalize('NFKC').trim().replace(/\s+/g, ' ')
}

function normalizeKey(value = '') {
  return normalizeSeguro(value).toLocaleLowerCase('es-PE')
}

export default function SeguroMedicoField({
  value = '',
  onChange,
  label = 'Seguro médico',
  className = '',
  inputClassName = 'medcare-input mt-2',
  required = false,
  disabled = false,
}) {
  const [seguros, setSeguros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const customInputRef = useRef(null)

  useEffect(() => {
    let active = true

    getSegurosMedicos()
      .then((res) => {
        if (!active) return
        const unique = new Map()
        const items = res.data || []
        items.forEach((item) => {
          const normalized = normalizeSeguro(item)
          if (normalized) unique.set(normalizeKey(normalized), normalized)
        })
        setSeguros([...unique.values()].sort((a, b) => a.localeCompare(b, 'es-PE')))
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los seguros registrados.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const selectedSeguro = useMemo(() => {
    const key = normalizeKey(value)
    if (!key) return ''
    return seguros.find((seguro) => normalizeKey(seguro) === key) || ''
  }, [seguros, value])

  const hasCustomValue = Boolean(normalizeSeguro(value)) && !selectedSeguro
  const showCustomInput = customMode || hasCustomValue
  const selectValue = showCustomInput ? NEW_VALUE : selectedSeguro

  useEffect(() => {
    if (showCustomInput) customInputRef.current?.focus()
  }, [showCustomInput])

  const handleSelect = (event) => {
    const nextValue = event.target.value
    if (nextValue === NEW_VALUE) {
      setCustomMode(true)
      if (!hasCustomValue) onChange?.('')
      return
    }
    setCustomMode(false)
    onChange?.(nextValue)
  }

  const handleCustomBlur = () => {
    const normalized = normalizeSeguro(value)
    if (normalized !== value) onChange?.(normalized)
  }

  const openCustomMode = () => {
    setCustomMode(true)
    if (!hasCustomValue) onChange?.('')
  }

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-[#223330]">
        {label}
        <div className="relative">
          <select
            className={`${inputClassName} appearance-none pr-11`}
            value={selectValue}
            onChange={handleSelect}
            required={required && !showCustomInput}
            disabled={disabled || loading}
          >
            <option value="">{loading ? 'Cargando seguros...' : 'Sin seguro / particular'}</option>
            {seguros.map((seguro) => (
              <option key={seguro} value={seguro}>{seguro}</option>
            ))}
            <option value={NEW_VALUE}>Agregar nuevo seguro médico</option>
          </select>
          <span className={selectAdornmentClass}>
            <span className="material-symbols-outlined text-[22px]">expand_more</span>
          </span>
        </div>
      </label>

      {!showCustomInput && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#52615f]">
          <span>Elige uno registrado para evitar duplicados.</span>
          <button type="button" onClick={openCustomMode} className={helperButtonClass} disabled={disabled}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nuevo seguro
          </button>
        </div>
      )}

      {showCustomInput && (
        <label className="mt-3 block text-sm font-bold text-[#223330]">
          Nuevo seguro médico
          <input
            ref={customInputRef}
            className={inputClassName}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            onBlur={handleCustomBlur}
            placeholder="Ej. SIS, EsSalud, EPS..."
            required={required}
            disabled={disabled}
            autoComplete="off"
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-[#93000a]">{error}</p>}
    </div>
  )
}
