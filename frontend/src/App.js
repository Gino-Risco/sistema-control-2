// frontend/src/App.js
import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import UsuariosPage from './pages/UsuariosPage';
import AsignacionHorariosPage from './pages/AsignacionHorariosPage';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import AsistenciasPage from './pages/AsistenciasPage';
import AreasPage from './pages/AreasPage';
import ReportsPage from './pages/ReportsPage';
import PerfilTrabajadorPage from "./pages/PerfilTrabajadorPage";
import ConfiguracionPage from './pages/ConfiguracionPage';
import ConfiguracionHorariosPage from './pages/configuracion/ConfiguracionHorariosPage';
import ConfiguracionTemaPage from './pages/configuracion/ConfiguracionTemaPage';


function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);
  return (
    <div className="App">
      <Sidebar />

      <div
        className="d-flex flex-column"
        style={{
          marginLeft: '250px',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Navbar />

        <Container
          fluid
          className="p-4 flex-grow-1 bg-light"
          style={{ overflowY: 'auto', marginTop: '56px' }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/trabajadores" element={<WorkersPage />} />
            <Route path="/trabajadores/:id" element={<PerfilTrabajadorPage />} />
            <Route path="/asistencias" element={<AsistenciasPage />} />
            <Route path="/asignacion-horarios" element={<AsignacionHorariosPage />} />
            <Route path="/areas" element={<AreasPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/trabajadores/:id" element={<PerfilTrabajadorPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/configuracion/horarios" element={<ConfiguracionHorariosPage />} />
            <Route path="/configuracion/tema" element={<ConfiguracionTemaPage />} />


          </Routes>
        </Container>
      </div>
    </div>
  );
}

export default App;
