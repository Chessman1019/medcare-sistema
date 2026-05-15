import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000/api'
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (data) => API.post('/auth/login', data)
export const registrarPaciente = (data) => API.post('/auth/registro/paciente', data)
export const getEspecialidades = () => API.get('/usuarios/especialidades')
export const getDoctores = () => API.get('/usuarios/doctores')
export const getDoctoresPorEspecialidad = (id) => API.get(`/usuarios/doctores/${id}`)
export const getHorarios = (id_doctor) => API.get(`/horarios/${id_doctor}`)
export const crearCita = (data, id_paciente) => API.post(`/citas/?id_paciente=${id_paciente}`, data)
export const getCitasPaciente = (id) => API.get(`/citas/paciente/${id}`)
export const getCitasDoctor = (id) => API.get(`/citas/doctor/${id}`)
export const cancelarCita = (id) => API.put(`/citas/${id}/cancelar`)
export const getHistorial = (id) => API.get(`/historial/${id}`)