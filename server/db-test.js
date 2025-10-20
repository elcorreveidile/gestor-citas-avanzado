// server/db-test.js
require('dotenv').config(); // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!
const { Pool } = require('pg');

// Usa la variable de entorno que definiste en .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos exitosa:', res.rows[0]);
    await pool.end(); // Cierra la conexión
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos', err);
  }
}

testConnection();