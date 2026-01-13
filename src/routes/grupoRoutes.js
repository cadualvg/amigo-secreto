const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');

router.post('/criar', grupoController.criarGrupo);

const validarOrganizador = require('../middlewares/validarOrganizador');


module.exports = router;

router.post('/travar', validarOrganizador, grupoController.travarGrupo);

router.post('/sortear', grupoController.sortearGrupo);

router.get('/participantes', grupoController.listarParticipantes);

