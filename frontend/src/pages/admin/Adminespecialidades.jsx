import { useState } from 'react'
import axios from 'axios'
import FormAlert from '../../components/FormAlert'
import FormError from '../../components/FormError'
import { useFormValidation } from '../../hooks/useFormValidation'
import { validateName } from '../../utils/formValidation'

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' })
API.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c })

const inputClass = 'rounded-lg border border-[#bdcbc7] px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 w-full mt-1'
const primaryButton = 'medcare-primary-button px-5 py-2.5 disabled:opacity-60'
const secondaryButton = 'rounded-xl border border-[#bdcbc7] bg-white px-4 py-2 text-sm font-extrabold text-[#223330] transition hover:-translate-y-0.5 hover:border-[#12b8a3] hover:bg-[#f4fffc]'

export default function AdminEspecialidades({ especialidades, doctores, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const { fieldErrors, applyErrors, clearFieldError, inputClass: fieldInputClass } = useFormValidation()

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
  const showError = (t) => { setError(t); setTimeout(() => setError(''), 3000) }

  const abrirNueva = () => {
    setEditing(null)
    setForm({ nombre: '', descripcion: '' })
    setShowForm(true)
  }

  const abrirEditar = (esp) => {
    setEditing(esp)
    setForm({ nombre: esp.nombre, descripcion: esp.descripcion || '' })
    setShowForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    const nombreError = validateName(form.nombre, 'El nombre')
    if (nombreError) {
      applyErrors({ nombre: nombreError })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await API.put(`/usuarios/especialidades/${editing.id_especialidad}`, form)
        showMsg('Especialidad actualizada correctamente.')
      } else {
        await API.post('/usuarios/especialidades', form)
        showMsg('Especialidad creada correctamente.')
      }
      setShowForm(false)
      onRefresh?.()
    } catch (err) {
      showError(err.response?.data?.detail || 'No se pudo guardar.')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Especialidades</h2>
          <p className="mt-2 text-lg text-[#52615f]">{especialidades.length} especialidades disponibles</p>
        </div>
        <button type="button" onClick={abrirNueva} className={primaryButton}>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nueva especialidad
          </span>
        </button>
      </div>

      {msg && <div className="rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-4 py-3 text-sm font-bold text-[#006b5d]">✓ {msg}</div>}
      {error && <FormAlert message={error} />}

      {/* Formulario */}
      {showForm && (
        <div className="medcare-card p-6">
          <h3 className="font-extrabold text-[#101828] mb-4">{editing ? 'Editar especialidad' : 'Nueva especialidad'}</h3>
          <form noValidate onSubmit={guardar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-[#223330]">
              Nombre
              <input data-field="nombre" className={fieldInputClass('nombre', inputClass)} value={form.nombre} onChange={e => { setForm(f => ({ ...f, nombre: e.target.value })); clearFieldError('nombre') }} autoComplete="off" />
              <FormError message={fieldErrors.nombre} />
            </label>
            <label className="block text-sm font-bold text-[#223330]">
              Descripción
              <input className={inputClass} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} autoComplete="off" />
            </label>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear especialidad'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={secondaryButton}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {especialidades.map(e => {
          const docs = doctores.filter(d => d.doctor?.id_especialidad === e.id_especialidad).length
          return (
            <div key={e.id_especialidad} className="medcare-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d] font-extrabold text-lg">
                  {e.nombre?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[#101828]">{e.nombre}</p>
                  <p className="text-xs text-[#52615f] mt-0.5 line-clamp-2">{e.descripcion || '—'}</p>
                  <p className="text-xs text-[#006b5d] font-bold mt-2">{docs} doctor{docs !== 1 ? 'es' : ''}</p>
                </div>
                <button type="button" onClick={() => abrirEditar(e)}
                  className="rounded-lg p-1.5 text-[#52615f] hover:bg-[#f4fffc] hover:text-[#007a68] transition">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}