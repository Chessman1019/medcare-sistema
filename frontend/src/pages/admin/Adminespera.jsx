import { useState } from 'react'
import axios from 'axios'

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' })
API.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c })

export default function AdminEspera({ listaEspera, onRefresh }) {
  const [search, setSearch] = useState('')
  const [procesando, setProcesando] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
  const showError = (t) => { setError(t); setTimeout(() => setError(''), 3000) }

  const filtered = listaEspera.filter(e => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    const nombre = `${e.paciente?.usuario?.nombre} ${e.paciente?.usuario?.apellido}`.toLowerCase()
    return nombre.includes(term) || e.especialidad?.nombre?.toLowerCase().includes(term)
  })

  const atender = async (id) => {
    setProcesando(id)
    try {
      await API.patch(`/usuarios/lista-espera/${id}`, { estado: 'atendido' })
      showMsg('Paciente marcado como atendido.')
      onRefresh?.()
    } catch (err) {
      showError(err.response?.data?.detail || 'No se pudo actualizar.')
    } finally { setProcesando(null) }
  }

  const retirar = async (id) => {
    setProcesando(id)
    try {
      await API.patch(`/usuarios/lista-espera/${id}`, { estado: 'retirado' })
      showMsg('Paciente retirado de la lista.')
      onRefresh?.()
    } catch (err) {
      showError(err.response?.data?.detail || 'No se pudo retirar.')
    } finally { setProcesando(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Lista de Espera</h2>
          <p className="mt-2 text-lg text-[#52615f]">{listaEspera.length} pacientes en espera</p>
        </div>
        <div className="relative max-w-sm w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#52615f] text-[18px]">search</span>
          <input className="w-full rounded-xl border border-[#bdcbc7] bg-white py-2.5 pl-9 pr-4 text-sm focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15"
            placeholder="Buscar por nombre o especialidad..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {msg && <div className="rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-4 py-3 text-sm font-bold text-[#006b5d]">✓ {msg}</div>}
      {error && <div className="rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-4 py-3 text-sm font-bold text-[#93000a]">{error}</div>}

      {filtered.length === 0 ? (
        <div className="medcare-card p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#12b8a3]">check_circle</span>
          <p className="text-[#52615f] mt-4 font-bold">No hay pacientes en lista de espera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e, i) => (
            <div key={e.id_espera} className="medcare-card flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#faeeda] text-[#854F0B] font-extrabold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-[#101828]">
                  {e.paciente?.usuario?.nombre} {e.paciente?.usuario?.apellido}
                </p>
                <p className="text-sm text-[#006b5d] font-bold">{e.especialidad?.nombre}</p>
                <p className="text-xs text-[#52615f] mt-0.5">
                  Solicitado: {new Date(e.fecha_solicitud).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs bg-[#faeeda] text-[#854F0B] px-3 py-1 rounded-full font-extrabold">En espera</span>
                <button type="button" onClick={() => atender(e.id_espera)}
                  disabled={procesando === e.id_espera}
                  title="Marcar como atendido"
                  className="rounded-lg p-1.5 text-[#006b5d] hover:bg-[#d8f4ee] transition">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </button>
                <button type="button" onClick={() => retirar(e.id_espera)}
                  disabled={procesando === e.id_espera}
                  title="Retirar de la lista"
                  className="rounded-lg p-1.5 text-[#93000a] hover:bg-[#ffdad6] transition">
                  <span className="material-symbols-outlined text-[20px]">remove_circle</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}