-- Contagem agregada de conversao (PLANO §15). Sem e-mail, IP, token ou qualquer identificador.
-- Reverter a mao: DROP TABLE IF EXISTS conversao;  (sem arquivo .down aqui: o wrangler aplicaria todo .sql da pasta)
CREATE TABLE IF NOT EXISTS conversao (
  dia TEXT NOT NULL,
  evento TEXT NOT NULL CHECK (evento IN ('form_success','form_error')),
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, evento)
);
