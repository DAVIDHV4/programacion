const { poolPromise, sql } = require('../db');

exports.getDiccionarios = async (req, res) => {
    try {
        const pool = await poolPromise;
        const sedes = await pool.request().query(`SELECT COD_SUCURSAL, NOM_SUCURSAL FROM MAE_SUCURSAL`);
        const especialidades = await pool.request().query(`SELECT COD_ESPECIALIDAD, DES_ESPECIALIDAD FROM CVE_ESPECIALIDAD WHERE TIPO_ESTADO IN ('AC','ACT')`);
        const salas = await pool.request().query(`SELECT COD_HABITACION, DES_HABITACION FROM ADM_HABITACION WHERE IND_SALA='S'`);
        const horas = await pool.request().query(`SELECT IDE_HORA, DES_HORA FROM ADM_HORAS WHERE TIP_HORARIO=1`);
        const procedencias = await pool.request().query(`SELECT MAE_TABLA_DET.DES_CORTA, MAE_TABLA_DET.DES_LARGA FROM MAE_TABLA_DET WHERE MAE_TABLA_DET.TIP_TABLA like 'CLI_PROCED'`);
        
        const anestesiologos = await pool.request().query(`
            SELECT a.cod_medico, c.DES_AUXILIAR  
            FROM CVE_MEDICO A 
            JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO=B.COD_MEDICO 
            JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR=C.COD_AUXILIAR 
            WHERE b.COD_ESPECIALIDAD = 2 
            ORDER BY c.DES_AUXILIAR ASC
        `);

        const medicosIndica = await pool.request().query(`
            SELECT DISTINCT a.cod_medico, c.DES_AUXILIAR  
            FROM CVE_MEDICO A 
            JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO=B.COD_MEDICO 
            JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR=C.COD_AUXILIAR 
            WHERE C.DES_AUXILIAR <> ' ' 
            ORDER BY c.DES_AUXILIAR ASC
        `);

        res.json({
            success: true,
            data: {
                sedes: sedes.recordset,
                especialidades: especialidades.recordset,
                salas: salas.recordset,
                horas: horas.recordset,
                procedencias: procedencias.recordset,
                anestesiologos: anestesiologos.recordset,
                medicosIndica: medicosIndica.recordset
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error cargando diccionarios" });
    }
};

exports.getMedicosPorEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('especialidad', sql.Int, id)
            .query(`
                SELECT a.cod_medico, c.DES_AUXILIAR  
                FROM CVE_MEDICO A 
                JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO=B.COD_MEDICO 
                JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR=C.COD_AUXILIAR 
                WHERE b.COD_ESPECIALIDAD = @especialidad 
                ORDER BY c.DES_AUXILIAR ASC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) { 
        res.status(500).json({ success: false }); 
    }
};

exports.getPacientePorDNI = async (req, res) => {
    try {
        const { dni } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('dni', sql.VarChar, dni)
            .query(`
                SELECT COD_PACIENTE, CONCAT(APE_PATERNO,' ', APE_MATERNO,' ', NOM_PACIENTE) AS NOMBRE_COMPLETO 
                FROM ADM_PACIENTE 
                WHERE NUM_HC = @dni
            `);
        res.json({ success: true, data: result.recordset[0] || null });
    } catch (err) { 
        res.status(500).json({ success: false }); 
    }
};

exports.buscarCirugias = async (req, res) => {
    try {
        const busqueda = req.query.q || '';
        const pool = await poolPromise;
        const result = await pool.request()
            .input('busqueda', sql.VarChar, `%${busqueda}%`)
            .query(`
                SELECT TOP 20 COD_EMPRESA, COD_ARTICULO_SERV, COD_FAMILIA, DES_ARTICULO_SERV 
                FROM LOG_ARTICULO_SERV 
                WHERE COD_SERVICIO IN (6,8) 
                AND DES_ARTICULO_SERV LIKE @busqueda
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) { 
        res.status(500).json({ success: false }); 
    }
};

exports.guardarCirugia = async (req, res) => {
    try {
        const {
            sucursal, usuario, especialidad, medico, ingresoClinica,
            codPaciente, tipoCirugia, anestesiologo, tipoAnestesia,
            codCirugia, cirugiaSearch, codEmpresa, codFamilia, observaciones,
            fechaCirugia, salaOperacion, horaInicio, horaFin,
            situacion, procedencia, medicoIndica
        } = req.body;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            // 1. Insertar Cirugía
            await transaction.request()
                .input('FECHA', sql.DateTime, new Date())
                .input('COD_MEDICO', sql.Int, medico || null)
                .input('COD_ESPECIALIDAD', sql.Int, especialidad || null)
                .input('COD_MEDICO_ANESTECIOLOGO', sql.Int, anestesiologo || null)
                .input('TIP_ANESTECIA', sql.VarChar, tipoAnestesia || '')
                .input('COD_ARTICULO_SERV_PROCEDIMIENTO', sql.VarChar, codCirugia || '')
                .input('TIP_CIRUGIA', sql.VarChar, tipoCirugia || '')
                .input('DES_OBSERVACION', sql.VarChar, observaciones || '')
                .input('COD_PACIENTE_CIRUGIA', sql.Int, codPaciente || null)
                .input('TIP_INGRESO', sql.VarChar, ingresoClinica === 'SI' ? 'S' : 'N')
                .input('HORA_INI', sql.Int, horaInicio || null)
                .input('HORA_FIN', sql.Int, horaFin || null)
                .input('FEC_CIRUGIA', sql.DateTime, fechaCirugia || null)
                .input('TIP_SITUACION', sql.VarChar, situacion === 'ACTIVO' ? 'ACT' : situacion.substring(0, 3).toUpperCase())
                .input('COD_EMPRESA_PROCEDIMIENTO', sql.VarChar, codEmpresa || '')
                .input('COD_FAMILIA_PROCEDIMIENTO', sql.VarChar, codFamilia || '')
                .input('TIP_CANCELA', sql.VarChar, '')
                .input('DES_MOTIVO_CANCEL', sql.VarChar, '')
                .input('COD_PROCEDENCIA', sql.VarChar, procedencia || '')
                .input('COD_MEDICO_INDICA', sql.Int, medicoIndica || null)
                .input('COD_SUCURSAL', sql.VarChar, sucursal || '')
                .input('COD_USUARIO', sql.VarChar, usuario || '')
                .input('COD_HABITACION', sql.Int, salaOperacion || null)
                .query(`
                    INSERT INTO CVE_PROG_CIRUGIA (FECHA, COD_MEDICO, COD_ESPECIALIDAD, COD_MEDICO_ANESTECIOLOGO, TIP_ANESTECIA, COD_ARTICULO_SERV_PROCEDIMIENTO, TIP_CIRUGIA, DES_OBSERVACION, COD_PACIENTE_CIRUGIA, TIP_INGRESO, HORA_INI, HORA_FIN, FEC_CIRUGIA, TIP_SITUACION, COD_EMPRESA_PROCEDIMIENTO, COD_FAMILIA_PROCEDIMIENTO, TIP_CANCELA, DES_MOTIVO_CANCEL, COD_PROCEDENCIA, COD_MEDICO_INDICA, COD_SUCURSAL, COD_USUARIO, COD_HABITACION)
                    VALUES (@FECHA, @COD_MEDICO, @COD_ESPECIALIDAD, @COD_MEDICO_ANESTECIOLOGO, @TIP_ANESTECIA, @COD_ARTICULO_SERV_PROCEDIMIENTO, @TIP_CIRUGIA, @DES_OBSERVACION, @COD_PACIENTE_CIRUGIA, @TIP_INGRESO, @HORA_INI, @HORA_FIN, @FEC_CIRUGIA, @TIP_SITUACION, @COD_EMPRESA_PROCEDIMIENTO, @COD_FAMILIA_PROCEDIMIENTO, @TIP_CANCELA, @DES_MOTIVO_CANCEL, @COD_PROCEDENCIA, @COD_MEDICO_INDICA, @COD_SUCURSAL, @COD_USUARIO, @COD_HABITACION)
                `);

            // 2. Insertar Alerta
            await transaction.request()
                .input('USUARIO', sql.VarChar, usuario)
                .input('CIRUGIA', sql.VarChar, cirugiaSearch)
                .query(`
                    INSERT INTO SIS_ALERTAS (COD_ALERTA, COD_USUARIO, DES_ALERTA, IMP_SEGUNDOS, FEC_FINALIZACION, COD_USUARIO_CRE, FEC_CREACION, COD_USUARIO_MOD, FEC_MODIFICA, TIP_ESTADO) 
                    VALUES ('000001', @USUARIO, 'Tiene la cirugia ' + coalesce(@CIRUGIA, 'NO DEFINIDA'), 900, getdate(), @USUARIO, getdate(), @USUARIO, getdate(), 'S')
                `);

            await transaction.request()
                .input('USUARIO', sql.VarChar, usuario)
                .input('SUCURSAL', sql.VarChar, sucursal)
                .query(`
                    DECLARE @NuevoCorrelativo VARCHAR(10);
                    SELECT @NuevoCorrelativo = RIGHT('0000000000' + CAST(ISNULL(MAX(CAST(NUM_CORRELATIVO AS BIGINT)), 0) + 1 AS VARCHAR(10)), 10)
                    FROM SEG_AUDITORIA;

                    INSERT INTO SEG_AUDITORIA (
                        COD_EMPRESA, COD_SUCURSAL, NUM_CORRELATIVO, DES_OPERACION, 
                        DES_NOMBRE_USUARIO, DES_NOMBRE_MAQUINA, DES_USUARIO_WINDOWS, 
                        DES_SISTEMA, FEC_FECHA_SERVER, DES_USUARIO_SISTEMA
                    ) 
                    VALUES (
                        '0001', @SUCURSAL, @NuevoCorrelativo, 'Programación de Cirugías (Nuevo)', 
                        'Sistema Web', 'WEB-SERVER', 'WEB-USER', 'Cirugias', getdate(), @USUARIO
                    )
                `);

            await transaction.commit();
            res.json({ success: true, message: "Cirugía, alerta y auditoría guardadas" });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error crítico en el proceso de guardado" });
    }
};

const { poolPromise, sql } = require('../db');

exports.getDiccionarios = async (req, res) => {
    try {
        const pool = await poolPromise;
        const sedes = await pool.request().query(`SELECT COD_SUCURSAL, NOM_SUCURSAL FROM MAE_SUCURSAL`);
        const especialidades = await pool.request().query(`SELECT COD_ESPECIALIDAD, DES_ESPECIALIDAD FROM CVE_ESPECIALIDAD WHERE TIPO_ESTADO IN ('AC','ACT')`);
        const salas = await pool.request().query(`SELECT COD_HABITACION, DES_HABITACION FROM ADM_HABITACION WHERE IND_SALA='S'`);
        const horas = await pool.request().query(`SELECT IDE_HORA, DES_HORA FROM ADM_HORAS WHERE TIP_HORARIO=1`);
        const procedencias = await pool.request().query(`SELECT MAE_TABLA_DET.DES_CORTA, MAE_TABLA_DET.DES_LARGA FROM MAE_TABLA_DET WHERE MAE_TABLA_DET.TIP_TABLA like 'CLI_PROCED'`);
        
        const anestesiologos = await pool.request().query(`
            SELECT a.cod_medico, c.DES_AUXILIAR  
            FROM CVE_MEDICO A 
            JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO=B.COD_MEDICO 
            JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR=C.COD_AUXILIAR 
            WHERE b.COD_ESPECIALIDAD = 2 
            ORDER BY c.DES_AUXILIAR ASC
        `);

        const medicosIndica = await pool.request().query(`
            SELECT DISTINCT a.cod_medico, c.DES_AUXILIAR  
            FROM CVE_MEDICO A 
            JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO=B.COD_MEDICO 
            JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR=C.COD_AUXILIAR 
            WHERE C.DES_AUXILIAR <> ' ' 
            ORDER BY c.DES_AUXILIAR ASC
        `);

        res.json({
            success: true,
            data: {
                sedes: sedes.recordset,
                especialidades: especialidades.recordset,
                salas: salas.recordset,
                horas: horas.recordset,
                procedencias: procedencias.recordset,
                anestesiologos: anestesiologos.recordset,
                medicosIndica: medicosIndica.recordset
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error cargando diccionarios" });
    }
};

exports.getMedicosPorEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('especialidad', sql.Int, id)
            .query(`
                SELECT a.cod_medico, c.DES_AUXILIAR  
                FROM CVE_MEDICO A 
                JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO=B.COD_MEDICO 
                JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR=C.COD_AUXILIAR 
                WHERE b.COD_ESPECIALIDAD = @especialidad 
                ORDER BY c.DES_AUXILIAR ASC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) { 
        res.status(500).json({ success: false }); 
    }
};

exports.getPacientePorDNI = async (req, res) => {
    try {
        const { dni } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('dni', sql.VarChar, dni)
            .query(`
                SELECT COD_PACIENTE, CONCAT(APE_PATERNO,' ', APE_MATERNO,' ', NOM_PACIENTE) AS NOMBRE_COMPLETO 
                FROM ADM_PACIENTE 
                WHERE NUM_HC = @dni
            `);
        res.json({ success: true, data: result.recordset[0] || null });
    } catch (err) { 
        res.status(500).json({ success: false }); 
    }
};

exports.buscarCirugias = async (req, res) => {
    try {
        const busqueda = req.query.q || '';
        const pool = await poolPromise;
        const result = await pool.request()
            .input('busqueda', sql.VarChar, `%${busqueda}%`)
            .query(`
                SELECT TOP 20 COD_EMPRESA, COD_ARTICULO_SERV, COD_FAMILIA, DES_ARTICULO_SERV 
                FROM LOG_ARTICULO_SERV 
                WHERE COD_SERVICIO IN (6,8) 
                AND DES_ARTICULO_SERV LIKE @busqueda
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) { 
        res.status(500).json({ success: false }); 
    }
};

exports.guardarCirugia = async (req, res) => {
    try {
        const {
            sucursal, usuario, especialidad, medico, ingresoClinica,
            codPaciente, tipoCirugia, anestesiologo, tipoAnestesia,
            codCirugia, cirugiaSearch, codEmpresa, codFamilia, observaciones,
            fechaCirugia, salaOperacion, horaInicio, horaFin,
            situacion, procedencia, medicoIndica
        } = req.body;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            await transaction.request()
                .input('FECHA', sql.DateTime, new Date())
                .input('COD_MEDICO', sql.Int, medico || null)
                .input('COD_ESPECIALIDAD', sql.Int, especialidad || null)
                .input('COD_MEDICO_ANESTECIOLOGO', sql.Int, anestesiologo || null)
                .input('TIP_ANESTECIA', sql.VarChar, tipoAnestesia || '')
                .input('COD_ARTICULO_SERV_PROCEDIMIENTO', sql.VarChar, codCirugia || '')
                .input('TIP_CIRUGIA', sql.VarChar, tipoCirugia || '')
                .input('DES_OBSERVACION', sql.VarChar, observaciones || '')
                .input('COD_PACIENTE_CIRUGIA', sql.Int, codPaciente || null)
                .input('TIP_INGRESO', sql.VarChar, ingresoClinica === 'SI' ? 'S' : 'N')
                .input('HORA_INI', sql.Int, horaInicio || null)
                .input('HORA_FIN', sql.Int, horaFin || null)
                .input('FEC_CIRUGIA', sql.DateTime, fechaCirugia || null)
                .input('TIP_SITUACION', sql.VarChar, situacion === 'ACTIVO' ? 'ACT' : situacion.substring(0, 3).toUpperCase())
                .input('COD_EMPRESA_PROCEDIMIENTO', sql.VarChar, codEmpresa || '')
                .input('COD_FAMILIA_PROCEDIMIENTO', sql.VarChar, codFamilia || '')
                .input('TIP_CANCELA', sql.VarChar, '')
                .input('DES_MOTIVO_CANCEL', sql.VarChar, '')
                .input('COD_PROCEDENCIA', sql.VarChar, procedencia || '')
                .input('COD_MEDICO_INDICA', sql.Int, medicoIndica || null)
                .input('COD_SUCURSAL', sql.VarChar, sucursal || '')
                .input('COD_USUARIO', sql.VarChar, usuario || '')
                .input('COD_HABITACION', sql.Int, salaOperacion || null)
                .query(`
                    INSERT INTO CVE_PROG_CIRUGIA ( 
                        FECHA, COD_MEDICO, COD_ESPECIALIDAD, COD_MEDICO_ANESTECIOLOGO, 
                        TIP_ANESTECIA, COD_ARTICULO_SERV_PROCEDIMIENTO, TIP_CIRUGIA, DES_OBSERVACION, COD_PACIENTE_CIRUGIA, 
                        TIP_INGRESO, HORA_INI, HORA_FIN, FEC_CIRUGIA, TIP_SITUACION, COD_EMPRESA_PROCEDIMIENTO, COD_FAMILIA_PROCEDIMIENTO, 
                        TIP_CANCELA, DES_MOTIVO_CANCEL, COD_PROCEDENCIA, COD_MEDICO_INDICA, COD_SUCURSAL, COD_USUARIO, COD_HABITACION 
                    )
                    VALUES ( 
                        @FECHA, @COD_MEDICO, @COD_ESPECIALIDAD, @COD_MEDICO_ANESTECIOLOGO, 
                        @TIP_ANESTECIA, @COD_ARTICULO_SERV_PROCEDIMIENTO, @TIP_CIRUGIA, @DES_OBSERVACION, @COD_PACIENTE_CIRUGIA, 
                        @TIP_INGRESO, @HORA_INI, @HORA_FIN, @FEC_CIRUGIA, @TIP_SITUACION, @COD_EMPRESA_PROCEDIMIENTO, @COD_FAMILIA_PROCEDIMIENTO, 
                        @TIP_CANCELA, @DES_MOTIVO_CANCEL, @COD_PROCEDENCIA, @COD_MEDICO_INDICA, @COD_SUCURSAL, @COD_USUARIO, @COD_HABITACION 
                    )
                `);

            await transaction.request()
                .input('USUARIO', sql.VarChar, usuario)
                .input('CIRUGIA', sql.VarChar, cirugiaSearch)
                .query(`
                    INSERT INTO SIS_ALERTAS (COD_ALERTA, COD_USUARIO, DES_ALERTA, IMP_SEGUNDOS, FEC_FINALIZACION, COD_USUARIO_CRE, FEC_CREACION, COD_USUARIO_MOD, FEC_MODIFICA, TIP_ESTADO) 
                    VALUES ('000001', @USUARIO, 'Tiene la cirugia ' + coalesce(@CIRUGIA, 'NO DEFINIDA'), 900, getdate(), @USUARIO, getdate(), @USUARIO, getdate(), 'S')
                `);

            await transaction.request()
                .input('USUARIO', sql.VarChar, usuario)
                .input('SUCURSAL', sql.VarChar, sucursal)
                .query(`
                    DECLARE @NuevoCorrelativo VARCHAR(10);
                    SELECT @NuevoCorrelativo = RIGHT('0000000000' + CAST(ISNULL(MAX(CAST(NUM_CORRELATIVO AS BIGINT)), 0) + 1 AS VARCHAR(10)), 10)
                    FROM SEG_AUDITORIA;

                    INSERT INTO SEG_AUDITORIA (
                        COD_EMPRESA, COD_SUCURSAL, NUM_CORRELATIVO, DES_OPERACION, 
                        DES_NOMBRE_USUARIO, DES_NOMBRE_MAQUINA, DES_USUARIO_WINDOWS, 
                        DES_SISTEMA, FEC_FECHA_SERVER, DES_USUARIO_SISTEMA
                    ) 
                    VALUES (
                        '0001', @SUCURSAL, @NuevoCorrelativo, 'Programación de Cirugías (Nuevo)', 
                        'Sistema Web', 'WEB-SERVER', 'WEB-USER', 'Cirugias', getdate(), @USUARIO
                    )
                `);

            await transaction.commit();
            res.json({ success: true, message: "Cirugía guardada exitosamente" });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al guardar la cirugía" });
    }
};

exports.getCirugiaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    C.*, 
                    CONCAT(P.APE_PATERNO,' ', P.APE_MATERNO,' ', P.NOM_PACIENTE) AS pacienteNombre,
                    P.NUM_HC AS pacienteDni,
                    A.DES_ARTICULO_SERV AS cirugiaSearch
                FROM CVE_PROG_CIRUGIA C
                LEFT JOIN ADM_PACIENTE P ON C.COD_PACIENTE_CIRUGIA = P.COD_PACIENTE
                LEFT JOIN LOG_ARTICULO_SERV A ON C.COD_ARTICULO_SERV_PROCEDIMIENTO = A.COD_ARTICULO_SERV
                WHERE C.ID_PROG_CIRUGIA = @id
            `);

        if (result.recordset.length > 0) {
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, message: "No se encontró la cirugía" });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.actualizarCirugia = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            sucursal, usuario, especialidad, medico, ingresoClinica,
            codPaciente, tipoCirugia, anestesiologo, tipoAnestesia,
            codCirugia, codEmpresa, codFamilia, observaciones,
            fechaCirugia, salaOperacion, horaInicio, horaFin,
            situacion, procedencia, medicoIndica
        } = req.body;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('ID_PROG_CIRUGIA', sql.Int, id)
                .input('COD_MEDICO', sql.Int, medico || null)
                .input('COD_ESPECIALIDAD', sql.Int, especialidad || null)
                .input('COD_MEDICO_ANESTECIOLOGO', sql.Int, anestesiologo || null)
                .input('TIP_ANESTECIA', sql.VarChar, tipoAnestesia || '')
                .input('COD_ARTICULO_SERV_PROCEDIMIENTO', sql.VarChar, codCirugia || '')
                .input('TIP_CIRUGIA', sql.VarChar, tipoCirugia || '')
                .input('DES_OBSERVACION', sql.VarChar, observaciones || '')
                .input('COD_PACIENTE_CIRUGIA', sql.Int, codPaciente || null)
                .input('TIP_INGRESO', sql.VarChar, ingresoClinica === 'SI' ? 'S' : 'N')
                .input('HORA_INI', sql.Int, horaInicio || null)
                .input('HORA_FIN', sql.Int, horaFin || null)
                .input('FEC_CIRUGIA', sql.DateTime, fechaCirugia || null)
                .input('TIP_SITUACION', sql.VarChar, situacion === 'ACTIVO' ? 'ACT' : situacion.substring(0, 3).toUpperCase())
                .input('COD_EMPRESA_PROCEDIMIENTO', sql.VarChar, codEmpresa || '')
                .input('COD_FAMILIA_PROCEDIMIENTO', sql.VarChar, codFamilia || '')
                .input('COD_PROCEDENCIA', sql.VarChar, procedencia || '')
                .input('COD_MEDICO_INDICA', sql.Int, medicoIndica || null)
                .input('COD_SUCURSAL', sql.VarChar, sucursal || '')
                .input('COD_HABITACION', sql.Int, salaOperacion || null)
                .query(`
                    UPDATE CVE_PROG_CIRUGIA SET 
                        COD_MEDICO = @COD_MEDICO, 
                        COD_ESPECIALIDAD = @COD_ESPECIALIDAD, 
                        COD_MEDICO_ANESTECIOLOGO = @COD_MEDICO_ANESTECIOLOGO, 
                        TIP_ANESTECIA = @TIP_ANESTECIA, 
                        COD_ARTICULO_SERV_PROCEDIMIENTO = @COD_ARTICULO_SERV_PROCEDIMIENTO, 
                        TIP_CIRUGIA = @TIP_CIRUGIA, 
                        DES_OBSERVACION = @DES_OBSERVACION, 
                        COD_PACIENTE_CIRUGIA = @COD_PACIENTE_CIRUGIA, 
                        TIP_INGRESO = @TIP_INGRESO, 
                        HORA_INI = @HORA_INI, 
                        HORA_FIN = @HORA_FIN, 
                        FEC_CIRUGIA = @FEC_CIRUGIA, 
                        TIP_SITUACION = @TIP_SITUACION, 
                        COD_EMPRESA_PROCEDIMIENTO = @COD_EMPRESA_PROCEDIMIENTO, 
                        COD_FAMILIA_PROCEDIMIENTO = @COD_FAMILIA_PROCEDIMIENTO, 
                        COD_PROCEDENCIA = @COD_PROCEDENCIA, 
                        COD_MEDICO_INDICA = @COD_MEDICO_INDICA, 
                        COD_SUCURSAL = @COD_SUCURSAL, 
                        COD_HABITACION = @COD_HABITACION 
                    WHERE ID_PROG_CIRUGIA = @ID_PROG_CIRUGIA
                `);

            await transaction.request()
                .input('USUARIO', sql.VarChar, usuario)
                .input('SUCURSAL', sql.VarChar, sucursal)
                .query(`
                    DECLARE @NuevoCorrelativo VARCHAR(10);
                    SELECT @NuevoCorrelativo = RIGHT('0000000000' + CAST(ISNULL(MAX(CAST(NUM_CORRELATIVO AS BIGINT)), 0) + 1 AS VARCHAR(10)), 10)
                    FROM SEG_AUDITORIA;

                    INSERT INTO SEG_AUDITORIA (
                        COD_EMPRESA, COD_SUCURSAL, NUM_CORRELATIVO, DES_OPERACION, 
                        DES_NOMBRE_USUARIO, DES_NOMBRE_MAQUINA, DES_USUARIO_WINDOWS, 
                        DES_SISTEMA, FEC_FECHA_SERVER, DES_USUARIO_SISTEMA
                    ) 
                    VALUES (
                        '0001', @SUCURSAL, @NuevoCorrelativo, 'Programación de Cirugías (Modificar)', 
                        'Sistema Web', 'WEB-SERVER', 'WEB-USER', 'Cirugias', getdate(), @USUARIO
                    )
                `);

            await transaction.commit();
            res.json({ success: true, message: "Cirugía actualizada exitosamente" });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al actualizar la cirugía" });
    }
};