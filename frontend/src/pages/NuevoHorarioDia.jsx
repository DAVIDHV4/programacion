import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import clienteAxios from '../config/axios';
import toast from 'react-hot-toast';
import '../styles/EditarHorario.css';

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

const NuevoHorarioDia = () => {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);

  const [globalOpciones, setGlobalOpciones] = useState({ sedes: [], especialidades: [] });
  const [dependientesOpciones, setDependientesOpciones] = useState({ medicos: [], horas: [], jefes: [] });

  const [formData, setFormData] = useState({
    sucursal: '',
    especialidad: '',
    medico: '',
    fechaHorario: '',
    horaInicio: '',
    horaFin: '',
    consultorio: '',
    medicoJefe: '',
    tipoAtencion: 'TOD',
    estado: 'ATENDIENDO',
    tipoHorario: 'AMB'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sucursal || !formData.especialidad || !formData.medico || !formData.fechaHorario || !formData.horaInicio || !formData.horaFin || !formData.tipoHorario) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    setGuardando(true);
    try {
      const res = await clienteAxios.post('/horarios/crear-dia', formData);
      if (res.data.success) {
        toast.success("Horario creado con éxito");
        navigate('/horarios');
      }
    } catch (error) {
      toast.error("Error al guardar el horario");
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

  return (
    <div className="editar-horario-container">
      <div className="editar-horario-content">
        <header className="editar-horario-header">
          <h2>Programar Nuevo Horario</h2>
          <button type="button" className="btn-volver" onClick={() => navigate('/horarios')}>Volver</button>
        </header>

        <form onSubmit={handleSubmit} className="editar-horario-form">
          <div className="form-section">
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
                <label>Fecha</label>
                <input type="date" name="fechaHorario" value={formData.fechaHorario} onChange={handleChangeInput} />
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

          <div className="form-actions">
            <button type="submit" className="btn-guardar" disabled={guardando}>
              {guardando ? 'GUARDANDO...' : 'GUARDAR HORARIO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoHorarioDia;