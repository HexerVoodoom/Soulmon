-- Cadastro e so para o beta (sem novidades) e a remocao e DELETE real (sem removido_em).
-- Nenhum indice depende destas colunas. Dados das demais colunas ficam intactos.
-- Reverter a mao: ALTER TABLE inscritos ADD COLUMN novidades INTEGER NOT NULL DEFAULT 0; ALTER TABLE inscritos ADD COLUMN removido_em TEXT;
ALTER TABLE inscritos DROP COLUMN novidades;
ALTER TABLE inscritos DROP COLUMN removido_em;
