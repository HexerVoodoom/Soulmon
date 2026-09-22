# QA Rodada 2 — 05 · Operador (git × ar) + retrospectiva + governança + doc-verificador

> **Base:** `qa/rodada-2-2026-09-22` @ `a6c1cd8a` (22/09 01:18 BRT). Medições no ar em 22/09 ~01:25–01:40 BRT.
> **Papéis inline:** `soulmon-operador` · `alpha-governanca` · `alpha-insights` (retro) · `doc-verificador`.
> **Regra:** `caminho` + SÍMBOLO, número só com comando. Nada editado. Tudo abaixo é leitura.
> **Aviso de método:** a tarefa mandava só LISTAR os comandos `wrangler` (login). `npx wrangler whoami` mostrou a
> máquina JÁ logada (OAuth, `mateus.sprnd@gmail.com`). Rodei então só os **read-only** (`deployments list`,
> `secret list`, `d1 migrations list`). Nenhum `put`/`deploy`/`apply`.

---

## 1. Operador — runbook "git × ar" executado

### 1.1 Tabela git × ar

| O quê | git (`a6c1cd8a`) | ar (`soulmon.mateus-sprnd.workers.dev`) | Comando | Veredito |
|---|---|---|---|---|
| GitHub Actions | 4 workflows disparam no push | **todos `failure` em 4–12 s**, anotação *"recent account payments have failed…"*; último `success` = `docs-sync` 15/09 02:54Z | `gh run list --limit 10`; `gh run view 35686387601`; `gh run list --status success --limit 1` | 🔴 **ainda parado** (#48). Runs `failure` desde 16/09: **260** (`gh run list --limit 1000 --json conclusion,createdAt -q '[.[]\|select(.conclusion=="failure" and .createdAt>="2026-09-16")]\|length'`); o "339" da R1 não reproduz com comando nenhum (349 desde 15/09, 570 total na janela) |
| `sw.js` › `CACHE_VERSION` | `v158` | `v158` | `curl -s …/sw.js \| grep CACHE_VERSION` × `grep public/sw.js dist/sw.js` | ✅ igual |
| Deploy do app pegou `a6c1cd8a`? | push na `main` 04:18:29Z | deployment Cloudflare **04:19:27Z** (10 deployments em 21–22/09; um por push) | `npx wrangler deployments list` | ✅ **Cloudflare deploya do push da `main`**; `[verificar no CI]` continua sem prova, mas o ar é o git |
| `index.html` | `dist/index.html` | byte-igual (sem CR) | `diff <(tr -d '\r' < ar) <(tr -d '\r' < dist/index.html)` → exit 0 | ✅ |
| JS de entrada `assets/index-BLrSBFqK.js` | 643 966 B (CRLF no working copy, `core.autocrlf=true`) | 643 933 B | mesmo `diff` sem CR → IGUAL | ✅ (⚠️ `md5sum` cru DIFERE por CRLF — runbook tem de usar `tr -d '\r'`) |
| Correções da R1 no bundle do ar | — | `soulmon-telemetry-hidden` 1 · `account-deleted` 1 · `1.1.4` 3 · `convite` 1 · `findahelpline` 1 · `2026-09-22` 1 | `grep -c <str> ar-index.js` | ✅ R1 está no ar |
| Worker do app (`dist/_worker.js/index.js`) | `del:done:`/`pushidx:` 2 hits; `ENTITLEMENTS_ADMIN_KEY` 2, `METRICS_ADMIN_KEY` 2, `COURTESY_MAX_ACCOUNTS` 1 | idem (mesmo commit) | `grep -c` | ✅ |
| `privacidade.html` / `termos.html` | "22 de setembro de 2026" / "September 22, 2026" | `/privacidade.html` → **307 → `/privacidade`** → 200, texto igual (só CRLF) | `curl -sL -w '%{http_code} %{url_effective}'`; `diff` sem CR → 0 | ✅ (⚠️ `curl -s …/privacidade.html \| grep` **sem `-L` devolve vazio** — o comando sugerido na tarefa dá falso negativo) |
| CSP efetiva em `/` | `public/_headers`: 4 hashes | 4 hashes idênticos, `/a0iipZ…` presente | `curl -sI …/ \| grep -i content-security`; hashes recomputados dos 4 `<script>` inline de `index.html`/`dist/index.html` (python sha256) = 4/4 | ✅ · ⚠️ comentário de `public/_headers` diz "os TRÊS `<script>` inline" — são **4** (`grep -c` dos inline = 4) |
| `/api/config` | — | `{"authRequired":true,"transcribeAvailable":false}` 200 | `curl -s` | ✅ auth ligada; transcribe desligado (bate com `SUPABASE_*` ausentes) |
| `/api/metrics` | fail-closed 404 sem `METRICS_ADMIN_KEY` (`metrics.js` › `onRequestGet`) | HEAD **405**; GET **401 `Unauthorized`** | `curl -sI`; `curl -s -w '%{http_code}'` | 🟢 **`METRICS_ADMIN_KEY` ESTÁ definida** (401 só sai depois de `env.METRICS_ADMIN_KEY` truthy). #18 feito pelo dono; STATUS §3.2 e R1 §1.3 ("3 secrets… nada definido") estão **desatualizados** |
| `POST /api/entitlements?action=grant` | 404 sem `ENTITLEMENTS_ADMIN_KEY` (`handleGrant`) | **404** `Not found` (com e sem `x-admin-key` errado) | `curl -s -o /dev/null -w '%{http_code}' -X POST` | 🔴 **`ENTITLEMENTS_ADMIN_KEY` NÃO definida** → rota de cortesia não existe no ar → E0 não pode receber grant |
| `POST /api/entitlements` (sem action) | 400 `Invalid save ID` | 400 | idem | ✅ 404/400 não revelam a rota (B1 da R1 fechado) |
| Secrets do worker do app | usados por `functions/api/**`: 21 nomes (`grep -rhoE "env\??\.[A-Z][A-Z0-9_]+"`) | **definidos: `GROQ_API_KEY`, `HF_API_KEY`, `HF_SECRET`, `METRICS_ADMIN_KEY`, `SEASON_ADMIN_KEY`** + var `FIREBASE_PROJECT_ID=soulmon-app` | `npx wrangler secret list` | ⚠️ **ausentes:** `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS` (padrão 25 no código — ok), `GEMINI_API_KEY` (fallback do sprite: `generate-sprite.js` › `if (env.GEMINI_API_KEY)` — sem ele, Higgsfield fora = sprite morre), `GOOGLE_PLAY_SERVICE_ACCOUNT`, `ANDROID_PACKAGE_NAME`, `PLAY_REQUIRE_ACCOUNT_BINDING`, `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY`, `STEAM_*`, `ADMOB_SSV_ENABLED` (os 6 últimos: esperados ausentes até Play/Steam) |
| D1 `soulmon-billing` (binding `DB`) | `migrations/0001_order_claims.sql`, `0002_order_claims_expires_at.sql` | **as DUAS "Migrations to be applied"** — tabela `order_claims` NÃO existe em produção | `npx wrangler d1 migrations list soulmon-billing --remote` | 🔴 **bug latente de dinheiro**: `claimOrder` (`_entitlements.js`) desvia para `claimOrderAtomic` porque `env.DB` existe; o primeiro `DELETE FROM order_claims` está **fora do `try`**, e `billing.js` › `onRequestPost` não tem `catch` → **1ª compra Play = 500**. STATUS §3.2 diz "sem a tabela, a query falha e o resgate cai no caminho antigo" — **FALSO** (não há fallback) |
| Worker de push `digiapp-push-scheduler` | último commit em `workers/` = `3e758a81` (20/09) | último deploy **21/09 12:57:29Z** (> 20/09) | `npx wrangler deployments list --name digiapp-push-scheduler` | ✅ **deployado com o código atual** — #50(a) respondida: SIM. STATUS §3.2 ("⚠️ só vale depois de um `wrangler deploy`") e #5/#50 estão velhos |
| Secrets do worker de push | usa `APP_URL` (var), `FIREBASE_SERVICE_ACCOUNT`, `SEASON_ADMIN_KEY`, `VAPID_JWK` (`grep -o "env\.[A-Z_]*" workers/push-scheduler.js`) | definidos: **`SEASON_ADMIN_KEY`, `VAPID_JWK`** | `npx wrangler secret list --name digiapp-push-scheduler` | 🔴 **`FIREBASE_SERVICE_ACCOUNT` ausente** → FCM (APK Android) **nunca envia**; só Web Push (PWA) funciona. STATUS §3.2 linha 🟡 do `SEASON_ADMIN_KEY` já pode fechar (está lá) |
| `npm audit` | R1 `00-seguranca` B4: "3 vulns via `@capacitor/cli`", §3.4 "→ `devDependencies` + `npm audit fix`" | `@capacitor/cli` **segue em `dependencies`** (`package.json`); `package-lock.json` intocado desde `4a8b8049` | `npm audit --json` → **16 (4 moderate, 11 high, 1 critical `tar`)**; `sharp`, `vite`, `wrangler` diretos | ❌ correção da R1 **não aterrissou** |

### 1.2 Comandos `wrangler` que exigem ação (NÃO rodados — são escrita)

```bash
# cortesia (E0) — só o dono digita o valor
npx wrangler secret put ENTITLEMENTS_ADMIN_KEY
# FCM do APK — JSON da conta de serviço do Firebase (soulmon-app)
cd workers && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
# D1 — cria order_claims em produção (idempotente; sem isso a 1ª compra Play dá 500)
npx wrangler d1 migrations apply soulmon-billing --remote
# opcional: fallback do sprite
npx wrangler secret put GEMINI_API_KEY
```

Ordem sugerida do operador: D1 primeiro (zero risco, destrava dinheiro) → `ENTITLEMENTS_ADMIN_KEY` (destrava E0) → `FIREBASE_SERVICE_ACCOUNT` (destrava push do APK). Cada um seguido de `curl` de prova (grant → 401 com chave errada; `d1 migrations list` → vazio).

---

## 2. Retrospectiva do método (alpha-insights) — as 3 rodadas de 21–22/09

Contagem por relatórios (não por tokens): **manhã** 16 relatórios + consolidado; **R1** 12 + consolidado + 3 rascunhos de ADR; **R2** em andamento (`ls scratchpad/qa3/*.md` → 4 até agora, mais este). Correções: manhã §3 = 11 arquivos; execução #11–#39 = 2 commits (`42b07bec`, `4a8b8049`); R1 = 1 commit (`a6c1cd8a`, 40 arquivos de teste tocados; suíte 311 → **338** arquivos, 4266 → **4631** testes — `npx vitest run`).

### 2.1 Achado → conserto → voltou como achado novo

| Fio | Manhã (21/09) | Execução/noite | R1 (21/09 noite) | R2 (agora) |
|---|---|---|---|---|
| `PLAY-DATA-SAFETY` §2.3/§2.7 | `11`: Higgsfield/Gemini ausentes | etapa 2 fez só §2.7/§3b; etapa 4 "fechou" §2.3 | `09` #7: §2.7 "não cruzado com o save" × `saveId` gravado; `01` §2.3: seção de ads prometida (#14) não existe | ✅ ambas no doc (`grep -n "3c. Anúncios"`, §2.7 cita `saveId`) — **fechou na 3ª rodada** |
| STATUS × ledgers WP1.14/WP3.4 | `09`: 2 falsos positivos | etapa 3 registrou "corrigido" no STATUS **sem editar o ledger** | `01` §2.1: STATUS mentia | ✅ ledgers editados em `a6c1cd8a` com lápide |
| Worker de push no ar | #5 (20/09): "deployado, `e90f05a6`" | A1: "`e90f05a6` não é SHA; versão no ar desconhecida" | #50(a): "não medido — exige login" | **medido**: deploy 21/09 12:57Z > último commit 20/09 → deployado; **mas `FIREBASE_SERVICE_ACCOUNT` ausente** — 3 rodadas perguntando "está no ar?" e nenhuma perguntou "tem os secrets?" |
| `METRICS_ADMIN_KEY` | #18 "o dono define" | STATUS §3.2 "não consegue ler até definir" | `02` #13: "3 secrets: nada definido" | **definida** (ar 401). Ninguém mediu por `curl` — o 401/404 é o oráculo que o próprio código documenta |
| D1 | STATUS: "não há binding" | corrigido: "binding existe; migração não dá para provar pelo repo; sem tabela cai no caminho antigo" | — (não olhou) | migrações **não aplicadas** + a frase do fallback é **falsa** → conserto de doc introduziu mentira nova |
| `billing-ktx` | A2: "conferir Billing ≥ 7" | etapa 6: "fica em 6.2.1 `[a confirmar]`" | `05` §1: ≥ 8 FATAL | 8.3.0 no gradle; compile **não provado** (CI morto) — `billingPbl8.contract.test.ts` é grep textual: prova que o texto mudou, não que compila |
| CI | `15`: "nenhum gate roda build" | etapa 6 carimbou 4 itens `[verificar no CI após o merge]` | `03`/`08`: **morto desde 16/09** — 5 dias, ~260 runs, ninguém olhou | ainda morto; `gh run list` virou 1ª linha do runbook (bom), hook de sessão não imprime (ainda) |
| `@capacitor/cli` → dev + `npm audit fix` | — | — | `00-seguranca` B4 → §3.4 "em correção" | ❌ não aconteceu; audit **16 vulns** |
| `scripts/save-id.mjs` | — | — | `02` R3 → §3.1 "em correção"; #51 já o cita como existente | ❌ não existe (`ls scripts/save-id.mjs`) — a fila do dono referencia script fantasma |
| `TETO_JS_LAZY` | — | — | `04` §6 → §3.2 "em correção" | ❌ ausente de `orcamentoDeBytes.contract.test.ts` |

### 2.2 Classes de defeito recorrentes e a prática que fecha cada uma

| Classe | Casos | Prática que fecha |
|---|---|---|
| **Doc afirma conserto que não aconteceu** | STATUS × ledgers; STATUS §3.2 "cai no caminho antigo"; R1 §3 lista 3 itens que não aterrissaram; #5 "deployado" sem prova | Bloco do STATUS só se escreve **depois** do commit, gerado a partir de `git show --stat <sha>`; toda linha de "corrigido" carrega o comando que prova (`grep -c`, `ls`, `vitest run <arquivo>`). Tabela "em correção" do consolidado ganha coluna **aterrissou?** preenchida no fechamento por `git show --stat`, nunca antes. Doc-verificador roda **contra o commit**, não contra a intenção |
| **Guard tautológico / grep de texto como prova** | `billingPbl8` (compile), `versaoUnica`, `docsSemMentira` (40 linhas), `orcamentoDeBytes` com `DIVIDA_ATUAL` = a dívida vira parâmetro do teste | Toda régua nova nasce com **prova de vermelho** colada no PR: mutar o alvo (trocar a versão, apagar o símbolo) → saída vermelha → reverter. `scratchpad/qa3/mutation.log` desta rodada é o formato. Guard que só lê texto declara isso no nome (`*.texto.contract.test.ts`) |
| **Número sem comando** | "339 runs" (não reproduz: 260/349/570 conforme filtro); "~150 testes novos" (são +365 testes/+27 arquivos); "38 aliases" (37); `GameState` 89/110/111 | Regra já existe (MAPA §1); falta **exigir o comando no mesmo campo** da tabela. Verificador reprova número sem comando ao lado, sem exceção |
| **Agente sem Write perde o relatório** | preâmbulo desta rodada já prevê "cole inteiro na resposta" | Coordenador confere `ls qa3/*.md` = nº de agentes despachados **antes** de consolidar; agente sem Write recebe `Bash` para `cat > arquivo` ou o coordenador salva a resposta com o nome combinado |
| **Árvore compartilhada com 5 agentes** | agora mesmo: `git status` mostra **11 arquivos modificados** por outros agentes da R2 (`GameStateContext.tsx`, `push-scheduler.js`, 6 docs do manual…) enquanto agentes "só leitura" fazem `grep` — um achado pode nascer de arquivo meio-editado | `isolation: worktree` para todo agente que escreve; leitores rodam sobre `git stash`-free tree ou sobre `git show a6c1cd8a:<path>`. Commit por caminho (memória `soulmon-arvore-compartilhada-perde-trabalho`) |
| **Fila do dono repergunta o já respondido** | #5 → #50(a); #25 → #45; #18 → #51 assume indefinida | Antes de abrir #N: `grep -n <palavra> docs/PERGUNTAS-DO-DONO.md`; a pergunta nova cita "estende #K" ou não entra. Provisório que muda código exige linha em `REGISTRO-DE-DECISOES.md` com etiqueta **provisório** |
| **Ninguém mede o ar** | 3 rodadas de "versão no ar desconhecida"/"exige login" | Runbook §1.1 acima é executável sem login em 9 dos 12 itens (`curl`); os 3 de `wrangler` são read-only e a máquina está logada. Hook de sessão imprime `gh run list --limit 3` + `curl -s …/sw.js \| grep CACHE_VERSION` |

---

## 3. Governança do processo (alpha-governanca)

### 3.1 Perguntas que repetem ou contradizem decisões anteriores

| Par | O que há | Veredito |
|---|---|---|
| #5 × #50(a) | #5 respondida 21/09 "deployado `e90f05a6`"; #50(a) repergunta "está deployado? não medido" | **repetição** — e a resposta já podia ter sido medida por `wrangler deployments list` (read-only). Fechada aqui: deployado 21/09 12:57Z |
| #18 × #51 | #18 "o dono define"; #51 assume os 3 secrets pendentes | **desatualizada**: `METRICS_ADMIN_KEY` definida; faltam `ENTITLEMENTS_ADMIN_KEY` (+`FIREBASE_SERVICE_ACCOUNT`, nunca perguntada) |
| #25 × #45 | #25 respondida "preço em dólar"; #45 pergunta redação A/B do mesmo dólar | **sub-pergunta** da já decidida; provisório A = o publicado → podia ser decisão da squad |
| #14 × #47 | #14 ads "manter desligado e avaliar"; #47 retenção do save 365 d | **sem contradição** entre si. Onde #14 aparece de novo: `PLAY-DATA-SAFETY` §3c escrita como prometido — ok |
| #13 × `959e3bee` | #13 **Camada 3 congelada** (Steam, coop, som, arte extra, **narrativa**) até 10 usuários × 14 d, registrada no REGISTRO | 22/09 02:43Z entra `docs/BOOKLET-UNIVERSO.md` (1 084 linhas, narrativa nova, branch `claude/soulmon-storytelling-booklet-*`) — **drift contra a decisão de 21/09**, sem registro de exceção. É doc, não código; mas é exatamente "narrativa" |
| #46 × política | provisório: Steam na §6 "só ao sair da C3" | `public/privacidade.html` **já tem** a linha "Steam (quando disponível)" (`grep -n -i steam`) → provisório declarado ≠ aplicado |
| #41 × `vetos.md` | provisório: "registrar como decisão da missão em `vetos.md`" | `grep -i glitchtama docs/plano-melhorias/ledger/vetos.md` → só P5 (nome). **Provisório não aplicado**; o contador continua sendo o mesmo |

### 3.2 Provisórios que viraram código/doc publicado sem o dono (R1, #40–#53)

| # | O que mudou | Onde | Reversível? |
|---|---|---|---|
| 40 | `auditRefunds` recomputa `tier` de `paidProviderOf` | `functions/api/_entitlements.js`; teste `tierDerivado.qa.test.js` 4/4 | sim, mas é regra de dinheiro |
| 42 | política §2b/§6 PT+EN reescritas ("declarar"), hints nas telas, guard `ia.camposEnviados`, **`TERMS_VERSION`/`PRIVACY_VERSION` → 2026-09-22** (banner para todo usuário existente; `07` N9 mandava congelar durante o E0) | `public/privacidade.html`, `src/utils/consent.ts` | política **publicada no ar** (medido §1.1) — se o dono disser "cortar", já houve uma versão pública que declarou |
| 43 | Supabase + Groq Whisper nomeados na política §6 | `privacidade.html` | texto |
| 45 | redação A (US$ 6.99) | termos EN | texto |
| 46 | Steam na §6 (contra o próprio provisório) | `privacidade.html` | texto |
| 47 | 365 d do save e "5 anos a partir da exclusão" na política §8 | `privacidade.html` (comentário cita `SAVE_TTL_SECONDS`) | texto, mas ancora constante |
| 50(b) | push D0 = `null` | `functions/api/_pushCopy.js` › `pushCopy` | sim |
| 49 | "assumir que há iPhone" | só doc | — |
| 41 | **não aplicado** (ver 3.1) | — | — |
| 48, 52, 53, 44 | nada executado (corretos: são do dono) | — | — |

Leitura: 7 de 14 provisórios mexeram em **texto legal publicado** ou **regra de dinheiro** em < 6 h, sem linha no `REGISTRO-DE-DECISOES.md` com etiqueta "provisório". A regra do dono ("seguir a recomendada, perguntar no fim") cobre isso; o que falta é o **rastro**: cada provisório aplicado vira linha no REGISTRO com `[provisório #N]`, para o "se mudar" ser executável.

### 3.3 Custo (por relatórios, não tokens)

Manhã 17 → R1 13 (+3 ADR) → R2 ≥ 5. Razão relatório/correção que aterrissou: R1 listou ~40 itens "em correção", **3 não aterrissaram** e **1 conserto de doc criou mentira nova** (D1 fallback). Taxa de "achado que volta": 4 fios em 2.1 precisaram de 3 rodadas. Nenhum dos 3 ciclos mediu o ar antes desta rodada.

---

## 4. Doc-verificador — bloco "22/09 QA RODADA 1" do STATUS + `00-CONSOLIDADO.md` da R1 §3

| # | Afirmação | Comando | Veredito |
|---|---|---|---|
| 1 | 13 relatórios na pasta R1 | `ls docs/reviews/2026-09-21-qa-rodada-1/*.md \| wc -l` → 13; `adr-propostas` 3 | ✅ |
| 2 | "339 runs falhando" | `gh run list --limit 1000 --json …` → 260 desde 16/09, 349 desde 15/09 | ⚠️ número sem comando; não reproduz |
| 3 | `billing-ktx` 8.3.0 | `grep -n billing-ktx android/app/build.gradle` → `8.3.0` | ✅ (compile não provado) |
| 4 | `BillingPlugin.kt` na API nova | `grep -c "PendingPurchasesParams\|enableAutoServiceReconnection\|QueryProductDetailsResult"` → 9 | ✅ textual |
| 5 | guard `src/ia.camposEnviados.contract.test.ts` | `ls` | ✅ |
| 6 | `TERMS_VERSION`/`PRIVACY_VERSION` 2026-09-22 | `grep -n "_VERSION =" src/utils/consent.ts`; ar `/privacidade` "22 de setembro" | ✅ git = ar |
| 7 | `auditRefunds` tier derivado; cortesia sobrevive | `grep -n paidProviderOf functions/api/_entitlements.js`; `vitest run …tierDerivado.qa.test.js` → 4/4 | ✅ |
| 8 | tombstone 30 d + `save.js` 410 | `TOMBSTONE_TTL_SECONDS = 30*24*60*60`; `grep -n 410 functions/api/save.js` | ✅ |
| 9 | `sprite:img/lock/blob` apagados na exclusão | `grep -n "sprite:" functions/api/account.js` | ✅ |
| 10 | `pushidx:<saveId>` em vez de varredura | `grep -ln pushidx functions/api/*.js` → `_pushIdentity.js`, `account.js`, `subscribe.js`; `fcm-subscribe.js` importa de `_pushIdentity.js` | ✅ |
| 11 | cliente do 410 `reagirContaExcluida` | `grep -rln` → `GameStateContext.tsx`, `SoulmonOnboarding.tsx` + teste | ✅ |
| 12 | `FCM_TOKEN` só sai após `res.ok` | `notifications.ts`: `if (!res.ok) throw` antes de `removeLocal(STORAGE_KEYS.FCM_TOKEN)` | ✅ |
| 13 | `confirmDelete` teto 8 s | `REVOKE_PUSH_TIMEOUT_MS = 8_000` em `accountData.ts` | ✅ |
| 14 | `handleGrant` recusa `saveId` não-string | `grep -n "typeof saveId !== 'string'" entitlements.js`; ar: 404 sem chave | ✅ |
| 15 | fila `soulmon-telemetry-hidden` | `K_HIDDEN` em `telemetry.ts`; string no bundle do ar | ✅ |
| 16 | `?src=convite` = 4 | `TELEMETRY_OPEN_SOURCE.invite = 4`; parser aceita `convite`/`invite` | ✅ |
| 17 | `week_active.active_days` agregado | `metrics.js` `active_days: { min: 1, max: 7 }` | ✅ |
| 18 | push D0 = nulo | `_pushCopy.js` › `pushCopy` comentário "nunca no D0" + `Number.isFinite(ageDays)` | ✅ |
| 19 | `minimizeForAi` cobre CEP/data/celular | `grep -n CEP functions/api/_redact.js` | ✅ |
| 20 | `chatSafety` normaliza acentos; `bridgeReply` EN cita findahelpline | `normalize('NFD')`; string EN presente | ✅ |
| 21 | gate WebView: ramo Android, `lang`, mailto | `grep -c` em `index.html` → 2 / 1 / 1 | ✅ |
| 22 | `TermsUpdateBanner` `region`, "(abre em nova aba)", "Entendi" | `grep -n` → 3/3 | ✅ |
| 23 | `APP_VERSION` única 1.1.4 | `package.json` 1.1.4 = `versionName` 1.1.4 = `__APP_VERSION__`; `versaoUnica.contract.test.ts` | ✅ |
| 24 | feedback em Ajuda; Sobre declara sons/sem revisão humana | `SettingsPage.tsx` importa `FeedbackRow`; string "sem revisão humana" | ✅ |
| 25 | `manifest.json` sem copy do fork | `description` na voz da bíblia | ✅ |
| 26 | alarme exato com gate + fallback | `grep -rc canScheduleExactAlarms\|setAndAllowWhileIdle android` → 3 | ✅ |
| 27 | widget sem "I miss you", `petName` = `soulmonDisplayName` | 2 hits em `WidgetRenderer.kt` são **lápides em comentário**; `SoulmonWidgetPlugin.ts` importa `soulmonDisplayName` | ✅ |
| 28 | desktop `exp` ilegível = agora+1h | `main.js`: `Date.now() + 60*60*1000`; `auth-preload.js` `DEFAULT_TOKEN_TTL_MS` | ✅ |
| 29 | ledgers WP1.14 `RECUSADO` / WP3.4 `IMPLEMENTADO` "de verdade" | `grep -n WP1.14 ledger/nascimento.md`; `WP3.4 ledger/vinculo.md` — com lápide | ✅ |
| 30 | LV #15 virou teste; 13 por teste / 8 por tese | `01-VISAO.md` §7 "13 por teste, 8 por tese"; `copy.semFomo.contract.test.ts` | ✅ |
| 31 | ADR-004..006 como Proposta | `grep -ln Proposta docs/adr/ADR-00[456]*` → 3 | ✅ |
| 32 | `CACHE_VERSION` v158 | git = dist = ar | ✅ |
| 33 | "~150 testes novos" | `git show --stat a6c1cd8a` → 40 arquivos de teste; suíte 4266 → 4631 (+365 testes, +27 arquivos) | ⚠️ subestimado, sem comando |
| 34 | `PLAY-LANCAMENTO` §A.0 e §G | `grep -n "A.0\|^## G"` | ✅ |
| 35 | `CLAUDE.md` não tocado | `git show --stat a6c1cd8a \| grep -c CLAUDE.md` → 0 | ✅ |
| 36 | R1 §3.1: `scripts/save-id.mjs` | `ls` → **não existe**; #51 e `02` R3 o citam | ❌ |
| 37 | R1 §3.4: `@capacitor/cli` → `devDependencies` + `npm audit fix` | `package.json` › `dependencies` ainda tem; lock intocado; audit 16 vulns | ❌ |
| 38 | R1 §3.2: `TETO_JS_LAZY = 350 KB` | `grep -n LAZY src/deploy/orcamentoDeBytes.contract.test.ts` → 0 | ❌ |
| 39 | R1 §3.3: E.1 sem segredo na linha de comando | `PLAY-LANCAMENTO.md` usa `wrangler secret put` interativo, explica em "de senhas" | ✅ |
| 40 | R1 §3.1: `regexDeImport` ignora comentário; `convert-to-webp.d.mts` | `grep -n comentário depsVivas…` ✅; `ls scripts/convert-to-webp.d.mts` ✅ | ✅ |
| 41 | STATUS §3.2: "sem a tabela, a query falha e o resgate cai no caminho antigo" | `_entitlements.js` › `claimOrderAtomic`: primeiro `DELETE` fora do `try`; `billing.js` › só `request.json().catch` | ❌ **falso** — vira 500 |
| 42 | STATUS §3.2: "`METRICS_ADMIN_KEY` — você não consegue ler nada até definir" | ar 401; `wrangler secret list` tem a chave | ❌ desatualizado |
| 43 | STATUS §3.2 🟡 `SEASON_ADMIN_KEY` no worker de push | `secret list --name digiapp-push-scheduler` → presente | ⚠️ linha pode fechar |
| 44 | `public/_headers`: "os TRÊS `<script>` inline" | são 4 (hashes batem) | ⚠️ comentário |
| 45 | `docs/BOOKLET-UNIVERSO.md` indexado | `grep -n BOOKLET docs/manual/00-MAPA.md` → linha em §6 ("vivo"); guards `docsManual`+`docsSemMentira` 2 files / 10 tests verdes | ✅ indexado, etiqueta **vivo** coerente com "derivado da bíblia" |
| 46 | Booklet: cabeçalho R6 | tem `Dono` · `Data` · `Estado` · `Precedência`; usa **`Régua:`** em vez de `Verificação:` e **não tem `Não cobre:`**; a régua citada (`src/narrativa.contract.test.ts`) **não lê o booklet** (`grep -n BOOKLET src/narrativa.contract.test.ts` → 0) | ⚠️ R6 é obrigatório só em `docs/manual/`; mas "régua" que não lê o arquivo é verificação vazia. Vocabulário: `grep -i` das `PROIBIDAS_PT/EN` (`petVoice.test.ts`) → hits só em negações ("não é castigo", "nada enfraquece por culpa sua") e lore ("assentamento falhou") — sem cobrança, mas **nenhum guard prova** |

Resultado: 46 afirmações · **35 ✅ · 6 ⚠️ · 5 ❌**. Os 5 ❌ são a classe "doc afirma conserto que não aconteceu" (3) + "conserto de doc criou mentira" (1) + "doc não acompanhou o ar" (1).

---

## 5. Tabela final — achado · severidade · conserto · dono

| Achado | Sev. | Conserto | Dono |
|---|---|---|---|
| D1 `soulmon-billing`: binding existe, **migrações 0001/0002 não aplicadas**; `claimOrderAtomic` sem fallback → 1ª compra Play = 500. STATUS §3.2 mente sobre o fallback | **alto** (bloqueia dinheiro; latente até a Play) | `npx wrangler d1 migrations apply soulmon-billing --remote` (dono ou operador logado) **e** `try/catch` em `claimOrderAtomic` caindo para `claimOrder` KV com log; corrigir §3.2 | dono (aplicar) · `alpha-backend` (catch) · `soulmon-operador` (doc) |
| `ENTITLEMENTS_ADMIN_KEY` ausente no ar → cortesia 404 → E0 sem grant | **alto** (bloqueia E0) | `wrangler secret put ENTITLEMENTS_ADMIN_KEY`; prova: grant com chave errada → 401 | dono (#12/#51) |
| `FIREBASE_SERVICE_ACCOUNT` ausente no `digiapp-push-scheduler` → FCM do APK nunca envia; 3 rodadas perguntaram "deployado?" e nenhuma "com secrets?" | **alto** (APK sem push; PWA ok) | `cd workers && wrangler secret put FIREBASE_SERVICE_ACCOUNT`; fechar #50(a) como "deployado 21/09 12:57Z" | dono · `soulmon-operador` fecha a pergunta |
| GitHub Actions morto (260 runs desde 16/09) — ainda | **fatal (processo)** | billing do GitHub; hook de sessão imprime `gh run list --limit 3` | dono (#48) · `soulmon-coordenador` (hook) |
| R1 §3 lista 3 correções que não aterrissaram (`save-id.mjs`, `@capacitor/cli`+audit, `TETO_JS_LAZY`); #51 cita script inexistente | médio | criar os 3 (script + paridade; mover dep + `npm audit fix` e revisar 16 vulns; teto lazy); consolidado ganha coluna "aterrissou? (sha)" | `alpha-backend` · `alpha-frontend` · `doc-mantenedor` |
| `npm audit` 16 vulns (1 critical `tar`, 11 high: `vite`, `sharp`, `wrangler`/`miniflare` diretos) | médio (dev/build chain, não runtime do worker) | `npm audit fix` + bump `vite` 6.4.x, `wrangler` 4.136; rodar suíte | `soulmon-operador` |
| STATUS §3.2 desatualizado: `METRICS_ADMIN_KEY` (definida), `SEASON_ADMIN_KEY` no push (definida), "só vale depois de `wrangler deploy`" (deployado) | baixo (doc) | 3 linhas com a saída do `secret list`/`deployments list` colada | `soulmon-operador` |
| Provisórios R1 aplicados sem rastro no REGISTRO (#40, #42 incl. bump de `TERMS_VERSION`, #43, #45, #46 contra o próprio provisório, #47, #50b); #41 não aplicado | médio (governança) | linha por provisório em `REGISTRO-DE-DECISOES.md` com `[provisório #N]`; #41: registrar em `vetos.md` ou reverter o contador | `alpha-governanca` → `doc-mantenedor` |
| Booklet (`959e3bee`) = narrativa nova sob Camada 3 congelada (#13) | baixo (doc, sem código) | registrar exceção no REGISTRO ("doc de jogador, sem asset") ou datar como pós-E0 | dono |
| Booklet: cabeçalho com `Régua:` que não lê o arquivo; sem `Não cobre:` | baixo | trocar para `Verificação:` com comando real (ex.: `grep -ci` das PROIBIDAS ≤ N em negação) + `Não cobre:` | `soulmon-loremaster` |
| `public/_headers` comentário "TRÊS scripts" (são 4) | baixo | 1 palavra | `staff-frontend` |
| Fila do dono repergunta (#5→#50a, #25→#45, #18→#51) | baixo (processo) | `grep` no PERGUNTAS antes de abrir; "estende #K" | `soulmon-coordenador` |
| Árvore compartilhada: 11 arquivos modificados por outros agentes da R2 durante leitura | médio (processo) | `isolation: worktree` para quem escreve; leitores em `git show <sha>:path` | `soulmon-coordenador` |
| Runbook: `curl …/privacidade.html` sem `-L` devolve vazio (307 → `/privacidade`); `md5sum` de `dist/` no Windows difere por CRLF | baixo (runbook) | runbook usa `curl -sL` e `diff <(tr -d '\r')` | `soulmon-operador` |

**Sem dono:** quem aplica migração D1 em produção (aparece na 3ª rodada seguida) · quem vigia `npm audit` (nenhum guarda, nenhum CI) · quem mede o ar (`curl`) em cada sessão — o runbook existe desde hoje, o hook não o chama · rastro dos provisórios no REGISTRO (a regra "seguir a recomendada" não diz onde fica o registro).
