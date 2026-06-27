import { useEffect, useMemo, useRef, useState } from 'react'
import { getSegurosMedicos } from '../services/api'

const NEW_VALUE = '__nuevo_seguro_medico__'

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

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-[#223330]">
        {label}
        <select
          className={inputClassName}
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
      </label>

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
