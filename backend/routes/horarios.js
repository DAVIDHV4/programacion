const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horariosController');

router.get('/filtros', horariosController.getFiltrosHorarios);
router.post('/buscar', horariosController.buscarHorarios);
router.get('/detalle/:medico/:fecha/:horaInicio', horariosController.getHorarioDetalle);
router.get('/diccionarios-edicion/:especialidad', horariosController.getFiltrosEdicion);
router.put('/actualizar/:medico/:fecha/:horaInicio', horariosController.actualizarHorario);

module.exports = router;