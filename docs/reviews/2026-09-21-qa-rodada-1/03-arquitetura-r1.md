# Arquitetura — 2ª passada (QA rodada A, 21/09/2026, noite)

> Base: `D:\Soulmon\repo`, branch `qa/rodada-a`, HEAD `5228145e`. Somente leitura. Cada número tem comando.
> Referência canônica: `caminho` + SÍMBOLO. Não repete o que a review 05 já listou, salvo "ainda aberto".
> Rascunhos de ADR em `E:/tmp/claude/D--Soulmon/cd027ac4-4330-4f5c-b0a7-b8a491506f57/scratchpad/qa2/adr-propostas/` — **não** em `docs/`.

## 0. Veredito em três linhas

1. O risco arquitetural nº 1 não é o que a review 05 nomeou ("`put` cego"): é que **o cliente web nunca relê a nuvem depois do login** (`src/App.tsx`: 16 usos de `cloudLoad`/`adoptCloudSave`, todos em fluxo de identidade; `GameStateContext.tsx` inicializa só de `localStorage`). Com o overlay Electron escrevendo por `GET→POST`, o celular apaga a tarde inteira do desktop na primeira tarefa da noite. `revision` sozinha (ADR-001 §3) trocaria "perda silenciosa" por "409 em toda sessão". ADR-004 traz a metade que faltava.
2. **O CI está morto desde 16/09/2026 por cobrança do GitHub** — 0 workflows executados em 5 dias (`gh run list`: 40 `CI` + 31 `Android APK` + 3 `Desktop` com `failure` em 2–6 s; anotação: *"The job was not started because recent account payments have failed or your spending limit needs to be increased"*). Todo `[verificar no CI após o merge]` de hoje — target 36, `versionCode` 15, deps removidas, PNG do `dist/` — **não foi verificado por ninguém**. Toda "régua viva" desde 15/09 roda só na máquina de quem lembra de rodar.
3. `dist/` caiu de 123 MB para 24 MB no working tree, mas **a curva de crescimento do repo não mudou**: cada commit de build acrescenta ~0,5 MiB de JS/CSS rehasheado (medido em 3 commits), e 459 dos 1.070 commits dos últimos 3 meses tocam `dist/`. O PNG era peso parado; o que cresce é o hash do bundle.

---

## 1. ADRs — os três de maior risco (rascunhos)

| ADR | Tema | Por que é dos três | Arquivo |
|---|---|---|---|
| **ADR-004** | Concorrência do save | Perda de dado hoje, com o dono como usuário; auth já ligada (`wrangler.jsonc` › `FIREBASE_PROJECT_ID`), então a premissa "fail-open" da ADR-001 caiu e o que sobra é integridade | `adr-propostas/ADR-004-concorrencia-do-save.md` |
| **ADR-005** | Namespace KV único | `spendCredits` (`_entitlements.js`) é leitura-modificação-escrita sem CAS em store eventual — dinheiro; o D1 já existe e já resolve o mesmo problema para `claimOrderAtomic`. Correção à review 05 §4.1: `SOULMON_SAVES` **já é** namespace físico próprio (`20b3ba78…`, desde `6e2d991b`, 07/09) — `CLAUDE.md` §Deploy ("ainda aponta para o namespace herdado") e `docs/SEPARACAO-DIGIAPP.md` passo 2 estão velhos | `adr-propostas/ADR-005-namespace-kv-unico.md` |
| **ADR-006** | Versionamento do esquema do save | Três clientes com ciclos de deploy distintos; migração por presença de campo (`migrateDecor`, `careCaps`, `conquistasHerdadas` — esta entrou hoje); save do futuro indetectável; 1 fixture escrita à mão (`legacySave.test.tsx`) | `adr-propostas/ADR-006-versionamento-do-esquema-do-save.md` |

**Workers vs Pages ficou de fora, e o motivo é registrado:** não é decisão em aberto — é decisão **tomada de fato** (`wrangler.jsonc` › `main` + `assets`; URL `*.workers.dev`; o operador confirmou hoje "produção é Worker") com **documentação errada** (`CLAUDE.md` chama de Pages; `npm run build` usa `wrangler pages functions build` para gerar `dist/_worker.js` — funciona, é hack). O risco real dela é operacional, não estrutural: `vars` no `wrangler.jsonc` sobrescrevem o painel a cada deploy (o checklist da Play já manda tudo como secret). Cabe um ADR de registro de 1 página ("por que Worker, o que muda se voltar a Pages: nada de código, só `wrangler.jsonc`"), sem alternativas a pesar. Prioridade abaixo das três acima.

Nota comum às três: os rascunhos seguem o cabeçalho da `docs/adr/ADR-001` (Dono/Data/Estado/Verificação/Não cobre/Precedência) e trazem Contexto com evidência por símbolo, Decisão, Alternativas com prós/contras/por que não, Consequências com custo e gargalo com volume, "O que reverteria", Perguntas ao dono e Handoffs. ADR-004 e ADR-006 mudam o formato do registro na KV **uma vez só** se executadas juntas (envelope `{ v, revision, h, state }` + `schemaVersion` no `state`).

---

## 2. `deletePushSubscriptions` — índice inverso `pushidx:<saveId>` e a ordem de `delete-confirm`

### 2.1 O que está errado hoje (confirma o ALTO da segurança, e amplia)

`functions/api/account.js` › `deletePushSubscriptions`: `listPrefix` (até `MAX_SCAN_PAGES` = 20 páginas × 1000) e **um `get` por chave** de `push:*` e `fcm:*` — do namespace inteiro, não do titular. KV `get` conta no teto de subrequests do Worker (50 no plano free, 1000 no pago — `[plano do dono a confirmar]`). Estoura em ~900 inscrições totais. **O mesmo padrão está no passo 2** (`handleDeleteConfirm` › varredura de `profile:` com `get` por perfil para limpar `friends[]`) — um perfil por usuário, portanto estoura em ~900 usuários. A segurança nomeou só o push; a família tem dois membros.

Agravante de ordem: o passo 1 apaga o save **antes** dos dois scans. Quem estoura o teto recebe 500 **já sem save**, e o retry encontra `404`/nada a apagar mas o token `del:` ainda válido — a segunda chamada refaz os scans e estoura de novo.

### 2.2 Desenho do índice inverso

**Chave:** `pushidx:<saveId>` no namespace `PUSH_SUBSCRIPTIONS` (mesmo binding das inscrições — o worker de cron e as duas rotas já o têm; não se cria binding).
**Valor:** `{ v: 1, keys: { "push:<hash>": <refreshedAt>, "fcm:<hash>": <refreshedAt> }, updatedAt }`. Teto **16 entradas** (uma pessoa tem poucos aparelhos; 16 é folga de 5×); ao exceder, sai a de `refreshedAt` mais velho. Teto é o que mantém a exclusão em O(1) mesmo contra um cliente que grava lixo.
**TTL:** `TTL_INSCRICAO` (1 ano, `_pushIdentity.js`), renovado a cada escrita de membro — o índice nunca vive mais que a inscrição mais nova que aponta. Índice órfão (todos os membros já expiraram/410) morre sozinho em ≤ 1 ano; até lá, `get` de membro devolve `null` e a exclusão pula.

**Quem grava:**

| Momento | Onde | O que faz | Custo extra |
|---|---|---|---|
| `POST /api/subscribe` e `POST /api/fcm-subscribe` com `saveId` válido | `_pushIdentity.js` › nova `indexarInscricao(kv, saveId, chave)` chamada logo após `gravarSeMudou` | `get` do índice → se a chave não está lá **ou** o índice está mais velho que `REFRESCA_APOS_MS` (30 d, mesma constante de `gravarSeMudou`) → `put` com TTL | +1 `get` por abertura de app; +1 `put` por aparelho novo ou por mês |
| `DELETE /api/subscribe` / `DELETE /api/fcm-subscribe` | as duas rotas | `get` do registro antes do `delete`; se tem `saveId`, remove a chave do índice (`get`+`put`) | +1 `get` (+2 se indexado). Best-effort: falhar aqui deixa entrada morta, inofensiva |
| Cron apaga 410/404/`INVALID_ARGUMENT` | `workers/push-scheduler.js` | **não toca o índice** (não tem por quê pagar 2 ops por inscrição morta); a entrada fica morta e a exclusão a pula | 0 |
| `delete-confirm` | `account.js` › `deletePushSubscriptions` reescrita | `get pushidx:` → para cada chave: `get` (confirma `rec.saveId === saveId`, mesma igualdade estrita de hoje) → `delete` → no fim `delete pushidx:` | ≤ 1 + 16×2 + 1 = **34 subrequests**, fixo |

RMW no índice sem CAS: dois aparelhos do mesmo titular inscrevendo no mesmo minuto podem perder uma entrada. **Autocura:** o cliente reenvia a inscrição a cada abertura (`NotificationManager`), e `indexarInscricao` vê a chave ausente e reescreve. Perda de entrada dura até a próxima abertura do aparelho perdido — aceitável e declarado.

**A varredura sai.** Não fica "fallback quando o índice não existe": era ela o ALTO. O que não está no índice não é alcançável pelo servidor — e a resposta já declara isso (`NOT_INCLUDED` › `push:* / fcm:*`).

### 2.3 Migração dos registros antigos e os sem `saveId`

- **Registros com `saveId` mas sem índice** (gravados entre `42b07bec` de hoje e o deploy do índice): migram sozinhos — na próxima abertura do app, `gravarSeMudou` compara igual, mas `indexarInscricao` roda de qualquer forma e vê a chave ausente do índice → indexa. Zero script.
- **Registros sem `saveId`** (tudo anterior a `42b07bec`): **não há o que migrar** — o valor não tem a conta; nenhum backfill offline consegue ligá-los a alguém sem adivinhar (`petName` não prova nada, já escrito no cabeçalho de `account.js`). Dois caminhos, ambos já existentes: (a) o aparelho abre o app → reenvia com `saveId` → `gravarSeMudou` vê `!igual` → regrava com `saveId` → indexa; (b) o aparelho nunca mais abre → a linha morre no primeiro 410 ou no TTL de 1 ano. Fica declarado em `NOT_INCLUDED`, como já está. **Não fazer:** script de `wrangler kv key list` + `delete` de tudo sem `saveId` — mataria push de jogador ativo que só não abriu o app desde o deploy.
- Guard: `subscribe.test.js`/`fcm-subscribe.test.js` ganham "inscrição com `saveId` deixa `pushidx:` com a chave"; `account.test.js` ganha a fixture de **1.500 inscrições alheias + 3 do titular** com fakeKV que **conta chamadas** e afirma `≤ 40` operações e exclusão completa (é o teste que a segurança pediu, com o teto numérico que prova o O(1)).

### 2.4 Ordem segura de `delete-confirm` — o que pode falhar vai primeiro, o irreversível vai por último

Princípio: enquanto nada foi destruído, uma falha devolve 500 e o titular **tenta de novo** com o mesmo token (15 min). Depois do primeiro `delete` irreversível, nada mais pode lançar — cada passo restante é `try/catch` que só reporta em `executado`/`naoIncluido`.

| # | Passo | Reversível? | Pode estourar? | Hoje está em |
|---|---|---|---|---|
| 0 | validar token (`tokenMatches`) | — | não | 0 |
| 1 | `collect` (inventário; `listPrefix('rank:')` com 20 págs. no teto) | sim | pouco (20 `list`) | 1 |
| 2 | **grava tombstone `del:done:<saveId>`** `{ at }`, TTL 24 h — ver 2.5 | sim (apaga se falhar adiante) | não | **não existe** |
| 3 | limpar `friends[]` alheios | sim (dado de terceiros; RMW) | **sim** (scan) — até ganhar índice `friendsidx:`, mesma família | 2 |
| 4 | push por `pushidx:` | sim (re-inscreve na próxima abertura) | não (≤ 34 ops) | 2b |
| 5 | minimizar `ent:` (mantém dinheiro) | **não** (o uso apagado não volta) | não | 3 |
| 6 | `rank:*`, `gifts:`, `pid:`, `profile:` | **não** | não (chaves já conhecidas) | 1 |
| 7 | **o save `<saveId>`** | **não** | não | 1 |
| 8 | `delete del:<saveId>` (token) | — | não | fim |

Regras que acompanham a ordem: (i) do passo 5 em diante, `try/catch` por passo — o que falhou entra em `naoIncluido` com o nome da chave, e a resposta é **200** (a pessoa pediu apagar; o que apagou está apagado); (ii) o token só sai no passo 8 — uma falha antes disso deixa o retry idempotente (`collect` recalcula o que sobrou); (iii) o `friends[]` (passo 3) é o único scan que fica, e fica **antes** de qualquer destruição justamente porque pode estourar.

### 2.5 O buraco que a ordem não fecha: ressurreição do save por outro aparelho

Depois do passo 7, qualquer **outro aparelho do titular ainda logado** (token Firebase vale 1 h; `GameStateContext` faz `POST` 3 s depois de qualquer mutação) **recria o save inteiro** — `save.js` › `POST` não sabe que a conta foi apagada. A exclusão vira "apaguei por 3 segundos". Conserto barato, dentro do mesmo desenho: o tombstone do passo 2 (`del:done:<saveId>`, TTL 24 h) é lido por `save.js` › `POST` e `GET` → **410 `account-deleted`**; o cliente, ao receber 410, limpa `GAME_STATE`/`SAVE_ID`/`USER_EMAIL` locais e desloga (`CLOUD_SAVE_POLICY` ganha a classe `deleted`, `retentavel: false`, `avisaJogador: true`). Depois das 24 h, o mesmo e-mail cria conta nova do zero — que é o comportamento prometido em `COPY.deleteDone` ("a porta fica aberta"). Não foi listado em nenhuma review de hoje.

---

## 3. Política de binários — números novos

| Medida | Comando | Valor |
|---|---|---|
| `dist/` working tree | `du -sh dist` | **24 MB** (`dist/assets` 23 MB; `_worker.js` 180 KB) |
| arquivos em `dist/` | `git ls-files dist \| wc -l` | 1.551 (era 3.016) — 1.465 WebP, 48 JS, 7 PNG (ícones PWA), 2 MP4 (3,8 + 2,5 MB) |
| pack do git | `git count-objects -vH` | `size-pack` **553 MiB**, 11 packs; `.git` 590 MB |
| blobs de `dist/` na história | `git rev-list --objects --all -- dist \| cut -d' ' -f1 \| git cat-file --batch-check='%(objecttype) %(objectsize:disk)'` | **15.952 blobs, 219 MiB** comprimidos |
| blobs de `src/assets` + `public` na história | idem com `-- src/assets public` | **2.281 blobs, 261 MiB** |
| todo o resto | 503 − 219 − 261 | ~23 MiB |
| custo por commit de build | `git diff-tree -r --diff-filter=AM <c> -- dist \| … objectsize:disk` em `4a8b8049`, `42b07bec`, `f9faf7a7` | **41–44 blobs, 0,5 MiB cada** |
| commits que tocam `dist/` | `git log --since=2026-06-21 --format=%h -- dist \| wc -l` / total | **459 / 1.070** (43 %) |
| `src/assets` working tree | `du -sh src/assets` | 121 MB |

**Leitura.** (a) Apagar o PNG do `dist/` (#32) reduziu o working tree em 99 MB e o `git clone` futuro em ~nada — a história já tem os 219 MiB e só um rewrite os tira. (b) A **curva** é 0,5 MiB × ~150 commits/mês ≈ **75 MiB/mês, ~0,9 GiB/ano**, e vem do rehash de `index-*.js`/`pool-*.js`/CSS a cada build, não de imagem. (c) A fonte de arte (`src/assets`, 261 MiB na história) pesa **mais** que `dist/` e ninguém a citou — é PNG de origem, não derivado; sair do git é LFS ou pasta externa, e o pipeline de arte da squad já trabalha em `E:\Soulmon-assets` fora do repo (memória).

**Alternativas com custo:**

| Política | O que muda | Custo/mês de repo | Risco |
|---|---|---|---|
| **A. Status quo** (commitar `dist/` a cada build) | nada | +75 MiB | GitHub avisa em 5 GB (~4,5 anos); `git bisect` já é inviável em 43 % dos commits |
| **B. Só commitar `dist/` no merge para `main`** (branch de trabalho não builda) | `npm run build` sai do fluxo de commit e vai para o passo de merge | ~+15 MiB (1 build por PR, não por commit) | Mesmo conteúdo em produção; exige disciplina que o `soulmon-operador` já cobra ("PR + merge") |
| **C. `dist/` fora do git; Cloudflare Workers Builds constrói do `main`** | `.gitignore dist`; `.env.production` continua commitado (`firebaseNoBuild.contract.test.ts` já garante as `VITE_*`); o CF já builda hoje ("o CF também builda") | ~0 | **Bloqueado hoje**: o build do CF não é observado por ninguém (a versão no ar é desconhecida — consolidado §2), e sem GitHub Actions (§0) não há onde rodar o build de conferência. Precisa: painel do CF lido pelo `soulmon-operador` + `ci.yml` com `npm run build` **e CI pago** |
| **D. Deploy por GitHub Actions (`wrangler deploy`)** | workflow com `CLOUDFLARE_API_TOKEN` | ~0 | Depende de Actions funcionando — hoje não funciona. Segundo caminho de deploy além do git-integration do CF = duas verdades |
| **E. LFS para `src/assets`** | `.gitattributes *.png filter=lfs` + migração | −261 MiB de pack no futuro; LFS free = 1 GB/1 GB banda | Rewrite de história (força todo clone a refazer); banda LFS por `clone` do CI |

**Recomendação (chata e reversível):** **B agora** (regra de processo, zero infra, corta ~80 % da curva); **C quando o CI voltar a rodar** e o operador tiver lido a versão no ar; **E não agora** — 261 MiB é grande mas parado; LFS entra só se um clone de CI passar de 5 min ou se a arte voltar a churnar. **Não** fazer rewrite de história para tirar os 219 MiB de `dist/`: 6 worktrees na mesma árvore (memória) e um rewrite quebram todas.

---

## 4. `App.tsx` — qual extração AGORA, qual depois, pelos guards que leem o arquivo

Medidas hoje: `wc -l src/App.tsx` → **6.155**; `grep -c useState` → 62; `grep -c "setGameState("` → 80; `grep -cE "const handle[A-Za-z]+ = useCallback"` → 70; `useState(false)` → **22** booleanos; `type ViewType` em 2 arquivos.

**31 testes leem `src/App.tsx` do disco** (`grep -rlE "readFileSync\([^)]*App\.tsx|'src/App\.tsx'|'src', 'App\.tsx'" src tests --include=*.test.*` → 31). Cruzei cada extração com o que esses 31 procuram **por nome**:

| # | Extração (review 05 §1.1) | Símbolos que saem | Guards que os citam | Modo de falha ao mover |
|---|---|---|---|---|
| 1 | `useModals` (22 booleanos) | `editModalOpen … upgradeRitual` (lista pelo `grep` de `useState(false)`) | **0** — nenhum dos 31 cita nenhum dos 22 nomes (`grep -l "\b<nome>\b"` sobre os 31 → vazio para todos) | Nenhum. `filaDeAvisos.contract` cita `const interstitial`, `protectPrompt`, `avisos.push` — a **derivação** da fila; fica no App ou vai junto e o guard é reapontado (falha **alta**: `toContain`) |
| 4 | `useAndroidBridge` | efeito do widget, `stepsAvailable`, `notificationsEnabled`, `SoulmonWidget`/`SoulmonAlarm` | **0** (`widgetSemCobranca` lê Kotlin) | Nenhum |
| 5 | `AppRouter` + `ViewType` único | bloco `currentView === 'x'` + JSX das 10 views | **2, ambos falham alto**: `ofertaDoisCanais.contract` (`accountTier={gameState.accountTier}`, `onUnlock={() => setUnlockReason('shop')}` no JSX do `ShopModal`), `filaDeAvisos.contract` (`isOpen={evolveModalStage !== null && evolutionCeremony === null}`) | Reapontar 2 guards. Custo real é o props-drilling (dezenas de handlers por view) |
| 2 | `useTaskHandlers` | `handleSaveActivity`, `handleAICreateActivity`, `handleCompleteTutorial`, `handleDecomposeTask`, `handleDropTask`, `handlePostponeNudge`, `handleShrinkTask`, `handleCheckInConfirm/Skip`, `contarMissao` | **6**: `activityCreate.contract` (AST, `"sumiu do App.tsx — o guard ficou cego"` → **vermelho**), `TaskMeta.render`, `MorningCheckIn.commit.render`, `telemetry.denominadores`, `weeklyMissions.fiacao` (`contarMissao` ×3), `playerDay.contract` (`handleCheckIn*`, `handlePickMood`) | Vermelho alto na maioria; reapontar 6 |
| 3 | `useCareHandlers` | `handleFeed`, `handlePet`, `handleSleep`, `handleShopBuy`, `handleCareEventComplete`, `handlePlay`, `handlePickMood` | **7**: `x6Updaters.contract` (não-nulo, vermelho), `cortes.contract` (`escopo()` lança "âncora não encontrada" — vermelho), `careUpdaters.test` (`app.includes('applyRub(')` — vermelho), `poopDrain.cleanPoop` (import — vermelho; **mas** `not.toMatch(/poopEventsCompleted:\s*\[/)` fica verde por vazio), `playerDay.contract` (vermelho), `sounds.contract` (`toEqual(['App.tsx'])` — vermelho), `GuideModal.gateReal`/`progression.test` (`handleEvolve`) | Reapontar 7, e **um** deles (`poopDrain.cleanPoop` › ausência) passa a não vigiar o arquivo novo — tem de ganhar o caminho novo explicitamente |

**Correção à review 05:** ela disse que mover handler "deixa o guard verde por vazio". **Não é o caso geral** — os guards de AST deste repo têm cláusula `"sumiu do App.tsx — o guard ficou cego"` e ficam **vermelhos**. O que fica verde por vazio é a minoria de asserções de **ausência** (`not.toMatch`) sobre o texto do arquivo: `poopDrain.cleanPoop`, `adoptCloudSave.test` ("não grava GAME_STATE com setItem cru"), e os `proibida.test(u)` de `x6Updaters` — estes últimos escopados ao corpo do handler, portanto vermelhos junto com o handler.

**Decisão recomendada:**

- **AGORA (antes dos 10 usuários): #1 `useModals` + #4 `useAndroidBridge`.** Zero guard cita os símbolos; zero regra de jogo; −~350 linhas; o #1 impede dois modais abertos por construção (hoje possível — e a auditoria de 06/09 achou exatamente isso empilhando). Risco de regressão: identidade dos callbacks para o `CompanionHUD` memoizado (footgun 5) — `useCallback` no hook. Razão risco/retorno: melhor do lote, e não toca em nada que os 10 usuários vão exercitar diferente.
- **DEPOIS: #5 `AppRouter`** — retorno alto (mata `ViewType` duplicado, abre `React.lazy` por view, o que o `orcamentoDeBytes` agradece), mas o custo verdadeiro é um contexto `AppActions` para não drillar 70 handlers; sem isso é mover 800 linhas de props. Fazer com 2 guards reapontados no mesmo commit.
- **SÓ COM RÉGUA MOVIDA JUNTO: #2 e #3.** São os blocos onde mora **toda** a regra de cuidado e tarefa que os 13 guards de fiação vigiam. Não são "arriscados" no sentido de quebrar — são **caros**: 13 reapontamentos, cada um com a sua cláusula de "ficou cego" para reescrever contra o arquivo novo, e a asserção de ausência de `poopDrain.cleanPoop` que precisa passar a olhar dois arquivos. O retorno (testabilidade sem montar o App) é real, mas os 10 usuários não sentem, e a chance de um guard reapontado errado passar verde é exatamente o footgun que a memória do repo mais teme ("hook mascara suíte quebrada"). Fazer **depois** da primeira leva de usuários, um por PR, com o `x6Updaters` lendo os DOIS arquivos durante a transição.

---

## 5. Stack Android — compatível?

| Peça | Repo | Fonte no repo | O que a Capacitor 8.4.0 entrega no template (`node_modules/@capacitor/cli/assets/android-template.tar.gz`, extraído) |
|---|---|---|---|
| AGP | **8.2.1** | `android/build.gradle` | **8.13.0** |
| Gradle | **8.5** | `android/gradle/wrapper/gradle-wrapper.properties` | **8.14.3** |
| Kotlin Gradle Plugin | **1.8.22** | `android/build.gradle` | (template não aplica Kotlin; o repo precisa por `*.kt`) |
| Java | **17** forçado (re-pin duplo, footgun 3; `afterEvaluate` no root) | `android/build.gradle`, `app/build.gradle` | **21** (`@capacitor/android/capacitor/build.gradle` › `compileOptions VERSION_21`) |
| compileSdk / targetSdk | **36 / 36** desde hoje (`4a8b8049`) | `android/variables.gradle` | 36 / 36 |
| minSdk | 26 | idem | 24 |
| JDK no CI | 21 | `android-build.yml` › `setup-java` (v4, deprecado) | — |

**Matriz que o repo documenta:** `docs/manual/05-ARQUITETURA.md` §1 (tabela "Peça/Valor", com o `[verificar no android-build.yml do CI após o merge]` no target 36) e `docs/PLAY-LANCAMENTO.md` §G ("o AGP 8.2.1 só avisa para compileSdk acima do que testou; se falhar, o conserto é subir o AGP"). `CLAUDE.md` footgun 3 registra o porquê do Java 17 ("Kotlin 1.8.22 não aceita alvo 21"). **Nenhuma das três cita a exigência mínima de AGP por API.**

**Fonte externa (Android Developers, "About the Android Gradle plugin", tabela *API level support*):** API 36 exige **AGP ≥ 8.9.1**; API 35 exigia **≥ 8.6.0**; AGP 8.2 vai até API 34. E AGP 8.9+ exige Gradle ≥ 8.11.1.

**Veredito:** a matriz do repo está **fora da tabela oficial em dois degraus** — já estava com 35 (AGP 8.2.1 < 8.6.0) e o último build verde da história (`gh run view 34253288462`, 08/09, `BUILD SUCCESSFUL in 3m 3s`) prova que **35 compilou mesmo assim** (AGP só avisou). Com 36 é `[a confirmar no CI]` — e o CI **não existe desde 16/09** (§0), então hoje **ninguém confirmou e ninguém pode confirmar sem um `gradlew assembleDebug` local com SDK 36 instalado**. O comentário do `variables.gradle` ("só AVISA") é extrapolação do caso 35; para 36, além do aviso, a versão do `aapt2`/`lint` embutida no AGP 8.2.1 pode não conhecer atributos da plataforma 36 — é o modo de falha típico, e é `[a confirmar]`.

**O que fazer, e o que NÃO fazer:** não voltar para 35 (a Play exige 36 para atualização desde 31/08 — review 15 §B). Subir para a dupla que o próprio Capacitor 8.4 já testou — **AGP 8.13.0 + Gradle 8.14.3** — e junto **Kotlin 2.x** (KGP 1.8.22 não é homologado para Gradle 8.14 `[a confirmar na matriz do Kotlin]`), o que **remove a razão do footgun 3**: com KGP ≥ 1.9.20 o alvo 21 é aceito e o re-pin duplo de Java 17 pode sair. `billing-ktx 6.2.1` (`enablePendingPurchases()` sem argumento) é independente de AGP e continua `[a confirmar no Play Console]`. Risco de fazer isso **sem CI**: nenhum portão além da máquina do dev. Ordem: religar o Actions primeiro (§0), depois este bump num PR só de `android/`, lendo o log do `assembleDebug`.

---

## 6. Achados novos desta passada (fora do que o pedido listou)

| # | Achado | Evidência |
|---|---|---|
| N1 | **GitHub Actions parado por cobrança desde 16/09** — nenhuma régua roda no push há 5 dias; 74 runs `failure` em 2–6 s | `gh run list --limit 100` → 40 CI + 31 Android + 3 Desktop `failure`; `gh run view 35672580163` → anotação de billing; último sucesso `ci.yml` 15/09 (`3ff60e7d`), último APK verde 08/09 (`a6480663`, ainda com target 35 e versionCode anterior). **Deploy do Cloudflare não depende disso** (git-integration + `dist/` commitado) — por isso ninguém viu |
| N2 | Cliente web nunca relê a nuvem depois do login (§1, ADR-004) | `src/App.tsx` › 16 usos de `cloudLoad`, todos em identidade; `GameStateContext.tsx` › inicializador só `readLocal` |
| N3 | Exclusão de conta é desfeita por outro aparelho logado (§2.5) | `save.js` › `POST` não consulta `del:`; `GameStateContext` › `POST` 3 s após mutação |
| N4 | Varredura de `profile:` em `delete-confirm` tem o mesmo teto de subrequests do push (§2.1) | `account.js` › `handleDeleteConfirm` passo 2 |
| N5 | Docs velhas sobre o namespace: `SOULMON_SAVES` já é físico próprio desde 07/09 | `wrangler.jsonc` (`20b3ba78…` ≠ `aed229e0…`; `git log -S"20b3ba78…"` → `6e2d991b`); `CLAUDE.md` §Deploy diz "ainda aponta para o namespace herdado"; `docs/SEPARACAO-DIGIAPP.md` passo 2 "ainda o mesmo namespace físico" |
| N6 | A curva de crescimento do repo é o JS rehasheado, não o PNG (§3) | 0,5 MiB/commit em 3 commits medidos; 459/1070 commits tocam `dist/` |
| N7 | `spendCredits` é RMW sem CAS em KV — dinheiro (§1, ADR-005) | `_entitlements.js` › `spendCredits`: `readEntitlement` → `credits -= amount` → `writeEntitlement`; `opId` só protege repetição do mesmo gesto |
| N8 | `GameState` tem **111** campos por `awk`, não 89 (manual `07` e este pedido) | `awk '/^export interface GameState/,/^}/' src/contexts/GameStateContext.tsx \| grep -cE "^\s+\w+\??:"` → 111 (a review 05 media 110; o manual conta de outro jeito — a régua tem de ser um comando só) |

**Ainda abertos da review 05 (e por quê):** D4 `put` cego (nada mudou em `save.js`; agora com ADR-004 rascunhada) · D6 worker de push sem CI e `APP_URL` fora da régua (`workers/wrangler.toml` inalterado hoje) · D7 `ci.yml` não roda `npm run build` (inalterado — e agora nem o `ci.yml` roda) · D8 KV único (ADR-005 rascunhada; a parte "mesmo id físico" **fechou**, ver N5) · D9/D10 rate limit em `Map` e métricas RMW (inalterados, aceitos) · D13 ADRs fora do repo → **fechou** (`docs/adr/ADR-001..003` em `42b07bec`) · D2 PNG do `dist/` → **fechou** (#32), mas a curva não (N6).

---

## 7. Tabela final

| Achado | Severidade | Conserto | Dono |
|---|---|---|---|
| N1 CI parado por cobrança desde 16/09; nada verificado desde então | **fatal** (para a premissa "régua viva") | Dono regulariza *Billing & plans* do GitHub; depois `workflow_dispatch` de `ci.yml` e `android-build.yml` em `5228145e` e ler os logs antes de qualquer outro merge | **dono** (pagamento) → `soulmon-operador` (rodar e ler) |
| N2 web nunca relê a nuvem; desktop→celular perde dado em horas | **alto** | ADR-004 D1+D2+D3 (servidor ½ d, cliente 1 d, desktop ½ d) — ou registrar como risco aceito com data | dono decide; `alpha-backend` + `alpha-frontend` |
| A1 (segurança) + N4: scans com `get` por chave em `delete-confirm` estouram subrequests | **alto** | §2.2 `pushidx:` (+ `friendsidx:` na mesma família) e reordenar `handleDeleteConfirm` (§2.4); teste com 1.500 inscrições alheias e teto de 40 ops | `alpha-backend` |
| N3 exclusão desfeita por outro aparelho | **alto** | tombstone `del:done:` 24 h lido por `save.js` → 410; cliente limpa e desloga (§2.5) | `alpha-backend` + `alpha-frontend` |
| §5 AGP 8.2.1 < mínimo oficial (8.9.1) para API 36; build não verificado | **alto** (bloqueia Play) | bump AGP 8.13 + Gradle 8.14.3 + Kotlin 2.x num PR só de `android/`; tirar o re-pin duplo de Java 17; **só com CI de volta** | `soulmon-guarda-plataforma` |
| N7 `spendCredits` sem atomicidade (dinheiro em KV) | **médio** hoje (0 pagantes) → alto no 1º pagante | ADR-005 D2 (D1 `batch`), ≈ 1 dia, antes do 1º pagante | dono decide o "quando"; `alpha-backend` |
| N6 curva do repo (0,5 MiB/commit) | **médio** | Política B: `npm run build` + commit de `dist/` só no merge para `main` (regra do `soulmon-operador`); C quando o CI voltar | `soulmon-operador` |
| §4 extrações: #1 e #4 agora, #5 depois, #2/#3 com guards | **médio** | #1 `useModals` + #4 `useAndroidBridge` num PR; `filaDeAvisos` intacto | `alpha-frontend` |
| ADR-006 esquema do save sem versão | **médio** | junto da ADR-004 (mesma mudança de formato), ≈ 1 dia | `alpha-frontend` |
| N5 `CLAUDE.md`/`SEPARACAO-DIGIAPP.md` dizem que o KV ainda é herdado | **baixo** | corrigir as 2 frases; régua: `wrangler.jsonc` ids distintos | `doc-mantenedor` |
| N8 contagem de campos do `GameState` diverge (89/110/111) | **baixo** | manual `07` cita o comando `awk`, não o número | `doc-mantenedor` |
| Workers vs Pages sem ADR | **baixo** | ADR-007 de registro (1 página) | `alpha-architect` |

## O que continua sem dono

- **Quem paga e quem vigia o GitHub Actions.** Só o dono pode regularizar; ninguém no roster tem "conferir se o CI rodou" como tarefa — o `soulmon-operador` vigia "git × ar", não "git × Actions". Enquanto isso, o hook de sessão diz "guards verdes" lendo a máquina local.
- **Quem aplica migração D1 em produção** (`wrangler d1 execute … --remote`) — o `migrations/README.md` descreve, ninguém executa (mesma configuração do worker de push, deploy manual sem dono; review 05 §10.8, ainda aberto).
- **Quem decide a exceção a "UI antes de infra"** para a ADR-004 — é decisão do dono e está na fila de `docs/PERGUNTAS-DO-DONO.md` só se alguém a colocar lá.
- **`friendsidx:`** (índice inverso das listas de amigos) — nomeado aqui pela primeira vez; sem ele o passo 3 de `delete-confirm` continua sendo scan.
- **Fixture de save por versão** (ADR-006 D4) — precisa de quem gere a fixture da versão anterior ANTES de mudar o tipo; hoje não há papel para isso.
