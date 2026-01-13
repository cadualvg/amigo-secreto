const db = require('../config/db');
const crypto = require('crypto');


 // CRIAR GRUPO

exports.criarGrupo = (req, res) => {
  const {
    nome,
    descricao,
    quantidade_maxima_pessoas,
    valor_presente,
    data_evento
  } = req.body;

  if (!nome || !quantidade_maxima_pessoas) {
    return res.status(400).json({
      erro: "Nome e quantidade máxima são obrigatórios."
    });
  }

  // Impede número ímpar
  if (quantidade_maxima_pessoas % 2 !== 0) {
    return res.status(400).json({
      erro: "O número máximo de participantes deve ser PAR para permitir o sorteio."
    });
  }

  const codigo = crypto.randomBytes(3).toString('hex').toUpperCase();
  const codigo_organizador = crypto.randomBytes(4).toString('hex').toUpperCase();

  const sql = `
    INSERT INTO grupos
    (codigo, codigo_organizador, nome, descricao, quantidade_maxima_pessoas, valor_presente, data_evento)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      codigo,
      codigo_organizador,
      nome,
      descricao,
      quantidade_maxima_pessoas,
      valor_presente,
      data_evento
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao criar grupo." });
      }

      res.status(201).json({
        mensagem: "Grupo criado com sucesso!",
        grupo: {
          id: result.insertId,
          codigo,
          codigo_organizador,
          nome,
          quantidade_maxima_pessoas,
          valor_presente,
          data_evento
        }
      });
    }
  );
};

/**
TRAVAR / DESTRAVAR GRUPO
middlewar
 */
exports.travarGrupo = (req, res) => {
  const { travar } = req.body;
  const grupo = req.grupo;

  // Impede destravar após sorteio
  if (grupo.sorteado === 1 && travar === false) {
    return res.status(400).json({
      erro: "Não é possível destravar um grupo que já foi sorteado."
    });
  }

  const novoEstado = travar ? 1 : 0;

  db.query(
    "UPDATE grupos SET travado = ? WHERE id = ?",
    [novoEstado, grupo.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao atualizar grupo."
        });
      }

      res.status(200).json({
        mensagem: travar
          ? "Grupo travado com sucesso."
          : "Grupo destravado com sucesso."
      });
    }
  );
};

/**
 * SORTEAR GRUPO
 */
exports.sortearGrupo = (req, res) => {
  const { codigo_grupo } = req.body;

  if (!codigo_grupo) {
    return res.status(400).json({
      erro: "Código do grupo é obrigatório."
    });
  }

  db.query(
    "SELECT * FROM grupos WHERE codigo = ?",
    [codigo_grupo],
    (err, resultGrupo) => {
      if (err) return res.status(500).json({ erro: "Erro no servidor." });
      if (resultGrupo.length === 0)
        return res.status(404).json({ erro: "Grupo não encontrado." });

      const grupo = resultGrupo[0];

      if (!grupo.travado) {
        return res.status(400).json({
          erro: "O grupo precisa estar travado antes do sorteio."
        });
      }

      db.query(
        "SELECT * FROM participantes WHERE grupo_id = ?",
        [grupo.id],
        (err2, participantes) => {
          if (err2)
            return res.status(500).json({
              erro: "Erro ao buscar participantes."
            });

          if (participantes.length !== grupo.quantidade_maxima_pessoas) {
            return res.status(400).json({
              erro: "O grupo não possui participantes suficientes."
            });
          }

          const embaralhados = [...participantes].sort(() => Math.random() - 0.5);

          for (let i = 0; i < participantes.length; i++) {
            if (participantes[i].id === embaralhados[i].id) {
              return exports.sortearGrupo(req, res);
            }
          }

          const inserts = participantes.map((p, i) => [
            grupo.id,
            p.id,
            embaralhados[i].id
          ]);

          db.query(
            "INSERT INTO sorteios (grupo_id, participante_id, amigo_sorteado_id) VALUES ?",
            [inserts],
            (err3) => {
              if (err3)
                return res.status(500).json({
                  erro: "Erro ao salvar sorteio."
                });

              db.query(
                "UPDATE grupos SET sorteado = 1 WHERE id = ?",
                [grupo.id]
              );

              res.status(201).json({
                mensagem: "Sorteio realizado com sucesso!",
                total: participantes.length
              });
            }
          );
        }
      );
    }
  );
};

/**
 * LISTAR PARTICIPANTES
 * (middleware validarOrganizador já rodou)
 */
exports.listarParticipantes = (req, res) => {
  const grupo = req.grupo;

  db.query(
    "SELECT id, nome, email, codigo_pessoal FROM participantes WHERE grupo_id = ?",
    [grupo.id],
    (err, participantes) => {
      if (err) {
        return res.status(500).json({
          erro: "Erro ao buscar participantes."
        });
      }

      res.status(200).json({
        grupo: grupo.nome,
        total: participantes.length,
        participantes
      });
    }
  );
};
