// frontend/src/pages/configuracion/ConfiguracionTemaPage.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { FaSun, FaMoon } from 'react-icons/fa';
import { Link } from 'react-router-dom';
export default function ConfiguracionTemaPage() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <Container fluid className="py-4" style={{ paddingLeft: '10px', paddingRight: '40px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">

                    <Link to="/configuracion" className="btn btn-outline-secondary btn-sm">⬅️ Volver</Link>
                    <h3>🎨 Configuración de Tema</h3>
                </div>
            </div>

            <Row>
                <Col md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-4">
                                <div className="me-3" style={{ fontSize: '2rem' }}>
                                    <FaSun color="#f39c12" />
                                </div>
                                <div>
                                    <h5>Modo Claro</h5>
                                    <p className="text-muted mb-0">Tema predeterminado con fondo claro</p>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end">
                                <Button
                                    variant={theme === 'light' ? 'primary' : 'outline-secondary'}
                                    onClick={() => toggleTheme('light')}
                                    disabled={theme === 'light'}
                                >
                                    {theme === 'light' ? 'Seleccionado' : 'Aplicar'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-4">
                                <div className="me-3" style={{ fontSize: '2rem' }}>
                                    <FaMoon color="#3498db" />
                                </div>
                                <div>
                                    <h5>Modo Oscuro</h5>
                                    <p className="text-muted mb-0">Tema con fondo oscuro para mejor visibilidad</p>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end">
                                <Button
                                    variant={theme === 'dark' ? 'primary' : 'outline-secondary'}
                                    onClick={() => toggleTheme('dark')}
                                    disabled={theme === 'dark'}
                                >
                                    {theme === 'dark' ? 'Seleccionado' : 'Aplicar'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}