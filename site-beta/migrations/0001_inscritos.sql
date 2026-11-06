-- Cadastro do beta. Reversivel: ver scripts/sql/0001_inscritos.down.sql (fora de migrations/, o wrangler nunca aplica).
CREATE TABLE IF NOT EXISTS inscritos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  chave TEXT NOT NULL UNIQUE,            -- HMAC(sal, e-mail normalizado)
  idioma TEXT NOT NULL CHECK (idioma IN ('pt-BR','en')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  politica_versao TEXT NOT NULL,
  aceite_em TEXT NOT NULL,
  novidades INTEGER NOT NULL DEFAULT 0,
  leva INTEGER,
  convidado_em TEXT,
  instalou_em TEXT,
  optin_em TEXT,      -- entrada no teste fechado (relogio da Play)
  ativo_ate TEXT,     -- ultimo dia com jogo aberto (marcado a mao)
  removido_em TEXT,
  criado_dia TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inscritos_dia ON inscritos(criado_dia);
CREATE INDEX IF NOT EXISTS idx_inscritos_convidado ON inscritos(convidado_em);

-- Limite por HMAC(ip, sal+dia). Linhas de dias anteriores sao apagadas a cada requisicao.
CREATE TABLE IF NOT EXISTS limite_ip (
  chave TEXT PRIMARY KEY,
  dia TEXT NOT NULL,
  n INTEGER NOT NULL
);

-- Teto diario de notificacoes por e-mail.
CREATE TABLE IF NOT EXISTS notificacoes (
  dia TEXT PRIMARY KEY,
  n INTEGER NOT NULL
);
