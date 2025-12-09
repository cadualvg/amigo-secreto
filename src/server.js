const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
res.send('Servidor do Amigo Secreto rodando 🚀');
});

app.listen(3000, () => {
console.log('✅ Servidor rodando em http://localhost:3000');
});

