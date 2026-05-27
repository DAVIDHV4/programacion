import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import '../styles/Login.css';

const Login = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await clienteAxios.post('/login', { 
        usuario: user, 
        password: pass 
      });
      if (res.data.success) {
        localStorage.setItem('usuarioClinica', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Credenciales incorrectas o error de conexión');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Programacion de cirugias</h2>
        <p className="login-subtitle">Ingrese</p>
        
        {error && <p className="error-message">{error}</p>}
        
        <input 
          type="text" 
          placeholder="Usuario" 
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="login-input"
          required
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="login-input"
          required
        />
        <button type="submit" className="login-button">INGRESAR</button>
      </form>
    </div>
  );
};

export default Login;