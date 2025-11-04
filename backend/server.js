const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const dashboardRoutes = require('./routes/dashboardRoutes');
const workerRoutes = require('./routes/workerRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const asignacionHorariosRoutes = require('./routes/asignacionHorariosRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(cors(corsOptions)); 
app.use(express.json({ limit: '10mb' }));

// Servir imágenes con cabeceras CORS
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/asignacion-horarios', asignacionHorariosRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/reportes', reporteRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de Control de Asistencia - Activa' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});