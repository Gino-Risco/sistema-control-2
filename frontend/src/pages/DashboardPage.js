// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Badge } from "react-bootstrap";
import {
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaChartLine,
} from "react-icons/fa";
import Chart from "react-apexcharts";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del dashboard
  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/dashboard");
        if (!response.ok) throw new Error("Error al cargar los datos del dashboard");
        const data = await response.json();
        setDashboardData(data);
        setAsistenciasHoy(data.asistencias_hoy || []);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDashboard();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para formatear números
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Gráfico de asistencia por áreas
  const chartOptions = {
    chart: {
      type: 'donut',
      height: 250,
      toolbar: { show: false }
    },
    labels: dashboardData?.areas_chart?.map(a => a.nombre_area) || [],
    colors: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'],
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }]
  };

  const chartSeries = dashboardData?.areas_chart?.map(a => a.total_asistencias) || [];

  if (loading) {
    return (
         <Container fluid className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Cargando datos del dashboard...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
        <Container fluid className="py-4">
        <Card className="text-center py-5">
          <Card.Body>
            <FaExclamationTriangle className="text-warning mb-3" style={{ fontSize: '3rem' }} />
            <Card.Title>Error al cargar los datos</Card.Title>
            <Card.Text className="text-muted">{error}</Card.Text>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
      <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
          <div className="bg-primary bg-opacity-10 p-3 rounded-3">
            <FaChartLine className="text-primary" style={{ fontSize: '2rem' }} />
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-dark"> Dashboard</h2>
            <p className="mb-0 text-muted">Resumen en tiempo real del sistema de asistencia</p>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <Row className="g-4 mb-4">
        {/* Trabajadores Totales */}
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <FaUsers className="text-primary" style={{ fontSize: '1.5rem' }} />
                </div>
                <span className="badge bg-primary">Total</span>
              </div>
              <h3 className="fw-bold mb-1">{formatNumber(dashboardData?.trabajadores_totales || 0)}</h3>
              <p className="text-muted mb-2">Trabajadores registrados</p>
              <div className="mt-auto d-flex gap-2">
                <span className="text-success fw-semibold">
                  <small>✓ {formatNumber(dashboardData?.trabajadores_activos || 0)} activos</small>
                </span>
                <span className="text-secondary fw-semibold">
                  <small>• {formatNumber(dashboardData?.trabajadores_inactivos || 0)} inactivos</small>
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Asistencia Hoy */}
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <FaCheckCircle className="text-success" style={{ fontSize: '1.5rem' }} />
                </div>
                <span className="badge bg-success">Hoy</span>
              </div>
              <h3 className="fw-bold mb-1">{formatNumber(dashboardData?.asistentes_hoy || 0)}</h3>
              <p className="text-muted mb-2">Asistencias registradas hoy</p>
              <div className="mt-auto">
                <span className="text-success fw-semibold">
                  <small>✓ {formatNumber(dashboardData?.puntuales_hoy || 0)} puntuales</small>
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Tardanzas Hoy */}
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                  <FaClock className="text-warning" style={{ fontSize: '1.5rem' }} />
                </div>
                <span className="badge bg-warning text-dark">Hoy</span>
              </div>
              <h3 className="fw-bold mb-1">{formatNumber(dashboardData?.tardanzas_hoy || 0)}</h3>
              <p className="text-muted mb-2">Tardanzas registradas hoy</p>
              <div className="mt-auto">
                <span className="text-warning fw-semibold">
                  <small>⏰ Promedio: {dashboardData?.promedio_tardanza_hoy || 0} min</small>
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Áreas */}
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-3">
                  <FaBuilding className="text-info" style={{ fontSize: '1.5rem' }} />
                </div>
                <span className="badge bg-info">Áreas</span>
              </div>
              <h3 className="fw-bold mb-1">{formatNumber(dashboardData?.areas_totales || 0)}</h3>
              <p className="text-muted mb-2">Áreas en el sistema</p>
              <div className="mt-auto">
                <span className="text-info fw-semibold">
                  <small>📊 {formatNumber(dashboardData?.horarios_totales || 0)} horarios</small>
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Gráfico de Asistencia por Áreas */}
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="border-0 bg-white py-3">
              <h5 className="mb-0 fw-bold">Asistencia por Áreas (Últimos 7 días)</h5>
            </Card.Header>
            <Card.Body>
              {dashboardData?.areas_chart && dashboardData.areas_chart.length > 0 ? (
                <Chart 
                  options={chartOptions} 
                  series={chartSeries} 
                  type="donut" 
                  height={250} 
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No hay datos de asistencia por áreas</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Últimas Asistencias */}
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="border-0 bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Últimas Asistencias</h5>
                <span className="badge bg-primary">
                  {asistenciasHoy.length} hoy
                </span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {asistenciasHoy.length > 0 ? (
                <div className="table-responsive">
                  <Table className="mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th>Trabajador</th>
                        <th>Área</th>
                        <th>Entrada</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistenciasHoy.slice(0, 8).map((asistencia, index) => (
                        <tr key={index}>
                          <td>
                            <small className="fw-medium">
                              {asistencia.nombres} {asistencia.apellidos}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">{asistencia.nombre_area}</small>
                          </td>
                          <td>
                            <small>{asistencia.hora_entrada}</small>
                          </td>
                          <td>
                            {asistencia.estado_entrada === 'puntual' ? (
                              <Badge bg="success" className="px-2 py-1">
                                <small>Puntual</small>
                              </Badge>
                            ) : (
                              <Badge bg="warning" text="dark" className="px-2 py-1">
                                <small>Tardanza</small>
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No hay asistencias registradas hoy</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Resumen Mensual */}
      {dashboardData?.resumen_mensual && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="border-0 bg-white py-3">
                <h5 className="mb-0 fw-bold">Resumen Mensual</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-3">
                      <h4 className="fw-bold text-primary mb-1">
                        {formatNumber(dashboardData.resumen_mensual.dias_laborables)}
                      </h4>
                      <p className="text-muted mb-0">Días laborables</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-3">
                      <h4 className="fw-bold text-success mb-1">
                        {formatNumber(dashboardData.resumen_mensual.total_asistencias)}
                      </h4>
                      <p className="text-muted mb-0">Total asistencias</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-3">
                      <h4 className="fw-bold text-warning mb-1">
                        {formatNumber(dashboardData.resumen_mensual.total_tardanzas)}
                      </h4>
                      <p className="text-muted mb-0">Total tardanzas</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-3">
                      <h4 className="fw-bold text-info mb-1">
                        {dashboardData.resumen_mensual.tasa_asistencia}%
                      </h4>
                      <p className="text-muted mb-0">Tasa de asistencia</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}