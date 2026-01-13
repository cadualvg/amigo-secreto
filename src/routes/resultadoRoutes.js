const express = require('express');
const router = express.Router();

const resultadoController = require('../controllers/resultadoController');

router.post('/consultar', resultadoController.consultarResultado);

module.exports = router;
