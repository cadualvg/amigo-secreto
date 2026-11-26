const path = require('node:path');
const express = require('express');
const db = require('./config/db');
const ErroHttp = require('./erro-http');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(['/grupos', '/participantes', '/resultado', '/health', '/test-db'], (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/grupos', require('./routes/grupoRoutes'));
app.use('/participantes', require('./routes/participanteRoutes'));
app.use('/resultado', require('./routes/resultadoRoutes'));

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT g.id FROM grupos g, participantes p, sorteios s LIMIT 0');
    res.json({ status: 'ok' });
  } catch (erro) {
    console.error('MySQL indisponível:', erro.code || erro.name);
    res.status(503).json({ status: 'indisponivel' });
  }
});

app.get('/test-db', async (req, res) => {
  const [rows] = await db.query('SELECT 1');
  res.json({ message: 'Conexão com MySQL OK!', rows });
});

app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  if (erro instanceof ErroHttp) return res.status(erro.status).json({ erro: erro.message });
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  if (erro.type === 'entity.too.large') return res.status(413).json({ erro: 'Corpo da requisição muito grande.' });
  console.error(erro.code || erro.name);
  res.status(500).json({ erro: 'Erro no servidor.' });
});

module.exports = app;
