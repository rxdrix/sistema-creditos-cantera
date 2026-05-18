import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/simulador');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <img src="/logo.png" alt="Societaria Cantera R.L." className="logo" />
          <h1 className="brand-title">Cantera R.L.</h1>
          <p className="brand-subtitle">Cooperativa de Ahorro y Crédito</p>
        </div>

        <h2 className="welcome-title">Bienvenido</h2>
        <p className="welcome-subtitle">Inicie Sesion</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Ingrese su Email</label>
            <input
              type="email"
              required
              placeholder="socio@cantera.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">
            INICIAR SESION
          </button>
        </form>
      </div>
    </div>
  );
}