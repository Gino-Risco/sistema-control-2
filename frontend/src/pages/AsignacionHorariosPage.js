// frontend/src/pages/AsignacionHorariosPage.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button } from 'react-bootstrap';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AsignacionHorariosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const trabajadorSeleccionado = location.state?.trabajador || null;

  const [trabajadorId, setTrabajadorId] = useState(trabajadorSeleccionado?.id || '');
  const [inputValue, setInputValue] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('08:00');
  const [horaSalida, setHoraSalida] = useState('17:00');
  const [diasLaborales, setDiasLaborales] = useState([1, 2, 3, 4, 5]); // en formato JS (0-6)
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

      if (!trabRes.ok || !horRes.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

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

        // Convertir días de DB (1=Lunes, 7=Domingo) → JS (0=Domingo, 1=Lunes...6=Sábado)
        const diasDB = JSON.parse(horario.dias_laborales);
        const diasJS = diasDB.map(d => d === 7 ? 0 : d); // 7 → 0 (Domingo)

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

  // Asignar horario predefinido
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
      const asignarResponse = await fetch(
        `http://localhost:5000/api/asignacion-horarios/${trabajadorId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_horario: horarioSeleccionadoId })
        }
      );

      if (!asignarResponse.ok) {
        const errorData = await asignarResponse.json();
        throw new Error(errorData.error || 'Error al asignar el horario');
      }

      // ✅ Éxito: regresar a la lista con feedback
      Swal.fire({
        icon: 'success',
        title: '¡Horario asignado!',
        text: 'El horario predefinido se ha asignado correctamente.',
        confirmButtonColor: '#28a745',
        timer: 1500,
        showConfirmButton: false,
      });
      // Al final del bloque de éxito en handleAsignar (después del Swal.fire)
      setTimeout(() => {
        navigate('/trabajadores', {
          state: { trabajadorIdAsignado: trabajadorId }
        });
      }, 1600);

      // Esperar un momento para que el toast se vea
      setTimeout(() => {
        navigate('/trabajadores', {
          state: {
            trabajadorIdAsignado: trabajadorId
          }
        });
      }, 1600);

    } catch (err) {
      console.error('Error al asignar horario:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo asignar el horario.',
        confirmButtonColor: '#dc3545',
      });
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
          style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #2c3e50, #1a2530)',
          }}
        >
          <h4 className="m-0">📅 Asignar Horario</h4>
          <Link to="/trabajadores">
            <Button
              className="text-white fw-semibold px-4 py-2 border-0"
              style={{
                background: 'linear-gradient(135deg, #6c757d, #495057)',
                borderRadius: '30px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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

            {/* Trabajador */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Trabajador</Form.Label>
              <Select
                value={
                  trabajadorId
                    ? {
                      value: trabajadorId,
                      label: `${trabajadorSeleccionado?.dni || ''} - ${trabajadorSeleccionado?.nombres || ''} ${trabajadorSeleccionado?.apellidos || ''}`,
                    }
                    : null
                }
                onChange={(option) => setTrabajadorId(option ? option.value : '')}
                onInputChange={(newValue) => setInputValue(newValue)}
                options={trabajadores
                  .filter(
                    (t) =>
                      inputValue &&
                      `${t.dni} ${t.nombres} ${t.apellidos}`
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                  )
                  .map((t) => ({
                    value: t.id,
                    label: `${t.dni} - ${t.nombres} ${t.apellidos}`,
                  }))}
                placeholder="🔍 Escriba para buscar trabajador..."
                isDisabled={!!trabajadorSeleccionado}
                isClearable
                menuIsOpen={inputValue.length > 0 && !trabajadorId}
                noOptionsMessage={() =>
                  inputValue ? 'No se encontraron resultados' : 'Escriba para buscar...'
                }
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'white',
                    borderColor: '#ced4da',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    '&:hover': { borderColor: '#adb5bd' }
                  }),
                  singleValue: (base) => ({ ...base, color: '#495057' }),
                  input: (base) => ({ ...base, color: '#495057' }),
                  placeholder: (base) => ({ ...base, color: '#6c757d' })
                }}
              />
            </Form.Group>

            {/* Calendario */}
            {mes && (
              <div className="mb-4">
                <h5 className="text-center fw-bold text-muted mb-3">
                  {new Date(year, month).toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h5>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {days.map((day, index) => {
                    const diaSemana = day.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
                    const esLaborable = diasLaborales.includes(diaSemana);
                    return (
                      <div
                        key={index}
                        className="border rounded-3 d-flex flex-column align-items-center justify-content-center"
                        style={{
                          width: '70px',
                          height: '70px',
                          backgroundColor: esLaborable ? '#e9ecef' : '#f8f9fa',
                          border: esLaborable ? '2px solid #28a745' : '1px solid #dee2e6',
                        }}
                      >
                        <div className="fw-semibold">{day.getDate()}</div>
                        <small className="text-muted">{diasNombres[diaSemana].substring(0, 3)}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Turno */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted">Turno</Form.Label>
              <Form.Select
                value={turnoSeleccionado}
                onChange={handleTurnoChange}
                className="shadow-sm"
              >
                <option value="">Seleccione un turno</option>
                {horariosPredefinidos.map((h) => (
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
              <div className="d-flex flex-wrap gap-3 mt-2">
                {diasNombres.map((dia, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded fw-medium ${diasLaborales.includes(index)
                        ? 'bg-success text-white'
                        : 'bg-light text-muted'
                      }`}
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
                  fontSize: '1.1rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
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