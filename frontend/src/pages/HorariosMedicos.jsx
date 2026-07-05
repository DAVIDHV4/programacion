import React, { useState, useEffect } from 'react';
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

const HorariosMedicos = () => {
  const [filtros, setFiltros] = useState({
    sede: '',
    especialidad: '',
    mes: '',
    tipoHorario: ''
  });

  const [opciones, setOpciones] = useState({
    sedes: [],
    especialidades: [],
    meses: [],
    tiposHorario: []
  });

  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    const cargarFiltrosBasicos = async () => {
      try {
        const res = await clienteAxios.get('/horarios/filtros');
        if (res.data.success) {
          setOpciones(res.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    cargarFiltrosBasicos();
  }, []);

  const handleSelectChange = (name, selectedOption) => {
    setFiltros(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
  };

  const handleBuscar = async () => {
    if (!filtros.sede || !filtros.especialidad || !filtros.mes || !filtros.tipoHorario) {
      alert("Por favor seleccione todos los filtros");
      return;
    }

    try {
      const res = await clienteAxios.post('/horarios/buscar', filtros);
      if (res.data.success) {
        setHorarios(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
                options={opciones.sedes} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                onChange={(opt) => handleSelectChange('sede', opt)} 
              />
            </div>
            <div className="filtro-group">
              <label>Especialidad</label>
              <Select 
                options={opciones.especialidades} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                onChange={(opt) => handleSelectChange('especialidad', opt)} 
              />
            </div>
            <div className="filtro-group">
              <label>Mes</label>
              <Select 
                options={opciones.meses} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                onChange={(opt) => handleSelectChange('mes', opt)} 
              />
            </div>
            <div className="filtro-group">
              <label>Tipo de Horario</label>
              <Select 
                options={opciones.tiposHorario} 
                styles={customStyles} 
                placeholder="Seleccione..." 
                onChange={(opt) => handleSelectChange('tipoHorario', opt)} 
              />
            </div>
            <div className="filtro-group btn-container">
              <button className="btn-buscar-horario" onClick={handleBuscar}>
                BUSCAR
              </button>
            </div>
          </div>
        </div>

        <div className="calendario-section">
          {horarios.length === 0 ? (
            <div className="calendario-vacio">
              <p>Seleccione los filtros y presione BUSCAR para ver la programación.</p>
            </div>
          ) : (
            <div className="calendario-grid">
              <p>Aquí irá el diseño de los días y horas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HorariosMedicos;