// frontend/src/components/Layout.js
import React, { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import Sidebar from './Sidebar'; // Asumo que tienes un componente Sidebar
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex">
      {/* Asumo que tu Sidebar está en src/components/Sidebar.js */}
      <Sidebar /> 
      
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar bg="light" expand="lg" className="shadow-sm">
          <Container fluid>
            <Navbar.Brand href="#home">Sistema de Control</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto d-flex align-items-center">
                <Nav.Item className="me-3">
                  Bienvenido, <strong>{auth.usuario?.usuario}</strong> ({auth.usuario?.rol})
                </Nav.Item>
                <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <main className="flex-grow-1" style={{ backgroundColor: '#f4f6f9' }}>
          {/* Aquí se renderizará el contenido de cada página (Dashboard, Asistencias, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;