# Referência — functions/api e workers

> **Dono:** doc-redator-referencia · **Data:** 20/09/2026 · **Estado:** verificado em 21/09/2026 por doc-verificador (mecânico completo)
> **Verificação:** `npx tsc -p tsconfig.server.json --noEmit && npx vitest run functions/api workers` — cada rota e cada `_*.js` foi lido no corpo, não só no comentário de cabeçalho.
> **Não cobre:** regra de negócio em profundidade (→ `02-REGRAS-DE-NEGOCIO.md`), o schema D1/KV completo (→ `07-DADOS-E-SAVE.md`), como fazer deploy do worker (→ `08-INTEGRACOES-E-DEPLOY.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

## Índice
- [Rotas HTTP (functions/api/*.js exportando onRequest*)](#rotas-http)
  - [`account.js`](#functionsapiaccountjs) · [`billing.js`](#functionsapibillingjs) · [`chat.js`](#functionsapichatjs) · [`community.js`](#functionsapicommunityjs) · [`config.js`](#functionsapiconfigjs) · [`entitlements.js`](#functionsapientitlementsjs) · [`fcm-subscribe.js`](#functionsapifcm-subscribejs) · [`generate-sprite.js`](#functionsapigenerate-spritejs) · [`metrics.js`](#functionsapimetricsjs) · [`save.js`](#functionsapisavejs) · [`sprite-image.js`](#functionsapisprite-imagejs) · [`subscribe.js`](#functionsapisubscribejs) · [`suggest-tasks.js`](#functionsapisuggest-tasksjs) · [`transcribe.js`](#functionsapitranscribejs)
- [Módulos internos (`_*.js`)](#módulos-internos)
  - [`_aiGuard.js`](#functionsapi_aiguardjs) · [`_auth.js`](#functionsapi_authjs) · [`_billing.js`](#functionsapi_billingjs) · [`_bond.js`](#functionsapi_bondjs) · [`_entitlements.js`](#functionsapi_entitlementsjs) · [`_kv.js`](#functionsapi_kvjs) · [`_pushCopy.js`](#functionsapi_pushcopyjs) · [`_pushIdentity.js`](#functionsapi_pushidentityjs) · [`_pushTargets.js`](#functionsapi_pushtargetsjs) · [`_rateLimit.js`](#functionsapi_ratelimitjs) · [`_redact.js`](#functionsapi_redactjs)
- [workers](#workers) — [`fcm.js`](#workersfcmjs) · [`push-scheduler.js`](#workerspush-schedulerjs) · [`webpush.js`](#workerswebpushjs)

## Convenções desta página

**Auth** cita o que `_auth.js`/`_entitlements.js` exigem: `authorizeSaveAccess` é **fail-open** sem `FIREBASE_PROJECT_ID` (aceita qualquer chamada — proteção migratória); `requireVerifiedOwner`/`requirePaidTier` são **fail-closed** (sem a variável, 503 — nunca abrem). **Rate limit** cita o bucket de `_rateLimit.js` (memória do isolate, amortecedor de CUSTO, não trava de segurança — ver o cabeçalho do próprio arquivo). **KV** cita o namespace: a maioria usa `kv(env)` (`SOULMON_SAVES`/`DIGIAPP_SAVES`, resolvido por `_kv.js`); `subscribe.js`/`fcm-subscribe.js`/`push-scheduler.js` usam `env.PUSH_SUBSCRIPTIONS`, um namespace **diferente**.

---

## Rotas HTTP

### `functions/api/account.js`
**Rota:** `/api/account` · **Métodos:** `OPTIONS`, `GET`, `POST` (via `onRequest` genérico — inventário lista `[Options, ANY]`).
**Dono de:** exportação (`action=export`) e exclusão (`action=delete-request` + `action=delete-confirm`) dos dados do titular guardados no servidor.
**Auth:** `requireVerifiedOwner` (`_auth.js`) — **FAIL-CLOSED**, diferente do resto do app. Sem `FIREBASE_PROJECT_ID`, as duas ações respondem **503 `auth-unavailable`** em vez de abrir (comentário: "indisponível é melhor que perigosa" — o `saveId` é SHA-256 de e-mail por algoritmo público, então fail-open aqui seria "apague a conta de qualquer um cujo e-mail eu conheça").
**Rate limit:** nenhum próprio (a rota é rara por natureza — exportar/excluir conta).
**Grava/lê:** `kv(env)` — lê `<saveId>` (save), `profile:<saveId>`, `pid:<pid>`, `gifts:<saveId>`, `ent:<saveId>`, `rank:<season>:<saveId>` (via varredura `rank:` limitada a `MAX_SCAN_PAGES=20`); na exclusão, APAGA save/profile/pid/gifts/ranks, MINIMIZA o entitlement (remove uso — `aiLifetime`/`adDate`/`adCount` — mantém tier/créditos/`consumedOrders`/`orderDetails`), e limpa menções ao `saveId` em `friends[]` de outros perfis (varredura limitada de `profile:`). `ord:<orderId>` (comprovante de compra) e as inscrições de push (`push:*`/`fcm:*`, namespace diferente) NÃO são tocados — declarado na resposta em `naoIncluido`.
**Erros:** `400 Invalid save ID` · `500 storage-not-bound` · `{401|403|503} auth-unavailable|unauthenticated|forbidden` (de `requireVerifiedOwner`) · `409 confirmation-required` (delete-confirm sem token válido, ou expirado após 15 min) · `400 Unknown action`.
**Régua:** `functions/api/account.test.js`.
**Chamado por:** cliente web (fluxo de conta — não localizado neste levantamento como tendo UI própria ainda; a rota existe e é testada).

### `functions/api/billing.js`
**Rota:** `/api/billing` · **Métodos:** `OPTIONS`, `POST`.
**Dono de:** verificação de compra no SERVIDOR, para as duas lojas (Play e Steam), numa rota única — pergunta à PRÓPRIA loja se o comprovante existe e está pago antes de conceder benefício.
**Auth:** `authorizeSaveAccess` (fail-open sem `FIREBASE_PROJECT_ID`) — impede creditar a compra numa conta que não é a de quem está comprando.
**Rate limit:** nenhum próprio nesta rota (o custo caro está em `_billing.js`, que fala com Play/Steam).
**Grava/lê:** `kv` via `_entitlements.js` (`applyVerifiedPurchase`, `claimOrder` — `ord:<orderId>` amarra o comprovante a UMA conta, `ent:<saveId>` recebe `tier`/`credits`). Não lê/escreve save do jogo.
**Erros:** `400 Unknown action|Unknown provider|Invalid save ID` · `500 Storage not bound` · `{401|403} unauthenticated|forbidden` · `503 billing-not-configured|billing-misconfigured` · `502 steam-unreachable|verification-failed` · `400 unknown-product|missing-token|unsupported-transaction` · `409 order-in-use` (comprovante já resgatado por outra conta) · `403 account-mismatch` · default `402` (a loja não confirmou o pagamento).
**Régua:** `functions/api/billing.test.js`, `billing.play.test.js`, `_billing.test.js`, `_billing.steamRefund.test.js`.
**Chamado por:** fluxo de loja do cliente (Android IAB / Steam).

### `functions/api/chat.js`
**Rota:** `/api/chat` · **Métodos:** `OPTIONS`, `POST`.
**Dono de:** conversa do jogador com o pet — prompt de sistema montado por branch/humor/maturidade/`aiSettings`, memória de sessão (3 trocas), contexto numérico allowlisted, e as defesas contra prompt injection do bloco `customKeywords`.
**Auth:** nenhuma própria — o portão é `guardAiRequest` (bucket `chat`, chama `authorizeSaveAccess` por dentro).
**Rate limit:** cota de IA via `_aiGuard.js` (`AI_LIMITS.chat = { perAccount: 120, global: 20000 }`, por dia); não usa `_rateLimit.js` diretamente.
**Grava/lê:** `kv` via `_aiGuard.js` (contadores `ai:chat:*`); nenhuma escrita de conversa (a memória é da sessão do cliente, nunca persiste no servidor).
**Erros:** `400 Message required` · `500 AI not configured` (sem `GROQ_API_KEY`) · `{status} {reason}` de `guardAiRequest` (429 `ai-daily-limit`, 503 `ai-daily-budget-reached`, etc.) · `500 AI service error` (Groq não respondeu OK — a cota é DEVOLVIDA via `gate.release`) · `500 Internal error`.
**Régua:** `functions/api/chat.memoria.test.js`, `chat.promptInjection.test.js`, `costCeiling.test.js`.
**Chamado por:** `src/components/ChatBox.tsx` (a maior superfície de texto livre do produto).

### `functions/api/community.js` (1045 linhas — corrigido de "1046" por doc-verificador, `wc -l`, 10/09/2026)
**Rota:** `/api/community` · **Métodos:** `OPTIONS`, `GET`/`POST` roteados por `?action=` (inventário lista `[Options, ANY]`).
**Dono de:** perfis públicos, Tournament (PvP assíncrono), Biblioteca (diretório + amigos + presentes) e o modo Cooperativo (Fase 4.3). Ações: `profile` (POST), `players`/`player`/`opponents` (GET), `match` (POST), `rank`/`seasonResult` (GET), `closeSeason` (POST, admin), `trophies` (GET), `friends` (POST, até 5), `gift`/`gifts` (POST/GET, 20 bits, 1×/dia por amigo), `coopCreate`/`coopJoin`/`coop`/`coopCheckin`/`coopLeave`.
**Auth:** `authorizeSaveAccess` nas 6 ações que exigem dono (ver comentário do CORS); `id` de entrada é sempre o saveId do PRÓPRIO dono — alvos de outra pessoa chegam como `pid` público, resolvido pelo índice `pid:<pid>`. `closeSeason` usa `SEASON_ADMIN_KEY` (segredo próprio, fora de `_auth.js`).
**Rate limit:** `_rateLimit.js` com dois baldes — `HEAVY_LIMIT` (20/min/IP) para `players`/`opponents`/`rank`/`seasonResult` (varrem até 300 chaves de KV) e `LIGHT_LIMIT` (120/min/IP) para o resto. Acerto de cache de borda (`caches.default`, TTL 60s, só nas ações `CACHEABLE_ACTIONS = {players, rank, seasonResult}`) conta como o balde leve, não o pesado.
**Grava/lê:** `kv(env)` — prefixos `profile:<saveId>`, `pid:<pid>` (índice reverso), `rank:<season>:<saveId>`, `gifts:<saveId>`, mais `coop:<groupId>`/`coop:checkins:...` (grupo cooperativo). Nenhuma resposta pública devolve `saveId` (há teste travando).
**Erros:** `429` (rate limit, com `Retry-After`) além dos erros específicos de cada ação (não listados individualmente aqui — ver o corpo do arquivo por ação).
**Régua:** `functions/api/community.test.js`, `community.coop.test.js`, `community.directoryConsent.test.js`, `community.playerOracle.test.js`, `community.pvpGate.test.js`, `bond.parity.test.js`.
**Avisos do arquivo:** o check-in cooperativo é uma AFIRMAÇÃO do cliente ("cumpri minha meta hoje"), não verificação do servidor — recalcular `dailyGoalFor` no servidor seria o footgun 9. O que sai da resposta do grupo é só um booleano por membro ("apareceu hoje") e o progresso agregado — NUNCA quanto cada um contribuiu (item 4.2 do `PLANO-EVOLUCAO.md`: 31,3% relatam efeito psicológico negativo de comparação).

### `functions/api/config.js`
**Rota:** `/api/config` · **Métodos:** `OPTIONS`, `GET`.
**Dono de:** configuração PÚBLICA do servidor — hoje só `authRequired` (o app de desktop precisa saber se deve exigir login) e `transcribeAvailable` (o cliente usa para NÃO desenhar o botão de microfone quando a rota de voz não teria como funcionar).
**Auth:** nenhuma — rota pública, cacheável (`Cache-Control: public, max-age=300`).
**Rate limit:** nenhum.
**Grava/lê:** nada — só lê `env.FIREBASE_PROJECT_ID`/`env.SUPABASE_PROJECT_ID`/`env.SUPABASE_ANON_KEY`.
**Erros:** nenhum caminho de erro (sempre 200).
**Régua:** `functions/api/config.test.js`.
**Chamado por:** `desktop/renderer/src/cloudSync.ts` (`isAuthRequired`), e o cliente web para decidir se desenha o microfone do chat.

### `functions/api/entitlements.js`
**Rota:** `/api/entitlements` · **Métodos:** `OPTIONS`, `GET`, `POST`.
**Dono de:** leitura de tier/créditos (`GET`) e gasto (`POST action=spend`) ou recompensa por anúncio (`POST action=ad`, desligado por padrão — só liga com `ADMOB_SSV_ENABLED==='true'`, porque sem Server-Side Verification do AdMob a rota seria farmável com `curl`).
**Auth:** `authorizeSaveAccess` nas duas ações POST e no GET.
**Rate limit:** nenhum próprio (o custo está no KV, não em rede externa).
**Grava/lê:** `kv` via `_entitlements.js` (`ent:<saveId>`); o GET também roda `auditRefunds` (no máximo 1×/dia por conta) contra `isPlayPurchaseVoided`/`isSteamPurchaseVoided`/`isSteamOwnershipVoided` de `_billing.js`.
**Erros:** `400 Invalid save ID` · `500 Storage not bound` · `{401|403} unauthenticated|forbidden` · `402 insufficient` (spend sem saldo) · `501 ads-not-configured` · `429 daily-cap` (recompensa de anúncio, teto `AD_DAILY_CAP=3`).
**Régua:** `functions/api/entitlements.test.js`, `_entitlements.test.js`, `_entitlements.ttl.test.js`, `_entitlements.d1Retencao.test.js`.
**Chamado por:** `desktop/renderer/src/cloudSync.ts` (`fetchWallet`), cliente web (loja/carteira).

### `functions/api/fcm-subscribe.js`
**Rota:** `/api/fcm-subscribe` · **Métodos:** `OPTIONS`, `POST`, `DELETE`.
**Dono de:** registro/remoção de token FCM (push nativo Android — a WebView do Capacitor não tem Web Push).
**Auth:** nenhuma (rota anônima) — a defesa de custo é o rate limit.
**Rate limit:** `_rateLimit.js`, bucket `fcm-subscribe`, `LIMITE_INSCRICAO` de `_pushIdentity.js` (`{limit:10, windowMs:60_000}`) — compartilha o NÚMERO com `subscribe.js`, cada canal com balde próprio.
**Grava/lê:** `env.PUSH_SUBSCRIPTIONS` (namespace diferente de `kv(env)`) — chave `fcm:<hash do token>`, TTL de 1 ano, escreve só quando o registro mudou (`gravarSeMudou`).
**Erros:** `400 Invalid JSON|Missing token|Invalid token` · `429` (rate limit).
**Régua:** `functions/api/fcm-subscribe.test.js`.
**Chamado por:** `src/utils/notifications.ts` (`registerForPushNotifications`, via `@capacitor/push-notifications`), só no Android nativo.
**Avisos do arquivo:** até 09/09/2026 era cópia parada da irmã (`subscribe.js`) — sem teto de apelido, sem validação de chave, sem rate limit; hoje compartilha `_pushIdentity.js`.

### `functions/api/generate-sprite.js` (557 linhas — corrigido de "558" por doc-verificador, `wc -l`, 10/09/2026)
**Rota:** `/api/generate-sprite` · **Métodos:** `OPTIONS`, `POST`.
**Dono de:** gerar 1 sprite de Soulmon — provedor primário Higgsfield (Soul, com referência de imagem para cadeia de evolução), fallback Gemini (texto puro) se o Higgsfield recusar por política de conteúdo. Republica SEMPRE em `/api/sprite-image?k=...` (nunca devolve `data:` nem URL de outro domínio) e faz dedupe multi-device por resultado (sem TTL) e por requisição em voo (`inflight`, TTL curto).
**Auth:** `requirePaidTier` (fail-closed sem `_entitlements.js` configurado) + `authorizeSaveAccess`.
**Rate limit:** cota de IA via `_aiGuard.js` (`AI_LIMITS.sprite = { perAccount:6, perAccountLifetime:26, perFormLifetime:3, globalMonth:800 }`).
**Grava/lê:** `kv` — blob da imagem em `sprite:blob:<token>` (via `guardarBlob`/`republicar`), chave de dedupe de resultado, e os contadores de `_aiGuard.js`/`ent:<saveId>` (`aiLifetime`/`aiForms`).
**Erros (contrato completo, tabela no cabeçalho do arquivo):** `400` (`prompt required`/`invalid-form-id`/`missing-save-id`) · `401 unauthenticated` · `402` (`paid-tier-required` ou `sprite-lifetime-cap`, este último com `message` PT/EN) · `403 forbidden` · `409 sprite-form-cap` (só a forma esgotou, as outras 10 seguem) · `429 ai-daily-limit` · `503` (`ai-monthly-budget-reached`/`ai-daily-budget-reached`/`ai-quota-unavailable`/`tier-unavailable`/sem config) · `500 internal error` · `200 {image, provider?, cached?}` · `202 {pending:true, retryAfter:20}`.
**Régua:** `functions/api/generate-sprite.cap.test.js`, `.dedupe.test.js`, `.release.test.js`, `.tier.test.js`, `aiRoutes.release.test.js`.
**Chamado por:** `src/utils/spriteGen.ts` (`requestSprite`), acionado por `src/hooks/useSpriteGeneration.ts` e pela `OraclePage`.

### `functions/api/metrics.js` (749 linhas — corrigido de "750" por doc-verificador, `wc -l`, 10/09/2026)
**Rota:** `/api/metrics` · **Métodos:** `OPTIONS`, `GET` (leitura administrativa), `POST` (ingestão de lote) — via `onRequestGet` + `onRequest` genérico (inventário lista `[Options, Get, ANY]`).
**Dono de:** telemetria agregada por DIA — nunca por usuário, nunca com identidade. `POST` recebe um lote (`sanitizeBatch`, allowlist `EVENT_SCHEMA`, até `MAX_EVENTS=100` eventos, corpo até `MAX_BODY_BYTES=16KB`), soma em `applyAggregate` e grava um agregado por dia (`m:<dia>`). `GET` lê uma janela de dias (`dayRange`, teto `MAX_READ_DAYS=92`) e soma (`mergeTotals`), incluindo `summarizeNorthStar`.
**Auth:** `POST` não exige — `batch.id` é validado só em formato e DESCARTADO (nunca vira chave nem log). `GET` exige `X-Metrics-Key` == `env.METRICS_ADMIN_KEY`, comparado em tempo constante; sem a variável configurada, a rota responde **404** (não 401, para não confirmar que existe).
**Rate limit:** `_rateLimit.js`, bucket `metrics` (POST) e `metrics-read` (GET).
**Grava/lê:** `kv(env)`, chave `m:<YYYY-MM-DD>` — um contador por dia, somado de TODOS os usuários; nunca uma chave por usuário.
**Erros:** `400 Invalid range` (GET, com `max_days`) · `404` (GET sem `METRICS_ADMIN_KEY`) · `401 Unauthorized` (chave errada) · `503 Unavailable` (sem KV) · `400`/`413`/outros no POST conforme `sanitizeBatch`.
**Régua:** `functions/api/metrics.test.js`.
**Avisos do arquivo:** o agregado NÃO permite calcular retenção D1/D7/D30 nem conversão em N dias — não é limitação acidental, é a FORMA do dado (não existe dia de instalação nem identidade guardada); a resposta do GET declara isso em `notes.unreadable`.

### `functions/api/save.js`
**Rota:** `/api/save` · **Métodos:** `OPTIONS`, `GET`, `POST` (via `onRequest` genérico — inventário lista `[Options, ANY]`).
**Dono de:** cloud save do `GameState` inteiro. `saveId` vem de `?id=` (contrato canônico) ou `body.id` (retrocompat do overlay desktop/APKs antigos — recusa se os dois vierem e divergirem).
**Auth:** `authorizeSaveAccess` (fail-open sem `FIREBASE_PROJECT_ID`).
**Rate limit:** nenhum próprio.
**Grava/lê:** `kv(env)` — chave `<saveId>` = o save inteiro (serializado, teto `MAX_STATE_BYTES=5MB`). Campos `accountTier`/`credits` (`SERVER_OWNED_FIELDS`) são REMOVIDOS do que o cliente manda e sobrepostos com a verdade de `_entitlements.js` na leitura. TTL de 1 ano (`SAVE_TTL_SECONDS`), renovado preguiçosamente na leitura quando o registro passou de `RENEW_AFTER_SECONDS=30 dias`.
**Erros:** `400 Invalid save ID|Conflicting save ID|Missing or invalid state` · `500 Storage not bound` · `{401|403} auth.reason` · `413 State too large` · `405 Method not allowed`.
**Régua:** `functions/api/save.test.js`, `saveId.parity.test.js`.
**Chamado por:** `src/utils/cloudSave.ts` (app web), `desktop/renderer/src/cloudSync.ts` (overlay).

### `functions/api/sprite-image.js`
**Rota:** `/api/sprite-image?k=<32 hex>` · **Métodos:** `GET`.
**Dono de:** servir a imagem republicada por `generate-sprite.js`. A chave é um TOKEN aleatório de 128 bits (não o `saveId`) porque a rota não pode exigir `Authorization` — quem busca é um `<img src>`.
**Auth:** nenhuma — a autorização É a própria URL (capacidade não-adivinhável).
**Rate limit:** nenhum próprio.
**Grava/lê:** `kv(env)`, chave `sprite:blob:<token>` (blob + metadata `contentType`); imutável (`Cache-Control: public, max-age=31536000, immutable`).
**Erros:** `400 invalid token` · `503 storage-not-bound` · `500 internal error` · `404 not found`.
**Régua:** `functions/api/sprite-image.headers.test.js`.
**Avisos do arquivo:** enquanto não houver R2 no projeto, o binário mora na MESMA KV dos saves — decisão pendente do dono (achado B-2).

### `functions/api/subscribe.js`
**Rota:** `/api/subscribe` · **Métodos:** `OPTIONS`, `POST`, `DELETE`.
**Dono de:** registro/remoção de subscription Web Push (browser/PWA, também funciona dentro do WebView do Capacitor via `PushManager`).
**Auth:** nenhuma (rota anônima).
**Rate limit:** `_rateLimit.js`, bucket `subscribe`, `LIMITE_INSCRICAO` (mesmo número de `fcm-subscribe.js`).
**Grava/lê:** `env.PUSH_SUBSCRIPTIONS`, chave `push:<hash do endpoint>`, TTL de 1 ano, `gravarSeMudou`. Valida `endpoint` contra `isAllowedPushEndpoint` (`_pushTargets.js`) e as chaves de criptografia contra `ehChaveWebPush` (base64url com teto).
**Erros:** `400 Missing required fields|Unsupported push endpoint|Malformed keys|Invalid JSON` · `429` (rate limit).
**Régua:** `functions/api/subscribe.test.js`.
**Chamado por:** `src/components/NotificationManager.tsx`, `public/sw.js`.
**Avisos do arquivo:** sem a validação de endpoint, o worker de push faria `fetch()` num host arbitrário 4×/dia por um ano, com o JWT VAPID de produção no cabeçalho — SSRF.

### `functions/api/suggest-tasks.js`
**Rota:** `/api/suggest-tasks` · **Métodos:** `OPTIONS`, `POST`.
**Dono de:** sugestão de tarefas via IA no segundo onboarding — recebe `goalText` + `categories[]`, devolve `{ suggestions: [{name, category}] }` (emoji resolvido no cliente, não confia no modelo para isso).
**Auth:** nenhuma própria — portão é `guardAiRequest` (bucket `suggest`).
**Rate limit:** cota de IA via `_aiGuard.js` (`AI_LIMITS.suggest = {perAccount:30, global:3000}` — o menor teto do sistema, por ser o caminho de primeira impressão).
**Grava/lê:** `kv` via `_aiGuard.js` (contadores `ai:suggest:*`).
**Erros:** `400 goalText or categories required` · `500 AI not configured` · `{status} {reason}` de `guardAiRequest` · `502 AI service error|Could not parse suggestions` (Groq respondeu torto — cota NÃO é devolvida, é o análogo da recusa de conteúdo do sprite) · `500 Internal error`.
**Régua:** `functions/api/suggest-tasks.contract.test.js`.
**Chamado por:** `src/utils/taskSuggestions.ts`, a partir de `src/components/GameTutorialFlow.tsx`.

### `functions/api/transcribe.js`
**Rota:** `/api/transcribe` · **Métodos:** `OPTIONS`, `POST`.
**Dono de:** transcrever a VOZ do jogador (áudio do `ChatBox`) via provedor externo (Supabase Edge Function), same-origin — o áudio sai da NOSSA origem para o NOSSO servidor, a credencial nunca chega ao navegador.
**Auth:** nenhuma própria (é o rate limit que protege o custo).
**Rate limit:** `_rateLimit.js`, bucket `transcribe`, `{limit:6, windowMs:60_000}` — mais apertado que o resto ("6/minuto por IP é um humano falando, não um laço").
**Grava/lê:** nada — o áudio é REPASSADO, nunca gravado (sem `put` de KV/R2 em lugar nenhum deste arquivo).
**Erros:** `429` (rate limit) · `503 transcribe-not-configured` (sem `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY`, ou formato inválido do project id) · `400 invalid-form|missing-audio|empty-audio` · `413 audio-too-large` (teto `MAX_BYTES=4MB`) · `415 unsupported-audio-type` · `502 transcribe-unavailable|transcribe-failed`.
**Régua:** `functions/api/transcribe.test.js`; a existência-e-forma da funcionalidade inteira é travada por `src/security/supabase.contract.test.ts`.
**Chamado por:** `src/components/ChatBox.tsx` (botão de microfone, desenhado só quando `/api/config` diz `transcribeAvailable:true`).

---

## Módulos internos

### `functions/api/_aiGuard.js` (366 linhas — corrigido de "367" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** o portão de TODA rota que gasta dinheiro em API de terceiro (chat, suggest-tasks, sprite) — três travas por conta/dia, por conta vitalício (só sprite), por forma vitalício (só sprite), e global por dia/mês — fail-closed (contador ilegível recusa, nunca libera).
**Exports:**
- `AI_LIMITS` — os tetos por bucket (`chat`/`suggest`/`sprite`), com `perAccount`/`perAccountLifetime`/`perFormLifetime`/`global`/`globalMonth`.
- `AI_REFUSAL_MESSAGES` — texto PT/EN de cada recusa (chega a quem pagou — honesto, nunca soa como punição).
- `VALID_FORM_ID` — regex das 11 formas da árvore (`rookie`, `ultra`, `{champion|ultimate|mega}-{virus|data|vaccine}`).
- `guardAiRequest(request, env, bucket, saveId, units, formId)` — lê os três contadores (vitalício → forma → global → conta, nessa ordem — o vitalício primeiro por ser irreversível), confere os quatro, só então incrementa (ordem que evita uma requisição recusada no 3º teto ter já consumido os dois primeiros). Devolve `{ok:true, release}` (a unidade já está reservada; `release(motivo)` devolve se a geração não aconteceu — idempotente, nunca abaixo de zero) ou `{ok:false, status, reason, message?}`.
**Chamado por:** `functions/api/chat.js`, `suggest-tasks.js`, `generate-sprite.js`.
**Régua:** `functions/api/_aiGuard.test.js`, `_aiGuard.spriteCap.test.js`.
**Avisos do arquivo:** o teto por FORMA (`perFormLifetime`) é o disjuntor que impede um loop de retentativa numa forma só de consumir o vitalício da conta inteira — "não simplifique o ramo `hasFormCap` abaixo por achar que ele nunca liga".

### `functions/api/_auth.js`
**Dono de:** verificação de ID token do Firebase (à mão, via WebCrypto — `firebase-admin` não roda em Workers) e as duas rotinas de autorização do resto do app: `authorizeSaveAccess` (fail-open) e `requireVerifiedOwner` (fail-closed, para rotas destrutivas/de exportação).
**Exports:**
- `verifyIdToken(idToken, projectId)` — confere assinatura RS256 contra o JWKS do Google (cache com `max-age`), `aud`/`iss`/`exp`/`iat`/`email_verified`. NUNCA lança; devolve `{email}` ou `null`.
- `emailToSaveId(email)` — `SHA-256("soulmon:" + email normalizado)`, corte em 32 hex — é UM dos TRÊS pontos que implementam esta derivação (footgun 9, item "sobrou a derivação do saveId"); o encontro é travado por `saveId.parity.test.js`.
- `authorizeSaveAccess(request, env, saveId)` — fail-open sem `FIREBASE_PROJECT_ID`; com a variável, exige Bearer token cujo e-mail derive exatamente o `saveId` pedido.
- `requireVerifiedOwner(request, env, saveId)` — fail-closed (503 sem `FIREBASE_PROJECT_ID`), comparação de `saveId` em tempo constante.
**Chamado por:** `billing.js`, `generate-sprite.js`, `_aiGuard.js`, `account.js`, `community.js`, `entitlements.js`, `save.js`.
**Régua:** `functions/api/_auth.test.js`, `saveId.parity.test.js`, `community.playerOracle.test.js`.
**Avisos do arquivo:** `emailToSaveId` — o corte em 32 caracteres tem que bater EXATAMENTE com o cliente, senão todo usuário autenticado tomaria 403.

### `functions/api/_billing.js` (470 linhas — corrigido de "471" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** verificação de compra por LOJA (a "caixa registradora" — `_entitlements.js` é a "carteira" única). Google Play (service account → token OAuth2 → API do Android Publisher) e Steam (autenticação de ticket de sessão + `InitTxn`/`FinalizeTxn`).
**Exports:**
- `PRODUCTS` — catálogo de SKU → `{grantTier, grantCredits, consumable}` (ids batendo com o Play Console).
- `STEAM_ITEMS` — itemid numérico da Steam → mesmo produto do catálogo.
- `_resetPlayTokenCache()` — só para teste.
- `verifyPlayPurchase(env, {productId, purchaseToken, saveId})` — confere existência/pagamento/posse na Google.
- `isPlayPurchaseBoundTo(purchase, saveId, env)` — a compra pertence a ESTA conta?
- `isPlayPurchaseVoided(env, {productId, purchaseToken})` — reembolsada/cancelada?
- `verifySteamOwnership(env, {ticket})` — posse do app na Steam = tier pago (a loja já cobrou pelo jogo).
- `verifySteamPurchase(env, {orderId, ticket})` — microtransação (pacote de créditos) já finalizada pelo cliente.
- `isSteamOwnershipVoided`/`isSteamPurchaseVoided(env, {orderId})` — reembolso, por origem.
**Chamado por:** `billing.js`, `entitlements.js`.
**Régua:** `functions/api/_billing.test.js`, `_billing.steamRefund.test.js`, `billing.play.test.js`.
**Avisos do arquivo:** sem credencial configurada (`GOOGLE_PLAY_SERVICE_ACCOUNT`/`STEAM_PUBLISHER_KEY`), a rota da loja em questão responde 503 e NUNCA concede nada.

### `functions/api/_bond.js`
**Dono de:** a curva do Vínculo do lado do SERVIDOR — só o necessário para responder "esta conta já cruzou o limiar social?" (o servidor não concede XP nem recompensa).
**Exports:**
- `BOND_PVP_MIN_LEVEL = 5` — espelho de `src/utils/bond.ts`.
- `BOND_MAX_LEVEL = 1000` — teto de CPU: sem ele, `xpForLevel` sobre `totalXP` forjado (`1e10`) custava 183ms medidos.
- `xpForLevel(n)`, `bondLevelFor(totalXP)` — derivação O(nível), nunca persistida.
- `bondLevelOf(env, saveId)` — lê o save gravado na KV e deriva o nível a partir de `totalXP`; save ausente/ilegível/forjado responde `0`.
**Chamado por:** `community.js` (ação `profile`, gate de PvP).
**Régua:** `functions/api/bond.parity.test.js` — varre milhares de valores de `totalXP` e exige que este arquivo e `src/utils/bond.ts` respondam o MESMO nível (footgun 9: cópia deliberada, travada por paridade comportamental porque Pages Functions não importam de `src/`).
**Avisos do arquivo:** o que NÃO foi copiado, de propósito: tabela de XP por evento, tetos diários, escada de recompensas e títulos. Limite honesto: `bondLevelOf` barra quem forja só o `pvpEnabled`, não quem forja o `totalXP` do save inteiro.

### `functions/api/_entitlements.js` (489 linhas — corrigido de "490" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** FONTE DA VERDADE de tudo que envolve dinheiro real — tier, créditos, uso de IA vitalício, resgate de comprovante de compra, auditoria de reembolso. O cliente NUNCA dita tier nem saldo.
**Exports:**
- `ENT_PREFIX='ent:'`, `ORDER_PREFIX='ord:'`, `VALID_ID` — namespace e validação de id.
- `RETENTION_TTL_SECONDS` — 5 anos, RENOVADO a cada escrita (decisão do dono, item 3.1 do `GUIA-DO-DONO.md`); é o que impede o teto vitalício de IA e o tier pago de expirarem para quem continua jogando.
- `requirePaidTier(env, saveId)` — fail-closed; portão de tier para rotas que gastam COGS caro (hoje só sprite).
- `AD_REWARD_CREDITS=5`, `AD_DAILY_CAP=3` — recompensa por anúncio.
- `readEntitlement`/`writeEntitlement(env, saveId, ent)` — leitura com merge de padrão (`emptyEntitlement`), escrita com TTL renovado.
- `publicView(ent)` — o que o cliente pode saber (`tier`, `credits`, `adsLeft`).
- `spendCredits(env, saveId, amount, opId)` — gasta crédito; idempotente por `opId` (WP5.3 — repetir o mesmo gesto devolve o mesmo resultado, nunca debita duas vezes).
- `grantAdReward(env, saveId)` — credita recompensa de anúncio, respeitando o teto diário.
- `claimOrder(env, saveId, orderId)` — amarra um comprovante a UMA conta globalmente; usa D1 atômico (`INSERT` com `order_id` PRIMARY KEY) quando `env.DB` existe, senão KV best-effort (janela de propagação de até ~60s).
- `applyVerifiedPurchase(env, saveId, {...})` — aplica compra já verificada; ignora `orderId` já consumido.
- `AUDIT_INTERVAL_MS` — 24h entre conferências de reembolso da mesma conta.
- `auditRefunds(env, saveId, isVoided, now)` — desfaz compras reembolsadas, no máximo 1×/dia por conta, na leitura do saldo (sem cron); créditos já gastos nunca ficam negativos.
**Chamado por:** `billing.js`, `entitlements.js`, `save.js`, `account.js`, `_aiGuard.js`, `generate-sprite.js`.
**Régua:** `functions/api/_entitlements.test.js`, `.ttl.test.js`, `.d1Retencao.test.js`.
**Avisos do arquivo:** limitação conhecida — KV não tem transação; um read-modify-write concorrente pode perder escrita (aceitável na escala do app; D1 é a saída se virar problema).

### `functions/api/_kv.js`
**Dono de:** o namespace KV dos saves, resolvido num lugar só — aceita `SOULMON_SAVES` (preferido) e `DIGIAPP_SAVES` (herdado), sem exigir sincronia entre "mergear código" e "clicar no painel do Cloudflare".
**Exports:**
- `kv(env)` — `env?.SOULMON_SAVES ?? env?.DIGIAPP_SAVES`; devolve `undefined` quando nenhum está ligado (uso na GUARDA de entrada de rota).
- `kvOrThrow(env)` — o mesmo namespace, já estreitado (lança `storage-not-bound` se ausente); uso em qualquer `.get/.put/.list/.delete`, depois que a rota já passou pela guarda `kv(env)`.
**Chamado por:** praticamente todo módulo de `functions/api/` que toca KV — `billing.js`, `_entitlements.js`, `generate-sprite.js`, `_aiGuard.js`, `sprite-image.js`, `account.js`, `community.js`, `entitlements.js`, `metrics.js`, `save.js`, `_bond.js`.
**Régua:** `functions/api/_kv.test.js`, `_kv.fiacao.test.js` (varre `functions/api/` para garantir que ninguém lê `env.*_SAVES` direto).
**Avisos do arquivo:** o `wrangler.jsonc` do repositório declara os dois bindings; o painel do Cloudflare Pages tem lista própria, e é ela que vale em produção.

### `functions/api/_pushCopy.js`
**Dono de:** o TEXTO e o HORÁRIO das notificações agendadas — dono único das três árvores que entregam a mesma notificação (`NotificationManager.tsx`, `push-scheduler.js`, `wrangler.toml`).
**Exports:**
- `PUSH_HOURS_BRT = [10, 16, 22]` — 21h saiu de propósito (nada deve pedir uma quarta visita, e cobrar tarefa na hora de dormir é o oposto de um companheiro).
- `PUSH_HOURS_UTC` — derivado (`+3, %24`, ordenado).
- `sleepReminderCopy(petName, language)` — o lembrete de deitar; nunca diz a hora, nunca fala de desempenho, nunca condiciona a meta cumprida.
- `eveningCopy(petName, language, hpBaixo)` — a copy das 20h (saiu do `NotificationManager.tsx` só em 06/09/2026 — sobreviveu inteira à unificação porque não existe hora 20 em `PUSH_HOURS_BRT` para o teste de paridade comparar); troca por acolhimento quando `hpBaixo`.
- `pushCopy(brtHour, petName, language, ageDays)` — texto por hora do cron; dias 1/2 (`ageDays`) ganham copy própria só às 10h, nunca no D0.
**Chamado por:** `functions/api/subscribe.js`, `workers/push-scheduler.js`.
**Régua:** `workers/pushCopy.parity.test.js`.
**Avisos do arquivo:** (1) fica na `main` e sobe sozinho no push do Cloudflare Pages; (2)/(3) (`push-scheduler.js`, `wrangler.toml`) são deploy MANUAL — foi assim que o nudge das 21h ficou vivo no worker depois de removido do cliente.

### `functions/api/_pushIdentity.js`
**Dono de:** o que `subscribe.js` (Web Push) e `fcm-subscribe.js` (FCM) têm em comum — teto de apelido, idioma fechado, validação de idade/token, escrita-só-quando-muda e o teto compartilhado das duas rotas de inscrição.
**Exports:**
- `nomeDePet(v)` — corta em 24 chars (teto do campo do app), trim de espaço, padrão `'Soulmon'`.
- `idiomaDePush(v)` — só `'pt-BR'` ou `'en-US'`.
- `dataDeNascimento(v)` — `YYYY-MM-DD` ou `undefined`; formato inválido é DESCARTADO, não corrigido.
- `ehTokenFcm(v)` — forma e teto (32–512 chars, alfabeto restrito), não validade — quem decide se presta é o FCM.
- `TTL_INSCRICAO` — 1 ano.
- `LIMITE_INSCRICAO = {limit:10, windowMs:60_000}` — o número das DUAS rotas, cada canal com balde próprio.
- `gravarSeMudou(kv, chave, registro)` — escreve só quando o conteúdo mudou OU o registro está velho (>30 dias) — troca escrita cara por leitura barata.
**Chamado por:** `subscribe.js`, `fcm-subscribe.js`.
**Régua:** cobertura indireta via `subscribe.test.js`, `fcm-subscribe.test.js`.
**Avisos do arquivo:** até 09/09/2026 "Mirrors" era mentira — `fcm-subscribe.js` nasceu como cópia e ficou parada enquanto a irmã ganhava as cinco proteções listadas acima; hoje o que é comum mora aqui, um dono só.

### `functions/api/_pushTargets.js`
**Dono de:** a allowlist de quem pode receber Web Push — só HTTPS e só os quatro hosts de serviço de push que existem de verdade.
**Exports:**
- `PUSH_HOST_SUFFIXES` — `fcm.googleapis.com` (não `googleapis.com`, que aceitaria outros serviços do Google como alvo do fetch do worker), `push.services.mozilla.com`, `notify.windows.com`, `push.apple.com`.
- `isAllowedPushEndpoint(endpoint)` — HTTPS + porta padrão + host casando por RÓTULO de domínio (nunca `endsWith` cru, que `evil-fcm.googleapis.com.attacker.net` passaria).
**Chamado por:** `subscribe.js`, `workers/push-scheduler.js` (linhas já gravadas antes da correção também precisam ser recusadas no envio).
**Régua:** `functions/api/_pushTargets.test.js`.
**Avisos do arquivo:** sem validar, o worker faria `fetch()` num endereço arbitrário 4×/dia por até um ano, com JWT VAPID de produção no cabeçalho.

### `functions/api/_rateLimit.js`
**Dono de:** o teto de requisição por IP, por CUSTO (não segurança) — um `Map` em memória do isolate, janela deslizante.
**Exports:**
- `clientKey(request)` — `CF-Connecting-IP` (reescrito pela Cloudflare, não forjável) ou `X-Forwarded-For`, ou `null`.
- `takeToken(bucket, key, {limit, windowMs}, now)` — consome um token; `{ok, remaining, retryAfter}`.
- `tooManyRequests(retryAfter, cors)` — resposta 429 padrão, sempre com `Retry-After`.
- `resetRateLimits()` — só para teste.
**Chamado por:** `fcm-subscribe.js`, `subscribe.js`, `community.js`, `transcribe.js`, `metrics.js`.
**Régua:** `functions/api/_rateLimit.test.js`, `costCeiling.test.js`.
**Avisos do arquivo:** teto real, no pior caso, é `limit × (isolates vivos)` — amortecedor de custo de máquina única, não controle exato contra distribuído (precisaria de Durable Object ou binding de Rate Limiting, nenhum provisionado).

### `functions/api/_redact.js`
**Dono de:** minimização de texto livre na fronteira com processador de IA externo (Groq, EUA) — tira identificador direto e limita tamanho antes do texto sair da borda.
**Exports:**
- `minimizeForAi(input, maxLength=500)` — aplica as regras (e-mail, URL, CPF, CNPJ, telefone, sequência longa de dígitos, @handle) em ordem (mais específico primeiro); devolve `{text, redactions, truncated}`.
- `redactionCount(redactions)` — soma para métrica, sem expor conteúdo.
**Chamado por:** `chat.js`, `suggest-tasks.js`.
**Régua:** `functions/api/_redact.test.js`.
**Avisos do arquivo:** FAZ minimização (LGPD art. 6º, III); NÃO FAZ o conteúdo deixar de ser sensível ("Estou em depressão" continua saindo do país como dado de saúde — isso exige base legal e aviso, não regex). `soulGoal`/`soulStruggle` NÃO passam por rota de IA nenhuma (decisão D8).

---

## workers

Cloudflare Workers (`workers/`), deploy **manual** (`wrangler deploy` dentro de `workers/` — não é Pages Function, não builda no push da `main`).

### `workers/fcm.js`
**Dono de:** envio de push nativo via Firebase Cloud Messaging (HTTP v1), sem `firebase-admin` — WebCrypto puro.
**Exports:**
- `getFcmAccessToken(serviceAccount)` — troca a service account por um token OAuth2 de curta duração (JWT-bearer grant, RS256, cache em escopo de módulo, reaproveitado entre requisições do mesmo isolate quente).
- `sendFcmPush(token, notif, projectId, accessToken)` — envia uma notificação a um device token, com `android.notification.tag` (dedupe com o canal Web Push) e `android.notification.icon:'ic_notification'`/`color:'#0B6F68'` (ícone mono = a chama, pintada pelo Android no acento `primary-ink`; sem `image`, porque no FCM v1 não existe `largeIcon` — o largeIcon redondo é só do Web Push, em `public/sw.js`).
**Chamado por:** `workers/push-scheduler.js`.
**Régua:** cobertura indireta via `workers/push-scheduler.test.js`.

### `workers/push-scheduler.js`
**Dono de:** o cron (10h/16h/22h BRT) que drena as duas filas de inscrição (`push:*` via Web Push, `fcm:*` via FCM) do MESMO namespace KV e envia a notificação do horário.
**Exports:**
- `ageDaysOf(sub, now)` — idade da criatura em dias a partir de `sub.bornAt`; `null` se ilegível (nunca interpretado como dia 0).
- `previousSeasonBrt(date)` — a season (YYYY-MM) anterior, em BRT — usado para fechar o Torneio no horário certo.
- `default.scheduled(event, env)` — o handler de cron do Worker: para cada hora agendada, monta a copy (`pushCopy`/`_pushCopy.js`) e drena `push:`/`fcm:` chamando `sendWebPush`/`sendFcmPush`, removendo linha inválida/expirada (410).
**Chamado por:** disparado pelo próprio Cloudflare (cron trigger declarado em `workers/wrangler.toml`), não por outro módulo do código.
**Régua:** `workers/push-scheduler.test.js`, `workers/pushCopy.parity.test.js`, `workers/vapid.parity.test.js`.
**Avisos do arquivo:** o TEXTO e as HORAS não moram aqui — são de `_pushCopy.js`. O contato VAPID (`CONTACT`) é `mailto:` do dono, trocado em 07/09/2026 de um endereço `@digiapp.app` que não pertencia a este projeto.

### `workers/webpush.js`
**Dono de:** o protocolo Web Push completo (RFC 8292 VAPID + RFC 8291 criptografia + RFC 8188 `aes128gcm`), em WebCrypto puro, sem biblioteca.
**Exports:**
- `sendWebPush(sub, payload, vapidJWK, vapidPublicKey, contact)` — monta o JWT VAPID (ES256), criptografa o payload (ECDH + HKDF + AES-GCM) e faz o POST ao endpoint da subscription, com `redirect:'manual'` (um 302 de host permitido não deve arrastar o JWT VAPID para fora da allowlist).
**Chamado por:** `workers/push-scheduler.js`.
**Régua:** `workers/vapid.parity.test.js`.
