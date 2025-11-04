// backend/routes/reporteRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Reporte: Lista completa de trabajadores
router.get('/trabajadores', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        t.id,
        t.dni,
        t.nombres,
        t.apellidos,
        t.email,
        t.estado,
        a.nombre_area,
        h.nombre_turno
      FROM trabajadores t
      INNER JOIN areas a ON t.id_area = a.id
      LEFT JOIN horarios h ON t.id_horario = h.id
      ORDER BY t.nombres, t.apellidos
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte: Registro de asistencia detallado
router.get('/asistencia', async (req, res) => {
  const { fechaInicio, fechaFin, trabajadorId, areaId } = req.query;
  
  try {
    let query = `
      SELECT 
        t.dni,
        CONCAT(t.nombres, ' ', t.apellidos) AS trabajador,
        a.nombre_area,
        r.fecha,
        r.hora_entrada,
        r.hora_salida,
        r.estado_entrada,
        r.estado_salida
      FROM registros_asistencia r
      INNER JOIN trabajadores t ON r.trabajador_id = t.id
      INNER JOIN areas a ON t.id_area = a.id
      WHERE r.fecha BETWEEN ? AND ?
    `;
    
    const params = [fechaInicio, fechaFin];
    
    if (trabajadorId) {
      query += ' AND t.id = ?';
      params.push(trabajadorId);
    }
    
    if (areaId) {
      query += ' AND a.id = ?';
      params.push(areaId);
    }
    
    query += ' ORDER BY r.fecha DESC, t.nombres';
    
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte: Tardanzas
router.get('/tardanzas', async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  
  try {
    const query = `
      SELECT 
        t.dni,
        CONCAT(t.nombres, ' ', t.apellidos) AS trabajador,
        a.nombre_area,
        h.hora_entrada AS hora_entrada_esperada,
        r.fecha,
        r.hora_entrada AS hora_entrada_real,
        CASE 
          WHEN r.estado_entrada = 'tardanza' THEN 
            TIMESTAMPDIFF(MINUTE, 
              STR_TO_DATE(CONCAT(r.fecha, ' ', h.hora_entrada), '%Y-%m-%d %H:%i:%s'),
              STR_TO_DATE(CONCAT(r.fecha, ' ', r.hora_entrada), '%Y-%m-%d %H:%i:%s')
            )
          ELSE 0 
        END AS minutos_tardanza
      FROM registros_asistencia r
      INNER JOIN trabajadores t ON r.trabajador_id = t.id
      INNER JOIN areas a ON t.id_area = a.id
      INNER JOIN horarios h ON t.id_horario = h.id
      WHERE r.fecha BETWEEN ? AND ?
        AND r.estado_entrada = 'tardanza'
      ORDER BY minutos_tardanza DESC
    `;
    
    const [rows] = await db.execute(query, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte: Resumen mensual
router.get('/resumen', async (req, res) => {
  const { mes, anio } = req.query;
  
  try {
    const query = `
      SELECT 
        t.dni,
        CONCAT(t.nombres, ' ', t.apellidos) AS trabajador,
        a.nombre_area,
        COUNT(r.id) AS dias_trabajados,
        SUM(CASE WHEN r.estado_entrada = 'tardanza' THEN 1 ELSE 0 END) AS total_tardanzas,
        SUM(CASE WHEN r.estado_salida = 'salida_temprano' THEN 1 ELSE 0 END) AS salidas_temprano
      FROM trabajadores t
      INNER JOIN areas a ON t.id_area = a.id
      LEFT JOIN registros_asistencia r ON t.id = r.trabajador_id 
        AND YEAR(r.fecha) = ? 
        AND MONTH(r.fecha) = ?
      WHERE t.estado = 'activo'
      GROUP BY t.id, t.dni, t.nombres, t.apellidos, a.nombre_area
      ORDER BY t.nombres
    `;
    
    const [rows] = await db.execute(query, [anio, mes]);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte: Por áreas - ¡CORREGIDO!
router.get('/areas', async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  
  try {
    const query = `
      SELECT 
        a.nombre_area,
        COUNT(DISTINCT t.id) AS total_trabajadores,
        COUNT(r.id) AS total_registros,
        -- Aseguramos que siempre sea un número, incluso si es 0
        COALESCE(
          ROUND(
            (SUM(CASE WHEN r.estado_entrada = 'tardanza' THEN 1 ELSE 0 END) * 100.0) / 
            NULLIF(COUNT(r.id), 0), 
            2
          ), 
          0.00
        ) AS porcentaje_tardanzas
      FROM areas a
      INNER JOIN trabajadores t ON a.id = t.id_area
      LEFT JOIN registros_asistencia r ON t.id = r.trabajador_id 
        AND r.fecha BETWEEN ? AND ?
      WHERE t.estado = 'activo'
      GROUP BY a.id, a.nombre_area
      ORDER BY porcentaje_tardanzas DESC
    `;
    
    const [rows] = await db.execute(query, [fechaInicio, fechaFin]);
    
    // Aseguramos que porcentaje_tardanzas sea un número en JavaScript
    const resultado = rows.map(row => ({
      ...row,
      porcentaje_tardanzas: parseFloat(row.porcentaje_tardanzas) || 0
    }));
    
    res.json(resultado);
  } catch (error) {
    console.error('Error en reporte por áreas:', error);
    res.status(500).json({ error: 'Error al generar reporte por áreas' });
  }
});

module.exports = router;