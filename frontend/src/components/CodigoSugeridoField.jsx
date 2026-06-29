import { useEffect } from 'react'

function normalizeCode(value = '') {
  return String(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase()
}

export default function CodigoSugeridoField({
  label,
  value = '',
  onChange,
  suggested = '',
  inputClassName = 'medcare-input mt-2',
  className = '',
  required = true,
  disabled = false,
}) {
  const normalizedSuggested = normalizeCode(suggested)
  const normalizedValue = normalizeCode(value)
  const showUseSuggested = Boolean(normalizedSuggested) && normalizedValue !== normalizedSuggested
  const helperText = normalizedSuggested ? `Siguiente: ${normalizedSuggested}` : 'Se asigna automáticamente al guardar'

  useEffect(() => {
    if (!value && normalizedSuggested) onChange?.(normalizedSuggested)
  }, [normalizedSuggested, onChange, value])

  const handleBlur = () => {
    const normalized = normalizeCode(value)
    if (normalized !== value) onChange?.(normalized)
  }

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-[#223330]">
        <span className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span>{label}</span>
          <span className="rounded-full bg-[#e5fbf7] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#006b5d]">
            {helperText}
          </span>
        </span>
        <div className="relative">
          <input
            className={`${inputClassName} pr-11`}
            autoComplete="off"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            onBlur={handleBlur}
            placeholder={normalizedSuggested}
            disabled={disabled}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#52615f]">
            <span className="material-symbols-outlined text-[21px]">tag</span>
          </span>
        </div>
      </label>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#52615f]">
        <span>Puedes modificarlo si necesitas usar un código específico.</span>
        {showUseSuggested && (
          <button
            type="button"
            onClick={() => onChange?.(normalizedSuggested)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-extrabold text-[#006b5d] transition hover:bg-[#e5fbf7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20"
            disabled={disabled}
          >
            <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
            Usar sugerido
          </button>
        )}
      </div>
    </div>
  )
}
