import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import clienteAxios from '../config/axios';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/AtencionesMedicas.css';

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '50px',
    borderColor: state.isFocused ? '#669BBB' : '#8B8889',
    boxShadow: state.isFocused ? '0 0 0 1px #669BBB' : 'none',
    padding: '2px 8px',
    fontFamily: "'Noto Sans Display', Arial, sans-serif",
    fontSize: '13px',
    minHeight: '42px',
    '&:hover': { borderColor: '#669BBB' }
  }),
  option: (provided, state) => ({
    ...provided,
    fontFamily: "'Noto Sans Display', Arial, sans-serif",
    fontSize: '13px',
    backgroundColor: state.isSelected ? '#B11A1A' : state.isFocused ? '#FEF0D5' : 'white',
    color: state.isSelected ? 'white' : '#0D3049',
    cursor: 'pointer',
    '&:active': { backgroundColor: '#B11A1A', color: 'white' }
  }),
  singleValue: (provided) => ({ ...provided, color: '#0D3049' }),
  placeholder: (provided) => ({ ...provided, color: '#8B8889' })
};

const AtencionesMedicas = () => {
  const navigate = useNavigate();

  const [atenciones, setAtenciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [especialidad, setEspecialidad] = useState('');
  const [medico, setMedico] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');

  const [especialidadesData, setEspecialidadesData] = useState([]);
  const [medicosData, setMedicosData] = useState([]);

  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        const res = await clienteAxios.get('/atenciones/especialidades');
        if (res.data.success) setEspecialidadesData(res.data.data);
      } catch (error) {
        toast.error("Error al cargar especialidades");
      }
    };
    cargarEspecialidades();
  }, []);

  useEffect(() => {
    const cargarMedicos = async () => {
      if (!especialidad) {
        setMedicosData([]);
        return;
      }
      try {
        const res = await clienteAxios.get(`/atenciones/medicos/${especialidad}`);
        if (res.data.success) setMedicosData(res.data.data);
      } catch (error) {
        toast.error("Error al cargar médicos");
      }
    };
    cargarMedicos();
  }, [especialidad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    const fetchAtenciones = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams({
          fecha,
          especialidad,
          medico,
          busqueda: busquedaDebounced,
          t: new Date().getTime()
        });
        const res = await clienteAxios.get(`/atenciones?${params.toString()}`);
        if (res.data.success) {
          setAtenciones(res.data.data);
        }
      } catch (error) {
        toast.error("Error al cargar las admisiones");
      } finally {
        setCargando(false);
      }
    };
    fetchAtenciones();
  }, [fecha, especialidad, medico, busquedaDebounced]);

  const handleEditar = (atencion) => {
    if (!atencion.COD_ATENCION) {
      toast.error("Error: COD_ATENCION no definido en esta fila.");
      return;
    }
    navigate(`/atenciones/${atencion.COD_ATENCION}`);
  };

  const handleAgregar = () => {
    navigate('/atenciones/nueva');
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioClinica');
    navigate('/');
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return '';
    const f = new Date(fechaString);
    return f.toLocaleDateString('es-PE', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const especialidadesOptions = useMemo(
    () => especialidadesData.map(e => ({
      value: e.COD_ESPECIALIDAD.toString(),
      label: e.DES_ESPECIALIDAD
    })),
    [especialidadesData]
  );

  const medicosOptions = useMemo(
    () => medicosData.map(m => ({
      value: m.COD_MEDICO.toString(),
      label: m.DES_AUXILIAR
    })),
    [medicosData]
  );

  const handleEspecialidadChange = (opt) => {
    setEspecialidad(opt ? opt.value : '');
    setMedico('');
  };

  if (cargando && atenciones.length === 0) {
    return (
      <div className="loading-pantalla">
        <img src="/logo.png" alt="Cargando..." className="logo-animado" />
        <p>Cargando admisiones...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2>Admisiones Ambulatorias</h2>
          <button onClick={handleLogout} className="logout-button">Salir</button>
        </header>

        <div className="top-action-container">
          <button onClick={handleAgregar} className="add-button-top">
            AGREGAR
          </button>

          <div className="filtros-atenciones">
            <div className="filtro-item filtro-fecha">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="input-fecha-atencion"
              />
            </div>

            <div className="filtro-item filtro-especialidad">
              <Select
                options={especialidadesOptions}
                styles={customStyles}
                placeholder="Especialidad..."
                isClearable
                value={especialidadesOptions.find(opt => opt.value === especialidad) || null}
                onChange={handleEspecialidadChange}
              />
            </div>

            <div className="filtro-item filtro-medico">
              <Select
                options={medicosOptions}
                styles={customStyles}
                placeholder="Médico..."
                isClearable
                isDisabled={!especialidad}
                value={medicosOptions.find(opt => opt.value === medico) || null}
                onChange={(opt) => setMedico(opt ? opt.value : '')}
              />
            </div>

            <div className="filtro-item filtro-busqueda">
              <input
                type="text"
                placeholder="Buscar paciente, DNI o cód. atención..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        <div className="table-responsive vista-escritorio">
          <table className="cirugias-table">
            <thead>
              <tr>
                <th>Cód. Atención</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Teléfono</th>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>DNI</th>
                <th>Usuario</th>
                <th>Sucursal</th>
              </tr>
            </thead>
            <tbody>
              {atenciones.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#8B8B89' }}>
                    No se encontraron admisiones para estos filtros
                  </td>
                </tr>
              ) : (
                atenciones.map((a) => (
                  <tr
                    key={a.COD_ATENCION}
                    onClick={() => handleEditar(a)}
                    className="fila-hover fila-editable"
                  >
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{a.COD_ATENCION}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatFecha(a.FEC_ATENCION)}</td>
                    <td>{a.PACIENTE}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{a.NUM_TELEFONO}</td>
                    <td>{a.MEDICO}</td>
                    <td>{a.ESPECIALIDAD}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{a.NUM_DOC_IDENTIDAD}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{a.COD_USUARIO_ING}</td>
                    <td>{a.NOM_SUCURSAL}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="vista-movil">
          {atenciones.length === 0 ? (
            <p className="sin-resultados-movil">No se encontraron admisiones para estos filtros</p>
          ) : (
            atenciones.map((a) => (
              <div
                key={`card-${a.COD_ATENCION}`}
                onClick={() => handleEditar(a)}
                className="cirugia-card card-editable"
              >
                <div className="card-paciente">{a.PACIENTE}</div>

                <div className="card-cirugia">{a.ESPECIALIDAD}</div>

                <div className="card-meta">
                  <span className="card-medico">{a.MEDICO}</span>
                  <span className="card-especialidad">Atención: {a.COD_ATENCION}</span>
                </div>

                <div className="card-footer">
                  <span className="card-fecha">📅 {formatFecha(a.FEC_ATENCION)}</span>
                  <span className="card-hora">📞 {a.NUM_TELEFONO || 'Sin teléfono'}</span>
                </div>

                <div className="card-datos-extra">
                  <span>DNI: {a.NUM_DOC_IDENTIDAD}</span>
                  <span>{a.NOM_SUCURSAL}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default AtencionesMedicas;