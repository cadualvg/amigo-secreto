const express = require('express');

const app = express();
app.use(express.json());

const grupoRoutes = require('./routes/grupoRoutes');
app.use('/grupos', grupoRoutes);

const participanteRoutes = require('./routes/participanteRoutes');
app.use('/participantes', participanteRoutes);

app.get('/', (req, res) => {
res.send('Servidor do Amigo Secreto rodando 🚀');
});

const resultadoRoutes = require('./routes/resultadoRoutes');
app.use('/resultado', resultadoRoutes);


const pool = require('./config/db');

app.get('/test-db', async (req, res) => {
try {
    const [rows] = await pool.promise().query('SELECT 1');
    res.json({ message: 'Conexão com MySQL OK!', rows });
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao conectar no banco' });
}
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`✅ Servidor rodando na porta ${PORT}`);
});

