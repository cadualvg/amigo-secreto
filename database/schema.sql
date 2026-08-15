-- ============================================
--  Amigo Secreto — schema do banco (MySQL)
--  Reconstruído a partir das queries em src/
-- ============================================

CREATE TABLE IF NOT EXISTS grupos (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  codigo                    VARCHAR(12)  NOT NULL,
  codigo_organizador        VARCHAR(12)  NOT NULL,
  nome                      VARCHAR(120) NOT NULL,
  descricao                 TEXT         NULL,
  quantidade_maxima_pessoas INT          NOT NULL,
  valor_presente            DECIMAL(10,2) NULL,
  data_evento               DATE         NULL,
  travado                   TINYINT(1)   NOT NULL DEFAULT 0,
  sorteado                  TINYINT(1)   NOT NULL DEFAULT 0,
  criado_em                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_grupos_codigo (codigo),
  KEY idx_grupos_codigo_organizador (codigo_organizador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS participantes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id       INT          NOT NULL,
  nome           VARCHAR(120) NOT NULL,
  email          VARCHAR(160) NULL,
  codigo_pessoal VARCHAR(12)  NOT NULL,
  criado_em      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participantes_grupo
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
  UNIQUE KEY uk_participantes_email_grupo (grupo_id, email),
  KEY idx_participantes_codigo_pessoal (codigo_pessoal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sorteios (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id          INT       NOT NULL,
  participante_id   INT       NOT NULL,
  amigo_sorteado_id INT       NOT NULL,
  criado_em         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sorteios_grupo
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
  CONSTRAINT fk_sorteios_participante
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_sorteios_amigo
    FOREIGN KEY (amigo_sorteado_id) REFERENCES participantes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_sorteios_participante (participante_id),
  KEY idx_sorteios_grupo (grupo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
