const express = require('express');
const router = express.Router();
const db = require('../config/database');

//  GET /api/horarios → Obtener todos los horarios
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, nombre_turno, hora_entrada, hora_salida, dias_laborales, tipo, estado
      FROM horarios
      ORDER BY nombre_turno
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

//  POST /api/horarios → Crear un horario personalizado
router.post('/', async (req, res) => {
  const { nombre_turno, hora_entrada, hora_salida, dias_laborales = [1,2,3,4,5] } = req.body;

  if (!nombre_turno || !hora_entrada || !hora_salida) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO horarios (nombre_turno, hora_entrada, hora_salida, dias_laborales, tipo, estado)
       VALUES (?, ?, ?, ?, 'personalizado', 'activo')`,
      [nombre_turno, hora_entrada, hora_salida, JSON.stringify(dias_laborales)]
    );

    res.status(201).json({
      id: result.insertId,
      message: '✅ Horario personalizado creado correctamente'
    });
  } catch (error) {
    console.error('Error al crear horario:', error);
    res.status(500).json({ error: 'Error al crear horario' });
  }
});
// 🔹 PATCH /api/horarios/:id → Editar un horario existente
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_turno, hora_entrada, hora_salida, dias_laborales, estado } = req.body;

  // Validar campos requeridos
  if (!nombre_turno || !hora_entrada || !hora_salida) {
    return res.status(400).json({ error: 'Nombre, hora de entrada y salida son requeridos' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que el horario existe
    const [horarioExists] = await conn.execute(
      `SELECT id FROM horarios WHERE id = ?`,
      [id]
    );
    if (horarioExists.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Actualizar el horario
    await conn.execute(
      `UPDATE horarios 
       SET nombre_turno = ?, hora_entrada = ?, hora_salida = ?, dias_laborales = ?, estado = ?
       WHERE id = ?`,
      [nombre_turno, hora_entrada, hora_salida, JSON.stringify(dias_laborales), estado, id]
    );

    await conn.commit();
    res.json({ message: '✅ Horario actualizado correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error('Error al editar horario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
});
// 🔹 DELETE /api/horarios/:id → Eliminar un horario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que el horario existe
    const [horarioExists] = await conn.execute(
      `SELECT id FROM horarios WHERE id = ?`,
      [id]
    );
    if (horarioExists.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Eliminar el horario
    await conn.execute(
      `DELETE FROM horarios WHERE id = ?`,
      [id]
    );

    await conn.commit();
    res.json({ message: '✅ Horario eliminado correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
});

module.exports = router;
