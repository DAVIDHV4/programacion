const express = require('express');
const router = express.Router();
const atencionesController = require('../controllers/atencionesController');

router.get('/', atencionesController.getAtenciones);
router.get('/especialidades', atencionesController.getEspecialidades);
router.get('/medicos/:especialidad', atencionesController.getMedicosPorEspecialidad);

module.exports = router;