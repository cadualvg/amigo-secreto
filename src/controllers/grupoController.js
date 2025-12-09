const db = require('../config/db');
const crypto = require('crypto');

exports.criarGrupo = (req, res) => {
const { nome, descricao, quantidade_maxima_pessoas, valor_presente, data_evento } = req.body;

  // validação simples
if (!nome || !quantidade_maxima_pessoas) {
    return res.status(400).json({ erro: "Nome e quantidade máxima são obrigatórios." });
}

  // gerar o código único (6 caracteres)
const codigo = crypto.randomBytes(3).toString('hex').toUpperCase();

const sql = `
    INSERT INTO grupos (codigo, nome, descricao, quantidade_maxima_pessoas, valor_presente, data_evento)
    VALUES (?, ?, ?, ?, ?, ?)
`;

db.query(
    sql,
    [codigo, nome, descricao, quantidade_maxima_pessoas, valor_presente, data_evento],
    (err, result) => {
    if (err) {
        console.error("Erro ao criar grupo:", err);
        return res.status(500).json({ erro: "Erro ao criar grupo." });
    }

    return res.status(201).json({
    mensagem: "Grupo criado com sucesso!",
        grupo: {
        id: result.insertId,
        codigo,
        nome,
        quantidade_maxima_pessoas,
        valor_presente,
        data_evento
        }
    });
    }
);
};
