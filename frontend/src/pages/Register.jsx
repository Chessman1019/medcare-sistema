import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarPaciente } from '../services/api'
import FormAlert from '../components/FormAlert'
import FormError from '../components/FormError'
import Layout from '../components/Layout'
import MedCareSelect from '../components/MedCareSelect'
import { PasswordField, PasswordStrength } from '../components/PasswordControls'
import SeguroMedicoField from '../components/SeguroMedicoField'
import { DateWheelPicker } from '../components/WheelPickers'
import { useFormValidation } from '../hooks/useFormValidation'
import { validatePatientRegistrationForm } from '../utils/formValidation'
import { dniInputProps, formatDniInput, formatPhoneInput, phoneInputProps } from '../utils/numericFields'
import { getLimaDateInputValue } from '../utils/limaTime'

const initialForm = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
  dni: '',
  fecha_nacimiento: '',
  genero: 'M',
  seguro_medico: '',
}

export default function Register() {
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const maxBirthDate = getLimaDateInputValue()
  const { fieldErrors, applyErrors, clearFieldError, inputClass } = useFormValidation()

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    clearFieldError(field)
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const validation = validatePatientRegistrationForm(form)
    if (!validation.valid) {
      applyErrors(validation.errors)
      return
    }

    setLoading(true)

    try {
      await registrarPaciente(form)
      navigate('/login')
    } catch (err) {
      setFormError(err.response?.data?.detail || 'No se pudo registrar al paciente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-4xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/medcare-logo.png" alt="Clínica MedCare S.A.C." className="h-24 w-auto object-contain" />
            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#006b5d]">Alta de paciente</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#08284d]">Crear cuenta en MedCare</h1>
          </div>

          <div className="medcare-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="bg-[#eef3ff] p-8">
                <h2 className="text-2xl font-extrabold text-[#101828]">Tu portal de salud</h2>
                <p className="mt-3 text-sm leading-6 text-[#52615f]">
                  Regístrate para solicitar citas, consultar tu historial y gestionar tus atenciones médicas.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    ['event_available', 'Agenda citas con especialistas'],
                    ['clinical_notes', 'Consulta tus atenciones previas'],
                    ['support_agent', 'Recibe soporte de recepción'],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                      <span className="material-symbols-outlined text-[#006b5d]">{icon}</span>
                      <span className="text-sm font-bold text-[#223330]">{text}</span>
                    </div>
                  ))}
                </div>
              </aside>

              <form noValidate onSubmit={handleSubmit} className="space-y-5 p-8">
                <FormAlert message={formError} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-[#223330]">
                    Nombre
                    <input
                      data-field="nombre"
                      className={inputClass('nombre', 'medcare-input mt-2')}
                      placeholder="Ana"
                      value={form.nombre}
                      onChange={(event) => updateField('nombre', event.target.value)}
                    />
                    <FormError message={fieldErrors.nombre} />
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Apellido
                    <input
                      data-field="apellido"
                      className={inputClass('apellido', 'medcare-input mt-2')}
                      placeholder="García"
                      value={form.apellido}
                      onChange={(event) => updateField('apellido', event.target.value)}
                    />
                    <FormError message={fieldErrors.apellido} />
                  </label>
                </div>

                <label className="block text-sm font-bold text-[#223330]">
                  Correo electrónico
                  <input
                    data-field="email"
                    className={inputClass('email', 'medcare-input mt-2')}
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                  <FormError message={fieldErrors.email} />
                </label>

                <div>
                  <PasswordField
                    label="Contraseña"
                    data-field="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={Boolean(fieldErrors.password)}
                  />
                  <FormError message={fieldErrors.password} />
                  <PasswordStrength password={form.password} className="mt-3" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-[#223330]">
                    DNI
                    <input
                      data-field="dni"
                      className={inputClass('dni', 'medcare-input mt-2')}
                      placeholder="12345678"
                      {...dniInputProps}
                      value={form.dni}
                      onChange={(event) => updateField('dni', formatDniInput(event.target.value))}
                    />
                    <FormError message={fieldErrors.dni} />
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Teléfono
                    <input
                      data-field="telefono"
                      className={inputClass('telefono', 'medcare-input mt-2')}
                      placeholder="999999999"
                      {...phoneInputProps}
                      value={form.telefono}
                      onChange={(event) => updateField('telefono', formatPhoneInput(event.target.value))}
                    />
                    <FormError message={fieldErrors.telefono} />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-[#223330]">
                    Fecha de nacimiento
                    <DateWheelPicker
                      className="mt-2"
                      value={form.fecha_nacimiento}
                      onChange={(value) => updateField('fecha_nacimiento', value)}
                      min="1900-01-01"
                      max={maxBirthDate}
                      initialValue="1990-01-01"
                      inputClassName={inputClass('fecha_nacimiento', 'medcare-input')}
                    />
                    <FormError message={fieldErrors.fecha_nacimiento} />
                  </label>
                  <label className="block text-sm font-bold text-[#223330]">
                    Género
                    <MedCareSelect
                      className={inputClass('genero', 'medcare-input mt-2')}
                      value={form.genero}
                      onChange={(event) => updateField('genero', event.target.value)}
                      error={Boolean(fieldErrors.genero)}
                      options={[
                        { value: 'M', label: 'Masculino' },
                        { value: 'F', label: 'Femenino' },
                        { value: 'Otro', label: 'Otro' },
                      ]}
                    />
                    <FormError message={fieldErrors.genero} />
                  </label>
                </div>

                <SeguroMedicoField
                  value={form.seguro_medico}
                  onChange={(value) => updateField('seguro_medico', value)}
                />

                <button type="submit" disabled={loading} className="medcare-primary-button flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <p className="text-center text-sm text-[#52615f]">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="font-extrabold text-[#006b5d] hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
