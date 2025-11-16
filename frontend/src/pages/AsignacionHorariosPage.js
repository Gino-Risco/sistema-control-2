// frontend/src/pages/AsignacionHorariosPage.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AsignacionHorariosPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // ID del trabajador desde la URL

  const [trabajador, setTrabajador] = useState(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('08:00');
  const [horaSalida, setHoraSalida] = useState('17:00');
  const [diasLaborales, setDiasLaborales] = useState([1, 2, 3, 4, 5]); // Lunes a Viernes
  const [horariosPredefinidos, setHorariosPredefinidos] = useState([]);

  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [trabRes, horRes] = await Promise.all([
          fetch(`http://localhost:5000/api/workers/${id}`), // Solo trae el trabajador por ID
          fetch('http://localhost:5000/api/horarios')
        ]);

        if (!trabRes.ok) throw new Error('Error al cargar trabajador');
        if (!horRes.ok) throw new Error('Error al cargar horarios');

        const trabData = await trabRes.json();
        const horData = await horRes.json();

        setTrabajador(trabData.worker || trabData); // Ajusta según tu API

        setHorariosPredefinidos(
          Array.isArray(horData)
            ? horData.filter(h => h.tipo === 'predefinido' && h.estado === 'activo')
            : []
        );
      } catch (err) {
        console.error('Error al cargar datos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el trabajador o los horarios.',
          confirmButtonColor: '#2c3e50',
        });
        navigate('/trabajadores'); // Redirigir si hay error
      }
    };

    if (id) {
      cargarDatos();
    } else {
      Swal.fire('Error', 'No se especificó un trabajador.', 'error');
      navigate('/trabajadores');
    }
  }, [id, navigate]);

  // Manejar cambio de turno
  const handleTurnoChange = (e) => {
    const nombreTurno = e.target.value;
    setTurnoSeleccionado(nombreTurno);

    if (nombreTurno) {
      const horario = horariosPredefinidos.find(h => h.nombre_turno === nombreTurno);
      if (horario) {
        const formatTime = (timeStr) => timeStr.split(':').slice(0, 2).join(':');
        setHoraEntrada(formatTime(horario.hora_entrada));
        setHoraSalida(formatTime(horario.hora_salida));

        const diasDB = JSON.parse(horario.dias_laborales);
        const diasJS = diasDB.map(d => (d === 7 ? 0 : d));
        setDiasLaborales(diasJS);
      } else {
        setDiasLaborales([]);
      }
    } else {
      setDiasLaborales([]);
      setHoraEntrada('08:00');
      setHoraSalida('17:00');
    }
  };

  // Asignar horario
  // Asignar horario
  const handleAsignar = async () => {
    const horarioSeleccionado = horariosPredefinidos.find(h => h.nombre_turno === turnoSeleccionado);
    if (!trabajador || !horarioSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Seleccione un turno válido.',
        confirmButtonColor: '#2c3e50',
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/asignacion-horarios/${trabajador.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_horario: horarioSeleccionado.id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al asignar horario');
      }

      // Guardar en sessionStorage que este trabajador fue actualizado
      sessionStorage.setItem('recentlyAssignedWorkerId', trabajador.id);

      Swal.fire({
        icon: 'success',
        title: '¡Horario asignado!',
        text: 'El horario predefinido se ha asignado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });

      // Navegar con state para el efecto de animación
      setTimeout(() => {
        navigate('/trabajadores', {
          state: { trabajadorIdAsignado: trabajador.id }
        });
      }, 1600);

    } catch (err) {
      console.error('Error al asignar horario:', err);
      Swal.fire('Error', err.message || 'No se pudo asignar el horario', 'error');
    }
  };

  // Calendario
  const getDaysInMonth = (year, month) => {
    const days = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const year = parseInt(mes.split('-')[0], 10);
  const month = parseInt(mes.split('-')[1], 10) - 1;
  const days = getDaysInMonth(year, month);
  const nombreMes = new Date(year, month, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Container fluid className="py-4 bg-light" style={{ paddingLeft: '110px', paddingRight: '40px' }}>
      <Card className="shadow-lg border-0 rounded-4" style={{ maxWidth: '880px', width: '100%' }}>
        <Card.Header
          className="text-white d-flex justify-content-between align-items-center rounded-top-4"
          style={{ padding: '1rem 1.5rem', background: 'linear-gradient(135deg, #2c3e50, #1a2530)' }}
        >
          <h4 className="m-0">📅 Asignar Horario</h4>
          <Link to="/trabajadores">
            <Button
              className="text-white fw-semibold px-4 py-2 border-0"
              style={{
                background: 'linear-gradient(135deg, #6c757d, #495057)',
                borderRadius: '30px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              ⬅️ Volver
            </Button>
          </Link>
        </Card.Header>

        <Card.Body className="p-4">
          <Form>

            {/* Mes */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Seleccionar Mes</Form.Label>
              <Form.Control
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="shadow-sm"
              />
            </Form.Group>

            {/* Trabajador (solo lectura) */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Trabajador</Form.Label>
              {trabajador ? (
                <div className="form-control bg-light border text-dark">
                  {trabajador.dni} - {trabajador.nombres} {trabajador.apellidos}
                </div>
              ) : (
                <div className="form-control bg-light border text-muted">
                  Cargando...
                </div>
              )}
            </Form.Group>

            {/* Calendario con título del mes */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Calendario del mes</Form.Label>
              <div className="border rounded p-3 bg-white shadow-sm">
                <div className="text-center mb-3 fw-bold text-primary">{nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</div>
                <div className="d-flex flex-wrap">
                  {days.map((day, index) => {
                    const isLaboral = diasLaborales.includes(day.getDay());
                    return (
                      <div
                        key={index}
                        className={`text-center border m-1 p-2 rounded ${isLaboral ? 'bg-success text-white' : 'bg-light text-muted'}`}
                        style={{ width: '70px', fontSize: '0.9rem' }}
                      >
                        <div>{day.getDate()}</div>
                        <div style={{ fontSize: '0.7rem' }}>
                          {diasNombres[day.getDay()].substring(0, 3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Form.Group>

            {/* Turno */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Turno</Form.Label>
              <Form.Select
                value={turnoSeleccionado}
                onChange={handleTurnoChange}
                className="shadow-sm"
              >
                <option value="">Seleccione un turno</option>
                {horariosPredefinidos.map(h => (
                  <option key={h.id} value={h.nombre_turno}>
                    {h.nombre_turno}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Horas */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">Hora de entrada</Form.Label>
                  <Form.Control
                    type="time"
                    value={horaEntrada}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">Hora de salida</Form.Label>
                  <Form.Control
                    type="time"
                    value={horaSalida}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Días laborales */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Días laborales</Form.Label>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {diasNombres.map((dia, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded fw-medium ${diasLaborales.includes(index)
                        ? 'bg-success text-white'
                        : 'bg-light text-muted border'
                      }`}
                    style={{ minWidth: '50px', textAlign: 'center' }}
                  >
                    {dia.substring(0, 3)}
                  </span>
                ))}
              </div>
            </Form.Group>

            {/* Botón */}
            <div className="d-flex justify-content-center mt-4">
              <Button
                onClick={handleAsignar}
                className="fw-bold py-2 px-5 rounded-3 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #28a745, #218838)',
                  border: 'none',
                  maxWidth: '320px',
                  width: '100%',
                  fontSize: '1.1rem'
                }}
              >
                💾 Asignar Horario
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}