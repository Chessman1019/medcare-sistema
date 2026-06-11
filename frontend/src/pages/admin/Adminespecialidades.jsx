export default function AdminEspecialidades({ especialidades, doctores }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Especialidades</h2>
        <p className="mt-2 text-lg text-[#52615f]">{especialidades.length} especialidades disponibles</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {especialidades.map(e => {
          const docs = doctores.filter(d => d.doctor?.especialidad?.nombre === e.nombre).length
          return (
            <div key={e.id_especialidad} className="medcare-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8f4ee] text-[#006b5d] font-extrabold text-lg">
                  {e.id_especialidad}
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-[#101828]">{e.nombre}</p>
                  <p className="text-xs text-[#52615f] mt-0.5">{e.descripcion}</p>
                  <p className="text-xs text-[#006b5d] font-bold mt-1">{docs} doctor{docs !== 1 ? 'es' : ''}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}