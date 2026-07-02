import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
})

function normalizeApiDetail(detail) {
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || (typeof item === 'string' ? item : ''))
      .filter(Boolean)
      .join(' ')
  }
  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail)
  }
  return detail
}

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    if (data && 'detail' in data) data.detail = normalizeApiDetail(data.detail)
    return Promise.reject(error)
  }
)

export const login = (data) => API.post('/auth/login', data)
export const registrarPaciente = (data) => API.post('/auth/registro/paciente', data)
export const solicitarRecuperacionContrasena = (data) => API.post('/auth/recuperar-contrasena/solicitar', data)
export const verificarCodigoRecuperacion = (data) => API.post('/auth/recuperar-contrasena/verificar', data)
export const restablecerContrasena = (data) => API.post('/auth/recuperar-contrasena/restablecer', data)
export const getPerfil = () => API.get('/auth/me')
export const actualizarPerfil = (data) => API.put('/auth/me', data)
export const cambiarContrasenaPerfil = (data) => API.put('/auth/me/contrasena', data)

export const getEspecialidades = () => API.get('/usuarios/especialidades')
export const getSegurosMedicos = () => API.get('/usuarios/seguros-medicos')
export const getCodigosSugeridos = () => API.get('/usuarios/codigos-sugeridos')
export const getDoctores = () => API.get('/usuarios/doctores')
export const getDoctoresPorEspecialidad = (id) => API.get(`/usuarios/doctores/especialidad/${id}`)
export const getPacientes = () => API.get('/usuarios/pacientes')
export const getListaEspera = () => API.get('/usuarios/lista-espera')
export const getUsuarios = () => API.get('/usuarios')
export const crearUsuario = (data) => API.post('/usuarios', data)

export const getHorarios = (id_doctor) => API.get(`/horarios/${id_doctor}`)
export const crearHorarioDisponible = (data) => API.post('/horarios/', data)

export const crearCita = (data) => API.post('/citas/', data)
export const getAgendaMedica = (params = {}) => API.get('/citas/agenda', { params })
export const getAgendaDoctor = (id, params = {}) => API.get(`/citas/agenda/doctor/${id}`, { params })
export const getTodasCitas = () => API.get('/citas/todas')
export const getCitasHoy = () => API.get('/citas/hoy')
export const getStatsCitas = () => API.get('/citas/stats')
export const getCitasPaciente = (id) => API.get(`/citas/paciente/${id}`)
export const getCitasDoctor = (id) => API.get(`/citas/doctor/${id}`)
export const cancelarCita = (id) => API.put(`/citas/${id}/cancelar`)
export const confirmarCita = (id) => API.put(`/citas/${id}/confirmar`)
export const registrarAsistencia = (id) => API.put(`/citas/${id}/asistencia`)
export const completarCita = (id) => API.put(`/citas/${id}/completar`)
export const registrarSalida = (id) => API.put(`/citas/${id}/salida`)
export const reprogramarCita = (id, data) => API.put(`/citas/${id}/reprogramar`, data)
export const registrarAtencion = (id, data) => API.post(`/citas/${id}/atencion`, data)

export const getHistorial = (id) => API.get(`/historial/${id}`)

export const getNotificacionesPaciente = (id) => API.get(`/notificaciones/paciente/${id}`)
export const getNotificacionesDoctor = (id) => API.get(`/notificaciones/doctor/${id}`)
export const getNotificacionesAdmin = () => API.get('/notificaciones/admin')
export const getNotificacionesCitasPendientes = (rol) => API.get('/notificaciones/citas-pendientes', { params: rol ? { rol } : {} })
export const marcarNotificacionEnviada = (id) => API.put(`/notificaciones/${id}/marcar-enviada`)
export const marcarNotificacionLeida = (id) => API.put(`/notificaciones/${id}/marcar-leida`)
export const eliminarNotificacion = (id) => API.delete(`/notificaciones/${id}`)
export const getSoporteTickets = (params = {}) => API.get('/soporte/tickets', { params })
export const enviarSoporte = (data) => API.post('/soporte/tickets', data)
export const actualizarSoporteTicket = (id, data) => API.put(`/soporte/tickets/${id}/estado`, data)
export const getConfiguracion = () => API.get('/usuarios/configuracion')
export const actualizarConfiguracion = (data) => API.put('/usuarios/configuracion', data)
// Doctores
export const actualizarDoctor = (id, data) => API.put(`/usuarios/doctores/${id}`, data)
export const toggleDisponibleDoctor = (id, disponible) => API.patch(`/usuarios/doctores/${id}/disponible`, { disponible })
