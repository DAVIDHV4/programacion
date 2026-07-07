const express = require('express');
const cors = require('cors');
const { poolPromise, sql } = require('./db');
const formularioRoutes = require('./routes/formularioRoutes');

const app = express();

app.use(express.json());
app.use(cors());

function parseoPass(clave) {
    let as_cadena_ing = clave;
    let il_longi = Math.floor(as_cadena_ing.length / 2);
    let vl_cadena_conv = as_cadena_ing.slice(-il_longi) + as_cadena_ing + as_cadena_ing.substring(0, il_longi);
    
    il_longi = vl_cadena_conv.length;
    let il_suma = 0;
    
    for (let i = 0; i < il_longi; i++) {
        il_suma += vl_cadena_conv.charCodeAt(i);
    }
    
    let il_base = Math.floor(il_suma / il_longi);
    let as_cadena_dev = '';
    
    for (let i = 0; i < il_longi; i++) {
        as_cadena_dev += String.fromCharCode(vl_cadena_conv.charCodeAt(i) + il_base);
    }
    
    as_cadena_dev = String.fromCharCode(il_base - 15) + as_cadena_dev + String.fromCharCode(2 * il_base);
    
    return Buffer.from(as_cadena_dev, 'latin1').toString('utf8');
}

app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user', sql.VarChar, usuario)
            .query(`
                SELECT COD_USUARIO, NOM_USUARIO, IND_BAJA, FEC_BAJA, IND_ADMIN, DES_PASSWORD, COD_AREAS, COD_PERSONAL, USUARIO_MAIL 
                FROM MAE_USUARIO 
                WHERE COD_USUARIO = @user
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "El usuario no existe" });
        }

        const userData = result.recordset[0];
        const encryptedInputPass = parseoPass(password);

        if (userData.DES_PASSWORD !== encryptedInputPass) {
            return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
        }

        delete userData.DES_PASSWORD;

        res.json({ success: true, user: userData });

    } catch (err) {
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

app.get('/api/cirugias', async (req, res) => {
    try {
        const mes = req.query.mes || new Date().getMonth() + 1;
        const anio = new Date().getFullYear();
        const busqueda = req.query.busqueda || '';

        const pool = await poolPromise;
        const result = await pool.request()
            .input('mes', sql.Int, mes)
            .input('anio', sql.Int, anio)
            .input('busqueda', sql.VarChar, `%${busqueda}%`)
            .query(`
                SELECT 
                    ID_PROG_CIRUGIA,
                    EMPRESA,
                    FEC_CIRUGIA AS FECHA,
                    PACIENTE,
                    MEDICO,
                    DES_ESPECIALIDAD AS ESPECIALIDAD,
                    DES_ARTICULO_SERV AS CIRUGIA,
                    HORA_INICIO AS HORA_INICIO,
                    HORA_de_FIN AS HORA_FIN
                FROM VISTA_GRID_CIRUGIAS_CORPORATIVO
                WHERE MONTH(FEC_CIRUGIA) = @mes 
                AND YEAR(FEC_CIRUGIA) = @anio
                AND (
                    PACIENTE LIKE @busqueda OR
                    MEDICO LIKE @busqueda OR
                    DES_ARTICULO_SERV LIKE @busqueda OR
                    DES_ESPECIALIDAD LIKE @busqueda
                )
                ORDER BY FECHA ASC, HORA_INICIO ASC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al obtener la programación" });
    }
});

app.use('/api/formulario', formularioRoutes);
app.use('/api/horarios', require('./routes/horarios'));

const PORT = 4005;

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});