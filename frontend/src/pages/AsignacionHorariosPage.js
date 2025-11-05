// frontend/src/pages/AsignacionHorariosPage.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button } from 'react-bootstrap';
import Select from 'react-select';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import workerApi from '../api/workerApi';

export default function AsignacionHorariosPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // ID del trabajador desde la URL

  const [trabajador, setTrabajador] = useState(null);
  const [trabajadorId, setTrabajadorId] = useState(id || '');
  const [inputValue, setInputValue] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('08:00');
  const [horaSalida, setHoraSalida] = useState('17:00');
  const [diasLaborales, setDiasLaborales] = useState([1, 2, 3, 4, 5]); // JS: 0=Domingo
  const [trabajadores, setTrabajadores] = useState([]);
  const [horariosPredefinidos, setHorariosPredefinidos] = useState([]);
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] = useState(null);
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Cargar datos
  const loadData = async () => {
    try {
      const [trabRes, horRes] = await Promise.all([
        fetch('http://localhost:5000/api/workers'),
        fetch('http://localhost:5000/api/horarios')
      ]);

      if (!trabRes.ok || !horRes.ok) throw new Error('Error al cargar datos');

      const trabData = await trabRes.json();
      const horData = await horRes.json();

      setTrabajadores(Array.isArray(trabData) ? trabData : []);
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
        text: 'No se pudieron cargar los datos. Intente nuevamente.',
        confirmButtonColor: '#2c3e50',
      });
    }
  };

  // Cargar trabajador si viene ID por URL
  useEffect(() => {
    if (id) {
      workerApi.get(`/${id}`)
        .then(res => {
          setTrabajador(res.data.worker || res.data);
          setTrabajadorId(id);
        })
        .catch(err => {
          console.error('Error cargando trabajador:', err);
          Swal.fire('Error', 'No se pudo cargar el trabajador', 'error');
        });
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, []);

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
        const diasJS = diasDB.map(d => d === 7 ? 0 : d);
        setDiasLaborales(diasJS);
        setHorarioSeleccionadoId(horario.id);
      } else {
        setHorarioSeleccionadoId(null);
        setDiasLaborales([]);
      }
    } else {
      setHorarioSeleccionadoId(null);
      setDiasLaborales([]);
    }
  };

  // Asignar horario
  const handleAsignar = async () => {
    if (!trabajadorId || !horarioSeleccionadoId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Seleccione un trabajador y un turno válido.',
        confirmButtonColor: '#2c3e50',
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/asignacion-horarios/${trabajadorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_horario: horarioSeleccionadoId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al asignar horario');
      }

      Swal.fire({
        icon: 'success',
        title: '¡Horario asignado!',
        text: 'El horario predefinido se ha asignado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate('/trabajadores', { state: { trabajadorIdAsignado: trabajadorId } });
      }, 1600);

    } catch (err) {
      console.error('Error al asignar horario:', err);
      Swal.fire('Error', err.message || 'No se pudo asignar el horario', 'error');
    }
  };

  // Calendario
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const year = parseInt(mes.split('-')[0]);
  const month = parseInt(mes.split('-')[1]) - 1;
  const days = getDaysInMonth(year, month);

  return (
    <Container fluid className="py-4 bg-light" style={{ paddingLeft: '180px', paddingRight: '40px' }}>
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
              <Form.Control type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="shadow-sm"/>
            </Form.Group>

            {/* Trabajador */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Trabajador</Form.Label>
              <Select
                value={trabajador ? { value: trabajador.id, label: `${trabajador.dni} - ${trabajador.nombres} ${trabajador.apellidos}` } : null}
                onChange={(option) => setTrabajadorId(option ? option.value : '')}
                onInputChange={(newValue) => setInputValue(newValue)}
                options={trabajadores
                  .filter(t => inputValue && `${t.dni} ${t.nombres} ${t.apellidos}`.toLowerCase().includes(inputValue.toLowerCase()))
                  .map(t => ({ value: t.id, label: `${t.dni} - ${t.nombres} ${t.apellidos}` }))}
                placeholder="🔍 Escriba para buscar trabajador..."
                isDisabled={!!trabajador}
                isClearable
                menuIsOpen={inputValue.length > 0 && !trabajadorId}
              />
            </Form.Group>

            {/* Turno */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Turno</Form.Label>
              <Form.Select value={turnoSeleccionado} onChange={handleTurnoChange} className="shadow-sm">
                <option value="">Seleccione un turno</option>
                {horariosPredefinidos.map(h => (
                  <option key={h.id} value={h.nombre_turno}>{h.nombre_turno}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Horas */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">Hora de entrada</Form.Label>
                  <Form.Control type="time" value={horaEntrada} readOnly className="bg-light"/>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">Hora de salida</Form.Label>
                  <Form.Control type="time" value={horaSalida} readOnly className="bg-light"/>
                </Form.Group>
              </Col>
            </Row>

            {/* Días laborales */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Días laborales</Form.Label>
              <div className="d-flex flex-wrap gap-3 mt-2">
                {diasNombres.map((dia, index) => (
                  <span key={index} className={`px-3 py-1 rounded fw-medium ${diasLaborales.includes(index) ? 'bg-success text-white' : 'bg-light text-muted'}`}>
                    {dia.substring(0, 3)}
                  </span>
                ))}
              </div>
            </Form.Group>

            {/* Botón */}
            <div className="d-flex justify-content-center mt-4">
              <Button onClick={handleAsignar} className="fw-bold py-2 px-5 rounded-3 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #28a745, #218838)', border: 'none', maxWidth: '320px', width: '100%', fontSize: '1.1rem' }}>
                💾 Asignar Horario
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
