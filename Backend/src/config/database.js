import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env directamente en este archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DB_URL;
console.log('📝 Conectando a DB:', dbUrl ? 'URL cargada (longitud: ' + dbUrl.length + ')' : 'No URL');

if (!dbUrl) {
  console.error('❌ ERROR: No se encontró DB_URL en el archivo .env');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

// Probar conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error de conexión a PostgreSQL:');
    console.error('📌 Mensaje:', err.message);
    console.error('📌 Código:', err.code);
  } else {
    console.log('✅ Conectado a PostgreSQL exitosamente');
    release();
  }
});