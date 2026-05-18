import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// IMPORTANTE: Cargar .env ANTES que cualquier otra cosa
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verificar que se cargó
console.log('🔍 DB_URL:', process.env.DB_URL ? '✅ Cargada correctamente' : '❌ No cargada');
console.log('🔍 PORT:', process.env.PORT || '5000');

import express from 'express';
import cors from 'cors';
import { pool } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import creditoRoutes from './routes/credito.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/credito', creditoRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});