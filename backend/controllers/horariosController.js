const { poolPromise, sql } = require('../db');

exports.getFiltrosHorarios = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const sucursales = await pool.request().query(`SELECT COD_SUCURSAL, NOM_SUCURSAL FROM MAE_SUCURSAL`);
        const especialidades = await pool.request().query(`SELECT COD_ESPECIALIDAD, DES_ESPECIALIDAD FROM CVE_ESPECIALIDAD WHERE COALESCE(CVE_ESPECIALIDAD.TIPO_ESTADO ,'NN' ) <> 'INA' ORDER BY 2`);
        const tiposHorario = await pool.request().query(`
            SELECT DISTINCT TIP_HORARIO,
                CASE TIP_HORARIO
                    WHEN 'AMB' THEN 'AMBULATORIO'
                    WHEN 'EME' THEN 'EMERGENCIA'
                    WHEN 'HOS' THEN 'HOSPITALARIO'
                    ELSE TIP_HORARIO
                END AS DESCRIPCION
            FROM CVE_MEDICOS_HORARIOS
        `);

        const meses = [
            { id: '01', nombre: 'Enero' }, { id: '02', nombre: 'Febrero' },
            { id: '03', nombre: 'Marzo' }, { id: '04', nombre: 'Abril' },
            { id: '05', nombre: 'Mayo' }, { id: '06', nombre: 'Junio' },
            { id: '07', nombre: 'Julio' }, { id: '08', nombre: 'Agosto' },
            { id: '09', nombre: 'Septiembre' }, { id: '10', nombre: 'Octubre' },
            { id: '11', nombre: 'Noviembre' }, { id: '12', nombre: 'Diciembre' }
        ];

        res.json({
            success: true,
            data: {
                sedes: sucursales.recordset,
                especialidades: especialidades.recordset,
                tiposHorario: tiposHorario.recordset,
                meses: meses
            }
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.buscarHorarios = async (req, res) => {
    try {
        const { sede, especialidad, mes, anio, tipoHorario } = req.body;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('especialidad', sql.VarChar, especialidad)
            .input('mes', sql.Int, parseInt(mes))
            .input('anio', sql.Int, parseInt(anio))
            .input('sede', sql.VarChar, sede)
            .input('tipoHorario', sql.VarChar, tipoHorario)
            .query(`
                SELECT 
                    A.IDE_HORA_INICIO,
                    C.DES_AUXILIAR,
                    A.COD_MEDICO, 
                    A.FECHA, 
                    A.FEC_HORARIO,  
                    D.DES_HORA AS HORA_INICIO, 
                    E.DES_HORA AS HORA_FIN,
                    A.TIP_ESTADO
                FROM CVE_MEDICOS_HORARIOS A 
                JOIN CVE_MEDICO B ON A.COD_MEDICO=B.COD_MEDICO
                JOIN MAE_AUXILIAR C ON B.COD_AUXILIAR=C.COD_AUXILIAR
                JOIN ADM_HORAS D ON A.IDE_HORA_INICIO=D.IDE_HORA
                JOIN ADM_HORAS E ON A.IDE_HORA_FINAL=E.IDE_HORA
                WHERE A.COD_ESPECIALIDAD_HOR = @especialidad
                AND MONTH(A.FEC_HORARIO) = @mes
                AND YEAR(A.FEC_HORARIO) = @anio
                AND A.COD_SUCURSAL = @sede
                AND A.TIP_HORARIO = @tipoHorario
            `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
exports.getHorarioDetalle = async (req, res) => {
    try {
        const { medico, fecha, horaInicio } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('medico', sql.Int, medico)
            .input('fecha', sql.VarChar, fecha)
            .input('horaInicio', sql.Int, horaInicio)
            .query(`
                SELECT 
                    COD_SUCURSAL, COD_ESPECIALIDAD_HOR, COD_MEDICO, FEC_HORARIO, IDE_HORA_INICIO, IDE_HORA_FINAL, 
                    NUM_CONSULTORIO, COD_MEDICO_JEFE, TIP_ATENCION, TIP_ESTADO, TIP_HORARIO 
                FROM CVE_MEDICOS_HORARIOS
                WHERE COD_MEDICO = @medico
                AND FEC_HORARIO = @fecha
                AND IDE_HORA_INICIO = @horaInicio
            `);

        if (result.recordset.length > 0) {
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.getFiltrosEdicion = async (req, res) => {
    try {
        const { especialidad } = req.params;
        const pool = await poolPromise;
        
        const medicos = await pool.request()
            .input('especialidad', sql.VarChar, especialidad)
            .query(`
                SELECT DES_AUXILIAR, CAST(CVE_MEDICO.COD_MEDICO AS VARCHAR) AS COD_MEDICO
                FROM CVE_MEDICO
                INNER JOIN MAE_AUXILIAR ON CVE_MEDICO.COD_AUXILIAR = MAE_AUXILIAR.COD_AUXILIAR
                INNER JOIN CVE_MEDICO_ESPECIALIDAD ON CVE_MEDICO_ESPECIALIDAD.COD_MEDICO = CVE_MEDICO.COD_MEDICO
                WHERE COD_ESPECIALIDAD = @especialidad
            `);

        const horas = await pool.request()
            .input('especialidad', sql.VarChar, especialidad)
            .query(`
                SELECT ide_hora, DES_HORA 
                FROM ADM_HORAS A 
                JOIN CVE_ESPECIALIDAD B ON A.TIP_HORARIO = B.TIP_HORARIO
                WHERE b.COD_ESPECIALIDAD = @especialidad
            `);

        const jefes = await pool.request()
            .input('especialidad', sql.VarChar, especialidad)
            .query(`
                SELECT DES_AUXILIAR, CVE_MEDICO.COD_MEDICO 
                FROM CVE_MEDICO
                INNER JOIN MAE_AUXILIAR ON CVE_MEDICO.COD_AUXILIAR = MAE_AUXILIAR.COD_AUXILIAR
                INNER JOIN CVE_MEDICO_ESPECIALIDAD ON CVE_MEDICO_ESPECIALIDAD.COD_MEDICO = CVE_MEDICO.COD_MEDICO
                WHERE COD_ESPECIALIDAD = @especialidad
                AND TIP_PUESTO = 'JEF'
                ORDER BY 1
            `);

        res.json({
            success: true,
            data: {
                medicos: medicos.recordset,
                horas: horas.recordset,
                jefes: jefes.recordset
            }
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.actualizarHorario = async (req, res) => {
    try {
        // 1. Recibimos los valores ORIGINALES de la URL (para el WHERE)
        const { medico, fecha, horaInicio } = req.params; 
        
        // 2. Recibimos los valores NUEVOS del formulario (para el SET)
        const { fechaHorario, horaInicio: nuevaHoraInicio, horaFin, consultorio, tipoAtencion, estado, tipoHorario } = req.body; 
        
        const pool = await poolPromise;

        // Convertir fecha "2026-07-09" a "20260709" para la columna FECHA
        const nuevaFechaString = fechaHorario ? fechaHorario.replace(/-/g, '') : null;

        await pool.request()
            // Variables para el WHERE
            .input('medicoKey', sql.Int, parseInt(medico))
            .input('fechaKey', sql.VarChar, fecha)
            .input('horaInicioKey', sql.Int, parseInt(horaInicio))
            
            // Variables para el SET
            .input('nuevaFechaStr', sql.VarChar, nuevaFechaString)
            .input('nuevaFechaDate', sql.Date, fechaHorario)
            .input('nuevaHoraInicio', sql.Int, parseInt(nuevaHoraInicio))
            .input('horaFin', sql.Int, horaFin ? parseInt(horaFin) : null)
            .input('consultorio', sql.VarChar, consultorio || null)
            .input('tipoAtencion', sql.VarChar, tipoAtencion)
            .input('estado', sql.VarChar, estado)
            .input('tipoHorario', sql.VarChar, tipoHorario)
            .query(`
                UPDATE CVE_MEDICOS_HORARIOS 
                SET 
                    FECHA = @nuevaFechaStr,
                    FEC_HORARIO = @nuevaFechaDate,
                    IDE_HORA_INICIO = @nuevaHoraInicio,
                    IDE_HORA_FINAL = @horaFin,
                    NUM_CONSULTORIO = @consultorio,
                    TIP_ATENCION = @tipoAtencion,
                    TIP_ESTADO = @estado,
                    TIP_HORARIO = @tipoHorario
                WHERE COD_MEDICO = @medicoKey 
                AND FECHA = @fechaKey 
                AND IDE_HORA_INICIO = @horaInicioKey
            `);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};