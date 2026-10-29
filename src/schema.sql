-- Esquema do banco (idempotente: pode rodar a cada inicialização)

CREATE TABLE IF NOT EXISTS usuarios (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(150) NOT NULL,
  email     VARCHAR(150) NOT NULL,
  telefone  VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS autores (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  nacionalidade  VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS categorias (
  id    SERIAL PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS livros (
  id                    SERIAL PRIMARY KEY,
  titulo                VARCHAR(200) NOT NULL,
  isbn                  VARCHAR(30),
  ano_publicacao        INTEGER,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_disponivel >= 0),
  categoria_id          INTEGER REFERENCES categorias (id)
);

-- Muitos-para-muitos: um livro tem 1 ou mais autores
CREATE TABLE IF NOT EXISTS livro_autor (
  livro_id  INTEGER NOT NULL REFERENCES livros (id) ON DELETE CASCADE,
  autor_id  INTEGER NOT NULL REFERENCES autores (id),
  PRIMARY KEY (livro_id, autor_id)
);

CREATE TABLE IF NOT EXISTS emprestimos (
  id                       SERIAL PRIMARY KEY,
  usuario_id               INTEGER NOT NULL REFERENCES usuarios (id),
  livro_id                 INTEGER NOT NULL REFERENCES livros (id),
  data_emprestimo          TIMESTAMPTZ NOT NULL,
  data_prevista_devolucao  TIMESTAMPTZ NOT NULL,
  data_devolucao           TIMESTAMPTZ,
  status                   VARCHAR(20) NOT NULL CHECK (status IN ('ATIVO', 'DEVOLVIDO', 'ATRASADO'))
);

-- ===== Dados de exemplo (só entram se a tabela estiver vazia) =====
INSERT INTO usuarios (id, nome, email, telefone)
SELECT * FROM (VALUES
  (1, 'Ana Souza',   'ana@email.com',   '(19) 99999-1111'),
  (2, 'Bruno Lima',  'bruno@email.com', '(19) 99999-2222')
) AS v WHERE NOT EXISTS (SELECT 1 FROM usuarios);

INSERT INTO autores (id, nome, nacionalidade)
SELECT * FROM (VALUES
  (1, 'Machado de Assis',  'Brasileira'),
  (2, 'Robert C. Martin',  'Americana'),
  (3, 'Erich Gamma',       'Suíça'),
  (4, 'Richard Helm',      'Australiana')
) AS v WHERE NOT EXISTS (SELECT 1 FROM autores);

INSERT INTO categorias (id, nome)
SELECT * FROM (VALUES
  (1, 'Literatura Brasileira'),
  (2, 'Programação')
) AS v WHERE NOT EXISTS (SELECT 1 FROM categorias);

INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_disponivel, categoria_id)
SELECT * FROM (VALUES
  (1, 'Dom Casmurro',    '978-8535910663', 1899, 3, 1),
  (2, 'Clean Code',      '978-0132350884', 2008, 2, 2),
  (3, 'Design Patterns', '978-0201633610', 1994, 1, 2)
) AS v WHERE NOT EXISTS (SELECT 1 FROM livros);

INSERT INTO livro_autor (livro_id, autor_id)
SELECT * FROM (VALUES (1, 1), (2, 2), (3, 3), (3, 4)) AS v
WHERE NOT EXISTS (SELECT 1 FROM livro_autor);

-- Um empréstimo já vencido, para testar /emprestimos/atrasados
INSERT INTO emprestimos (id, usuario_id, livro_id, data_emprestimo, data_prevista_devolucao, status)
SELECT * FROM (VALUES
  (1, 2, 1, '2026-10-01'::timestamptz, '2026-10-08'::timestamptz, 'ATIVO')
) AS v WHERE NOT EXISTS (SELECT 1 FROM emprestimos);

-- ===== Autenticação =====
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) NOT NULL DEFAULT 'LEITOR'
  CHECK (perfil IN ('BIBLIOTECARIO', 'LEITOR'));
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_uq ON usuarios (lower(email));

-- Usuário de exemplo com perfil de bibliotecário (senha definida em db.init)
UPDATE usuarios SET perfil = 'BIBLIOTECARIO' WHERE email = 'ana@email.com' AND senha_hash IS NULL;

-- Alinha as sequences com os ids inseridos manualmente
SELECT setval(pg_get_serial_sequence('usuarios', 'id'),    GREATEST((SELECT MAX(id) FROM usuarios), 1));
SELECT setval(pg_get_serial_sequence('autores', 'id'),     GREATEST((SELECT MAX(id) FROM autores), 1));
SELECT setval(pg_get_serial_sequence('categorias', 'id'),  GREATEST((SELECT MAX(id) FROM categorias), 1));
SELECT setval(pg_get_serial_sequence('livros', 'id'),      GREATEST((SELECT MAX(id) FROM livros), 1));
SELECT setval(pg_get_serial_sequence('emprestimos', 'id'), GREATEST((SELECT MAX(id) FROM emprestimos), 1));
