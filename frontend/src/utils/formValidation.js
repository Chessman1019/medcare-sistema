import { isPasswordValid } from '../components/PasswordControls'
import { DNI_LENGTH, PHONE_LENGTH } from './numericFields'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validationMessages = {
  required: (label = 'Este campo') => `${label} es obligatorio.`,
  email: 'Correo electrónico inválido. Ingresa un correo válido, por ejemplo: usuario@correo.com.',
  password: 'La contraseña debe tener al menos 6 caracteres, incluir letras y números.',
  dni: `El DNI debe tener exactamente ${DNI_LENGTH} dígitos numéricos.`,
  phone: `El teléfono debe tener ${PHONE_LENGTH} dígitos numéricos.`,
  name: (label = 'El nombre') => `${label} debe tener al menos 2 caracteres.`,
  date: 'Selecciona una fecha válida.',
  select: (label = 'una opción') => `Selecciona ${label}.`,
}

export function isEmpty(value) {
  return value == null || String(value).trim() === ''
}

export function mergeInputClass(baseClass = '', hasError = false) {
  return `${baseClass}${hasError ? ' medcare-input-invalid' : ''}`.trim()
}

export function validateRequired(value, label = 'Este campo') {
  return isEmpty(value) ? validationMessages.required(label) : ''
}

export function validateEmail(value) {
  if (isEmpty(value)) return validationMessages.required('El correo electrónico')
  if (!EMAIL_PATTERN.test(String(value).trim())) return validationMessages.email
  return ''
}

export function validateName(value, label = 'El nombre') {
  if (isEmpty(value)) return validationMessages.required(label)
  if (String(value).trim().length < 2) return validationMessages.name(label)
  return ''
}

export function validateDni(value, required = true) {
  if (isEmpty(value)) return required ? validationMessages.required('El DNI') : ''
  if (!new RegExp(`^\\d{${DNI_LENGTH}}$`).test(String(value))) return validationMessages.dni
  return ''
}

export function validatePhone(value, required = false) {
  if (isEmpty(value)) return required ? validationMessages.required('El teléfono') : ''
  if (!new RegExp(`^\\d{${PHONE_LENGTH}}$`).test(String(value))) return validationMessages.phone
  return ''
}

export function validatePassword(value) {
  if (isEmpty(value)) return validationMessages.required('La contraseña')
  if (!isPasswordValid(value)) return validationMessages.password
  return ''
}

export function validateSelect(value, label = 'una opción') {
  if (isEmpty(value)) return validationMessages.select(label)
  return ''
}

export function validateDate(value) {
  if (isEmpty(value)) return validationMessages.date
  return ''
}

function putError(errors, field, message) {
  if (message) errors[field] = message
}

export function runValidations(entries) {
  const errors = {}
  entries.forEach(([field, message]) => putError(errors, field, message))
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validatePatientRegistrationForm(data) {
  return runValidations([
    ['nombre', validateName(data.nombre, 'El nombre')],
    ['apellido', validateName(data.apellido, 'El apellido')],
    ['email', validateEmail(data.email)],
    ['password', validatePassword(data.password)],
    ['dni', validateDni(data.dni)],
    ['telefono', validatePhone(data.telefono, false)],
    ['fecha_nacimiento', validateDate(data.fecha_nacimiento)],
    ['genero', validateSelect(data.genero, 'un género')],
  ])
}

export function validateUserCreationForm(data, tipo) {
  const entries = [
    ['nombre', validateName(data.nombre, 'El nombre')],
    ['apellido', validateName(data.apellido, 'El apellido')],
    ['email', validateEmail(data.email)],
    ['password', validatePassword(data.password)],
    ['telefono', validatePhone(data.telefono, false)],
  ]

  if (tipo === 'doctor') {
    entries.push(
      ['cmp', validateRequired(data.cmp, 'El CMP')],
      ['id_especialidad', validateSelect(data.id_especialidad, 'una especialidad')],
      ['turno', validateSelect(data.turno, 'un turno')],
    )
  }

  if (tipo === 'paciente') {
    entries.push(
      ['dni', validateDni(data.dni)],
      ['fecha_nacimiento', validateDate(data.fecha_nacimiento)],
      ['genero', validateSelect(data.genero, 'un género')],
    )
  }

  if (['recepcionista', 'administrador'].includes(tipo)) {
    entries.push(
      ['codigo_empleado', validateRequired(data.codigo_empleado, 'El código de empleado')],
      ['turno', validateSelect(data.turno, 'un turno')],
    )
  }

  return runValidations(entries)
}

export function validateLoginForm(data) {
  return runValidations([
    ['email', validateEmail(data.email)],
    ['password', validateRequired(data.password, 'La contraseña')],
  ])
}

export function validateProfileForm(data) {
  return runValidations([
    ['nombre', validateName(data.nombre, 'El nombre')],
    ['apellido', validateName(data.apellido, 'El apellido')],
    ['telefono', validatePhone(data.telefono, false)],
  ])
}

export function validatePasswordChangeForm(data) {
  const errors = {}
  putError(errors, 'contrasena_actual', validateRequired(data.contrasena_actual, 'La contraseña actual'))
  putError(errors, 'nueva_contrasena', validatePassword(data.nueva_contrasena))
  if (isEmpty(data.confirmar)) {
    putError(errors, 'confirmar', validationMessages.required('La confirmación de contraseña'))
  } else if (data.nueva_contrasena !== data.confirmar) {
    putError(errors, 'confirmar', 'Las contraseñas no coinciden.')
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateRecoveryCode(value) {
  if (isEmpty(value)) return validationMessages.required('El código')
  if (!/^\d{6}$/.test(String(value))) return 'El código debe tener 6 dígitos numéricos.'
  return ''
}

export function validateHorarioForm(data) {
  return runValidations([
    ['id_doctor', validateSelect(data.id_doctor, 'un doctor')],
    ['fecha', validateDate(data.fecha)],
    ['hora_inicio', validateRequired(data.hora_inicio, 'La hora de inicio')],
    ['hora_fin', validateRequired(data.hora_fin, 'La hora de fin')],
  ])
}

export function validateDiagnostico(value) {
  return validateRequired(value, 'El diagnóstico')
}

export function validatePasswordResetForm(data) {
  const errors = {}
  putError(errors, 'nueva_contrasena', validatePassword(data.nueva_contrasena))
  if (isEmpty(data.confirmar)) {
    putError(errors, 'confirmar', validationMessages.required('La confirmación de contraseña'))
  } else if (data.nueva_contrasena !== data.confirmar) {
    putError(errors, 'confirmar', 'Las contraseñas no coinciden.')
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateAppointmentForm(data) {
  return runValidations([
    ['id_especialidad', validateSelect(data.id_especialidad, 'una especialidad')],
    ['id_doctor', validateSelect(data.id_doctor, 'un doctor')],
  ])
}

export function focusFirstFieldError(errors) {
  const firstField = Object.keys(errors)[0]
  if (!firstField) return
  document.querySelector(`[data-field="${firstField}"]`)?.focus?.()
}
