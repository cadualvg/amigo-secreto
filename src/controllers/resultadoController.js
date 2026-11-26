const db = require('../config/db');
const ErroHttp = require('../erro-http');
const { buscarGrupo } = require('../services/grupos');

exports.consultarResultado = async (req, res) => {
  const { codigo_grupo, codigo_pessoal } = req.body ?? {};
  if (typeof codigo_grupo !== 'string' || !codigo_grupo.trim() ||
      typeof codigo_pessoal !== 'string' || !codigo_pessoal.trim()) {
    throw new ErroHttp(400, 'Código do grupo e código pessoal são obrigatórios.');
  }

  const grupo = await buscarGrupo(db, codigo_grupo);
  if (!grupo.sorteado) throw new ErroHttp(400, 'O sorteio ainda não foi realizado.');

  const [[participante]] = await db.execute(
    'SELECT id, nome FROM participantes WHERE grupo_id = ? AND codigo_pessoal = ?',
    [grupo.id, codigo_pessoal]
  );
  if (!participante) throw new ErroHttp(404, 'Participante não encontrado.');

  const [[amigo]] = await db.execute(
    'SELECT p.nome FROM sorteios s JOIN participantes p ON p.id = s.amigo_sorteado_id WHERE s.grupo_id = ? AND s.participante_id = ?',
    [grupo.id, participante.id]
  );
  if (!amigo) throw new ErroHttp(404, 'Resultado não encontrado.');

  res.json({ grupo: grupo.nome, seu_nome: participante.nome, amigo_secreto: amigo.nome });
};
