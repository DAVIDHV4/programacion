import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import clienteAxios from '../config/axios';
import toast from 'react-hot-toast';
import '../styles/NuevoHorario.css';

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

const diasDeLaSemana = [
  { index: 1, label: 'LUN' },
  { index: 2, label: 'MAR' },
  { index: 3, label: 'MIÉ' },
  { index: 4, label: 'JUE' },
  { index: 5, label: 'VIE' },
  { index: 6, label: 'SÁB' },
  { index: 0, label: 'DOM' }
];

const NuevoHorarioMes = () => {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalSalir, setMostrarModalSalir] = useState(false);

  const [globalOpciones, setGlobalOpciones] = useState({ sedes: [], especialidades: [] });
  const [dependientesOpciones, setDependientesOpciones] = useState({ medicos: [], horas: [], jefes: [] });

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('horariosFiltrosAplicados') || sessionStorage.getItem('horariosFiltros');
    const filtros = saved ? JSON.parse(saved) : null;
    return {
      sucursal: filtros?.sede || '',
      especialidad: filtros?.especialidad || '',
      medico: '',
      horaInicio: '',
      horaFin: '',
      consultorio: '',
      medicoJefe: '',
      tipoAtencion: 'TOD',
      estado: 'ATENDIENDO',
      tipoHorario: filtros?.tipoHorario || 'AMB'
    };
  });

  const [fechaInicio, setFechaInicio] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [diasPatron, setDiasPatron] = useState([]);

  useEffect(() => {
    const cargarFiltrosBasicos = async () => {
      try {
        const res = await clienteAxios.get('/horarios/filtros');
        if (res.data.success) {
          setGlobalOpciones({
            sedes: res.data.data.sedes,
            especialidades: res.data.data.especialidades
          });
        }
      } catch (error) {
        toast.error("Error al cargar sedes y especialidades");
      } finally {
        setCargando(false);
      }
    };
    cargarFiltrosBasicos();
  }, []);

  useEffect(() => {
    const cargarOpcionesDependientes = async () => {
      if (!formData.especialidad) {
        setDependientesOpciones({ medicos: [], horas: [], jefes: [] });
        return;
      }
      try {
        const res = await clienteAxios.get(`/horarios/diccionarios-edicion/${formData.especialidad}`);
        if (res.data.success) {
          setDependientesOpciones(res.data.data);
        }
      } catch (error) {
        toast.error("Error al cargar médicos y horas");
      }
    };
    cargarOpcionesDependientes();
  }, [formData.especialidad]);

  useEffect(() => {
    if (!fechaInicio || !fechaFin || new Date(fechaInicio) > new Date(fechaFin)) {
      setDiasPatron([]);
      return;
    }
    const dias = [];
    let actual = new Date(`${fechaInicio}T00:00:00`);
    const final = new Date(`${fechaFin}T00:00:00`);
    while (actual <= final) {
      const yyyy = actual.getFullYear();
      const mm = String(actual.getMonth() + 1).padStart(2, '0');
      const dd = String(actual.getDate()).padStart(2, '0');
      dias.push({
        fecha: `${yyyy}-${mm}-${dd}`,
        diaSemana: actual.getDay(),
        incluido: false
      });
      actual.setDate(actual.getDate() + 1);
    }
    setDiasPatron(dias);
  }, [fechaInicio, fechaFin]);

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: selectedOption ? selectedOption.value : '' };
      if (name === 'especialidad') {
        newData.medico = '';
        newData.horaInicio = '';
        newData.horaFin = '';
        newData.medicoJefe = '';
      }
      return newData;
    });
  };

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDiaSemana = (diaIndex) => {
    const coincidentes = diasPatron.filter(d => d.diaSemana === diaIndex);
    if (coincidentes.length === 0) return;
    const activarTodos = !coincidentes.every(d => d.incluido);
    setDiasPatron(prev =>
      prev.map(d => (d.diaSemana === diaIndex ? { ...d, incluido: activarTodos } : d))
    );
  };

  const isDiaSemanaActivo = (diaIndex) => {
    const coincidentes = diasPatron.filter(d => d.diaSemana === diaIndex);
    return coincidentes.length > 0 && coincidentes.every(d => d.incluido);
  };

  const toggleDiaIndividual = (fecha) => {
    setDiasPatron(prev =>
      prev.map(d => (d.fecha === fecha ? { ...d, incluido: !d.incluido } : d))
    );
  };

  const limpiarSeleccionPatron = () => {
    setDiasPatron(prev => prev.map(d => ({ ...d, incluido: false })));
  };

  const diasSeleccionadosCount = diasPatron.filter(d => d.incluido).length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sucursal || !formData.especialidad || !formData.medico || !formData.horaInicio || !formData.horaFin || !formData.tipoHorario) {
      toast.error("Complete los campos obligatorios principales");
      return;
    }

    if (!fechaInicio || !fechaFin) {
      toast.error("Seleccione un rango de fechas");
      return;
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      toast.error("La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }
    const fechasFinales = diasPatron.filter(d => d.incluido).map(d => d.fecha);
    if (fechasFinales.length === 0) {
      toast.error("Seleccione al menos un día en la lista de previsualización");
      return;
    }

    const payload = {
      ...formData,
      fechasParaGuardar: fechasFinales
    };

    setGuardando(true);
    try {
      const res = await clienteAxios.post('/horarios/mes', payload);
      if (res.data.success) {
        toast.success(`Se programaron ${fechasFinales.length} turno(s) correctamente`);
        navigate('/horarios');
      } else {
        toast.error(res.data.message || "No se pudo guardar la programación");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar la programación");
    } finally {
      setGuardando(false);
    }
  };

  const sedesOptions = globalOpciones.sedes?.map(s => ({ value: s.COD_SUCURSAL.toString(), label: s.NOM_SUCURSAL })) || [];
  const especialidadesOptions = globalOpciones.especialidades?.map(e => ({ value: e.COD_ESPECIALIDAD.toString(), label: e.DES_ESPECIALIDAD })) || [];
  const medicosOptions = dependientesOpciones.medicos?.map(m => ({ value: m.COD_MEDICO.toString(), label: m.DES_AUXILIAR })) || [];
  const horasOptions = dependientesOpciones.horas?.map(h => ({ value: h.ide_hora.toString(), label: h.DES_HORA })) || [];
  const jefesOptions = dependientesOpciones.jefes?.map(j => ({ value: j.COD_MEDICO.toString(), label: j.DES_AUXILIAR })) || [];

  const tipoAtencionOptions = [
    { value: 'TOD', label: 'AMBOS' },
    { value: 'PRE', label: 'PRESENCIAL' },
    { value: 'VIR', label: 'VIRTUAL' }
  ];

  const estadoOptions = [
    { value: 'ATENDIENDO', label: 'ATENDIENDO' },
    { value: 'AUSENTE', label: 'AUSENTE' }
  ];

  const tipoHorarioOptions = [
    { value: 'AMB', label: 'AMBULATORIO' },
    { value: 'EME', label: 'EMERGENCIA' },
    { value: 'HOS', label: 'HOSPITALARIO' }
  ];

  if (cargando) {
    return (
      <div className="loading-pantalla">
        <img src="/logo.png" alt="Cargando..." className="logo-animado" />
        <p>Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="nuevo-horario-container">
      <div className="nuevo-horario-content">
        <header className="nuevo-horario-header">
          <h2>Programar Horarios Múltiples (Mes)</h2>
          <button type="button" className="btn-volver" onClick={() => setMostrarModalSalir(true)}>Volver</button>
        </header>

        <form onSubmit={handleSubmit} className="nuevo-horario-form">
          <div className="form-section">
            <h3 className="section-title">Datos Principales</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Sede</label>
                <Select options={sedesOptions} styles={customStyles} value={sedesOptions.find(opt => opt.value === formData.sucursal) || null} onChange={(opt) => handleSelectChange('sucursal', opt)} />
              </div>
              <div className="form-group">
                <label>Especialidad</label>
                <Select options={especialidadesOptions} styles={customStyles} value={especialidadesOptions.find(opt => opt.value === formData.especialidad) || null} onChange={(opt) => handleSelectChange('especialidad', opt)} />
              </div>
              <div className="form-group">
                <label>Médico</label>
                <Select options={medicosOptions} styles={customStyles} value={medicosOptions.find(opt => opt.value === formData.medico) || null} onChange={(opt) => handleSelectChange('medico', opt)} isDisabled={!formData.especialidad} />
              </div>
              <div className="form-group">
                <label>Médico Jefe</label>
                <Select options={jefesOptions} styles={customStyles} value={jefesOptions.find(opt => opt.value === formData.medicoJefe) || null} onChange={(opt) => handleSelectChange('medicoJefe', opt)} isClearable isDisabled={!formData.especialidad} />
              </div>
              <div className="form-group">
                <label>Hora Inicio</label>
                <Select options={horasOptions} styles={customStyles} value={horasOptions.find(opt => opt.value === formData.horaInicio) || null} onChange={(opt) => handleSelectChange('horaInicio', opt)} isDisabled={!formData.especialidad} />
              </div>
              <div className="form-group">
                <label>Hora Fin</label>
                <Select options={horasOptions} styles={customStyles} value={horasOptions.find(opt => opt.value === formData.horaFin) || null} onChange={(opt) => handleSelectChange('horaFin', opt)} isDisabled={!formData.especialidad} />
              </div>
              <div className="form-group">
                <label>Consultorio</label>
                <input type="text" name="consultorio" className="input-text-field" value={formData.consultorio} onChange={handleChangeInput} />
              </div>
              <div className="form-group">
                <label>Tipo de Atención</label>
                <Select options={tipoAtencionOptions} styles={customStyles} value={tipoAtencionOptions.find(opt => opt.value === formData.tipoAtencion) || null} onChange={(opt) => handleSelectChange('tipoAtencion', opt)} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <Select options={estadoOptions} styles={customStyles} value={estadoOptions.find(opt => opt.value === formData.estado) || null} onChange={(opt) => handleSelectChange('estado', opt)} />
              </div>
              <div className="form-group">
                <label>Tipo Horario</label>
                <Select options={tipoHorarioOptions} styles={customStyles} value={tipoHorarioOptions.find(opt => opt.value === formData.tipoHorario) || null} onChange={(opt) => handleSelectChange('tipoHorario', opt)} />
              </div>
            </div>
          </div>

          <div className="form-section mt-20">
            <h3 className="section-title">Días a Programar</h3>
            <div className="tab-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Desde Fecha</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Hasta Fecha</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
              </div>

              <div className="dias-semana-container">
                <label>Marcar por día de semana dentro del rango:</label>
                <div className="dias-semana-grid">
                  {diasDeLaSemana.map((dia) => (
                    <button
                      type="button"
                      key={dia.index}
                      className={`dia-btn ${isDiaSemanaActivo(dia.index) ? 'seleccionado' : ''}`}
                      onClick={() => toggleDiaSemana(dia.index)}
                      disabled={diasPatron.length === 0}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              {diasPatron.length === 0 ? (
                <p className="chips-vacio" style={{ marginTop: '15px' }}>
                  Elija un rango de fechas para ver los días disponibles.
                </p>
              ) : (
                <div className="dias-preview-container">
                  <div className="dias-preview-header">
                    <span className="contador-dias">
                      {diasSeleccionadosCount} de {diasPatron.length} día(s) seleccionados
                    </span>
                    <button type="button" className="btn-limpiar-preview" onClick={limpiarSeleccionPatron}>
                      Limpiar
                    </button>
                  </div>
                  <div className="dias-preview-lista">
                    {diasPatron.map((dia) => {
                      const nombreDia = diasDeLaSemana.find(d => d.index === dia.diaSemana)?.label || '';
                      const [, mm, dd] = dia.fecha.split('-');
                      return (
                        <div key={dia.fecha} className={`dia-preview-row ${dia.incluido ? 'activo' : ''}`}>
                          <div className="dia-preview-info">
                            <span className="dia-preview-fecha">{dd}/{mm}</span>
                            <span className="dia-preview-nombre">{nombreDia}</span>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={dia.incluido}
                              onChange={() => toggleDiaIndividual(dia.fecha)}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-guardar" disabled={guardando}>
              {guardando ? 'GUARDANDO...' : 'GUARDAR TODO EL MES'}
            </button>
          </div>
        </form>
      </div>

      {mostrarModalSalir && (
        <div className="modal-overlay">
          <div className="modal-confirmacion">
            <h3>¿Seguro que deseas salir?</h3>
            <p>Si sales ahora, todos los datos que no hayas guardado se perderán.</p>
            <div className="modal-botones">
              <button type="button" className="btn-cancelar-modal" onClick={() => setMostrarModalSalir(false)}>Cancelar</button>
              <button type="button" className="btn-salir-modal" onClick={() => navigate('/horarios')}>Sí, salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevoHorarioMes;