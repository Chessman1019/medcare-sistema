import { PasswordField, PasswordStrength, isPasswordValid } from '../../components/PasswordControls'
import SeguroMedicoField from '../../components/SeguroMedicoField'

const inputClass = 'rounded-xl border border-[#bdcbc7] px-3 py-2.5 text-sm transition focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 w-full mt-1'

export default function RecepRegistro({ registro, setRegistro, pacientes, actionLoading, onRegistrar, onShowMessage }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isPasswordValid(registro.password)) {
      onShowMessage('La contraseña inicial debe tener mínimo 6 caracteres, letras y números.')
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

      <form onSubmit={handleSubmit} className="medcare-card max-w-3xl p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['nombre',           'Nombre',              'text'],
            ['apellido',         'Apellido',             'text'],
            ['email',            'Correo',               'email'],
            ['dni',              'DNI',                  'text'],
            ['telefono',         'Teléfono',             'text'],
            ['fecha_nacimiento', 'Fecha de nacimiento',  'date'],
            ['direccion',        'Dirección',            'text'],
          ].map(([field, label, type]) => (
            <label key={field} className="block text-sm font-bold text-[#223330]">
              {label}
              <input type={type}
                required={!['telefono', 'seguro_medico', 'direccion'].includes(field)}
                className={inputClass} value={registro[field]}
                onChange={e => setRegistro({ ...registro, [field]: e.target.value })} />
            </label>
          ))}
          <SeguroMedicoField
            value={registro.seguro_medico}
            onChange={(value) => setRegistro({ ...registro, seguro_medico: value })}
            inputClassName={inputClass}
          />
          <div className="md:col-span-2">
            <PasswordField label="Contraseña inicial" value={registro.password}
              onChange={e => setRegistro({ ...registro, password: e.target.value })}
              placeholder="••••••••" autoComplete="new-password" required />
            <PasswordStrength password={registro.password} className="mt-3" />
          </div>
          <label className="block text-sm font-bold text-[#223330]">
            Género
            <select className={inputClass} value={registro.genero}
              onChange={e => setRegistro({ ...registro, genero: e.target.value })}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
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
