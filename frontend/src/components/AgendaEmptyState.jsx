export default function AgendaEmptyState({
  icon = 'event_busy',
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-[#bdcbc7] bg-[#fbfcff] text-center ${compact ? 'p-5' : 'p-8 sm:p-10'} ${className}`}>
      <span className={`material-symbols-outlined text-[#8ca19d] ${compact ? 'text-4xl' : 'text-5xl'}`}>{icon}</span>
      <p className="mt-3 font-extrabold text-[#223330]">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm font-semibold text-[#52615f]">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="medcare-primary-button mt-5 px-5 py-2.5 text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
