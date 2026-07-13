import { getAgendaStatusMeta } from '../utils/agendaStatus'

export default function AgendaStatusBadge({ status, size = 'sm', showIcon = true, className = '' }) {
  const meta = getAgendaStatusMeta(status)
  const sizeClass = size === 'md' ? 'px-3.5 py-1.5 text-sm' : 'px-3 py-1 text-xs'
  const iconSize = size === 'md' ? 'text-[18px]' : 'text-[15px]'

  return (
    <span className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full font-extrabold ring-1 ${sizeClass} ${meta.className} ${className}`}>
      {showIcon && <span className={`material-symbols-outlined shrink-0 ${iconSize}`}>{meta.icon}</span>}
      <span className="truncate">{meta.label}</span>
    </span>
  )
}
