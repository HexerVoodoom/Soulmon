-- 0002 — o recibo no D1 também ganha prazo.
--
-- O dono decidiu reter `ent:` e `ord:` por 5 anos (item 3.1 do GUIA-DO-DONO; o
-- raciocínio inteiro está no cabeçalho de `RETENTION_TTL_SECONDS` em
-- `functions/api/_entitlements.js`). No KV isso é TTL de chave. Aqui não existe
-- TTL: banco não apaga linha sozinho. A linha passa a carregar o próprio
-- vencimento, e `claimOrderAtomic` apaga o que venceu ao passar por ali.
--
-- ## O que acontece com as linhas que já existem
--
-- O `ADD COLUMN` do SQLite não reescreve a tabela: ele só registra a coluna, e
-- toda linha existente passa a LER `NULL` nela. Ninguém fica bloqueado, nada é
-- apagado, e a migração roda em tempo constante mesmo com a tabela cheia.
--
-- O `UPDATE` seguinte dá prazo a essas linhas contando de `claimed_at` — a
-- única marca de vida que elas têm. Consequência declarada: uma linha
-- reivindicada há mais de 5 anos nasce JÁ VENCIDA e morre na primeira vez que
-- alguém tocar naquele recibo. É o resultado correto (cinco anos de silêncio
-- absoluto é exatamente o que o prazo mede), mas é uma exclusão de dado, e por
-- isso está escrita aqui em vez de acontecer de surpresa.
--
-- 157680000000 = 5 * 365 * 24 * 60 * 60 * 1000 ms. O literal existe aqui porque
-- SQL não importa constante de JavaScript; a régua viva é
-- `RETENTION_TTL_SECONDS`, e o teste de `_entitlements.d1Retencao.test.js`
-- afere que o código grava a partir DELA. Se a decisão mudar, muda-se lá e
-- escreve-se uma migração nova — esta já rodou e não volta atrás.
--
-- ## Reaplicar
--
-- O `ADD COLUMN` falha com "duplicate column name" se a coluna já existe. Isso
-- é proposital: SQLite não tem `ADD COLUMN IF NOT EXISTS`, e falhar alto é
-- melhor do que fingir sucesso. Rode cada migração uma vez, na ordem.

ALTER TABLE order_claims ADD COLUMN expires_at INTEGER;

UPDATE order_claims
   SET expires_at = claimed_at + 157680000000
 WHERE expires_at IS NULL;
