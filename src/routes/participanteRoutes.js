const { Router } = require('express');
const { entrarNoGrupo, removerParticipante } = require('../controllers/participanteController');

const router = Router();

router.post('/entrar', entrarNoGrupo);
router.delete('/remover', removerParticipante);

module.exports = router;
