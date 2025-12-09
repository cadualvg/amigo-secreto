const express = require('express');
const router = express.Router();
const participanteController = require('../controllers/participanteController');

router.post('/entrar', participanteController.entrarNoGrupo);

module.exports = router;
