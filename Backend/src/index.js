const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const creditoRoutes = require('./routes/credito.routes');
const adminRoutes = require('./routes/admin.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS
const corsOptions = {
  origin: [
    'https://sistema-creditos-cantera.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/credito', creditoRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), message: 'API funcionando' });
});

app.get('/', (req, res) => {
  res.json({ message: 'API Societaria Cantera R.L.', status: 'online' });
});

// Solo escuchar si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  });
}

module.exports = app;