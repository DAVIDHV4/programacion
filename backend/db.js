require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false, 
        trustServerCertificate: true, 
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Conexión exitosa a SQL Server 2008');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a la base de datos:', err.message);
        process.exit(1); 
    });

module.exports = {
    sql,
    poolPromise
};