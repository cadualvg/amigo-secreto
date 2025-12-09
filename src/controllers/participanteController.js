const db = require('../config/db');
const crypto = require('crypto');

exports.entrarNoGrupo = (req, res) => {
const { nome, email, codigo_grupo } = req.body;

if (!nome || !codigo_grupo) {
    return res.status(400).json({ erro: "Nome e código do grupo são obrigatórios." });
}

  // 1. Verificar se o grupo existe
db.query(
    "SELECT * FROM grupos WHERE codigo = ?",
    [codigo_grupo],
    (err, results) => {
    if (err) 
        return res.status(500).json({ erro: "Erro no servidor." });

    if (results.length === 0) {
    return res.status(404).json({ erro: "Grupo não encontrado." });
    }

    const grupo = results[0];

      // 2. Verificar quantidade de participantes
    db.query(
        "SELECT COUNT(*) AS total FROM participantes WHERE grupo_id = ?",
        [grupo.id],
        (err2, results2) => {
    if (err2) return res.status(500).json({ erro: "Erro ao contar participantes." });

    const total = results2[0].total;

    if (total >= grupo.quantidade_maxima_pessoas) {
    return res.status(400).json({ erro: "O grupo já atingiu o número máximo de participantes." });
        }

          // 3. Criar código pessoal do participante
    const codigo_pessoal = crypto.randomBytes(3).toString("hex").toUpperCase();

          // 4. Inserir participante
    const sql = `
        INSERT INTO participantes (grupo_id, nome, email, codigo_pessoal)
        VALUES (?, ?, ?, ?)`;

        db.query(
        sql,[grupo.id, nome, email, codigo_pessoal],
        (err3, result3) => {
            if (err3) {
            console.log(err3);
            return res.status(500).json({ erro: "Erro ao adicionar participante." });
            }

            return res.status(201).json({
                mensagem: "Participante adicionado com sucesso!",
                participante: {
                id: result3.insertId,
                nome,
                codigo_pessoal,
                grupo: grupo.nome
                }
            });
            }
        );
        }
    );
    }
);
};
