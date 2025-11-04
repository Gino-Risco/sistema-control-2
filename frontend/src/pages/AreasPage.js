// frontend/src/pages/AreasPage.js (versión "Próximamente")
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaBuilding, FaClock } from 'react-icons/fa';

export default function AreasPage() {
  return (
    <Container fluid className="py-4" >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>🏢 Gestión de Áreas</h3>
        <Button variant="secondary" disabled>
          <FaClock className="me-2" /> Próximamente
        </Button>
      </div>

      <Row>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center d-flex flex-column align-items-center justify-content-center p-4">
              <div className="mb-3" style={{ fontSize: '3rem', color: '#6c757d' }}>
                <FaBuilding />
              </div>
              <Card.Title>¿Qué son las Áreas?</Card.Title>
              <Card.Text className="text-muted mb-4">
                Las áreas agrupan a los trabajadores por departamentos (Administración, Producción, etc.)
              </Card.Text>
              <Button variant="outline-primary" disabled>
                Gestionar Áreas
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center d-flex flex-column align-items-center justify-content-center p-4">
              <div className="mb-3" style={{ fontSize: '3rem', color: '#6c757d' }}>
                <FaClock />
              </div>
              <Card.Title>Funcionalidades próximas</Card.Title>
              <Card.Text className="text-muted mb-4">
                • Crear, editar y eliminar áreas<br/>
                • Asignar trabajadores a áreas<br/>
                • Reportes por área
              </Card.Text>
              <Button variant="outline-secondary" disabled>
                Ver detalles
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4 shadow-sm">
        <Card.Body>
          <div className="text-center py-4">
            <p className="text-muted">
              Esta funcionalidad está en desarrollo y estará disponible en una próxima actualización.
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}