// frontend/src/pages/UnauthorizedPage.js
import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <Container className="text-center mt-5">
      <Alert variant="danger">
        <Alert.Heading>Acceso Denegado</Alert.Heading>
        <p>No tienes los permisos necesarios para ver esta página.</p>
        <hr />
        <Link to="/asistencias"><Button variant="outline-danger">Volver al Inicio</Button></Link>
      </Alert>
    </Container>
  );
};

export default UnauthorizedPage;