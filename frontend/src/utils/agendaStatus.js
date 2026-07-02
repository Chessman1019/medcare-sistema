export const agendaStatusMeta = {
  disponible: {
    label: 'Disponible',
    icon: 'event_available',
    className: 'bg-[#d8f4ee] text-[#006b5d] ring-[#b7e8df]',
    dotClass: 'bg-[#12b8a3]',
  },
  ocupado: {
    label: 'Ocupado',
    icon: 'event_busy',
    className: 'bg-[#f5f5f2] text-[#46514f] ring-[#d8e5e2]',
    dotClass: 'bg-[#76837f]',
  },
  pendiente: {
    label: 'Pendiente',
    icon: 'hourglass_top',
    className: 'bg-[#faeeda] text-[#854F0B] ring-[#f3d29b]',
    dotClass: 'bg-[#d18616]',
  },
  confirmada: {
    label: 'Confirmada',
    icon: 'check_circle',
    className: 'bg-[#edf2ff] text-[#355382] ring-[#d8e3fb]',
    dotClass: 'bg-[#4f6ea6]',
  },
  reprogramada: {
    label: 'Reprogramada',
    icon: 'edit_calendar',
    className: 'bg-[#efe8ff] text-[#5c3f8c] ring-[#dfd2ff]',
    dotClass: 'bg-[#7a5cb3]',
  },
  en_atencion: {
    label: 'En atencion',
    icon: 'medical_services',
    className: 'bg-[#dff8fb] text-[#006b5d] ring-[#b8e7ef]',
    dotClass: 'bg-[#0098a8]',
  },
  cancelada: {
    label: 'Cancelada',
    icon: 'cancel',
    className: 'bg-[#ffdad6] text-[#93000a] ring-[#ffb4ab]',
    dotClass: 'bg-[#d05850]',
  },
  completada: {
    label: 'Completada',
    icon: 'task_alt',
    className: 'bg-[#e7efe9] text-[#2f5f4f] ring-[#cdded4]',
    dotClass: 'bg-[#5f8b76]',
  },
}

export const agendaStatuses = Object.keys(agendaStatusMeta)

export function formatAgendaStatus(status) {
  return agendaStatusMeta[status]?.label || (status || 'Pendiente').replaceAll('_', ' ')
}

export function getAgendaStatusMeta(status) {
  return agendaStatusMeta[status] || agendaStatusMeta.pendiente
}
