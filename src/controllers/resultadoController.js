const db = require('../config/db');

exports.consultarResultado = (req, res) => {
    const { codigo_grupo, codigo_pessoal } = req.body;

    if (!codigo_grupo || !codigo_pessoal) {
        return res.status(400).json({
            erro: "Código do grupo e código pessoal são obrigatórios."
        });
    }

    // Buscar grupo
    db.query(
        "SELECT * FROM grupos WHERE codigo = ?",
        [codigo_grupo],
        (err, grupos) => {
            if (err) return res.status(500).json({ erro: "Erro no servidor." });
            if (grupos.length === 0)
                return res.status(404).json({ erro: "Grupo não encontrado." });

            const grupo = grupos[0];

            if (!grupo.sorteado) {
                return res.status(400).json({
                    erro: "O sorteio ainda não foi realizado."
                });
            }

            // Buscar participante
            db.query(
                "SELECT * FROM participantes WHERE codigo_pessoal = ? AND grupo_id = ?",
                [codigo_pessoal, grupo.id],
                (err2, participantes) => {
                    if (err2)
                        return res.status(500).json({ erro: "Erro no servidor." });

                    if (participantes.length === 0) {
                        return res.status(404).json({
                            erro: "Participante não encontrado."
                        });
                    }

                    const participante = participantes[0];

                    // Buscar sorteio
                    db.query(
                        `
                        SELECT p.nome 
                        FROM sorteios s
                        JOIN participantes p 
                          ON p.id = s.amigo_sorteado_id
                        WHERE s.participante_id = ?
                        `,
                        [participante.id],
                        (err3, resultado) => {
                            if (err3)
                                return res.status(500).json({ erro: "Erro no servidor." });

                            if (resultado.length === 0) {
                                return res.status(404).json({
                                    erro: "Resultado não encontrado."
                                });
                            }

                            return res.status(200).json({
                                grupo: grupo.nome,
                                seu_nome: participante.nome,
                                amigo_secreto: resultado[0].nome
                            });
                        }
                    );
                }
            );
        }
    );
};
