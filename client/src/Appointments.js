// /client/src/Appointments.js
import React from 'react';

function Appointments({ user, token }) {
  // --- ESTADOS ---
  const [appointments, setAppointments] = React.useState([]);
  const [formData, setFormData] = React.useState({ title: '', date_time: '' }); // MEJORA: Un solo campo para fecha y hora
  const [status, setStatus] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false); // MEJORA: Estado de carga

  // --- EFECTO PARA CARGAR CITAS ---
  React.useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/user/appointments', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('No se pudieron cargar las citas.');
        const data = await response.json();
        setAppointments(data);
        setStatus(''); // Limpiamos cualquier estado anterior
      } catch (error) {
        console.error('Error al cargar las citas:', error);
        setStatus('No se pudieron cargar tus citas en este momento.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchAppointments();
    }
  }, [user, token]);

  // --- FUNCIONES CRUD ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Enviando...');
    
    // MEJORA: Calculamos la hora de fin automáticamente (ej: 1 hora después del inicio)
    const startTime = new Date(formData.date_time);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hora

    const payload = {
      title: formData.title,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    };

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:3001/api/appointments/${editingId}` : 'http://localhost:3001/api/appointments';
    
    try {
      const response = await fetch(url, { 
        method: method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await response.json();
      if (response.ok) {
        const successMessage = isEditing ? '¡Cita actualizada con éxito!' : `¡Cita creada con éxito!`;
        setStatus(successMessage);
        if (isEditing) { 
          setAppointments(appointments.map(app => app.id === data.id ? data : app)); 
        } else { 
          setAppointments(prev => [...prev, data]); 
        }
        resetForm();
      } else { 
        setStatus(`Error: ${data.error}`); 
      }
    } catch (error) { 
      setStatus('Error de conexión con el servidor.'); 
    }
  };
  
  const resetForm = () => { setFormData({ title: '', date_time: '' }); setIsEditing(false); setEditingId(null); setStatus(''); };
  const handleEdit = (appointment) => { 
    setFormData({ 
      title: appointment.title, 
      date_time: appointment.start_time.slice(0, 16) // Formato para input datetime-local
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

  // --- RENDERIZADO ---
  return (
    <>
      <h2>{isEditing ? 'Actualizar Cita' : 'Crear Nueva Cita'}</h2>
      <form onSubmit={handleSubmit}>
          <input type="text" name="title" placeholder="Título de la cita" value={formData.title} onChange={handleChange} required />
          {/* MEJORA: Un solo campo para fecha y hora */}
          <input type="datetime-local" name="date_time" value={formData.date_time} onChange={handleChange} required />
          <button type="submit">{isEditing ? 'Actualizar Cita' : 'Crear Cita'}</button>
          {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '10px', background: '#888' }}>Cancelar</button>}
      </form>
      {status && <p>{status}</p>}

      <hr style={{ width: '50%', margin: '2rem 0' }} />

      <h2>Mis Citas</h2>
      {isLoading ? (
          <p>Cargando tus citas...</p> // MEJORA: Mensaje de carga
      ) : appointments.length === 0 ? (
          <p>No tienes citas programadas.</p>
      ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
              {appointments.map(appointment => (
                  <li key={appointment.id} style={{ background: '#282c34', padding: '1rem', marginTop: '0.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                          <strong>{appointment.title}</strong>
                          <br />
                          <small>{new Date(appointment.start_time).toLocaleString()}</small>
                      </div>
                      <div>
                          <button onClick={() => handleEdit(appointment)} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' }}>Editar</button>
                          <button onClick={() => handleDelete(appointment.id)} style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' }}>Borrar</button>
                      </div>
                  </li>
              ))}
          </ul>
      )}
    </>
  );
}

export default Appointments;