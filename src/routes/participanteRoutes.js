const express = require('express');
const router = express.Router();

const participanteController = require('../controllers/participanteController');
const bloquearGrupoTravado = require('../middlewares/bloquearGrupoTravado');

//PARTICIPANTES
// Entrar no grupo (middleware)
router.post(
'/entrar',
bloquearGrupoTravado,
participanteController.entrarNoGrupo
);

// Remover participante (sem middleware)
router.delete(
'/remover',
participanteController.removerParticipante
);

module.exports = router;
