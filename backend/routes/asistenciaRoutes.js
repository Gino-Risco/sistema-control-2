// backend/routes/asistenciaRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// POST /api/asistencia → registrar asistencia (QR)
router.post('/', async (req, res) => {
  const { codigo_qr } = req.body;

  if (!codigo_qr) {
    return res.status(400).json({ error: 'Código QR requerido' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Obtener configuraciones globales
    const [configs] = await conn.execute(`
      SELECT clave, valor FROM configuraciones 
      WHERE clave IN ('tolerancia_tardanza', 'tolerancia_salida', 'dias_laborales')
    `);

    const configMap = configs.reduce((acc, row) => {
      acc[row.clave] = row.valor;
      return acc;
    }, {});

    const toleranciaEntrada = parseInt(configMap['tolerancia_tardanza']) || 15;
    const toleranciaSalida = parseInt(configMap['tolerancia_salida']) || 15;
    const diasLaboralesDefault = configMap['dias_laborales'] ? JSON.parse(configMap['dias_laborales']) : [1, 2, 3, 4, 5];

    // Buscar trabajador por QR
    const [workers] = await conn.execute(`
      SELECT 
        t.id, 
        t.estado,
        h.hora_entrada,
        h.hora_salida,
        h.dias_laborales
      FROM trabajadores t
      LEFT JOIN horarios h ON t.id_horario = h.id
      WHERE t.codigo_qr = ? AND t.estado = 'activo'
    `, [codigo_qr]);

    if (workers.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado, inactivo o sin horario asignado' });
    }

    const trabajador = workers[0];

    // Validar que el horario esté completo
    if (!trabajador.hora_entrada || !trabajador.hora_salida) {
      return res.status(400).json({ error: 'El trabajador no tiene horario definido' });
    }

    // Fecha y hora local (compatible con XAMPP)
    const fechaHoy = new Date().toISOString().split('T')[0];
    const horaActual = new Date().toTimeString().split(' ')[0];

    // Día de la semana (1 = Lunes, 7 = Domingo)
    const diaSemana = new Date().getDay() || 7;

    // Determinar días laborales
    let diasLaborales = [1, 2, 3, 4, 5];
    if (trabajador.dias_laborales) {
      try {
        diasLaborales = JSON.parse(trabajador.dias_laborales);
        if (!Array.isArray(diasLaborales)) throw new Error('Not an array');
      } catch (e) {
        console.warn(`Error parsing dias_laborales for worker ${trabajador.id}:`, e.message);
        diasLaborales = [1, 2, 3, 4, 5];
      }
    } else {
      diasLaborales = diasLaboralesDefault;
    }

    if (!diasLaborales.includes(diaSemana)) {
      return res.status(400).json({ error: 'Hoy no es día laborable para este trabajador' });
    }

    // Verificar si ya existe registro hoy
    const [registros] = await conn.execute(
      `SELECT id, hora_entrada, hora_salida, estado_entrada 
       FROM registros_asistencia 
       WHERE trabajador_id = ? AND fecha = ?`,
      [trabajador.id, fechaHoy]
    );

    if (registros.length === 0) {
      // ========== REGISTRAR ENTRADA ==========
      const [h, m] = trabajador.hora_entrada.split(':').map(Number);
      const horaOficial = new Date(fechaHoy);
      horaOficial.setHours(h, m, 0, 0);

      const horaLimiteEntrada = new Date(horaOficial);
      horaLimiteEntrada.setMinutes(horaLimiteEntrada.getMinutes() + toleranciaEntrada);

      const [hEnt, mEnt, sEnt = 0] = horaActual.split(':').map(Number);
      const entrada = new Date(fechaHoy);
      entrada.setHours(hEnt, mEnt, sEnt, 0);

      const diffMinEntrada = Math.floor((entrada - horaLimiteEntrada) / 60000);
      const minutos_tardanza = diffMinEntrada > 0 ? diffMinEntrada : 0;
      const estado_entrada = minutos_tardanza > 0 ? 'tardanza' : 'puntual';

      await conn.execute(
        `INSERT INTO registros_asistencia 
         (trabajador_id, fecha, hora_entrada, minutos_tardanza, estado_entrada, metodo_registro)
         VALUES (?, ?, ?, ?, ?, 'qr')`,
        [trabajador.id, fechaHoy, horaActual, minutos_tardanza, estado_entrada]
      );

      await conn.commit();
      return res.json({ message: 'Entrada registrada', tipo: 'entrada', estado: estado_entrada });

    } else {
      // ========== REGISTRAR SALIDA ==========
      if (!registros[0].hora_salida) {
        const [hSalida, mSalida] = trabajador.hora_salida.split(':').map(Number);
        const horaSalidaOficial = new Date(fechaHoy);
        horaSalidaOficial.setHours(hSalida, mSalida, 0, 0);

        const [h, m, s = 0] = horaActual.split(':').map(Number);
        const salida = new Date(fechaHoy);
        salida.setHours(h, m, s, 0);

        let estado_salida = 'normal';

        if (salida < horaSalidaOficial) {
          estado_salida = 'salida_temprano';
        } else {
          const horaLimiteSalida = new Date(horaSalidaOficial);
          horaLimiteSalida.setMinutes(horaLimiteSalida.getMinutes() + toleranciaSalida);
          if (salida > horaLimiteSalida) {
            estado_salida = 'horas_extra';
          }
        }

        await conn.execute(
          `UPDATE registros_asistencia 
           SET hora_salida = ?, estado_salida = ?
           WHERE id = ?`,
          [horaActual, estado_salida, registros[0].id]
        );

        await conn.commit();
        return res.json({ message: 'Salida registrada', tipo: 'salida', estado: estado_salida });

      } else {
        await conn.commit();
        return res.status(400).json({ error: 'Ya registró entrada y salida hoy' });
      }
    }

  } catch (error) {
    await conn.rollback();
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ error: 'Error interno al procesar la asistencia' });
  } finally {
    conn.release();
  }
});

// GET /api/asistencia → obtener registros
router.get('/', async (req, res) => {
  const { fecha_inicio, fecha_fin, dni } = req.query;

  // Decodificar el token para obtener el rol y el ID del usuario
  const token = req.headers.authorization?.split(' ')[1];
  let decodedToken;
  try {
    if (!token) {
      return res.status(401).json({ error: 'No autorizado: Token no proporcionado' });
    }
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'No autorizado: Token inválido' });
  }

  const { id: userId, rol: userRole } = decodedToken;

  // Si el rol es Trabajador, forzamos la búsqueda solo para su ID
  if (userRole === 'Trabajador') {
    if (!userId) {
      return res.status(400).json({ error: 'ID de trabajador no encontrado en el token' });
    }
  }

  try {
    let sql = `
      SELECT 
        r.id,
        t.dni,
        CONCAT(t.nombres, ' ', t.apellidos) AS nombre_completo,
        h.nombre_turno AS horario,
        r.fecha,
        r.hora_entrada,
        r.hora_salida,
        r.minutos_tardanza,
        r.estado_entrada,
        r.estado_salida,
        r.metodo_registro
      FROM registros_asistencia r
      INNER JOIN trabajadores t ON r.trabajador_id = t.id
      LEFT JOIN horarios h ON t.id_horario = h.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha_inicio) {
      sql += ' AND r.fecha >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      sql += ' AND r.fecha <= ?';
      params.push(fecha_fin);
    }
    // El filtro por DNI solo aplica para Admin y Supervisor
    if (dni && (userRole === 'Administrador' || userRole === 'Supervisor')) {
      sql += ' AND t.dni LIKE ?';
      params.push(`%${dni}%`);
    } else if (userRole === 'Trabajador') {
      // Si es trabajador, filtramos por su ID de usuario
      sql += ' AND r.trabajador_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY r.fecha DESC, r.hora_entrada DESC';

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
});
const path = require('path');
const { spawn } = require('child_process');

router.post('/start-scan', (req, res) => {
  // Construye la ruta absoluta hacia el script Python
  const scriptPath = path.join(__dirname, '../../qr-scanner/scan_qr.py');

  console.log('Ejecutando script:', scriptPath);

  // Ejecuta el script con Python (usa python3 si es necesario)
  const pythonProcess = spawn('python', [scriptPath]);

  let output = '';
  let errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python stdout]: ${data}`);
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python stderr]: ${data}`);
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Error al ejecutar el script:', errorOutput);
      return res.status(500).json({ error: 'Error al iniciar el escaneo: ' + errorOutput });
    }
    res.json({ message: 'Escaneo iniciado. La cámara está activa.', output });
  });


});

module.exports = router;