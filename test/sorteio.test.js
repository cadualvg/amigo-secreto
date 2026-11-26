const { test } = require('node:test');
const assert = require('node:assert/strict');
const sortear = require('../src/domain/sorteio');

const grupo = { travado: 1, sorteado: 0, quantidade_maxima_pessoas: 4 };
const participantes = [11, 22, 33, 44].map(id => Object.freeze({ id }));

test('duas pessoas necessariamente tiram uma à outra', () => {
  assert.deepEqual(sortear({ ...grupo, quantidade_maxima_pessoas: 2 }, participantes.slice(0, 2)), [
    { participanteId: 11, amigoId: 22 },
    { participanteId: 22, amigoId: 11 }
  ]);
});

test('cada pessoa tira outra e é escolhida exatamente uma vez', () => {
  for (const tamanho of [4, 12, 100]) {
    const pessoas = Object.freeze(Array.from({ length: tamanho }, (_, i) => Object.freeze({ id: i + 1 })));
    for (let repeticao = 0; repeticao < 20; repeticao++) {
      const pares = sortear({ ...grupo, quantidade_maxima_pessoas: tamanho }, pessoas);
      assert.equal(pares.length, tamanho);
      assert.deepEqual(pares.map(p => p.participanteId), pessoas.map(p => p.id));
      assert.deepEqual(new Set(pares.map(p => p.amigoId)), new Set(pessoas.map(p => p.id)));
      assert.ok(pares.every(p => p.participanteId !== p.amigoId));
    }
  }
});

test('a seleção aleatória pode ser controlada em um teste', () => {
  assert.deepEqual(sortear(grupo, participantes, i => i - 1), [
    { participanteId: 11, amigoId: 44 },
    { participanteId: 22, amigoId: 11 },
    { participanteId: 33, amigoId: 22 },
    { participanteId: 44, amigoId: 33 }
  ]);
});

test('grupo aberto precisa ser travado', () => {
  assert.throws(() => sortear({ ...grupo, travado: 0 }, participantes), { status: 400, message: /travado/ });
});

test('um grupo precisa estar completo e ter ao menos duas pessoas, em número par', () => {
  assert.throws(() => sortear(grupo, participantes.slice(0, 2)), { status: 400, message: /completo/ });
  assert.throws(() => sortear({ ...grupo, quantidade_maxima_pessoas: 1 }, participantes.slice(0, 1)), { status: 400 });
  assert.throws(() => sortear({ ...grupo, quantidade_maxima_pessoas: 3 }, participantes.slice(0, 3)), { status: 400 });
  assert.throws(() => sortear({ ...grupo, quantidade_maxima_pessoas: 2 }, participantes), { status: 400 });
});

test('o resultado de um grupo já sorteado é definitivo', () => {
  assert.throws(() => sortear({ ...grupo, sorteado: 1 }, participantes), { status: 409, message: /já foi sorteado/ });
});
