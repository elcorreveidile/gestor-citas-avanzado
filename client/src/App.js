import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Hacemos la petición a nuestro backend cuando el componente se monta
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error al fetchear:', err));
  }, []); // El array vacío asegura que solo se ejecute una vez

  return (
    <div className="App">
      <header className="App-header">
        <h1>Verificación del Stack Completo</h1>
        <p>Mensaje del backend:</p>
        <p><strong>{message || 'Cargando...'}</strong></p>
      </header>
    </div>
  );
}

export default App;