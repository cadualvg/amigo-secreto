const db = require('../config/db');

module.exports = (req, res, next) => {
  const { codigo_grupo } = req.body || req.query;

  if (!codigo_grupo) {
    return res.status(400).json({
      erro: "Código do grupo é obrigatório."
    });
  }

  db.query(
    "SELECT * FROM grupos WHERE codigo = ?",
    [codigo_grupo],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao verificar status do grupo."
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          erro: "Grupo não encontrado."
        });
      }

      const grupo = rows[0];

      if (grupo.travado === 1) {
        return res.status(403).json({
          erro: "Este grupo está travado e não permite novas ações."
        });
      }

      // Grupo liberado → segue
      next();
    }
  );
};
