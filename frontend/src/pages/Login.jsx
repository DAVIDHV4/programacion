import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/login', { 
        usuario: user, 
        password: pass 
      });
      if (res.data.success) {
        onLoginSuccess(res.data.user);
      }
    } catch (error) {
      alert("Credenciales incorrectas o error de conexión");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Acceso Clínica</h2>
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