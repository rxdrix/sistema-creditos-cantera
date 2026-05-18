import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    const success = await register({
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      password: form.password
    });
    if (success) {
      navigate('/simulador');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <img src="../public/logo.png" alt="Societaria Cantera" className="logo" />
          <h1 className="brand-title">Societaria Cantera R.L.</h1>
          <p className="brand-subtitle">Cooperativa de Ahorro y Crédito</p>
        </div>

        <h2 className="welcome-title">Create Account</h2>
        <p className="welcome-subtitle">Register to get started</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              placeholder="Juan Pérez"
              value={form.nombre}
              onChange={(e) => setForm({...form, nombre: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label>Email ID</label>
            <input
              type="email"
              required
              placeholder="socio@cantera.com"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="+591 12345678"
              value={form.telefono}
              onChange={(e) => setForm({...form, telefono: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
            />
          </div>

          <button type="submit" className="login-btn">
            REGISTER
          </button>

          <p className="register-text">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}