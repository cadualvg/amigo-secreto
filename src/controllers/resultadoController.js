const db = require('../config/db');

exports.consultarResultado = (req, res) => {
const { codigo_pessoal } = req.body;

if (!codigo_pessoal) {
    return res.status(400).json({ erro: "Código pessoal é obrigatório." });
}

  // Busca participante pelo código pessoal
db.query(
    "SELECT * FROM participantes WHERE codigo_pessoal = ?",
    [codigo_pessoal],
    (err, participRows) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar participante." });
    if (participRows.length === 0)
        return res.status(404).json({ erro: "Participante não encontrado." });

    const participante = participRows[0];

      // Busca sorteio desse participante
    db.query(
        "SELECT amigo_sorteado_id FROM sorteios WHERE participante_id = ?",
        [participante.id],
        (err2, sorteioRows) => {
        if (err2) return res.status(500).json({ erro: "Erro ao buscar resultado do sorteio." });
        if (sorteioRows.length === 0)
            return res.status(400).json({ erro: "O sorteio ainda não foi realizado para este grupo." });

        const amigoId = sorteioRows[0].amigo_sorteado_id;

          // Busc nome do amigo sorteado
        db.query(
            "SELECT nome FROM participantes WHERE id = ?",
            [amigoId],
            (err3, amigoRows) => {
            if (err3) return res.status(500).json({ erro: "Erro ao buscar amigo sorteado." });

            const nomeAmigo = amigoRows[0].nome;

            return res.json({
                mensagem: "Resultado encontrado!",
                voce_tirou: nomeAmigo
            });
            }
        );
        }
    );
    }
);
};
