import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || 'https://sistema-creditos-backend.vercel.app/api';
const TIEMPO_INACTIVIDAD = 10 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  let temporizadorInactividad;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUsuario(null);
    if (temporizadorInactividad) clearTimeout(temporizadorInactividad);
    toast.success('Sesión cerrada');
  }, []);

  const resetTemporizador = useCallback(() => {
    if (temporizadorInactividad) clearTimeout(temporizadorInactividad);
    temporizadorInactividad = setTimeout(() => {
      if (usuario) {
        toast.warning('Sesión expirada por inactividad');
        logout();
      }
    }, TIEMPO_INACTIVIDAD);
  }, [usuario, logout]);

  const handleUserActivity = useCallback(() => {
    if (usuario) resetTemporizador();
  }, [usuario, resetTemporizador]);

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
  }, [handleUserActivity, resetTemporizador]);

  const login = async (email, password) => {
  try {
    console.log('📡 Enviando login a:', `${API_URL}/auth/login`);
    console.log('📡 Credenciales:', { email, password: '***' });
    
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    console.log('📥 Respuesta completa:', res.data);
    console.log('🔑 Token recibido:', res.data.token ? 'Sí' : 'No');
    
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUsuario(res.data.usuario);
      resetTemporizador();
      toast.success(`Bienvenido ${res.data.usuario.nombre}`);
      console.log('✅ Token guardado en localStorage');
      return true;
    } else {
      console.error('❌ No se recibió token en la respuesta');
      toast.error('Error al iniciar sesión');
      return false;
    }
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <AuthContext.Provider value={{ usuario, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};