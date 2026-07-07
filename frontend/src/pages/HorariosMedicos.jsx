import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import clienteAxios from '../config/axios';
import '../styles/HorariosMedicos.css';

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '50px',
    borderColor: state.isFocused ? '#669BBB' : '#8B8889',
    boxShadow: state.isFocused ? '0 0 0 1px #669BBB' : 'none',
    padding: '2px 8px',
    fontFamily: "'Noto Sans Display', Arial, sans-serif",
    fontSize: '13px',
    minHeight: '40px',
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

const getInitialFiltros = () => {
  const saved = sessionStorage.getItem('horariosFiltros');
  return saved ? JSON.parse(saved) : {
    sede: '',
    especialidad: '',
    mes: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    anio: new Date().getFullYear().toString(),
    tipoHorario: 'AMB'
  };
};

const getInitialFiltrosAplicados = () => {
  const saved = sessionStorage.getItem('horariosFiltrosAplicados');
  return saved ? JSON.parse(saved) : null;
};

const getInitialHorarios = () => {
  const saved = sessionStorage.getItem('horariosData');
  return saved ? JSON.parse(saved) : [];
};

const getInitialBusqueda = () => {
  const saved = sessionStorage.getItem('horariosBusqueda');
  return saved === 'true';
};

const HorariosMedicos = () => {
  const navigate = useNavigate();
  
  const [filtros, setFiltros] = useState(getInitialFiltros);
  const [filtrosAplicados, setFiltrosAplicados] = useState(getInitialFiltrosAplicados);
  const [horarios, setHorarios] = useState(getInitialHorarios);
  const [busquedaRealizada, setBusquedaRealizada] = useState(getInitialBusqueda);

  const [opciones, setOpciones] = useState({
    sedes: [],
    especialidades: [],
    meses: [],
    tiposHorario: []
  });

  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        const res = await clienteAxios.get('/horarios/filtros');
        if (res.data.success) {
          setOpciones(res.data.data);
        }
      } catch (error) {}
    };
    cargarFiltros();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('horariosFiltros', JSON.stringify(filtros));
  }, [filtros]);

  const handleSelectChange = (name, selectedOption) => {
    setFiltros(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
  };

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = async () => {
    if (!filtros.sede || !filtros.especialidad || !filtros.mes || !filtros.anio || !filtros.tipoHorario) {
      alert("Por favor seleccione todos los filtros");
      return;
    }

    try {
      const res = await clienteAxios.post('/horarios/buscar', filtros);
      if (res.data.success) {
        setHorarios(res.data.data);
        setFiltrosAplicados({ ...filtros });
        setBusquedaRealizada(true);

        sessionStorage.setItem('horariosData', JSON.stringify(res.data.data));
        sessionStorage.setItem('horariosFiltrosAplicados', JSON.stringify(filtros));
        sessionStorage.setItem('horariosBusqueda', 'true');
      }
    } catch (error) {}
  };

  const renderCalendario = () => {
    if (!busquedaRealizada || !filtrosAplicados) {
      return <div className="calendario-vacio"><p>Seleccione los filtros y presione BUSCAR.</p></div>;
    }

    const year = parseInt(filtrosAplicados.anio);
    const month = parseInt(filtrosAplicados.mes) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const dataAgrupada = {};
    horarios.forEach(h => {
      const diaStr = h.FECHA.toString();
      const dia = parseInt(diaStr.substring(6, 8), 10);
      if (!dataAgrupada[dia]) dataAgrupada[dia] = [];
      dataAgrupada[dia].push(h);
    });

    Object.keys(dataAgrupada).forEach(dia => {
      dataAgrupada[dia].sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
    });

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diasSemanaCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const blanks = Array.from({ length: startDay });
    const dias = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="calendario-wrapper">
        <div className="calendario-header-dias">
          {diasSemana.map((d, i) => <div key={i} className="dia-nombre">{d}</div>)}
        </div>
        <div className="calendario-grid">
          {blanks.map((_, i) => <div key={`blank-${i}`} className="celda-vacia"></div>)}
          {dias.map(dia => {
            const nombreDiaMovil = diasSemanaCompletos[(startDay + dia - 1) % 7];
            return (
              <div key={dia} className="celda-dia">
                <div className="header-celda">
                  <span className="dia-nombre-movil">{nombreDiaMovil}</span>
                  <span className="numero-dia">{dia}</span>
                </div>
                <div className="turnos-contenedor">
                  {dataAgrupada[dia]?.map((turno, idx) => {
                    const esAusente = turno.TIP_ESTADO !== 'ATENDIENDO';
                    return (
                      <div 
                        key={idx} 
                        className={`turno-card ${esAusente ? 'turno-ausente' : ''}`}
                        onClick={() => navigate(`/horarios/editar/${turno.COD_MEDICO}/${turno.FECHA}/${turno.IDE_HORA_INICIO}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="turno-hora">{turno.HORA_INICIO} - {turno.HORA_FIN}</span>
                        <span className="turno-medico">{turno.DES_AUXILIAR}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sedesOptions = opciones.sedes?.map(s => ({ value: s.COD_SUCURSAL.toString(), label: s.NOM_SUCURSAL })) || [];
  const especialidadesOptions = opciones.especialidades?.map(e => ({ value: e.COD_ESPECIALIDAD.toString(), label: e.DES_ESPECIALIDAD })) || [];
  const tiposHorarioOptions = opciones.tiposHorario?.map(t => ({ value: t.TIP_HORARIO, label: t.DESCRIPCION })) || [];
  const mesesOptions = opciones.meses?.map(m => ({ value: m.id, label: m.nombre })) || [];

  return (
    <div className="horarios-container">
      <div className="horarios-content">
        <header className="horarios-header">
          <h2>Programación de Horarios Médicos</h2>
        </header>

        <div className="filtros-section">
          <div className="filtros-grid">
            <div className="filtro-group">
              <label>Sede</label>
              <Select 
                options={sedesOptions} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                value={sedesOptions.find(opt => opt.value === filtros.sede) || null}
                onChange={(opt) => handleSelectChange('sede', opt)} 
              />
            </div>
            <div className="filtro-group">
              <label>Especialidad</label>
              <Select 
                options={especialidadesOptions} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                value={especialidadesOptions.find(opt => opt.value === filtros.especialidad) || null}
                onChange={(opt) => handleSelectChange('especialidad', opt)} 
              />
            </div>
            <div className="filtro-group">
              <label>Año</label>
              <input 
                type="number" 
                name="anio" 
                className="input-anio" 
                value={filtros.anio} 
                onChange={handleChangeInput} 
              />
            </div>
            <div className="filtro-group">
              <label>Mes</label>
              <Select 
                options={mesesOptions} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                value={mesesOptions.find(opt => opt.value === filtros.mes) || null}
                onChange={(opt) => handleSelectChange('mes', opt)} 
              />
            </div>
            <div className="filtro-group">
              <label>Tipo</label>
              <Select 
                options={tiposHorarioOptions} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                value={tiposHorarioOptions.find(opt => opt.value === filtros.tipoHorario) || null}
                onChange={(opt) => handleSelectChange('tipoHorario', opt)} 
              />
            </div>
            <div className="filtro-group btn-container">
              <button className="btn-buscar-horario" onClick={handleBuscar}>BUSCAR</button>
            </div>
          </div>
        </div>

        <div className="calendario-section">
          {renderCalendario()}
        </div>
      </div>
    </div>
  );
};

export default HorariosMedicos;