const CODE_PADDING = 3
const NUMBER_SUFFIX = /(\d+)$/

function numericSuffix(value) {
  const match = NUMBER_SUFFIX.exec(String(value || ''))
  return match ? Number(match[1]) : 0
}

function nextCode(values, prefix) {
  const nextNumber = Math.max(0, ...values.map(numericSuffix)) + 1
  return `${prefix}-${String(nextNumber).padStart(CODE_PADDING, '0')}`
}

export function getCodigosSugeridosFromUsuarios(usuarios = []) {
  const cmps = usuarios.map((usuario) => usuario.doctor?.cmp).filter(Boolean)
  const codigosEmpleado = usuarios.map((usuario) => usuario.administrador?.codigo_empleado).filter(Boolean)

  return {
    cmp: nextCode(cmps, 'CMP'),
    codigo_empleado: nextCode(codigosEmpleado, 'EMP'),
  }
}
