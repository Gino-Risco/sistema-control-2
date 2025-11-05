// frontend/src/pages/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ReportsPage() {
  // Estado para los filtros
  const [activeTab, setActiveTab] = useState('trabajadores');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [trabajadorId, setTrabajadorId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  
  // Estado para los datos
  const [resultados, setResultados] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [trabRes, areaRes] = await Promise.all([
          fetch('http://localhost:5000/api/workers'),
          fetch('http://localhost:5000/api/areas')
        ]);
        
        const trabData = await trabRes.json();
        const areaData = await areaRes.json();
        
        setTrabajadores(trabData);
        setAreas(areaData);
        
        // Establecer fechas por defecto (mes actual)
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        setFechaInicio(primerDia.toISOString().split('T')[0]);
        setFechaFin(ultimoDia.toISOString().split('T')[0]);
        setMes(String(hoy.getMonth() + 1).padStart(2, '0'));
        setAnio(String(hoy.getFullYear()));
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    
    cargarDatos();
  }, []);

  // Función para generar reportes
  const generarReporte = async (tipoReporte) => {
    setLoading(true);
    try {
      let url = '';
      let params = new URLSearchParams();

      switch (tipoReporte) {
        case 'trabajadores':
          url = 'http://localhost:5000/api/reportes/trabajadores';
          break;
          
        case 'asistencia':
          url = 'http://localhost:5000/api/reportes/asistencia';
          params.append('fechaInicio', fechaInicio);
          params.append('fechaFin', fechaFin);
          if (trabajadorId) params.append('trabajadorId', trabajadorId);
          if (areaId) params.append('areaId', areaId);
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
      if (!response.ok) throw new Error('Error al generar el reporte');
      
      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message || 'No se pudo generar el reporte', 'error');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para exportar CSV
  const exportarCSV = () => {
    if (resultados.length === 0) return;

    let headers = [];
    let dataRows = [];

    switch (activeTab) {
      case 'trabajadores':
        headers = ['DNI', 'Nombres', 'Apellidos', 'Email', 'Área', 'Horario', 'Estado'];
        dataRows = resultados.map(r => [
          r.dni,
          r.nombres,
          r.apellidos,
          r.email || '',
          r.nombre_area,
          r.nombre_turno || 'Sin asignar',
          r.estado
        ]);
        break;
        
      case 'asistencia':
        headers = ['DNI', 'Trabajador', 'Área', 'Fecha', 'Entrada', 'Salida', 'Estado Entrada', 'Estado Salida'];
        dataRows = resultados.map(r => [
          r.dni,
          r.trabajador,
          r.nombre_area,
          r.fecha,
          r.hora_entrada,
          r.hora_salida,
          r.estado_entrada,
          r.estado_salida
        ]);
        break;
        
      case 'tardanzas':
        headers = ['DNI', 'Trabajador', 'Área', 'Fecha', 'Entrada Real', 'Entrada Esperada', 'Minutos Tardanza'];
        dataRows = resultados.map(r => [
          r.dni,
          r.trabajador,
          r.nombre_area,
          r.fecha,
          r.hora_entrada_real,
          r.hora_entrada_esperada,
          r.minutos_tardanza
        ]);
        break;
        
      case 'resumen':
        headers = ['DNI', 'Trabajador', 'Área', 'Días Trabajados', 'Tardanzas', 'Salidas Temprano'];
        dataRows = resultados.map(r => [
          r.dni,
          r.trabajador,
          r.nombre_area,
          r.dias_trabajados,
          r.total_tardanzas,
          r.salidas_temprano
        ]);
        break;
        
      case 'areas':
        headers = ['Área', 'Trabajadores', 'Registros', 'Porcentaje Tardanzas'];
        dataRows = resultados.map(r => [
          r.nombre_area,
          r.total_trabajadores,
          r.total_registros,
          `${r.porcentaje_tardanzas?.toFixed(2) || '0'}%`
        ]);
        break;
    }

    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell}"` : cell
      ).join(','))
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

  // Renderizar filtros según la pestaña activa
  const renderFiltros = () => {
    switch (activeTab) {
      case 'trabajadores':
        return null; 
      
      case 'asistencia':
        return (
          <>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Trabajador</Form.Label>
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
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Área</Form.Label>
                <Form.Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  <option value="">Todas</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre_area}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </>
        );
      
      case 'resumen':
        return (
          <>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Mes</Form.Label>
                <Form.Select value={mes} onChange={(e) => setMes(e.target.value)}>
                  <option value="01">Enero</option>
                  <option value="02">Febrero</option>
                  <option value="03">Marzo</option>
                  <option value="04">Abril</option>
                  <option value="05">Mayo</option>
                  <option value="06">Junio</option>
                  <option value="07">Julio</option>
                  <option value="08">Agosto</option>
                  <option value="09">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Año</Form.Label>
                <Form.Control
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  min="2020"
                  max={new Date().getFullYear()}
                />
              </Form.Group>
            </Col>
          </>
        );
      
      default:
        return null;
    }
  };

  // Renderizar tabla de resultados según la pestaña activa
  const renderTabla = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Generando reporte...</p>
        </div>
      );
    }

    if (resultados.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted">No hay datos para mostrar. Genere un reporte.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'trabajadores':
        return (
          <Table striped hover responsive size="sm">
            <thead className="table-light">
              <tr>
                <th>DNI</th>
                <th>Trabajador</th>
                <th>Email</th>
                <th>Área</th>
                <th>Horario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, index) => (
                <tr key={index}>
                  <td><strong>{r.dni}</strong></td>
                  <td>{r.nombres} {r.apellidos}</td>
                  <td>{r.email || '—'}</td>
                  <td>{r.nombre_area}</td>
                  <td>{r.nombre_turno || 'Sin asignar'}</td>
                  <td>
                    <span className={`badge ${r.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
      
      case 'asistencia':
        return (
          <Table striped hover responsive size="sm">
            <thead className="table-light">
              <tr>
                <th>Trabajador</th>
                <th>Área</th>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, index) => (
                <tr key={index}>
                  <td>{r.trabajador}</td>
                  <td>{r.nombre_area}</td>
                  <td>{r.fecha}</td>
                  <td>{r.hora_entrada || '—'}</td>
                  <td>{r.hora_salida || '—'}</td>
                  <td>
                    <div>
                      <small>Entrada: <span className={`badge ${r.estado_entrada === 'puntual' ? 'bg-success' : 'bg-warning'}`}>
                        {r.estado_entrada}
                      </span></small>
                    </div>
                    <div className="mt-1">
                      <small>Salida: <span className={`badge ${r.estado_salida === 'normal' ? 'bg-success' : r.estado_salida === 'salida_temprano' ? 'bg-danger' : 'bg-info'}`}>
                        {r.estado_salida === 'normal' ? 'Normal' : r.estado_salida === 'salida_temprano' ? 'Temprano' : 'Extra'}
                      </span></small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
      
      case 'tardanzas':
        return (
          <Table striped hover responsive size="sm">
            <thead className="table-light">
              <tr>
                <th>Trabajador</th>
                <th>Área</th>
                <th>Fecha</th>
                <th>Entrada Real</th>
                <th>Entrada Esperada</th>
                <th>Minutos Tardanza</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, index) => (
                <tr key={index}>
                  <td>{r.trabajador}</td>
                  <td>{r.nombre_area}</td>
                  <td>{r.fecha}</td>
                  <td>{r.hora_entrada_real}</td>
                  <td>{r.hora_entrada_esperada}</td>
                  <td>
                    <span className="badge bg-warning text-dark">
                      {r.minutos_tardanza}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
      
      case 'resumen':
        return (
          <Table striped hover responsive size="sm">
            <thead className="table-light">
              <tr>
                <th>Trabajador</th>
                <th>Área</th>
                <th>Días Trabajados</th>
                <th>Tardanzas</th>
                <th>Salidas Temprano</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, index) => (
                <tr key={index}>
                  <td>{r.trabajador}</td>
                  <td>{r.nombre_area}</td>
                  <td className="text-center">
                    <span className="badge bg-info">{r.dias_trabajados}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-warning">{r.total_tardanzas}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-danger">{r.salidas_temprano}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
      
  case 'areas':
  return (
    <Table striped hover responsive size="sm">
      <thead className="table-light">
        <tr>
          <th>Área</th>
          <th>Trabajadores</th>
          <th>Registros</th>
          <th>Porcentaje Tardanzas</th>
        </tr>
      </thead>
      <tbody>
        {resultados.map((r, index) => {
          // Aseguramos que sea un número
          const porcentaje = typeof r.porcentaje_tardanzas === 'number' 
            ? r.porcentaje_tardanzas 
            : parseFloat(r.porcentaje_tardanzas) || 0;
            
          return (
            <tr key={index}>
              <td><strong>{r.nombre_area}</strong></td>
              <td className="text-center">{r.total_trabajadores}</td>
              <td className="text-center">{r.total_registros}</td>
              <td className="text-center">
                <span className={`badge ${
                  porcentaje > 10 ? 'bg-danger' :
                  porcentaje > 5 ? 'bg-warning' : 'bg-success'
                }`}>
                  {porcentaje.toFixed(2)}%
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
      
      default:
        return null;
    }
  };

  return (
    <Container fluid className="py-4" >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
         
          <h3>📊 Módulo de Reportes</h3>
        </div>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="trabajadores" title="👥 Trabajadores" />
            <Tab eventKey="asistencia" title="🕒 Asistencia" />
            <Tab eventKey="tardanzas" title="⏰ Tardanzas" />
            <Tab eventKey="resumen" title="📈 Resumen Mensual" />
            <Tab eventKey="areas" title="🏢 Por Áreas" />
          </Tabs>

          {/* Filtros */}
          <Form onSubmit={(e) => { e.preventDefault(); generarReporte(activeTab); }}>
            <Row className="align-items-end">
              {(activeTab === 'asistencia' || activeTab === 'tardanzas' || activeTab === 'areas') && (
                <>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha Inicio</Form.Label>
                      <Form.Control
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha Fin</Form.Label>
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
              
              {renderFiltros()}
              
              <Col md={12} className="mt-3">
                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Generando...' : '📈 Generar Reporte'}
                  </Button>
                  
                  <Button 
                    variant="success" 
                    onClick={exportarCSV}
                    disabled={resultados.length === 0 || loading}
                  >
                    📥 Exportar CSV
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Resultados */}
      <Card className="shadow-sm">
        <Card.Header>
          <strong>Resultados del Reporte</strong>
        </Card.Header>
        <Card.Body>
          {renderTabla()}
        </Card.Body>
      </Card>
    </Container>
  );
}