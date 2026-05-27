import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import Select from 'react-select';
import '../styles/Registro.css';
import toast, { Toaster } from 'react-hot-toast';

const limpiarTexto = (texto) => {
  return texto ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
};

const customFilter = (option, inputValue) => {
  if (!inputValue) return true;
  return limpiarTexto(option.label).includes(limpiarTexto(inputValue));
};

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
    '&:hover': {
      borderColor: '#669BBB'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    fontFamily: "'Noto Sans Display', Arial, sans-serif",
    fontSize: '13px',
    backgroundColor: state.isSelected ? '#B11A1A' : state.isFocused ? '#FEF0D5' : 'white',
    color: state.isSelected ? 'white' : '#0D3049',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#B11A1A',
      color: 'white'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#0D3049',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#8B8889',
  })
};

const Registro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diccionarios, setDiccionarios] = useState({
    sedes: [], especialidades: [], salas: [], horas: [], procedencias: [], anestesiologos: [], medicosIndica: []
  });
  const [medicos, setMedicos] = useState([]);
  const [cirugiasResultados, setCirugiasResultados] = useState([]);
  const [mostrarOjo, setMostrarOjo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    sucursal: '',
    usuario: '',
    fechaActual: new Date().toLocaleDateString('es-PE'),
    especialidad: '',
    medico: '',
    ingresoClinica: 'NO',
    pacienteDni: '',
    pacienteNombre: '',
    codPaciente: '',
    tipoCirugia: 'AMBULATORIA',
    anestesiologo: '',
    tipoAnestesia: 'LOCAL',
    cirugiaSearch: '',
    codCirugia: '',
    codEmpresa: '',
    codFamilia: '',
    ojo: '',
    observaciones: '',
    fechaCirugia: '',
    salaOperacion: '',
    horaInicio: '',
    horaFin: '',
    situacion: 'ACTIVO',
    procedencia: '',
    medicoIndica: ''
  });

  useEffect(() => {
    const userLocal = localStorage.getItem('usuarioClinica');
    if (userLocal) {
      const parsedUser = JSON.parse(userLocal);
      setFormData(prev => ({ ...prev, usuario: parsedUser.COD_USUARIO }));
    }

    const fetchDiccionarios = async () => {
      try {
        const res = await clienteAxios.get('/formulario/diccionarios');
        if (res.data.success) setDiccionarios(res.data.data);
      } catch (error) {}
    };
    fetchDiccionarios();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchCirugia = async () => {
        try {
          const res = await clienteAxios.get(`/formulario/cirugia/${id}`);
          if (res.data.success) {
            const d = res.data.data;
            const mapSituacion = { 'ACT': 'ACTIVO', 'INA': 'INACTIVO', 'REA': 'REALIZADA', 'SUS': 'SUSPENDIDA', 'CAN': 'CANCELADA' };
            setFormData(prev => ({
              ...prev,
              sucursal: d.COD_SUCURSAL ? d.COD_SUCURSAL.toString() : '',
              especialidad: d.COD_ESPECIALIDAD ? d.COD_ESPECIALIDAD.toString() : '',
              medico: d.COD_MEDICO ? d.COD_MEDICO.toString() : '',
              ingresoClinica: d.TIP_INGRESO === 'S' ? 'SI' : 'NO',
              pacienteDni: d.pacienteDni || '',
              pacienteNombre: d.pacienteNombre || '',
              codPaciente: d.COD_PACIENTE_CIRUGIA || '',
              tipoCirugia: d.TIP_CIRUGIA || 'AMBULATORIA',
              anestesiologo: d.COD_MEDICO_ANESTECIOLOGO ? d.COD_MEDICO_ANESTECIOLOGO.toString() : '',
              tipoAnestesia: d.TIP_ANESTECIA || 'LOCAL',
              cirugiaSearch: d.cirugiaSearch || '',
              codCirugia: d.COD_ARTICULO_SERV_PROCEDIMIENTO || '',
              codEmpresa: d.COD_EMPRESA_PROCEDIMIENTO || '',
              codFamilia: d.COD_FAMILIA_PROCEDIMIENTO || '',
              observaciones: d.DES_OBSERVACION || '',
              fechaCirugia: d.FEC_CIRUGIA ? d.FEC_CIRUGIA.split('T')[0] : '',
              salaOperacion: d.COD_HABITACION ? d.COD_HABITACION.toString() : '',
              horaInicio: d.HORA_INI ? d.HORA_INI.toString() : '',
              horaFin: d.HORA_FIN ? d.HORA_FIN.toString() : '',
              situacion: mapSituacion[d.TIP_SITUACION] || 'ACTIVO',
              procedencia: d.COD_PROCEDENCIA || '',
              medicoIndica: d.COD_MEDICO_INDICA ? d.COD_MEDICO_INDICA.toString() : ''
            }));
          }
        } catch (error) {
          toast.error("Error al cargar la cirugía");
        }
      };
      fetchCirugia();
    }
  }, [id]);

  useEffect(() => {
    if (formData.especialidad) {
      const espSeleccionada = diccionarios.especialidades?.find(e => e.COD_ESPECIALIDAD.toString() === formData.especialidad);
      if (espSeleccionada && espSeleccionada.DES_ESPECIALIDAD.includes('OFTALMOLOGIA')) {
        setMostrarOjo(true);
      } else {
        setMostrarOjo(false);
        setFormData(prev => ({ ...prev, ojo: '' }));
      }

      const fetchMedicos = async () => {
        try {
          const res = await clienteAxios.get(`/formulario/medicos/${formData.especialidad}`);
          if (res.data.success) {
            setMedicos(res.data.data);
            setFormData(prev => {
              const medicoExiste = res.data.data.some(m => m.cod_medico.toString() === prev.medico);
              return { ...prev, medico: medicoExiste ? prev.medico : '' };
            });
          }
        } catch (error) {}
      };
      fetchMedicos();
    } else {
      setMedicos([]);
      setMostrarOjo(false);
    }
  }, [formData.especialidad, diccionarios.especialidades]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
  };

  const handleBuscarDni = async () => {
    if (!formData.pacienteDni) return;
    try {
      const res = await clienteAxios.get(`/formulario/paciente/${formData.pacienteDni}`);
      if (res.data.success && res.data.data) {
        setFormData(prev => ({ ...prev, pacienteNombre: res.data.data.NOMBRE_COMPLETO, codPaciente: res.data.data.COD_PACIENTE }));
      } else {
        alert("Paciente no encontrado");
        setFormData(prev => ({ ...prev, pacienteNombre: '', codPaciente: '' }));
      }
    } catch (error) { alert("Error buscando paciente"); }
  };

  const handleSearchCirugia = async (e) => {
    const term = e.target.value;
    setFormData(prev => ({ ...prev, cirugiaSearch: term, codCirugia: '', codEmpresa: '', codFamilia: '' }));
    if (term.length > 2) {
      try {
        const res = await clienteAxios.get(`/formulario/cirugias/buscar?q=${term}`);
        if (res.data.success) setCirugiasResultados(res.data.data);
      } catch (error) {}
    } else {
      setCirugiasResultados([]);
    }
  };

  const seleccionarCirugia = (cir) => {
    setFormData(prev => ({ 
      ...prev, 
      cirugiaSearch: cir.DES_ARTICULO_SERV, 
      codCirugia: cir.COD_ARTICULO_SERV,
      codEmpresa: cir.COD_EMPRESA,
      codFamilia: cir.COD_FAMILIA
    }));
    setCirugiasResultados([]);
  };

  const sedesOptions = diccionarios.sedes?.map(s => ({ value: s.COD_SUCURSAL.toString(), label: s.NOM_SUCURSAL })) || [];
  const especialidadesOptions = diccionarios.especialidades?.map(e => ({ value: e.COD_ESPECIALIDAD.toString(), label: e.DES_ESPECIALIDAD })) || [];
  const medicosOptions = medicos?.map(m => ({ value: m.cod_medico.toString(), label: m.DES_AUXILIAR })) || [];
  const anestesiologosOptions = diccionarios.anestesiologos?.map(a => ({ value: a.cod_medico.toString(), label: a.DES_AUXILIAR })) || [];
  const salasOptions = diccionarios.salas?.map(s => ({ value: s.COD_HABITACION.toString(), label: s.DES_HABITACION })) || [];
  const procedenciasOptions = diccionarios.procedencias?.map(p => ({ value: p.DES_CORTA.toString(), label: p.DES_LARGA })) || [];
  const medicosIndicaOptions = diccionarios.medicosIndica?.map(m => ({ value: m.cod_medico.toString(), label: m.DES_AUXILIAR })) || [];
  const horasOptions = diccionarios.horas?.map(h => ({ value: h.IDE_HORA.toString(), label: h.DES_HORA })) || [];
  const horasFinOptions = diccionarios.horas?.filter(h => {
    if (!formData.horaInicio) return true;
    return parseInt(h.IDE_HORA) > parseInt(formData.horaInicio);
  }).map(h => ({ value: h.IDE_HORA.toString(), label: h.DES_HORA })) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sucursal || !formData.especialidad || !formData.codPaciente || !formData.medico || !formData.codCirugia || !formData.fechaCirugia) {
      toast.error("Complete los campos obligatorios", {
        style: { background: '#B11A1A', color: '#fff', borderRadius: '50px' }
      });
      return;
    }

    setGuardando(true);
    
    try {
      const url = id ? `/formulario/actualizar/${id}` : '/formulario/guardar';
      const method = id ? 'put' : 'post';
      
      const res = await clienteAxios[method](url, formData);
      if (res.data.success) {
        toast.success(`¡Cirugía ${id ? 'actualizada' : 'programada'} con éxito!`, {
          style: { background: '#0D3049', color: '#fff', borderRadius: '50px' },
          iconTheme: { primary: '#fff', secondary: '#0D3049' },
        });
        navigate('/dashboard');
      }
    } catch (error) { 
      toast.error(`Error al ${id ? 'actualizar' : 'guardar'}, intente de nuevo`); 
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-content">
        <header className="registro-header">
          <h2>{id ? 'Editar Cirugía' : 'Programar Nueva Cirugía'}</h2>
          <button type="button" className="btn-volver" onClick={() => navigate('/dashboard')}>Volver</button>
        </header>

        <form onSubmit={handleSubmit} className="registro-form">
          <div className="form-section">
            <h3 className="section-title">Datos Institucionales</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Sede (Obligatorio)</label>
                <Select options={sedesOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={sedesOptions.find(opt => opt.value === formData.sucursal) || null} onChange={(opt) => handleSelectChange('sucursal', opt)} />
              </div>
              <div className="form-group"><label>Usuario</label><input type="text" value={formData.usuario} disabled /></div>
              <div className="form-group"><label>Fecha Actual</label><input type="text" value={formData.fechaActual} disabled /></div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Datos del Paciente y Atención</h3>
            <div className="form-grid">
              <div className="form-group search-group">
                <label>DNI Paciente (Obligatorio)</label>
                <div className="input-button-wrapper">
                  <input type="text" name="pacienteDni" value={formData.pacienteDni} onChange={handleChange} />
                  <button type="button" className="btn-search" onClick={handleBuscarDni}>Buscar</button>
                </div>
              </div>
              <div className="form-group span-2"><label>Nombre del Paciente</label><input type="text" value={formData.pacienteNombre} disabled /></div>
              <div className="form-group">
                <label>Ingreso a Clínica (Obligatorio)</label>
                <select name="ingresoClinica" value={formData.ingresoClinica} onChange={handleChange}>
                  <option value="SI">SÍ</option>
                  <option value="NO">NO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Datos Clínicos y Procedimiento</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Especialidad (Obligatorio)</label>
                <Select options={especialidadesOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={especialidadesOptions.find(opt => opt.value === formData.especialidad) || null} onChange={(opt) => handleSelectChange('especialidad', opt)} />
              </div>
              <div className="form-group">
                <label>Médico Principal (Obligatorio)</label>
                <Select options={medicosOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." isDisabled={!formData.especialidad} value={medicosOptions.find(opt => opt.value === formData.medico) || null} onChange={(opt) => handleSelectChange('medico', opt)} />
              </div>
              <div className="form-group autocomplete-group span-2">
                <label>Cirugía / Procedimiento (Obligatorio)</label>
                <input type="text" value={formData.cirugiaSearch} onChange={handleSearchCirugia} placeholder="Escriba para buscar..." />
                {cirugiasResultados?.length > 0 && (
                  <ul className="autocomplete-results">
                    {cirugiasResultados?.map(cir => (
                      <li key={cir.COD_ARTICULO_SERV} onClick={() => seleccionarCirugia(cir)}>{cir.DES_ARTICULO_SERV}</li>
                    ))}
                  </ul>
                )}
              </div>
              {mostrarOjo && (
                <div className="form-group">
                  <label>Ojo</label>
                  <select name="ojo" value={formData.ojo} onChange={handleChange}><option value="">Ninguno</option><option value="DERECHO">DERECHO</option><option value="IZQUIERDO">IZQUIERDO</option><option value="AMBOS">AMBOS</option></select>
                </div>
              )}
              <div className="form-group"><label>Tipo de Cirugía</label><select name="tipoCirugia" value={formData.tipoCirugia} onChange={handleChange}><option value="AMBULATORIA">AMBULATORIA</option><option value="EMERGENCIA">EMERGENCIA</option><option value="MENOR">MENOR</option><option value="MAYOR">MAYOR</option></select></div>
              <div className="form-group"><label>Tipo de Anestesia</label><select name="tipoAnestesia" value={formData.tipoAnestesia} onChange={handleChange}><option value="LOCAL">LOCAL</option><option value="REGIONAL">REGIONAL</option><option value="GENERAL">GENERAL</option><option value="ASISTIDA">ASISTIDA</option></select></div>
              <div className="form-group span-2"><label>Anestesiólogo</label><Select options={anestesiologosOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={anestesiologosOptions.find(opt => opt.value === formData.anestesiologo) || null} onChange={(opt) => handleSelectChange('anestesiologo', opt)} /></div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Programación</h3>
            <div className="form-grid">
              <div className="form-group"><label>Fecha de Cirugía (Obligatorio)</label><input type="date" name="fechaCirugia" value={formData.fechaCirugia} onChange={handleChange} /></div>
              <div className="form-group"><label>Sala de Operación</label><Select options={salasOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={salasOptions.find(opt => opt.value === formData.salaOperacion) || null} onChange={(opt) => handleSelectChange('salaOperacion', opt)} /></div>
              <div className="form-group"><label>Hora Inicio</label><Select options={horasOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={horasOptions.find(opt => opt.value === formData.horaInicio) || null} onChange={(opt) => handleSelectChange('horaInicio', opt)} /></div>
              <div className="form-group"><label>Hora Fin</label><Select options={horasFinOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." isDisabled={!formData.horaInicio} value={horasFinOptions.find(opt => opt.value === formData.horaFin) || null} onChange={(opt) => handleSelectChange('horaFin', opt)} /></div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Información Adicional</h3>
            <div className="form-grid">
              <div className="form-group"><label>Procedencia</label><Select options={procedenciasOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={procedenciasOptions.find(opt => opt.value === formData.procedencia) || null} onChange={(opt) => handleSelectChange('procedencia', opt)} /></div>
              <div className="form-group span-2"><label>Médico que Indica</label><Select options={medicosIndicaOptions} styles={customStyles} filterOption={customFilter} placeholder="Seleccione..." value={medicosIndicaOptions.find(opt => opt.value === formData.medicoIndica) || null} onChange={(opt) => handleSelectChange('medicoIndica', opt)} /></div>
              <div className="form-group"><label>Situación</label><select name="situacion" value={formData.situacion} onChange={handleChange}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option><option value="REALIZADA">REALIZADA</option><option value="SUSPENDIDA">SUSPENDIDA</option><option value="CANCELADA">CANCELADA</option></select></div>
              <div className="form-group span-4"><label>Observaciones</label><textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows="3"></textarea></div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-guardar"
              disabled={guardando}
              style={{ opacity: guardando ? 0.7 : 1, cursor: guardando ? 'not-allowed' : 'pointer' }}
            >
              {guardando ? 'PROCESANDO ESPERE...' : (id ? 'ACTUALIZAR CIRUGÍA' : 'GUARDAR CIRUGÍA')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registro;