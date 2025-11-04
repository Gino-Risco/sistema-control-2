// frontend/src/pages/configuracion/ConfiguracionPage.js
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaClock, FaUserShield, FaUserTag, FaPalette, FaHistory, FaInfoCircle } from 'react-icons/fa';

const ConfigCard = ({ title, description, icon: Icon, to, disabled = false }) => (
  <Col md={6} lg={4} className="mb-4">
    <Card 
      className={`h-100 shadow-sm ${disabled ? 'opacity-50' : 'hover-card'}`}
      style={{ 
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onClick={() => !disabled && window.location.hash.includes(to)}
    >
      <Card.Body className="text-center d-flex flex-column align-items-center justify-content-center p-4">
        <div className="mb-3" style={{ fontSize: '2.5rem', color: '#495057' }}>
          <Icon />
        </div>
        <Card.Title className="h5 mb-2">{title}</Card.Title>
        <Card.Text className="text-muted mb-3 small">{description}</Card.Text>
        <Link to={to} className="w-100">
          <Button 
            variant="outline-primary" 
            size="sm"
            disabled={disabled}
            className="w-100"
          >
            {disabled ? 'Próximamente' : 'Configurar'}
          </Button>
        </Link>
      </Card.Body>
    </Card>
  </Col>
);

export default function ConfiguracionPage() {
  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>⚙️ Configuración del Sistema</h3>
      </div>

      <Row>
        <ConfigCard
          title="Horarios"
          description="Gestiona los turnos de trabajo predefinidos"
          icon={FaClock}
          to="/configuracion/horarios"
        />
        
        <ConfigCard
          title="Roles"
          description="Define los roles y permisos del sistema"
          icon={FaUserShield}
          to="/configuracion/roles"
          disabled
        />
        
        <ConfigCard
          title="Usuarios"
          description="Administra los usuarios del sistema"
          icon={FaUserTag}
          to="/configuracion/usuarios"
          disabled
        />
        
        <ConfigCard
          title="Tema"
          description="Cambia entre modo claro y oscuro"
          icon={FaPalette}
          to="/configuracion/tema"
        />
        
        <ConfigCard
          title="Logs del Sistema"
          description="Revisa el historial de actividades"
          icon={FaHistory}
          to="/configuracion/logs"
          disabled
        />
        
        <ConfigCard
          title="Información del Sistema"
          description="Versión, licencia y detalles técnicos"
          icon={FaInfoCircle}
          to="/configuracion/info"
          disabled
        />
      </Row>
    </Container>
  );
}