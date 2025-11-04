// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // Métricas principales
    const [trabajadoresTotales] = await db.execute(`
      SELECT COUNT(*) as total FROM trabajadores
    `);
    
    const [trabajadoresActivos] = await db.execute(`
      SELECT COUNT(*) as total FROM trabajadores WHERE estado = 'activo'
    `);
    
    const [trabajadoresInactivos] = await db.execute(`
      SELECT COUNT(*) as total FROM trabajadores WHERE estado = 'inactivo'
    `);
    
    const [areasTotales] = await db.execute(`
      SELECT COUNT(*) as total FROM areas WHERE estado = 'activo'
    `);
    
    const [horariosTotales] = await db.execute(`
      SELECT COUNT(*) as total FROM horarios WHERE estado = 'activo'
    `);

    // Asistencia hoy
    const [asistentesHoy] = await db.execute(`
      SELECT COUNT(*) as total FROM registros_asistencia WHERE fecha = ?
    `, [hoy]);
    
    const [puntualesHoy] = await db.execute(`
      SELECT COUNT(*) as total FROM registros_asistencia WHERE fecha = ? AND estado_entrada = 'puntual'
    `, [hoy]);
    
    const [tardanzasHoy] = await db.execute(`
      SELECT COUNT(*) as total FROM registros_asistencia WHERE fecha = ? AND estado_entrada = 'tardanza'
    `, [hoy]);
    
    const [promedioTardanza] = await db.execute(`
      SELECT AVG(
        TIMESTAMPDIFF(MINUTE, 
          STR_TO_DATE(CONCAT(r.fecha, ' ', h.hora_entrada), '%Y-%m-%d %H:%i:%s'),
          STR_TO_DATE(CONCAT(r.fecha, ' ', r.hora_entrada), '%Y-%m-%d %H:%i:%s')
        )
      ) as promedio
      FROM registros_asistencia r
      INNER JOIN trabajadores t ON r.trabajador_id = t.id
      INNER JOIN horarios h ON t.id_horario = h.id
      WHERE r.fecha = ? AND r.estado_entrada = 'tardanza'
    `, [hoy]);

    // Últimas asistencias de hoy
    const [asistenciasHoy] = await db.execute(`
      SELECT 
        t.nombres,
        t.apellidos,
        a.nombre_area,
        r.hora_entrada,
        r.estado_entrada
      FROM registros_asistencia r
      INNER JOIN trabajadores t ON r.trabajador_id = t.id
      INNER JOIN areas a ON t.id_area = a.id
      WHERE r.fecha = ?
      ORDER BY r.hora_entrada DESC
      LIMIT 10
    `, [hoy]);

    // Asistencia por áreas (últimos 7 días)
    const fecha7Dias = new Date();
    fecha7Dias.setDate(fecha7Dias.getDate() - 7);
    const fecha7DiasStr = fecha7Dias.toISOString().split('T')[0];
    
    const [areasChart] = await db.execute(`
      SELECT 
        a.nombre_area,
        COUNT(r.id) as total_asistencias
      FROM areas a
      INNER JOIN trabajadores t ON a.id = t.id_area
      LEFT JOIN registros_asistencia r ON t.id = r.trabajador_id 
        AND r.fecha BETWEEN ? AND ?
      WHERE t.estado = 'activo'
      GROUP BY a.id, a.nombre_area
      HAVING total_asistencias > 0
      ORDER BY total_asistencias DESC
    `, [fecha7DiasStr, hoy]);

    // Resumen mensual
    const [diasLaborables] = await db.execute(`
      SELECT COUNT(DISTINCT fecha) as total 
      FROM registros_asistencia 
      WHERE fecha BETWEEN ? AND ?
    `, [primerDiaMes, ultimoDiaMes]);
    
    const [totalAsistenciasMes] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM registros_asistencia 
      WHERE fecha BETWEEN ? AND ?
    `, [primerDiaMes, ultimoDiaMes]);
    
    const [totalTardanzasMes] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM registros_asistencia 
      WHERE fecha BETWEEN ? AND ? AND estado_entrada = 'tardanza'
    `, [primerDiaMes, ultimoDiaMes]);

    const tasaAsistencia = diasLaborables[0].total > 0 
      ? Math.round((totalAsistenciasMes[0].total / (diasLaborables[0].total * (await db.execute('SELECT COUNT(*) as total FROM trabajadores WHERE estado = "activo"'))[0].total)) * 100)
      : 0;

    const dashboardData = {
      trabajadores_totales: trabajadoresTotales[0].total,
      trabajadores_activos: trabajadoresActivos[0].total,
      trabajadores_inactivos: trabajadoresInactivos[0].total,
      areas_totales: areasTotales[0].total,
      horarios_totales: horariosTotales[0].total,
      asistentes_hoy: asistentesHoy[0].total,
      puntuales_hoy: puntualesHoy[0].total,
      tardanzas_hoy: tardanzasHoy[0].total,
      promedio_tardanza_hoy: Math.round(promedioTardanza[0].promedio || 0),
      asistencias_hoy: asistenciasHoy,
      areas_chart: areasChart,
      resumen_mensual: {
        dias_laborables: diasLaborables[0].total,
        total_asistencias: totalAsistenciasMes[0].total,
        total_tardanzas: totalTardanzasMes[0].total,
        tasa_asistencia: tasaAsistencia
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error al cargar el dashboard' });
  }
});

module.exports = router;