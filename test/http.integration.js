const { once } = require('node:events');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

require('dotenv').config({ quiet: true });
if (!process.env.DB_DATABASE?.endsWith('_test')) {
  throw new Error('Use um banco de testes cujo nome termine em _test.');
}

const app = require('../src/app');
const db = require('../src/config/db');
const prepararBanco = require('../database/setup');

let server;
let base;
const gruposCriados = [];

before(async () => {
  await prepararBanco();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  try {
    for (const id of gruposCriados) await db.execute('DELETE FROM grupos WHERE id = ?', [id]);
  } finally {
    await db.end();
  }
});

async function requisitar(rota, { dados, metodo = dados ? 'POST' : 'GET', headers = {} } = {}) {
  const resposta = await fetch(base + rota, {
    method: metodo,
    headers: dados ? { ...headers, 'Content-Type': 'application/json' } : headers,
    body: dados && JSON.stringify(dados),
    signal: AbortSignal.timeout(7000)
  });
  return { status: resposta.status, body: await resposta.json() };
}

async function criarGrupo() {
  const { status, body } = await requisitar('/grupos/criar', {
    dados: { nome: 'Grupo de teste', quantidade_maxima_pessoas: 2 }
  });
  assert.equal(status, 201);
  gruposCriados.push(body.grupo.id);
  return {
    id: body.grupo.id,
    codigo_grupo: body.grupo.codigo,
    codigo_organizador: body.grupo.codigo_organizador
  };
}

function entrar(grupo, nome) {
  return requisitar('/participantes/entrar', { dados: { codigo_grupo: grupo.codigo_grupo, nome } });
}

test('a API e o schema do MySQL respondem ao health check', async () => {
  assert.deepEqual(await requisitar('/health'), { status: 200, body: { status: 'ok' } });
});

test('entradas simultâneas respeitam a capacidade do grupo', async () => {
  const grupo = await criarGrupo();
  const respostas = await Promise.all(['Ana', 'Bruno', 'Caio'].map(nome => entrar(grupo, nome)));
  assert.deepEqual(respostas.map(r => r.status).sort(), [201, 201, 400]);

  const lista = await requisitar('/grupos/participantes?codigo_grupo=' + grupo.codigo_grupo, {
    headers: { 'X-Codigo-Organizador': grupo.codigo_organizador }
  });
  assert.equal(lista.status, 200);
  assert.equal(lista.body.total, 2);
});

test('a API aplica as regras de grupo e revela só a atribuição consultada', async () => {
  const grupo = await criarGrupo();

  assert.equal((await requisitar('/grupos/sortear', {
    dados: { ...grupo, codigo_organizador: 'INCORRETO' }
  })).status, 403);
  assert.match((await requisitar('/grupos/sortear', { dados: grupo })).body.erro, /travado/);
  assert.equal((await requisitar('/grupos/travar', { dados: { ...grupo, travar: true } })).status, 200);
  assert.match((await requisitar('/grupos/sortear', { dados: grupo })).body.erro, /completo/);
  assert.equal((await entrar(grupo, 'Eva')).status, 403);

  assert.equal((await requisitar('/grupos/travar', { dados: { ...grupo, travar: false } })).status, 200);
  const ana = await entrar(grupo, 'Ana');
  const bruno = await entrar(grupo, 'Bruno');
  assert.equal(ana.status, 201);
  assert.equal(bruno.status, 201);
  const codigoAna = ana.body.participante.codigo_pessoal;
  const codigoBruno = bruno.body.participante.codigo_pessoal;

  const consulta = codigo_pessoal => requisitar('/resultado/consultar', {
    dados: { codigo_grupo: grupo.codigo_grupo, codigo_pessoal }
  });
  assert.equal((await consulta(codigoAna)).status, 400);
  assert.equal((await requisitar('/grupos/travar', { dados: { ...grupo, travar: true } })).status, 200);

  const tentativas = await Promise.all([
    requisitar('/grupos/sortear', { dados: grupo }),
    requisitar('/grupos/sortear', { dados: grupo })
  ]);
  assert.deepEqual(tentativas.map(r => r.status).sort(), [201, 409]);
  assert.equal((await requisitar('/grupos/travar', { dados: { ...grupo, travar: false } })).status, 400);
  assert.equal((await requisitar('/participantes/remover', {
    metodo: 'DELETE', dados: { ...grupo, codigo_pessoal: codigoAna }
  })).status, 400);
  assert.deepEqual((await consulta(codigoAna)).body, {
    grupo: 'Grupo de teste', seu_nome: 'Ana', amigo_secreto: 'Bruno'
  });
  assert.equal((await consulta(codigoBruno)).body.amigo_secreto, 'Ana');
  assert.equal((await consulta('INCORRETO')).status, 404);
});

test('uma falha ao marcar o grupo desfaz a gravação das atribuições', async () => {
  const grupo = await criarGrupo();
  assert.equal((await entrar(grupo, 'Ana')).status, 201);
  assert.equal((await entrar(grupo, 'Bruno')).status, 201);
  assert.equal((await requisitar('/grupos/travar', { dados: { ...grupo, travar: true } })).status, 200);

  const restricao = 'falhar_sorteio_' + grupo.id;
  await db.query('ALTER TABLE grupos ADD CONSTRAINT ' + restricao + ' CHECK (codigo <> ? OR sorteado = 0)', [grupo.codigo_grupo]);
  try {
    assert.equal((await requisitar('/grupos/sortear', { dados: grupo })).status, 500);
    const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM sorteios WHERE grupo_id = ?', [grupo.id]);
    assert.equal(total, 0);
  } finally {
    await db.query('ALTER TABLE grupos DROP CHECK ' + restricao);
  }
  assert.equal((await requisitar('/grupos/sortear', { dados: grupo })).status, 201);
});
