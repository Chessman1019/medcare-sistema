import { PasswordField, PasswordStrength, isPasswordValid } from '../../components/PasswordControls'

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15'
const primaryButton = 'rounded-lg bg-[#007a68] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#12b8a3]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

export default function RecepRegistro({ registro, setRegistro, pacientes, especialidades, actionLoading, onRegistrar, onShowMessage }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isPasswordValid(registro.password)) {
      onShowMessage('La contraseña inicial debe tener mínimo 6 caracteres, letras y números.')
      return
    }
    onRegistrar(event)
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Alta de paciente</h2>
        <p className="mt-1 text-sm text-slate-500">{pacientes.length} pacientes registrados.</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['nombre', 'Nombre', 'text'], ['apellido', 'Apellido', 'text'],
            ['email', 'Correo', 'email'], ['dni', 'DNI', 'text'],
            ['telefono', 'Teléfono', 'text'], ['fecha_nacimiento', 'Fecha de nacimiento', 'date'],
            ['seguro_medico', 'Seguro médico', 'text'], ['direccion', 'Dirección', 'text'],
          ].map(([field, label, type]) => (
            <label key={field} className="text-sm font-medium text-slate-700">
              {label}
              <input type={type} required={!['telefono', 'seguro_medico', 'direccion'].includes(field)}
                className={`mt-1 w-full ${inputClass}`} value={registro[field]}
                onChange={e => setRegistro({ ...registro, [field]: e.target.value })} />
            </label>
          ))}
          <div className="md:col-span-2">
            <PasswordField label="Contraseña inicial" value={registro.password}
              onChange={e => setRegistro({ ...registro, password: e.target.value })}
              placeholder="••••••••" autoComplete="new-password" required />
            <PasswordStrength password={registro.password} className="mt-3" />
          </div>
          <label className="text-sm font-medium text-slate-700">
            Género
            <select className={`mt-1 w-full ${inputClass}`} value={registro.genero} onChange={e => setRegistro({ ...registro, genero: e.target.value })}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={actionLoading === 'registro'} className={`mt-5 ${primaryButton}`}>
          {actionLoading === 'registro' ? 'Registrando...' : 'Registrar paciente'}
        </button>
      </form>
    </section>
  )
}