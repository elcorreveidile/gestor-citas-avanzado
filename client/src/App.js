import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({ title: '', start_time: '', end_time: '' });
  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- NUEVOS ESTADOS PARA EL CHAT ---
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- FUNCIONES DEL CHAT ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsChatLoading(true);
    const userMessage = { role: 'user', content: chatInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.reply };
      setChatMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setStatus('Error al contactar con el asistente.');
    } finally {
      setIsChatLoading(false);
      setChatInput('');
    }
  };

  // --- CÓDIGO CRUD EXISTENTE ---
  useEffect(() => {
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error al fetchear:', err));
  }, []);

  useEffect(() => {
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
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        const successMessage = isEditing ? '¡Cita actualizada con éxito!' : `¡Cita creada con éxito! ID: ${data.id}`;
        setStatus(successMessage);
        if (isEditing) {
          setAppointments(appointments.map(app => app.id === data.id ? data : app));
        } else {
          const newAppointment = { ...data, start_time: new Date(data.start_time), end_time: new Date(data.end_time) };
          setAppointments(prev => [...prev, newAppointment]);
        }
        resetForm();
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus('Error de conexión con el servidor.');
    }
  };
  
  const resetForm = () => {
    setFormData({ title: '', start_time: '', end_time: '' });
    setIsEditing(false);
    setEditingId(null);
    setStatus('');
  };

  const handleEdit = (appointment) => {
    setFormData({
      title: appointment.title,
      start_time: appointment.start_time.slice(0, 16),
      end_time: appointment.end_time.slice(0, 16),
    });
    setIsEditing(true);
    setEditingId(appointment.id);
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm('¿Estás seguro de que quieres borrar esta cita?');
    if (!isConfirmed) return;
    try {
      const response = await fetch(`http://localhost:3001/api/appointments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAppointments(appointments.filter(appointment => appointment.id !== id));
        setStatus('Cita borrada exitosamente.');
      } else {
        const errorData = await response.json();
        setStatus(`Error: ${errorData.error}`);
      }
    } catch (error) {
      setStatus('Error de conexión al borrar la cita.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Gestor de Citas con Asistente de IA</h1>
        <p>Mensaje del backend:</p>
        <p><strong>{message || 'Cargando...'}</strong></p>
        
        <hr style={{ width: '50%', margin: '2rem 0' }} />

        <h2>{isEditing ? 'Actualizar Cita' : 'Crear Nueva Cita'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Título de la Cita:</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <label>Fecha y Hora de Inicio:</label>
            <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} required />
          </div>
          <div>
            <label>Fecha y Hora de Fin:</label>
            <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} required />
          </div>
          <button type="submit">{isEditing ? 'Actualizar Cita' : 'Crear Cita'}</button>
          {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '10px', background: '#888' }}>Cancelar</button>
        </form>
        {status && <p><strong>{status}</strong></p>}

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
                  <button onClick={() => handleDelete(appointment.id)} style={{ backgroundColor: 'palegoldenrod', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' }}>
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <hr style={{ width: '50%', margin: '2rem 0' }} />

        {/* --- NUEVA SECCIÓN DEL CHAT --- */}
        <h2>Asistente de IA</h2>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: 'auto' }}>
          <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #444', padding: '10px', borderRadius: '8px', background: '#282c34' }}>
            {chatMessages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ backgroundColor: msg.role === 'user' ? '#007bff' : '#444', color: 'white', padding: '10px 15px', borderRadius: '12px', maxWidth: '70%' }}>
                  <p>{msg.content}</p>
                  {/* Muestra el razonamiento del agente si existe */}
                  {msg