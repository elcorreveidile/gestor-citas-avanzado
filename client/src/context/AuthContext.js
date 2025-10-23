// /client/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // --- NUEVOS ESTADOS PARA EL REGISTRO Y ERRORES ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        setUser({ email: payload.email, name: payload.name });
      } catch (error) {
        console.error("Token inválido o corrupto. Limpiando datos.");
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (tokenData) => {
    localStorage.setItem('token', tokenData.token);
    setToken(tokenData.token);
    setUser({ email: tokenData.user.email, name: tokenData.user.name });
    setAuthError(''); // Limpiamos cualquier error de login previo
  };

  // --- NUEVA FUNCIÓN DE REGISTRO ---
  const register = async (name, email, password) => {
    setAuthError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Si el registro es exitoso, llamamos a la función login para iniciar sesión automáticamente
        login(data);
      } else {
        setAuthError(data.error || 'Error en el registro');
      }
    } catch (error) {
      setAuthError('Error de conexión al registrar.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthError('');
  };

  // --- ACTUALIZAMOS EL OBJETO 'value' CON TODAS LAS FUNCIONES Y ESTADOS ---
  const value = {
    user,
    token,
    isLoading,
    isRegistering, // <-- NUEVO
    authError,     // <-- NUEVO
    login,
    register,      // <-- NUEVO
    logout,
    setIsRegistering, // <-- NUEVO
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);