import { PasswordField, PasswordStrength } from '../../components/PasswordControls'
import FormError from '../../components/FormError'
import MedCareSelect from '../../components/MedCareSelect'
import SeguroMedicoField from '../../components/SeguroMedicoField'
import { DateWheelPicker } from '../../components/WheelPickers'
import { useFormValidation } from '../../hooks/useFormValidation'
import { validatePatientRegistrationForm } from '../../utils/formValidation'
import { dniInputProps, formatDniInput, formatPhoneInput, phoneInputProps } from '../../utils/numericFields'
import { getLimaDateInputValue } from '../../utils/limaTime'

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 w-full mt-1'

export default function RecepRegistro({ registro, setRegistro, pacientes, actionLoading, onRegistrar }) {
  const maxBirthDate = getLimaDateInputValue()
  const { fieldErrors, applyErrors, clearFieldError, inputClass: fieldInputClass } = useFormValidation()

  const updateField = (field, value) => {
    const nextValue = field === 'dni'
      ? formatDniInput(value)
      : field === 'telefono'
        ? formatPhoneInput(value)
        : value
    setRegistro({ ...registro, [field]: nextValue })
    clearFieldError(field)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validation = validatePatientRegistrationForm(registro)
    if (!validation.valid) {
      applyErrors(validation.errors)
      return
    }
    onRegistrar(event)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Alta de paciente</h2>
        <p className="mt-2 text-lg text-[#52615f]">{pacientes.length} pacientes registrados.</p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="medcare-card max-w-3xl p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-bold text-[#223330]">
            Nombre
            <input data-field="nombre" className={fieldInputClass('nombre', inputClass)} value={registro.nombre}
              onChange={e => updateField('nombre', e.target.value)} />
            <FormError message={fieldErrors.nombre} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Apellido
            <input data-field="apellido" className={fieldInputClass('apellido', inputClass)} value={registro.apellido}
              onChange={e => updateField('apellido', e.target.value)} />
            <FormError message={fieldErrors.apellido} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Correo
            <input data-field="email" type="text" inputMode="email" autoComplete="email" className={fieldInputClass('email', inputClass)} value={registro.email}
              onChange={e => updateField('email', e.target.value)} />
            <FormError message={fieldErrors.email} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            DNI
            <input data-field="dni" className={fieldInputClass('dni', inputClass)} {...dniInputProps} value={registro.dni}
              onChange={e => updateField('dni', e.target.value)} />
            <FormError message={fieldErrors.dni} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Teléfono
            <input data-field="telefono" className={fieldInputClass('telefono', inputClass)} {...phoneInputProps} value={registro.telefono}
              onChange={e => updateField('telefono', e.target.value)} />
            <FormError message={fieldErrors.telefono} />
          </label>
          <label className="block text-sm font-bold text-[#223330]">
            Fecha de nacimiento
            <DateWheelPicker
              value={registro.fecha_nacimiento}
              onChange={value => updateField('fecha_nacimiento', value)}
              min="1900-01-01"
              max={maxBirthDate}
              initialValue="1990-01-01"
              inputClassName={fieldInputClass('fecha_nacimiento', inputClass)}
            />
            <FormError message={fieldErrors.fecha_nacimiento} />
          </label>
          <label className="block text-sm font-bold text-[#223330] md:col-span-2">
            Dirección
            <input className={inputClass} value={registro.direccion}
              onChange={e => updateField('direccion', e.target.value)} />
          </label>
          <SeguroMedicoField
            value={registro.seguro_medico}
            onChange={(value) => setRegistro({ ...registro, seguro_medico: value })}
            inputClassName={inputClass}
          />
          <div className="md:col-span-2">
            <PasswordField label="Contraseña inicial" data-field="password" value={registro.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
              inputClassName={inputClass.replace(' mt-1', '')}
              error={Boolean(fieldErrors.password)} />
            <FormError message={fieldErrors.password} />
            <PasswordStrength password={registro.password} className="mt-3" />
          </div>
          <label className="block text-sm font-bold text-[#223330]">
            Género
            <MedCareSelect
              className={fieldInputClass('genero', inputClass)}
              value={registro.genero}
              onChange={e => updateField('genero', e.target.value)}
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
        <button type="submit" disabled={actionLoading === 'registro'}
          className="medcare-primary-button px-6 py-3 disabled:opacity-60">
          {actionLoading === 'registro' ? 'Registrando...' : 'Registrar paciente'}
        </button>
      </form>
    </div>
  )
}
