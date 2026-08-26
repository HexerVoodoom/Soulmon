-- 0001 — order_claims: um recibo, uma conta.
--
-- Esta migração é o RESGATE de um schema que já existia em produção sem estar
-- versionado: até aqui a tabela só existia como um bloco de SQL no meio de
-- `docs/BILLING-SETUP.md`, para ser colado à mão em `wrangler d1 execute`. Não
-- havia como saber, olhando o repositório, qual era a forma real do banco.
--
-- Por isso o `IF NOT EXISTS`: em qualquer banco que já rodou o SQL da doc, esta
-- migração é NO-OP e não toca uma linha. Num banco novo, ela cria a tabela
-- idêntica ao que a doc mandava criar. Os dois convergem para o mesmo estado.
--
-- A restrição que importa é `order_id` como PRIMARY KEY: ela é a própria
-- disputa. O `INSERT` de `claimOrderAtomic` falha se outra conta chegou
-- primeiro, e o banco — não o código — resolve a corrida.

CREATE TABLE IF NOT EXISTS order_claims (
  order_id   TEXT PRIMARY KEY,
  save_id    TEXT NOT NULL,
  claimed_at INTEGER NOT NULL
);
