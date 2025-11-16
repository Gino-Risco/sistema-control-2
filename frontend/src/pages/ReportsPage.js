// frontend/src/pages/ReportsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Tabs,
  Tab,
  Spinner,
  Badge
} from 'react-bootstrap';
import Swal from 'sweetalert2';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ReportsPage() {
  // Estado para los filtros
  const [activeTab, setActiveTab] = useState('trabajadores');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [trabajadorId, setTrabajadorId] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');

  // Estado para los datos
  const [resultados, setResultados] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales (solo trabajadores)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const trabRes = await fetch('http://localhost:5000/api/workers');
        if (!trabRes.ok) throw new Error('Error al cargar trabajadores');

        const trabData = await trabRes.json();
        setTrabajadores(Array.isArray(trabData) ? trabData : []);

        // Fechas por defecto: mes actual
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        setFechaInicio(primerDia.toISOString().split('T')[0]);
        setFechaFin(ultimoDia.toISOString().split('T')[0]);
        setMes(String(hoy.getMonth() + 1).padStart(2, '0'));
        setAnio(String(hoy.getFullYear()));
      } catch (error) {
        console.error('Error al cargar trabajadores:', error);
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudieron cargar los trabajadores. Algunas funcionalidades pueden estar limitadas.',
          confirmButtonColor: '#2c3e50'
        });
      }
    };

    cargarDatos();
  }, []);

  // Formateador de fechas
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Función para generar reportes
  const generarReporte = async (tipoReporte) => {
    if (
      (tipoReporte !== 'trabajadores' && !fechaInicio) ||
      (tipoReporte !== 'trabajadores' && !fechaFin)
    ) {
      Swal.fire('Advertencia', 'Seleccione un rango de fechas válido', 'warning');
      return;
    }

    setLoading(true);
    try {
      let url = '';
      const params = new URLSearchParams();

      switch (tipoReporte) {
        case 'trabajadores':
          url = 'http://localhost:5000/api/reportes/trabajadores';
          break;
        case 'asistencia':
          url = 'http://localhost:5000/api/reportes/asistencia';
          params.append('fechaInicio', fechaInicio);
          params.append('fechaFin', fechaFin);
          if (trabajadorId) params.append('trabajadorId', trabajadorId);
          break;
        case 'tardanzas':
          url = 'http://localhost:5000/api/reportes/tardanzas';
          params.append('fechaInicio', fechaInicio);
          params.append('fechaFin', fechaFin);
          break;
        case 'resumen':
          url = 'http://localhost:5000/api/reportes/resumen';
          params.append('mes', mes);
          params.append('anio', anio);
          break;
        case 'areas':
          url = 'http://localhost:5000/api/reportes/areas';
          params.append('fechaInicio', fechaInicio);
          params.append('fechaFin', fechaFin);
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      const data = await response.json();
      setResultados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      Swal.fire('Error', error.message || 'No se pudo generar el reporte', 'error');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  // Exportar a CSV
  const exportarCSV = () => {
    if (resultados.length === 0) return;

    let headers = [];
    let dataRows = [];

    switch (activeTab) {
      case 'trabajadores':
        headers = ['DNI', 'Nombres', 'Apellidos', 'Email', 'Horario', 'Estado'];
        dataRows = resultados.map(r => [
          r.dni || '',
          r.nombres || '',
          r.apellidos || '',
          r.email || '',
          r.nombre_turno || 'Sin asignar',
          r.estado || ''
        ]);
        break;
      case 'asistencia':
        headers = ['DNI', 'Trabajador', 'Fecha', 'Entrada', 'Salida', 'Estado Entrada', 'Estado Salida'];
        dataRows = resultados.map(r => [
          r.dni || '',
          r.trabajador || '',
          r.fecha || '',
          r.hora_entrada || '',
          r.hora_salida || '',
          r.estado_entrada || '',
          r.estado_salida || ''
        ]);
        break;
      case 'tardanzas':
        headers = ['DNI', 'Trabajador', 'Fecha', 'Entrada Real', 'Entrada Esperada', 'Minutos Tardanza'];
        dataRows = resultados.map(r => [
          r.dni || '',
          r.trabajador || '',
          r.fecha || '',
          r.hora_entrada_real || '',
          r.hora_entrada_esperada || '',
          r.minutos_tardanza || '0'
        ]);
        break;
      case 'resumen':
        headers = ['DNI', 'Trabajador', 'Días Trabajados', 'Tardanzas', 'Salidas Temprano'];
        dataRows = resultados.map(r => [
          r.dni || '',
          r.trabajador || '',
          r.dias_trabajados || '0',
          r.total_tardanzas || '0',
          r.salidas_temprano || '0'
        ]);
        break;
      case 'areas':
        headers = ['Área', 'Trabajadores', 'Registros', 'Porcentaje Tardanzas (%)'];
        dataRows = resultados.map(r => [
          r.nombre_area || '',
          r.total_trabajadores || '0',
          r.total_registros || '0',
          (typeof r.porcentaje_tardanzas === 'number'
            ? r.porcentaje_tardanzas.toFixed(2)
            : (parseFloat(r.porcentaje_tardanzas) || 0).toFixed(2)
          )
        ]);
        break;
      default:
        return;
    }

    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...dataRows.map(row =>
        row
          .map(cell => {
            if (cell == null) return '';
            const str = String(cell).replace(/"/g, '""');
            return /[\s,"]/.test(str) ? `"${str}"` : str;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizar filtros
  const renderFiltros = useMemo(() => {
    switch (activeTab) {
      case 'asistencia':
        return (
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-person me-1"></i> Trabajador
              </Form.Label>
              <Form.Select value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)}>
                <option value="">Todos</option>
                {trabajadores.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombres} {t.apellidos}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        );
      case 'resumen':
        return (
          <>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-calendar-month me-1"></i> Mes
                </Form.Label>
                <Form.Select value={mes} onChange={(e) => setMes(e.target.value)}>
                  {[
                    { value: '01', label: 'Enero' },
                    { value: '02', label: 'Febrero' },
                    { value: '03', label: 'Marzo' },
                    { value: '04', label: 'Abril' },
                    { value: '05', label: 'Mayo' },
                    { value: '06', label: 'Junio' },
                    { value: '07', label: 'Julio' },
                    { value: '08', label: 'Agosto' },
                    { value: '09', label: 'Septiembre' },
                    { value: '10', label: 'Octubre' },
                    { value: '11', label: 'Noviembre' },
                    { value: '12', label: 'Diciembre' }
                  ].map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-calendar me-1"></i> Año
                </Form.Label>
                <Form.Control
                  as="select"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </Form.Control>
              </Form.Group>
            </Col>
          </>
        );
      default:
        return null;
    }
  }, [activeTab, trabajadores, trabajadorId, mes, anio]);

  // Renderizar tabla
  const renderTabla = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Generando reporte...</p>
        </div>
      );
    }

    if (resultados.length === 0) {
      return (
        <div className="text-center py-5">
          <i className="bi bi-file-earmark-text fs-1 text-muted mb-3 d-block"></i>
          <p className="text-muted">No hay datos para mostrar. Genere un reporte.</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table striped hover responsive size="sm" className="align-middle">
          <thead className="table-light">
            {(() => {
              switch (activeTab) {
                case 'trabajadores':
                  return (
                    <tr>
                      <th>DNI</th>
                      <th>Trabajador</th>
                      <th>Email</th>
                      <th>Horario</th>
                      <th className="text-center">Estado</th>
                    </tr>
                  );
                case 'asistencia':
                  return (
                    <tr>
                      <th>Trabajador</th>
                      <th>Fecha</th>
                      <th className="text-center">Entrada</th>
                      <th className="text-center">Salida</th>
                      <th>Estado</th>
                    </tr>
                  );
                case 'tardanzas':
                  return (
                    <tr>
                      <th>Trabajador</th>
                      <th>Fecha</th>
                      <th className="text-center">Entrada Real</th>
                      <th className="text-center">Esperada</th>
                      <th className="text-center">Minutos</th>
                    </tr>
                  );
                case 'resumen':
                  return (
                    <tr>
                      <th>Trabajador</th>
                      <th className="text-center">Días</th>
                      <th className="text-center">Tardanzas</th>
                      <th className="text-center">Temprano</th>
                    </tr>
                  );
                case 'areas':
                  return (
                    <tr>
                      <th>Área</th>
                      <th className="text-center">Trabajadores</th>
                      <th className="text-center">Registros</th>
                      <th className="text-center">Tardanzas (%)</th>
                    </tr>
                  );
                default:
                  return null;
              }
            })()}
          </thead>
          <tbody>
            {resultados.map((r, index) => {
              switch (activeTab) {
                case 'trabajadores':
                  return (
                    <tr key={index}>
                      <td><code>{r.dni}</code></td>
                      <td>{r.nombres} {r.apellidos}</td>
                      <td>{r.email || '—'}</td>
                      <td>{r.nombre_turno || 'Sin asignar'}</td>
                      <td className="text-center">
                        <Badge bg={r.estado === 'activo' ? 'success' : 'secondary'}>
                          {r.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  );
                case 'asistencia':
                  return (
                    <tr key={index}>
                      <td>{r.trabajador || '—'}</td>
                      <td>{formatDate(r.fecha)}</td>
                      <td className="text-center">{r.hora_entrada || '—'}</td>
                      <td className="text-center">{r.hora_salida || '—'}</td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <small>
                            Entrada: <Badge bg={r.estado_entrada === 'puntual' ? 'success' : 'warning'}>
                              {r.estado_entrada === 'puntual' ? 'Puntual' : 'Tardanza'}
                            </Badge>
                          </small>
                          <small>
                            Salida: <Badge bg={
                              r.estado_salida === 'normal' ? 'success' :
                                r.estado_salida === 'salida_temprano' ? 'danger' : 'info'
                            }>
                              {r.estado_salida === 'normal' ? 'Normal' :
                                r.estado_salida === 'salida_temprano' ? 'Temprano' : 'Extra'}
                            </Badge>
                          </small>
                        </div>
                      </td>
                    </tr>
                  );
                case 'tardanzas':
                  return (
                    <tr key={index}>
                      <td>{r.trabajador || '—'}</td>
                      <td>{formatDate(r.fecha)}</td>
                      <td className="text-center">{r.hora_entrada_real || '—'}</td>
                      <td className="text-center">{r.hora_entrada_esperada || '—'}</td>
                      <td className="text-center">
                        <Badge bg="warning" text="dark">
                          {r.minutos_tardanza || 0}
                        </Badge>
                      </td>
                    </tr>
                  );
                case 'resumen':
                  return (
                    <tr key={index}>
                      <td>{r.trabajador || '—'}</td>
                      <td className="text-center">
                        <Badge bg="info" text="dark">{r.dias_trabajados || 0}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="warning" text="dark">{r.total_tardanzas || 0}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="danger">{r.salidas_temprano || 0}</Badge>
                      </td>
                    </tr>
                  );
                case 'areas':
                  const porcentaje = typeof r.porcentaje_tardanzas === 'number'
                    ? r.porcentaje_tardanzas
                    : parseFloat(r.porcentaje_tardanzas) || 0;
                  return (
                    <tr key={index}>
                      <td><strong>{r.nombre_area || '—'}</strong></td>
                      <td className="text-center">{r.total_trabajadores || 0}</td>
                      <td className="text-center">{r.total_registros || 0}</td>
                      <td className="text-center">
                        <Badge bg={
                          porcentaje > 10 ? 'danger' :
                            porcentaje > 5 ? 'warning' : 'success'
                        }>
                          {porcentaje.toFixed(2)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                default:
                  return null;
              }
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Container fluid className="py-4" style={{ paddingLeft: '10px', paddingRight: '40px' }}>
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{
            background: 'linear-gradient(135deg, #2c3e50, #1a2530)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem 0.5rem 0 0'
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-bar-chart fs-3"></i>
            <h4 className="m-0">Módulo de Reportes</h4>
          </div>
        </Card.Header>

        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            style={{ fontWeight: 500 }}
          >
            <Tab eventKey="trabajadores" title="👥 Trabajadores" />
            <Tab eventKey="asistencia" title="🕒 Asistencia" />
            <Tab eventKey="tardanzas" title="⏰ Tardanzas" />
            <Tab eventKey="resumen" title="📈 Resumen Mensual" />
            <Tab eventKey="areas" title="🏢 Por Áreas" />
          </Tabs>

          <Form onSubmit={(e) => { e.preventDefault(); generarReporte(activeTab); }}>
            <Row className="align-items-end g-3">
              {(activeTab === 'asistencia' || activeTab === 'tardanzas' || activeTab === 'areas') && (
                <>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>
                        <i className="bi bi-calendar-range me-1"></i> Fecha Inicio
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>
                        <i className="bi bi-calendar-range me-1"></i> Fecha Fin
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              {renderFiltros}

              <Col md={12} className="mt-2">
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="fw-semibold"
                    style={{ borderRadius: '30px', padding: '0.5rem 1.5rem' }}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          className="me-2"
                        />
                        Generando...
                      </>
                    ) : (
                      '📈 Generar Reporte'
                    )}
                  </Button>

                  <Button
                    variant="success"
                    onClick={exportarCSV}
                    disabled={resultados.length === 0 || loading}
                    className="fw-semibold"
                    style={{ borderRadius: '30px', padding: '0.5rem 1.5rem' }}
                  >
                    <i className="bi bi-download me-1"></i>
                    Exportar CSV
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header
          className="bg-light d-flex justify-content-between align-items-center"
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <strong>Resultados del Reporte</strong>
          {resultados.length > 0 && (
            <span className="text-muted small">
              {resultados.length} {resultados.length === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {renderTabla()}
        </Card.Body>
      </Card>
    </Container>
  );
}