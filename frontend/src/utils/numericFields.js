export const DNI_LENGTH = 8
export const PHONE_LENGTH = 9

export const dniInputProps = {
  inputMode: 'numeric',
  maxLength: DNI_LENGTH,
  minLength: DNI_LENGTH,
  pattern: '\\d{8}',
  title: 'El DNI debe tener 8 digitos numericos.',
}

export const phoneInputProps = {
  inputMode: 'numeric',
  maxLength: PHONE_LENGTH,
  minLength: PHONE_LENGTH,
  pattern: '\\d{9}',
  title: 'El telefono debe tener 9 digitos numericos.',
}

export function onlyDigits(value = '', maxLength) {
  return String(value).replace(/\D/g, '').slice(0, maxLength)
}

export function formatDniInput(value = '') {
  return onlyDigits(value, DNI_LENGTH)
}

export function formatPhoneInput(value = '') {
  return onlyDigits(value, PHONE_LENGTH)
}
