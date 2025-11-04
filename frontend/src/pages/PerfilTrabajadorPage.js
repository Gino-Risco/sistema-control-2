import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import workerApi from "../api/workerApi";
import { Card, Table, Row, Col, Image, Spinner, Button } from "react-bootstrap";

export default function PerfilTrabajadorPage() {
    const { id } = useParams();
    const [worker, setWorker] = useState(null);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await workerApi.get(`/${id}`);
                setWorker(response.data.worker);
                setAsistencias(response.data.asistencias);
            } catch (error) {
                console.error("Error cargando perfil:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando información del trabajador...</p>
            </div>
        );
    }

    if (!worker) {
        return <p className="text-center mt-5">No se encontró información del trabajador.</p>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3> Perfil del Trabajador</h3>
                <Link to="/trabajadores">
                    <Button
                        className="text-white fw-semibold px-4 py-2 border-0"
                        style={{
                            background: "linear-gradient(135deg, #007bff, #00bcd4)",
                            borderRadius: "30px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                            transition: "transform 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        ⬅️ Volver
                    </Button>

                </Link>
            </div>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row>
                        <Col md={3} className="text-center">
                            <Image
                                src={
                                    worker.foto
                                        ? `http://localhost:5000${worker.foto.startsWith('/') ? worker.foto : '/' + worker.foto}`
                                        : "https://via.placeholder.com/150?text=Foto"
                                }
                                roundedCircle
                                width={130}
                                height={130}
                                className="border shadow-sm"
                            />
                        </Col>


                        <Col md={9}>
                            <h4>
                                {`${worker.nombres?.toUpperCase() || ""} ${worker.apellidos?.toUpperCase() || ""}`}
                            </h4>
                            <p><strong>DNI:</strong> {worker.dni}</p>
                            <p><strong>Email:</strong> {worker.email || "No especificado"}</p>
                            <p><strong>Área:</strong> {worker.area || "Sin asignar"}</p>
                            <p><strong>Estado:</strong>{" "}
                                <span
                                    className={`badge ${worker.estado === "activo" ? "bg-success" : "bg-danger"
                                        }`}
                                >
                                    {worker.estado}
                                </span>
                            </p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
                <Card.Header>
                    <strong>
                        <i className="bi bi-clock me-2"></i>
                        Horario Asignado: {worker.nombreTurno || 'Sin asignar'}
                    </strong>
                </Card.Header>
                <Card.Body>
                    {worker.horaEntrada ? (
                        <div className="d-flex flex-wrap gap-3">
                            <div className="bg-light p-3 rounded d-flex align-items-center">
                                <i className="bi bi-clock me-2 text-primary"></i>
                                <div>
                                    <small className="text-muted">Entrada</small><br />
                                    <strong>{worker.horaEntrada}</strong>
                                </div>
                            </div>
                            <div className="bg-light p-3 rounded d-flex align-items-center">
                                <i className="bi bi-clock me-2 text-success"></i>
                                <div>
                                    <small className="text-muted">Salida</small><br />
                                    <strong>{worker.horaSalida}</strong>
                                </div>
                            </div>
                            <div className="bg-light p-3 rounded d-flex align-items-center">
                                <i className="bi bi-calendar-week me-2 text-info"></i>
                                <div>
                                    <small className="text-muted">Días Laborales</small><br />
                                    <strong>
                                        {worker.diasLaborales
                                            ? JSON.parse(worker.diasLaborales)
                                                .map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d])
                                                .filter(Boolean) 
                                                .join(', ')
                                            : 'Lun-Vie'}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">
                            <i className="bi bi-exclamation-circle me-2"></i>
                            No tiene horario asignado actualmente.
                        </p>
                    )}
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Header><strong>📅 Últimas asistencias</strong></Card.Header>
                <Card.Body>
                    {asistencias.length > 0 ? (
                        <Table striped hover responsive size="sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora Entrada</th>
                                    <th>Hora Salida</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asistencias.map((a, index) => (
                                    <tr key={index}>
                                        <td>{a.fecha}</td>
                                        <td>{a.hora_entrada || "—"}</td>
                                        <td>{a.hora_salida || "—"}</td>
                                        <td>
                                            <div>
                                                <small>
                                                    Entrada:{" "}
                                                    <span className={`badge bg-${a.estado_entrada === 'puntual' ? 'success' : 'warning'} rounded-pill`}>
                                                        {a.estado_entrada === 'puntual' ? 'Puntual' : 'Tardanza'}
                                                    </span>
                                                </small>
                                            </div>
                                            {a.estado_salida && (
                                                <div className="mt-1">
                                                    <small>
                                                        Salida:{" "}
                                                        <span className={`badge bg-${a.estado_salida === 'normal' ? 'success' : a.estado_salida === 'salida_temprano' ? 'danger' : 'info'} rounded-pill`}>
                                                            {a.estado_salida === 'normal' ? 'Normal' :
                                                                a.estado_salida === 'salida_temprano' ? 'Temprano' : 'Extra'}
                                                        </span>
                                                    </small>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <p>No hay registros recientes de asistencia.</p>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}