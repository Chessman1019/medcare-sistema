import { useEffect, useState } from 'react'
import MedCareSelect from '../../components/MedCareSelect'
import { getSoporteTickets, actualizarSoporteTicket } from '../../services/api'

const estadoClass = {
    abierto: 'bg-[#faeeda] text-[#854F0B]',
    en_revision: 'bg-[#edf2ff] text-[#355382]',
    resuelto: 'bg-[#d8f4ee] text-[#006b5d]',
    cerrado: 'bg-[#f5f5f2] text-[#46514f]',
}
const prioridadClass = {
    baja: 'bg-[#f5f5f2] text-[#46514f]',
    normal: 'bg-[#edf2ff] text-[#355382]',
    alta: 'bg-[#faeeda] text-[#854F0B]',
    urgente: 'bg-[#ffdad6] text-[#93000a]',
}

export default function AdminSoporte() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [respuesta, setRespuesta] = useState('')
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [error, setError] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')

    const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
    const showError = (t) => { setError(t); setTimeout(() => setError(''), 3000) }

    const fetchTickets = async () => {
        try {
            const params = filtroEstado ? { estado: filtroEstado } : {}
            const r = await getSoporteTickets(params)
            setTickets(r.data || [])
        } catch (e) {
            showError('No se pudieron cargar los tickets.')
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchTickets() }, [filtroEstado])

    const abrirTicket = (ticket) => {
        setSelected(ticket)
        setRespuesta(ticket.respuesta || '')
        setMsg('')
        setError('')
    }

    const guardar = async (nuevoEstado) => {
        setSaving(true)
        try {
            await actualizarSoporteTicket(selected.id_ticket, {
                estado: nuevoEstado,
                respuesta: respuesta,
            })
            showMsg(`Ticket ${nuevoEstado === 'resuelto' ? 'resuelto' : 'actualizado'} correctamente.`)
            setSelected(null)
            fetchTickets()
        } catch (e) {
            showError(e.response?.data?.detail || 'No se pudo actualizar el ticket.')
        } finally { setSaving(false) }
    }

    const abiertos = tickets.filter(t => t.estado === 'abierto').length
    const enRevision = tickets.filter(t => t.estado === 'en_revision').length
    const resueltos = tickets.filter(t => t.estado === 'resuelto').length

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#101828]">Soporte</h2>
                    <p className="mt-2 text-lg text-[#52615f]">{tickets.length} tickets registrados</p>
                </div>
                <MedCareSelect
                    className="rounded-xl border border-[#bdcbc7] px-4 py-2.5 text-sm font-bold text-[#223330] focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 max-w-xs"
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value)}
                    options={[
                        { value: '', label: 'Todos los estados' },
                        { value: 'abierto', label: 'Abiertos' },
                        { value: 'en_revision', label: 'En revisión' },
                        { value: 'resuelto', label: 'Resueltos' },
                        { value: 'cerrado', label: 'Cerrados' },
                    ]}
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Abiertos', value: abiertos, color: 'text-[#854F0B]', bg: 'bg-[#faeeda]', icon: 'inbox' },
                    { label: 'En revisión', value: enRevision, color: 'text-[#355382]', bg: 'bg-[#edf2ff]', icon: 'rate_review' },
                    { label: 'Resueltos', value: resueltos, color: 'text-[#006b5d]', bg: 'bg-[#d8f4ee]', icon: 'check_circle' },
                ].map(s => (
                    <div key={s.label} className="medcare-card p-5 text-center">
                        <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center mx-auto`}>
                            <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
                        </div>
                        <p className={`text-3xl font-extrabold mt-2 ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-[#52615f] mt-1 font-bold">{s.label}</p>
                    </div>
                ))}
            </div>

            {msg && <div className="rounded-xl border border-[#b7e8df] bg-[#e5fbf7] px-4 py-3 text-sm font-bold text-[#006b5d]">✓ {msg}</div>}
            {error && <div className="rounded-xl border border-[#ffb4ab] bg-[#fff0ef] px-4 py-3 text-sm font-bold text-[#93000a]">{error}</div>}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px] xl:gap-6">
                {/* Lista tickets */}
                <div className="medcare-card overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-[#52615f]">Cargando tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-10 text-center">
                            <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">support_agent</span>
                            <p className="mt-3 font-bold text-[#52615f]">No hay tickets registrados.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#bdcbc7]">
                            {tickets.map(t => (
                                <div key={t.id_ticket}
                                    onClick={() => abrirTicket(t)}
                                    className={`cursor-pointer p-5 transition ${selected?.id_ticket === t.id_ticket ? 'bg-[#f4fffc]' : 'bg-white hover:bg-[#f8fbff]'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${estadoClass[t.estado] || estadoClass.abierto}`}>
                                                    {t.estado?.replace('_', ' ')}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${prioridadClass[t.prioridad] || prioridadClass.normal}`}>
                                                    {t.prioridad}
                                                </span>
                                                <span className="text-xs text-[#52615f] font-bold capitalize">{t.rol}</span>
                                            </div>
                                            <p className="font-extrabold text-[#101828] truncate">{t.mensaje}</p>
                                            <p className="text-xs text-[#52615f] mt-1">
                                                {t.usuario?.nombre} {t.usuario?.apellido} · {t.contexto}
                                            </p>
                                        </div>
                                        <p className="text-xs text-[#52615f] shrink-0">
                                            {new Date(t.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panel detalle */}
                {selected ? (
                    <div className="medcare-card overflow-hidden h-fit xl:sticky xl:top-28">
                        <div className="bg-[#007a68] p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-white/80">Ticket #{selected.id_ticket}</p>
                                    <p className="font-extrabold text-lg mt-1">
                                        {selected.usuario?.nombre} {selected.usuario?.apellido}
                                    </p>
                                    <p className="text-sm text-white/80">{selected.usuario?.email}</p>
                                </div>
                                <button type="button" onClick={() => setSelected(null)}
                                    className="rounded-full p-1.5 text-white/80 hover:bg-white/20 transition">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="rounded-xl bg-[#f8fbff] p-4">
                                <p className="text-xs font-bold text-[#52615f] uppercase tracking-wide mb-1">Mensaje</p>
                                <p className="text-sm font-bold text-[#101828]">{selected.mensaje}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    ['Contexto', selected.contexto],
                                    ['Rol', selected.rol],
                                    ['Prioridad', selected.prioridad],
                                    ['Estado', selected.estado?.replace('_', ' ')],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-xl bg-[#f8fbff] p-3">
                                        <p className="text-xs font-bold text-[#52615f] uppercase tracking-wide">{label}</p>
                                        <p className="mt-1 font-bold text-[#101828] capitalize">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#223330] mb-1">Respuesta</label>
                                <textarea
                                    className="w-full rounded-xl border border-[#bdcbc7] px-3 py-2 text-sm focus:border-[#007a68] focus:outline-none focus:ring-4 focus:ring-[#12b8a3]/15 min-h-24"
                                    value={respuesta}
                                    onChange={e => setRespuesta(e.target.value)}
                                    placeholder="Escribe una respuesta al usuario..."
                                />
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                {selected.estado === 'abierto' && (
                                    <button type="button" onClick={() => guardar('en_revision')} disabled={saving}
                                        className="w-full rounded-xl border border-[#bdcbc7] bg-white py-2.5 text-sm font-extrabold text-[#355382] transition hover:bg-[#edf2ff]">
                                        {saving ? 'Guardando...' : 'Marcar en revisión'}
                                    </button>
                                )}
                                {['abierto', 'en_revision'].includes(selected.estado) && (
                                    <button type="button" onClick={() => guardar('resuelto')} disabled={saving}
                                        className="w-full rounded-xl bg-[#007a68] py-2.5 text-sm font-extrabold text-white transition hover:brightness-105">
                                        {saving ? 'Guardando...' : 'Marcar como resuelto'}
                                    </button>
                                )}
                                <button type="button" onClick={() => guardar('cerrado')} disabled={saving}
                                    className="w-full rounded-xl border border-[#bdcbc7] bg-white py-2.5 text-sm font-extrabold text-[#52615f] transition hover:bg-[#f5f5f2]">
                                    {saving ? 'Guardando...' : 'Cerrar ticket'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="medcare-card p-8 text-center text-[#52615f] h-fit">
                        <span className="material-symbols-outlined text-5xl text-[#bdcbc7]">support_agent</span>
                        <p className="mt-3 font-bold">Selecciona un ticket para ver el detalle</p>
                    </div>
                )}
            </div>
        </div>
    )
}