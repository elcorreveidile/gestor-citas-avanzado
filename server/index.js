// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno desde .env

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Permite peticiones desde otros orígenes (tu frontend)
app.use(express.json()); // Permite al servidor entender JSON

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: '¡Hola desde el Backend! Funciona correctamente.' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});