import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import DashboardDoctor from './pages/doctor/DashboardDoctor'
import DashboardRecepcionista from './pages/recepcionista/DashboardRecepcionista'
import DashboardPaciente from './pages/paciente/DashboardPaciente'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/paciente" element={
        <ProtectedRoute rol="paciente"><DashboardPaciente /></ProtectedRoute>
      } />
      <Route path="/dashboard/doctor" element={
        <ProtectedRoute rol="doctor"><DashboardDoctor /></ProtectedRoute>
      } />
      <Route path="/dashboard/recepcionista" element={
        <ProtectedRoute roles={['recepcionista']}><DashboardRecepcionista /></ProtectedRoute>
      } />
      <Route path="/dashboard/admin" element={
        <ProtectedRoute rol="administrador"><DashboardAdmin /></ProtectedRoute>
      } />
    </Routes>
  )
}