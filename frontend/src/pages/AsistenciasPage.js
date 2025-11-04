// frontend/src/pages/AsistenciasPage.js
import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

import {
  Container,
  Card,
  Button,
  Table,
  Form,
  Row,
  Col,
  Spinner
} from 'react-bootstrap';

export default function AsistenciasPage() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return primerDia.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [dniBusqueda, setDniBusqueda] = useState('');
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el escaneo remoto
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrMessage, setQrMessage] = useState('');
  const [scanningRemote, setScanningRemote] = useState(false);

  // Cargar asistencias
  const fetchAsistencias = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('http://localhost:5000/api/asistencia');
      if (fechaInicio) url.searchParams.append('fecha_inicio', fechaInicio);
      if (fechaFin) url.searchParams.append('fecha_fin', fechaFin);
      if (dniBusqueda) url.searchParams.append('dni', dniBusqueda);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      const data = await response.json();
      setAsistencias(data);
    } catch (err) {
      setError('Error al cargar los registros de asistencia');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        // Refresca la tabla después de unos segundos
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
  }, []);

  // Renderiza un estado con su badge de Bootstrap
  const renderEstado = (estado) => {
    if (!estado) return <span className="text-muted">—</span>;

    const config = {
      // Estados de entrada
      puntual: { variant: 'success', label: 'Puntual' },
      tardanza: { variant: 'warning', label: 'Tardanza' },

      // Estados de salida
      normal: { variant: 'success', label: 'Normal' },
      salida_temprano: { variant: 'danger', label: 'Temprano' },
      horas_extra: { variant: 'info', label: 'Extra' },

      // Otros (por si los usas en el futuro)
      ausente: { variant: 'secondary', label: 'Ausente' },
      justificado: { variant: 'primary', label: 'Justificado' }
    };

    const { variant, label } = config[estado] || { variant: 'secondary', label: estado };
    return <span className={`badge bg-${variant} rounded-pill`}>{label}</span>;
  };

  return (
    <Container fluid className="p-3">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">📋 Registro de Asistencias</h4>
          <Button variant="success" onClick={() => setShowQrModal(true)}>
            📱 Iniciar Escaneo QR Remoto
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Filtros */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              fetchAsistencias();
            }}
            className="mb-4"
          >
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Buscar por DNI</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej. 75123456"
                    value={dniBusqueda}
                    onChange={(e) => setDniBusqueda(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button variant="outline-primary" type="submit" className="me-2">
                  Filtrar
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    const hoy = new Date();
                    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                    setFechaInicio(primerDia.toISOString().split('T')[0]);
                    setFechaFin(hoy.toISOString().split('T')[0]);
                    setDniBusqueda('');
                    fetchAsistencias();
                  }}
                >
                  Limpiar
                </Button>
              </Col>
            </Row>
          </Form>

          {/* Tabla */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando registros...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <Table responsive striped hover size="sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Trabajador</th>
                  <th>DNI</th>
                  <th>Horario</th>
                  <th className="text-center">Entrada</th>
                  <th className="text-center">Salida</th>
                  <th className="text-center">Tardanza (min)</th>
                  <th className="text-center">Estado Entrada</th>
                  <th className="text-center">Estado Salida</th>
                  <th className="text-center">Método</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">No se encontraron registros</td>
                  </tr>
                ) : (
                  asistencias.map((asistencia) => (
                    <tr key={asistencia.id}>
                      <td>{asistencia.fecha}</td>
                      <td>{asistencia.nombre_completo}</td>
                      <td>{asistencia.dni}</td>
                      <td>{asistencia.horario || '—'}</td>
                      <td className="text-center">{asistencia.hora_entrada || '—'}</td>
                      <td className="text-center">{asistencia.hora_salida || '—'}</td>
                      <td className="text-center">{asistencia.minutos_tardanza || 0}</td>
                      <td className="text-center">{renderEstado(asistencia.estado_entrada)}</td>
                      <td className="text-center">{renderEstado(asistencia.estado_salida)}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${asistencia.metodo_registro === 'qr'
                            ? 'bg-info'
                            : 'bg-secondary'
                            } rounded-pill`}
                        >
                          {asistencia.metodo_registro === 'qr' ? 'QR' : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
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
      >
        <Modal.Header closeButton>
          <Modal.Title>📱 Escaneo Remoto de QR</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>
            Esto activará la cámara en el servidor para escanear códigos QR y registrar
            asistencia automáticamente.
          </p>
          {scanningRemote ? (
            <div>
              <Spinner animation="border" />
              <p>{qrMessage}</p>
            </div>
          ) : (
            <Button variant="primary" onClick={handleStartRemoteScan}>
              Iniciar Escaneo
            </Button>
          )}
          <p className="mt-3 text-muted">
            El escaneo se detendrá automáticamente después de detectar un QR o por timeout.
          </p>
        </Modal.Body>
      </Modal>

    </Container>
  );
}