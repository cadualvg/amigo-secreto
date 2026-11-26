const { Router } = require('express');
const {
  criarGrupo, travarGrupo, sortearGrupo, listarParticipantes
} = require('../controllers/grupoController');
const { validarOrganizador } = require('../middlewares/validarOrganizador');

const router = Router();

router.post('/criar', criarGrupo);
router.post('/travar', travarGrupo);
router.post('/sortear', sortearGrupo);
router.get('/participantes', validarOrganizador, listarParticipantes);

module.exports = router;
