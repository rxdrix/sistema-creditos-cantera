import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API_URL = 'http://localhost:5000/api';
const TIEMPO_INACTIVIDAD = 10 * 60 * 1000; // 10 minutos

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  let temporizadorInactividad;

  const resetTemporizador = () => {
    if (temporizadorInactividad) clearTimeout(temporizadorInactividad);
    temporizadorInactividad = setTimeout(() => {
      if (usuario) {
        toast.warning('Sesión expirada por inactividad');
        logout();
      }
    }, TIEMPO_INACTIVIDAD);
  };

  const handleUserActivity = () => {
    if (usuario) resetTemporizador();
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API_URL}/auth/perfil`)
        .then(res => {
          setUsuario(res.data);
          resetTemporizador();
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (temporizadorInactividad) clearTimeout(temporizadorInactividad);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUsuario(res.data.usuario);
      resetTemporizador();
      toast.success(`Bienvenido ${res.data.usuario.nombre}`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
      return false;
    }
  };

  const register = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, data);
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUsuario(res.data.usuario);
      toast.success('Registro exitoso');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUsuario(null);
    if (temporizadorInactividad) clearTimeout(temporizadorInactividad);
    toast.success('Sesión cerrada');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <AuthContext.Provider value={{ usuario, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};