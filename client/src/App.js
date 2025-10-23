// /client/src/App.js
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login.js';
import Register from './Register.js';
import Appointments from './Appointments.js';
import Chat from './Chat.js';
import './App.css';

// Componente con todo el contenido de la aplicación (ahora más limpio)
function AppContent() {
  const { user, token, logout } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Gestor de Citas con Asistente de IA</h1>
        <p>¡Bienvenido, <strong>{user.name}</strong>!</p>
        <button onClick={logout}>Cerrar Sesión</button>
        
        <hr style={{ width: '50%', margin: '2rem 0' }} />
        
        {/* Usamos el nuevo componente y le pasamos los datos que necesita */}
        <Appointments user={user} token={token} />

        <hr style={{ width: '50%', margin: '2rem 0' }} />
        
        <h2>Asistente de IA</h2>
        {/* MEJORA CLAVE: Solo renderizamos el chat si el objeto 'user' existe */}
        {user && <Chat />}
      </header>
    </div>
  );
}

// Componente principal que maneja el login/registro
function App() {
  const { user, isRegistering, setIsRegistering } = useAuth();

  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Gestor de Citas con Asistente de IA</h1>
          {isRegistering ? (
            <Register onBackToLogin={() => setIsRegistering(false)} />
          ) : (
            <Login onGoToRegister={() => setIsRegistering(true)} />
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