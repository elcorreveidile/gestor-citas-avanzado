import React, { useState } from 'react';

function Login({ onLogin, onGoToRegister, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '1rem' }}>
      <h2>Iniciar Sesión</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Entrar</button>
      <p>
        ¿No tienes cuenta? <button type="button" onClick={onGoToRegister} style={{ background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', textDecoration: 'underline' }}>Regístrate</button>
      </p>
    </form>
  );
}

export default Login;