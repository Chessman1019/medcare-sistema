import { useEffect, useMemo, useRef, useState } from 'react'
import { getSegurosMedicos } from '../services/api'
import MedCareSelect from './MedCareSelect'

const NEW_VALUE = '__nuevo_seguro_medico__'
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

  const seguroOptions = useMemo(() => ([
    { value: '', label: loading ? 'Cargando seguros...' : 'Sin seguro / particular' },
    ...seguros.map(seguro => ({ value: seguro, label: seguro })),
    { value: NEW_VALUE, label: 'Agregar nuevo seguro médico' },
  ]), [loading, seguros])

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-[#223330]">
        {label}
        <MedCareSelect
          className={inputClassName}
          value={selectValue}
          onChange={handleSelect}
          disabled={disabled || loading}
          options={seguroOptions}
        />
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
            disabled={disabled}
            autoComplete="off"
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-[#93000a]">{error}</p>}
    </div>
  )
}
