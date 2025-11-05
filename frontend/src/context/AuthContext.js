// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    usuario: JSON.parse(localStorage.getItem('usuario')) || null,
  });

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem('token', auth.token);
      localStorage.setItem('usuario', JSON.stringify(auth.usuario));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }, [auth]);

  const login = (token, usuario) => {
    setAuth({ token, usuario });
  };

  const logout = () => {
    setAuth({ token: null, usuario: null });
  };

  const isAuthenticated = !!auth.token;
  const userRole = auth.usuario?.rol;

  return (
    <AuthContext.Provider value={{
      auth,
      isAuthenticated,
      userRole,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};