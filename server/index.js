// server/index.js
require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- FUNCIÓN PARA MANEJAR ERRORES ---
const handleErrors = (error) => {
    console.error('Error en la llamada a la herramienta:', error);
    return { error: error.message };
};

// --- DEFINICIÓN DE LAS FUNCIONES EJECUTABLES (LÓGICA) ---
// Estas son las funciones reales que interactúan con la base de datos.

const create_appointment_function = async ({ title, start_time, end_time }) => {
    try {
        const result = await pool.query(
            'INSERT INTO appointments (title, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
            [title, start_time, end_time]
        );
        return result.rows[0];
    } catch (error) {
        return handleErrors(error);
    }
};

const get_appointments_function = async () => {
    try {
        const result = await pool.query('SELECT * FROM appointments ORDER BY start_time ASC');
        return result.rows;
    } catch (error) {
        return handleErrors(error);
    }
};

// --- MAPEO DE NOMBRES A FUNCIONES ---
// Un mapa para que el agente pueda encontrar la función a ejecutar por su nombre.
const availableFunctions = {
    "create_appointment": create_appointment_function,
    "get_appointments": get_appointments_function,
};

// --- DEFINICIÓN DE HERRAMIENTAS PARA OPENAI (API) ---
// Esta es la definición que le enviamos a OpenAI para que sepa qué puede hacer.
// ¡OJO! Esta estructura es la que exige la última versión de la API de OpenAI.
const tools = [
    {
        type: "function",
        function: {
            name: "create_appointment",
            description: "Crea una nueva cita en la base de datos. Requiere un título, fecha de inicio y fecha de fin.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "El título de la cita (ej: 'Corte de pelo')" },
                    start_time: { type: "string", description: "La fecha y hora de inicio en formato ISO 8601 (ej: '2024-10-25T10:00:00Z')" },
                    end_time: { type: "string", description: "La fecha y hora de fin en formato ISO 8601 (ej: '2024-10-25T10:30:00Z')" },
                },
                required: ["title", "start_time", "end_time"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_appointments",
            description: "Obtiene la lista de todas las citas programadas.",
            parameters: {
                type: "object",
                properties: {},
            },
        },
    }
];

// --- RUTAS CRUD EXISTENTES (Sin cambios) ---
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
        }
        const updateQuery = `UPDATE appointments SET title = $1, start_time = $2, end_time = $3 WHERE id = $4 RETURNING *`;
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


// --- ENDPOINT DE CHAT CON AGENTE (DEPURADO Y CORREGIDO) ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'El formato de los mensajes es incorrecto.' });
        }

        // Paso 1: Enviar el mensaje del usuario a OpenAI y ver si quiere usar una herramienta
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            tools: tools,
            tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;
        const messagesToDisplay = [];

        // Paso 2: Comprobar si el modelo quiere llamar a una función
        if (responseMessage.tool_calls) {
            // Creamos el mensaje para mostrar qué herramienta se está usando
            const toolCallInfo = {
                role: 'assistant',
                content: `🔧 Usando herramienta: ${responseMessage.tool_calls[0].function.name}...`
            };
            messagesToDisplay.push(toolCallInfo);

            // Añadimos la petición de la herramienta a la historia de la conversación
            messages.push(responseMessage);

            // Paso 3: Ejecutar las herramientas que OpenAI ha decidido usar
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionToCall = availableFunctions[functionName];
                const functionArgs = JSON.parse(toolCall.function.arguments);
                
                let functionResponse;
                if (functionToCall) {
                    functionResponse = await functionToCall(functionArgs);
                } else {
                    functionResponse = { error: `Función ${functionName} no encontrada.` };
                }

                // Paso 4: Enviar el resultado de la función de vuelta a OpenAI
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: functionName,
                    content: JSON.stringify(functionResponse),
                });
            }

            // Paso 5: Obtener la respuesta final de OpenAI después de procesar el resultado
            const secondResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
            });

            const finalReply = secondResponse.choices[0].message.content;
            messagesToDisplay.push({ role: 'assistant', content: finalReply });

        } else {
            // Si no se usa ninguna herramienta, devolver la respuesta del modelo
            messagesToDisplay.push({ role: 'assistant', content: responseMessage.content });
        }

        // Devolvemos un array de mensajes para que el frontend los muestre en orden
        res.json({ messages_to_display: messagesToDisplay });

    } catch (error) {
        console.error("Error al contactar con OpenAI:", error);
        res.status(500).json({ error: 'Error del servidor al contactar con la IA.' });
    }
});

// --- RUTAS DE AUTENTICACIÓN (CORREGIDAS) ---

// Ruta de Registro
app.post('/api/auth/register', async (req, res) => { // <-- CAMBIO AQUÍ
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // OJO: En un proyecto real, hashearías la contraseña con bcrypt.
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, password] // <-- ¡OJO! Contraseña en texto plano solo para desarrollo.
    );
    const token = `token-magico-${newUser.rows[0].id}`;
    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') { // Error de duplicado (email único)
      res.status(409).json({ error: 'El email ya está en uso' });
    } else {
      res.status(500).json({ error: 'Error del servidor al registrar usuario' });
    }
  }
});

// Ruta de Login
app.post('/api/auth/login', async (req, res) => { // <-- CAMBIO AQUÍ
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const userResult = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const user = userResult.rows[0];
    if (password !== user.password_hash) { // <-- ¡OJO! Comparación en texto plano solo para desarrollo.
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const token = `token-magico-${user.id}`;
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
  }
});
// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});