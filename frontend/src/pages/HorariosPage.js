// frontend/src/pages/HorariosPage.js
import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { FaClock } from 'react-icons/fa';

export default function HorariosPage() {
  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>🕒 Gestión de Horarios</h3>
        <Button variant="secondary" disabled>
          <FaClock className="me-2" /> Próximamente
        </Button>
      </div>
      <Card className="shadow-sm">
        <Card.Body className="text-center p-5">
          <p className="text-muted">Esta sección para crear, editar y eliminar horarios estará disponible pronto.</p>
        </Card.Body>
      </Card>
    </Container>
  );
}