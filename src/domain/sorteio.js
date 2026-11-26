const { randomInt } = require('node:crypto');
const ErroHttp = require('../erro-http');

function sortear(grupo, participantes, indiceAleatorio = randomInt) {
  if (grupo.sorteado) throw new ErroHttp(409, 'O grupo já foi sorteado.');
  if (!grupo.travado) throw new ErroHttp(400, 'O grupo precisa estar travado antes do sorteio.');

  const total = participantes.length;
  if (total < 2 || total % 2 !== 0 || total !== grupo.quantidade_maxima_pessoas) {
    throw new ErroHttp(400, 'O grupo precisa estar completo e ter um número par de participantes.');
  }

  const amigos = participantes.map(({ id }) => id);
  // Sattolo gera um único ciclo: cada pessoa recebe um amigo distinto de si mesma.
  for (let i = total - 1; i > 0; i--) {
    const j = indiceAleatorio(i);
    [amigos[i], amigos[j]] = [amigos[j], amigos[i]];
  }

  return participantes.map(({ id }, i) => ({
    participanteId: id,
    amigoId: amigos[i]
  }));
}

module.exports = sortear;
