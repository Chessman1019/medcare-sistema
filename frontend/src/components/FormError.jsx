export default function FormError({ message, className = '' }) {
  if (!message) return null

  return (
    <p className={`medcare-form-error ${className}`.trim()} role="alert">
      <span className="material-symbols-outlined medcare-form-error-icon" aria-hidden="true">error</span>
      <span>{message}</span>
    </p>
  )
}
