// frontend/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Páginas
import AreasPage from './pages/AreasPage';
import AsignacionHorariosPage from './pages/AsignacionHorariosPage';
import AsistenciasPage from './pages/AsistenciasPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import DashboardPage from './pages/DashboardPage';
import HorariosPage from './pages/HorariosPagexd';
import LoginPage from './pages/LoginPage';
import PerfilTrabajadorPage from './pages/PerfilTrabajadorPage';
import ReportsPage from './pages/ReportsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UsuariosPage from './pages/UsuariosPage';
import WorkersPage from './pages/WorkersPage';
import ConfiguracionHorariosPage from './pages/configuracion/ConfiguracionHorariosPage';
import ConfiguracionTemaPage from './pages/configuracion/ConfiguracionTemaPage';






// Componentes
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Rutas Protegidas que usan MainLayout */}
      <Route path="/" element={<MainLayout />}>
        {/* La ruta raíz ahora redirige al dashboard si tienes permiso */}
        <Route index element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="trabajadores" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <WorkersPage />
          </ProtectedRoute>
        } />
        <Route path="trabajadores/:id" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <PerfilTrabajadorPage />
          </ProtectedRoute>
        } />
        <Route path="asistencias" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Supervisor', 'Trabajador']}>
            <AsistenciasPage />
          </ProtectedRoute>
        } />
        <Route path="/asignacion-horarios/:id" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Supervisor']}>
            <AsignacionHorariosPage />
          </ProtectedRoute>
        } />
        <Route path="reportes" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Supervisor']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="usuarios" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <UsuariosPage />
          </ProtectedRoute>
        } />
        <Route
          path="configuracion/horarios"
          element={
            <ProtectedRoute allowedRoles={['Administrador']}>
              <ConfiguracionHorariosPage />
            </ProtectedRoute>
          }
        />

        <Route path="configuracion/tema" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <ConfiguracionTemaPage />
          </ProtectedRoute>
        } />

        <Route path="areas" element={<AreasPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />

        <Route path="horarios" element={<HorariosPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<p>Página no encontrada</p>} />
    </Routes>
  );
}

export default App;
