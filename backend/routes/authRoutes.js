// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Es obligatorio definir JWT_SECRET en tu .env
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('⚠️  Advertencia: JWT_SECRET no está definido en el archivo .env');
}

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT.
 */
router.post('/login', async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // Buscar usuario con su rol
    const [users] = await db.execute(
      `SELECT u.id, u.usuario, u.contraseña, u.estado, r.nombre_rol
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id
       WHERE u.usuario = ?`,
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = users[0];

    // Verificar estado
    if (user.estado.toLowerCase() !== 'activo') {
      return res.status(403).json({ error: 'La cuenta de usuario está inactiva o bloqueada.' });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Crear token JWT
    const payload = {
      id: user.id,
      usuario: user.usuario,
      rol: user.nombre_rol,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: payload,
    });

  } catch (error) {
    console.error('❌ Error en el login:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
