# Saúde da arquitetura — Soulmon (21/09/2026)

> Somente leitura. Nenhum build/suite rodado. Número = comando que o produziu.
> Referência canônica: `caminho` + SÍMBOLO. Sem número de linha.

## 0. Veredito em uma frase

O núcleo de regras (`src/utils/*` puro, dono único, guards por AST) está saudável e é a parte mais bem defendida do repo. A dívida mora nas BORDAS: um orquestrador de 6.149 linhas que ninguém consegue ler inteiro, um `dist/` de 123 MB commitado que dobra o repo, 30+ dependências mortas herdadas do scaffold Figma/shadcn, e três superfícies (worker de push, Android nativo, Electron main) que o CI só compila ou nem isso.

---

## 1. `src/App.tsx` — o orquestrador

Medidas (`cd D:/Soulmon/repo`):

| Medida | Comando | Valor |
|---|---|---|
| Linhas | `wc -l src/App.tsx` | 6149 |
| `useState` | `grep -c useState src/App.tsx` | 62 |
| `useEffect(` | `grep -c "useEffect(" src/App.tsx` | 36 |
| `useCallback(` | `grep -c "useCallback(" src/App.tsx` | 87 |
| `useMemo(` / `useRef` | idem | 14 / 15 |
| Handlers `const handleX =` | `grep -cE "const (handle\|on)[A-Z]\w* =" src/App.tsx` | 80 |
| Imports | `grep -c "^import" src/App.tsx` | 110 |
| Chamadas `setGameState(` | `grep -c "setGameState(" src/App.tsx` | 80 |
| Views em `ViewType` | `grep -oE "currentView === '[a-z]+'" src/App.tsx \| sort -u \| wc -l` | 10 (`main evolution stats pet settings games oracle tournament library shop`) |

Observações estruturais:

- `ViewType` está **duplicado** literalmente em `src/App.tsx` e `src/components/BottomNav.tsx` (`grep -rn "type ViewType" src`). Footgun 9 em forma de tipo — divergir não dá erro, dá view sem botão.
- Dos 62 `useState`, ~20 são booleanos de modal (`editModalOpen`, `balanceOpen`, `guideModalOpen`, `creditsOpen`, `newReadingOpen`, `rebirthOpen`, `settingsOpen`, `showItemsWindow`, `showDailyReport`, `nightmareOpen`, `showHelpModal`, `resetOnboardingOpen`, `taskEditModalOpen`, `createModalOpen`…). É um `useReducer<ModalId | null>` disfarçado de 20 flags.
- Os handlers por domínio (`grep -oE "const handle[A-Za-z]+ = useCallback" src/App.tsx`, agrupados à mão): TASK 14, GAME 5, EVOL 5, SHOP 4, CARE 4, e ~45 avulsos (rituais, visor, créditos, nudges, check-in, dreams, steps).
- 36 `useEffect` misturam: sync widget Android, presentes de amigos, aviso de dreno, relatório diário, check-in, IA settings, auth, ofertas — cada um é um "mini-serviço" sem nome.

### 1.1 Cinco extrações de maior retorno (por símbolo)

| # | Extração | Símbolos que saem | Retorno | Risco |
|---|---|---|---|---|
| 1 | **`src/hooks/useModals.ts`** — um `useReducer` de `ModalId \| null` + `open(id)`/`close()` | os ~20 `useState<boolean>` de modal + `handleOpenItems`, `handleOpenTriage`, `handleOpenAISettings`, `handleCloseNudge`, `handleCloseDailyReport`, `handleDismiss*` | −~300 linhas; impede dois modais abertos ao mesmo tempo (hoje é possível por construção); render tests ficam triviais | **Baixo**. Estado local, sem regra de jogo. Cuidado: `CompanionHUD` é `memo()` (footgun 5) — os callbacks novos precisam de identidade estável. |
| 2 | **`src/hooks/useTaskHandlers.ts`** | os 14 `handle(Task\|Activity\|Step\|Complete\|Postpone\|Shrink\|Drop\|Restore\|Focus\|Habit\|Someday\|Create\|Edit\|Save)*`, `handleQuickAdd`, `handleDecomposeTask`, `handleTriageResolve` | Maior bloco coeso; já delega a `taskTriage`/`habitRhythm`; vira testável sem montar o App | **Médio**. Guards de AST (`x6Updaters.contract.test.ts`, `activityCreate.contract.test.ts`) leem `src/App.tsx` pelo NOME do handler — mover o handler sem mover o guard deixa o guard verde por vazio. Mover os dois juntos. |
| 3 | **`src/hooks/useCareHandlers.ts`** | `handleFeed`, `handleRub`/`handlePet`, `handleShower`, `handleSleep`, `handleRecoverHearts`, `handleGlitchtama`, `healCapSignal`, `feedAnim`, `careEvent` | Espelha exatamente a fronteira que o desktop já consome (`desktop/renderer/src/care.ts`) — o app passa a ter a MESMA fachada que o overlay | **Médio**. Mesmo aviso do item 2 (guards X-6 apontam para `App.tsx`). `handleSleep` toca `pausarTrilha`/`retomarTrilha` (E0 do som) — R-NOVA exige que a extração nasça sem som novo. |
| 4 | **`src/hooks/useAndroidBridge.ts`** | o `useEffect` "Sync game state to Android home screen widget", `stepsAvailable`/`stepsPermission`, `notificationsEnabled`, chamada a `SoulmonWidget`/`SoulmonAlarm` | Isola tudo que depende de `isNativePlatform()`; o web deixa de carregar código de ponte | **Baixo**. Já é efeito puro de saída. Régua existente: `widgetSemCobranca.contract.test.ts` lê Kotlin, não o App. |
| 5 | **`src/components/AppRouter.tsx`** (ou `views/`) | o bloco `{currentView === 'x' && (...)}` + `ViewType` (dono único, importado pelo `BottomNav`) | Mata a duplicata do tipo; o JSX de 10 views sai do orquestrador; abre caminho para `React.lazy` por view (a Arena/Masmorra/Torneio carregam imagens de 3 MB cada, ver §6) | **Baixo-médio**. Props drilling: cada view recebe dezenas de handlers; a extração só compensa se vier com um contexto `AppActions` — senão é mover 800 linhas de props. |

Ordem recomendada: 1 → 5 → 4 → 2 → 3. As duas últimas só depois de reapontar os guards de AST.

---

## 2. Fronteiras — `src/contexts/GameStateContext.tsx`

| Medida | Comando | Valor |
|---|---|---|
| Linhas | `wc -l src/contexts/GameStateContext.tsx` | 1472 |
| Campos em `GameState` | `awk '/^export interface GameState/,/^}/' … \| grep -cE "^\s+\w+\??:"` | 110 |
| Interfaces exportadas | `grep -nE "^export interface"` | `Step`, `Activity`, `Task`, `CompletedTask`, `ActivityStats`, `GameState` |

**Quem escreve** (`grep -rl "setGameState(" src \| grep -v test`, contagem por arquivo):

| Arquivo | Chamadas |
|---|---|
| `src/App.tsx` | 80 |
| `src/hooks/useCareSystem.ts` | 2 |
| `src/hooks/useDailyReset.ts` | 1 |
| `src/utils/careUpdaters.ts` | 1 (assinatura de tipo, não chamada) |
| `src/contexts/GameStateContext.tsx` | 1 (`pvpEnabled` desliga sob R-1) |

Ou seja: o contexto é um `useState` + persistência (localStorage síncrono + `cloudSaveComRetry` com debounce de 3 s); **toda a escrita de domínio está no App.tsx**. O valor de contexto é `{gameState, setGameState}` memoizado por `gameState` — qualquer consumidor re-renderiza a cada gravação. Com 110 campos e escritas por timer (cocô, sono), a régua do `CLAUDE.md` ("throttle ≥5min") é a única defesa. Não há seletor/slice.

**`x6Updaters`**: não é um módulo — é a família de guard `src/utils/x6Updaters.contract.test.ts` (AST sobre `src/App.tsx`): o updater passado a `setGameState` dentro de cada handler de cuidado tem de DELEGAR ao dono da regra (`applyFeed`/`applyRub` em `careUpdaters.ts`) e reconferir a recusa sobre `prev`. Está correta e é o motivo do aviso de risco nas extrações 2 e 3.

**Regra vazando para componente** (`grep -rnE "Math\.(floor|min|max|round)\(" src/components --include=*.tsx | grep -iE "hp|health|energy|xp|bits|heart|level|stage|constancy|shield|weight|goal"`, por arquivo):

| Arquivo | Ocorrências | Veredito |
|---|---|---|
| `src/components/ArenaGame.tsx` | 8 | **Regra de combate inteira dentro do componente** (dano, contra-ataque, cura). Sem dono em `src/utils/`. |
| `src/components/DungeonGame.tsx` | 4 | `newHp = Math.max(0, enemyHp - dmg)`, `setPlayerHp(hp => Math.min(playerStats.hp, hp + heal))` — cálculo de HP no componente; só `buildDungeonWave`/`rollDungeonHeartDrop` moram em `src/utils/dungeon.ts`. |
| `src/components/NightmareBattle.tsx` | 3 | idem, combate no componente. |
| `src/components/CompanionHUD.tsx` | 8 | `hp: Math.max(0, Math.min(4, Math.round(hpRatio*4)))`, `bond: Math.max(1, Math.min(31, bondLevel))` — **quantização de HP/energia/vínculo para o prompt da IA** com constantes mágicas (4, 31) que não vêm de `progression.ts`/`bond.ts`. |
| `src/components/HabitConstancy.tsx` | 1 | `Math.min(REST_SHIELD_MAX, rhythm.shields)` — usa a constante do dono, aceitável. |
| `src/components/RestWindowCard.tsx`, `GuideModal`, `HelpModal`, `PetStageDecor`, `AccountDataSection` | 1–2 | Apresentação (largura de barra, timer). OK. |

Conclusão: **os três minijogos são a exceção do "um dono por regra"**. Combate de Arena/Masmorra/Pesadelo não tem função pura, não tem paridade com nada e é exatamente onde a R-NOVA de som já foi violada uma vez (`ArenaGame.tsx`, ver `CLAUDE.md`). A `CompanionHUD` quantiza estado para a IA com números que nenhum teste trava.

---

## 3. Superfícies

| Superfície | Como builda | Config de URL | CI (`.github/workflows/`) | Teste |
|---|---|---|---|---|
| **Web/PWA** | `npm run build` = `vite build && node scripts/convert-to-webp.mjs && npx wrangler pages functions build --outdir=./dist/_worker.js/`; publicação pelo git-integration do Cloudflare no push da `main` + `dist/` commitado | `wrangler.jsonc` (`main: ./dist/_worker.js/index.js`, `assets.directory: ./dist`) | `ci.yml` (tsc app + server + desktop, `vitest run`) — **NÃO roda `npm run build`**; quem prova que o build passa é `android-build.yml` (como efeito colateral) e o Cloudflare. `docs-sync.yml` roda 2 guards. | 246 `src/**/*.test.ts*` (`find src -name '*.test.ts*' \| wc -l`); `src/deploy/*.contract.test.ts`, `src/security/*.test.ts`, `tests/swOrigemDaResposta.test.ts` |
| **APK (Capacitor)** | `android-build.yml`: `npm run build` → `npx cap sync android` → `gradlew assembleDebug` (+ release assinado, + smoke no emulador via `.github/scripts/apk-smoke.sh`) | `capacitor.config.json` (`server.url`, `cleartext:false`), régua `src/deploy/appUrl.contract.test.ts` | **Sim** (push em `main`, `version-b` — branch que o `CLAUDE.md` diz não existir). Artefato ainda se chama `digiapp-debug-*`. | **Zero** teste Kotlin (`find android -path '*/test/*' -name '*.kt' \| wc -l` → 0); 13 fontes Kotlin/Java; 4 guards em `node` leem o FONTE Kotlin como texto (`grep -rlE "android/app/src" src --include=*.test.ts \| wc -l` → 4). Smoke de emulador é o único teste comportamental. |
| **Desktop (Electron)** | `desktop/package.json`: `dist` = `vite build && electron-builder --win`; `dist:publish`, `dist:steam` | `desktop/renderer/src/config.ts` (`APP_URL`) + `desktop/electron/main.js` (`FULL_APP_URL`), mesma régua `appUrl.contract.test.ts` | `desktop-build.yml` (só em `paths: desktop/**`…), `desktop-release.yml` (só por tag). `ci.yml` faz `tsc -p desktop/tsconfig.json`. | 11 `desktop/renderer/**/*.test.ts`; **zero** para `desktop/electron/*` (`main.js`, `navigationPolicy.js`, `updatePolicy.js`, `auth-preload.js`) — políticas de navegação e update sem teste. |
| **Widgets Android** | Dentro do APK (`WidgetRenderer.kt`, 5 providers, `WidgetRefreshWorker.kt`) | n/a (lê `SharedPreferences` via `SoulmonWidgetPlugin`) | Só o que o `android-build.yml` compila | Guard textual `src/plugins/widgetSemCobranca.contract.test.ts`; nada roda o renderer. |
| **Worker de push** (`workers/`) | `wrangler deploy` manual dentro de `workers/` (`wrangler.toml`, nome ainda `digiapp-push-scheduler`) | `workers/wrangler.toml` `[vars] APP_URL` — **quarta fonte da URL**, fora da régua `appUrl.contract.test.ts` (que cobre 3) | **Nenhum workflow deploya**; `ci.yml` só faz `tsc -p tsconfig.server.json` | 3 testes (`push-scheduler.test.js`, `pushCopy.parity.test.js`, `vapid.parity.test.js`) |
| **Supabase Edge Function** (`src/supabase/functions/server/`) | Não builda aqui (`npm:hono`, Deno); excluída do `tsconfig.json` | — | **Nenhum** | **Nenhum** |

**Sem CI nenhum**: deploy do worker de push; Supabase Edge Function; `desktop/electron/*`; qualquer teste em Kotlin. **Sem build no CI de testes**: o web (`ci.yml` não builda).

Nota de precisão: o `CLAUDE.md` chama de "Cloudflare Pages", mas `wrangler.jsonc` é a forma de **Workers + Static Assets** (`main` + `assets.binding: ASSETS`), e a URL é `*.workers.dev`. As Functions são compiladas para `dist/_worker.js` pelo `wrangler pages functions build`. Funciona; a nomenclatura na doc é a de antes.

---

## 4. Servidor e mapa de dados

**Correção à premissa da tarefa**: `wrangler.jsonc` **TEM** binding D1 — `d1_databases: [{ binding: "DB", database_name: "soulmon-billing", database_id: "43546903-…" }]` (`cat wrangler.jsonc`). O que NÃO existe é aplicação automática de `migrations/` (é `wrangler d1 execute … --remote --file` à mão, conforme `migrations/README.md`).

### 4.1 Bindings

| Binding | Onde | Uso |
|---|---|---|
| `SOULMON_SAVES` (KV) | `wrangler.jsonc` | preferido por `kv(env)` em `functions/api/_kv.js` |
| `DIGIAPP_SAVES` (KV) | `wrangler.jsonc` | fallback de `kv(env)`; **mesmo namespace físico** ainda (pendência do painel do dono) |
| `PUSH_SUBSCRIPTIONS` (KV) | `wrangler.jsonc` **e** `workers/wrangler.toml` (mesmo id `12dd88d3…`) | subscriptions Web Push + FCM |
| `DB` (D1 `soulmon-billing`) | `wrangler.jsonc` | só `functions/api/_entitlements.js` (`grep -rn "env.DB\|.prepare(" functions/api/*.js \| grep -v test` → 10 ocorrências, 1 arquivo) |
| `ASSETS` | `wrangler.jsonc` | estáticos de `dist/` |

### 4.2 Chaves no KV de saves (`kv(env)`) — inventário por `grep -rhoE` dos prefixos em `functions/api/*.js` (sem test)

| Prefixo / chave | Dono (arquivo) | Conteúdo | TTL |
|---|---|---|---|
| `<saveId>` (32 hex, sem prefixo) | `save.js` | o save inteiro (JSON) | `SAVE_TTL_SECONDS` |
| `ent:<saveId>` (`ENT_PREFIX`) | `_entitlements.js` | tier/créditos; subcampos `.aiForms.<formId>`, `.aiLifetime.<bucket>` | ver `_entitlements.ttl.test.js` |
| `ord:*` (`ORDER_PREFIX`) | `_entitlements.js`/`_billing.js` | comprovantes (espelho; a fonte de verdade do claim é D1) | — |
| `steam:own:<appId>:<steamId>`, `steam:txn:<orderid>` | `_billing.js` | licença/transação Steam | — |
| `profile:<saveId>`, `pid:<pid>` (`PID_PREFIX`), `gifts:<saveId>`, `rank:<season>:<id>`, `closed:<season>`, `coop:<gid>`, `week_active*` (`WEEK_GOAL_PREFIX`) | `community.js`, `account.js` | perfil público, id curto, presentes, ranking do torneio, fechamento de season, coop, meta semanal | — |
| `del:*` (`DEL_PREFIX`) | `account.js` | marcação de exclusão de conta | — |
| `ai:<bucket>:<saveId>:<dia>` + chave global | `_aiGuard.js` | contadores de uso de IA (por conta e global) | `TTL_SECONDS` / `globalTtl` |
| `sprite:img:<saveId>:<formId>` (`CACHE_PREFIX`), `sprite:blob:<token>` (`BLOB_PREFIX`), `sprite:lock:<save>:<form>` (`LOCK_PREFIX`) | `generate-sprite.js`, `sprite-image.js` | cache/blob/lock de sprite gerado | — |
| `m:<YYYY-MM-DD>` (`METRICS_PREFIX`) | `metrics.js` | agregado diário de telemetria | 730 dias |

### 4.3 Chaves em `PUSH_SUBSCRIPTIONS`

| Prefixo | Escreve | Lê |
|---|---|---|
| `push:<sha(endpoint)>` | `functions/api/subscribe.js` | `workers/webpush.js` (list por prefixo) |
| `fcm:<sha(token)>` | `functions/api/fcm-subscribe.js` | `workers/fcm.js` |

### 4.4 D1 (`migrations/`)

| Tabela | Migração | Colunas relevantes | Quem usa |
|---|---|---|---|
| `order_claims` | `0001_order_claims.sql` (`CREATE TABLE IF NOT EXISTS`), `0002_order_claims_expires_at.sql` (`ADD COLUMN expires_at`) | comprovante → conta, `expires_at` | `_entitlements.js` (`claimOrder`; `SELECT/INSERT/UPDATE order_claims`) |

### 4.5 Riscos de dado que o mapa expõe

1. **Save com `put` cego** (`save.js`): sem `revision`, sem 409. O tipo do 409 já existe em `src/utils/cloudSave.ts` (`CLOUD_SAVE_POLICY.conflict`) — ADR-001 §3 não implementada. Dois aparelhos = last-write-wins silencioso; o desktop é um segundo escritor por design.
2. **Métricas com read-modify-write em KV** (`metrics.js`: `get` → merge → `put`): KV não tem CAS; duas requisições no mesmo dia perdem incrementos. Aceitável para telemetria, mas o `REGISTRO-DE-DECISOES.md` §7 baseia "12 apostas" nesses números.
3. **Rate limit por isolate** (`_rateLimit.js`: `const buckets = new Map()`) — declarado no cabeçalho do arquivo. Reset a cada cold start, um contador por PoP. Não é rate limit, é atenuador.
4. **Tudo num namespace KV só**: save, dinheiro (`ent:`), comunidade, IA, sprites, métricas. Um `list` sem prefixo ou uma limpeza por engano toca tudo. A separação `SOULMON_SAVES`/`DIGIAPP_SAVES` ainda é lógica, não física.
5. **`PUSH_SUBSCRIPTIONS` compartilhado entre dois deploys** (Pages/Worker de assets + worker cron) com `compatibility_date` diferentes (`2026-07-16` vs `2024-09-23`).

---

## 5. Build e scripts

| Arquivo | Papel | Nota |
|---|---|---|
| `vite.config.ts` | alias `figma:asset/*` (2 entradas), `assetsInlineLimit: 0`, `manualChunks: { vendor: [react, react-dom] }`, `server.open: true` | Só um chunk manual; `open: true` é o footgun 7 (mata `vite preview` sem navegador). |
| `vitest.config.ts` | `environment: 'node'` global, render tests optam por `// @vitest-environment jsdom`; include cobre `src`, `functions`, `workers`, `desktop/renderer`, `tests`; timeout de `vitest.budget.mjs` | Coverage exclui `src/components/ui/**`. |
| `tsconfig.json` | strict, `paths: class-system → vendor/class-system/index.d.ts`; exclui `src/supabase/functions` | |
| `tsconfig.server.json` | `checkJs` sobre `functions/**/*.js` + `workers/**/*.js`, `types/cloudflare-workers.d.ts` | |
| `desktop/tsconfig.json` | typecheck do overlay (CI) | |

**Scripts** (`ls scripts/` → 28 arquivos). Referências contadas com `grep -rl "<nome>"` em `package.json`, `.github/workflows`, `docs`, `CLAUDE.md`, `README.md`:

| Script | Papel | Referências | Estado |
|---|---|---|---|
| `convert-to-webp.mjs` | pós-build PNG→WebP em `dist/assets` | `package.json` build | vivo |
| `sync-oracle-data.mjs`, `vendor-class-system.mjs` | snapshot dos repos irmãos | `package.json`, `sync-irmaos.yml` | vivo |
| `gen-cascata-fixtures.mjs`, `orcamento-de-tempo.mjs` | fixtures / medidor de tempo de teste | `package.json` | vivo |
| `docs-inventario.mjs`, `docs-delta.mjs` (+ `.d.mts`) | inventário/delta do manual | `docs-sync.yml`, docs | vivo |
| `gerar-vapid.mjs`, `mutation-sweep.mjs`, `validate_squad.py`, `gen-ui-assets.sh`, `gen-decor.mjs`, `gen-decor-remaining.sh`, `decor-para-caixa.mjs`, `fatiar-folha.mjs`, `dechecker.mjs`, `aventura-desenhar.mjs` | ferramentas de arte / setup | 1–3 (docs) | vivo por doc, não por build |
| `debackground-lines.mjs`, `gen-soulmon-placeholders.mjs`, `finalize-oracle-sprites.sh`, `simulate-oracle-lines.ts` | arte antiga / simulação | 1–2 (só prosa de docs antigas) | **candidato a órfão** |
| **`decor-desenhar.mjs`, `gen-line-from-oracle.sh`, `gen-line.sh`, `gen-soulmon-lines.mjs`, `process-line-sprites.sh`** | pipeline de "linhas" de sprite da era pré-Higgsfield | **0** referências fora de `scripts/` | **órfãos** |

Também na raiz, sem referência de build: `registerSW.js`, `index.html.example`, `manifest.webmanifest` (há `manifest.json` em `public/`), `browserconfig.xml`, `icon-template.svg`, `PWA-CHECKLIST.md`, `PWA-SETUP.md`, `PLANO_MELHORIAS.md`, `PROJETO.md`, `CONTRACT.md` — herança do scaffold, não medida por nenhum guard.

---

## 6. `dist/` commitado

| Medida | Comando | Valor |
|---|---|---|
| Tamanho | `du -sh dist` | **123 MB** (`dist/assets` 122 MB; `dist/_worker.js` 168 KB) |
| Arquivos | `find dist -type f \| wc -l` / `git ls-files dist \| wc -l` | 3016 / 3016 (o manual §2.1 diz 481 — **6× desatualizado**) |
| Assets > 500 KB | `find dist -type f -size +500k \| wc -l` | **46** |
| PNG × WebP | `find dist/assets -name '*.png' \| wc -l` / `*.webp` | 1463 PNG (100 MB) + 1465 WebP (13 MB) |
| Pack do git | `git count-objects -vH` | **553 MiB** |

Os 46 grandes: `dungeon-1..10-*.png` (2,8–3,2 MB cada), `tournament-*.png`, `minigame-*.png` (2,5–3,3 MB), ~30 `bg-*.png` (0,9–1,5 MB), `evolution-bg-*.mp4` 3,7 MB, `intro-*.mp4` 2,4 MB, `pool-*.js` 0,8 MB, `index-*.js` 0,6 MB.

**Avaliação do risco**:

- **O PNG é peso morto em 87 %**: o `sw.js` reescreve `.png → .webp` quando o navegador aceita (`public/sw.js`, ramo `Accept: image/webp`), então 100 MB de PNG em `dist/` só servem ao primeiro carregamento sem SW ou a navegadores sem WebP (nenhum alvo do app). O `convert-to-webp.mjs` mantém "alongside originals" por decisão explícita — decisão que custa 100 MB por build commitado.
- **Cada build gera hash novo por asset**: 3016 arquivos rehasheados a cada `npm run build` + commit. O pack já está em 553 MiB; `git clone` e o `npm ci` do CI pagam isso a cada run (o `android-build.yml` faz checkout completo).
- **Dois builds, uma verdade**: o CF também builda no push; se o `dist/` commitado e o build do CF divergirem (ex.: `.env` local), o que sobe é o do CF — o `dist/` no git é documentação com peso de binário. O `CLAUDE.md` justifica o commit pelo `.env.production`; a régua `firebaseNoBuild.contract.test.ts` já resolve isso sem precisar do `dist/`.
- **Falta orçamento de bundle**: nenhum guard mede `index-*.js` (638 KB) nem `pool-*.js` (809 KB). O `astronomy-engine` entra por import dinâmico, mas nada impede alguém de importá-lo estático amanhã.
- **Risco real de operação**: baixo hoje (funciona). Risco de **manutenção**: alto e crescente — o repo dobra de tamanho a cada ~3 meses de builds e ninguém vai conseguir `git bisect` numa história de binários.

Recomendação (chata e reversível): 1) parar de commitar PNG quando houver WebP (script apaga o PNG após converter; `sw.js` já cobre); 2) só depois discutir tirar `dist/` do git — precisa que o CF builde com as `VITE_*` certas, o que a régua `firebaseNoBuild` já garante via `.env.production` commitado.

---

## 7. Dependências (`package.json`)

Método: `grep -rhoE "from ['\"]<pkg>" src functions workers desktop/renderer desktop/electron tools tests` (sem `dist/`, sem `node_modules`). Tamanho: `du -sm node_modules/<pkg>`.

**Não usadas por nenhum import** (só aparecem em `src/vite-env.d.ts` como `declare module`, ou em lugar nenhum):

| Grupo | Pacotes | Peso instalado |
|---|---|---|
| Radix (scaffold shadcn) | `@radix-ui/react-{accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toggle, toggle-group, tooltip, slot}` — **26 pacotes** | ~1 MB cada |
| shadcn utilitários | `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `input-otp`, `next-themes`, `react-hook-form`, `react-day-picker`, `react-resizable-panels`, `vaul`, `embla-carousel-react`, `recharts` (6 MB) | |
| Servidor Deno | `hono` (3 MB) — usado só por `src/supabase/functions/server/index.tsx` via `npm:hono`, que **não** resolve por `node_modules` | |

`src/components/ui/` tem hoje 9 arquivos (`Icon`, `MiniGlass`, `NavGlyphs`, `OfflineSeal`, `ScreenSkeleton`, `Viewport`, `sonner` + 2 testes) — o scaffold shadcn já foi removido, as dependências ficaram. **38 pacotes em `dependencies` sem um único import.** Não vão para o bundle (tree-shaking), mas vão para `npm ci`, para o lockfile, para o Dependabot e para o superfície de supply-chain.

**Usadas, mas pesadas / a observar**:

| Pacote | Import sites | Peso | Nota |
|---|---|---|---|
| `firebase` `^12` | 1 (`src/utils/auth.ts`) | **58 MB** instalado | Só auth. Candidato a `firebase/auth` modular já é o caminho; medir o chunk real. |
| `astronomy-engine` | 1 (`soulProfile/astrology/chart.ts`) | 2 MB | Import dinâmico, correto. |
| `@jsr/supabase__supabase-js` | 0 import direto (só `declare module`) | | O `ChatBox` usa `/api/transcribe`; o cliente JS parece ficar só pela Edge Function. Confirmar antes de tirar. |
| `sonner` | 8 | | Único toast — ok. |
| `@capgo/capacitor-pedometer` | 1 (`src/utils/steps.ts`) | | Sensores (Fase 4) dependem do dono — está instalado sem uso de produto. |

**Duplicatas**: nenhuma "dois clientes da mesma coisa" real. `manifest.json` + `manifest.webmanifest` na raiz são duplicata de arquivo, não de pacote.

**`@types/react ^19` com `react ^18`**: `devDependencies` tem `@types/react ^19.2.17` e `@types/react-dom ^19.2.3` para `react ^18.3.1`. Compila hoje; é bomba de tipo na próxima minor.

---

## 8. ADRs

`find . -iname "*adr*"` (fora de `node_modules`/`dist`) → 3 ADRs, **nenhuma em `docs/`, nenhuma no git** (`git ls-files squad-alpha-runs | wc -l` → 0; a pasta `squad-alpha-runs/` está fora do repo — 55 MB locais). O único "ADR" versionado é a menção `ADR-002 §1` em `docs/STATUS.md` e no comentário do `tsconfig.json`.

| ADR | Arquivo | Status escrito | Vale hoje? |
|---|---|---|---|
| **ADR-001** — Mesma conta, mesmo save, em qualquer plataforma | `squad-alpha-runs/soulmon-02/adr-conta-e-save.md` | proposta (aguarda fatia 1) | **Parcialmente**. saveId único e paridade tripla (`saveId.parity.test.js`) estão feitos. **`revision` + 409 (§3) e `GET /api/whoami` (§2) NÃO existem** (`grep -rn revision functions/api/save.js` → 0; `grep -rln whoami functions/api/*.js` → 0). Continua sendo a decisão certa; o que falta é o que o dono adiou ("UI antes de infra"). |
| **ADR-002** — Propagação viva dos repos irmãos | `squad-alpha-runs/soulmon-02/adr-repos-irmaos.md` | proposta | **Adotada de fato**: `vendor/class-system/` com `_provenance.json`, `sync-irmaos.yml` semanal abrindo PR, `tsconfig.json` paths. É a única ADR com trilha em código e a única citada por doc versionado — e o arquivo dela não está no repo. |
| **ADR-003** — Teto de −1 dBTP por construção; `AudioWorklet` adiado | `squad-alpha-runs/som-01/prototyper/adr-limitador-audioworklet.md` | proposed, numeração provisória | **Vale**: `src/utils/audioBus.ts` não tem `AudioWorklet` nem `DynamicsCompressor` (`grep -nE "AudioWorklet\|DynamicsCompressor" src/utils/audioBus.ts` → 0); o "limitador" citado no `CLAUDE.md` é política em `loudness.ts`, não um nó de runtime. Gatilho de revisão (§6 da ADR) nunca foi medido. |

O `docs/REGISTRO-DE-DECISOES.md` (932 linhas) é o registro real de decisões — de **produto** (S1..S16 de som, 12 apostas falseáveis). Não há registro equivalente para decisões de **arquitetura** (KV único, `dist/` commitado, Workers vs Pages, FCM + WebPush, D1 só para billing, Firebase Auth). Cada uma está justificada em prosa espalhada pelo `CLAUDE.md`, sem alternativas nem sinal de reversão.

---

## 9. Tabela de dívidas arquiteturais (custo de manter × risco)

Escala: custo = quanto cada mudança paga hoje por causa da dívida; risco = probabilidade × dano de quebra silenciosa.

| # | Dívida | Onde (símbolo) | Custo de manter | Risco | Ação mais barata que resolve |
|---|---|---|---|---|---|
| D1 | Orquestrador de 6.149 linhas, 80 `setGameState`, 62 estados | `src/App.tsx` | **Alto** — toda feature toca ele; agentes leem parcial | Médio (guards X-6 seguram o pior) | Extrações §1.1, ordem 1→5→4→2→3 |
| D2 | `dist/` commitado com 100 MB de PNG redundante; pack 553 MiB | `scripts/convert-to-webp.mjs`, `public/sw.js` | **Alto** (clone/CI/bisect) e cresce | Baixo hoje | Apagar PNG após WebP; medir; depois decidir sobre `dist/` |
| D3 | 38 dependências mortas do scaffold shadcn + `hono` | `package.json`, `src/vite-env.d.ts` | Médio (lockfile, audit, `npm ci`) | Médio (supply-chain sem uso) | Remover + guard "todo pacote de `dependencies` tem import" |
| D4 | Save `put` cego, sem `revision`/409 | `functions/api/save.js`, `CLOUD_SAVE_POLICY.conflict` | Baixo | **Alto** quando desktop + celular escrevem (já é o desenho) | ADR-001 §3 — adiada pelo dono; registrar como risco aceito com data |
| D5 | Regra de combate dentro de componente (3 minijogos) + quantização mágica para IA | `ArenaGame.tsx`, `DungeonGame.tsx`, `NightmareBattle.tsx`, `CompanionHUD` (`hp`/`bond` clamp) | Médio | Médio (sem paridade, sem teste puro; já reintroduziu som cortado) | `src/utils/combat.ts` puro + constantes vindas de `progression.ts`/`bond.ts` |
| D6 | Worker de push sem CI e com URL fora da régua | `workers/wrangler.toml` `APP_URL`, `push-scheduler.js` | Baixo | **Alto** (deploy manual esquecido = push parado sem alarme) | Incluir `APP_URL` do toml em `appUrl.contract.test.ts`; job `wrangler deploy` em `workers/**` |
| D7 | `ci.yml` não roda `npm run build` | `.github/workflows/ci.yml` | Baixo | Médio (build quebrado só aparece no android-build ou no CF) | Adicionar step de build (sem commit de `dist/`) |
| D8 | KV único para save/dinheiro/comunidade/IA/métricas; `DIGIAPP_SAVES` = mesmo id físico | `functions/api/_kv.js` `kv(env)` | Baixo | Médio (blast radius) | Painel do dono (já pendente); depois `ent:` para D1 |
| D9 | Rate limit em `Map` por isolate | `functions/api/_rateLimit.js` `buckets` | Baixo | Médio (IA paga por chamada; `_aiGuard` em KV é a defesa real) | Documentar como atenuador; Durable Object só se custo de IA subir |
| D10 | Métricas read-modify-write em KV | `functions/api/metrics.js` `METRICS_PREFIX` | Baixo | Baixo-médio (apostas §7 lidas de número com perda) | Contar por evento (`m:<dia>:<uuid>`) e agregar na leitura, ou aceitar e escrever a margem de erro no REGISTRO |
| D11 | Zero teste em Kotlin; Electron `main.js`/políticas sem teste | `android/**/*.kt`, `desktop/electron/*.js` | Médio | Médio | Extrair `navigationPolicy`/`updatePolicy` já são módulos — testá-los em `node`; Kotlin: pelo menos unit de `WidgetRenderer` |
| D12 | `ViewType` duplicado | `src/App.tsx`, `src/components/BottomNav.tsx` | Baixo | Baixo | Dono único em `src/types/` |
| D13 | ADRs fora do repo; decisões de infra sem alternativas registradas | `squad-alpha-runs/*/adr-*.md` | Médio (cada agente re-decide) | Médio | Promover as 3 para `docs/adr/` e escrever ADR-004..007 para KV/dist/Workers/Auth |
| D14 | `@types/react` 19 com React 18; `version-b` no workflow; artefato `digiapp-debug`; `digiapp-push-scheduler` | `package.json`, `android-build.yml`, `workers/wrangler.toml` | Baixo | Baixo | Limpeza de nome/versão |
| D15 | Supabase Edge Function commitada sem build, sem teste, fora do typecheck | `src/supabase/functions/server/` | Baixo | Baixo-médio (código morto que parece vivo) | Mover para `supabase/` na raiz ou apagar se `/api/transcribe` a substituiu |
| D16 | Raiz com scaffold PWA duplicado | `manifest.webmanifest`, `registerSW.js`, `index.html.example`, `PWA-*.md` | Baixo | Baixo | Apagar |

---

## 10. O que NUNCA foi analisado arquiteturalmente

Sem ADR, sem seção no manual, sem guard — só prosa de "como é":

1. **Workers + Static Assets vs Pages** — a doc diz Pages, o `wrangler.jsonc` diz Worker; ninguém decidiu, aconteceu.
2. **Um namespace KV para tudo** (save, dinheiro, social, IA, métricas, sprites) — nenhuma alternativa (D1 para `ent:`/`profile:`, R2 para `sprite:blob:`) foi pesada.
3. **Concorrência de escrita no save** (celular + desktop + PWA) — ADR-001 nomeia, ninguém quantificou frequência nem dano.
4. **Orçamento de bundle e de assets** — nenhum número-alvo para `index-*.js` (638 KB), `pool-*.js` (809 KB), nem para o primeiro carregamento com 30 `bg-*.png` de ~1 MB.
5. **Estratégia de estado no cliente** — `useState` monolítico de 110 campos vs. slices/contexts por domínio; o custo de re-render nunca foi medido, só a régua de throttle.
6. **Firebase Auth como dependência única de identidade** (58 MB instalado, JWT verificado em `_auth.js`) — sem alternativa registrada e sem plano de saída.
7. **FCM + Web Push convivendo** — o histórico está no `CLAUDE.md`, mas o custo de operar dois canais (dois secrets, dois dedupes já quebrados uma vez) não virou decisão com sinal de reversão.
8. **Ciclo de deploy do worker de push** (manual) e da migração D1 (manual) — ninguém definiu quem aperta e quando.
9. **Tamanho do repositório e política de binários** (`dist/`, `src/assets/`, `public/sounds/`, `squad-alpha-runs/` fora do git) — LFS, artefato de CI ou commit nunca foram comparados.
10. **Minijogos como subsistema** — Arena/Masmorra/Pesadelo/Torneio têm regras próprias, HP próprio, servidor próprio (`community.js`), e nenhum documento os trata como módulo com fronteira.
11. **Superfície Supabase** — o que ainda depende dela depois de `/api/transcribe`, e se o pacote cliente e a Edge Function podem sair.
12. **Versionamento do esquema do save** (`soulmon_state_v1`): o `?? padrão` no load é a única migração; não há número de versão nem teste de "save de 3 meses atrás ainda abre".

---

## Anexo — comandos usados (para reproduzir)

```
wc -l src/App.tsx
grep -c "useState" src/App.tsx; grep -c "useEffect(" src/App.tsx; grep -c "useCallback(" src/App.tsx
grep -cE "const (handle|on)[A-Z]\w* =" src/App.tsx
grep -oE "currentView === '[a-zA-Z_-]+'" src/App.tsx | sort -u | wc -l
grep -rn "type ViewType" src
wc -l src/contexts/GameStateContext.tsx
grep -rl "setGameState(" src | grep -v test | xargs -I{} sh -c 'echo "$(grep -c "setGameState(" {}) {}"'
grep -rnE "Math\.(floor|min|max|round)\(" src/components --include=*.tsx | grep -v test | grep -iE "hp|health|energy|xp|bits|heart|level|stage|constancy|shield|weight|goal" | cut -d: -f1 | sort | uniq -c
ls .github/workflows/; grep -n "build" .github/workflows/ci.yml
cat wrangler.jsonc; cat workers/wrangler.toml; cat functions/api/_kv.js
grep -rhoE "(const|let) [A-Z_]*PREFIX\w* = ['\"\`][^'\"\`]+" functions/api/*.js
grep -rn "env.DB\|.prepare(" functions/api/*.js | grep -v test | cut -d: -f1 | sort | uniq -c
du -sh dist; find dist -type f -size +500k | wc -l; find dist -type f | wc -l; git ls-files dist | wc -l
find dist/assets -name '*.png' | wc -l; find dist/assets -name '*.webp' | wc -l; git count-objects -vH
ls scripts/; for s in $(ls scripts/); do grep -rl "scripts/$s" package.json .github/workflows docs CLAUDE.md README.md | wc -l; done
grep -rhoE "from ['\"](@[a-z0-9-]+/[a-z0-9._-]+|[a-z0-9._-]+)" src functions workers desktop/renderer desktop/electron tools tests | sort | uniq -c
find . -path ./node_modules -prune -o -iname "*adr*" -print; git ls-files squad-alpha-runs | wc -l
find android -path '*/test/*' -name '*.kt' | wc -l; find desktop/electron -name '*.test.*' | wc -l
```
