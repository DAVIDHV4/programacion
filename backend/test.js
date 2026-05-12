// test.js
const { poolPromise } = require('./db');

async function test() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('Versión del Servidor:', result.recordset[0].version);
    } catch (err) {
        console.error(err);
    }
}

test();