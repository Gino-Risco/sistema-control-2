// frontend/src/pages/configuracion/ConfiguracionHorariosPage.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes } from 'react-icons/fa';

export default function ConfiguracionHorariosPage() {
  const [horarios, setHorarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nombre_turno: '',
    hora_entrada: '08:00',
    hora_salida: '17:00',
    dias_laborales: [1, 2, 3, 4, 5],
    estado: 'activo'
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Cargar horarios
  const cargarHorarios = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/horarios');
      const data = await res.json();
      setHorarios(data);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      Swal.fire('Error', 'No se pudieron cargar los horarios', 'error');
    }
  };

  useEffect(() => {
    cargarHorarios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDiaToggle = (dia) => {
    setFormData(prev => {
      const nuevosDias = prev.dias_laborales.includes(dia)
        ? prev.dias_laborales.filter(d => d !== dia)
        : [...prev.dias_laborales, dia].sort((a, b) => a - b);
      return { ...prev, dias_laborales: nuevosDias };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditMode 
        ? `http://localhost:5000/api/horarios/${formData.id}`
        : 'http://localhost:5000/api/horarios';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dias_laborales: formData.dias_laborales
        })
      });

      if (res.ok) {
        Swal.fire('Éxito', `Horario ${isEditMode ? 'actualizado' : 'creado'} correctamente`, 'success');
        setShowModal(false);
        cargarHorarios();
        resetForm();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message || 'No se pudo guardar el horario', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      nombre_turno: '',
      hora_entrada: '08:00',
      hora_salida: '17:00',
      dias_laborales: [1, 2, 3, 4, 5],
      estado: 'activo'
    });
    setIsEditMode(false);
  };

  const handleCrear = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditar = (horario) => {
    setFormData({
      id: horario.id,
      nombre_turno: horario.nombre_turno,
      hora_entrada: horario.hora_entrada,
      hora_salida: horario.hora_salida,
      dias_laborales: JSON.parse(horario.dias_laborales),
      estado: horario.estado
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleEliminar = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el horario "${nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5000/api/horarios/${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          Swal.fire('Eliminado', 'El horario ha sido eliminado', 'success');
          cargarHorarios();
        } else {
          throw new Error('Error al eliminar');
        }
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el horario', 'error');
      }
    }
  };

  const handleEstadoToggle = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    
    try {
      const res = await fetch(`http://localhost:5000/api/horarios/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (res.ok) {
        cargarHorarios();
        Swal.fire('Actualizado', `Horario ${nuevoEstado}`, 'success');
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  return (
    <Container fluid className="py-4" style={{ paddingLeft: '10px', paddingRight: '40px' }}>
        
      <div className="d-flex justify-content-between align-items-center mb-4">
      <div className="d-flex align-items-center gap-3">
        <Link to="/configuracion" className="btn btn-outline-secondary btn-sm">
          ← Volver
        </Link>
        <h3 className="mb-0">⏰ Gestión de Horarios</h3>
      </div>
      <Button variant="primary" onClick={handleCrear}>
        <FaPlus className="me-2" /> Nuevo Horario
      </Button>
    </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Nombre del Turno</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Días Laborales</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map(h => (
                <tr key={h.id}>
                  <td><strong>{h.nombre_turno}</strong></td>
                  <td>{h.hora_entrada}</td>
                  <td>{h.hora_salida}</td>
                  <td>
                    {JSON.parse(h.dias_laborales)
                      .map(d => diasSemana[d])
                      .join(', ')}
                  </td>
                  <td>
                    <span className={`badge bg-${h.estado === 'activo' ? 'success' : 'secondary'}`}>
                      {h.estado}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => handleEditar(h)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={h.estado === 'activo' ? 'outline-danger' : 'outline-success'}
                        onClick={() => handleEstadoToggle(h.id, h.estado)}
                      >
                        {h.estado === 'activo' ? <FaTimes /> : <FaEye />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-danger"
                        onClick={() => handleEliminar(h.id, h.nombre_turno)}
                        disabled={h.estado === 'activo'} // Solo permitir eliminar si está inactivo
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal para crear/editar */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditMode ? 'Editar Horario' : 'Crear Nuevo Horario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Turno *</Form.Label>
                  <Form.Control
                    name="nombre_turno"
                    value={formData.nombre_turno}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Mañana Fulltime"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de Entrada *</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora_entrada"
                    value={formData.hora_entrada}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de Salida *</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora_salida"
                    value={formData.hora_salida}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Días Laborales</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {diasSemana.map((dia, index) => (
                      <Button
                        key={index}
                        variant={formData.dias_laborales.includes(index) ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => handleDiaToggle(index)}
                      >
                        {dia}
                      </Button>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {isEditMode ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}