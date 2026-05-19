const express = require('express');
const router = express.Router();
const formularioController = require('../controllers/formularioController');

router.get('/diccionarios', formularioController.getDiccionarios);
router.get('/medicos/:id', formularioController.getMedicosPorEspecialidad);
router.get('/paciente/:dni', formularioController.getPacientePorDNI);
router.get('/cirugias/buscar', formularioController.buscarCirugias);
router.post('/guardar', formularioController.guardarCirugia);

router.get('/cirugia/:id', formularioController.getCirugiaPorId);
router.put('/actualizar/:id', formularioController.actualizarCirugia);

module.exports = router;