const db = require('../config/db');
const crypto = require('crypto');

exports.entrarNoGrupo = (req, res) => {
  const { nome, email, codigo_grupo } = req.body;

  if (!nome || !codigo_grupo) {
    return res.status(400).json({ erro: "Nome e código do grupo são obrigatórios." });
  }

  // Verifica se o grupo existe
  db.query(
    "SELECT * FROM grupos WHERE codigo = ?",
    [codigo_grupo],
    (err, results) => {
      if (err) return res.status(500).json({ erro: "Erro no servidor." });

      if (results.length === 0) {
        return res.status(404).json({ erro: "Grupo não encontrado." });
      }

      const grupo = results[0];

      // Impede entrada em grupo travado
if (grupo.travado === 1) {
  return res.status(400).json({
    erro: "O grupo está travado e não aceita novos participantes."
  });
}

      // Verifica se o participante já existe no grupo (email duplicado)
      db.query(
        "SELECT id FROM participantes WHERE email = ? AND grupo_id = ?",
        [email, grupo.id],
        (err2, rows) => {
          if (err2) return res.status(500).json({ erro: "Erro ao verificar duplicidade." });

          if (rows.length > 0) {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado neste grupo." });
          }

          // Verifica a quantidade de participantes
          db.query(
            "SELECT COUNT(*) AS total FROM participantes WHERE grupo_id = ?",
            [grupo.id],
            (err3, totalRows) => {
              if (err3)
                return res.status(500).json({ erro: "Erro ao contar participantes." });

              const total = totalRows[0].total;

              if (total >= grupo.quantidade_maxima_pessoas) {
                return res.status(400).json({
                  erro: "O grupo já atingiu o número máximo de participantes."
                });
              }

              // Cria código pessoal do participante
              const codigo_pessoal = crypto.randomBytes(3).toString("hex").toUpperCase();

              // Insere participante no grupo
              const sql = `
                INSERT INTO participantes (grupo_id, nome, email, codigo_pessoal)
                VALUES (?, ?, ?, ?)
              `;

              db.query(
                sql,
                [grupo.id, nome, email, codigo_pessoal],
                (err4, result4) => {
                  if (err4) {
                    console.log(err4);
                    return res.status(500).json({
                      erro: "Erro ao adicionar participante."
                    });
                  }

                  return res.status(201).json({
                    mensagem: "Participante adicionado com sucesso!",
                    participante: {
                      id: result4.insertId,
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
    }
  );
};

// REMOVER PARTICIPANTE DO GRUPO (antes de travar)
exports.removerParticipante = (req, res) => {
  const { codigo_grupo, codigo_organizador, codigo_pessoal } = req.body;

  if (!codigo_grupo || !codigo_organizador || !codigo_pessoal) {
    return res.status(400).json({
      erro: "Código do grupo, código do organizador e código pessoal são obrigatórios."
    });
  }

  // Busca grupo
  db.query(
    "SELECT * FROM grupos WHERE codigo = ?",
    [codigo_grupo],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: "Erro no servidor." });
      if (rows.length === 0) return res.status(404).json({ erro: "Grupo não encontrado." });

      const grupo = rows[0];

      // valida organizador
      if (grupo.codigo_organizador !== codigo_organizador) {
        return res.status(403).json({ erro: "Código do organizador incorreto." });
      }

      // impede remoção após travar
      if (grupo.travado === 1) {
        return res.status(400).json({ erro: "O grupo está travado e não permite remoção de participantes." });
      }

      // impede remoção após sorteio
      if (grupo.sorteado === 1) {
        return res.status(400).json({ erro: "Não é possível remover participantes após o sorteio." });
      }

      // verifica se participante existe
      db.query(
        "SELECT * FROM participantes WHERE codigo_pessoal = ? AND grupo_id = ?",
        [codigo_pessoal, grupo.id],
        (err2, participantes) => {
          if (err2) return res.status(500).json({ erro: "Erro ao buscar participante." });

          if (participantes.length === 0) {
            return res.status(404).json({ erro: "Participante não encontrado neste grupo." });
          }

          const participante = participantes[0];

          // deletar
          db.query(
            "DELETE FROM participantes WHERE id = ?",
            [participante.id],
            (err3) => {
              if (err3) return res.status(500).json({ erro: "Erro ao remover participante." });

              return res.status(200).json({
                mensagem: "Participante removido com sucesso.",
                removido: {
                  id: participante.id,
                  nome: participante.nome,
                  codigo_pessoal: participante.codigo_pessoal
                }
              });
            }
          );
        }
      );
    }
  );
};
