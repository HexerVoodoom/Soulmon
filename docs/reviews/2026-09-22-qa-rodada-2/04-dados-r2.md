# 04 — DADOS (QA Rodada 2, 22/09/2026) — `alpha-architect`

Repo `D:\Soulmon\repo`, branch `qa/rodada-2-2026-09-22`, HEAD `a6c1cd8a`. Só leitura.
Regra: caminho + SÍMBOLO; número com comando. Achado de R1/QA-geral só reaparece como "ainda aberto".

---

## 0. Verificação adversarial das correções da Rodada 1 (minha disciplina)

| Correção R1 | Estado | O que a verificação achou |
|---|---|---|
| `sprite:img:/lock:/blob:` na exclusão (`account.js` › `collectSprites`, passo 5 de `handleDeleteConfirm`) | **OK** | `account.deleteConfirm.qa.test.js` cobre blob via token da URL própria e declara URL do provedor em `NOT_INCLUDED`. Sem regressão. |
| `pushidx:<saveId>` (`_pushIdentity.js` › `indexarInscricao`, `deletePushSubscriptions` › `via:'index'`) | **OK, com resíduo inofensivo** | `workers/push-scheduler.js` › `drainPrefix` apaga `push:`/`fcm:` mortas (404/410) **sem desindexar** — a entrada fica em `pushidx:` até o TTL de 365 d. `lerIndice` pula entrada morta ("índice aponta, não prova"), então não há efeito. Não é achado. |
| Lápide `del:done:<saveId>` → 410 em `save.js` | **FURO** (§1.1) | A lápide protege SÓ o save. `community.js` (`profile` POST, `friends`, `gifts`, `coop*`, torneio), `subscribe.js`, `fcm-subscribe.js`, `generate-sprite.js`, `chat.js` não chamam `isAccountDeleted` (`grep -rn isAccountDeleted functions/api/*.js` → só `save.js`). E o **mesmo efeito** do cliente que recebe o 410 dispara `pushProfile` no mesmo tick (`GameStateContext.tsx` › efeito `[gameState]`: `cloudSaveComRetry(...).then(...)` é assíncrono; `if (!gameState.pvpEnabled) return; pushProfile({...})` roda logo abaixo, antes da resposta). Resultado: segundo aparelho com PvP ligado **recria `profile:<saveId>` + `pid:<pid>`** (nome, petName, estágio, atributos — o diretório público) depois da exclusão. A promessa da política §8 ("apaga o seu perfil público, o seu apelido") vale por 3 s, que é exatamente o defeito que a lápide veio fechar — só que para o perfil, não para o save. |
| `week_active.active_days` agregado (`metrics.js` › `applyAggregate`) | **METADE** (§4) | O `bump` entrou; a linha em `tools/metricsReport.mjs` › `renderRelatorio` **não** (`grep -c active_days tools/metricsReport.mjs` → 0). R1 review 07 N3 pedia os dois. Continua sem leitor humano. |

---

## 1. Inventário canônico de chaves KV

Comando-base: `grep -nE "'[a-zA-Z_]+:'|\`[a-zA-Z_]+:" functions/api/*.js workers/*.js | grep -v test` + `grep -nE "\.(put|get|getWithMetadata|delete|list)\(" functions/api/*.js workers/*.js | grep -v test`.
**25 famílias de chave** em dois namespaces. `07-DADOS-E-SAVE.md` §8 documenta **11** (`sed -n 556,600p docs/manual/07-DADOS-E-SAVE.md | grep -c "^| \`"` → 10 na KV de saves + 2 de push, sendo que `(token de 32 hex)` descreve `sprite:blob:` sem o prefixo).

Legenda: **Excl.** = o que `account.js` › `handleDeleteConfirm` faz com ela · **07** = está na tabela de §8.1/§8.2.

### 1.1 Namespace de saves (`kv(env)` → `SOULMON_SAVES`)

| # | Chave | TTL (constante) | Escreve | Lê | Excl. | 07 | Nota |
|---|---|---|---|---|---|---|---|
| 1 | `<saveId>` | 365 d, renovado (`SAVE_TTL_SECONDS`, `RENEW_AFTER_SECONDS`) | `save.js` POST/GET-renova; **desktop** via `cloudSync.ts` › `pushCareAction` | `save.js`, `_bond.js` › (get raw), `account.js` › `collect` | apaga (passo 8) | sim | 3 leitores do formato cru — importa para ADR-004 (§6) |
| 2 | `ent:<saveId>` | 5 a, renovado (`RETENTION_TTL_SECONDS`) | `_entitlements.js` › `writeEntitlement` (único) | `readEntitlement`, `save.js` GET, `account.js` | **minimiza** (passo 6), TTL corre até o fim | sim | ok |
| 3 | `ord:<orderId>` | 5 a, renovado | `claimOrder` **só sem `env.DB`** | `claimOrder` | sobrevive (declarado) | sim | Com `DB` ligado em prod (`wrangler.jsonc` › `d1_databases`), a chave **não existe** na KV: o vínculo mora em D1 `order_claims`. `plan().sobrevive` e `NOT_INCLUDED` citam `ord:` como se fosse KV, e a exportação não lista a linha D1. |
| 4 | `ord:steam:own:<appid>:<steamid>` (idem, orderId da Steam) | 5 a | `_billing.js` › `verifySteamOwnership` → `claimOrder` | `claimSteamLicense`, `entitlements.js` | sobrevive | não | **SteamID64 é identificador de terceiro** e sobrevive 5 anos à exclusão. A política §8 justifica os 5 anos por "obrigação fiscal" — licença de posse Steam não é comprovante fiscal (não há transação nossa). Compliance. |
| 5 | `spend:<saveId>:<opId>` | 24 h (`SPEND_TTL_SECONDS`) | `spendCredits` | `spendCredits` | não (expira) | **não** | Valor = entitlement inteiro. Tolerável pelo TTL. |
| 6 | `courtesy:count` | 5 a | `grantCourtesy` | `grantCourtesy` | global | não (08 sim) | RMW sem CAS — o teto de 25 pode passar por corrida. Irrelevante no volume. |
| 7 | `profile:<saveId>` | **365 d** (`putProfile`) | `community.js` › `putProfile`; `account.js` scrub de `friends` | community, account | apaga (passo 7) | sim, **TTL "—" está errado** | `friends[]` = saveIds de até 5 terceiros |
| 8 | `pid:<pid>` | **400 d** (`indexPublicId`) | community | community, account | apaga | sim, TTL "—" errado | 400 > 365 do perfil: índice sobrevive ao perfil por 35 d (apontando para nada — inofensivo, `getProfile` devolve null) |
| 9 | `rank:<season>:<saveId>` | **120 d** | community | community, account | apaga | sim, TTL "—" errado | |
| 10 | `gifts:<saveId>` | **60 d** | community | community, account | apaga | sim, TTL "—" errado | |
| 11 | `closed:<season>` | **SEM TTL** | `community.js` › fechamento de season (`closedKey`) | idem | global | **não** | Imortal por desenho (marca "já premiei"); cresce 1/mês. Aceitável, mas tem que estar escrito. |
| 12 | `coop:<gid>` | 120 d (`COOP_TTL`) | `gravarGrupo` | `lerGrupo` | **NÃO** | **não** | `members[]` = saveIds. **Membro apagado vira fantasma** (§1.2). |
| 13 | `coopOf:<saveId>` | 120 d | `gravarGrupo` | `grupoDe` | **NÃO** | não | chave COM o saveId do titular, fora da exclusão |
| 14 | `coopCode:<code>` | 120 d | `gravarGrupo` | `coopJoin` | global | não | |
| 15 | `coopCk:<gid>:<saveId>` | 120 d | `gravarCheckins` | `lerCheckins` | **NÃO** | não | dias de presença do titular, fora da exclusão |
| 16 | `m:<YYYY-MM-DD>` | 730 d | `metrics.js` POST | `metrics.js` GET | global | sim | |
| 17 | `ai:<bucket>:<saveId>:<dia>` | 30 h (`TTL_SECONDS`) | `_aiGuard.js` › `reserve`/`release` | idem | não (expira) | não (08 sim) | ok |
| 18 | `ai:<bucket>:@all:<dia|mês>` | 30 h / 40 d | idem | idem | global | não | |
| 19 | `sprite:img:<saveId>:<formId>` | **SEM TTL** (de propósito: arte paga) | `generate-sprite.js` | idem, `account.js` › `collectSprites` | apaga | não (api-workers sim) | ok desde R1 |
| 20 | `sprite:lock:<saveId>:<formId>` | 120 s | generate-sprite | idem | apaga | não | |
| 21 | `sprite:blob:<token>` | **SEM TTL** | `guardarBlob` | `sprite-image.js` | apaga via cache | "(token de 32 hex)" — sem o prefixo | Blob órfão (cache falhou) declarado. |
| 22 | `del:<saveId>` | 15 min | `handleDeleteRequest` | `handleDeleteConfirm` | apaga só se `falhou.length === 0` | não | ok |
| 23 | `del:done:<saveId>` | 30 d (`TOMBSTONE_TTL_SECONDS`) | `writeTombstone` | `save.js` **só** | — | não (api-workers sim) | ver §0 |

### 1.2 Namespace de push (`PUSH_SUBSCRIPTIONS`)

| # | Chave | TTL | Escreve | Lê | Excl. | 07 |
|---|---|---|---|---|---|---|
| 24 | `push:<hash>` / `fcm:<…>` | 365 d (`TTL_INSCRICAO`) | `subscribe.js`/`fcm-subscribe.js` via `gravarSeMudou` | `push-scheduler.js` › `drainPrefix` | apaga pelo índice; fallback varredura | sim |
| 25 | `pushidx:<saveId>` | 365 d | `indexarInscricao` | `lerIndice`, `deletePushSubscriptions` | apaga | não |

### 1.3 Achado: o cooperativo está fora da exclusão (NOVO)

`grep -n coop functions/api/account.js` → 0. Depois de `delete-confirm`:

- `coop:<gid>.members` continua com o saveId do titular por até 120 d; `coopOf:<saveId>` e `coopCk:<gid>:<saveId>` idem. Três chaves com identificador da pessoa (derivável do e-mail) fora do inventário, fora de `NOT_INCLUDED`, fora da política (§1 da política diz "some quando você sai" — sair não é apagar a conta).
- **Bug de produto, não só de compliance:** `vistaDoGrupo` monta o fantasma como `{ id: null, name: null, stage: null, apareceuHoje: false }` e a meta é `target = g.members.length * COOP_CHECKINS_POR_MEMBRO`. Grupo de 2 em que um apaga a conta: `target` fica 10, `feitos` máximo 5 — **o grupo nunca mais bate a meta**, sem nenhum evento que explique. `grupoDe` só limpa `coopOf:` quando o próprio saveId consulta; conta apagada nunca consulta.
- Conserto: em `handleDeleteConfirm`, entre os passos 3 e 4, `grupoDe(saveId)` → remover de `members`, `gravarGrupo`, apagar `coopOf:`/`coopCk:` (é o mesmo corpo de `coopLeave`, que já existe — extrair para `_coop.js` para não importar `community.js` inteiro). Somar ao `plan().apaga` e à política §8.

---

## 2. `GameState` — 89 campos

Contagem: `sed -n 161,512p src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_]+\??:'` → **89** (bate com 07 §2).

**Hidratação:** `hydrateSave` começa com `...loadedState` e sobrescreve campo a campo. 85 campos têm linha própria; **4 passam pelo spread cru**: `soulmonSkills`, `soulmonClassTitles`, `soulmonMeta`, `evolutionLocked` (diff entre a lista da interface e `sed -n 832,1200p … | grep -oE '^\s+[a-zA-Z_]+:'`). Os leitores fazem `?? false`/`?.` (`App.tsx` › `handleSkillsComputed`, `EvolutionPath` prop), então não há tela branca hoje — mas é o mesmo padrão que o comentário de `hydrateSave` diz já ter produzido uma. Consequência maior: **qualquer chave desconhecida do save sobrevive para sempre** pelo spread (`digivolutionSegments`, órfã declarada em 07 §2.13, continua viajando pela nuvem). É o argumento concreto da ADR-006 D2.

**Exportação:** `account.js` › `handleExport` devolve `c.state` inteiro (`[\`${saveId} (save)\`]: c.state`) — os 89 campos saem como estão, inclusive `soulGoal`/`soulStruggle` (texto livre), `moodLog`, `steps`, `friends`. Isso é correto para portabilidade (LGPD art. 18 V); o que falta é o item abaixo.

### 2.1 Campos que só um lado usa (candidatos a morrer)

Método: para cada campo, arquivos em `src/` (sem testes, fora da interface) que o citam, e leitura manual dos que têm ≤ 2.

| Campo | Escreve | Lê | Veredito |
|---|---|---|---|
| `lastDayWasPerfect` | `dailyReset.ts` › `computeDailyReset` (`lastDayWasPerfect: dayWasPerfect`) | **ninguém** (`grep -rnw lastDayWasPerfect src --include=*.ts --include=*.tsx | grep -v test` → só tipo, hydrate e a escrita) | **Morto.** 07 §2.1 o documenta como se lido. `lastDayReport.wasPerfect` carrega a mesma informação. |
| `droppedItems` | **ninguém** (`grep -rn droppedItems src` → hydrate `strArr`, pass-through em `App.tsx` para `StatsPage`, e o leitor) | `StatsPage.tsx` › jornada ("N itens dropados") | **Morto ao contrário**: o leitor existe, o escritor não. 07 §2.6 diz "escrito por `src/utils/shop.ts` (`unlock:'drop'`)" — `grep -n "'drop'" src/utils/shop.ts` → 0. O doc descreve um escritor que não existe. |
| `equippedFurniture` | forçado `undefined` no load | — | Já lápide (07 §5.2). Fica na interface só para a migração. Ok. |
| `restWeekKey`, `restDaysLeft`, `glitchtamaUse`, `bondDaily`, `lastFreshStartDate`, `offerShownWeek`, `memoriesShown`, `conquistasHerdadas`, `stepsConsent` | 1 módulo | o mesmo módulo | Vivos (escrita e leitura no dono da regra). Ok. |

### 2.2 PII e declaração

| Campo | Natureza | Política `public/privacidade.html` | Exportação | Observação |
|---|---|---|---|---|
| `soulGoal` · `soulStruggle` | texto livre sobre a vida | declarado (§1, §2b) | sim | R1 compliance já cobriu o repasse à IA |
| `moodLog` | humor 1–5 por dia | declarado | sim | |
| `steps` (`{date, baseline, today}`) | contagem de passos (saúde, agregado) | declarado (`ACTIVITY_RECOGNITION`, agregado) | sim | ok |
| `friends[]` | **saveIds de terceiros** (até 5) | não declarado como dado de terceiro | sim — cru | ver §2.3 |
| `consent` | versões aceitas | — | sim | ok |
| `petName`, `soulmonMeta.baseName` | apelidos | declarado | sim | |
| `bornAt` | dia do jogador (não é nascimento da pessoa) | — | sim | O nome confunde com data de nascimento real (que fica em `soulmon-profile`, local). Comentário da interface já esclarece. |

### 2.3 Achado: a exportação entrega o saveId de terceiros (NOVO)

`handleExport` → `data['profile:<saveId>'] = c.profile` cru. `community.js` (comentário em `POST profile` e em `player`): "`friends` guarda saveId internamente (nunca sai daqui assim)… devolvê-los cru vazaria a chave do save de até 5 pessoas por consulta" — e há régua `community.test.js` › "o saveId nunca sai em resposta pública". A exportação é a **única rota que devolve saveId alheio** ao cliente, e não tem teste (`grep -n friends functions/api/account.test.js` → só fixture). Além do `profile:`, o próprio `state.friends` (campo 2.2) sai cru também. Com o saveId de um amigo em mãos, `GET /api/save?id=` sem auth (`FIREBASE_PROJECT_ID` ausente) lê o save dele — o mesmo vetor que a camada `pid:` existe para fechar.
Conserto: em `handleExport`, mapear `profile.friends` e `state.friends` por `pidDeSaveId` (mesmo helper de `player`), mantendo o contagem; teste que exporta com `OTHER` em `friends` e afirma `not.toContain(OTHER)`.

---

## 3. Fronteira desktop ↔ web do save

Lido: `desktop/renderer/src/cloudSync.ts` › `pushCareAction`, `normalizeForRules`, `isSaneCareState`; `desktop/renderer/src/care.ts` › `remoteRub/Feed/Sleep/Wake/Shower`, `remoteRestState`.

**O que o desktop envia:** GET `/api/save?id=` → `current` (o JSON inteiro) → `mutate(normalizeForRules(current))` → POST `{ id, state: next }` com o objeto inteiro. `normalizeForRules` é `{ ...state, healthPoints, maxHealthPoints, energyPoints, foodInventory, virusPoints, dataPoints, vaccinePoints, totalXP, attributesSinceLastEvolution }`; cada `remote*` é `{ ...remote, <2–3 campos> }`; `remoteRestState` é `{ ...raw, window, nights, dreams, playerDayTz }`.

**Perde algo?** **Não por estrutura**: todo caminho preserva por spread, inclusive `rest.dreamDates`/`hideMetrics` (que o web só preserva com validação) e campos que o desktop não conhece. Verificado contra `hydrateRest`: `nights` do desktop entra pelo mesmo `recordNight`; o web ainda corta em `MAX_NIGHTS` no load. `maxHealthPoints` usa `MAX_HP_BY_FORM[getStageLevel(stage)]` = `getMaxHPForStage` do web (mesma função, importada).

**O que muda de verdade (três coisas):**

1. **Defaults viram dado.** Save com `healthPoints` não-finito: o web hidrata **cheio** (`hydrateSave`: "save sem HP nasce cheio"); o desktop grava **1** (`normalizeForRules`: `: 1`) e o web passa a ler 1. Mesmo para `energyPoints: 0`. Só acontece em save corrompido; mas é o único ponto em que os dois lados discordam do padrão.
2. **410 não existe no desktop.** `grep -rn "410\|account-deleted" desktop/` → 0. `pushCareAction` trata `!res.ok` como `'network'`. Conta apagada pelo celular: o overlay mostra "erro de rede" por 30 dias, mantém sessão, e continua tentando. O contrato novo de R1 tem um cliente que não o implementa.
3. **Escrita cega continua** (ADR-004, ainda Proposta): GET→mutate→POST sem `baseRevision`; o celular com debounce de 3 s pode sobrescrever a noite registrada pelo overlay. Já reportado em R1 (`03-arquitetura-r1.md`); **ainda aberto** porque depende do dono (#52).

---

## 4. `tools/metricsReport.mjs` × `metrics.js`

Chaves que `applyAggregate` grava (`grep -n "bump(" functions/api/metrics.js`) × chaves que o leitor consome (`grep -noE "n\(totais, *[\`'\"][^\`'\"]+" tools/metricsReport.mjs` + `summarizeNorthStar` em `metrics.js`).

**Com leitor:** `<evento>` (total), `onboarding_step.<funil>.<n>`, `day_active`, `effort_sum.<tier>`, `effort_bucket.<n>`, `unlock_view.<razão>`, `unlock_dismiss.<razão>`, `purchase.<origem>`, `reveal_seen.<funil>.sprite_*`, `retained.<marco>`, `app_open.<origem>`, `checkin_commit`, `checkin_shown`, `install`, `week_active.goal_days.<n>` e `week_active.<tier>.goal_days.<n>` (este via `summarizeNorthStar`).

**Gravadas e SEM leitor (nem rota, nem script):**

| Chave | Origem |
|---|---|
| `week_active.active_days.<n>` e `week_active.<tier>.active_days.<n>` | **a correção de R1, metade feita** — sem linha em `renderRelatorio` a hipótese de hábito de E0 continua sem leitura humana |
| `effort_bucket.<tier>.<n>` | histograma por tier |
| `retained.<tier>.<marco>` | |
| `welcome_back.<faixa>`, `after_bad_day.<faixa>` | |
| `reveal_seen.duration.<n>`, `checkin_commit.focus_<n>` | |
| `dungeon_run.floors_<n>`, `evolve.level_<n>`, `bond_level.level_<n>`, `milestone.days_<n>` | |
| `demo_cap_hit.<caminho>`, `activity_create.<caminho>.<tipo>` | "o defeito conhecido que este arquivo instrumenta" — instrumentado e não lido |
| `sound_state.muted_*`, `sound_state.music_*`, `sound_off.age_<n>` | som-01: coletado para "detectar dano"; ninguém olha |

Não é privacidade (todos são derivados de propriedade já declarada), é **custo sem retorno** — a definição do cabeçalho de `metrics.js`. Não há teste de `metricsReport.mjs` (`ls tools/*.test.*` → nada), logo não há guard "toda chave gravada tem leitor". Conserto barato: uma seção `--full` genérica que imprime todo prefixo com contagem > 0 — vira leitor de tudo que vier, sem uma linha por evento.

---

## 5. Migrações D1 × `claimOrderAtomic`

`migrations/0001` cria `order_claims(order_id TEXT PK, save_id NOT NULL, claimed_at NOT NULL)`; `0002` adiciona `expires_at INTEGER` + backfill. `claimOrderAtomic` usa exatamente as 4 colunas (DELETE vencido → INSERT → em falha, SELECT save_id → UPDATE expires_at). **Schema bate; a unicidade é a PK** — não há e não precisa de índice extra (`save_id` nunca é filtro).

Dois pontos, nenhum bloqueante:

- `catch {}` do INSERT engole **qualquer** erro, não só violação de PK. Se o INSERT falhar por outro motivo (D1 indisponível no meio, coluna ausente), cai no SELECT; se o SELECT devolver `null`, a resposta é `order-in-use` — uma recusa que acusa o comprador. Com `0002` ausente o DELETE anterior já lança (referencia `expires_at`), então hoje o cenário real é só "D1 caiu entre o DELETE e o INSERT". Conserto de 1 linha: checar `err.message` por `UNIQUE`/`PRIMARY KEY` e relançar o resto.
- Dois caminhos de aplicação coexistem: `migrations/README.md` manda `d1 execute --file`; `PLAY-LANCAMENTO.md` §E manda `d1 migrations apply` (que registra em `d1_migrations`). Banco migrado pelo primeiro e depois submetido ao segundo tenta `0002` de novo e falha em "duplicate column" — `PLAY-LANCAMENTO` já avisa; o README não. Alinhar o README ao `migrations apply` e, com `0 pagantes`, marcar as duas como aplicadas via `d1 migrations` no banco real.

---

## 6. ADR-004..006: o que muda no código de HOJE se o dono aprovar

Lista de arquivos por decisão, para o dono decidir com o custo na mão. Estimativas da própria ADR entre parênteses; correções minhas em **negrito**.

### ADR-004 — `revision` + GET antes do POST (ADR diz ≈ 2 dias)

| Camada | Arquivo | Mudança |
|---|---|---|
| Servidor | `functions/api/save.js` | envelope `{ v, revision, h, updatedAt, state }`; GET lê os dois formatos; POST com `baseRevision` → 409 com renovação de TTL; log sem `baseRevision` |
| Servidor | **`functions/api/_bond.js` › leitura crua de `<saveId>`** | **não está no handoff da ADR** — lê `JSON.parse(raw)` como `GameState`; com envelope, `totalXP` vira `undefined` e o gate de PvP fecha para todo mundo |
| Servidor | **`functions/api/account.js` › `collect`** | **não está no handoff** — exportação e `plan()` leem `store.get(saveId)` cru; com envelope, `c.state` vira o envelope e `hasState` continua true (não quebra a exclusão, mas a exportação muda de forma) |
| Servidor | testes `save.test.js`, `saveId.parity.test.js`, `bond.parity.test.js`, `account.test.js`, `account.deleteConfirm.qa.test.js` | fixtures com envelope |
| Cliente | `src/utils/storageKeys.ts` (`SAVE_REVISION`), `src/utils/cloudSave.ts` (`baseRevision`, 409 → `kind:'conflict'`), `src/contexts/GameStateContext.tsx` (GET pós-render em `useEffect` **próprio**, `visibilitychange`), `src/utils/safeStorage.ts` (backup `soulmon_state_conflict_<ISO>`, teto 2), toast PT+EN | + guard de AST "o efeito `[gameState]` não chama `cloudLoad`" |
| Desktop | `desktop/renderer/src/cloudSync.ts` › `pushCareAction` | `baseRevision`; 409 → reler e reaplicar (máx. 2×) |
| Doc | `07-DADOS-E-SAVE.md` §3, §8.1; `06-REFERENCIA/api-workers.md` | |

Custo real: **≈ 3 dias**, não 2 — os dois leitores crus fora do handoff e cinco arquivos de teste.

### ADR-005 — dinheiro para o D1 (ADR: ≈ 2–3 dias)

| Camada | Arquivo | Mudança |
|---|---|---|
| Schema | `migrations/0003_entitlements.sql`, `migrations/0004_credit_ledger.sql` | tabelas; `migrations/README.md` |
| Servidor | `functions/api/_entitlements.js` › `readEntitlement`, `writeEntitlement`, `spendCredits`, `grantCourtesy`, `auditRefunds`, `applyVerifiedPurchase` | ramo D1 + fallback KV; dupla escrita até o ponto de não retorno |
| Servidor | `functions/api/account.js` › passo 6 (minimização) e `collect` | hoje faz `store.put(ENT_PREFIX…)` direto — passa a `UPDATE entitlements SET … account_deleted_at` |
| Servidor | `functions/api/_kv.contract.test.js` (novo) | guard `.list(` só em `_kv.js`; hoje `account.js` › `listPrefix` e `community.js` chamam `.list(` direto — os dois precisam migrar para o helper |
| Cron | `workers/push-scheduler.js` | varredura de `expires_at` (ou declarar "sem varredura até 1 pagante") |
| Script | `scripts/kv-ent-para-d1.mjs` | backfill (cortesia e testes) |
| Testes | `_entitlements*.test.js` (6 arquivos), `entitlements.grant.qa.test.js`, `billing*.test.js`, `account*.test.js` | mock de `env.DB` com `batch()` |
| Doc | `07` §8.1/§8.3, `08` §billing, `BILLING-SETUP.md`, política §8 ("KV" → "D1") | |

Custo real: **≈ 4 dias** — o mock de D1 transacional nos testes é o que a ADR não conta.

### ADR-006 — `schemaVersion` + migrações nomeadas (ADR: ≈ 1–1,5 dia)

| Camada | Arquivo | Mudança |
|---|---|---|
| Cliente | `src/types/saveSchema.ts` (novo, `SAVE_SCHEMA_VERSION = 1`), `src/utils/saveMigrations.ts` (novo), `src/contexts/GameStateContext.tsx` › `hydrateSave` (encadeia antes do `??`; as três migrações ad hoc — `migrateLegacyDecor`, `careCaps`, `conquistasHerdadas` — mudam de endereço), `GameState.schemaVersion` | |
| Cliente | `src/utils/cloudSave.ts` + `GameStateContext.tsx` | D3: `schemaVersion > SAVE_SCHEMA_VERSION` → não grava na nuvem, aviso 1× PT+EN |
| Desktop | `desktop/renderer/src/cloudSync.ts` › `pushCareAction` | `reason: 'schema-newer'` + importar `saveSchema.ts` |
| Fixtures | `scripts/gerar-fixture-save.mjs`, `src/test/fixtures/save-v0-digiapp.json`, `save-v1.json`, `src/utils/saveMigrations.fixtures.test.ts` | |
| Testes existentes | `GameStateContext.hydrate.fuzz.test.tsx`, `GameStateContext.saveContent.test.tsx`, `src/docsManual.contract.test.ts` (o guard AST de `hydrateRest`) | reapontar |
| Doc | `07` §2, §5; `CLAUDE.md` regra "`?? padrão` sempre" ganha a exceção "renomeou ⇒ versão sobe" | |

Custo real: ≈ 1,5 dia, como a ADR diz — e é a única das três que **fecha o spread cru** de §2 (chave desconhecida deixa de viajar para sempre), o que hoje nenhum guard cobre.

**Ordem que eu recomendaria se aprovar mais de uma:** 006 → 004 → 005. A 006 muda o formato do estado (barato, sem servidor); a 004 muda o formato do registro e já carrega o `v`; a 005 é a única com infra nova e só rende com pagante.

---

## 7. Tabela final

| # | Achado | Severidade | Conserto | Dono |
|---|---|---|---|---|
| 1 | Lápide `del:done:` protege só `save.js`; `community.js` recria `profile:`/`pid:` via `pushProfile` no mesmo efeito que recebe o 410 (§0) | **ALTA** | `isAccountDeleted` em `community.js` (todas as ações com `id` = ator), `subscribe.js`, `fcm-subscribe.js`, `generate-sprite.js` → 410; no cliente, `pushProfile` só depois de `cloudSaveComRetry` resolver ok (ou o mesmo `reagirContaExcluida` derruba `pvpEnabled` local) | `alpha-backend` + `alpha-frontend` |
| 2 | Cooperativo fora da exclusão: `coop:<gid>.members`, `coopOf:`, `coopCk:` ficam 120 d; fantasma infla a meta do grupo para sempre (§1.3) | **ALTA** | `coopLeave` extraído para `_coop.js` e chamado em `handleDeleteConfirm`; `plan().apaga`; política §8 | `alpha-backend` + compliance |
| 3 | Exportação devolve saveId de até 5 terceiros (`profile.friends`, `state.friends`) — única rota que quebra "saveId nunca sai" (§2.3) | **ALTA** | mapear por `pidDeSaveId` em `handleExport`; teste `not.toContain(OTHER)` | `alpha-backend` |
| 4 | `ord:steam:own:<appid>:<steamid>` — SteamID64 retido 5 a pós-exclusão sob justificativa fiscal que não se aplica a licença de posse (§1.1 #4) | MÉDIA | decisão do dono: apagar `ord:steam:own:*` na exclusão (perde a trava "um Steam, uma conta" só para quem apagou) **ou** declarar nominalmente em `NOT_INCLUDED` e na política | dono (#54) |
| 5 | Desktop não conhece 410: overlay mostra "rede" por 30 d após exclusão (§3.2) | MÉDIA | `cloudSync.ts` › `pushCareAction`/`fetchRemoteSnapshot`: `res.status === 410` → `reason:'deleted'`, limpar `getAuth` | desktop |
| 6 | `active_days` corrigido pela metade: chave gravada, sem linha em `renderRelatorio` — e mais 14 famílias de chave sem leitor (§4) | MÉDIA | seção genérica `--full` que imprime todo prefixo > 0; ou linha por chave | `alpha-insights` |
| 7 | `07-DADOS-E-SAVE.md` §8 cobre 11 de 25 chaves; TTL de `profile:`/`pid:`/`rank:`/`gifts:` está "—" e o código tem 365/400/120/60 d; `sprite:blob:` sem o prefixo; `ord:` descrito como KV quando em prod é D1 (§1) | MÉDIA | reescrever §8.1 a partir da tabela §1 deste relatório | `doc-bibliotecario` |
| 8 | `lastDayWasPerfect` escrito e nunca lido; `droppedItems` lido e nunca escrito (07 cita escritor inexistente `shop.ts unlock:'drop'`) (§2.1) | BAIXA | matar os dois (ou ligar `droppedItems` ao drop da masmorra, se era a intenção); corrigir 07 §2.1/§2.6 | `alpha-frontend` + doc |
| 9 | 4 campos sem linha em `hydrateSave` (`soulmonSkills`, `soulmonClassTitles`, `soulmonMeta`, `evolutionLocked`) e spread `...loadedState` faz chave desconhecida viajar para sempre (§2) | BAIXA hoje | 4 linhas agora; o spread é a ADR-006 | `alpha-frontend` |
| 10 | `claimOrderAtomic` › `catch {}` engole erro não-PK e responde `order-in-use` (§5) | BAIXA | filtrar por `UNIQUE`/`PRIMARY KEY`, relançar o resto | `alpha-backend` |
| 11 | `migrations/README.md` (`d1 execute`) × `PLAY-LANCAMENTO.md` (`d1 migrations apply`) — dois caminhos que colidem em `0002` (§5) | BAIXA | README aponta para `migrations apply`; registrar 0001/0002 como aplicadas | operador |
| 12 | `closed:<season>` sem TTL, não documentada (§1.1 #11) | BAIXA | TTL de 400 d ou linha em 07 dizendo "imortal por desenho" | `alpha-backend` |
| 13 | `desktop` › `normalizeForRules` grava `healthPoints: 1` onde o web hidrataria cheio (§3.1) | BAIXA | usar `MAX_HP_BY_FORM[...]` como padrão, igual ao web | desktop |
| 14 | ADR-004 handoff omite `_bond.js` e `account.js › collect` (leitores crus de `<saveId>`) — custo real ≈ 3 d, não 2 (§6) | INFO | corrigir handoff antes de o dono decidir | `alpha-architect` |

**Ainda aberto de rodadas anteriores (não repetido, só apontado):** escrita cega desktop↔web (R1 `03` §2.1, ADR-004, #52); `week_active.active_days` (R1 `07` N3 — metade).

**Sem dono:** (a) um guard "toda chave `bump(...)` de `applyAggregate` tem leitor em `metricsReport.mjs`" — ninguém é dono do par; (b) um guard "toda chave KV escrita em `functions/` aparece em `07` §8" (hoje 14 de 25 não aparecem, e nada reprova); (c) a pergunta #54 (SteamID pós-exclusão) — é do dono, e não está em `PERGUNTAS-DO-DONO.md`.
