import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/Dashboard.css';

// Empresa propietaria de esta aplicación. Solo estas cirugías son editables.
// Debe coincidir EXACTAMENTE con el texto de la columna EMPRESA de la vista.
const EMPRESA_PROPIA = 'CLINICA LA LUZ SAC';

const Dashboard = () => {
  const [cirugias, setCirugias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCirugias = async () => {
      try {
        const res = await clienteAxios.get(`/cirugias?mes=${mes}&busqueda=${busqueda}&t=${new Date().getTime()}`);
        if (res.data.success) {
          setCirugias(res.data.data);
        }
      } catch (error) {
        toast.error("Error al cargar las programaciones");
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

  const handleEditar = (cirugia) => {
    // Bloqueo por empresa: solo se editan las cirugías de la empresa propia.
    if (cirugia.EMPRESA !== EMPRESA_PROPIA) {
      toast.error(`Esta cirugía pertenece a ${cirugia.EMPRESA}. Solo puede editar cirugías de ${EMPRESA_PROPIA}.`, {
        duration: 4000,
        style: { background: '#B11A1A', color: '#fff', borderRadius: '12px', fontSize: '13px' }
      });
      return;
    }

    if (!cirugia.ID_PROG_CIRUGIA) {
      toast.error("Error: ID_PROG_CIRUGIA no definido en esta fila.");
      return;
    }
    navigate(`/registro/${cirugia.ID_PROG_CIRUGIA}`);
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

        {/* ---------- VISTA ESCRITORIO: TABLA ---------- */}
        <div className="table-responsive vista-escritorio">
          <table className="cirugias-table">
            <thead>
              <tr>
                <th>Empresa</th>
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#8B8B89' }}>
                    No se encontraron resultados para esta búsqueda
                  </td>
                </tr>
              ) : (
                cirugias.map((c, index) => {
                  const esPropia = c.EMPRESA === EMPRESA_PROPIA;
                  return (
                    <tr
                      key={c.ID_PROG_CIRUGIA ? `${c.EMPRESA}-${c.ID_PROG_CIRUGIA}` : `error-${index}`}
                      onClick={() => handleEditar(c)}
                      className={esPropia ? 'fila-hover fila-editable' : 'fila-bloqueada'}
                    >
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {!esPropia && <span className="candado" title="No editable">🔒</span>}
                        {c.EMPRESA}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatFecha(c.FECHA)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{c.HORA_INICIO} - {c.HORA_FIN}</td>
                      <td>{c.PACIENTE}</td>
                      <td>{c.CIRUGIA}</td>
                      <td>{c.MEDICO}</td>
                      <td>{c.ESPECIALIDAD}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- VISTA MÓVIL: TARJETAS ---------- */}
        <div className="vista-movil">
          {cirugias.length === 0 ? (
            <p className="sin-resultados-movil">No se encontraron resultados para esta búsqueda</p>
          ) : (
            cirugias.map((c, index) => {
              const esPropia = c.EMPRESA === EMPRESA_PROPIA;
              return (
                <div
                  key={c.ID_PROG_CIRUGIA ? `card-${c.EMPRESA}-${c.ID_PROG_CIRUGIA}` : `card-error-${index}`}
                  onClick={() => handleEditar(c)}
                  className={`cirugia-card ${esPropia ? 'card-editable' : 'card-bloqueada'}`}
                >
                  {/* Nivel 1: Paciente (lo más importante) */}
                  <div className="card-paciente">
                    {!esPropia && <span className="candado" title="No editable">🔒</span>}
                    {c.PACIENTE}
                  </div>

                  {/* Nivel 2: Cirugía */}
                  <div className="card-cirugia">{c.CIRUGIA}</div>

                  {/* Nivel 3: Metadatos (médico, especialidad) */}
                  <div className="card-meta">
                    <span className="card-medico">{c.MEDICO}</span>
                    <span className="card-especialidad">{c.ESPECIALIDAD}</span>
                  </div>

                  {/* Nivel 4: Fecha y hora, en una franja inferior */}
                  <div className="card-footer">
                    <span className="card-fecha">📅 {formatFecha(c.FECHA)}</span>
                    <span className="card-hora">🕐 {c.HORA_INICIO} - {c.HORA_FIN}</span>
                  </div>

                  {/* Empresa: solo se muestra si NO es la propia (para no repetir lo obvio) */}
                  {!esPropia && <div className="card-empresa">{c.EMPRESA}</div>}
                </div>
              );
            })
          )}
        </div>

      </div>
      <Toaster />
    </div>
  );
};

export default Dashboard;