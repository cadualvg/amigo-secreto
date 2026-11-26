const db = require('../config/db');
const ErroHttp = require('../erro-http');

async function buscarGrupo(conexao, codigo, bloquear = false) {
  const consulta = 'SELECT * FROM grupos WHERE codigo = ?' + (bloquear ? ' FOR UPDATE' : '');
  const [[grupo]] = await conexao.execute(consulta, [codigo]);
  if (!grupo) throw new ErroHttp(404, 'Grupo não encontrado.');
  return grupo;
}

async function comGrupoBloqueado(codigo, executar) {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    const grupo = await buscarGrupo(conexao, codigo, true);
    const resultado = await executar(conexao, grupo);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

module.exports = { buscarGrupo, comGrupoBloqueado };
