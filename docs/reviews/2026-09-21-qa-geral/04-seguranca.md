# 04 — Re-verificação de segurança (2026-09-21)

Árvore: `D:\Soulmon\repo` em `212da7d5` (HEAD). Somente leitura. Método: leitura de
código + `git ls-files` / `git grep` / `git log -S` + `npm audit --omit=dev` (1 execução).
Referências por `caminho` + SÍMBOLO. O que não foi executado (deploy real do worker,
painel do Cloudflare, migração D1 aplicada) está declarado como **não verificável por leitura**.

Legenda: CRÍTICO / ALTO / MÉDIO / BAIXO / INFO.

---

## 1. SEC-* do STATUS §1 — estado hoje no código

| # | Símbolo | STATUS diz | Código hoje | Veredito |
|---|---|---|---|---|
| SEC-1 | `denyUnlessOwner` em `functions/api/community.js` → `authorizeSaveAccess` em `functions/api/_auth.js` | Fechado em produção (`FIREBASE_PROJECT_ID` no `wrangler.jsonc`) | `wrangler.jsonc` → `vars.FIREBASE_PROJECT_ID = "soulmon-app"` presente. Todas as ações que escrevem (`profile`, `match`, `friends`, `gift`, `gifts`, `trophies`, `coop*`) passam por `denyUnlessOwner`. `authorizeSaveAccess` continua **fail-open** por desenho (sem a var → `{ok:true, enforced:false}`) | **CORRIGIDO** no código. Dependência residual: a var mora no arquivo, então um deploy a partir de um branch sem ela reabre tudo em silêncio. |
| SEC-2 / N-3 | `newPid`, `ensurePid`, `PID_PREFIX` em `functions/api/community.js` | pid aleatório + índice reverso | `newPid` usa `crypto.getRandomValues(12 bytes)`; índice `pid:<pid>` → saveId. `players` devolve `pid`, não saveId | **CORRIGIDO** |
| N-4 | ação `players` em `community.js` | filtra por `pvpEnabled` | `if (!p.pvpEnabled) continue` presente | **CORRIGIDO** |
| N-5 | `isSafeSpriteUrl` em `src/utils/spriteLibrary.ts` | "NÃO fecha o beacon; host do CDN não confirmado; pendência do dono" | Existe allowlist de HOST com igualdade exata de `hostname`: `d8j0ntlcm91z4.cloudfront.net`, `images.higgs.ai`, `platform.higgsfield.ai`. Além disso `generate-sprite.js` **republica** a imagem em `/api/sprite-image?k=…` (comentário "image é SEMPRE uma URL nossa") | **STATUS DESATUALIZADO** — o beacon está fechado no cliente. O que ficou: CSP `img-src … https:` continua aberta (ver §5) e o servidor (`profile`) não valida `spriteUrl` — não achei `sprite` no `community.js`, então ou o campo não é mais gravado no perfil público ou vem de outra fonte; de qualquer forma o cliente filtra. |
| N-6 | `desktop/electron/main.js` | trava de navegação + `senderFrame` | `will-navigate` + `will-redirect` + `setWindowOpenHandler`, `contextIsolation:true`, `nodeIntegration:false` em 3 janelas | **CORRIGIDO** (não executei o Electron) |
| N-7 | `public/sw.js` | checa origem da resposta | não re-lido nesta rodada (fora do escopo pedido) | não verificado |
| N-8 | `sanitizeCustomKeywords`, `clampTemperature`, `sanitizeChatHistory` em `functions/api/chat.js` | delimitado + clamp | Presentes; histórico passa por `minimizeForAi`, contexto por `sanitizeChatContext` | **CORRIGIDO** |
| SEC-3 | `claimOrder` / `claimOrderAtomic` em `functions/api/_entitlements.js` | "NÃO RESOLVIDO — **não existe binding `d1_databases` em `wrangler.jsonc`**" | `wrangler.jsonc` **TEM** `d1_databases: [{ binding: "DB", database_name: "soulmon-billing" }]`. `claimOrder` desvia para `claimOrderAtomic` quando `env.DB`; `INSERT` com `order_id PRIMARY KEY`; limpeza por `expires_at` antes da disputa; `migrations/0001`, `0002` | **STATUS MENTE (para pior)**: o binding existe desde 07/09. O código do caminho atômico está certo. **Não verificável por leitura:** se `wrangler d1 migrations apply` rodou no banco de produção — sem a tabela, `claimOrderAtomic` lança e `billing.js` (sem try/catch em `onRequestPost`) devolve 500 cru → fail-closed, não fail-open. Classifico como **PARCIAL (provável fechado)**. |
| SEC-4 (Steam) | `verifySteamPurchase` em `functions/api/_billing.js` | "parcial" | Exige `ticket`, chama `authenticateSteamTicket`, e compara `params.steamid !== auth.steamId` → `not-purchased`. `billing.js` passa `ticket` junto do `orderId`. Family Sharing recusado em `verifySteamOwnership` | **CORRIGIDO** para Steam |
| SEC-4 (Play) | `isPlayPurchaseBoundTo` em `_billing.js` | `PLAY_REQUIRE_ACCOUNT_BINDING` não ligada | `return env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'` quando `obfuscatedExternalAccountId` ausente → compra sem vínculo é **aceita** por padrão | **ABERTO (por configuração)** — variável não é de arquivo, então não dá para provar por leitura que está ligada. Cenário: recibo real da Play resgatado numa conta que não a comprou (mitigado por `claimOrder`: 1 recibo = 1 conta). **ALTO latente**, MÉDIO hoje (billing sem usuários). |
| SEC-5 | `isAllowedPushEndpoint` em `functions/api/_pushTargets.js`; `subscribe.js` e `workers/push-scheduler.js` | corrigido; worker deploy manual | Sufixos exatos (`fcm.googleapis.com`, `push.services.mozilla.com`, `notify.windows.com`, `push.apple.com`) via `url.hostname`; o worker re-checa antes do `fetch` | **CORRIGIDO no código**; manual §3.5 diz que o worker **não foi deployado** desde mudanças recentes → em produção roda versão antiga, não verificável. |
| §1.4 keystores | `bubblewrap_build/*.keystore` no histórico | rebaixado a "formulário" | Confirmado: não estão no HEAD; histórico segue com eles. `android/app/build.gradle` → `signingConfigs.release` lê `RELEASE_STORE_PASSWORD` de property, sem senha em texto | INFO — inalterado, decisão do dono |
| §1.5 CI | `.github/workflows/ci.yml` | actions por SHA, `permissions: contents: read` | Confirmado (`actions/checkout@11d5960a…`, `setup-node@49933ea5…`) | **OK** |

**Onde o STATUS mente / está velho (resumo):**
1. SEC-3: afirma "não existe `d1_databases`" — existe. A frase-prova ficou falsa.
2. N-5: afirma que a allowlist de host é pendência do dono — já está no código com 3 hosts medidos.
3. SEC-4: rotula "parcial" sem distinguir Steam (fechado) de Play (aberto por env).
4. §1.3 "Sem segredos na árvore de trabalho" — verdade para o HEAD, mas `dist/` (3.016 arquivos) é rastreado e é bundle de produção (ver §7).

---

## 2. Segredos no git

### HEAD (`git ls-files` + `git grep`)
| Achado | Onde | Classe |
|---|---|---|
| `VITE_FIREBASE_API_KEY=AIza…` | `.env.production` | INFO — pública por desenho (Firebase web), documentado em `08-INTEGRACOES-E-DEPLOY.md` §0; régua `firebaseNoBuild.contract.test.ts` |
| `current_key: AIza…` de **`digiapp-88296`** com packages `com.digiapp.app` / `com.digipartner.digiapp` | `android/app/google-services.json` | **BAIXO** — arquivo do projeto Firebase do **DigiApp**, não do Soulmon (`applicationId com.hexervoodoom.soulmon`). `build.gradle` avisa e desliga o plugin. Expõe chave de API pública de outro produto e prova que FCM nativo do Soulmon não está registrado. Substituir pelo `google-services.json` do `soulmon-app`. |
| `SUPABASE_ANON_KEY=eyJ…` (trecho) | `docs/APK-BUILD-INFO.md` | INFO — truncado (`…`), não é valor completo |
| `-----BEGIN PRIVATE KEY-----` | `_billing.js`, `workers/fcm.js`, `dist/_worker.js` | INFO — é `replace()` de PEM, não chave |
| Arquivos `.env`, `.jks`, `.keystore`, `.p12`, `.pem` rastreados | nenhum além de `.env.example`, `.env.production` | OK |

### Histórico (`git log -S`)
- JWT anon do Supabase (`ref: evvcdsnijxbyctipfnkt`, `role: anon`, exp 2035) esteve em `src/utils/supabase/info.tsx` (blob `85615743…`) e foi removido em **`571a8b4f`** ("o JWT do Supabase da era DigiApp ainda estava no repositório — em docs/ e num build velho na raiz"). **Saiu do HEAD; permanece no histórico** (`06ef9ea0`, `12cb739a`, `3062d540`, …).
- **MÉDIO** — cenário concreto: `functions/api/transcribe.js` chama `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-7de212d9/transcribe` com `Authorization: Bearer ${SUPABASE_ANON_KEY}`. A edge function (`src/supabase/functions/server/transcribe.tsx`) usa `Deno.env.get('GROQ_API_KEY')` e **não tem verificação de JWT, rate limit nem cota própria** (só CORS). Se o `SUPABASE_PROJECT_ID` de produção for `evvcdsnijxbyctipfnkt`, a "credencial de servidor" do manual (`08-INTEGRACOES` §credenciais: "nunca chegam ao navegador") já é pública via histórico do git e qualquer um chama a função direto, pulando o `takeToken('transcribe')` da nossa borda e queimando a chave Groq do Supabase. Se for outro projeto, é INFO. **Pergunta ao dono: o projeto é o mesmo?** Se sim: rotacionar a anon key no Supabase (Settings → API → rotate JWT secret) ou exigir `verify_jwt` + segredo próprio na edge function.
- Keystores do DigiApp (`bubblewrap_build/`) seguem no histórico — decisão já tomada em §1.4 do STATUS.

---

## 3. Rotas `functions/api/*.js` × controles

Legenda: Auth = quem verifica identidade; RL = `takeToken` de `_rateLimit.js`; Body = teto explícito; Redação = `minimizeForAi`/logs sem conteúdo.

| Rota | Auth (símbolo) | Modo | RL | Validação de entrada | Body cap | CORS | Logs |
|---|---|---|---|---|---|---|---|
| `account.js` | `requireVerifiedOwner` | **fail-closed** (503 sem var) | não | `VALID_ID` | n/a | `*` | `saveIdPrefix` 8 chars — bom |
| `billing.js` | `authorizeSaveAccess` | fail-open | não | `VALID_ID`, provider ∈ {play,steam}, `orderId` regex | não | `*` | ok |
| `chat.js` | `guardAiRequest` → `authorizeSaveAccess` | fail-open | cota por conta/dia/global (`AI_LIMITS`) | `minimizeForAi(500)`, `sanitizeChatHistory`, `sanitizeChatContext`, `clampTemperature`, `sanitizeCustomKeywords` | só por campo (500) | `*` | só contagens |
| `community.js` | `denyUnlessOwner` nas escritas; leituras públicas (`players`, `player`, `opponents`, `rank`, `seasonResult`) | fail-open | `takeToken('community')` LIGHT/HEAVY | `VALID_ID`, `slice` em strings; `unlockedStages` só `.slice(0,16)` (elementos não tipados) | **não** (`request.json()` sem teto) | `*` | ok |
| `config.js` | público por desenho | — | não | — | — | `*` | — |
| `entitlements.js` | `authorizeSaveAccess` | fail-open | não | `Number.isInteger` em `spendCredits` | não | `*` | ok |
| `fcm-subscribe.js` | **nenhuma** | — | `takeToken('fcm-subscribe')` | `ehTokenFcm`, `nomeDePet`, `idiomaDePush`, `dataDeNascimento` | não | `*` | ok |
| `generate-sprite.js` | `requirePaidTier` + `authorizeSaveAccess` + `guardAiRequest` | fail-open | cota por conta/forma/global | `VALID_FORM_ID`, `MAX_BLOB_BYTES` | sim (blob) | `*` | ok |
| `metrics.js` | POST anônimo; GET `secretEquals(METRICS_ADMIN_KEY)` fail-closed 404 | — | `takeToken('metrics')`/`('metrics-read')` | `MAX_EVENTS`, schema | `MAX_BODY_BYTES` 16 KB | `*` | sem id de usuário |
| `save.js` | `authorizeSaveAccess` | fail-open | não | objeto não-array; `SERVER_OWNED_FIELDS` (`accountTier`, `credits`) removidos | `MAX_STATE_BYTES` (após parse) | `*` | **`saveId` inteiro em `console.warn`** |
| `sprite-image.js` | público por chave `k` | — | não | chave opaca | — | `*` | ok |
| `subscribe.js` | **nenhuma** | — | `takeToken('subscribe')` | `isAllowedPushEndpoint`, `keys.p256dh/auth` tamanho | não | `*` | ok |
| `suggest-tasks.js` | `guardAiRequest` | fail-open | cota | `minimizeForAi(300)` | 300 | `*` | contagens |
| `transcribe.js` | **nenhuma** | — | `takeToken('transcribe')` | `MAX_BYTES` 4 MB, formato do project id | sim | `*` | nome do erro só |

Achados desta tabela:
- **MÉDIO — `transcribe.js` sem autenticação.** Custo (Groq via Supabase) controlado só por IP em memória de isolate (`_rateLimit.js` se declara "amortecedor de custo, não controle"). Cenário: script com IPs rotativos manda 4 MB × N e a conta é do dono. Tudo o mais de IA (`chat`, `suggest-tasks`, `generate-sprite`) exige token; esta é a única rota de IA anônima. Recomendação: `guardAiRequest` com bucket próprio.
- **BAIXO — `authorizeSaveAccess` fail-open** continua sendo a política de 6 rotas. Hoje está ligado, mas a única coisa que o segura é uma linha em `wrangler.jsonc`. `requireVerifiedOwner` (fail-closed) existe e só `account.js` usa. Verificação executável: `curl -s -o /dev/null -w '%{http_code}' 'https://<host>/api/save?id=<32hex>'` → tem que ser 401.
- **BAIXO — `community.js` e `entitlements.js`, `billing.js` leem `request.json()` sem teto de `Content-Length`.** Cloudflare limita a 100 MB; parse de JSON grande queima CPU do isolate. Cenário: 429 não é atingido porque cada request é 1 token mas custa 100 MB de parse.
- **BAIXO — `save.js` loga `saveId` completo** em dois `console.warn`; `account.js` já usa prefixo de 8. `saveId` é pseudônimo estável (hash do e-mail) — log vira índice de contas.
- **INFO — `closeSeason` compara `adminKey !== env.SEASON_ADMIN_KEY`** (não constante), enquanto `metrics.js` tem `secretEquals`. Timing por rede é impraticável; é assimetria, não furo.
- **INFO — CORS `*` em tudo.** Aceitável porque não há cookie/sessão ambiente: a credencial é Bearer explícito. Só vira problema se um dia entrar cookie.
- **INFO — `subscribe.js`/`fcm-subscribe.js` sem auth.** Grava assinatura de push de qualquer um (só em hosts de push conhecidos). `DELETE` exige conhecer o `endpoint` alheio (segredo do navegador). Custo mitigado por RL.

---

## 4. `workers/`

| Item | Estado |
|---|---|
| Secrets esperados no código (`env.*`) | `VAPID_JWK`, `FIREBASE_SERVICE_ACCOUNT`, `SEASON_ADMIN_KEY` (secrets) · `VAPID_PUBLIC_KEY`, `APP_URL` (`[vars]`) · `PUSH_SUBSCRIPTIONS` (KV) — **batem** com `workers/wrangler.toml` (secrets só comentados, como deve ser) |
| Cron | `0 1,13,19 * * *` UTC = 22h/10h/16h BRT; `pushCopy.parity.test.js` trava a lista contra `_pushCopy.js` |
| `SEASON_ADMIN_KEY` | `closeSeasonIfDue` só dispara com `SEASON_ADMIN_KEY` **e** `APP_URL`; sem eles, log e pula. Chave vai no **corpo JSON** (`adminKey`) para `POST /api/community?action=closeSeason`, sobre HTTPS — ok. Mesmo valor precisa existir no Pages: não verificável por leitura |
| `fetch` handler | worker **não expõe** `fetch` — só `scheduled`. Superfície mínima. Bom. |
| `APP_URL` | `https://soulmon.mateus-sprnd.workers.dev` — o worker chama a produção pelo domínio `workers.dev`; se a produção migrar para domínio próprio, closeSeason quebra em silêncio (só log) |
| Deploy | manual (`cd workers && wrangler deploy`); manual §3.5 diz que **não foi deployado** após as últimas mudanças — a versão em produção é desconhecida (**INFO**, mas afeta SEC-5 e o payload FCM) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo de service account como secret — é a credencial mais poderosa do projeto (admin do Firebase). Escopo do token gerado em `workers/fcm.js` não foi lido nesta rodada. **INFO/pergunta:** a SA tem só papel "Firebase Cloud Messaging API Admin"? Se for "Editor" do projeto, vazamento = tudo. |

---

## 5. CSP (`public/_headers`)

```
default-src 'self'; script-src 'self' https://apis.google.com + 4 sha256;
style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;
connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com wss://*.firebaseio.com;
frame-src 'self' https://*.firebaseapp.com https://apis.google.com https://accounts.google.com;
worker-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```
Mais `X-Frame-Options: DENY`, `nosniff`, `HSTS 1 ano + includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`.

Domínios que o cliente chama de fato (grep em `src/`, excluindo testes): `apis.google.com`, `accounts.google.com`, Firebase (via SDK), `/api/*` próprio. Higgsfield, Gemini, Groq, Supabase são chamados **só pelo servidor** — corretamente fora da CSP. `images.higgs.ai` / `cloudfront` só aparecem em `spriteLibrary.ts` (allowlist), e o sprite é republicado em `/api/sprite-image`.

- **MÉDIO — `img-src https:`** aberto. Com a republicação em `/api/sprite-image` e a allowlist de host no cliente, nada legítimo precisa de `https:` genérico (a menos que perfis antigos ainda apontem para o CDN). Cenário: qualquer XSS ou HTML injetado vira beacon de exfiltração por `<img>` para qualquer host. Recomendação: `img-src 'self' data: blob: https://d8j0ntlcm91z4.cloudfront.net https://images.higgs.ai` — e medir quantos perfis ainda têm `spriteUrl` externo antes.
- **BAIXO — `style-src 'unsafe-inline'`** — comum com Tailwind/Radix; fecha só com nonce. Aceito.
- **INFO — `connect-src https://*.googleapis.com`** cobre `www.googleapis.com` do JWK e Identity Toolkit; wildcard largo mas sem alternativa prática no Firebase.
- **INFO — `X-Frame-Options: DENY` + `frame-ancestors 'none'`** — mas o login Firebase por popup/redirect usa `*.firebaseapp.com` em `frame-src`; ok.

---

## 6. Cliente (`localStorage`, save editável)

Chaves em `localStorage` (grep em `src/`): `soulmon-save-id`, `soulmon-user-email`, `soulmon-user-name`, `soulmon-oracle-draft`, `SOULMON_PROFILE` (nome completo, data/hora/local de nascimento — só cliente, confirmado em `src/utils/oracle.ts`, `soulProfile/identity.ts`), `soulmon-telemetry-*`, `soulmon-reconcile-backup`, `digiapp_state_v*`/`soulmon_state_*` (o save), e chaves legadas `digiapp-user-email`, `digiapp-user-name`, `digiapp-save-id`.

- **INFO (mantido por desenho) — PII do oráculo em `localStorage`.** Continua não indo ao servidor. Risco residual: `allowBackup="true"` no `AndroidManifest.xml` → o WebView data (incl. `localStorage`) entra no backup do Google Drive do usuário. É backup do próprio titular, cifrado pelo Google; não é vazamento, mas é "transferência a terceiro" que a política precisa cobrir. **Pergunta ao dono/jurídico.**
- **BAIXO — e-mail em claro em `localStorage`** (`soulmon-user-email`) ao lado do `saveId`. Qualquer XSS lê. Aceitável para app single-user; só registrar.
- **Vantagem de jogo guardada no cliente (STATUS §4 admite):** o save inteiro (Bits, Emblemas, estágio, atributos, dias perfeitos, inventário) é **do cliente**. `save.js` só protege `accountTier` e `credits` (`SERVER_OWNED_FIELDS`). Consequências concretas verificadas:
  - `community.js` ação `profile` aceita `attrs`, `stage`, `tasksDone`, `unlockedStages` **auto-declarados**. `match` calcula `power()` com teto de 20 dos attrs + `Math.random()*18` → attrs forjados dão vantagem máxima de ~53% na parte determinística. Ranking/troféus de season são **forjáveis por edição de `localStorage`** sem tocar em nada de servidor. **MÉDIO** para integridade do Torneio (dinheiro não envolvido; troféus são só status).
  - Bits/Emblemas: farmáveis, e a loja de Créditos→Bits é o único ponto que toca dinheiro; como `credits` é server-owned e `spendCredits` valida inteiro positivo, editar o save **não cunha Créditos**. **OK.**
  - `pvpEnabled` gate de vínculo (`BOND_PVP_MIN_LEVEL`) é calculado no servidor via `bondLevelOf` — mas a partir do que o cliente manda? Não confirmado nesta rodada; se lê do save, é forjável também.
- **INFO — chaves `digiapp-*` legadas** ainda referenciadas em código; limpeza de migração pendente.

---

## 7. Cadeia de suprimentos

`npm audit --omit=dev` (rodado 1x): **1 crítico, 5 altos**.

| Pacote | Sev. | Onde entra | Relevância real |
|---|---|---|---|
| `tar` ≤7.5.20 | crítico | transitiva (provavelmente `@capacitor/cli`) | CLI de build, não runtime. **BAIXO** |
| `hono` ≤4.13.4 | alto (algorithm confusion no JWT/JWK middleware) | `package.json` **`"hono": "*"`** — usado só em `src/supabase/functions/server/index.tsx` (edge function, que nem verifica JWT) | Não usado no bundle web nem nas Functions. **BAIXO**, mas `"*"` é anti-padrão |
| `lodash` ≤4.17.23 | alto | transitiva | verificar se chega ao bundle; provavelmente `recharts`. **BAIXO** |
| `@xmldom/xmldom` | alto | transitiva (Capacitor) | build. **BAIXO** |
| `form-data` 4.0.0–4.0.5 | alto | transitiva | build/dev. **BAIXO** |
| `brace-expansion` | alto | transitiva (`minimatch`) | build. **BAIXO** |

- **MÉDIO — três dependências com range `"*"`**: `clsx`, `hono`, `tailwind-merge`. `*` aceita qualquer major, inclusive um pacote sequestrado no futuro; o lockfile segura até o próximo `npm install` sem `ci`. Fixar range.
- **MÉDIO — `dist/` rastreado (3.016 arquivos, último toque `980bc84c`) e é o `main` do `wrangler.jsonc`.** Manual §3.2 diz "o CF também builda, mas o commit é o que garante o conteúdo". Consequência: um PR pode alterar `dist/_worker.js/index.js` sem alterar `functions/` e o revisor não vê no diff (3 mil arquivos minificados); e o `dist` do disco de quem commita pode incluir `.env` local inlinado. Cenário: bundle com `VITE_*` de um projeto Firebase diferente sobe por engano (já aconteceu o inverso — manual §0). Recomendação: `dist/` no `.gitignore` e deixar o build do Pages ser a única fonte; ou, se o commit é obrigatório, um gate no CI que rebuilda e compara hash.
- **`@jsr/supabase__supabase-js` e `hono`** continuam como dependências de runtime embora o app web não use Supabase (manual §credenciais). Peso morto na superfície de ataque.
- CI: `permissions` mínimos, actions por SHA, `npm ci`, integridade de `vendor/` por sha256 do blob — **OK**. `sync-irmaos.yml` usa `SIBLING_REPOS_TOKEN`/`SYNC_PR_TOKEN` — não auditado o escopo desses PATs (**INFO**: PAT com `contents: write` em repos irmãos é alvo).

---

## 8. Android

`android/app/src/main/AndroidManifest.xml` declara: `INTERNET`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `ACTIVITY_RECOGNITION`, `RECORD_AUDIO`. `docs/PLAY-DATA-SAFETY.md` §2.4/§2.6 lista **exatamente as mesmas seis** e trata áudio (efêmero, compartilhado com transcritor) e passos (não é Health Connect). **Consistente.**

- **BAIXO — `android:allowBackup="true"`**: save + `SOULMON_PROFILE` + e-mail vão para o backup automático do Google. A ficha do Play não tem campo para isso, mas a política de privacidade deveria mencionar. Alternativa: `allowBackup="false"` ou `dataExtractionRules` excluindo WebView storage.
- **BAIXO — `google-services.json` do projeto DigiApp** (ver §2). Não é vazamento de segredo; é artefato herdado errado que faz o FCM nativo não funcionar e expõe a chave pública de outro produto.
- **INFO — `minifyEnabled false`** no release: APK legível; não é controle de segurança (obscuridade), só registro.
- Assinatura: `signingConfigs.release` lê de `gradle.properties`/env; sem senha no repo. **OK.** Keystore do Soulmon nunca esteve no git (STATUS §1.4 confere).

---

## 9. Fora de escopo desta rodada (risco não modelado ≠ inexistente)

- `public/sw.js` (N-7) não relido.
- Escopo IAM da `FIREBASE_SERVICE_ACCOUNT` e dos PATs do `sync-irmaos.yml`.
- Painel do Cloudflare (secrets realmente definidos, `PLAY_REQUIRE_ACCOUNT_BINDING`, migração D1 aplicada, versão do worker em produção).
- Regras de segurança do Firebase (o app usa só Auth? se houver Firestore/RTDB, não foi visto).
- Desktop: `desktop/electron/main.js` só grepado; updater e IPC do token não lidos inteiros.
- `bondLevelOf` — se a fonte é o save do cliente, o gate de PvP é forjável (não confirmado).

---

## 10. Tabela consolidada por severidade

| Sev. | Achado | Símbolo |
|---|---|---|
| CRÍTICO | nenhum novo | — |
| ALTO (latente) | Play: compra sem vínculo aceita sem `PLAY_REQUIRE_ACCOUNT_BINDING='true'` — não provável por leitura | `isPlayPurchaseBoundTo` em `functions/api/_billing.js` |
| MÉDIO | JWT anon do Supabase no histórico; se o projeto for o mesmo, a edge function de transcrição é chamável por qualquer um, sem cota | `transcribe.js` + `src/supabase/functions/server/transcribe.tsx` |
| MÉDIO | `/api/transcribe` sem autenticação, só RL por IP em memória | `onRequestPost` em `functions/api/transcribe.js` |
| MÉDIO | CSP `img-src https:` aberta apesar de republicação + allowlist | `public/_headers` |
| MÉDIO | Torneio forjável: `attrs`/`stage` auto-declarados no `profile`, `match` usa direto | `profile`/`match` em `functions/api/community.js` |
| MÉDIO | `dist/` commitado e é o `main` do worker; diff irrevisável | `wrangler.jsonc` `main`, `.gitignore` |
| MÉDIO | `"*"` em `clsx`, `hono`, `tailwind-merge` | `package.json` |
| BAIXO | `authorizeSaveAccess` fail-open como política de 6 rotas; segurado por uma linha de `vars` | `functions/api/_auth.js` |
| BAIXO | `request.json()` sem teto em `community.js`, `billing.js`, `entitlements.js` | `handleCommunity`, `onRequestPost` |
| BAIXO | `saveId` inteiro em log | `save.js` `console.warn` |
| BAIXO | `google-services.json` do DigiApp | `android/app/google-services.json` |
| BAIXO | `allowBackup="true"` com PII do oráculo no WebView | `AndroidManifest.xml` |
| BAIXO | e-mail em claro em `localStorage` | `soulmon-user-email` |
| BAIXO | 6 CVEs `npm audit`, todos em cadeia de build/edge function | `tar`, `hono`, `lodash`, … |
| INFO | `closeSeason` compara segredo com `!==` | `community.js` |
| INFO | CORS `*` (ok sem cookie) | todas as rotas |
| INFO | worker de push não deployado; versão em produção desconhecida | `workers/` |
| INFO | STATUS desatualizado em SEC-3 (D1 existe), N-5 (allowlist existe), SEC-4 (Steam fechado) | `docs/STATUS.md` §1 |

## 11. Verificações executáveis para o `alpha-qa`

1. `curl -s -o /dev/null -w '%{http_code}\n' 'https://<prod>/api/save?id=0000…(32 hex)'` → **401**.
2. `curl -s -X POST 'https://<prod>/api/community?action=gift' -H 'content-type: application/json' -d '{"id":"<32hex>","friendId":"x"}'` → **401**.
3. `curl -s -X POST 'https://<prod>/api/transcribe' -F audio=@x.webm` sem `Authorization` → hoje **passa** (documenta o MÉDIO).
4. `curl -sI https://<prod>/ | grep -i content-security` → conferir `img-src`.
5. Decodificar o `SUPABASE_PROJECT_ID` do painel e comparar com `evvcdsnijxbyctipfnkt`.
6. `wrangler d1 execute soulmon-billing --remote --command 'SELECT name FROM sqlite_master'` → deve listar `order_claims` com coluna `expires_at`.
7. No painel do Pages: `PLAY_REQUIRE_ACCOUNT_BINDING` existe e vale `true`?
8. `git ls-files dist | wc -l` → política decidida (0 se for para o `.gitignore`).
