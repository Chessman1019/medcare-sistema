import { useMemo, useState } from 'react'
import MedCareSelect from './MedCareSelect'
import { DateWheelPicker, TimeWheelPicker } from './WheelPickers'
import { getLimaDateInputValue, getLimaTimeInputValue, getNextLimaTimeInputValue, isPastLimaSlot, normalizeTimeValue } from '../utils/limaTime'

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 disabled:cursor-not-allowed disabled:bg-slate-50'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const DEFAULT_DURATION_MINUTES = 90

function doctorLabel(doctor) {
  if (!doctor) return 'Doctor'
  const source = doctor.usuario || doctor
  return [source.nombre, source.apellido].filter(Boolean).join(' ') || 'Doctor'
}

function addMinutesToTime(value, minutesToAdd = DEFAULT_DURATION_MINUTES) {
  if (!value) return ''
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return ''
  const totalMinutes = (hours * 60 + minutes + minutesToAdd) % (24 * 60)
  const nextHours = Math.floor(totalMinutes / 60)
  const nextMinutes = totalMinutes % 60
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return error?.message || fallback
}

function getInitialForm(initialDoctorId = '') {
  const horaInicio = getNextLimaTimeInputValue()
  return {
    id_doctor: initialDoctorId ? String(initialDoctorId) : '',
    fecha: getLimaDateInputValue(),
    hora_inicio: horaInicio,
    hora_fin: addMinutesToTime(horaInicio),
  }
}

export default function HorarioDisponibleForm({ doctores = [], initialDoctorId = '', onSubmit, onCreated, onCancel }) {
  const [form, setForm] = useState(() => getInitialForm(initialDoctorId))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const today = useMemo(() => getLimaDateInputValue(), [])
  const minTime = form.fecha === today ? getLimaTimeInputValue() : undefined

  const updateHoraInicio = (horaInicio) => {
    const horaInicioValida = isPastLimaSlot(form.fecha, horaInicio) ? getNextLimaTimeInputValue() : horaInicio
    setForm(current => ({
      ...current,
      hora_inicio: horaInicioValida,
      hora_fin: addMinutesToTime(horaInicioValida),
    }))
  }

  const updateFecha = (fecha) => {
    setForm(current => {
      if (fecha === getLimaDateInputValue() && (!current.hora_inicio || isPastLimaSlot(fecha, current.hora_inicio))) {
        const horaInicio = getNextLimaTimeInputValue()
        return { ...current, fecha, hora_inicio: horaInicio, hora_fin: addMinutesToTime(horaInicio) }
      }
      return { ...current, fecha }
    })
  }

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
      setForm(current => ({ ...getInitialForm(current.id_doctor), id_doctor: current.id_doctor }))
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
          <MedCareSelect
            className={inputClass}
            value={form.id_doctor}
            onChange={event => setForm(current => ({ ...current, id_doctor: event.target.value }))}
            required
            disabled={!doctores.length}
            options={[
              { value: '', label: doctores.length ? 'Selecciona doctor' : 'No hay doctores disponibles' },
              ...doctores.map(doctor => ({
                value: doctor.id_usuario,
                label: `Dr. ${doctorLabel(doctor)}`,
              })),
            ]}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Fecha
          <DateWheelPicker
            value={form.fecha}
            onChange={updateFecha}
            min={today}
            initialValue={today}
            inputClassName={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Hora inicio
          <TimeWheelPicker
            value={form.hora_inicio}
            onChange={updateHoraInicio}
            min={minTime}
            initialValue={getNextLimaTimeInputValue()}
            inputClassName={inputClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Hora fin
          <TimeWheelPicker
            value={form.hora_fin}
            onChange={value => setForm(current => ({ ...current, hora_fin: value }))}
            initialValue={addMinutesToTime(form.hora_inicio)}
            inputClassName={inputClass}
          />
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
