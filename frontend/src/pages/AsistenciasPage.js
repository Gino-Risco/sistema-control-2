import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Modal, Pagination } from 'react-bootstrap';

import {
  Container,
  Card,
  Button,
  Table,
  Form,
  Row,
  Col,
  Spinner,
  Badge
} from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function AsistenciasPage() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return primerDia.toLocaleDateString('en-CA');
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const hoy = new Date();
    return hoy.toLocaleDateString('en-CA');
  });
  const [dniBusqueda, setDniBusqueda] = useState('');
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userRole } = useContext(AuthContext);

  // Estados para el escaneo remoto
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrMessage, setQrMessage] = useState('');
  const [scanningRemote, setScanningRemote] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const perPage = 10;

  // Formateador de fechas: solo día, mes y año (sin hora)
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.warn('Fecha inválida:', isoString);
      return isoString;
    }
  };

  // Cargar asistencias con paginación
  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('http://localhost:5000/api/asistencia');
      url.searchParams.append('page', currentPage);
      url.searchParams.append('limit', perPage);
      
      if (fechaInicio) url.searchParams.append('fecha_inicio', fechaInicio);
      if (fechaFin) url.searchParams.append('fecha_fin', fechaFin);
      if (dniBusqueda && (userRole === 'Administrador' || userRole === 'Supervisor')) {
        url.searchParams.append('dni', dniBusqueda);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      
      const result = await response.json();
      
      // Soporte para backend con o sin paginación
      if (result.data !== undefined && result.pagination) {
        setAsistencias(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.totalRecords);
      } else {
        // Modo sin paginación (carga todo, pero respeta currentPage para UI)
        const start = (currentPage - 1) * perPage;
        const paginatedData = result.slice(start, start + perPage);
        setAsistencias(paginatedData);
        setTotalPages(Math.ceil(result.length / perPage));
        setTotalRecords(result.length);
      }
    } catch (err) {
      setError('Error al cargar los registros de asistencia');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, fechaInicio, fechaFin, dniBusqueda, userRole]);

  // Función para iniciar escaneo remoto
  const handleStartRemoteScan = async () => {
    setScanningRemote(true);
    setQrMessage('Iniciando escaneo remoto...');

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/asistencia/start-scan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();
      setQrMessage(result.message || result.error);

      if (response.ok) {
        setTimeout(() => fetchAsistencias(), 2000);
      }
    } catch (error) {
      console.error(error);
      setQrMessage('Error al conectar con el servidor');
    } finally {
      setScanningRemote(false);
    }
  };

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  // Renderiza estado con ícono
  const renderEstado = (estado) => {
    if (!estado) return <span className="text-muted">—</span>;

    const config = {
      puntual: { variant: 'success', label: 'Puntual', icon: 'check-circle-fill' },
      tardanza: { variant: 'warning', label: 'Tardanza', icon: 'clock-fill' },
      normal: { variant: 'success', label: 'Normal', icon: 'check-circle-fill' },
      salida_temprano: { variant: 'danger', label: 'Temprano', icon: 'clock-fill' },
      horas_extra: { variant: 'info', label: 'Extra', icon: 'plus-circle-fill' },
      ausente: { variant: 'secondary', label: 'Ausente', icon: 'dash-circle-fill' },
      justificado: { variant: 'primary', label: 'Justificado', icon: 'shield-check' }
    };

    const { variant, label, icon } = config[estado] || { variant: 'secondary', label: estado, icon: 'question-circle-fill' };
    return (
      <Badge bg={variant} className="d-flex align-items-center gap-1 px-2 py-1">
        <i className={`bi bi-${icon}`}></i>
        {label}
      </Badge>
    );
  };

  // Renderiza minutos de diferencia (con signo)
  const renderMinutosDiferencia = (minutos) => {
    if (minutos == null) return '—';
    if (minutos > 0) {
      return <Badge bg="warning" className="px-2 py-1">+{minutos} min</Badge>;
    } else if (minutos < 0) {
      return <Badge bg="success" className="px-2 py-1">{minutos} min</Badge>;
    } else {
      return <Badge bg="secondary" className="px-2 py-1">0 min</Badge>;
    }
  };

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa' }}>
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{
            background: 'linear-gradient(135deg, #2c3e50, #1a2530)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem 0.5rem 0 0'
          }}
        >
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-calendar-check"></i>
            Registro de Asistencias
          </h4>
          <Button
            variant="light"
            className="d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowQrModal(true)}
            style={{
              fontWeight: '500',
              fontSize: '0.95rem',
              borderRadius: '30px',
              padding: '0.5rem 1rem'
            }}
          >
            <i className="bi bi-qr-code-scan"></i>
            Iniciar Escaneo QR Remoto
          </Button>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Filtros */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1); // Reiniciar a página 1 al filtrar
              fetchAsistencias();
            }}
            className="mb-4 p-3 bg-white rounded shadow-sm"
          >
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">
                    <i className="bi bi-calendar-range me-1"></i> Fecha Inicio
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">
                    <i className="bi bi-calendar-range me-1"></i> Fecha Fin
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              {(userRole === 'Administrador' || userRole === 'Supervisor') && (
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-muted">
                      <i className="bi bi-search me-1"></i> Buscar por DNI
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej. 75123456"
                      value={dniBusqueda}
                      onChange={(e) => setDniBusqueda(e.target.value)}
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
              )}
              <Col md={3} className="d-flex align-items-end">
                <Button
                  variant="outline-primary"
                  type="submit"
                  className="me-2 fw-semibold"
                  style={{ minWidth: '100px' }}
                >
                  <i className="bi bi-funnel me-1"></i> Filtrar
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    const hoy = new Date();
                    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                    setFechaInicio(primerDia.toLocaleDateString('en-CA'));
                    setFechaFin(hoy.toLocaleDateString('en-CA'));
                    setDniBusqueda('');
                    setCurrentPage(1);
                    fetchAsistencias();
                  }}
                  className="fw-semibold"
                  style={{ minWidth: '100px' }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Limpiar
                </Button>
              </Col>
            </Row>
          </Form>

          {/* Tabla */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 fw-medium">Cargando registros de asistencia...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-4"></i>
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table
                  striped
                  hover
                  className="align-middle shadow-sm rounded-3 overflow-hidden"
                  style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}
                >
                  <thead
                    className="bg-light"
                    style={{
                      position: 'sticky',
                      top: '0',
                      zIndex: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <tr>
                      <th scope="col" className="fw-bold text-dark">
                        <i className="bi bi-calendar-date me-1"></i> Fecha
                      </th>
                      <th scope="col" className="fw-bold text-dark">
                        <i className="bi bi-person me-1"></i> Trabajador
                      </th>
                      <th scope="col" className="fw-bold text-dark">
                        <i className="bi bi-credit-card me-1"></i> DNI
                      </th>
                      <th scope="col" className="fw-bold text-dark">
                        <i className="bi bi-clock me-1"></i> Horario
                      </th>
                      <th scope="col" className="fw-bold text-dark text-center">
                        <i className="bi bi-clock me-1"></i> Entrada
                      </th>
                      <th scope="col" className="fw-bold text-dark text-center">
                        <i className="bi bi-clock me-1"></i> Salida
                      </th>
                      <th scope="col" className="fw-bold text-dark text-center">
                        <i className="bi bi-hourglass-split me-1"></i> Dif. Entrada
                      </th>
                      <th scope="col" className="fw-bold text-dark text-center">
                        <i className="bi bi-door-open me-1"></i> Estado Entrada
                      </th>
                      <th scope="col" className="fw-bold text-dark text-center">
                        <i className="bi bi-door-closed me-1"></i> Estado Salida
                      </th>
                      <th scope="col" className="fw-bold text-dark text-center">
                        <i className="bi bi-qr-code me-1"></i> Método
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4 text-muted">
                          <i className="bi bi-clipboard-data fs-2 mb-2 d-block"></i>
                          No se encontraron registros
                        </td>
                      </tr>
                    ) : (
                      asistencias.map((asistencia) => (
                        <tr key={asistencia.id}>
                          <td className="fw-bold">{formatDate(asistencia.fecha)}</td>
                          <td>{asistencia.nombre_completo}</td>
                          <td><code>{asistencia.dni}</code></td>
                          <td>{asistencia.horario || '—'}</td>
                          <td className="text-center">{asistencia.hora_entrada || '—'}</td>
                          <td className="text-center">{asistencia.hora_salida || '—'}</td>
                          <td className="text-center">
                            {renderMinutosDiferencia(asistencia.minutos_diferencia_entrada)}
                          </td>
                          <td className="text-center">{renderEstado(asistencia.estado_entrada)}</td>
                          <td className="text-center">{renderEstado(asistencia.estado_salida)}</td>
                          <td className="text-center">
                            <Badge
                              bg={asistencia.metodo_registro === 'qr' ? 'info' : 'secondary'}
                              className="d-flex align-items-center justify-content-center gap-1 px-2 py-1"
                            >
                              {asistencia.metodo_registro === 'qr' ? (
                                <i className="bi bi-qr-code"></i>
                              ) : (
                                <i className="bi bi-pencil-square"></i>
                              )}
                              {asistencia.metodo_registro === 'qr' ? 'QR' : 'Manual'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Paginación */}
              {!loading && asistencias.length > 0 && totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Mostrando {(currentPage - 1) * perPage + 1}–
                    {Math.min(currentPage * perPage, totalRecords)} de {totalRecords} registros
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.First
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Item active>{currentPage}</Pagination.Item>
                    <Pagination.Next
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal para escaneo remoto */}
      <Modal
        show={showQrModal}
        onHide={() => {
          setShowQrModal(false);
          setQrMessage('');
          setScanningRemote(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-qr-code-scan me-2"></i> Escaneo Remoto de QR
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="mb-4">
            Esto activará la cámara en el servidor para escanear códigos QR y registrar
            asistencia automáticamente.
          </p>
          {scanningRemote ? (
            <div className="d-flex flex-column align-items-center gap-3">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="fw-medium">{qrMessage}</p>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartRemoteScan}
              className="px-4 py-2"
            >
              <i className="bi bi-play-fill me-2"></i> Iniciar Escaneo
            </Button>
          )}
          <p className="mt-3 text-muted small">
            El escaneo se detendrá automáticamente después de detectar un QR o por timeout.
          </p>
        </Modal.Body>
      </Modal>
    </Container>
  );
}