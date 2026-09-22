<!-- doc-historico -->
# ADR-005 — Um namespace KV para tudo: manter como cache/estado, tirar o DINHEIRO para o D1 que já existe

**Dono:** `alpha-architect` (autor do rascunho); custódia em `docs/adr/`: `doc-mantenedor`
**Data:** 21/09/2026 (QA rodada A, frente ARQUITETURA, 2ª passada)
**Estado:** **Proposta (aguarda o dono)** — promovida do rascunho `docs/reviews/2026-09-21-qa-rodada-1/adr-propostas/ADR-005-namespace-kv-unico.md` em 21/09/2026 (QA Rodada 1, pergunta #52 de `docs/PERGUNTAS-DO-DONO.md`); corpo idêntico ao rascunho. Vira **Adotada** só com a resposta do dono ao §"Perguntas"; até lá nada aqui autoriza código. ADR nova nasce em `docs/adr/`, não em `squad-alpha-runs/`
**Verificação:** `git ls-files docs/adr | grep ADR-005` (existe no git) · `diff <(tr -d '\r' < docs/adr/ADR-005-namespace-kv-unico.md) <(tr -d '\r' < docs/reviews/2026-09-21-qa-rodada-1/adr-propostas/ADR-005-namespace-kv-unico.md)` (só o cabeçalho difere; `tr` porque o Windows grava CRLF) · `grep -rlE "kv\(env\)|kvOrThrow\(env\)" functions/api/*.js | grep -v test | wc -l` → 12 arquivos · `grep -rhoE "(const|let) [A-Z_]*PREFIX\w* = ['\"][^'\"]+" functions/api/*.js | sort -u | wc -l` → 9 prefixos declarados (+ o save sem prefixo, `spend:`, `steam:*`, `week_active*`) · `grep -n "env.DB" functions/api/_entitlements.js` → só `claimOrder` · `ls migrations` → `0001_order_claims.sql`, `0002_order_claims_expires_at.sql`
**Não cobre:** `PUSH_SUBSCRIPTIONS` (namespace próprio, dois deploys — é assunto do `pushidx`, relatório 03 §2) · separação física `SOULMON_SAVES`/`DIGIAPP_SAVES` (já feita: `wrangler.jsonc` aponta `SOULMON_SAVES` para `20b3ba78…`, novo e vazio, desde 07/09/2026 — a review 05 §4.1 dizia "mesmo namespace físico"; **não é mais**)
**Precedência:** código > teste > `CLAUDE.md` > manual > esta ADR

---

## Contexto

O que mora hoje em `kv(env)` (`functions/api/_kv.js`), por classe de dado:

| Classe | Chaves | Dono | Propriedade que a KV NÃO dá e o dado precisa |
|---|---|---|---|
| **Estado do jogador** | `<saveId>` (save), `profile:`, `pid:`, `gifts:`, `del:` | `save.js`, `community.js`, `account.js` | nenhuma além de CAS (ADR-004) — é o caso de uso natural da KV |
| **Dinheiro** | `ent:<saveId>` (tier + créditos), `spend:<saveId>:<opId>`, `ord:` (espelho), `steam:own:`/`steam:txn:` | `_entitlements.js`, `_billing.js` | **atomicidade**: `spendCredits` faz `readEntitlement` → `ent.credits -= amount` → `writeEntitlement` — leitura-modificação-escrita sem CAS, em store eventual (~60 s). O `opId` protege contra o MESMO gesto repetido, não contra dois gestos DIFERENTES em paralelo (reroll no celular + troca por Bits no desktop). O próprio arquivo já reconheceu isso para `claimOrder` e o levou para o D1 (`claimOrderAtomic`) |
| **Comunidade** | `rank:<season>:<id>`, `closed:`, `coop:`, `week_active*` | `community.js` | `list` por prefixo (ranking) — a KV lista em páginas de 1000 e o `community.js` já tem laço com teto |
| **Contadores de custo** | `ai:<bucket>:<saveId>:<dia>` + global | `_aiGuard.js` | contador atômico — RMW em KV perde incrementos; hoje isso favorece o USUÁRIO (teto mais frouxo), não o servidor |
| **Cache de IA** | `sprite:img:`, `sprite:blob:<token>` (bytes), `sprite:lock:` | `generate-sprite.js`, `sprite-image.js` | blob binário: KV aceita 25 MB/valor, mas cobra leitura por chave e não faz streaming/CDN — é o caso de uso do R2 |
| **Telemetria** | `m:<dia>` | `metrics.js` | RMW sem CAS — perde incrementos (review 05 D10); aceitável e já declarado |

**O que mudou desde a review 05 (hoje de manhã):** o binding D1 `soulmon-billing` **existe e é usado** por `claimOrderAtomic`; o namespace de saves **já é separado fisicamente** do DigiApp. Portanto o problema não é "tudo num namespace herdado" — é "dinheiro num store sem atomicidade, ao lado de um banco atômico que já está ligado e tem uma tabela só".

**Blast radius medido, não adjetivado:** `account.js` › `handleDeleteConfirm` e `collect` fazem `list` em `profile:` e `rank:` — no MESMO namespace do dinheiro. Um `list` sem prefixo (bug de uma linha) enumera `ent:*`. Um `delete` com prefixo errado apaga créditos pagos. Nenhum guard hoje impede um `kvOrThrow(env).list({})`.

**Restrições que a decisão respeita:** dev solo · R$ 200/mês · "UI antes de infra" · migração D1 é manual (`migrations/README.md`: `wrangler d1 execute … --remote --file`) · 0 pagantes até hoje (ADR-001, confirmado pelo dono) — logo `ent:` tem **zero linhas com dinheiro real** para migrar.

---

## Decisão (proposta)

### D1. A KV continua sendo o store de ESTADO e CACHE. Não se cria um segundo namespace por classe.

Dois namespaces KV são duas cotas, dois bindings e a mesma falta de CAS. Separar namespace não compra a propriedade que falta (atomicidade); compra só isolamento de `list`. Isolamento de `list` se compra mais barato com **regra de código**: `kv(env).list` só via `listPrefix(prefix)` com prefixo obrigatório e não vazio — guard de AST em `functions/api/_kv.contract.test.js` reprovando `.list(` fora de `_kv.js`.

### D2. Dinheiro sai da KV para o D1 — `ent:` vira tabela `entitlements`, `spend:` vira `credit_ledger`

- `entitlements(save_id PK, tier, credits, consumed_orders JSON, order_details JSON, audited_at, ai_lifetime JSON, ad_date, ad_count, account_deleted_at, updated_at, expires_at)`.
- `credit_ledger(save_id, op_id, delta, balance_after, created_at, PRIMARY KEY(save_id, op_id))` — o `opId` que hoje é chave KV vira PK: a repetição do gesto bate em UNIQUE, que é atomicidade de graça.
- `spendCredits` vira `UPDATE entitlements SET credits = credits - ? WHERE save_id = ? AND credits >= ?` + `INSERT credit_ledger` no mesmo `batch()` — o D1 `batch` é transacional. Débito nunca fica negativo por corrida.
- `readEntitlement` lê do D1 quando `env.DB` existe; **cai na KV quando não existe** (preview/teste sem binding), exatamente o padrão que `claimOrder` já usa. Nada quebra em ambiente sem D1.
- A TTL de retenção de 5 anos (`RETENTION_TTL_SECONDS`) vira coluna `expires_at` + varredura no cron do worker de push (que já roda e já tem `wrangler.toml`) — ou fica sem varredura até haver 1 pagante, declarado.
- **Migração:** `0003_entitlements.sql` + `0004_credit_ledger.sql` (`CREATE TABLE IF NOT EXISTS`, como as anteriores). Backfill: script `scripts/kv-ent-para-d1.mjs` lendo `ent:*` por `wrangler kv key list` e inserindo — com 0 pagantes, o backfill é de contas de cortesia e testes. **Ponto de não retorno:** quando `writeEntitlement` deixar de escrever na KV. Até lá, dupla escrita (D1 + KV) e leitura do D1 — reversível trocando um `if`.

### D3. Blobs de sprite (`sprite:blob:`) ficam na KV **até o primeiro pagante** — gatilho para R2 declarado

R2 é a peça certa (binário, CDN, sem cobrança por leitura de chave), mas é binding novo, bucket novo, CORS novo e URL pública nova — e o `sprite-image.js` já serve o blob por rota própria. Sem pagante não há geração de sprite; portanto não há blob. Entra com o primeiro pagante ou com `sprite:blob:*` > 100 chaves, o que vier primeiro.

### D4. Contadores (`ai:`, `m:`) ficam na KV, com a margem de erro escrita

RMW em KV perde incrementos sob concorrência. Para `ai:` isso afrouxa o teto a favor do usuário — aceitável até o custo de IA aparecer no extrato (`alpha-estrategista-negocio` vigia). Para `m:` a review 05 D10 já propôs contar por evento; fica como está e o `REGISTRO-DE-DECISOES.md` §7 ganha a frase "os números do `m:` têm perda sob concorrência".

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| **A. Manter tudo na KV (status quo)** | Zero trabalho; tudo legível por `wrangler kv key get` | `spendCredits` não é atômico; `list` alcança dinheiro; TTL de retenção por escrita | Dinheiro em store eventual é a única classe em que "eventualmente" significa "cobrei duas vezes" ou "dei crédito de graça" |
| **B. Um namespace KV por classe (saves / dinheiro / comunidade / ia)** | Isola `list` e cota; barato de configurar | 4 bindings, 4 ids, `_kv.js` vira roteador; continua sem CAS; migração de chave em 12 arquivos | Compra isolamento, não atomicidade. A propriedade que falta não está no menu da KV |
| **C. Dinheiro para o D1 que já existe — a escolhida** | Atomicidade por `batch`; `opId` como PK; o binding, o padrão de fallback e o fluxo de migração já existem (`claimOrderAtomic`, `migrations/`); 0 linhas reais para migrar | Segundo modelo de dados para operar (SQL); migração manual (`wrangler d1 execute`); `ent:` deixa de ser legível por `kv get` | É o mais barato que resolve o risco declarado, e reutiliza o que o `claimOrder` já pagou |
| **D. Durable Object por conta para o dinheiro** | Serialização total; sem SQL | Peça nova; custo por request; um DO por conta para 10 usuários é overengineering com nome | O D1 já está ligado; um DO seria a segunda peça de atomicidade para o mesmo problema |
| **E. Tudo para o D1 (saves inclusive)** | Um store só; consultas | Save de até 5 MB em SQLite; D1 tem teto de 10 GB/banco e cobra por linha lida; o modelo offline-first do save é chave-valor por natureza | Move o problema do lugar certo (KV) para o errado |
| **F. Supabase/Postgres (já apareceu no `package.json`)** | Banco de verdade, RLS | Terceiro fora do Cloudflare; latência cross-provider por request; o dono já tirou o pacote cliente (#33) | A pegada é Cloudflare; o D1 é o Postgres-pobre que já está pago |

---

## Consequências

**Aceitamos de bom:** débito atômico · `list` nunca alcança dinheiro · retenção por coluna, não por escrita · migração reversível até um `if`.

**Aceitamos de ruim, e fica escrito:**
- **Dois stores para operar** (KV + D1). Já é assim desde `claimOrderAtomic`; esta ADR só move mais 2 funções para o lado que já existe.
- **Migração D1 continua manual.** Quem aperta: o `soulmon-operador` (roster de 21/09), no checklist de deploy — `migrations/README.md`. Sem CI que aplique (review 05 §4). Aceito até o primeiro pagante.
- **`readEntitlement` em todo `GET /api/save` passa a custar 1 leitura D1** (~US$ 0,001/1k linhas lidas). Em 10 usuários × 20 aberturas/dia = 200 leituras/dia. Zero no extrato.
- **Custo de infra: R$ 0/mês** no free tier do D1 (5 GB, 5 M linhas lidas/dia). O que dobra o custo não é usuário — continua sendo geração de imagem.
- **Blast radius residual:** `profile:`/`rank:`/`gifts:` continuam ao lado do save. É estado do jogador, recuperável do próprio jogador ou do ranking; aceitável.

**Gargalo nomeado:** D1 aceita ~1 escrita transacional por vez por banco (SQLite single-writer). 10 usuários gastando crédito = dezenas de escritas/dia. Vira gargalo em **milhares de débitos/minuto** — horizonte que 10 usuários PWA não alcançam.

---

## O que reverteria esta decisão

- **D1 indisponível em > 0,1 % dos requests** (log de `env.DB` lançando) ⇒ volta a KV como leitura primária, D1 como ledger de auditoria.
- **Preço do D1 sair do free tier antes de 100 pagantes** ⇒ revisar; a alternativa D (DO) volta à mesa.
- **O dono decidir vender pelo Steam com Microtransactions** (ADR-001 §7.3) ⇒ um segundo provedor de recibo é motivo para a tabela `order_claims` ganhar `provider` — reforça esta ADR, não a reverte.
- **Nunca haver pagante em 12 meses** ⇒ esta ADR fica em `proposta` sem custo; não se executa D2 para zero linhas.

---

## Perguntas endereçadas ao dono

| | Pergunta | Impacto |
|---|---|---|
| 🟠 | Executar D2 **antes do primeiro pagante** (custo ≈ 1 dia, 0 linhas reais para migrar) ou **no primeiro pagante** (custo igual, mas com dinheiro de verdade dentro)? | Recomendação: antes — é a única janela em que errar a migração não custa reembolso |
| 🟡 | Quem aplica `wrangler d1 execute` em produção: o dono ou o `soulmon-operador` com token de escopo D1? | Sem resposta, a migração fica no README e não acontece (padrão do worker de push) |

## Handoffs

→ **`alpha-backend`**: `0003`/`0004` em `migrations/`; `readEntitlement`/`writeEntitlement`/`spendCredits` com ramo D1 e fallback KV; guard `_kv.contract.test.js` (`.list(` só em `_kv.js`, prefixo obrigatório).
→ **`alpha-security`**: revisar que `ENTITLEMENTS_ADMIN_KEY` (`grantCourtesy`) continua fail-closed no ramo D1.
→ **`alpha-qa`**: dois `spendCredits` paralelos com saldo para um só ⇒ exatamente um 200; `opId` repetido ⇒ mesmo resultado sem débito; ambiente sem `env.DB` ⇒ caminho KV intacto.
→ **`alpha-estrategista-negocio`**: custo desta ADR = R$ 0/mês; o gatilho R2 (D3) é o primeiro pagante.
→ **Gate:** `alpha-skeptic`.
