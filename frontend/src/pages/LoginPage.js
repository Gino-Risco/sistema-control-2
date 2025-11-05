import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner, Image } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './LoginPage.css';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contraseña }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      login(data.token, data.usuario);

      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${data.usuario.usuario}!`,
        text: `Rol: ${data.usuario.rol}`,
        timer: 2000,
        showConfirmButton: false,
      });

      switch (data.usuario.rol) {
        case 'Administrador':
          navigate('/dashboard');
          break;
        case 'Supervisor':
        case 'Trabajador':
          navigate('/asistencias');
          break;
        default:
          navigate('/');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <Container fluid className="h-100">
        <Row className="h-100">

          {/* Branding lateral */}
          <Col md={6} className="login-branding-col">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Image src="/images/logo.png" width="140" className="mb-4" />
              <h1 className="fw-bold">Control de Asistencia</h1>
              <p className="lead mt-3">Gestión eficiente y centralizada para tu equipo.</p>
            </motion.div>
          </Col>

          {/* Formulario flotante */}
          <Col md={6} className="d-flex justify-content-center align-items-center">
            <motion.div
              className="login-form-wrapper"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="text-center mb-5">
                <h2 className="fw-bold">Iniciar Sesión</h2>
                <p className="text-muted">Ingresa tus credenciales.</p>
              </div>

              <Form onSubmit={handleSubmit}>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-4 position-relative">
                    <FaUser className="input-icon" />
                    <Form.Control
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    placeholder="Nombre de usuario"
                    className="login-input ps-5"
                    size="lg"
                    />
                </Form.Group>
                    
                <Form.Group className="mb-4 position-relative">
                    <FaLock className="input-icon" />
                    <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                    required
                    placeholder="Contraseña"
                    className="login-input ps-5 pe-5"
                    size="lg"
                />
                <span
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
                >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
            </Form.Group>


                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check type="checkbox" label="Recordarme" />
                </div>

                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading} size="lg" className="login-button fw-bold">
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        {' Ingresando...'}
                      </>
                    ) : 'Ingresar'}
                  </Button>
                </div>
              </Form>
            </motion.div>
          </Col>

        </Row>
      </Container>
    </div>
  );
}
