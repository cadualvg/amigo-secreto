const { randomBytes } = require('node:crypto');
const db = require('../config/db');
const ErroHttp = require('../erro-http');
const sortear = require('../domain/sorteio');
const { comGrupoBloqueado } = require('../services/grupos');
const { credenciaisOrganizador, exigirOrganizador } = require('../middlewares/validarOrganizador');

exports.criarGrupo = async (req, res) => {
  const {
    nome, descricao = null, quantidade_maxima_pessoas, valor_presente = null, data_evento = null
  } = req.body ?? {};
  const quantidade = Number(quantidade_maxima_pessoas);

  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 120) {
    throw new ErroHttp(400, 'Informe um nome para o grupo com até 120 caracteres.');
  }
  if (!Number.isInteger(quantidade) || quantidade < 2 || quantidade > 2147483647 || quantidade % 2 !== 0) {
    throw new ErroHttp(400, 'A quantidade máxima deve ser um número par entre 2 e 2147483646.');
  }

  const codigo = randomBytes(4).toString('hex').toUpperCase();
  const codigo_organizador = randomBytes(6).toString('hex').toUpperCase();
  const [resultado] = await db.execute(
    'INSERT INTO grupos (codigo, codigo_organizador, nome, descricao, quantidade_maxima_pessoas, valor_presente, data_evento) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [codigo, codigo_organizador, nome.trim(), descricao, quantidade, valor_presente, data_evento]
  );

  res.status(201).json({
    mensagem: 'Grupo criado com sucesso!',
    grupo: {
      id: resultado.insertId,
      codigo,
      codigo_organizador,
      nome: nome.trim(),
      quantidade_maxima_pessoas: quantidade,
      valor_presente,
      data_evento
    }
  });
};

exports.travarGrupo = async (req, res) => {
  const { codigo, organizador } = credenciaisOrganizador(req);
  const { travar } = req.body ?? {};
  if (typeof travar !== 'boolean') {
    throw new ErroHttp(400, "O campo 'travar' deve ser boolean (true ou false).");
  }

  await comGrupoBloqueado(codigo, async (conexao, grupo) => {
    exigirOrganizador(grupo, organizador);
    if (grupo.sorteado && !travar) {
      throw new ErroHttp(400, 'Não é possível destravar um grupo que já foi sorteado.');
    }
    await conexao.execute('UPDATE grupos SET travado = ? WHERE id = ?', [Number(travar), grupo.id]);
  });

  res.json({ mensagem: travar ? 'Grupo travado com sucesso.' : 'Grupo destravado com sucesso.' });
};

exports.sortearGrupo = async (req, res) => {
  const { codigo, organizador } = credenciaisOrganizador(req);

  const total = await comGrupoBloqueado(codigo, async (conexao, grupo) => {
    exigirOrganizador(grupo, organizador);
    const [participantes] = await conexao.execute(
      'SELECT id FROM participantes WHERE grupo_id = ? ORDER BY id',
      [grupo.id]
    );
    const atribuicoes = sortear(grupo, participantes);
    const linhas = atribuicoes.map(({ participanteId, amigoId }) => [grupo.id, participanteId, amigoId]);

    await conexao.query(
      'INSERT INTO sorteios (grupo_id, participante_id, amigo_sorteado_id) VALUES ?',
      [linhas]
    );
    await conexao.execute('UPDATE grupos SET sorteado = 1 WHERE id = ?', [grupo.id]);
    return atribuicoes.length;
  });

  res.status(201).json({ mensagem: 'Sorteio realizado com sucesso!', total });
};

exports.listarParticipantes = async (req, res) => {
  const grupo = req.grupo;
  const [participantes] = await db.execute(
    'SELECT id, nome, email, codigo_pessoal FROM participantes WHERE grupo_id = ? ORDER BY id',
    [grupo.id]
  );

  res.json({
    grupo: grupo.nome,
    total: participantes.length,
    quantidade_maxima_pessoas: grupo.quantidade_maxima_pessoas,
    travado: Boolean(grupo.travado),
    sorteado: Boolean(grupo.sorteado),
    participantes
  });
};
