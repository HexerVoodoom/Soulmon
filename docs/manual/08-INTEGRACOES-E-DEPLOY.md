# Integrações e deploy

> **Dono:** doc-redator-arquitetura · **Data:** 29/10/2026 (delta `f3acead1..b93f75e93`, 1092 commits — `git rev-list --count f3acead1..HEAD`: §0 `wrangler.jsonc` ganhou `vars` e a §0.1 NOVA lista os interruptores/listas por nome; §1 as rotas passam de 15 para 22 mais as páginas `/gm/*`; §2.2 reserva Gemini `gemini-3.5-flash-lite` e as cotas de IA; §2.3 `Gerar de novo` paga, chroma-key e `ip-hash`; §2.7 o cron `*/30` e a agenda de cocô; §2.8 assinatura cosmética e o kill-switch de compras; §2.10 beta-full; §2.11 duelo v3 por `taps`, reroll e apelido; §2.11-A Feira do Chefe LIGADA em 29/10/2026 e os prédios do clã; §2.13 a exclusão anonimiza o vínculo da compra; §2.14 NOVA `/api/rtdn`; §2.15 NOVA rotas do GM e do beta; §3.3 o CI em jobs paralelos e o Actions de volta; §3.4 pacote `com.soulmon`, `versionCode` 22 e a Play; §5 re-aceite); anterior: 11/10/2026 (delta `e71061b8..f3acead1`: `/api/transcribe` exige ID token Firebase (fail-closed, 503 sem `FIREBASE_PROJECT_ID`); `workers/push-scheduler.js` com ritmo das refeições (deploy manual); Capacitor 8.4.3 pede APK novo); anterior: 30/09/2026 (delta `3532ccf5..bcfe7ca6`: §5 Termos §8 — Travessias opcionais, `TERMS_VERSION` `2026-09-30`); anterior: 30/09/2026 (sincronização `ae366480..5edfcfba`: §2.3 `subscribeAuthState`; §2.10 log `admin_denied` e a re-consulta do papel de admin; §2.11 o **duelo fantasma** (`duelStart`, `match` com `forfeit`/`cheers`, módulo `_duel.js`); §2.13 textos de `NOT_INCLUDED` em inglês; §3.3 e §4 o Actions segue parado, `npm run portoes` e o handoff local; §3.4 `strings.xml` inglês primeiro); anterior: 29/09/2026 (sincronização da Guilda, delta `38c3ccb5..b657a340`: §1 15ª rota `/api/guild`; §2.11 as ações `coop*` viram aliases; §2.11-A NOVO — a Guilda (rota, segredo `GUILD_MEMBER_SECRET`, famílias de chave e TTL, exclusão e exportação); §2.12 seis eventos `guild_*`; módulos `_coop.js`/`_profile.js`); anterior: 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: §2.8 **as migrações D1 foram APLICADAS em produção** (#65, com a nota do `0002` marcado porque a coluna já existia) e a 1ª compra da Play não dá mais 500; §2.10 a rota `action=rebirth-reset` (#62); §4 as linhas de secret atualizadas com o que o dono respondeu (#66, #67, #63b) e a do D1 riscada; anterior: 2ª sincronização do dia, delta `a6c1cd8a..592e2c14`, QA Rodada 2: §1.1 lápide em `_auth.js` + `_coop.js`, §2.5/§2.6 `Authorization` e `saveIdAutorizado`, §2.7 `AGE_DAY_BASE_UTC` e as copies trocadas, §2.8 ack pelo JS após o verify + D1 sem fallback, §2.10/§2.11 410, §2.13 reabertura/coop/export por pid, §3.5 e §4 secrets MEDIDOS no ar em 22/09) · **Estado:** verificado em 29/10/2026 por doc-verificador (delta `f3acead1..b93f75e93` — cada afirmação nova relida no fonte: `functions/api/*.js`, `functions/gm/*.js`, `workers/push-scheduler.js`, `wrangler.jsonc`, `android/app/build.gradle`, `AndroidManifest.xml`, `.github/workflows/ci.yml`, `migrations/0003_rtdn_messages.sql`; Actions re-medido por `gh run list`); anterior: verificado em 01/10/2026 por doc-verificador (delta `bcfe7ca6..e3d55bb8` — §3.6 relido contra `git diff bcfe7ca6..e3d55bb8 -- public/sw.js`: só a linha `CACHE_VERSION` andou; o §3.6 não repete o número de propósito, nenhuma linha mudou); anterior: verificado em 27/09/2026 por doc-verificador (delta `78ef5367..c510c7e4` — §3.6 os dois bumps do delta conferidos com `git log -p 78ef5367..c510c7e4 -- public/sw.js`: `CACHE_VERSION` v167 → v169, um por commit, só a linha do bump — §3.6 não repete o número de propósito, então nada mudou no corpo); anterior: verificado em 24/09/2026 por doc-verificador (delta `c7bca6d0..78ef5367` — §3.6 os sete bumps conferidos com `git log -p c7bca6d0..78ef5367 -- public/sw.js`: `CACHE_VERSION` v160 → v167 em 7 commits, só a linha do bump); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — `migrations/README.md`, `functions/api/entitlements.js` (ramo `rebirth-reset` + 409 `rebirth-not-found`), `_entitlements.js` › `resetSpriteLifetimeOnRebirth` e as respostas #63b/#65/#66/#67 de `PERGUNTAS-DO-DONO.md` conferidos); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — as seções acima conferidas contra `_auth.js`, `_accountTombstone.js`, `_coop.js`, `subscribe.js`, `fcm-subscribe.js`, `push-scheduler.js`, `BillingPlugin.kt`, `playBilling.ts`, `_entitlements.js`, `account.js` e `05-operador-governanca-r2.md` §1; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — §2.5/§2.6 (`pushidx`, `res.ok`), §2.7 (D0 `null`), §2.8 (`billing-ktx` 8.3.0), §2.10 (404, tier derivado), §2.12 (`invite`, `active_days`, `notes`), §2.13 (410, ordem, sprites), §3.3 (Actions parado — fato datado), §3.4 (`__APP_VERSION__`, alarme exato), §3.6 e §4 conferidos símbolo a símbolo contra `build.gradle`, `BillingPlugin.kt`, `SoulmonAlarmPlugin.kt`, `AndroidManifest.xml`, `functions/api/*.js`, `public/sw.js`; anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — §0, §1, §2.5, §2.6, §2.10, §2.12, §2.13, §3.3, §3.4 e §4 conferidos símbolo a símbolo; anterior: delta `9f4e5a7a..f9faf7a7`, QA geral — só as passagens que o diff tocou, conferidas por grep; anterior: §3.6, delta `5ac3d351..8d318529`, som/S16 — os quatro bumps do dia conferidos com `git log --format=%h 5ac3d351..73be1a2f -- public/sw.js`; `980bc84c` deu o quinto, v155; o resto: sincronizado com `dc72579e..9875477b` em 21/09/2026 por doc-redator-arquitetura; conferido em `5ac3d351`)
> **Estado:** verificado em 30/09/2026 por doc-mantenedor (delta `3532ccf5..bcfe7ca6`, só a linha Termos do §5, conferida contra `public/termos.html` §8 e `consent.ts` › `TERMS_VERSION`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-verificador (delta ae366480..5edfcfba — 18 ações e 771 linhas de `community.js`, `duelStart`/`match`, `_duel.js`/`_duel.d.ts`, `admin_denied`/`logAdminDenied` e motivos, `NOT_INCLUDED`/`plan()` de `account.js`, `subscribeAuthState`, `scripts/portoes.mjs`, claim do CI re-medido por `gh run list`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes)
> **Verificação:** `npx vitest run src/deploy src/security functions/api workers` — em especial `src/deploy/appUrl.contract.test.ts` (as quatro fontes da URL), `src/deploy/firebaseNoBuild.contract.test.ts` (o `.env.production` versionado), `src/deploy/swCache.contract.test.ts`, `src/security/csp.test.ts`, `src/security/transcribe.contract.test.ts`, `workers/pushCopy.parity.test.js` e `workers/vapid.parity.test.js`.
> **Não cobre:** o esquema do save e as chaves de storage (→ [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md)), a arquitetura e os portões (→ [05-ARQUITETURA.md](05-ARQUITETURA.md)), as regras do jogo (→ `02-REGRAS-DE-NEGOCIO.md`), função por função (→ `06-REFERENCIA/`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## 0. Regra deste documento: nenhum VALOR de credencial

Abaixo aparecem **só o NOME da variável e ONDE ela mora**. Nenhum valor, nem
"parcial", nem "só o começo". Os três lugares onde credencial mora neste
projeto:

| Lugar | O que vai lá | Como se define |
|---|---|---|
| **`wrangler secret`** (Cloudflare Pages → Settings → Environment variables) | Tudo que é segredo de servidor. | `wrangler secret put <NOME>` — ou o painel. |
| **`wrangler.jsonc` → `vars`** | Variável de runtime **pública** (em 29/10/2026: `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` e `FIREBASE_AUTH_DOMAIN` — a config WEB do Firebase, pública por desenho e igual à de `.env.production`, lida só pelas páginas `/gm/*` — e `SIMULADOS_ON` = `"1"`; em 10/09/2026 era só `FIREBASE_PROJECT_ID`). Mora no arquivo, e não no painel, porque **variável comum é substituída pelo conteúdo do arquivo a cada `wrangler deploy`** — posta só no painel, o próximo deploy a apagaria e o servidor voltaria ao modo aberto em silêncio. |
| **`.env.production`** (COMMITADO) | As quatro `VITE_FIREBASE_*`, que são **públicas por design**: o Vite as inlina no bundle que todo visitante baixa. |

⚠️ **Produção é um WORKER, não Pages** (achado do `soulmon-operador` na etapa 6 do QA geral, 21/09/2026 — [`PLAY-LANCAMENTO.md`](../PLAY-LANCAMENTO.md) §E): o `wrangler.jsonc` da raiz chama-se `soulmon` e a URL é `soulmon.mateus-sprnd.workers.dev`. O caminho no painel é **Workers & Pages → soulmon → Settings → Variables and Secrets** (ou `npx wrangler secret put <NOME>` na raiz), e uma **variável comum posta no painel some a cada `wrangler deploy`** — por isso o checklist manda **tudo como secret**: `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`, `METRICS_ADMIN_KEY`, `SEASON_ADMIN_KEY`, as da Play e `GROQ_API_KEY`. "Pages" nas linhas abaixo é herança de texto, não o painel de hoje.

⚠️ **Por que `.env.production` é commitado** (`.gitignore` tem `!.env.production`):
as `VITE_*` são inlinadas em **BUILD**, não lidas em runtime. Como o CI builda de
novo a cada push sem o `.env` da máquina do dono, um deploy manual correto era
desfeito ~1 min depois pelo build do CI, e **o login morria em produção a cada
push** — medido em 07/09/2026: deploy 19:51:16, build do CI 19:52:19, login
quebrado. Régua: `src/deploy/firebaseNoBuild.contract.test.ts`, que exige que o
arquivo esteja versionado, traga as QUATRO variáveis com valor, **não** carregue
nada de servidor, e que os quatro nomes batam com o que `src/utils/auth.ts` lê.

### 0.1 Interruptores, listas e ajustes — só o NOME (29/10/2026)

Tudo abaixo é lido de `env.<NOME>` no servidor; nenhum valor entra neste documento (§0). Os que
"ligam" aceitam `1`/`true`/`yes`/`on`/`sim` (`_killSwitch.js` › `flagOn`); qualquer outro valor é desligado.
O runbook de operação é [`BETA-CONTINGENCIA.md`](../BETA-CONTINGENCIA.md) §0 — lá eles são `wrangler secret`.

| Nome | O que faz | Quem lê |
|---|---|---|
| `BETA_CLOSED` + `BETA_EMAILS` | Beta fechado: com `BETA_CLOSED` ligado, e-mail fora de `BETA_EMAILS` recebe **403 `beta-closed`** em save, IA, compra e inscrição de push; desligado, só a IA exige a lista (se ela existir). A mesma lista dá o **beta-full**: o e-mail listado enxerga o plano pago sem comprar (derivado na leitura, nunca gravado em `ent:`). | `_betaAccess.js`, `_betaFull.js`, `_auth.js` › `authorizeSaveAccess`, `_aiGuard.js` |
| `BILLING_DISABLED` | Loja fechada: comprovante novo ou de outra conta → **503 `billing-disabled`**; restaurar o que a conta já tem passa. | `billing.js` › `recusaSeLojaFechada` |
| `CHAT_DISABLED` | `/api/chat` → **503 `chat-disabled`** antes de gastar cota. `GET /api/config` expõe `billingDisabled`/`chatDisabled` para a UI esconder os botões. | `chat.js`, `config.js` |
| `SPRITE_DISABLED` · `SPRITE_REGEN_DISABLED` | `/api/generate-sprite` → **503 `sprite-disabled`**; o segundo desliga só o "Gerar de novo" pago (**503 `sprite-regen-disabled`**), antes de qualquer débito. | `generate-sprite.js` |
| `CRASH_DISABLED` | `/api/crash` responde **202 `{ ok, disabled: true }`** sem gravar. | `crash.js` |
| `IP_HASH_SALT` | Sal do hash de IP do antiabuso (o IP nunca é gravado): `IP_LIMITS` = 3 contas novas e 4 sprites por ip-hash/dia, **429** acima. Sem o sal nada é calculado. | `_ipHash.js` › `takeIpQuota`, `save.js`, `generate-sprite.js` |
| `ADMIN_PUSH_TARGET` | Para onde vai o alerta FCM ao dono quando o teto global de IA cruza 80 % (1×/tipo/dia); exige também `FIREBASE_SERVICE_ACCOUNT`, senão só log. | `_adminAlert.js` |
| `CHAT_MODEL` · `GEMINI_CHAT_MODEL` | Troca de modelo do chat sem deploy (padrão Groq `GROQ_MODEL_DEFAULT` = `openai/gpt-oss-120b`; reserva Gemini `GEMINI_MODEL` = `gemini-3.5-flash-lite`). | `_llm.js` |
| `SPRITE_MODEL` · `SPRITE_QUALITY` · `SPRITE_GEMINI_IMAGE` | Modelo do sprite (`alpha` padrão · `flare` · `soul`), qualidade (padrão `low`) e a chave do Gemini de IMAGEM, que só liga com `SPRITE_GEMINI_IMAGE` **e** `GEMINI_API_KEY` (chave de outro projeto). | `generate-sprite.js` › `spriteModel`/`spriteQuality` |
| `RTDN_AUDIENCE` · `RTDN_PUSH_SA_EMAIL` | Audience e service account do Pub/Sub push das notificações da Play (§2.14). | `_pubsubAuth.js`, `rtdn.js` |
| `FEIRA_CHEFE_DESDE` | Data `AAAA-MM-DD` (UTC) em que o Chefe e o Desafio da Feira existem. **Se for uma data válida, manda sobre a constante** `FEIRA_CHEFE_DESDE` de `_feira.js` (hoje `2026-10-29`, ligada); uma data no futuro desliga sem deploy de código (`feiraLigada`). | `_feira.js`, `guild.js` |
| `SIMULADOS_ON` | Liga os usuários simulados (no `vars` do `wrangler.jsonc`, valor `"1"`). | `_simulados.js` |

---

## 1. As rotas `/api` (Cloudflare Pages Functions)

São **22** rotas de `functions/api/` (`grep -lE "export (async )?function onRequest" functions/api/*.js`, 29/10/2026; eram 15 em 29/09/2026 — as 7 novas estão marcadas abaixo), mais duas PÁGINAS GM em `functions/gm/` e o `assetlinks`. Os arquivos `_*.js` são módulos internos, sem rota.

| Rota | Métodos | Arquivo |
|---|---|---|
| `/api/account` | `OPTIONS`, `ANY` (`?action=export` · `POST ?action=delete-request` · `POST ?action=delete-confirm`) | `account.js` |
| `/api/billing` | `OPTIONS`, `POST` (`?action=verify[&provider=play\|steam]`) | `billing.js` |
| `/api/chat` | `OPTIONS`, `POST` | `chat.js` |
| `/api/community` | `OPTIONS`, `ANY` (21 ações, 5 delas aliases `coop*`) | `community.js` |
| `/api/config` | `OPTIONS`, `GET` | `config.js` |
| `/api/crash` (NOVA) | `POST` (relatório anônimo), `GET` (dono, `X-Metrics-Key`) | `crash.js` |
| `/api/entitlements` | `OPTIONS`, `GET`, `POST` (`?action=spend` · `?action=ad` · `?action=grant` — cortesia do dono, desde `42b07bec` · `?action=rebirth-reset` · `GET ?action=beta-full`) | `entitlements.js` |
| `/api/fcm-subscribe` | `OPTIONS`, `POST`, `DELETE` | `fcm-subscribe.js` |
| `/api/generate-sprite` | `OPTIONS`, `POST` | `generate-sprite.js` |
| `/api/gm-rift-payout` (NOVA) | `GET`, `POST` (só GM: ID token de e-mail em `ADMIN_EMAILS`) | `gm-rift-payout.js` |
| `/api/gm-soulmons` (NOVA) | `GET` (só GM) | `gm-soulmons.js` |
| `/api/guild` | `OPTIONS`, `ANY` (`GUILD_ACTIONS`: 36 ações — a Guilda, a Guerra `guildWar*`, a Casa/Loja `guildDonate`/`guildShopBuy`/`guildSlot`, os prédios `cla*` e a Feira `guildFeira*`; mais 5 aliases `coop*`) | `guild.js` |
| `/api/metrics` | `OPTIONS`, `GET`, `ANY` | `metrics.js` |
| `/api/rankings` (NOVA) | `OPTIONS`, `ANY` (`POST` envia o score, `GET` lê o top) | `rankings.js` |
| `/api/rtdn` (NOVA) | `POST` (Pub/Sub push da Play, [§2.14](#214-apirtdn--notificações-da-play-em-tempo-real)) | `rtdn.js` |
| `/api/save` | `OPTIONS`, `ANY` (`GET`/`POST`) | `save.js` |
| `/api/sprite-admin` (NOVA) | `POST ?action=release-form` (`X-Metrics-Key`) | `sprite-admin.js` |
| `/api/sprite-image` | `GET` | `sprite-image.js` |
| `/api/subscribe` | `OPTIONS`, `POST`, `DELETE` | `subscribe.js` |
| `/api/suggest-tasks` | `OPTIONS`, `POST` | `suggest-tasks.js` |
| `/api/top-ai` (NOVA) | `GET ?day=` (`X-Metrics-Key`) | `top-ai.js` |
| `/api/transcribe` | `OPTIONS`, `POST` | `transcribe.js` |
| `/gm/soulmons`, `/gm/rift` (páginas) | `GET` (HTML sem dados; login Firebase no navegador) | `functions/gm/soulmons.js`, `functions/gm/rift.js` |
| `/.well-known/assetlinks.json` | `ANY` (lista vazia sem `ASSETLINKS_SHA256`; pacote padrão `com.soulmon`) | `functions/.well-known/assetlinks.json.js` |

### 1.1 Os módulos internos que quase toda rota atravessa

| Módulo | Papel |
|---|---|
| `_kv.js` | `kv(env)` (guarda) e `kvOrThrow(env)` (uso). **Nunca leia `env.*_SAVES` direto** — guard em `_kv.fiacao.test.js`. |
| `_auth.js` | `verifyIdToken` (verifica o JWT do Firebase à mão, contra o JWK do Google, porque `firebase-admin` não roda em Workers; devolve `{ email, authTime }` — o claim `auth_time`, desde `592e2c14`), `emailToSaveId`, `authorizeSaveAccess` (**fail-open** sem `FIREBASE_PROJECT_ID`; **desde `592e2c14` confere a lápide de conta apagada DEPOIS da autorização** — `gateTombstone` de `_accountTombstone.js` — e por isso TODA rota que autoriza em nome de um `saveId` responde **410 `account-deleted`** + `deletedAt`: `save`, `community`, `generate-sprite`, `entitlements`, `billing`, `chat`/`suggest-tasks` via `_aiGuard`, `subscribe`/`fcm-subscribe` com `saveId`; login com `auth_time` posterior à exclusão REABRE), `authStatus(auth)` (401/403/410 num lugar só) e `requireVerifiedOwner` (**fail-closed**, 503 sem a variável). |
| `_accountTombstone.js` | A lápide `del:done:<saveId>` (30 d): `writeTombstone`/`clearTombstone`/`readTombstone` e o portão `gateTombstone(env, saveId, authTime)` — `{ deleted, reopened, at? }`. |
| `_coop.js` (desde `592e2c14`; 1024 linhas desde a Guilda) | O ESTADO da Guilda (ex-grupo cooperativo): chaves `coop*` (11 famílias, [07 §8.1](07-DADOS-E-SAVE.md)), `COOP_*`, dono único das constantes do Bosque/fio/marés/Feira, `gravarGrupo` renovando os índices, `grupoDe`, o cartão do membro e `coopLeave` — usado por `guild.js`, `community.js` (aliases) E pela exclusão de conta. |
| `_profile.js` (desde 29/09/2026, WPG-1) | Perfil público e pid (`getProfile`, `ensurePid`, `pidSoLeitura`, `stagePower`, …), extraídos de `community.js` — usado por ele e por `guild.js`. |
| `_entitlements.js` | A fonte da verdade de dinheiro. `requirePaidTier` é **fail-closed**. |
| `_billing.js` | `verifyPlayPurchase`, `verifySteamOwnership`, `verifySteamPurchase`, `isPlayPurchaseVoided`, `isSteamPurchaseVoided`, `isSteamOwnershipVoided`, e os catálogos `PRODUCTS`/`STEAM_ITEMS`. |
| `_aiGuard.js` | O portão das rotas que gastam dinheiro em API de terceiro: **três** travas — cota por conta e por DIA (`ai:<bucket>:<saveId>:<dia>`), teto **VITALÍCIO** por conta (`ent:<saveId>.aiLifetime.<bucket>`) e teto por **FORMA** (`aiForms`, dicionário fechado nas 11 formas, validado por `VALID_FORM_ID`). |
| `_rateLimit.js` | `clientKey`/`takeToken`/`tooManyRequests`. ⚠️ **É AMORTECEDOR DE CUSTO, não controle de segurança**: o contador vive na memória do isolate (`Map`), e o teto real no pior caso é `limit × isolates vivos`. O IP vem de `CF-Connecting-IP`, que a Cloudflare reescreve na borda. |
| `_redact.js` | `minimizeForAi` / `redactionCount` — corta e remove e-mail, telefone, CPF, link e @perfil antes de o texto ir para o modelo. |
| `_pushIdentity.js` | O que os DOIS canais de push compartilham: `nomeDePet` (teto de 24), `idiomaDePush`, `dataDeNascimento`, `ehTokenFcm`, `gravarSeMudou`, `LIMITE_INSCRICAO`. |
| `_pushTargets.js` | `isAllowedPushEndpoint` — a allowlist de serviços de push. |
| `_pushCopy.js` | **Dono único** do texto e das HORAS do push, para as três árvores (cliente, worker, cron): `PUSH_HOURS_BRT`, `PUSH_HOURS_UTC`, `pushCopy`, `eveningCopy`. |
| `_bond.js` | `bondLevelOf` e `BOND_PVP_MIN_LEVEL` — a MESMA derivação do cliente, e é o servidor que decide. |
| `_killSwitch.js` · `_betaAccess.js` · `_betaFull.js` · `_ipHash.js` · `_adminAlert.js` (desde a `release/beta-1`) | Os interruptores, a lista do beta, o beta-full, o antiabuso por hash de IP e o alerta ao dono — todos por NOME em [§0.1](#01-interruptores-listas-e-ajustes--só-o-nome-29102026). |
| `_llm.js` | O adaptador único do chat: Groq principal (com ferramentas) e Gemini de reserva ([§2.2](#22-groq--chat-do-pet-e-sugestão-de-tarefas)). |

---

## 2. Integração por integração

### 2.1 Firebase Auth — projeto `soulmon-app`

| | |
|---|---|
| **Para quê** | Provar posse do e-mail. O `saveId` é o hash do e-mail: sem prova, quem conhece o e-mail lê e sobrescreve o save alheio. |
| **Cliente** | `src/utils/auth.ts` — `isAuthConfigured`, `entrarComSenha`, `criarContaComSenha`, `entrarComGoogle`, `sendLoginLink`/`completeLoginFromLink`, `mandarResetDeSenha`, `getIdToken`, `subscribeAuthState` (desde 30/09/2026 — avisa quando o USUÁRIO do Firebase muda; ignora o disparo inicial do SDK; sem Firebase configurado é no-op; quem a usa é o efeito de entitlement do `App.tsx`), `authHeaders`, `signOut`, `startDesktopAuthBridge`. |
| **Servidor** | `functions/api/_auth.js` — `verifyIdToken` valida `alg=RS256`, `aud`, `iss`, `exp`, `iat` (tolera 5 min de relógio adiantado), exige `email_verified === true`, e só então confere a assinatura contra o JWK do Google (cache respeitando o `max-age` da resposta). |
| **Credencial** | **Cliente (públicas, de BUILD, inlinadas no bundle):** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — em `.env.production` (versionado) e no `.env` local, que tem precedência no desenvolvimento. **Servidor:** `FIREBASE_PROJECT_ID` em `wrangler.jsonc` → `vars`. |
| **Sem ela** | Sem as `VITE_*`, `isAuthConfigured()` é `false` e o app roda **sem login**. Sem `FIREBASE_PROJECT_ID`, `authorizeSaveAccess` entra em **modo aberto** e aceita qualquer chamada — e `requireVerifiedOwner` (exportar/excluir conta) responde **503 `auth-unavailable`**, ficando indisponível. ⚠️ **Ordem obrigatória**: `FIREBASE_PROJECT_ID` só pode ser ligada DEPOIS de um bundle que carregue as `VITE_*`; ligar antes derruba o login de todos, porque o servidor passa a exigir token e o cliente não sabe emitir nenhum. |
| **Régua** | `src/deploy/firebaseNoBuild.contract.test.ts`, `functions/api/_auth.test.js`, `functions/api/saveId.parity.test.js`. |

⚠️ **`https://apis.google.com` na CSP não é opcional.** O `signInWithPopup`
carrega `https://apis.google.com/js/api.js` para orquestrar o popup; sem o
domínio em `script-src` **e** `frame-src` (junto de `accounts.google.com`), o
login com Google falha com `auth/internal-error`, que **não menciona CSP em
lugar nenhum**. Medido em 07/09/2026.

### 2.2 Groq — chat do pet e sugestão de tarefas

| | |
|---|---|
| **Para quê** | As falas do pet (`openai/gpt-oss-120b`, com reserva Gemini `gemini-3.5-flash-lite` (`GEMINI_MODEL`; o `gemini-2.5-flash` passou a responder 404 em 20/10/2026); ver `functions/api/_llm.js`) e o pool de tarefas sugeridas do segundo onboarding. |
| **Cliente** | `src/utils/aiClient.ts` → `aiFetch` — **único** caminho do cliente para as rotas de IA. Ele acrescenta `id: <saveId>` e o `Authorization` automaticamente, para nenhuma chamada nova esquecer a identificação. A fala espontânea (a cada 3 min) e o toque no pet usam só frases locais, sem `/api/chat`. |
| **Servidor** | `functions/api/chat.js` e `functions/api/suggest-tasks.js`, os dois atrás de `guardAiRequest` (`_aiGuard.js`) e de `minimizeForAi` (`_redact.js`). |
| **Credencial** | `GROQ_API_KEY` — `wrangler secret`; `GEMINI_API_KEY` é a reserva do chat (basta UM dos dois: `hasChatProvider`). |
| **Sem ela** | Sem nenhum dos dois, **500 `AI not configured`** e o pet fica sem fala gerada. Os dois no limite do plano gratuito → **429 `ai-busy`** com a frase cansada do Soulmon, não erro; 4xx do provedor → **502 `ai-upstream`**. `CHAT_DISABLED` → 503 (§0.1). |
| **Cotas** (`AI_LIMITS`, `_aiGuard.js`, 29/10/2026) | `chat`: `perAccount` 15 (`perAccountByTier`: demo 15 · paid 20), `global` 250/dia, `perMinute` 4 · `transcribe`: 10/dia, `global` 100, `perMinute` 4 · `suggest`: 30/dia, `global` 3000. O plano de IA é **custo zero** (gratuito do Groq + Gemini; REGISTRO §32). |
| **Chat agente** (11/10/2026) | Só o chat aberto (`actions: true`) recebe ferramentas (`_chatActions.js`: o modelo PROPÕE, `sanitizeToolCalls` valida e o portão de intenção descarta o que a última mensagem não pede; o cliente ainda confirma) e a base de conhecimento (`_chatKnowledge.js`, BM25; o `.data.js` é GERADO do manual por `npm run gen:chat-kb`). Nada grava no servidor. Regra: [`CHAT-SOULMON.md`](../CHAT-SOULMON.md). |
| **Régua** | `chat.promptInjection.test.js`, `chat.memoria.test.js`, `suggest-tasks.contract.test.js`, `aiRoutes.release.test.js`, `costCeiling.test.js`. |

**A camada anti-injeção do `customKeywords`** (o campo em que a pessoa
personaliza a voz do pet) está em `functions/api/chat.js`: o texto entra num
bloco delimitado por `<<<USER_STYLE>>>`/`<<<END_USER_STYLE>>>`, com os
delimitadores, as quebras de linha e os marcadores de papel (`<|im_start|>`,
`[INST]`, `<<SYS>>`) removidos da entrada. **O que isso NÃO garante, e está
escrito lá:** nada impede o modelo de obedecer a um texto persuasivo escrito
DENTRO do bloco. Não existe defesa completa contra prompt injection. O que
existe é redução de superfície — o atacante perde a capacidade de se passar por
sistema. A vítima do campo é o próprio jogador (o chat é individual, um pedido,
uma resposta); o motivo de haver conserto é que **a `GROQ_API_KEY` é do dono e é
ÚNICA para todos**, e uma persona forçada a violar a política do provedor derruba
a conta de API de todo mundo.

**A cláusula SAFETY do system prompt (21/09/2026, `01b649ce`)** fecha o prompt de
`functions/api/chat.js` (`buildSystemPrompt`) e **sobrepõe tudo** — o bloco NEVER, o
estilo do usuário e o personagem: diante de fala de ideação sobre a própria
pessoa, o pet sai da voz (sem emoji, sem apelido), responde em três frases —
reconhecer → declarar a própria limitação → pedir que procure hoje uma pessoa
real —, e **nunca** se oferece como razão para ficar, pede detalhes, cita
telefone/serviço/site ou minimiza; figura de linguagem ("tô morrendo de sono")
fica em personagem. O motivo, escrito no próprio arquivo: a persona é definida
como alguém que sofre quando não é cuidada, e um 8B sem trava produz "e eu?" —
culpa como dissuasor. **Alcance honesto:** instrução de prompt é probabilística;
o caminho determinístico (casar no servidor antes do Groq) está recomendado,
não implementado. **Régua: nenhuma** — nenhum teste em `functions/api/` varre a
cláusula (`grep -l SAFETY functions/api/*.test.js` → vazio, 21/09/2026). No
mesmo commit, `contextBlock` **parou de entregar tempo ao modelo**: ⚰️ as linhas
`'You two have been together for a long time.'` (`ctx.bond >= 10`) e `'They were
away for a while and just came back …'` saíram — o `daysAway` só dispara `'They just came back after
not opening the app … You have no idea how long it was'`. É a mesma trava de
`welcomeBack.ts` levada ao prompt — nenhuma frase encena duração ou espera
(⚠️ divergência: o comentário em `contextBlock` diz "frase idêntica no 2º e no
40º dia", mas `welcomeBackLine` continua escolhendo POR FAIXA de `absenceBucket`,
decisão 14.3 do `REGISTRO-DE-DECISOES.md`; o que é idêntico é a ausência de
contagem, não a frase): a
criatura não tem órgão que leia tempo (`docs/NARRATIVA-E-UNIVERSO.md` §5.10).
`bond` continua aceito em `CONTEXT_SCHEMA`, mas nenhuma linha do bloco o lê. A
superfície de suporte que a cláusula pressupõe está na tela do chat
(`src/components/ChatBox.tsx`, `sm2-chat-support`, `6ad2e629`) — lista curada e
estática, nunca do modelo.

**A ponte de ajuda** (`src/utils/chatSafety.ts`) roda **antes de a mensagem sair
do aparelho**: reconhece um punhado de frases de sofrimento agudo e devolve uma
resposta local, fixa, na voz do pet, com o CVV 188 em português e, em inglês,
**findahelpline.com** (desde `a6c1cd8a` — ⚰️ "a crisis line" sem apontar
nenhuma). Não diagnostica, não classifica risco e não guarda histórico. Desde
`a6c1cd8a` (skeptic #11, QA Rodada 1) o texto E os padrões passam por
`normalizarParaLexico` (NFD sem marcas + minúsculo): "nao quero mais viver" sem
acento passa a casar, e o léxico EN ganhou o coloquial de chat (`wanna die`,
`kms`, `kill myself`, `end it all`, `no reason to live`).

### 2.3 Higgsfield (e Gemini de reserva) — geração de sprite

| | |
|---|---|
| **Para quê** | O sprite próprio de cada uma das 11 formas. É a rota mais cara do app. |
| **Cliente** | `src/utils/spriteGen.ts` (`requestSprite`, `pixelizeDataUrl`, `generateAllSprites`, `SpriteGenError`), `src/utils/spriteLibrary.ts` (o acervo), `src/utils/spriteRunner.ts` (execução) e `src/hooks/useSpriteGeneration.ts` (a janela). |
| **Servidor** | `functions/api/generate-sprite.js` → `POST` com `{ prompt, promptFallback?, referenceImageUrls?, id, formId? }`. Quando o provedor devolve `data:`, o binário é republicado por `functions/api/sprite-image.js` (`GET ?k=<32 hex>`). |
| **Credencial** | Primário (14/10/2026): `HF_CREDENTIALS` = `keyId:keySecret` (GPT Image 2.5 flare, `marketing-studio/image/flare`; `SPRITE_MODEL` opcional; cadastrar via dashboard do Cloudflare, ausente cai no Soul). Legado: `HF_API_KEY` **+** `HF_SECRET` (`wrangler secret`; a rota monta `Key <HF_API_KEY>:<HF_SECRET>`). Reserva: `GEMINI_API_KEY` (`wrangler secret`). |
| **Sem ela** | Sem nenhum dos dois pares a rota lança `image generation not configured`. O app **nunca fica sem arte**: acervo vazio é a arte de RESERVA, que por invariante nunca é erro. |
| **Régua** | `generate-sprite.cap.test.js`, `.dedupe.test.js`, `.release.test.js`, `.tier.test.js`, `_aiGuard.spriteCap.test.js`, `sprite-image.headers.test.js`. |

**O que mudou de 14/10 a 26/10/2026** (`functions/api/generate-sprite.js`, 865 linhas — `wc -l`, 29/10/2026):

- **Chroma-key no servidor** (`_chroma.js` + `_png.js`, §48): o prompt pede fundo VERDE `#00FF00`; `chromaKeyPng` devolve o PNG RGBA (despill, ilhas < 24 px fora, recorte com margem); `BadChromaError` (`bad-chroma`) é falha honesta. `SPRITE_MODEL` escolhe `alpha` (padrão) · `flare` · `soul` e `SPRITE_QUALITY` a qualidade (§0.1). O Gemini de IMAGEM só liga com `SPRITE_GEMINI_IMAGE` e uma chave de OUTRO projeto.
- **Tetos de teste** (21/10/2026, decisão do dono): `AI_LIMITS.sprite` está **liberado só para os testes iniciais** — `perAccount` 60, `perAccountLifetime` 500, `perFormLifetime` 20, `globalMonth` 800, `globalDay` 40. Os valores de PRODUÇÃO são 6 / 15 / 1 (um sorteio por forma, REGISTRO §34); o código traz o comentário com eles e os testes de teto rodam contra os valores de produção por fixture única.
- **"Gerar de novo" paga** (`_spriteRegen.js`, REGISTRO §34b, 26/10/2026): corpo com `regenPaid: true` + `opId` — **50 Créditos**, **1 por forma por mês** (`SPRITE_REGEN`), só conta paga de verdade (402 `paid-tier-required` senão). O débito sai ANTES de gerar, idempotente por `opId` (`reserveRegen`); se a imagem não chega, o débito VOLTA (`refundRegen`, idempotente; um `debited` com mais de `REGEN_STALE_MS` = 5 min é devolvido); repetir o `opId` → 409 `regen-duplicate` (ou a resposta já entregue). `aiRegen` e `regenOps` moram no `ent:` e `aiRegen` sobrevive à exclusão. `SPRITE_REGEN_DISABLED` desliga só este gesto. Existe ainda `regenerate: true` (o "Gerar Soulmon" do teste fechado, 23/10/2026), que só pula o cache; lock, teto vitalício e teto por forma seguem valendo.
- **Antiabuso**: `takeIpQuota(env, request, 'sprite')` (4 por ip-hash/dia, `_ipHash.js`), `SPRITE_DISABLED` e a lista do beta (§0.1).
- **E-mail do titular no registro** (`sprite:img:<saveId>:<formId>`): `GRAVAR_EMAIL_DO_SPRITE = true` desde 26/10/2026 — só a página GM lê; a política (`privacidade.html` §6d) foi republicada e a exclusão apaga o e-mail junto com o sprite (§2.13).
- **Entrega ao jogador**: a imagem continua SEMPRE republicada em `/api/sprite-image?k=…`; `generate-sprite.chroma.test.js`, `.regen.test.js`, `.qa.test.js` e `.qa2.test.js` são as réguas novas.

**Duas variantes de prompt, e a régua**: `composeSpritePrompts` em
`src/utils/oracle.ts` produz `imagePrompt` (que **cita** as referências de gênero
porque o resultado sai melhor) e `imagePromptFallback` (o mesmo pedido sem citar
ninguém). Toda criação começa pelo primeiro; se o provedor recusar por política
de conteúdo (`isRefusal`), a mesma requisição refaz sozinha com o fallback. Erro
que não é recusa **não** refaz, para não dobrar o custo. As duas variantes
mantêm "Do not copy any existing franchise character".

**O contrato de status** está escrito no cabeçalho de `generate-sprite.js`:
`200 { image, provider?, cached? }` · `202 { pending: true, retryAfter: 20 }`
(**não é erro** — o cliente fica na reserva e repergunta) · `400` bug de cliente
· `402` teto vitalício · `409` teto da forma.

**A guarda de esquema da URL é UMA função, usada em quatro pontos de produção**
(`grep -rn "isSafeSpriteUrl" src --include=*.ts \| grep -v test`, 10/09/2026: três
chamadas dentro de `src/utils/spriteLibrary.ts` e uma em `src/utils/spriteGen.ts`,
que a IMPORTA em vez de reescrever o dicionário de esquema):
`isSafeSpriteUrl` (`src/utils/spriteLibrary.ts`). Ela fecha `javascript:`
(inclusive `JaVaScRiPt:` e com TAB/LF no meio, porque o parser de URL ignora
esses caracteres dentro do esquema), `data:` não-imagem, `http:`, `file:`,
`blob:` e `//host` (relativo a esquema, que herda `https` e vaza igual), e
responde `false` para não-string. ⚠️ **O que ela NÃO fecha** é o beacon
`https://atacante.example/x.png`: para isso é preciso fixar o **HOST** do
provedor, e o host do CDN do Higgsfield não está confirmado — pendência do dono.

**A chave do sprite republicado é um TOKEN aleatório de 128 bits, não o
`saveId`.** `sprite-image.js` não pode exigir `Authorization` (quem busca é um
`<img src>`, que não manda header), então a autorização é a própria URL — e o
token nunca aparece em log. O regex `/^[0-9a-f]{32}$/` recusa o resto, o que
impede a rota de virar caminho de leitura livre no mesmo namespace onde moram os
SAVES.

### 2.4 Groq (Whisper) — transcrição de voz

| | |
|---|---|
| **Para quê** | A voz do jogador virar texto no chat. |
| **Cliente** | `src/components/ChatBox.tsx` chama `/api/transcribe` (**mesma origem**). O botão de microfone só é desenhado quando `/api/config` responde `transcribeAvailable: true` — ver `src/utils/serverConfig.ts` (`fetchServerConfig`). |
| **Servidor** | `functions/api/transcribe.js` (`POST`), atrás de `_rateLimit` com `LIMITE = { limit: 6, windowMs: 60_000 }` — mais apertado que o das outras rotas, porque é a mais cara por chamada e o corpo é grande. O Worker envia o áudio DIRETO ao Groq (`whisper-large-v3`), sem Supabase. Limite de gravação: 60 s (cliente e servidor). |
| **Credencial** | `GROQ_API_KEY` — `wrangler secret`. Nunca chega ao navegador. |
| **Sem ela** | A rota responde **503 `transcribe-not-configured`**, `/api/config` diz `transcribeAvailable: false`, e o **botão de microfone não é desenhado**. Botão que existe e falha é pior que botão que não existe. |
| **Régua** | `src/security/transcribe.contract.test.ts` — peças que andam juntas: (1) Worker→Groq, sem Supabase, e a CSP não abre `connect-src` para o provedor; (2) a política declara o microfone nos dois idiomas; (3) a ficha da Play declara gravação de voz e a permissão; (4) o manifesto Android declara `RECORD_AUDIO`; (5) a rota não grava. Mais: `functions/api/transcribe.test.js`. |

⚰️ **Histórico: até 09/09/2026 o `ChatBox` gravava áudio e mandava `POST` DIRETO** para
`https://<projectId>.supabase.co/…`, com o JWT anônimo commitado em
`src/utils/supabase/info.tsx`. Nunca funcionou em produção (a CSP não tem
`*.supabase.co` em `connect-src`), e a saída óbvia — liberar a CSP — era a pior:
abriria `connect-src` para QUALQUER projeto Supabase, e um XSS passaria a poder
exfiltrar para o projeto do atacante.

**O áudio é REPASSADO, nunca gravado**: não há `put` de KV nem de R2 em lugar
nenhum de `transcribe.js`, e não pode haver.

### 2.5 Web Push (VAPID)

| | |
|---|---|
| **Para quê** | Notificação em navegador e PWA instalada — e também dentro do WebView do Capacitor, onde `PushManager` é suportado. |
| **Cliente** | `src/utils/notifications.ts` → `subscribeToPush` / `unsubscribeFromPush`; o `push`/`notificationclick` é tratado em `public/sw.js`. **Ícones (20/09/2026, `3e758a81`, canvas Fora do app — `docs/design/DECISOES-WIREFRAME.md` §30, D-F14/D-F15):** `icon` = `/push-large-192.png` (`PUSH_ICON` no `sw.js`; mini-visor REDONDO `#071413` com a chama de `src/brand/flame.ts` a 1× — o Android 12+ recorta o `largeIcon` em círculo, então o PNG já nasce círculo) e `badge` = `/badge-96.png` (`PUSH_BADGE`; ALFA-ONLY, chama branca em transparente — a barra de status descarta cor). Os mesmos dois caminhos estão em `showNotification` de `notifications.ts` e no `PRECACHE_URLS`. ⚰️ Até então os dois eram `/favicon-192x192.png`, e o favicon (quadrado escuro cheio) virava um BLOCO PRETO na barra de status — inclusive no WebView do APK, onde o Web Push também roda. |
| **Servidor** | `functions/api/subscribe.js` (`POST` grava, `DELETE` remove) → chaves `push:<hash do endpoint>` em `PUSH_SUBSCRIPTIONS`; desde `42b07bec` (decisão #23) o registro leva `saveId` opcional, e desde `a6c1cd8a` (QA Rodada 1) `gravarSeMudou` também o indexa em **`pushidx:<saveId>`** (`_pushIdentity.js`; teto 16, TTL 1 ano; indexa mesmo quando o registro não mudou — inscrição antiga se indexa na próxima abertura) — **e desde `592e2c14` o `saveId` só é LIGADO ao registro com prova de posse** (`saveIdAutorizado` → `authorizeSaveAccess`; o cliente manda `Authorization: Bearer` via `authHeaders()`, e o CORS anuncia o header; sem prova o registro é gravado SEM `saveId`; lápide → 410; a inscrição expulsa do índice pelo teto é apagada junto) — é por esse índice, não por varredura, que a exclusão de conta (`account.js` › `deletePushSubscriptions`) acha as inscrições; o `DELETE` chama `desindexarInscricao` antes de apagar. O envio é `workers/webpush.js` (RFC 8292 VAPID + RFC 8291 + RFC 8188 aes128gcm, tudo em WebCrypto). |
| **Credencial** | `VAPID_JWK` — **`wrangler secret put VAPID_JWK` dentro de `workers/`** (a chave privada ECDSA P-256 como JSON). A chave PÚBLICA correspondente é `VAPID_PUBLIC_KEY`, que vai em `[vars]` do `workers/wrangler.toml` (é pública por definição). O endereço de contato do VAPID (RFC 8292 `sub`) é uma constante no `workers/push-scheduler.js`: é para onde o SERVIÇO de push escreve em caso de falha de entrega e **nunca aparece para o usuário**. |
| **Sem ela** | O cron não consegue assinar e nenhum push web sai. |
| **Régua** | `functions/api/subscribe.test.js`, `workers/vapid.parity.test.js`, `functions/api/_pushTargets.test.js`. |

### 2.6 FCM — push nativo do Android

| | |
|---|---|
| **Para quê** | Canal NATIVO extra, só no app Android. FCM tem tratamento mais confiável contra Doze e otimização de bateria em ROMs de fabricante (MIUI, EMUI) do que uma subscription de Web Push crua, e dá visibilidade de entrega pelo Firebase Console. |
| **Cliente** | `src/utils/notifications.ts` → `registerForPushNotifications` / `unregisterFromPushNotifications`, via `@capacitor/push-notifications`. O token fica em `FCM_TOKEN` (`localStorage`) — e desde `a6c1cd8a` (skeptic #2, QA Rodada 1) **só sai do aparelho depois de `res.ok`** do `DELETE`; falha lança e o token fica para a próxima tentativa (⚰️ era apagado ANTES do `fetch`: um DELETE que falhava não podia ser repetido e o servidor seguia mandando push a uma conta que a pessoa mandou apagar). |
| **Servidor** | `functions/api/fcm-subscribe.js` (`POST`/`DELETE`) → chaves `fcm:*` no MESMO namespace `PUSH_SUBSCRIPTIONS` (com `saveId` opcional desde `42b07bec`, como em `subscribe.js`; índice `pushidx:` e `desindexarInscricao` no `DELETE` desde `a6c1cd8a`, como em §2.5). O envio é `workers/fcm.js` (HTTP v1, JWT assinado em WebCrypto — sem `firebase-admin`). Desde 20/09/2026 (`3e758a81`) o payload `android.notification` leva `icon: 'ic_notification'` (a chama de `android/.../drawable/ic_notification.xml`, silhueta que o Android pinta no acento) e `color: '#0B6F68'` (`primary-ink` claro, 6,02:1 sobre a bandeja clara) — **sem `image`**: no FCM v1 não existe `largeIcon`, e `image` vira BigPictureStyle. O mini-visor redondo fica só no Web Push e no alarme local. ⚠️ **Isso está no worker, que NÃO foi deployado** (§3.5): em produção o FCM continua mandando o payload anterior até alguém rodar `cd workers && ../node_modules/.bin/wrangler deploy --config ./wrangler.toml`. |
| **Credencial** | `FIREBASE_SERVICE_ACCOUNT` — **`wrangler secret put` dentro de `workers/`**, com o JSON COMPLETO baixado em Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada. Exige também `android/app/google-services.json` — ⚰️ **fora do git desde `f2977302e9` (18/10/2026)**: o arquivo vem do Firebase Console, tem de conter um `client` para o `applicationId` (`com.soulmon`) e fica só na máquina de build; `android/app/build.gradle` valida o CONTEÚDO e, sem ele, NÃO aplica o plugin (só avisa) — o build passa, mas FCM e o login Google nativo não funcionam e o canal `soulmon_push` criado em `MainActivity.java`. O `AndroidManifest.xml` aponta `com.google.firebase.messaging.default_notification_icon` para `@drawable/ic_notification` (⚰️ era `@mipmap/ic_launcher` até 15/09/2026, `005a2941`). |
| **Sem ela** | O cron pula o canal FCM; o Web Push continua funcionando. |
| **Régua** | `functions/api/fcm-subscribe.test.js`. |

⚠️ **Os dois canais compartilham a TAG da copy, e é ela que impede a duplicata**
(06/09/2026): `AlarmReceiver.kt` notificava por `id.hashCode()` e `workers/fcm.js`
por `android.notification.tag` — tag ≠ id, então o Android tratava as duas como
notificações diferentes e o mesmo aviso chegava DUAS vezes no mesmo aparelho, às
10h, 16h e 22h. Hoje o receiver usa `notify(tag, 0, …)` com a tag vinda do `id`
que o cliente passa (que É a tag da copy). O dedupe do WP3.4
(`isNativePlatform()` antes do poll web) matou a TERCEIRA cópia.

**O alarme local (`AlarmReceiver.kt`) usa a mesma identidade visual** (20/09/2026,
`3e758a81`): `setSmallIcon(R.drawable.ic_notification)`, `setColor(0xFF0B6F68)` e
`setLargeIcon` com `R.drawable.push_large` (`res/drawable-nodpi/push_large.png`,
o MESMO PNG de `public/push-large-192.png`). ⚰️ O ícone pequeno era
`R.mipmap.ic_launcher`. No mesmo delta sincronizado, mas em 15/09/2026
(`005a2941`), `values/ic_launcher_background.xml` passou de `#0d9488` para
`#071413` (o vidro). Estas três mudanças moram em
`android/`, logo **só chegam ao aparelho com APK novo** (§3.4).

**Histórico:** o FCM já foi implementado e revertido uma vez (commit `056a6b06`),
com a tese de que o Web Push sozinho basta porque o WebView delega ao FCM por
baixo. Foi reintroduzido de propósito para o lançamento na Play. Os dois convivem.

### 2.7 O agendador de push (`workers/push-scheduler.js`)

| | |
|---|---|
| **Para quê** | Disparar os pushes do dia para os DOIS canais numa única passada de cron. |
| **Onde a copy mora** | `functions/api/_pushCopy.js` — **dono único** das três árvores. `PUSH_HOURS_BRT = [10, 16, 22]`; `PUSH_HOURS_UTC` é **derivado** (`(h + 3) % 24`, ordenado). O `workers/wrangler.toml` declara `crons = ["0 1 * * *", "0 13 * * *", "0 19 * * *", "*/30 * * * *"]` (o último é a passada de 30 min do ritmo das refeições, `MEAL_TICK_CRON`), e `workers/pushCopy.parity.test.js` trava essa lista contra o módulo — foi assim que o cron das 21h saiu junto com o nudge das 21h, que a auditoria de tom já tinha removido do cliente. |
| **D0 = nulo** | Desde `a6c1cd8a` (QA Rodada 1; provisório de #50-b): `pushCopy(hora, nome, idioma, ageDays)` devolve **`null` quando `ageDays === 0`**, em QUALQUER hora, e o scheduler trata `null` como `'skipped'` — o dia do nascimento é o dia em que a pessoa está dentro do app. **E a base do dia é meia-noite em BRT** (`AGE_DAY_BASE_UTC = 'T03:00:00Z'`, desde `592e2c14`, `00-skeptic-r2` #11): o cron das 22h BRT é 01:00 UTC do dia seguinte e, com base UTC, quem nasceu hoje já era D1 às 22h — o push saía no D0. `ageDaysOf` devolve `-1 → 0` (jogador até 14 h à frente do UTC) e `null` só para `bornAt` além de um dia no futuro. **Copies trocadas em `592e2c14`** (`02-narrativa-r2` A5/A13): ⚰️ "está te esperando" (20h) → "ainda está acordado / Se fez algo hoje, marque. A comida vem daí."; ⚰️ "meio pra baixo" → "está quieto hoje"; 16h ⚰️ "pensou em você" → "está por aí / a janela está aberta". ⚰️ Até `f4086ce0` o cabeçalho prometia "nunca no D0" e o código só desviava a copy de recém-nascido para a frase padrão: o push saía do mesmo jeito. Inscrição sem `bornAt` não é D0 e recebe a copy de sempre. |
| **A copy das 20h** | `eveningCopy`, no MESMO `_pushCopy.js`. Ela era inline no `NotificationManager.tsx` e por isso sobreviveu ao WP3.4 — o teste de paridade compara as horas de `PUSH_HOURS_BRT`, e não existe hora 20 para comparar. Só o TEXTO veio; a **CONDIÇÃO continua no cliente**, porque o worker não sabe se a meta do dia foi cumprida (a assinatura guarda só endpoint, chaves, nome e idioma). Ela **cede a vez quando há janela de descanso**: com a janela padrão (23:00) a noite mandava três pushes em 2h30. |
| **O lembrete de deitar** | O ÚNICO push da Janela de Descanso, e a hora dele não é fixa: sai de `sleepReminderAt` (`src/utils/restWindow.ts`), `SLEEP_REMINDER_LEAD_MIN` (30) minutos antes do início da janela que a PESSOA escolheu. Por isso não entra em `pushCopy(hora)`. Ele **não diz a hora** — "São 22h30" é um relógio cobrando. Desde a Frente P (18/10/2026) ele também sai **pelo worker**, com o app fechado: o cliente grava `sleep: {s, tz}` na inscrição (`s` = início da janela em minutos locais; ausente = switch `SLEEP_REMINDER_ENABLED` desligado ou sem janela = não envia), `lembreteDeInscricao` (`_pushIdentity.js`) valida, e `sleepNotifFor` na passada de 30 min envia no tick `floor((s−30)/30)×30` (0–29 min antes do alvo do cliente, nunca depois), com a MESMA tag `pet-sleep-reminder` do local (dedupe). D0 não recebe; às 22h BRT o boa-noite cede a quem tem `sleep`. O servidor não sabe se o pet já dorme. |
| **Fechamento de season** | O cron das 10h BRT do dia 1 chama `POST /api/community?action=closeSeason` da season anterior, e entrega os troféus 🥇🥈🥉. |
| **Credencial** | `VAPID_JWK` e `FIREBASE_SERVICE_ACCOUNT` (secrets do worker) + `SEASON_ADMIN_KEY` (secret do worker, com o **MESMO** valor que está no Pages). `APP_URL` e `VAPID_PUBLIC_KEY` já vão em `[vars]` do `workers/wrangler.toml`. |
| **Sem `SEASON_ADMIN_KEY`** | O fechamento é **pulado com log**, nunca tentado às cegas. |
| **Régua** | `workers/push-scheduler.test.js`, `workers/push-scheduler.qa2.test.js` (desde `592e2c14`), `workers/pushCopy.parity.test.js`. |

**A passada de 30 min (`*/30`, REGISTRO §113 e §144):** além dos três horários fixos, o worker roda o `meal tick` — convite de refeição, lembrete de deitar e o **push de cocô com o app fechado**. A inscrição (`subscribe.js`/`fcm-subscribe.js`) passou a aceitar `sleep`, `skip` (gravado como `x`: o que o teto diário `PUSH_DAILY_CAP` = 4 cortou HOJE, só obedecido no dia `d`) e `poop` (`{ d, tz, t: [[slot, instante]] }`, no máximo `POOP_AGENDA_MAX` = 2): `poopNotifFor` dispara na 1ª passada em ou depois do instante, nunca no D0 nem na janela de descanso, e nunca é cortado pelo `x` (cocô é a maior prioridade, `_pushBudget.js`). A passada entrega uma LISTA (cocô + refeição na mesma passada). Detalhe por função: [06 `api-workers.md`](06-REFERENCIA/api-workers.md) (`workers/push-scheduler.js`, `_pushBudget.js`, `_mealRhythm.js`). **Exige redeploy do worker** (§3.5) — o git não é o ar.

⚠️ **Este worker NÃO é uma Pages Function e NÃO builda no push da `main`.**
Deploy manual: `cd workers && ../node_modules/.bin/wrangler deploy --config ./wrangler.toml`. Foi assim que o nudge
das 21h ficou vivo aqui depois de ter sido removido do cliente.

### 2.8 Google Play Billing

| | |
|---|---|
| **Para quê** | A compra de conteúdo digital dentro do app Android. É obrigatória pela Play — não dá para usar Stripe/Pix ali. |
| **Cliente** | `src/utils/playBilling.ts` (`purchase`, `restorePurchases`, `getLocalizedPrice`, `isBillingAvailable`) sobre o plugin nativo `plugins/BillingPlugin.kt` (`com.android.billingclient:billing-ktx:8.3.0` desde `a6c1cd8a` — ⚰️ `6.2.1`: **a Play recusa PBL < 8** em app novo/update desde 31/08/2026 (v6 desde 31/08/2025; `deprecation-faq`, lido em 21/09/2026); o plugin passou à API da 8.x: `enablePendingPurchases(PendingPurchasesParams…enableOneTimeProducts())`, `enableAutoServiceReconnection()`, `queryProductDetailsAsync` lendo `QueryProductDetailsResult.productDetailsList`; guard textual PL-8 `src/plugins/billingPbl8.contract.test.ts` — **o compile só o CI prova, e o CI está parado** (§3.3, #48)); depois `src/utils/entitlements.ts` → `verifyPurchase`. |
| **Servidor** | `functions/api/billing.js` → `POST ?action=verify[&provider=play]` com `{ id, productId, purchaseToken }`, que chama `verifyPlayPurchase` (`_billing.js`) e, só se a **própria loja** confirmar, `claimOrder` + `applyVerifiedPurchase` (`_entitlements.js`). Conta com lápide → 410 (via `authStatus`, desde `592e2c14`). |
| **Reconhecimento (ack) — desde `592e2c14`** | A compra não consumível é **reconhecida na Play SÓ depois do `/api/billing` ok**: `playBilling.ts` › `fecharNaPlay` chama `plugin.acknowledge({ purchaseToken })` (método novo do `BillingPlugin.kt`, que confere por `queryPurchasesAsync` que o token é da conta) ou `consume` quando há `consumeToken`. ⚰️ O `BillingPlugin.kt` reconhecia no próprio `purchasesUpdatedListener`/`getPurchases` (`acknowledgeIfNeeded`) — fechava a compra na Play ANTES de o servidor conceder o tier: verify recusado deixava a pessoa sem benefício e sem o estorno automático de 3 dias. `restorePurchases` reconhece cada compra que o verify aprovar. Régua: `src/utils/playBilling.ackAposVerify.test.ts` (9, três deles leem o `.kt`). |
| **Catálogo** | `PRODUCTS` em `_billing.js` — além da ASSINATURA cosmética trimestral (`SUBSCRIPTION_SKU` = `soulmon_cosmetic_quarterly`, `kind: 'subscription'`, sem tier e sem Créditos; abaixo): `soulmon.unlock.full` (`grantTier: 'paid'`, NÃO consumível) e `soulmon.credits.60` / `.150` / `.400` (consumíveis). Produto consumível devolve `consumeToken`, e o app precisa chamar `consumeAsync()` depois — senão o jogador não consegue recomprar o mesmo pacote. |
| **Credencial** | `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` — `wrangler secret`. Mais a variável de política `PLAY_REQUIRE_ACCOUNT_BINDING`. |
| **Sem elas** | A rota da Play responde **503 e NUNCA concede nada**. |
| **Régua** | `functions/api/billing.play.test.js`, `billing.test.js`, `_billing.test.js`, `_entitlements.test.js`, `_entitlements.ttl.test.js`, `_entitlements.d1Retencao.test.js`. |

**Assinatura cosmética (`docs/ASSINATURA-SPEC.md`, beta-play-01, 11/10/2026):** `POST /api/billing?action=verify&provider=play` com um `productId` de `kind: 'subscription'` vai para `handleSubscription` — `verifyPlaySubscription` consulta `purchases.subscriptionsv2` NA GOOGLE, `claimOrder` trava a cadeia (`play:sub:<sha256 da raiz do linkedPurchaseToken>`), `applySubscriptionState` grava SÓ o estado (`ent.sub`: `rootHash`, `until`, `state`, `entitled`, `test`) e o servidor reconhece a assinatura (`acknowledgePlaySubscription`). Nada além do `purchaseToken` do corpo é lido: vigência forjada pelo cliente é ignorada. O cliente: `purchaseSubscription`/`reconcileSubscription`/`getSubscriptionOffer` em `playBilling.ts`, sobre o `BillingPlugin.kt` (`productType: "subs"`). As renovações e cancelamentos chegam pelo RTDN ([§2.14](#214-apirtdn--notificações-da-play-em-tempo-real)).

**Mais três travas em `billing.js` (11/10 a 21/10/2026):** `recusaSeLojaFechada` (`BILLING_DISABLED` → 503 `billing-disabled`, ANTES do claim e do ack — a Play estorna o não reconhecido em 3 dias); **409 `already-consumed`** (consumível que já foi consumido na Play e não está nos `consumedOrders` da conta); e o portão do beta (**403 `beta-closed`**). A resposta de compra/restauração passa por `entView`: quem está no beta-full continua `paid` no espelho.

**Migração `0003_rtdn_messages.sql`** (NOVA no repositório, `CREATE TABLE IF NOT EXISTS rtdn_messages` — `message_id` PK, `received_at`, `expires_at`; idempotência do RTDN, sem cron: `rtdnMarkSeen` apaga o vencido). Sem o binding `DB` o RTDN usa o KV. ⚠️ **Estado do ar não medido nesta sincronização** — a medição de 22/09 acima cobre só `0001` e `0002`; a prova é `npx wrangler d1 migrations list soulmon-billing --remote`.

⚠️ **`isPlayPurchaseBoundTo` lê `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`** —
ou seja, **sem a variável, a compra sem vínculo é ACEITA**. Ligá-la exige antes
publicar um APK que mande `setObfuscatedAccountId(saveId)`; ligar antes disso
recusaria toda compra. Ver [../STATUS.md](../STATUS.md) §3.2.

**`claimOrder` é a trava "um recibo, uma conta"** e ela só é **atômica** com o
binding D1 (`env.DB`). O `wrangler.jsonc` declara `d1_databases` com o banco
`soulmon-billing`; o schema está em `migrations/` (ver
[07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) §8.3). Sem o binding `DB` o caminho cai no KV, que é
eventualmente consistente (~60 s) e deixa o mesmo comprovante valer para N contas.
⚠️ **Com o binding e SEM a tabela não há fallback — há 500.**
✅ **As migrações foram APLICADAS EM PRODUÇÃO em 22/09/2026** (decisão/registro do
dono **#65**), e por isso **a 1ª compra da Play não responde mais 500**:

| Prova | Resultado em 22/09/2026 |
|---|---|
| `0001_order_claims.sql` | ✅ aplicada |
| `0002_order_claims_expires_at.sql` | ✅ **marcada** como aplicada (ver a nota abaixo) |
| `wrangler d1 execute soulmon-billing --remote --command "PRAGMA table_info(order_claims)"` | ✅ **4 colunas**, com `expires_at` |
| `wrangler d1 migrations list soulmon-billing --remote` | ✅ **"No migrations to apply"** |

⚠️ **A nota do `0002`:** ele **falhou** com `duplicate column name: expires_at` — a
tabela já existia **com** a coluna, criada pelo caminho `d1 execute --remote
--file` que o `migrations/README.md` mandava usar até aquela manhã, e **sem
registro nenhum em `d1_migrations`**. O erro foi a **prova de que já estava
aplicado**, e a migração foi marcada como aplicada (`wrangler d1 migrations` não
tem "mark applied"; o jeito é `INSERT` manual em `d1_migrations`, com aval do
dono). ⚰️ O `execute --file` virou **lápide** no `migrations/README.md`: ele muda
o banco sem deixar rastro no próprio banco, então "está aplicado?" deixa de ser
respondível por comando. Continua valendo para **consulta** (`--command "PRAGMA
…"`), que é leitura. ⚰️ Até a manhã de 22/09/2026 este parágrafo dizia que as
duas estavam "to be applied" e que a tabela **não existia** em produção
(`05-operador-governanca-r2.md` §1) — medição correta para o `d1_migrations`, e
enganosa sobre a tabela, que existia por fora dele. Desde `592e2c14`
o `catch` de `claimOrderAtomic` engole SÓ violação de chave (`ehViolacaoDeChave`) e relança o
resto — erro honesto com retry, em vez de acusar o comprador com `order-in-use`. ⚰️ O STATUS
dizia "sem a tabela, a query falha e o resgate cai no caminho antigo" — falso.

**A defesa REAL não é `claimOrder`, é o vínculo na origem**:
`obfuscatedExternalAccountId` na Play e o session ticket na Steam. Lá a própria
loja diz de quem é a compra, e recibo alheio não vale em conta nenhuma.

### 2.9 Steam

| | |
|---|---|
| **Para quê** | Vender o overlay desktop e as microtransações de Créditos. A carteira é **UMA SÓ por conta**: Crédito comprado na Play vale na Steam e vice-versa. |
| **Cliente** | `desktop/` (o overlay). O empacotamento é `npm run dist:steam` (`electron-builder --win --dir --publish never`, com `steamBuild=true`). |
| **Servidor** | `functions/api/billing.js` → `POST ?action=verify&provider=steam`: `{ id, orderId }` concede Créditos (microtransação, `verifySteamPurchase`); `{ id, ticket }` concede o tier pago (posse do app, `verifySteamOwnership`). `STEAM_ITEMS` liga o `itemid` NUMÉRICO da Steam aos mesmos produtos do catálogo — o desbloqueio completo **não** está ali de propósito: na Steam ele vem da posse do app. |
| **Credencial** | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID` — `wrangler secret`. |
| **Sem elas** | A rota da Steam responde 503 e não concede nada. |
| **Régua** | `functions/api/_billing.steamRefund.test.js` — nasceu de uma varredura de mutação: `isSteamPurchaseVoided` não tinha teste nenhum, e trocar `status === 'Succeeded'` por `!==` deixava a suíte verde, fazendo quem pagou perder os Créditos e quem estornou ficar com eles. |
| **Guia operacional** | [../../desktop/STEAM.md](../../desktop/STEAM.md) e `docs/PLANO-DESKTOP-STEAM.md`. |

### 2.10 Entitlements — `/api/entitlements`

| | |
|---|---|
| **Para quê** | Ler o tier/saldo e gastar Créditos. |
| **Cliente** | `src/utils/entitlements.ts` — `fetchEntitlement`, `spendCredits`, `claimAdReward`, `verifyPurchase`. |
| **Servidor** | `GET ?id=<saveId>` → `{ tier, credits, adsLeft }` (`publicView`; `+ provider` só com tier pago — `play`/`steam`/`courtesy`); `POST ?action=spend` `{ id, amount, reason }` — **idempotente por `opId`**, porque guarda de cliente não protege dinheiro (o cliente é editável e a rede repete sozinha); `POST ?action=ad` `{ id }`; **`POST ?action=grant` `{ saveId }`** (desde `42b07bec`, decisão #12) — cortesia: tier pago sem loja, `provider: 'courtesy'`, zero crédito, idempotente por conta, teto global (`courtesy:count`). `Authorization: Bearer <ENTITLEMENTS_ADMIN_KEY>`; sem a variável a rota responde **404** (fail-closed, como `metrics.js`); teto por IP 10/min. **`POST ?action=rebirth-reset` `{ id }`** (desde 22/09/2026, decisão do dono **#62**) — zera `ent:<saveId>.aiLifetime.sprite` no RENASCIMENTO. Existe como rota porque o rebirth é **de cliente** (`src/utils/rebirth.ts`) e o contador vitalício é **de servidor**: o cliente avisa, o servidor confere. Três travas — `authorizeSaveAccess` (só o dono do save), **prova no save** (lê `<saveId>` na KV e exige `state.rebirth` com `at`/`fromStage`, senão **409 `rebirth-not-found`**) e **uma vez por conta** (`rebirthSpriteResetAt`; a 2ª chamada devolve `200 { jaFeito: true }` sem escrever). `aiForms` **não** é zerado. Ligada no cliente por `src/utils/entitlements.ts` › `resetSpriteLifetimeAfterRebirth`, chamada com `void` no `handleRebirth` do `App.tsx`: **falhar não pode bloquear o renascimento**, que é uma vez só na vida do save. Detalhe em [`06-REFERENCIA/api-workers.md`](06-REFERENCIA/api-workers.md). |
| **Credencial** | `ADMOB_SSV_ENABLED` — variável de servidor. `ENTITLEMENTS_ADMIN_KEY` (secret — a chave da cortesia; sem ela a rota não existe) e `COURTESY_MAX_ACCOUNTS` (secret, inteiro ≥ 0; ausente ou inválida → `COURTESY_DEFAULT_MAX = 25`). Nomes só, nunca valores (§0). |
| **Admin/GM do dono** (29/09/2026) | `ADMIN_EMAILS` — **secret** do Worker, lista de e-mails separada por vírgula/espaço, normalizada como no `emailToSaveId` (`trim` + minúsculas; ponto e `+tag` contam). Criar: `npx wrangler secret put ADMIN_EMAILS` na raiz (ou painel **Workers & Pages → soulmon → Settings → Variables and Secrets**, como *secret*). **Sem ela (ou vazia) ninguém é admin — fail-closed**; e sem `FIREBASE_PROJECT_ID` também ninguém é, mesmo com o saveId do dono (o saveId é calculável a partir do e-mail, não é prova). Quem decide é `functions/api/_admin.js` › `verifiedAdmin`, só a partir de ID token Firebase verificado (`verifyIdToken`: assinatura, `aud`, `iss`, `exp`, `email_verified === true`) **do próprio save**. Efeitos, todos derivados na LEITURA e **nunca gravados em `ent:`**: `GET` devolve `admin: true`, `tier: 'paid'` e `credits: ADMIN_CREDITS_DISPLAY` (exibição, não dinheiro); `spend` responde ok sem debitar; `save.js` serve `accountTier: 'paid'`; `generate-sprite` passa do `requirePaidTier`; tetos POR CONTA de sprite × `ADMIN_AI_CAP_MULTIPLIER` (3) **e** sub-teto mensal próprio `ADMIN_SPRITE_MONTHLY_CAP` (40, contador KV `ai:sprite:@admin:<mês UTC>`, sem PII; estouro = 503 `ai-monthly-budget-reached` igual ao global), **teto global mensal intacto** — pior caso de custo do admin ~40 x R$ 0,101 = ~R$ 4/mês; chat do admin na cota paga. Sem rota que leia/escreva outro saveId; comunidade/guilda tratam o admin como jogador comum. Auditoria: log `admin_session` sem e-mail nem saveId. **Desde 30/09/2026** `verifiedAdmin` também registra `admin_denied` (`logAdminDenied`) com um `reason` curto — `no-allowlist` (falta `ADMIN_EMAILS`), `not-listed` ou `saveid-mismatch` — **só para token VERIFICADO** (sem token ou com lixo, silêncio: é o tráfego comum); nunca e-mail nem saveId. É a forma de o dono ver no log do Cloudflare que o secret não foi criado. Como o cliente agora refaz a consulta do entitlement (login sem troca de `saveId`, volta ao primeiro plano — [05 §2.2](05-ARQUITETURA.md)), o papel de admin deixa de depender de a PRIMEIRA resposta chegar com token. Régua: `functions/api/admin.denied.test.js`. Contrato: [`../reviews/admin-corvo/impl-notas-backend.md`](../reviews/admin-corvo/impl-notas-backend.md). Régua: `functions/api/admin*.test.js`. |
| **Sem ela** | ⚠️ **O anúncio recompensado fica DESLIGADO por padrão**, e o GET devolve `adsEnabled: false` para a UI esconder a opção. Um endpoint aberto que dá crédito só porque o cliente pediu é farmável com um `curl`. Ligar de verdade exige Server-Side Verification do AdMob (o próprio Google chamando uma URL nossa assinada). |
| **Régua** | `functions/api/entitlements.test.js`, `entitlements.grant.qa.test.js` e `_entitlements.tierDerivado.qa.test.js` (os dois desde `a6c1cd8a`), `_entitlements.qa2.test.js` (desde `592e2c14` — `podarOrderDetails` nunca poda o pedido pago vivo que sustenta o tier; `ORDER_HISTORY_MAX = 200`). Conta com lápide → 410 no GET e no POST (desde `592e2c14`). |

Desde `a6c1cd8a` (QA Rodada 1): (1) `handleGrant` exige `typeof saveId === 'string'` ANTES do regex (`RegExp.test` coage array/número) e a **ação desconhecida responde 404 `Not found`**, o mesmo corpo do `grant` sem chave — ⚰️ `400 Unknown action` deixava uma sonda sem chave distinguir `?action=grant` (404) de `?action=x` (400), e o 404 que existia para esconder a rota passava a confirmá-la (achado B1); (2) **o tier é DERIVADO na auditoria de reembolso**: `auditRefunds` termina com `ent.tier = paidProviderOf(ent) ? 'paid' : 'demo'` — ⚰️ rebaixava para `demo` por pedido desfeito sem olhar os outros, e com a cortesia isso deixava `tier: 'demo'` com `provider: 'courtesy'`. **Consequência provisória (#40): a cortesia SOBREVIVE ao reembolso da Play**; se o dono decidir o contrário, marca-se o pedido `courtesy:*` como `voided` ali.

**Beta-full (18/10/2026, PR #397):** `GET /api/entitlements?action=beta-full` (antes de o save existir; só o ID token decide) devolve `{ betaFull }`; o GET/POST normal, quando o e-mail verificado está em `BETA_EMAILS`, devolve `tier: 'paid'`, `provider: 'beta'` e `betaFull: true` — **derivado na leitura, nunca gravado** em `ent:` (tirar o e-mail da lista revoga na leitura seguinte; uma compra real soma por cima). O admin vence: com `admin`, `betaFull` é falso. Guard: `functions/api/betaFull.test.js`.

### 2.11 Comunidade e cooperativo — `/api/community`

| | |
|---|---|
| **Para quê** | Perfis públicos, diretório, Torneio (PvP assíncrono), amigos, presentes e seasons. O modo cooperativo saiu para `/api/guild` ([§2.11-A](#211-a-a-guilda--apiguild)). |
| **Cliente** | `src/utils/community.ts` — `pushProfile` e as leituras. **O `pushProfile` só é chamado com `gameState.pvpEnabled` verdadeiro**: sem esse portão, quem nunca ativou o PvP tinha nome, pet e atributos publicados assim mesmo. |
| **Servidor** | 21 ações em `functions/api/community.js` (1166 linhas — `wc -l`, 29/10/2026): `profile`, `nickname` (reserva do apelido único, `409 name taken`), `names` (sugestões por prefixo ≥ 2 letras, só do diretório público), `players`, `player`, `opponents` (`?reroll=1`: UM sorteio novo por intervalo entre combates, `429 reroll used`), `duelStart`, `match`, `rank`, `seasonResult`, `closeSeason`, `trophies`, `friends`, `gift`, `gifts` (`&ack=1` entrega sem apagar), `giftsAck` (POST, até 50 `gids`) e os aliases `coop`, `coopCreate`, `coopJoin`, `coopCheckin`, `coopLeave` (⚠️ só ALIASES de `guild.js`, envelope antigo `{ group }` — nenhum cliente os chama). Desde `592e2c14` o estado do coop mora em `_coop.js`, `closed:<season>` tem TTL de 400 d (`CLOSED_SEASON_TTL`) e toda ação com `id` = ator responde **410** para conta com lápide. **Mudanças de 20 a 28/10/2026:** o perfil público ganhou `artLine`, `spriteUrl` (só `/api/sprite-image?k=…` ou a allowlist do CDN) e `element` (`_artLine.js`); o **apelido é único** (`claimNick`/`nickKey` em `_profile.js`, sem diferenciar maiúsculas; `nameTaken` na resposta de `profile`); o **resgate de presentes é por `ack`** (L03-01, 21/10: cada presente tem `gid`, o D1 trava a entrega por `gift:<saveId>:<gid>` e `GIFT_ACK_LEASE_MS` = 10 min devolve a trava se o ack se perder); `closeSeason` compara a chave por `secretEquals` e **simulado nunca leva prêmio** (o troféu desce ao próximo jogador real). |
| **Duelo fantasma** (combate v3, PR5, 06/10/2026; reescrito sobre a antiga contabilidade de 30/09) | O Torneio é decidido NO SERVIDOR e os pets lutam sozinhos; o dono só torce. Regra em **`functions/api/_duel.js`** (+ `_duel.d.ts`), sobre o espelho do núcleo `_combate.js` (`fightSteps`). Fluxo: `GET opponents` devolve cada oponente com `duel: { level }` e `me.duel`, **sem semente e sem a ficha** (a ficha vem do SAVE, `loadDuelSide`, com o teto S1 `maxLevelFor`); `POST duelStart { id, opponentId }` carrega as duas fichas, faz `forfeitPending` de duelo anterior, recusa `429 daily limit` (`MATCHES_PER_DAY` = 5), sorteia a semente (`crypto.getRandomValues`), grava `rank:<season>:<saveId>.pending` com as fichas CONGELADAS e responde `{ seed, me, opp, matchesLeft }`; `POST match { id, opponentId, taps?, forfeit? }` usa a semente e a ficha do SERVIDOR (`taps` = 20 inteiros em [0,16], `sanitizeTaps`; `cheers` ainda é aceito como apelido antigo), roda `simulateDuel` e fecha em `settleMatch` (dono único dos pontos). **Desistência = derrota**; `forfeit` sem duelo aberto → 409 `no open duel`. **Idempotência (QA-4/QA-5, 26/10/2026):** o reenvio do MESMO `match` (resposta perdida na rede) devolve o resultado já liquidado com `replayed: true`, sem gastar partida; oponente que sumiu no meio (perfil apagado, PvP desligado, oculto) CANCELA sem custo — `404 opponent unavailable` com `cancelled: true`, a partida volta (`refundOpenDuel`) e ninguém pontua. Vantagem elemental: o Torneio segue NEUTRO (`elementScale` 0); só a Guerra de Guildas usa 0,5 (`_elementoBase.js`). Régua: `_duel.v3.test.js`, `community.duel.v3.test.js`, `combate.parity.test.js`. |
| **Identidade** | O `id` de ENTRADA é sempre o `saveId` do PRÓPRIO dono (autenticado). Alvos de outra pessoa (`friendId`, `opponentId`, o `?id=` do `player`) chegam como **pid público** e são resolvidos pelo índice `pid:<pid>`. **Nenhuma resposta pública devolve `saveId`** — há teste travando. |
| **Credencial** | `SEASON_ADMIN_KEY` — `wrangler secret` (e o MESMO valor no worker de push). |
| **Sem ela** | `closeSeason` não pode ser chamada e os troféus não são entregues. |
| **Régua** | `community.test.js`, `community.coop.test.js`, `community.pvpGate.test.js`, `community.directoryConsent.test.js`, `community.playerOracle.test.js`, `community.duel.v3.test.js`, `bond.parity.test.js`. |

**O gate de PvP** (`BOND_PVP_MIN_LEVEL`) é decidido pelo SERVIDOR
(`functions/api/_bond.js`, ação `profile`), porque o cliente é editável. A recusa
volta como `pvpBlocked: true` **com os números** (`minBondLevel`, `bondLevel`), e
o cliente exibe esses, nunca uma constante própria.

### 2.11-A A Guilda — `/api/guild`

| | |
|---|---|
| **Para quê** | A roda de até 12: Bosque, fio, marés, gestos, Feira, resgate, a Guerra de Guildas 4×4, a Casa/Loja e os três prédios do clã ([02 §56-A](02-REGRAS-DE-NEGOCIO.md#guilda)). O estado continua nas chaves `coop*` (sem migrar para `guild:*`). |
| **Cliente** | `src/utils/community.ts` (bloco da Guilda: `getGuild`, `createGuild`, `joinGuild`, `guildThread`, `guildGesture`, `hitGuildRaid`, `getGuildRewards`, `claimGuildReward`, `leaveGuild`, …). Toda chamada leva `Authorization` e o `dayKey` do JOGADOR. |
| **Servidor** | `functions/api/guild.js` (a resposta, `vistaDaGuilda`) + `functions/api/_coop.js` (estado e constantes) + `functions/api/_profile.js`. Classe de rate limit ÚNICA e leve: `GUILD_LIGHT` (60/min/IP, bucket `guild`) — nenhuma ação varre prefixo. |
| **Credencial** | `GUILD_MEMBER_SECRET` — `wrangler secret put GUILD_MEMBER_SECRET` (só o NOME aqui, nunca o valor). Entra no id opaco do membro (`idOpacoDoMembro`, SHA-256 de `soulmon-guild-member|<segredo>|gid|save`, 16 hex). |
| **Sem ela** | A rota funciona (o sal é vazio) mas o `memberId` fica **previsível** para quem conhece guilda + save — o segredo existe para que ele seja opaco de verdade. ⚠️ **Depende do dono**: criar o segredo em produção (item no STATUS). |
| **Ações novas desde 11/10/2026** (`GUILD_ACTIONS`, 36 no total) | `guildWar` (GET) e `guildWarSeek` (POST — o servidor monta os esquadrões a partir dos SAVES, pareia por tamanho e resolve com o combate v3; uma guerra por guilda por dia do jogador; vantagem elemental a meio efeito) · `guildDonate` (doação de Bits à Casa; o servidor devolve `accepted` e o cliente só desconta isso; `429 daily limit`) · `guildShopBuy` (Loja do clã, `_lojaCla.js`: o cliente manda só `itemId` + `opId`, preço e saldo são do servidor, idempotente por `opId`, `409 already owned`/`not enough bits`/`op reuse`; catálogo `LOJA_CATALOGO`, só cosmético da Casa, nada por pessoa) · `guildSlot` (peça no slot da Casa) · os prédios do clã `claPraca`/`claPracaSlot`/`claPresente`/`claPresenteClaim`, `claPlantio`/`claPlantar`/`claSortear`/`claRegar`/`claProteger`/`claColher`, `claMisterio`/`claMisterioEnviar`/`claMisterioTarefa`/`claMisterioClaim` (`_claPraca.js`, `_claPlantio.js`, `_claMisterio.js`; limites no dia do SERVIDOR em UTC). |
| **A Feira do Chefe e o Desafio — LIGADA em 29/10/2026** | `guildFeira` · `guildFeiraAttack` · `guildFeiraClaim` · `guildFeiraTrailStart` · `guildFeiraTrailDone` (`_feira.js`). A constante `FEIRA_CHEFE_DESDE` passou de `2099-12-31` (desligada) para **`2026-10-29`** em `7b5e8ca172` (decisão do dono em modal); a variável de ambiente de mesmo nome, se for uma data válida, manda sobre ela (§0.1). Com a Feira desligada as ações respondem **404 `not available`**. Portões do Vínculo (`_gates.js` › `BUILDING_GATES`): `hall.feira` 5, `hall.guilda`/`hall.grove` 2, `arena.guerra` 3. Referência: [06 `api-workers.md`](06-REFERENCIA/api-workers.md) (`_feira.js`). |
| **Famílias de chave e TTL** | `coop:<gid>`, `coopOf:<save>`, `coopCode:<code>`, `coopFio:<gid>:<save>` — 120 d, **sem TTL com Bosque plantado** · `coopCk` 120 d · `coopMem` 120 d · `coopGest` 3 d · `coopHit` 21 d · `coopRaidOk`, `coopClaim`, `coopPart` 60 d · `coopDias`, `coopShell`, `coopScenes` sem TTL (progresso/conquista do titular). Detalhe: [07 §8.1](07-DADOS-E-SAVE.md). |
| **Exclusão e exportação** | `account.js`: a exclusão chama `coopLeave(…, { exclusao: true })` + `apagarClaims`; a exportação traz só o que é do titular (o fio próprio, a participação, resgates e cenários) — nunca outro membro, nunca dano. O inventário da exclusão diz o que expira por TTL (`coopHit`, até 21 dias). |
| **Telemetria** | seis eventos `guild_*` ([§2.12](#212-telemetria--apimetrics)), sem id de guilda nem pid. |
| **Push / widget** | **Nenhum**: `guild.semPush.contract.test.js` trava que a Guilda nunca notifica; o widget não tem superfície própria da Guilda (WPG-14); desde 29/09/2026 o widget A mostra só o NOME do estágio do Bosque (chave `grove_stage`, da memória local `groveLocal`, sem número nem membros — `widgetSemCobranca.contract.test.ts`). |
| **Régua** | `functions/api/guild.*.test.js`, `guildReward.contract.test.js`, `account.guildBosque.test.js`, `account.guildFeira.test.js`, `community.coop.test.js` (aliases), `src/utils/guildRules.parity.test.ts`. |

### 2.12 Telemetria — `/api/metrics`

| | |
|---|---|
| **Para quê** | Medir produto sem medir pessoa. |
| **Cliente** | `src/utils/telemetry.ts` — `track`, `flush`, `installTelemetryAutoFlush`, `isTelemetryEnabled`/`setTelemetryEnabled`, `telemetryConsentCopy`. `ENDPOINT = '/api/metrics'`, `MAX_QUEUE = 200`, `MAX_BATCH = 100`. Todo evento tem esquema declarado em `EVENT_SCHEMA` e passa por `sanitizeEvent`. `TELEMETRY_UNLOCK_REASON` ganhou `revealDemo: 4` em 20/09/2026 (`a1181a5b`, REGISTRO 13.19 — o convite do reveal demo), e `unlock_view`/`unlock_dismiss` aceitam `reason` 0–4 (era 0–3); `unlockReasonCode` traduz `'reveal-demo'`. O 4 de `TELEMETRY_PURCHASE_REASON` continua `onboarding` de propósito — a compra que sai do reveal demo É a compra do onboarding, e o balde tem de ser um só. |
| **Guilda (29/09/2026)** | Seis eventos, espelhados em `EVENT_SCHEMA` nos dois lados: `guild_create` (sem prop), `guild_join` (`size` 2–12), `guild_leave` (`size` 0–11, `weeks` faixa 0–3), `guild_thread` (`kind` 0–1; 1 reservado à semente, G3), `guild_raid` (`outcome` 0 rodada · 1 dissipada vista · 2 recuou vista), `guild_stage` (`level` 1–5). O servidor conta `<evento>.<prop>_<valor>` iterando o SCHEMA (nunca as props recebidas) e confere a allowlist com `hasOwnProperty`. **Nunca** id de guilda, pid, nome ou contagem por pessoa. ⚠️ O convite da Guilda para quem não tem conta reusa o motivo `shop` do `unlock_view` (não há motivo próprio — depende do dono/servidor). |
| **Servidor** | `functions/api/metrics.js`. Escrita: agrega em **uma chave por DIA** (`m:YYYY-MM-DD`) com contadores somados de todo mundo. Leitura: `GET`, janela FECHADA lida chave a chave (nada de `list()` por prefixo), com teto `MAX_READ_DAYS`. Espelha o cliente: `EVENT_SCHEMA` com `reason` 0–4 em `unlock_view`/`unlock_dismiss` e `REASON_LABEL` com o 5º rótulo `reveal_demo` (20/09/2026); `PURCHASE_REASON_LABEL` = os 4 primeiros + `onboarding` (`REASON_LABEL.slice(0, 4)`), para o 4 da compra não virar `reveal_demo`. A régua da paridade cliente↔servidor é `src/utils/telemetry.test.ts`. |
| **Credencial** | `METRICS_ADMIN_KEY` — `wrangler secret`, enviada num header próprio (`METRICS_KEY_HEADER`), comparada por `secretEquals`. |
| **Sem ela** | ⚠️ **A rota de leitura responde 404, não 401**, de propósito: um 401 confirmaria que o endpoint existe. Ou seja, a métrica está instrumentada e agregada e **ninguém consegue ler nada** até o segredo existir. |
| **Leitura fora do app** | `tools/metrics-read.mjs` (transporte, janela livre) + `tools/metricsReport.mjs` (regras puras, testadas em `tests/metricsReport.test.ts`). `METRICS_ADMIN_KEY=… node tools/metrics-read.mjs --from … --to …`, ou `--file resposta.json` offline. **O funil da semana** (desde `42b07bec`, decisão #18): `METRICS_ADMIN_KEY=… node scripts/metrics-report.mjs [--url $APP_URL] [--to AAAA-MM-DD] [--days 7] [--full]` — últimos 7 dias, tabela install → onboarding_step → first_task_done → day_active → week_active → retained d1/d7/d30 com `n` e "% do topo" (rotulada APROXIMADA: o agregado é por dia de evento, sem coorte); `--full` anexa o relatório de `tools/metricsReport.mjs`. Saídas: 0 ok · **2 sem chave** · 3 chave recusada (404/401) · 4 outro HTTP · 1 erro. |
| **Régua** | `functions/api/metrics.test.js`, `tests/metricsReport.test.ts`. |

Três princípios que são responsabilidade do arquivo de servidor: **agregados,
nunca conteúdo** (não há chave por usuário nem lista de eventos — não é política
de retenção que alguém precisa lembrar de aplicar, é a **forma do dado**);
**pseudônimo, nunca identidade** (`batch.id` é validado e DESCARTADO; o `saveId`
não aparece em lugar nenhum do arquivo); e **sem PII derivável** (a maior
resolução é o DIA, e dia fora de `MAX_DAY_SKEW_DAYS` é descartado).

⚠️ **O que este agregado não consegue responder, e não é bug**: **retenção por
COORTE de instalação** e conversão em N dias. A chave é o dia do EVENTO; não
existe dia de instalação em lugar nenhum, logo não existe coorte. O que existe
é `retained.d1/d7/d30` — o maior marco cruzado por pessoa, contado no aparelho
e emitido 1× por marco (`d7` = "voltou em algum dia de D7–D29"). ⚰️ Até
`f4086ce0` este parágrafo e o `notes.unreadable` do próprio GET diziam "retenção
D1/D7/D30" ilegível, contradizendo o `retained.d7` do mesmo JSON (review 07, QA
Rodada 1); desde `a6c1cd8a` a resposta traz `notes.retained` com a definição.

**Mais três mudanças de `a6c1cd8a`** (review 07): `app_open.source` aceita **4 =
`invite`** (`?src=convite`, o link do E0; `TELEMETRY_OPEN_SOURCE.invite` no
cliente, `OPEN_SOURCE_LABEL` no servidor e em `tools/metricsReport.mjs`;
`limparOrigemDaUrl()` apaga o `?src=` da URL depois do `track` do boot, senão um
favorito reemitia `invite` toda semana) · `applyAggregate` soma
**`week_active.active_days.<n>`** (⚰️ o campo saía do aparelho, passava pelo
schema e morria no servidor — custo de privacidade sem retorno; é a leitura da
hipótese de hábito do E0) · no cliente, evento gerado com a **aba oculta** vai
para a fila `soulmon-telemetry-hidden` e é reprocessado quando a aba volta
(⚰️ era descartado — o `day_active` da virada à meia-noite morria com o PWA em
segundo plano; ver `07-DADOS-E-SAVE.md` §4.1).

### 2.13 `/api/config` e `/api/account`

| Rota | Para quê | Credencial |
|---|---|---|
| `GET /api/config` | Configuração **pública**: `authRequired` (= `!!FIREBASE_PROJECT_ID`) e `transcribeAvailable` (= `GROQ_API_KEY` presente, porque a rota exige a chave). Existe por causa do overlay, que precisa saber se deve **exigir login** ou ainda aceitar e-mail digitado. `Cache-Control: public, max-age=300`. Desde 11/10/2026 também `billingDisabled` e `chatDisabled` (os interruptores de [§0.1](#01-interruptores-listas-e-ajustes--só-o-nome-29102026)). Cliente: `src/utils/serverConfig.ts`; no desktop, `isAuthRequired` em `desktop/renderer/src/cloudSync.ts` (que em caso de dúvida responde `true`). | nenhuma própria |
| `/api/account` | **Exportação** (`?action=export`) e **exclusão** (`POST ?action=delete-request` → `delete-confirm`) do que o servidor guarda. Cliente: `src/utils/accountData.ts`, `src/components/AccountDataSection.tsx`. | `FIREBASE_PROJECT_ID` (via `requireVerifiedOwner`) |

⚠️ **`/api/account` é FAIL-CLOSED**, ao contrário do resto do app. O `saveId` é
SHA-256 do e-mail por algoritmo público: com fail-open, `delete-confirm` seria
"apague a conta de qualquer um cujo e-mail eu conheça" e `export` seria "baixe a
vida de quem eu souber o e-mail". Enquanto `FIREBASE_PROJECT_ID` estiver
desligado, as duas respondem **503 `auth-unavailable`** — **indisponível é melhor
que perigosa**.

O que a exclusão faz, declarado no cabeçalho de `account.js`: **APAGA** o save,
`profile:`, `pid:`, `rank:` (todas as seasons), `gifts:`, a menção do usuário na
lista de amigos de terceiros, desde `42b07bec` (decisão #23) as inscrições
`push:*`/`fcm:*` de `PUSH_SUBSCRIPTIONS` da conta — desde `a6c1cd8a` pelo
**índice inverso `pushidx:<saveId>`** (custo fixo, sem `list`; ⚰️ a varredura por
prefixo com teto `MAX_SCAN_PAGES = 20` ficou como fallback só para conta sem
índice, porque estourava o teto de subrequests com ~900 inscrições; registro sem
`saveId` fica fora do alcance, e o cliente chama os `DELETE` dos dois canais
**antes** do `delete-confirm`: `revokePushBeforeDelete` em
`src/utils/accountData.ts`, agora com teto de 8 s por canal) e, desde `a6c1cd8a`,
os **sprites de IA** (`sprite:img:`/`sprite:lock:` por prefixo com o saveId e o
`sprite:blob:` que cada cache aponta; blob órfão declarado em `NOT_INCLUDED`);
**GRAVA** a lápide `del:done:<saveId>` (30 dias, `_accountTombstone.js`) ANTES da
primeira destruição — desde `592e2c14` **toda rota autorizada** responde **410
`account-deleted`** (+ `deletedAt`) enquanto ela viver (⚰️ só `save.js`), e o cliente
(`cloudSave.ts` › `reagirContaExcluida`) guarda o local em `CONFLICT_BACKUP`, limpa o
aparelho e desloga; **um login posterior à exclusão REABRE** (`auth_time` > `at`,
`gateTombstone` — ⚰️ a R1 bloqueava o próprio titular por 30 d, em loop; provisório #56),
e o login confere a lápide ANTES do onboarding (`checarContaExcluidaNoLogin`);
**SAI do grupo cooperativo** (`_coop.js` › `coopLeave`, passo 3b, desde `592e2c14` —
⚰️ o membro apagado ficava fantasma por 120 d e a meta nunca mais fechava);
**MINIMIZA** `ent:<saveId>` (some o que é USO —
`aiLifetime`, `adDate`, `adCount` — e ficam os campos de DINHEIRO); e
**ANONIMIZA** o vínculo `ord:<orderId>` (no D1, `order_claims.save_id`) — **REGISTRO §49, decisão do dono de 14/10/2026: excluiu a conta, paga de novo, mesmo voltando com o mesmo e-mail**. No passo 5c, `anonimizarClaims` reescreve o dono do vínculo para a SENTINELA `deleted` (`CLAIM_EXCLUIDA`): a trava "um comprovante, uma conta" continua de pé, sem nenhum saveId ou e-mail, e o `ent:` minimizado vira `tier: 'demo'` e `credits: 0` (só a CORTESIA do dono segue `paid`); ⚰️ o texto antigo dizia que o direito pago "sobrevive" à exclusão. O `ent:` minimizado ainda guarda `aiLifetime.sprite`, `aiForms` e `aiRegen`, para excluir e relogar não devolver gerações. Desde 25/10/2026 a exclusão também **APAGA** o ranking (`rkme:` e a linha `rk:*`), o lastro do Endless Rift (`riftlayers:`), os prêmios do Rift pendentes/pagos (`rift-pending:`/`rift-paid:`), o apelido reservado (`nick:`/`nickof:`) e o **e-mail do titular gravado em `sprite:img:*`**; a exportação mostra esse e-mail. A **exportação** (`action=export`) devolve `friends[]`
como **pid público** (`pidDeAmigo`, desde `592e2c14` — ⚰️ era a única rota que
entregava saveId de terceiro) e declara em `naoIncluido` a lápide (30 d). Desde 30/09/2026 o campo `what` de cada item de `NOT_INCLUDED` e as linhas de `apaga`/`minimiza` montadas em `plan()` de `account.js` estão em **inglês** (base do produto; o par `pt-BR`/`en` do texto longo já existia) — `what` é rótulo estável para quem lê o JSON, então quem o compara por texto precisa reler. ⚰️ O
vínculo Steam (`ord:steam:own:*`) também era declarado ali como retido por 5 anos;
desde **22/09/2026** ele é **APAGADO na exclusão** (decisão do dono **#54** — o
SteamID64 é identificador de terceiro e a justificativa fiscal não cobre licença
de posse), no passo **5b**, por chave **derivada** de `consumedOrders`
(`steamLicenseKeysOf`) e não por varredura.

**A ordem do `delete-confirm` mudou em `a6c1cd8a`** ("o que pode falhar vai
primeiro", `03-arquitetura-r1.md` §2.4): token → inventário → lápide → varredura
de amigos (a única que ainda pode estourar; se estourar, a lápide é desfeita e
sobe 500 — retry com o mesmo token em 15 min) → **daqui nada lança** (cada passo
em `try/catch`, o que falhou vai em `executado.falhou`) → 3b `coopLeave` (desde
`592e2c14`) → push por índice (`via: 'index+scan'` se o índice estiver cheio) →
sprites → minimizar `ent:` → `rank:`/`gifts:`/`pid:`/`profile:` → **o save por
último** → o token só sai se nada falhou. ⚰️ O save era o PRIMEIRO delete: o retry
encontrava 404 com o token ainda válido e nada mais para apagar. A resposta traz
`executado.inscricoesDePushApagadas`, `spritesApagados` e `falhou`.

### 2.14 `/api/rtdn` — notificações da Play em tempo real

| | |
|---|---|
| **Para quê** | A Google avisa (Pub/Sub **push**) que uma assinatura mudou — renovou, cancelou, expirou — para a vitrine abrir e fechar no tempo certo, sem esperar o jogador reabrir o app. |
| **Servidor** | `functions/api/rtdn.js` (`POST`) + `functions/api/_pubsubAuth.js`. **Autentica o JWT OIDC do Pub/Sub** (`verifyPubsubPush`: RS256 contra o JWKS da Google; confere `iss`, `aud`, `email`, `email_verified`, `exp`/`iat`; nunca lança) — sem ele, **401**. **O payload nunca é confiado:** só aponta um `purchaseToken`; a verdade vem de um novo GET em `purchases.subscriptionsv2` (`fetchSubscriptionV2`, `interpretSubscription`, `resolveSubscriptionRoot`). Só o ESTADO da assinatura é escrito (`ent.sub`, via `applySubscriptionState`); **nunca** tier, Créditos ou item entregue — fechar a vitrine não retira o que a pessoa já tem. |
| **Idempotência** | Por `messageId` (D1 `rtdn_messages`, `migrations/0003_rtdn_messages.sql`; sem `DB` cai no KV): o Pub/Sub entrega "pelo menos uma vez" e reentrega por até 7 dias; a linha vence em 8 dias. |
| **Respostas** | 401 sem JWT válido · 503 sem configuração (`pubsubAuthConfigured`) · 2xx quando tratada OU quando não há nada a fazer · 5xx quando a Google ou o armazenamento falhou, para o Pub/Sub tentar de novo com recuo. Log estruturado, token sempre mascarado (`maskToken`). |
| **Credencial** | `RTDN_AUDIENCE` (a URL exata do endpoint configurada como audience na assinatura push), `RTDN_PUSH_SA_EMAIL` (a service account de push), mais `ANDROID_PACKAGE_NAME` e `GOOGLE_PLAY_SERVICE_ACCOUNT` (as de sempre) — nomes só, §0. |
| **Régua** | `functions/api/rtdn.test.js`. |

### 2.15 Rotas do GM e do beta (11/10 a 28/10/2026)

As rotas de ADMIN (`GET /api/crash`, `top-ai`, `sprite-admin`, `gm-*`) respondem **404 sem a variável** (`METRICS_ADMIN_KEY`) ou **403 `forbidden` idêntico** a quem não é GM — nenhuma confirma que existe.

| Rota | Para quê | Quem entra |
|---|---|---|
| `GET /api/crash` · `POST /api/crash` | Diagnóstico de falhas do beta sem SDK de terceiro: `sanitizeReport` é allowlist, o servidor re-limpa (`scrub`) e agrupa por assinatura (`crash:<dia>:<assinatura>`, TTL 14 d). Cliente: `src/utils/crashReport.ts`; leitura: `node scripts/crash-report.mjs`. `CRASH_DISABLED` → 202 sem gravar. | `POST` anônimo (10/min/IP); `GET` com `X-Metrics-Key` = `METRICS_ADMIN_KEY` |
| `GET /api/top-ai?day=` | Top 20 consumidores de IA por bucket (`chat`, `sprite`, `transcribe`, `suggest`), `saveId` truncado em 8. `node scripts/top-consumidores.mjs`. | `X-Metrics-Key` |
| `POST /api/sprite-admin?action=release-form` | Apaga a arte em cache de UMA forma e devolve 1 unidade de `aiForms[formId]` (o vitalício não volta). `node scripts/liberar-forma.mjs`. | `X-Metrics-Key` |
| `GET`/`POST /api/rankings` | Placar genérico por jogo e período (`_rankings.js`: `RANKED_GAMES`, semana ISO ou mês UTC, faixas de madeira a diamante); `POST { id, game, score, period? }` guarda o MELHOR score. | ID token do dono do `id` (`authorizeSaveAccess`); 60/min/IP |
| `GET`/`POST /api/gm-rift-payout` | Revisão dos prêmios mensais do Endless Rift: o fechamento só GRAVA o top 3; os Créditos (50/25/10) saem quando o GM aprova (`approveRiftPrize`, idempotente; `rejectRiftPrize`). Lastro do mês e histórico por jogador à vista. | ID token de e-mail em `ADMIN_EMAILS` |
| `GET /api/gm-soulmons` | Lista paginada dos Soulmons gerados (24 por página; imagem, formId, nome do perfil público, e-mail do titular, quando gravado). | ID token de e-mail em `ADMIN_EMAILS` |
| `GET /gm/soulmons` · `GET /gm/rift` | Cascas HTML sem dados e sem link no jogo; login Firebase (Google) no navegador usando `FIREBASE_API_KEY`/`FIREBASE_AUTH_DOMAIN` do `vars`. Como as Pages Functions não herdam `public/_headers`, a resposta leva `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `noindex` e o SDK do Firebase com SRI (`functions/gm/_gmPage.js`, versão fixa `FIREBASE_VERSION`). | quem abrir; os dados só vêm com o ID token do GM |


---

## 3. Deploy

### 3.1 A URL de produção, e as fontes que têm de concordar

**`https://soulmon.mateus-sprnd.workers.dev`**

| Fonte | Símbolo |
|---|---|
| `capacitor.config.json` | chave `server.url` |
| `desktop/renderer/src/config.ts` | `APP_URL` |
| `desktop/electron/main.js` | `FULL_APP_URL` (com override por `process.env.SOULMON_APP_URL`) |
| `workers/wrangler.toml` | `[vars] APP_URL` |

**Quem obriga as fontes a concordarem é `src/deploy/appUrl.contract.test.ts`** —
essa é a régua viva, não esta lista. Ele tem quatro casos: todas as fontes
declaram uma URL (o extrator não pode falhar em silêncio), nenhuma casca aponta
para endereço de outro produto, as quatro concordam, e o artefato do `cap sync`
não é versionado (senão vira uma quinta fonte da verdade).

⚰️ Até 26/08/2026 o `CLAUDE.md` afirmava que a URL ainda era a do fork
(`digiapp-a5e.pages.dev`) e **mandava não trocar**. Era falso — a migração já
tinha acontecido —, e um agente que lesse aquilo decidiria errado sobre deploy.
O guard nasceu de um estrago real: o primeiro APK do CI abriu o outro app com o
nome e o ícone do Soulmon.

### 3.2 Web — Cloudflare Pages

- **`main` é a branch de produção.** O push publica sozinho em ~2 min.
- **`dist/` é COMMITADO** (481 arquivos rastreados em 09/09/2026). O CF também
  builda, mas o commit é o que garante o conteúdo.
- `wrangler.jsonc` declara: `main` = `./dist/_worker.js/index.js`, `assets` =
  `./dist` com `not_found_handling: "single-page-application"`, os três KV
  (`SOULMON_SAVES`, `DIGIAPP_SAVES`, `PUSH_SUBSCRIPTIONS`), o D1 (`DB` →
  `soulmon-billing`) e `vars` (`FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `SIMULADOS_ON` — §0). ⚠️ **Desde 20/10/2026 há saves reais** (teste fechado na Play, `126a7d5148`): trocar o `id` do binding `SOULMON_SAVES` ou apagar o `DIGIAPP_SAVES` exige backup e conferência antes (comentário do próprio `wrangler.jsonc`; `scripts/backup-saves.mjs`) — a "separação sem migrar" de 07/09/2026 não se repete.
- **Fluxo**: desenvolva na branch de trabalho → commit → push → merge **ff-only**
  em `main` → push da `main` → volte para a branch.

### 3.3 CI — os seis workflows

| Workflow | Dispara em | `permissions` | O que faz |
|---|---|---|---|
| `ci.yml` — *CI (typecheck + testes)* | `pull_request`, `push: [main]`, `workflow_dispatch` | `contents: read` | **Quatro jobs em paralelo desde 11/10/2026** (`76107cf15a`; era um job em série): `vendor` (integridade do `vendor/`, sha256 do blob × `_provenance.json`, 10 min) · `tipos` (matriz de 3 `tsc` — app `npx tsc --noEmit`, overlay `npx tsc -p desktop/tsconfig.json --noEmit`, servidor `npx tsc -p tsconfig.server.json --noEmit`; 15 min) · `testes` (`npx vitest run --shard=N/4`, 4 runners; 20 min) · `gate`, o AGREGADOR que mantém o nome antigo *tsc + vitest* (`needs` + `if: always()` + conferência explícita do resultado de cada um: só passa se TODOS passarem, para a proteção de branch continuar valendo). Node 22, `npm ci`. `concurrency` cancela o run anterior **exceto** na `main` (vermelho na main tem que aparecer). |
| `android-build.yml` — *Android APK Build* | `push: [main]` (⚰️ `version-b`, branch do DigiApp, saiu em `f9faf7a7`), `workflow_dispatch` | `contents: read` | Job `build`: `npm ci` → `npm run build` → Java 21 → SDK Android → `npx cap sync android` → `./gradlew assembleDebug`, artefato `soulmon-debug-<sha>` (⚰️ `digiapp-debug-<sha>` até `4a8b8049`), artefato `digiapp-debug-<sha>`. Se os secrets de keystore existirem, também restaura o keystore, builda o **bundle assinado** (`.aab`, artefato `soulmon-release-<sha>`) e **apaga o keystore do runner** com `if: always()`. Job `smoke`: baixa o APK, liga KVM e roda um smoke em emulador (`reactivecircus/android-emulator-runner`), com evidência em artefato. |
| `docs-sync.yml` — *docs-sync* | `push: [main]` (ignora `docs/manual/**` e `dist/**`), `workflow_dispatch` | `contents: read` | Mede o delta entre `docs/manual/.sincronizado.json` e o HEAD e roda o guard do manual; o 2º job (o `doc-mantenedor`) só roda com delta E com o segredo `ANTHROPIC_API_KEY` — sem ele é PULADO, não falha. |
| `desktop-build.yml` — *Desktop Windows Build* | `push: [main]` com filtro de caminhos (`desktop/**`, `src/utils/sprites.ts`, `src/assets/**`, o próprio arquivo), `workflow_dispatch` | **`contents: read`** | **SÓ BUILDA. NÃO PUBLICA NADA.** Produz artefato de Actions (retido 30 dias, que ninguém instala sozinho). |
| `desktop-release.yml` — *Desktop Windows Release* | **só `push: tags: 'v[0-9]+.[0-9]+.[0-9]+'`**; **sem `workflow_dispatch`** | **`contents: write`** | O **ÚNICO** caminho de publicação do desktop: `electron-builder --publish always` cria/atualiza um GitHub Release. |
| `sync-irmaos.yml` — *Sync repos irmãos* | `schedule: '17 6 * * 1'` (segunda, 06:17 UTC), `workflow_dispatch` | `contents: write` + `pull-requests: write` | Roda `npm run vendor:class-system` **e** `npm run sync:oracle-data` sobre o MESMO clone, na MESMA execução, e verifica que `vendor/class-system/_provenance.json:sha` bate com o `_provenance.sha` do `classSystem.data.json`. **NUNCA empurra para a `main`** — abre PR. |

**Por que `desktop-build` e `desktop-release` são dois ARQUIVOS e não dois jobs:**
o poder de publicar acompanha o `permissions:` do arquivo. Enquanto isso morava
junto e disparava em `push` de branch de rascunho, um `git push` publicava um
GitHub Release — que é a **fonte do auto-update** do `electron-updater`
(`autoDownload` + `autoInstallOnAppQuit` em `desktop/electron/main.js`) — e
instalava sozinho um `.exe` **sem assinatura Authenticode**
(`CSC_IDENTITY_AUTO_DISCOVERY: 'false'`) na máquina de quem tem o desktop.
**Publicar não pode ser efeito colateral de commitar.** Um arquivo que nunca
dispara em branch não tem como publicar por acidente.

**O padrão da tag é RESTRITO de propósito**: `v*` casaria com `vamos`,
`v2-teste`, `vai-que-cola`. O glob exige três números — `v1.2.3` entra; `v1.2`,
`v1.2.3-beta` e `vqualquercoisa` não.

**Todas as actions estão presas por SHA** (S-6 da auditoria de suprimentos), com
o comentário da versão ao lado **obrigatório** — sem ele o arquivo vira 40
caracteres opacos que ninguém ousa atualizar. Tag móvel (`@v4`) é reapontável
pelo dono da action; o SHA não.

⚰️ **O GitHub Actions ficou PARADO POR COBRANÇA de 16/09/2026 até o início de outubro** (achado da QA Rodada 1, #48: 339 runs em `failure` em segundos, *"recent account payments have failed…"*; re-medido em 30/09/2026, `{"n":294,"success":0}`). **Voltou:** em 29/10/2026 `gh run list --workflow ci.yml` mostra `success` entre 11/10 e 21/10/2026, o `android-build.yml` fecha `success` (incluindo o run de 29/10/2026) e o `docs-sync` também; o `ci.yml` mais recente (29/10/2026) rodou 9 min 33 s e terminou em `failure` — a suíte, não a cobrança (`gh run list --workflow ci.yml --limit 5`). A primeira linha do runbook do `soulmon-operador` continua sendo `gh run list --limit 5`: o CI pode falhar sem que a produção caia, porque o Cloudflare deploya sozinho no push da `main`, sem passar pelo Actions. O substituto local (`npm run portoes`, `docs/HANDOFF-LOCAL-SEM-ACTIONS.md`) segue valendo para o que roda fora do Actions.

**Secrets do CI**: `ANDROID_DEBUG_KEYSTORE_BASE64` (a chave de DEBUG fixa do dono, 07/10/2026: sem ela cada build gera um `debug.keystore` novo no runner, o SHA-1 muda e o Firebase recusa o login Google; só vale para o APK debug), `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (assinatura do bundle),
`SIBLING_REPOS_TOKEN` e `SYNC_PR_TOKEN` (do `sync-irmaos.yml`), mais o
`GITHUB_TOKEN` automático. ⚠️ `secrets` **não pode ser lido num `if:` de passo** —
por isso o `android-build.yml` decide com um step que grava `outputs.ready`.

### 3.4 APK

O **APK carrega a URL de produção** (`server.url` em `capacitor.config.json`),
então **mudança web NÃO precisa de APK novo**. Só mudança em `android/` precisa.
(Ex.: 29/09/2026 — os 11 `drawable-nodpi/sprite_corvo_*.png`, a linha
`widget_grove` e as chaves `pet_line`/`grove_stage` do `SoulmonWidgetPlugin.kt`
só chegam ao widget com APK novo, buildado pelo `android-build.yml`.) ⚰️ O APK/AAB também se gera na máquina do dono (`npm run build` → `npx cap sync android` → `.gradlew assembleDebug` / `bundleRelease`, JDK 21 — `docs/HANDOFF-LOCAL-SEM-ACTIONS.md` §2) — o caminho que valeu enquanto o Actions esteve parado (§3.3); com o Actions de volta, o `android-build.yml` também o produz. ⚠️ `android/capacitor.settings.gradle` é GERADO por `npx cap sync` e foi commitado com caminhos ABSOLUTOS da máquina do dono (`D:/Soulmon/repo/node_modules/...`): num runner o `cap sync` do workflow o reescreve. Texto de interface nativo é **inglês primeiro** (30/09/2026): `res/values/strings.xml` é o inglês e `res/values-pt/strings.xml` o PT-BR (`widget_description`).
O artefato fica em `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`, com o nome
`soulmon-debug-<sha>` (desde `4a8b8049`).

**Pacote e versão na Play (29/10/2026):** o `applicationId`/`namespace` e o `package` do `AndroidManifest.xml` são **`com.soulmon`** (`610a6728c0`, 18/10/2026 — ⚰️ `com.hexervoodoom.soulmon`; os fontes Kotlin/Java moram em `android/app/src/main/java/com/soulmon/`, e o `assetlinks.json.js` declara `com.soulmon` por padrão); `capacitor.config.json` › `appId` também. `versionCode` **22** / `versionName` **1.3.0-beta2** (`android/app/build.gradle`, `432ccfe13e`, 21/10/2026 — o primeiro AAB com `screenOrientation="portrait"` no `MainActivity` e os drawables `sprite_starter_*` do widget; o resto do beta 2 vai pelo Worker via `server.url`; ⚰️ 21 / 1.3.0-beta1 em `7f1fd8a93c` (20/10, já com `google-services.json` e o login Google nativo) e 15 / 1.1.4 em `4a8b8049`). **O app está em TESTE FECHADO na Google Play desde 20/10/2026** (`126a7d5148`; o próximo passo é produção) e a Play recusa `versionCode` repetido — bump manual, sem automação, a cada upload. Histórico do preparo (etapa 6 do QA geral, `4a8b8049`, decisão #16): `setObfuscatedAccountId`, preço localizado e o widget novo; `compileSdkVersion` /
`targetSdkVersion` **36** (`android/variables.gradle`, eram 35 —
`android-build.yml` fecha `success` com o SDK 36 — `gh run list --workflow android-build.yml`, 29/10/2026); ⚰️ "`billing-ktx` fica em
6.2.1 porque `BillingPlugin.kt` chama `enablePendingPurchases()` sem argumento" valeu só
de `4a8b8049` a `a6c1cd8a` — a Play RECUSA PBL < 8 (§2.8), então em `a6c1cd8a` o plugin
foi portado para a **8.3.0** (guard `billingPbl8.contract.test.ts`; compile sem prova
enquanto o CI estiver parado, §3.3). A ficha pronta para colar está em
[`PLAY-FICHA.md`](../PLAY-FICHA.md) e o passo a passo do console em
[`PLAY-LANCAMENTO.md`](../PLAY-LANCAMENTO.md) (§A–§I, etiquetas `[dono digita segredo]` /
`[submissão: confirmar]` / `[squad pode dirigir o Chrome]`; §A.0 Actions e §G Billing 8
desde `a6c1cd8a`).

**Versão única (`a6c1cd8a`, design-critic B1):** `versionName` **1.3.0-beta2** (29/10/2026; era 1.1.4) é o mesmo
`version` do `package.json` (⚰️ `0.1.0`), e é dele que o Vite injeta
`__APP_VERSION__` (`define` em `vite.config.ts`; `vitest.config.ts` repassa) para
`FeedbackLink.tsx` › `APP_VERSION` (⚰️ literal `'1.0.2'` — três versões no
repositório). Régua: `src/deploy/versaoUnica.contract.test.ts`. Bump de versão =
`package.json` **e** `versionName`/`versionCode` no Gradle, no mesmo commit.

**Alarme (PL-9, revisto em beta-play-01):** o app NÃO declara mais `SCHEDULE_EXACT_ALARM`
(permissão restrita da Play; lembrete tolera minutos de janela). `SoulmonAlarmPlugin.kt`
agenda só com `setAndAllowWhileIdle` (inexato, acorda em Doze); saíram o gate
`canScheduleExactAlarms()`, o reagendamento por `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`
e `canScheduleExact()`/`openExactAlarmSettings()` do JS (nunca tiveram chamador na UI).
⚰️ Antes: Android 14+ com target ≥ 33 não pré-concede a permissão, o `setExact*` lançava
`SecurityException` e o JS engolia — nenhum lembrete tocava no APK. Régua:
`src/plugins/billingPbl8.contract.test.ts`. Como tudo em `android/`, só chega com APK novo. **O manifesto também travou a orientação em retrato** (`android:screenOrientation="portrait"` na `MainActivity`, QA L06-13) e removeu o receiver de `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`.

Guia operacional: [../APK-BUILD-INFO.md](../APK-BUILD-INFO.md).
⚠️ **Aquele arquivo é da era do fork** (cabeçalho: "última atualização declarada:
23/12/2024) e não descreve o build de 10/09/2026, que é o descrito em §3.3.
⚰️ Ele **trazia** o JWT anônimo de um projeto Supabase do fork em texto plano; o
valor foi **redigido** em 09/09/2026 no commit `571a8b4f`, que também estendeu
`src/security/transcribe.contract.test.ts` (ex-`supabase.contract.test.ts`) a varrer o repositório inteiro (antes só
`src/`). O que sobrou ali são placeholders truncados. Revogar a chave no painel
continua com o dono — o histórico do git ainda a carrega.

### 3.5 Worker de push

**Não builda no push da `main`.** Deploy manual:

```
cd workers && ../node_modules/.bin/wrangler deploy --config ./wrangler.toml
```

Binário da raiz com `--config` explícito de propósito: `npx wrangler deploy` dentro de `workers/` resolve a config da RAIZ (`wrangler.jsonc`) e publica o app `soulmon`, não o worker (achado em 19/10/2026; o 1º deploy errado publicou o app a partir da `main` `5976acb85`, sem mudança de assets). Deployado de verdade em 19/10/2026: versão `a454018e`, 4 crons ok; falta o teste em aparelho com o app fechado.

Os secrets (`VAPID_JWK`, `FIREBASE_SERVICE_ACCOUNT`, `SEASON_ADMIN_KEY`) também
se definem **dentro de `workers/`**, com `wrangler secret put`.

**Medido no ar em 22/09/2026** (`05-operador-governanca-r2.md` §1, `npx wrangler
deployments list --name digiapp-push-scheduler` e `secret list`): o worker **está
deployado** (21/09 12:57Z, posterior ao último commit de `workers/`, `3e758a81`) com
`SEASON_ADMIN_KEY` e `VAPID_JWK` definidos — e **`FIREBASE_SERVICE_ACCOUNT` ausente**:
o FCM (APK Android) nunca envia; só o Web Push (PWA) funciona. Três rodadas
perguntaram "está no ar?" e nenhuma "tem os secrets?" — a régua do operador é
`secret list`, não `deployments list`. ⚠️ `AGE_DAY_BASE_UTC` (§2.7) está no git em
`592e2c14`, **não no ar** até o próximo `cd workers && ../node_modules/.bin/wrangler deploy --config ./wrangler.toml`.

### 3.6 `CACHE_VERSION`

Ao mudar assets estáticos ou HTML de forma incompatível, **bump `CACHE_VERSION`**
em `public/sw.js` — senão usuários ficam presos em cache velho.

⚠️ **O NÚMERO NÃO É REPETIDO EM DOCUMENTAÇÃO NENHUMA, de propósito.** Ele já
apodreceu três vezes no `CLAUDE.md`, e a mentira é **perigosa**, não só feia:
quem lê um número atrasado e soma 1 anda para TRÁS, e o cache velho volta para
todo mundo. **O valor vive num lugar só: as primeiras linhas de `public/sw.js`.
Abra o arquivo e some 1.** Régua: `src/deploy/swCache.contract.test.ts` (§7 de
[05-ARQUITETURA.md](05-ARQUITETURA.md)).

**Exemplo do ritmo, sem o número** (21/09/2026, S16): o `CACHE_VERSION` andou
**quatro vezes num só dia**, uma por commit que tocou `public/sounds/` —
`ee79fd44` (os assets entram), `8a930657` (segunda camada da trilha),
`c703c8bc` (`evolve.webm` sai) e `73be1a2f` (`evolve.webm` volta):
`git log --format=%h 5ac3d351..73be1a2f -- public/sw.js`. Os `.webm` **não**
estão em `PRECACHE_URLS` (S6, `src/utils/sonsAssets.contract.test.ts`) e são
servidos network-first com cópia em `RUNTIME_CACHE`; o bump existe porque um
arquivo de **mesmo nome e conteúdo diferente** (o `evolve.webm` que saiu e
voltou) ficaria na cópia offline de quem já o tinha tocado. Quem precisar do
valor de hoje abre `public/sw.js`, não este parágrafo. Em `42b07bec` ele andou
de novo (uma unidade, sem o número aqui — hash novo do aviso de WebView na CSP), e em `4a8b8049`
`cacheavel(res)` passou a exigir `status === 200` em vez de `res.ok`: um **206**
(range request do `<video>` `.mp4`) é `ok` e o `Cache.put` lançava "Partial
response (status code 206) is unsupported" — visto no console na etapa 4 do QA geral.
Em `a6c1cd8a` andou de novo (uma unidade — hash novo do gate de WebView na CSP de
`public/_headers`, `index.html` e `manifest.json` reescritos), e `cacheavel` ganhou
teste direto: `tests/swCacheavel.test.ts`.
Na minimal-ui (F1–F6, Home + Mapa + 6 áreas, a barra inferior sai) andou **sete
vezes**, uma por fase que trocou asset/tela — sem o número aqui; a lista sai de
`git log --format=%h c7bca6d0..78ef5367 -- public/sw.js`. Nenhuma mudança de
estratégia de cache: só o bump.

---

## 4. O que depende do dono

Esta lista **não é mantida aqui**. As duas fontes vivas são:

- [../STATUS.md](../STATUS.md) **§3 "Depende de você"** — organizada em §3.1
  segurança e direitos, §3.2 lançamento, §3.3 Steam, §3.4 a ordem que evita ficar
  fora do ar.
- [../DEPENDE-DE-VOCE.md](../DEPENDE-DE-VOCE.md) — a mesma matéria por urgência
  (🔴 urgente · 🟠 antes de qualquer coisa com dinheiro · 🟡 decisões de produto ·
  🔵 lançamento · 🟢 ambiente), com o que já foi resolvido riscado no fim.

Os itens em aberto que tocam ESTE documento, em 09/09/2026 (linha do Actions acrescentada em 22/09/2026; **estado do ar medido por `wrangler secret list`/`d1 migrations list` em 22/09/2026, `05-operador-governanca-r2.md` §1** — as linhas riscadas abaixo são as que a medição fechou):

| Item | Consequência enquanto não for feito |
|---|---|
| ~~**Aplicar as migrações D1** (#65)~~ — ✅ **FEITO em 22/09/2026**: `0001` aplicada, `0002` marcada (a coluna já existia, vinda do `execute --file` do README antigo); `PRAGMA table_info` → 4 colunas, `migrations list` → "No migrations to apply" | ⚰️ "a 1ª compra Play responde 500" — **não responde mais** (§2.8). |
| **`FIREBASE_SERVICE_ACCOUNT` no worker de push** (`cd workers && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT`) — **segue com o dono** (#66, resposta de 22/09/2026: *"o dono cola o JSON"*) | O FCM do APK nunca envia (§3.5); o worker em si está deployado desde 21/09. **O E0 roda com Web Push (PWA)** e a superfície de cada convidado é anotada, senão "não voltou" se confunde com "não foi lembrado" (#50). |
| Redeploy do worker de push (`cd workers && ../node_modules/.bin/wrangler deploy --config ./wrangler.toml`) depois de `592e2c14` | `AGE_DAY_BASE_UTC` fica só no git: o push das 22h BRT ainda sai no D0 para quem nasceu hoje. |

| Item | Consequência enquanto não for feito |
|---|---|
| **Regularizar a cobrança do GitHub** (`github.com/settings/billing`, #48 e #68 — parado desde 16/09/2026; ainda parado em 30/09/2026) | Nenhum workflow de §3.3 roda (o substituto local é `npm run portoes`): o compile Kotlin da 8.x, o APK e os portões fora da máquina local ficam sem prova; `gh run list --limit 5` é a medição. |
| ~~Deploy do worker de push (`cd workers && ../node_modules/.bin/wrangler deploy --config ./wrangler.toml`, #50-a)~~ — **medido em 22/09/2026: deployado em 21/09 12:57Z** (`wrangler deployments list --name digiapp-push-scheduler`) | ⚰️ A pergunta #50-a era repetição da #5; o que faltava era o secret (linha acima), não o deploy. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` + `ANDROID_PACKAGE_NAME` | A rota da Play responde 503 e nenhuma compra é concedida. |
| `PLAY_REQUIRE_ACCOUNT_BINDING = true` (só **depois** de publicar o APK que manda `setObfuscatedAccountId`) | Compra **sem vínculo de conta é aceita** — um recibo pode virar N contas pagas. |
| ~~`METRICS_ADMIN_KEY` (secret do Worker — ver §0)~~ — **medido em 22/09/2026: DEFINIDA** (`GET /api/metrics` → 401, que só sai com a chave presente; `wrangler secret list` a lista) | ⚰️ "responde 404, ninguém lê nada" — o STATUS §3.2 e a R1 estavam velhos; `scripts/metrics-report.mjs` funciona com a chave em mãos. |
| `ENTITLEMENTS_ADMIN_KEY` e `COURTESY_MAX_ACCOUNTS` (secrets do Worker, desde `42b07bec`, #12/#18) — **medido em 22/09/2026: AUSENTES**; **segue com o dono** (#67, resposta de 22/09/2026: *"o dono faz depois"*, com `COURTESY_MAX_ACCOUNTS=10`) | Sem a chave, `POST /api/entitlements?action=grant` responde 404 e o E0 não recebe grant de cortesia; sem o teto, vale `COURTESY_DEFAULT_MAX = 25` (ok). Prova depois de definir: grant com chave errada → 401. |
| `GEMINI_API_KEY` (secret do Worker) — **medido em 22/09/2026: AUSENTE**; **o E0 roda com Higgsfield Starter** (#63b, resposta do dono: não contratar Gemini agora) | Sem o fallback do sprite (`generate-sprite.js` › `if (env.GEMINI_API_KEY)`), Higgsfield fora = geração morre em vez de cair no Gemini (§2.3). |
| ~~`SEASON_ADMIN_KEY` como secret do worker (com o MESMO valor do Pages)~~ — **medido em 22/09/2026: DEFINIDA nos dois lados** | ⚰️ fechamento pulado — a season fecha. |
| `ASSETLINKS_SHA256` (o certificado do Play App Signing; `ASSETLINKS_PACKAGE_NAME` só para um pacote diferente do padrão `com.soulmon`) | Os Digital Asset Links respondem lista VAZIA — os links não abrem direto no app. |
| Os interruptores e listas de [§0.1](#01-interruptores-listas-e-ajustes--só-o-nome-29102026) (`BETA_EMAILS`/`BETA_CLOSED`, `IP_HASH_SALT`, `ADMIN_EMAILS`, `RTDN_AUDIENCE`/`RTDN_PUSH_SA_EMAIL`, `FEIRA_CHEFE_DESDE`) e a migração `0003_rtdn_messages.sql` | Estado do ar NÃO medido nesta sincronização; a fonte viva é [../DEPENDE-DE-VOCE.md](../DEPENDE-DE-VOCE.md) e [../BETA-CONTINGENCIA.md](../BETA-CONTINGENCIA.md). Sem as `RTDN_*`, `/api/rtdn` responde 503 e a vitrine da assinatura só muda quando o jogador reabre o app. |
| Manter o `google-services.json` do pacote `com.soulmon` na máquina de build (fora do git desde 18/10/2026) | Sem um `client` para `com.soulmon`, o `build.gradle` NÃO aplica o plugin (só avisa; ⚰️ antes o build falhava com `No matching client found for package name`): o APK sai, mas **sem FCM e sem o login Google nativo** — ver [../BILLING-SETUP.md](../BILLING-SETUP.md). Um runner do Actions também não tem o arquivo. |
| Host do CDN do Higgsfield | `isSafeSpriteUrl` fecha esquema, mas não fecha o beacon `https://atacante.example/x.png` (§2.3). |
| Conta Steamworks, App ID e Depot ID | O cliente Steam não sai do lugar. |

⚠️ **A ordem que evita ficar fora do ar** (`STATUS.md` §3.4): projeto Pages novo +
KV novo + variáveis → conferir pela URL `*.pages.dev` → publicar o domínio
próprio → **só então** atualizar `capacitor.config.json`, gerar APK e publicar →
por último, aposentar o Pages antigo. Fazer na ordem inversa (mexer no
`server.url` antes de o destino existir) quebra o app de quem já tem o APK.

---

## 5. Privacidade e ficha da loja

| Peça | Onde | Observação |
|---|---|---|
| Política de privacidade | `public/privacidade.html` | Publicada em `https://soulmon.mateus-sprnd.workers.dev/privacidade` (desde 26/10/2026 a §6d declara o **e-mail guardado com cada imagem gerada por IA**, só para auditoria do GM); a âncora `#exclusao` é a URL de exclusão de conta que a Play exige desde 2024. É a **fonte viva** — quando a transcrição ou a telemetria mudarem, ela muda junto. Desde 30/09/2026 é **inglês primeiro** (EN no topo, PT-BR em `#pt`), como os Termos — inglês é a língua principal (`REGISTRO-DE-DECISOES.md` §14.6). |
| Termos | `public/termos.html` | §5 foi reescrita nos dois idiomas quando o reroll deixou de ser sorteio e virou a Nova Leitura determinística (`src/utils/newReading.ts`), o que o tira do enquadramento de loot box da Lei 15.211/2025. §8 ganhou em `bcfe7ca6` o parágrafo "Crossings are optional / As Travessias são opcionais" (MIS-15), com `TERMS_VERSION` = `2026-09-30` na época. **Em 29/10/2026** `TERMS_VERSION` = `2026-10-26` (§5: o "Gerar de novo" a aparência é um sorteio PAGO) e `PRIVACY_VERSION` = `2026-10-28` (`src/utils/consent.ts`; a voz vai direto ao Groq e o Gemini é reserva do chat — REGISTRO §185). ⚰️ O aviso informativo "sem re-aceite" (decisão #24) saiu em 28/10/2026 (`a660c41bef`, QA-13): quem não tem o consentimento da versão ATUAL vê o `ConsentGate` (`src/components/ConsentGate.tsx`), uma tela BLOQUEANTE que exige marcar a caixa e confirmar; o App grava `buildConsentRecord()`. |
| Formulário de Segurança de Dados | [../PLAY-DATA-SAFETY.md](../PLAY-DATA-SAFETY.md) | Atualizado em 08/09/2026. Traz cada resposta já mapeada para as categorias do Google, com o ponteiro para o código que a sustenta. **Regra de ouro**: declarar MENOS do que o app coleta é motivo de rejeição e, se passar, de remoção depois. |
| Atribuições de arte | [../Attributions.md](../Attributions.md) | O que saiu do repositório e por quê. |
| Herança do fork | [../SEPARACAO-DIGIAPP.md](../SEPARACAO-DIGIAPP.md) | O inventário e o que ainda depende do painel. |
