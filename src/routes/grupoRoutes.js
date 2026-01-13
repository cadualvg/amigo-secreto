const express = require('express');
const router = express.Router();

const grupoController = require('../controllers/grupoController');
const validarOrganizador = require('../middlewares/validarOrganizador');

// Criar grupo (não precisa de middleware)
router.post('/criar', grupoController.criarGrupo);

// Travar / destravar grupo (SÓ organizador)
router.post(
'/travar',
validarOrganizador,
grupoController.travarGrupo
);

// Sortear grupo (SÓ organizador)
router.post(
'/sortear',
validarOrganizador,
grupoController.sortearGrupo
);

// Listar participantes (SÓ organizador)
router.get(
'/participantes',
validarOrganizador,
grupoController.listarParticipantes
);

module.exports = router;
