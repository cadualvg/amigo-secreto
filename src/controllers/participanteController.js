const { randomBytes } = require('node:crypto');
const ErroHttp = require('../erro-http');
const { comGrupoBloqueado } = require('../services/grupos');
const { credenciaisOrganizador, exigirOrganizador } = require('../middlewares/validarOrganizador');

exports.entrarNoGrupo = async (req, res) => {
  const { nome, email = null, codigo_grupo } = req.body ?? {};

  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 120 ||
      typeof codigo_grupo !== 'string' || !codigo_grupo.trim()) {
    throw new ErroHttp(400, 'Informe o código do grupo e um nome com até 120 caracteres.');
  }
  if (email !== null && (typeof email !== 'string' || email.trim().length > 160)) {
    throw new ErroHttp(400, 'Informe um e-mail com até 160 caracteres.');
  }

  const emailNormalizado = email?.trim() || null;
  const participante = await comGrupoBloqueado(codigo_grupo, async (conexao, grupo) => {
    if (grupo.travado || grupo.sorteado) {
      throw new ErroHttp(403, 'O grupo está travado e não aceita novos participantes.');
    }

    if (emailNormalizado) {
      const [[duplicado]] = await conexao.execute(
        'SELECT id FROM participantes WHERE grupo_id = ? AND email = ?',
        [grupo.id, emailNormalizado]
      );
      if (duplicado) throw new ErroHttp(400, 'Este e-mail já está cadastrado neste grupo.');
    }

    const [[{ total }]] = await conexao.execute(
      'SELECT COUNT(*) AS total FROM participantes WHERE grupo_id = ?',
      [grupo.id]
    );
    if (total >= grupo.quantidade_maxima_pessoas) {
      throw new ErroHttp(400, 'O grupo já atingiu o número máximo de participantes.');
    }

    const codigo_pessoal = randomBytes(6).toString('hex').toUpperCase();
    const [resultado] = await conexao.execute(
      'INSERT INTO participantes (grupo_id, nome, email, codigo_pessoal) VALUES (?, ?, ?, ?)',
      [grupo.id, nome.trim(), emailNormalizado, codigo_pessoal]
    );

    return { id: resultado.insertId, nome: nome.trim(), codigo_pessoal, grupo: grupo.nome };
  });

  res.status(201).json({ mensagem: 'Participante adicionado com sucesso!', participante });
};

exports.removerParticipante = async (req, res) => {
  const { codigo, organizador } = credenciaisOrganizador(req);
  const { codigo_pessoal } = req.body ?? {};
  if (typeof codigo_pessoal !== 'string' || !codigo_pessoal.trim()) {
    throw new ErroHttp(400, 'O código pessoal é obrigatório.');
  }

  const removido = await comGrupoBloqueado(codigo, async (conexao, grupo) => {
    exigirOrganizador(grupo, organizador);
    if (grupo.travado || grupo.sorteado) {
      throw new ErroHttp(400, 'O grupo está travado e não permite remoção de participantes.');
    }

    const [[participante]] = await conexao.execute(
      'SELECT id, nome, codigo_pessoal FROM participantes WHERE grupo_id = ? AND codigo_pessoal = ?',
      [grupo.id, codigo_pessoal]
    );
    if (!participante) throw new ErroHttp(404, 'Participante não encontrado neste grupo.');
    await conexao.execute('DELETE FROM participantes WHERE id = ?', [participante.id]);
    return participante;
  });

  res.json({ mensagem: 'Participante removido com sucesso.', removido });
};
