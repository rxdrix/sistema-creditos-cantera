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
          <h1 className="brand-title">Societaria Cantera R.L.</h1>
          <p className="brand-subtitle">Cooperativa de Ahorro y Crédito</p>
        </div>

        <h2 className="welcome-title">Welcome Back!</h2>
        <p className="welcome-subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email ID</label>
            <input
              type="email"
              required
              placeholder="socio@cantera.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot-link">
            <a href="#">Forgot your password?</a>
          </div>

          <button type="submit" className="login-btn">
            LOGIN
          </button>

          <p className="register-text">
            Don't have an account? <Link to="/register">Register Now</Link>
          </p>
        </form>
      </div>
    </div>
  );
}