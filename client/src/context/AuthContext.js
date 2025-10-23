// /client/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        // CORRECCIÓN: Guardamos y leemos el ID del usuario en localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // Si no hay usuario guardado, el token es inválido
          logout();
        }
      } catch (error) {
        console.error("Token o usuario guardado inválido. Limpiando datos.");
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // CORRECCIÓN: Guardamos el token y el objeto user completo (con ID)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // <-- ¡CLAVE!
        setToken(data.token);
        setUser(data.user); // <-- ¡CLAVE!
      } else {
        setAuthError(data.error || 'Error en el login');
      }
    } catch (error) {
      setAuthError('Error de conexión al iniciar sesión.');
    }
  };

  const register = async (name, email, password) => {
    setAuthError('');
    setIsRegistering(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // CORRECCIÓN: Guardamos el token y el objeto user completo (con ID)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // <-- ¡CLAVE!
        setToken(data.token);
        setUser(data.user); // <-- ¡CLAVE!
      } else {
        setAuthError(data.error || 'Error en el registro');
      }
    } catch (error) {
      setAuthError('Error de conexión al registrar.');
    } finally {
      setIsRegistering(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // <-- ¡CLAVE!
    setToken(null);
    setUser(null);
    setAuthError('');
  };

  const value = {
    user,
    token,
    isLoading,
    isRegistering,
    authError,
    login,
    register,
    logout,
    setIsRegistering,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);