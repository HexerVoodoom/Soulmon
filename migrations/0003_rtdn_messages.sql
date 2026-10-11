-- 0003 — rtdn_messages: idempotência das notificações da Play (Pub/Sub push).
--
-- A assinatura cosmética (docs/ASSINATURA-SPEC.md) recebe avisos em tempo real
-- (RTDN) em `POST /api/rtdn`. O Pub/Sub entrega "pelo menos uma vez" e reentrega
-- por até 7 dias se não receber 2xx, então a mesma `messageId` chega mais de uma
-- vez. A mensagem NUNCA é confiada (o servidor sempre reconsulta a Google), então
-- processar duas vezes seria inofensivo — mas custa uma chamada à quota da Play
-- por reentrega. Esta tabela evita o gasto: `messageId` é PRIMARY KEY.
--
-- ## Linhas existentes
-- Nenhuma: a tabela é nova (`IF NOT EXISTS` — reaplicar é no-op). `order_claims`
-- NÃO muda: a cadeia da assinatura reutiliza a tabela como está, com a chave
-- `play:sub:<sha256 da raiz da cadeia linkedPurchaseToken>` no `order_id`.
--
-- ## Prazo
-- Cada linha carrega o próprio vencimento (`expires_at`, 8 dias = a janela de
-- reentrega do Pub/Sub + folga) e `rtdnMarkSeen` apaga o que venceu. Mesmo
-- desenho de `order_claims.expires_at` (0002): sem cron.
--
-- ## Reverter (ponto de não retorno: nenhum)
-- DROP TABLE IF EXISTS rtdn_messages;
-- Sem a tabela o RTDN continua correto (só reprocessa reentregas); o código usa
-- o KV quando o binding D1 não existe.

CREATE TABLE IF NOT EXISTS rtdn_messages (
  message_id  TEXT PRIMARY KEY,
  received_at INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
