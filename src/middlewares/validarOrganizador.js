const db = require('../config/db');

module.exports = (req, res, next) => {
    const codigo_grupo =
        req.body?.codigo_grupo || req.query?.codigo_grupo;

    const codigo_organizador =
        req.body?.codigo_organizador || req.query?.codigo_organizador;

    if (!codigo_grupo || !codigo_organizador) {
        return res.status(400).json({
            erro: "Código do grupo e código do organizador são obrigatórios."
        });
    }

    db.query(
        "SELECT * FROM grupos WHERE codigo = ?",
        [codigo_grupo],
        (err, results) => {
            if (err) {
                return res.status(500).json({ erro: "Erro no servidor." });
            }

            if (results.length === 0) {
                return res.status(404).json({ erro: "Grupo não encontrado." });
            }

            const grupo = results[0];

            if (grupo.codigo_organizador !== codigo_organizador) {
                return res.status(403).json({
                    erro: "Código do organizador inválido."
                });
            }

            // Disponibiliza o grupo para o controller
            req.grupo = grupo;

            next();
        }
    );
};
