import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [cirugias, setCirugias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCirugias = async () => {
      try {
        const res = await clienteAxios.get(`/cirugias?mes=${mes}&busqueda=${busqueda}`);
        if (res.data.success) {
          setCirugias(res.data.data);
        }
      } catch (error) {
        alert("Error al cargar las programaciones");
      }
    };
    fetchCirugias();
  }, [mes, busqueda]);

  const handleLogout = () => {
    localStorage.removeItem('usuarioClinica');
    navigate('/');
  };

  const handleAgregar = () => {
    navigate('/registro');
  };

  const formatFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-PE', { 
      timeZone: 'UTC',
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        <header className="dashboard-header">
          <h2>Programación de Cirugias</h2>
          <button onClick={handleLogout} className="logout-button">Salir</button>
        </header>

        <div className="top-action-container">
          <button onClick={handleAgregar} className="add-button-top">
            AGREGAR
          </button>
          
          <div className="filters-container">
            <input 
              type="text" 
              placeholder="Buscar paciente, médico o cirugía..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            <select 
              value={mes} 
              onChange={(e) => setMes(e.target.value)} 
              className="month-select"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="cirugias-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Cirugía</th>
                <th>Médico</th>
                <th>Especialidad</th>
              </tr>
            </thead>
            <tbody>
              {cirugias.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#8B8B89' }}>
                    No se encontraron resultados para esta búsqueda
                  </td>
                </tr>
              ) : (
                cirugias.map((c) => (
                  <tr 
                    key={c.ID_PROG_CIRUGIA} 
                    onClick={() => navigate(`/registro/${c.ID_PROG_CIRUGIA}`)}
                    style={{ cursor: 'pointer' }}
                    className="fila-hover"
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>{formatFecha(c.FECHA)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.HORA_INICIO} - {c.HORA_FIN}</td>
                    <td>{c.PACIENTE}</td>
                    <td>{c.CIRUGIA}</td>
                    <td>{c.MEDICO}</td>
                    <td>{c.ESPECIALIDAD}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;