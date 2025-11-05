// frontend/src/pages/WorkersPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Button, Table, Image, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import WorkerModal from '../components/workers/WorkerModal';
import WorkerEditModal from '../components/workers/WorkerEditModal';
import WorkerCard from '../components/workers/WorkerCard';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import workerApi from '../api/workerApi';

export default function WorkersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [workers, setWorkers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  // Feedback visual
  const [highlightedWorkerId, setHighlightedWorkerId] = useState(null);

  // Detectar si venimos de asignar horario
  useEffect(() => {
    if (location.state?.trabajadorIdAsignado) {
      setHighlightedWorkerId(location.state.trabajadorIdAsignado);
      const timer = setTimeout(() => setHighlightedWorkerId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const loadWorkers = async () => {
    try {
      const [workersRes, areasRes] = await Promise.all([
        workerApi.get('/'),
        Promise.resolve({
          data: [
            { id: 1, nombre_area: 'Producción' },
            { id: 2, nombre_area: 'Logística' },
            { id: 3, nombre_area: 'Administración' },
            { id: 4, nombre_area: 'Recursos Humanos' }
          ]
        })
      ]);
      setWorkers(workersRes.data);
      setAreas(areasRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    const action = nuevoEstado === 'activo' ? 'activar' : 'inactivar';

    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} trabajador?`,
      text: `El trabajador será ${nuevoEstado}. ${nuevoEstado === 'inactivo' ? 'No podrá registrar asistencia.' : ''}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`http://localhost:5000/api/workers/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      Swal.fire('¡Éxito!', `Trabajador ${nuevoEstado} correctamente`, 'success');
      loadWorkers();
    } catch (err) {
      Swal.fire('Error', 'Error al cambiar estado del trabajador', 'error');
    }
  };

  const handleSaveWorker = async (data) => {
    try {
      const res = await workerApi.post('/', data);
      const newWorker = res.data;
      setSelectedWorker(newWorker);
      loadWorkers();
      setShowModal(false);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setShowEditModal(true);
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const workersFiltrados = useMemo(() => {
    return workers.filter(worker => {
      // Búsqueda por texto (DNI, nombre, apellido)
      const coincideBusqueda =
        !busqueda ||
        worker.dni?.toLowerCase().includes(busqueda.toLowerCase()) ||
        worker.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
        worker.apellidos?.toLowerCase().includes(busqueda.toLowerCase());

      // Filtro por área: comparar IDs como números
      const coincideArea = !areaFiltro ||
        (worker.nombre_area &&
          areas.find(a => a.id === Number(areaFiltro))?.nombre_area === worker.nombre_area);

      // Filtro por estado
      const coincideEstado = !estadoFiltro || worker.estado === estadoFiltro;

      return coincideBusqueda && coincideArea && coincideEstado;
    });
  }, [workers, busqueda, areaFiltro, estadoFiltro]);

  return (
    <Container fluid className="py-4">
      {selectedWorker ? (
        <WorkerCard
          worker={selectedWorker}
          onPrint={() => window.print()}
          onEmail={() =>
            Swal.fire('Info', 'Función de envío por correo no implementada', 'info')
          }
          onBack={() => setSelectedWorker(null)}
        />
      ) : (
        <>
          <Card className="shadow border-0 rounded-4">
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white rounded-top-4">
              <h4 className="mb-0">Gestión de Trabajadores</h4>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2 shadow-sm px-3 py-2 rounded-pill fw-semibold"
                onClick={() => setShowModal(true)}
                style={{
                  background: 'linear-gradient(90deg, #179240ff, #15ac72ff)',
                  border: 'none',
                }}
              >
                <i className="bi bi-person-plus-fill"></i>
                Nuevo Trabajador
              </Button>
            </Card.Header>

            <Card.Body>
              {/* Filtros */}
              <Row className="mb-4 g-3">
                <Col md={4}>
                  <Form.Control
                    type="text"
                    placeholder="🔍 Buscar por DNI, nombre o apellido..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="shadow-sm"
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={areaFiltro}
                    onChange={(e) => setAreaFiltro(e.target.value)}
                    className="shadow-sm"
                  >
                    <option value="">Todas las áreas</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.nombre_area}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="shadow-sm"
                  >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setBusqueda('');
                      setAreaFiltro('');
                      setEstadoFiltro('');
                    }}
                    style={{
                      fontSize: '0.875rem',
                      padding: '0.4rem 0.6rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    🗑️ Limpiar
                  </Button>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-4">Cargando...</div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Foto</th>
                      <th>DNI</th>
                      <th>Nombre Completo</th>
                      <th>Área</th>
                      <th>Código QR</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workersFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No hay trabajadores
                        </td>
                      </tr>
                    ) : (
                      workersFiltrados.map((worker) => {
                        const isHighlighted = highlightedWorkerId === worker.id;
                        return (
                          <tr
                            key={worker.id}
                            className={isHighlighted ? 'table-success' : ''}
                            style={{ transition: 'background-color 0.3s ease' }}
                          >
                            <td>
                              <Image
                                src={
                                  worker.foto
                                    ? `http://localhost:5000${worker.foto.startsWith('/')
                                      ? worker.foto
                                      : '/' + worker.foto
                                    }`
                                    : 'https://via.placeholder.com/50?text=Avatar'
                                }
                                roundedCircle
                                width={50}
                                height={50}
                                className="border"
                                onClick={() => setSelectedWorker(worker)}
                              />
                            </td>
                            <td>{worker.dni}</td>
                            <td>{worker.nombres} {worker.apellidos}</td>
                            <td>{worker.nombre_area}</td>
                            <td>
                              {worker.qrImage ? (
                                <img
                                  src={worker.qrImage}
                                  alt="QR"
                                  width="70"
                                  className="border p-1 rounded"
                                />
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <Button
                                size="sm"
                                style={{
                                  backgroundColor:
                                    worker.estado === 'activo' ? '#28a745' : '#dc3545',
                                  border: 'none',
                                  color: 'white',
                                  fontWeight: '500',
                                  width: '90px',
                                  borderRadius: '12px',
                                  transition: 'background-color 0.3s ease'
                                }}
                                onClick={() => toggleEstado(worker.id, worker.estado)}
                              >
                                {worker.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              </Button>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                className="me-2"
                                style={{
                                  background: isHighlighted
                                    ? 'linear-gradient(135deg, #28a745, #218838)'
                                    : 'linear-gradient(135deg, #3a77d3ff, #628ac7ff)',
                                  color: 'white',
                                  border: 'none',
                                  fontWeight: '500',
                                  boxShadow: isHighlighted
                                    ? '0 0 10px rgba(40, 167, 69, 0.6)'
                                    : '0 2px 4px rgba(0,0,0,0.1)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={() => navigate(`/asignacion-horarios/${worker.id}`)}

                              >
                                🕓 Horario
                              </Button>

                              <Button
                                size="sm"
                                variant="primary"
                                className="me-2"
                                onClick={() => navigate(`/trabajadores/${worker.id}`)}
                              >
                                👤 Perfil
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-warning"
                                onClick={() => handleEdit(worker)}
                              >
                                ✏️ Editar
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <WorkerModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSaveWorker}
            areas={areas}
          />
          <WorkerEditModal
            show={showEditModal}
            onClose={() => setShowEditModal(false)}
            worker={editingWorker}
            onSave={loadWorkers}
            areas={areas}
          />
        </>
      )}
    </Container>
  );
}