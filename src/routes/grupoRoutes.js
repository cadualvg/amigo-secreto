const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');

router.post('/criar', grupoController.criarGrupo);

module.exports = router;
