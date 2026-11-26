const { timingSafeEqual } = require('node:crypto');
const db = require('../config/db');
const ErroHttp = require('../erro-http');
const { buscarGrupo } = require('../services/grupos');

function credenciaisOrganizador(req) {
  const codigo = req.body?.codigo_grupo || req.query?.codigo_grupo;
  const organizador = req.body?.codigo_organizador ||
    req.get('X-Codigo-Organizador') || req.query?.codigo_organizador;

  if (typeof codigo !== 'string' || !codigo.trim() ||
      typeof organizador !== 'string' || !organizador.trim()) {
    throw new ErroHttp(400, 'Código do grupo e código do organizador são obrigatórios.');
  }
  return { codigo, organizador };
}

function exigirOrganizador(grupo, organizador) {
  const esperado = Buffer.from(grupo.codigo_organizador);
  const recebido = Buffer.from(organizador);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) {
    throw new ErroHttp(403, 'Código do organizador inválido.');
  }
}

async function validarOrganizador(req, res, next) {
  const { codigo, organizador } = credenciaisOrganizador(req);
  const grupo = await buscarGrupo(db, codigo);
  exigirOrganizador(grupo, organizador);
  req.grupo = grupo;
  next();
}

module.exports = { credenciaisOrganizador, exigirOrganizador, validarOrganizador };
