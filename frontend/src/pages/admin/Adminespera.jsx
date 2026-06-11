export default function AdminEspera({ listaEspera }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Lista de Espera</h2>
        <p className="mt-2 text-lg text-[#52615f]">{listaEspera.length} pacientes en espera</p>
      </div>
      {listaEspera.length === 0 ? (
        <div className="medcare-card p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#12b8a3]">check_circle</span>
          <p className="text-[#52615f] mt-4">No hay pacientes en lista de espera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listaEspera.map((e, i) => (
            <div key={e.id_espera} className="medcare-card flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#faeeda] text-[#854F0B] font-extrabold">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-[#101828]">{e.paciente?.usuario?.nombre} {e.paciente?.usuario?.apellido}</p>
                <p className="text-sm text-[#52615f]">{e.especialidad?.nombre}</p>
                <p className="text-xs text-[#52615f]">{new Date(e.fecha_solicitud).toLocaleDateString('es-PE')}</p>
              </div>
              <span className="text-xs bg-[#faeeda] text-[#854F0B] px-3 py-1 rounded-full font-extrabold">En espera</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}