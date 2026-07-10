const { poolPromise, sql } = require('../db');

exports.getAtenciones = async (req, res) => {
    try {
        let fecha = req.query.fecha || new Date().toISOString().split('T')[0];
        const fechaSql = fecha.replace(/-/g, '');

        const especialidad = req.query.especialidad || '';
        const medico = req.query.medico || '';
        const busqueda = req.query.busqueda || '';

        const pool = await poolPromise;
        const result = await pool.request()
            .input('fecha', sql.VarChar, fechaSql)
            .input('especialidad', sql.VarChar, especialidad ? especialidad : '%')
            .input('medico', sql.VarChar, medico ? medico : '%')
            .input('busqueda', sql.VarChar, `%${busqueda}%`)
            .query(`
                SELECT
                    ADM_ATENCION.COD_ATENCION,
                    ADM_ATENCION.FEC_ATENCION,
                    ADM_PACIENTE.APE_PATERNO + ' ' + ADM_PACIENTE.APE_MATERNO + ' ' + ADM_PACIENTE.NOM_PACIENTE AS PACIENTE,
                    MAE_AUXILIAR.NUM_TELEFONO,
                    ( SELECT DES_AUXILIAR
                        FROM CVE_MEDICO, MAE_AUXILIAR
                       WHERE CVE_MEDICO.COD_EMPRESA = MAE_AUXILIAR.COD_EMPRESA
                         AND CVE_MEDICO.COD_AUXILIAR = MAE_AUXILIAR.COD_AUXILIAR
                         AND COD_MEDICO = ADM_ATENCION.COD_MEDICO ) AS MEDICO,
                    ADM_ATENCION.COD_ESPECIALIDAD,
                    CVE_ESPECIALIDAD.DES_ESPECIALIDAD AS ESPECIALIDAD,
                    MAE_AUXILIAR.NUM_DOC_IDENTIDAD,
                    COALESCE( ADM_ATENCION.COD_USUARIO_ING,
                        ( SELECT MIN(COD_USUARIO_ING) FROM SER_ORDEN
                           WHERE COD_GRUPO = 5
                             AND COD_ATENCION = ADM_ATENCION.COD_ATENCION ) ) AS COD_USUARIO_ING,
                    MAE_SUCURSAL.NOM_SUCURSAL
                FROM ADM_ATENCION WITH (NOLOCK)
                INNER JOIN ADM_EXPEDIENTE WITH (NOLOCK)
                    ON ADM_ATENCION.COD_EXPEDIENTE = ADM_EXPEDIENTE.COD_EXPEDIENTE
                INNER JOIN ADM_PACIENTE WITH (NOLOCK)
                    ON ADM_PACIENTE.COD_PACIENTE = ADM_EXPEDIENTE.COD_PACIENTE
                INNER JOIN MAE_AUXILIAR WITH (NOLOCK)
                    ON MAE_AUXILIAR.COD_EMPRESA = ADM_PACIENTE.COD_EMPRESA
                    AND MAE_AUXILIAR.COD_AUXILIAR = ADM_PACIENTE.COD_AUXILIAR
                LEFT JOIN MAE_SUCURSAL
                    ON ADM_ATENCION.COD_SUCURSAL = MAE_SUCURSAL.COD_SUCURSAL
                LEFT JOIN CVE_ESPECIALIDAD
                    ON ADM_ATENCION.COD_ESPECIALIDAD = CVE_ESPECIALIDAD.COD_ESPECIALIDAD
                WHERE CONVERT(VARCHAR(8), ADM_ATENCION.FEC_ATENCION, 112) = @fecha
                  AND ADM_ATENCION.TIP_ATENCION = 'AMB'
                  AND ADM_ATENCION.COD_ESPECIALIDAD LIKE @especialidad
                  AND CONVERT(VARCHAR(10), ADM_ATENCION.COD_MEDICO) LIKE @medico
                  AND (
                        ADM_PACIENTE.APE_PATERNO + ' ' + ADM_PACIENTE.APE_MATERNO + ' ' + ADM_PACIENTE.NOM_PACIENTE LIKE @busqueda
                        OR MAE_AUXILIAR.NUM_DOC_IDENTIDAD LIKE @busqueda
                        OR CONVERT(VARCHAR(20), ADM_ATENCION.COD_ATENCION) LIKE @busqueda
                      )
                ORDER BY ADM_ATENCION.FEC_ATENCION ASC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al obtener las admisiones" });
    }
};

exports.getEspecialidades = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT COD_ESPECIALIDAD, DES_ESPECIALIDAD
                FROM CVE_ESPECIALIDAD
                WHERE COALESCE(TIPO_ESTADO, 'NN') <> 'INA'
                ORDER BY DES_ESPECIALIDAD
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al cargar especialidades" });
    }
};

exports.getMedicosPorEspecialidad = async (req, res) => {
    try {
        const { especialidad } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('especialidad', sql.Int, especialidad)
            .query(`
                SELECT a.COD_MEDICO, c.DES_AUXILIAR
                FROM CVE_MEDICO A
                JOIN CVE_MEDICO_ESPECIALIDAD B ON A.COD_MEDICO = B.COD_MEDICO
                JOIN MAE_AUXILIAR C ON A.COD_AUXILIAR = C.COD_AUXILIAR
                WHERE B.COD_ESPECIALIDAD = @especialidad
                ORDER BY c.DES_AUXILIAR ASC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al cargar médicos" });
    }
};