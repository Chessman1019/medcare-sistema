export default function FormAlert({ message, variant = 'error', className = '' }) {
  if (!message) return null

  const variantClass = variant === 'success' ? 'medcare-form-alert-success' : 'medcare-form-alert-error'

  return (
    <div className={`medcare-form-alert ${variantClass} ${className}`.trim()} role="alert">
      <span className="material-symbols-outlined medcare-form-alert-icon" aria-hidden="true">
        {variant === 'success' ? 'check_circle' : 'error'}
      </span>
      <span>{message}</span>
    </div>
  )
}
