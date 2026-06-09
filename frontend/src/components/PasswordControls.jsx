/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'

export function getPasswordChecks(password = '') {
  return [
    {
      key: 'length',
      label: 'Mínimo 6 caracteres',
      valid: password.length >= 6,
    },
    {
      key: 'letters',
      label: 'Incluye letras',
      valid: /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(password),
    },
    {
      key: 'numbers',
      label: 'Incluye números',
      valid: /\d/.test(password),
    },
  ]
}

export function isPasswordValid(password = '') {
  return getPasswordChecks(password).every((item) => item.valid)
}

export function PasswordStrength({ password = '', className = '' }) {
  const checks = getPasswordChecks(password)
  const strength = checks.filter((item) => item.valid).length

  return (
    <div className={`rounded-lg bg-slate-50 p-4 ${className}`}>
      <div className="mb-3 flex gap-2" aria-hidden="true">
        {checks.map((item, index) => (
          <div
            key={item.key}
            className={`h-2 flex-1 rounded-full transition ${index < strength ? 'bg-[#12b8a3]' : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3" aria-live="polite">
        {checks.map((item) => (
          <span key={item.key} className={`flex items-center gap-2 ${item.valid ? 'text-[#006b5d]' : 'text-slate-500'}`}>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                item.valid ? 'border-[#007a68] bg-[#007a68]' : 'border-slate-400 bg-white'
              }`}
              aria-label={item.valid ? 'Requisito cumplido' : 'Requisito pendiente'}
            >
              {item.valid && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function PasswordField({
  label,
  value,
  onChange,
  className = '',
  inputClassName = 'medcare-input',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false)
  const inputId = inputProps.id || inputProps.name || `password-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={`block text-sm font-bold text-[#223330] ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className="relative mt-2">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${inputClassName} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#e5fbf7] hover:text-[#006b5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-95"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <span className="material-symbols-outlined text-[21px]">{visible ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
    </div>
  )
}
