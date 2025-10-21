require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIA } = require('openai');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- DEFINICIÓN DE HERRAMIENTES ---
const handleErrors = (error) => {
  console.error('Error en la llamada a la herramienta:', error);
  return error.message;
};

// --- DEFINICIÓN DE LAS HERRAMIENTAS (FUNCIONES QUE EL AGENTE PUEDE USAR ---
const tools = [
  {
    name: 'create_appointment',
    description: 'Crea una nueva cita en la base de datos. Requiere un título, fecha de inicio y fecha de fin.',
    parameters: {
      title: { type: 'string', description: 'El título de la cita (ej: "Corte de pelo")' },
      start_time: { type: 'string', description: 'La fecha y hora de inicio en formato ISO 8601 (ej: "2023-10-25T10:00:00Z")' },
      end_time: { type: 'string', description: 'La fecha y hora de fin en formato ISO 8601 (ej: "2023-10-25T10:30:00Z")' },
    },
    function: async ({ title, start_time, end_time }) {
      try {
        const result = await pool.query(
          'INSERT INTO appointments (title, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
          [title, start_time, end_time]
        );
        return result.rows[0];
      } catch (error) {
        return handleErrors(error);
      }
    }
  },
  {
    name: 'get_appointments',
    description: 'Obtiene la lista de todas las citas programadas.',
    function: async () => {
      try {
        const result = await pool.query('SELECT * FROM appointments ORDER BY start_time ASC');
        return result.rows;
      } catch (error) {
        return handleErrors(error);
      }
    }
  }
];

// --- RUTAS CRUD EXISTENTES ---
app.get('/api/test', (req, res) => {
  res.json({ message: '¡Hola desde el Backend! Funciona correctamente.' });
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { title, start_time, end_time } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: title, start_time, end_time' });
    }
    const newAppointment = await pool.query('INSERT INTO appointments (title, start_time, end_time) VALUES ($1, $2, $3) RETURNING *', [title, start_time, end_time]);
    res.status(201).json(newAppointment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error del servidor al crear la cita' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const allAppointments = await pool.query('SELECT * FROM appointments ORDER BY start_time ASC');
    res.json(allAppointments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error del servidor al obtener las citas' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteOp = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.status(200).json({ message: 'Cita borrada exitosamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error del servidor al borrar la cita' });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start_time, end_time } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: title, start_time, end_time' });
    const updateQuery = `
      UPDATE appointments 
      SET title = $1, start_time = $2, end_time = $3 
      WHERE id = $4 
      RETURNING *`;
    const updatedAppointment = await pool.query(updateQuery, [title, start_time, end_time, id]);
    if (updatedAppointment.rowCount === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.status(200).json(updatedAppointment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error del servidor al actualizar la cita' });
  }
});

// --- NUEVO ENDPOINT DE CHAT CON AGENTE ---
const { Configuration, OpenAIA } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Endpoint para chatear con el agente de IA con capacidad para usar herramientas
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).json({ error: 'Los mensajes no pueden estar vacíos.' });
    }
    const completion = await openai.chat.completions({
      model: "gpt-4o", // gpt-3.5-turbo también funciona, pero gpt-4o es mejor para tool calling
      messages,
      tools: tools, // ¡Aquí es donde ocurre la magia!
      tool_choice: "auto", // Deja que el modelo decida qué herramienta usar
    });
    const response = completion.choices[0].message;
    res.json({ reply: response.content });
  } catch (error) {
    console.error("Error al contactar con OpenAI:", error);
    res.status(500).json({ error: 'Error del servidor al contactar con la IA.' });
  }
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:3001`);
});