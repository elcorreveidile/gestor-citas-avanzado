import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login.js';
import Register from './Register.js';
import './App.css';

// Componente con todo el contenido de la aplicación (citas, chat, etc.)
function AppContent() {
  const { user, logout } = useAuth();

  // --- ESTADOS DEL CRUD Y CHAT ---
  const [message, setMessage] = React.useState('');
  const [appointments, setAppointments] = React.useState([]);
  const [formData, setFormData] = React.useState({ title: '', start_time: '', end_time: '' });
  const [status, setStatus] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState('');
  const [isChatLoading, setIsChatLoading] = React.useState(false);

  // --- EFECTOS CRUD Y CHAT ---
  React.useEffect(() => {
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error al fetchear:', err));
  }, []);

  React.useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/appointments');
        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error('Error al cargar las citas:', error);
      }
    };
    fetchAppointments();
  }, []);

  // --- FUNCIONES CRUD Y CHAT (SIN DUPLICADOS) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Enviando...');
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:3001/api/appointments/${editingId}` : 'http://localhost:3001/api/appointments';
    try {
      const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) {
        const successMessage = isEditing ? '¡Cita actualizada con éxito!' : `¡Cita creada con éxito! ID: ${data.id}`;
        setStatus(successMessage);
        if (isEditing) { setAppointments(appointments.map(app => app.id === data.id ? data : app)); } else { const newAppointment = { ...data, start_time: new Date(data.start_time), end_time: new Date(data.end_time) }; setAppointments(prev => [...prev, newAppointment]); }
        resetForm();
      } else { setStatus(`Error: ${data.error}`); }
    } catch (error) { setStatus('Error de conexión con el servidor.'); }
  };
  
  const resetForm = () => { setFormData({ title: '', start_time: '', end_time: '' }); setIsEditing(false); setEditingId(null); setStatus(''); };
  const handleEdit = (appointment) => { setFormData({ title: appointment.title, start_time: appointment.start_time.slice(0, 16), end_time: appointment.end_time.slice(0, 16) }); setIsEditing(true); setEditingId(appointment.id); };
  const handleDelete = async (id) => { const isConfirmed = window.confirm('¿Estás seguro de que quieres borrar esta cita?'); if (!isConfirmed) return; try { const response = await fetch(`http://localhost:3001/api/appointments/${id}`, { method: 'DELETE' }); if (response.ok) { setAppointments(appointments.filter(appointment => appointment.id !== id)); setStatus('Cita borrada exitosamente.'); } else { const errorData = await response.json(); setStatus(`Error: ${errorData.error}`); } } catch (error) { setStatus('Error de conexión al borrar la cita.'); } };
  const handleSendMessage = async () => { if (!chatInput.trim()) return; setIsChatLoading(true); const userMessage = { role: 'user', content: chatInput }; const newMessages = [...chatMessages, userMessage]; setChatMessages(newMessages); setChatInput(''); try { const response = await fetch('http://localhost:3001/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages }) }); if (!response.ok) { throw new Error('La respuesta del servidor no fue correcta'); } const data = await response.json(); if (data.messages_to_display && Array.isArray(data.messages_to_display)) { setChatMessages(prev => [...prev, ...data.messages_to_display]); } else if (data.error) { setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]); } else { setChatMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, no he podido procesar tu solicitud.' }]); } } catch (error) { console.error('Error al enviar mensaje:', error); setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión con el asistente.' }]); } finally { setIsChatLoading(false); } };

  // --- AQUÍ ESTÁN LOS CAMBIOS ---
  return (
    <div className="App">
      <header className="App-header">
        <h1>Gestor de Citas con Asistente de IA</h1>
        <p>¡Bienvenido, <strong>{user.name}</strong>!</p>
        <button onClick={logout}>Cerrar Sesión</button>
        
        <p>Mensaje del backend: <strong>{message || 'Cargando...'}</strong></p>
        
        <hr style={{ width: '50%', margin: '2rem 0' }} />
        
        <h2>{isEditing ? 'Actualizar Cita' : 'Crear Nueva Cita'}</h2>
        <form onSubmit={handleSubmit}>
            <input type="text" name="title" placeholder="Título" value={formData.title} onChange={handleChange} required />
            <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} required />
            <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} required />
            <button type="submit">{isEditing ? 'Actualizar Cita' : 'Crear Cita'}</button>
            {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '10px', background: '#888' }}>Cancelar</button>}
        </form>
        {status && <p>{status}</p>}

        <hr style={{ width: '50%', margin: '2rem 0' }} />

        <h2>Mis Citas</h2>
        {appointments.length === 0 ? (
            <p>No tienes citas programadas.</p>
        ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {appointments.map(appointment => (
                    <li key={appointment.id} style={{ background: '#282c34', padding: '1rem', marginTop: '0.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>{appointment.title}</strong>
                            <br />
                            <small>Inicio: {new Date(appointment.start_time).toLocaleString()}</small>
                            <br />
                            <small>Fin: {new Date(appointment.end_time).toLocaleString()}</small>
                        </div>
                        <div>
                            <button onClick={() => handleEdit(appointment)} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' }}>
                                Editar
                            </button>
                            <button onClick={() => handleDelete(appointment.id)} style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' }}>
                                Borrar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        )}

        <hr style={{ width: '50%', margin: '2rem 0' }} />
        
        <h2>Asistente de IA</h2>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: 'auto' }}>
            <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #444', padding: '10px', borderRadius: '8px', background: '#282c34' }}>
                {chatMessages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ backgroundColor: msg.role === 'user' ? '#007bff' : '#444', color: 'white', padding: '10px 15px', borderRadius: '12px', maxWidth: '70%' }}>
                            <p style={{ margin: 0 }}>{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isChatLoading && <p style={{ textAlign: 'center', color: '#888' }}>Escribiendo...</p>}
            </div>
            <div style={{ display: 'flex', marginTop: '10px' }}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                    placeholder="Escribe tu mensaje aquí..."
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#3a3f47', color: 'white' }}
                    disabled={isChatLoading}
                />
                <button onClick={handleSendMessage} disabled={isChatLoading} style={{ marginLeft: '10px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}>
                    Enviar
                </button>
            </div>
        </div>
      </header>
    </div>
  );
}

// Componente principal que maneja el login/registro
function App() {
  const { user, isRegistering, setIsRegistering } = useAuth(); // <-- OBTENEMOS setIsRegistering

  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Gestor de Citas con Asistente de IA</h1>
          {isRegistering ? (
            <Register onBackToLogin={() => setIsRegistering(false)} /> // <-- PASAMOS LA PROP
          ) : (
            <Login onGoToRegister={() => setIsRegistering(true)} /> // <-- PASAMOS LA PROP
          )}
        </header>
      </div>
    );
  }

  return <AppContent />;
}

// Componente final que envuelve todo con el Proveedor de Autenticación
function AppWithProvider() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithProvider;