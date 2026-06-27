import { useMemo, useState } from 'react'
import { getLimaDateInputValue, getLimaTimeInputValue, isPastLimaSlot, normalizeTimeValue } from '../utils/limaTime'

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

function doctorLabel(doctor) {
  if (!doctor) return 'Doctor'
  const source = doctor.usuario || doctor
  return [source.nombre, source.apellido].filter(Boolean).join(' ') || 'Doctor'
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return error?.message || fallback
}

export default function HorarioDisponibleForm({ doctores = [], initialDoctorId = '', onSubmit, onCreated, onCancel }) {
  const [form, setForm] = useState({
    id_doctor: initialDoctorId ? String(initialDoctorId) : '',
    fecha: getLimaDateInputValue(),
    hora_inicio: '',
    hora_fin: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const today = useMemo(() => getLimaDateInputValue(), [])
  const minTime = form.fecha === today ? getLimaTimeInputValue() : undefined

  const validate = () => {
    if (!form.id_doctor || !form.fecha || !form.hora_inicio || !form.hora_fin) {
      return 'Completa doctor, fecha, hora de inicio y hora de fin.'
    }
    if (form.fecha < getLimaDateInputValue()) {
      return 'No se pueden registrar fechas pasadas.'
    }
    if (isPastLimaSlot(form.fecha, form.hora_inicio)) {
      return 'No se pueden registrar horas pasadas para el día de hoy.'
    }
    if (form.hora_fin <= form.hora_inicio) {
      return 'La hora de fin debe ser posterior a la hora de inicio.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccess('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      id_doctor: Number(form.id_doctor),
      fecha: form.fecha,
      hora_inicio: normalizeTimeValue(form.hora_inicio),
      hora_fin: normalizeTimeValue(form.hora_fin),
    }

    setSaving(true)
    setError('')
    try {
      const created = await onSubmit(payload)
      setSuccess('Horario disponible registrado correctamente.')
      setForm(current => ({ ...current, fecha: getLimaDateInputValue(), hora_inicio: '', hora_fin: '' }))
      onCreated?.(created, payload)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar el horario disponible.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Agregar más fechas y horas disponibles</h3>
          <p className="mt-1 text-sm text-slate-500">Los horarios se validan con la hora oficial de Perú.</p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" title="Cerrar">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{success}</div>}
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Doctor
          <select className={inputClass} value={form.id_doctor} onChange={event => setForm(current => ({ ...current, id_doctor: event.target.value }))} required disabled={!doctores.length}>
            <option value="">{doctores.length ? 'Selecciona doctor' : 'No hay doctores disponibles'}</option>
            {doctores.map(doctor => (
              <option key={doctor.id_usuario} value={doctor.id_usuario}>Dr. {doctorLabel(doctor)}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Fecha
          <input type="date" className={inputClass} min={today} value={form.fecha} onChange={event => setForm(current => ({ ...current, fecha: event.target.value }))} required />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Hora inicio
          <input type="time" className={inputClass} min={minTime} value={form.hora_inicio} onChange={event => setForm(current => ({ ...current, hora_inicio: event.target.value }))} required />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Hora fin
          <input type="time" className={inputClass} value={form.hora_fin} onChange={event => setForm(current => ({ ...current, hora_fin: event.target.value }))} required />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={saving || !doctores.length} className={`${primaryButton} w-full whitespace-nowrap`}>
            {saving ? 'Guardando...' : 'Guardar horario'}
          </button>
        </div>
      </div>
    </form>
  )
}
