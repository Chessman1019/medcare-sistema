import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (data) => API.post('/auth/login', data)
export const registrarPaciente = (data) => API.post('/auth/registro/paciente', data)
export const solicitarRecuperacionContrasena = (data) => API.post('/auth/recuperar-contrasena/solicitar', data)
export const verificarCodigoRecuperacion = (data) => API.post('/auth/recuperar-contrasena/verificar', data)
export const restablecerContrasena = (data) => API.post('/auth/recuperar-contrasena/restablecer', data)

export const getEspecialidades = () => API.get('/usuarios/especialidades')
export const getDoctores = () => API.get('/usuarios/doctores')
export const getDoctoresPorEspecialidad = (id) => API.get(`/usuarios/doctores/${id}`)
export const getPacientes = () => API.get('/usuarios/pacientes')
export const getListaEspera = () => API.get('/usuarios/lista-espera')
export const getUsuarios = () => API.get('/usuarios')
export const crearUsuario = (data) => API.post('/usuarios', data)

export const getHorarios = (id_doctor) => API.get(`/horarios/${id_doctor}`)

export const crearCita = (data, id_paciente) => API.post(`/citas/?id_paciente=${id_paciente}`, data)
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
export const marcarNotificacionEnviada = (id) => API.put(`/notificaciones/${id}/marcar-enviada`)
export const getSoporteTickets = (params = {}) => API.get('/soporte/tickets', { params })
export const enviarSoporte = (data) => API.post('/soporte/tickets', data)
export const actualizarSoporteTicket = (id, data) => API.put(`/soporte/tickets/${id}/estado`, data)
