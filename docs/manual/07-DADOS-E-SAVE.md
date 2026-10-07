# Dados e save

> **Dono:** doc-redator-arquitetura · **Data:** 30/09/2026 (delta `cfe27cc7..3532ccf5`: §2 campo `crossings` (Passeio + Travessias) e recontagem 96 → 97); anterior: 30/09/2026 (2ª sincronização do dia, delta `ae366480..5edfcfba`: §3 campos `review` e `refugeInvite` (Ateliê da Mente e Refúgio), §4 chave `PICROSS_DAILY_PAID`, §6 `playerDayIso`, §8.1 `rank:` ganha `pending` (duelo aberto); anterior: sincronização `8e6d0d9a..ae366480`: §5.5 migração dos caminhos, chave `ai:sprite:@admin`, `soulmonMeta.creature`); anterior: 29/09/2026 (sincronização da Guilda, delta `38c3ccb5..b657a340`: §8.1 — 11 famílias de chave `coop*` novas, TTL da guilda com Bosque, `storageKeys.ts` com `GUILD_LAST_STAGE` e `GUILD_CLAIMED`, exclusão e exportação); anterior: 27/09/2026 (sincronização do delta `c510c7e4..2336e4e7`: `incubation.notified` ⚰️ — `hydrateSave` não copia mais); anterior: 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: **91 campos de topo** (entraram `missionPerfectDays` e `minigameBits`), a linha de `gamePoints` ganhou as duas fontes de Bits, `totalPerfectDays` voltou a significar só dia completo REAL, e o `ent:` ganhou `rebirthSpriteResetAt` (#62); anterior: 2ª sincronização do dia, delta `a6c1cd8a..592e2c14`: as marcas "em curso 22/09" do §8 viraram fato datado — `del:done:` reabre no login posterior e é lida por toda rota autorizada, `pushidx` autenticado com a expulsa apagada, coop/`friends[]` na exclusão e no export, `closed:` com TTL; §3.3/§3.4 `excluida`/backup; §4.1 `TERMS_NOTICE_SHOWN`; §4.2 `CONFLICT_BACKUP` por exclusão; anterior no mesmo dia: §8.1/§8.2 reescritos a partir de `04-dados-r2.md` §1 — 25 famílias, TTLs reais, quem apaga na exclusão) · **Estado:** verificado em 27/09/2026 por doc-verificador (delta `c7bca6d0..78ef5367` — contagem refeita com `sed -n '161,537p' src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*\??:'` → 92 (fim da interface na linha 537); linha `incubation?` conferida contra `Incubation`/`emptyIncubation`/`incubationFor`/`incubationReady`/`INCUBATION_MIN_MS` em `spriteTrigger.ts`, o hidratador em `GameStateContext.tsx`, `rebirth.ts` e `handleUpgradeRevealed`/`handleEvolve` no `App.tsx`); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — contagem refeita com `sed -n '161,521p' src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*\??:'` → 91; `hydrateSave` e `REBIRTH_SPRITE_RESET_FIELD` conferidos no fonte); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — §3.3, §3.4, §4.1, §4.2, §8.1 linhas 3/7/8/11/12/13/15/23 e §8.2 linhas 24/25 conferidas contra o fonte; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — §3.3 `deleted`/410, §4.1 `ACCOUNT_DELETED_NOTICE` + fila `soulmon-telemetry-hidden`, §8.1 `del:`/`del:done:`/`sprite:*`, §8.2 `pushidx:` conferidos símbolo a símbolo contra `cloudSave.ts`, `storageKeys.ts`, `telemetry.ts`, `_accountTombstone.js`, `_pushIdentity.js`, `account.js`; anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — §2.1 `conquistasHerdadas` e §4.1 `TERMS_NOTICE_SEEN` conferidos símbolo a símbolo; anterior: sincronizado com `2580b73a..dc72579e` em 20/09/2026 por doc-redator-arquitetura)
> **Estado:** verificado em 30/09/2026 por doc-mantenedor (delta `cfe27cc7..3532ccf5`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `3532ccf5` — `utils/travessias.ts`, `utils/travessiasSave.ts`, `types/travessias.ts`, `PasseioSheet.tsx`, `adventure.ts` › `adventureOfNight`, `playAreaLots.ts`, `CompanionHUD` › `walkingTo`, `GameStateContext` › `crossings`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-verificador (delta ae366480..5edfcfba — 96 campos de `GameState` (comando corrigido: `??`), 52 chaves de `storageKeys.ts`, `sanitizeReview`/`sanitizeRefugeInvite` e defaults, `playerDayIso`, `rank:…pending` × `duelStart`/`match`/`forfeitPending`/`DUEL_PENDING_MS`); anterior: verificado em 30/09/2026 por doc-mantenedor (sem verificador independente nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — `_admin.js`, `gmTools.ts`, `corvoAdocao.ts`, `AreaTopBar.tsx`, `npcScale.ts`, `attributes.ts`; só as seções tocadas; delta `8e6d0d9a..ae366480`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes)
> **Verificação:** `npx vitest run src/contexts src/utils/careCaps.test.ts src/utils/playerDay.contract.test.ts functions/api/save.test.js functions/api/saveId.parity.test.js desktop/renderer/src/cloudSync.test.ts` — em especial `GameStateContext.hydrate.fuzz.test.tsx` (todo campo não-opcional tem linha em `hydrateSave`), `GameStateContext.saveContent.test.tsx`, `GameStateContext.hostile.test.tsx`, `migrateDecor.test.ts` e `functions/api/_kv.fiacao.test.js`.
> **Não cobre:** o que cada regra FAZ com esses campos (→ `02-REGRAS-DE-NEGOCIO.md`), as rotas e credenciais (→ [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md)), a arquitetura e as quatro superfícies (→ [05-ARQUITETURA.md](05-ARQUITETURA.md)), função por função (→ `06-REFERENCIA/`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## 1. O caminho do dado, em uma frase

```
setGameState  →  writeLocal(GAME_STATE)                       [SEMPRE, síncrono]
              →  debounce  →  POST /api/save?id=<saveId>      [3 s, teto de 15 s]
                              → functions/api/save.js
                              → kv(env).put(<saveId>, JSON)   [TTL 1 ano, renovado]
```

E na volta:

```
GET /api/save?id=<saveId>  →  kv(env).getWithMetadata(<saveId>)
                           →  state.accountTier / state.credits SOBRESCRITOS
                              a partir de `ent:<saveId>`      [o servidor manda]
                           →  adoptCloudSave()  →  localStorage  →  reload
```

---

## 2. O `GameState`, campo a campo

**Fonte:** `interface GameState` em `src/contexts/GameStateContext.tsx`.
**Contagem (07/10/2026, Tarefa C: entrou `avatarId`): 108 campos de topo; 107 com `fichaJornada` (PR15b); a de 06/10/2026 era 106** no `export interface GameState` (linhas 193–648 de `src/contexts/GameStateContext.tsx`; o comando abaixo, ancorado no `export interface GameState`, dá **106** em `7c76eaf9`, com `talentPicks`, `equipment` e `bitsOrigin` do combate v3; a tabela de §2.1–§2.9 abaixo cita só parte dos campos acrescentados por outras sessões desde 30/09). Contagem anterior: **96 campos de topo** — `s=$(grep -n '^export interface GameState' src/contexts/GameStateContext.tsx | cut -d: -f1); sed -n "${s},591p" src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*??:'` → **97** em `3532ccf5` (entrou `crossings`; a interface fecha na linha 591 — ⚰️ 582 até `cfe27cc7`); eram 96 em `5edfcfba` e 94 em `ae366480` (entraram `review` e `refugeInvite`). ⚠️ O intervalo fixo `161,N` citado abaixo já não serve: começa ANTES de `GameState` e conta campos de `ActivityStats` (`sed -n '161,582p'` daria 101, não 96) — o comando acima ancora no `export interface GameState`. Histórico: **92 campos de topo** em 24/09/2026 (`sed -n '161,537p' src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*\??:'` → 92; ⚰️ o intervalo era `161,521` até entrar `incubation` (WP4.29), que empurrou o fim da interface; eram 91 em 22/09/2026; eram 89 em 21/09/2026 — entraram `missionPerfectDays` e `minigameBits` em `cf6315e1` (decisões do dono #41/#60 e #61/#63); e 88 em 09/09/2026, quando entrou `conquistasHerdadas` em `42b07bec`; extraídos do corpo da
interface, ignorando comentários e campos aninhados). O inventário
(`node scripts/docs-inventario.mjs`) diz **110** porque conta também as
sub-chaves de `soulmonMeta` e de `lastDayReport`, que aqui aparecem dentro da
linha do pai (§2.10 e §2.11).

**Sincroniza para a nuvem?** O corpo do `POST /api/save` é
`JSON.stringify(gameState)` inteiro, então a resposta padrão é **sim**. As
exceções são poucas e estão marcadas: `accountTier` e `credits` são apagados
pelo servidor (`SERVER_OWNED_FIELDS` em `functions/api/save.js`) e devolvidos a
partir do entitlement; `equippedFurniture` é forçado a `undefined` no load e
some no primeiro `JSON.stringify`.

**Default no load** é o que `hydrateSave` (mesmo arquivo) escreve. Onde a coluna
diz "—", o campo é opcional e o padrão É a ausência.

### 2.1 Progresso e vitalidade

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `healthPoints` | `number` | Corações. Aceita frações de 0.5. | `src/utils/careRules.ts`, `dailyReset.ts` | `min(maxHP, max(0, num(…, maxHP)))` — save sem HP nasce **cheio**, nunca 0 | sim |
| `maxHealthPoints` | `number` | Teto de HP da forma atual. | `src/types/progression.ts` (`MAX_HP_BY_FORM`) | **recalculado** de `evolutionStage` a cada load, nunca lido do save | sim |
| `energyPoints` | `number` | Barras de energia; enche só comendo, zera na virada. | `src/utils/careRules.ts` | `0` | sim |
| `perfectDays` | `number` | Dias completos acumulados desde a última evolução. Só cresce. | `src/utils/dailyReset.ts` | `0` | sim |
| `totalPerfectDays?` | `number` | Contador LIFETIME de dias completos **REAIS** (insumo de `achievements.ts` — `dias-completos-30`, `DIAS_COMPLETOS_PARA_CONQUISTA = 30` — e de `seasons.ts`). ⚠️ Desde a decisão do dono **#41/#60** (22/09/2026) o 🌀 Glitchtama **NÃO** soma aqui, e a missão deixou de lê-lo: o campo significa uma coisa só. | `src/utils/achievements.ts`, `src/utils/dailyReset.ts` | `0` | sim |
| `missionPerfectDays?` | `number` | **Campo novo em `cf6315e1`** (decisão do dono **#41/#60**, 22/09/2026). Dias completos vitalícios **para a MISSÃO** `mission-perfect-30`: reais **mais** os 🌀. Lido **só** por `src/utils/missions.ts`. Escrito pela virada (junto de `totalPerfectDays`) e por `specialItemUse.ts` (só ele). Linha vermelha #20 — save só ACRESCENTA. | `src/utils/missions.ts`, `src/utils/specialItemUse.ts` | `num(loadedState.missionPerfectDays, num(loadedState.totalPerfectDays, 0))` — **herda o vitalício antigo**, que já somava os 🌀, para a missão não andar para trás | sim |
| `conquistasHerdadas?` | `AchievementId[]` | Conquistas abertas por gatilho que NÃO existe mais, gravadas UMA vez no load (decisão #30, 21/09/2026). Hoje só `'dias-completos-30'` (ex-`tasks-100`). A única conquista persistida — todas as outras são derivadas. | `src/utils/achievements.ts` (leitura), `hydrateSave` (escrita) | save com o campo mantém (filtrado por `ACHIEVEMENT_IDS`); sem o campo: `['dias-completos-30']` se `gatilhoAntigoTasks100` (≥ 100 em `completedTasks + activityLog`), senão `[]` | sim |
| `lastDayWasPerfect` | `boolean` | O dia anterior fechou completo. ⚠️ **Escrito e nunca lido** (`grep -rnw lastDayWasPerfect src --include=*.ts --include=*.tsx \| grep -v test` → só tipo, hidrate e a escrita; `lastDayReport.wasPerfect` carrega a mesma informação — QA Rodada 2 `04` §2.1; candidato a morrer). | `src/utils/dailyReset.ts` | `false` | sim |
| `totalXP` | `number` | XP do Vínculo. O NÍVEL nunca é salvo — é `bondLevelFor(totalXP)`. | `src/utils/bond.ts` | `0` | sim |
| `powerPoints` · `harmonyPoints` · `benevolencePoints` | `number` | Os três atributos, que escolhem o galho. | `src/types/attributes.ts` | `0` cada | sim |
| `attributesSinceLastEvolution` | `{ power: number; harmony: number; benevolence: number }` | Atributos ganhos desde a última evolução — é este que decide o galho. | `src/utils/dailyReset.ts` | `{0,0,0}` campo a campo | sim |
| `evolutionStage` | `string` | Id da forma: `'rookie'`, `'{champion\|ultimate\|mega}-{power\|data\|benevolence}'`, `'ultra'`. | `src/types/progression.ts` | `'rookie'` se não for string | sim |
| `currentBranch` | `'power' \| 'harmony' \| 'benevolence'` | Galho corrente. | `src/types/progression.ts` | `'harmony'` para qualquer valor fora do enum | sim |
| `unlockedEvolutions` | `string[]` | Formas já alcançadas (álbum + missões). | `src/utils/missions.ts` | `['rookie']` quando vazio | sim |
| `formReachedAt?` | `Record<string, string>` | Quando cada forma foi alcançada (dia do jogador). Save antigo não tem, e a data **nunca é inventada**. | `src/utils/collectionDates.ts` | `{}` | sim |
| `evolutionLocked?` | `boolean` | O cadeado da página de Evolução. | `src/App.tsx` (`handleEvolve`) | — | sim |
| `degeneratedByHP` | `boolean` | O pet caiu por HP 0. | `src/utils/dailyReset.ts` | `false` | sim |
| `redeemed?` | `boolean` | Já caiu por HP 0 **e subiu de novo**. Cosmético e só no sentido positivo. | `src/App.tsx` | `false` | sim |
| `showRedeemed?` | `boolean` | Exibir a marca da volta — escolha do jogador, padrão não. | `src/App.tsx` | `false` | sim |
| `hideFromPublicList?` | `boolean` | Opt-out da lista pública do Torneio (TORC-5, 02/10/2026): `true` = a pessoa saiu. Só o `true` literal vale no load; o padrão é aparecer. Sobe como `publicHidden` no perfil. | `src/components/SettingsPage.tsx` (via `src/App.tsx`) | `false` | sim |
| `maxActivityCap` | `number` | Teto de atividades da forma. | `src/types/progression.ts` (`FORM_REQUIREMENTS[…].cap`) | derivado do estágio | sim |
| `lastResetDate` | `string` | `toDateString()` da última virada. É a chave do MOTOR de virada (`dayKeyOf`), **não** o dia do jogador. | `src/utils/dailyReset.ts`, `habitRhythm.ts` | `new Date().toDateString()` | sim |
| `rebirth?` | `RebirthRecord \| null` | O registro do Renascimento. **Nunca é apagado** — é ele que impede a segunda vez. | `src/utils/rebirth.ts` | — (ausência = jamais renasceu, nunca inferido) | sim |

### 2.2 Atividades, tarefas e histórico

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `activities` | `Activity[]` | Os hábitos. Cada um: `id`, `name`, `category`, `emoji`, `steps[]`, `weekDays[]`, `alarm?`, `completedToday?`, `lastCompletedDate?`, `schedule?`, `anchor?`. | `src/types/taskModel.ts` (`normalizeSchedule`) | `[]`; item sem `id` string é **descartado**; `steps` sempre vira array (a virada faz `.length` nele) | sim |
| `tasks` | `Task[]` | As tarefas. Campos novos todos OPCIONAIS: `effort?`, `status?`, `startDate?`, `postponedCount?`, `createdAt?`, `lastTouchedAt?`, `focusDate?`. | `src/utils/taskTriage.ts` | `[]`; item sem `id` string é **descartado** | sim |
| `completedTasks` | `CompletedTask[]` | Histórico de tarefas avulsas concluídas, com `effort` **carregado** (sem ele a virada cobraria coração de quem fez tudo) e `wasHaunted?`. | `src/utils/carePattern.ts` | `[]`; régua deliberadamente MAIS frouxa — só o NULLISH sai, porque histórico descartado não volta | sim |
| `activityStats` | `ActivityStats` | `{ [activityId]: { name, emoji, category, completionCount } }`. | `src/App.tsx` | entrada nullish removida; `name`/`emoji`/`completionCount` completados | sim |
| `activityLog?` | `string[]` | Timestamps ISO das ATIVIDADES concluídas. Existe porque `completedTasks` só recebe tarefa avulsa — sem isto o ritmo de cuidado ficava cego para o hábito. | `src/utils/carePattern.ts` | `[]` | sim |
| `habitRhythms?` | `Record<string, HabitRhythm>` | Constância por hábito: `done[]`, `missed[]`, `shielded[]`, `shields`, `totalDone`, `lastCompletedDate?`. Fica FORA da `Activity` porque a virada reescreve o array de atividades inteiro. | `src/utils/habitRhythm.ts` | `{}`; **cada entrada** é normalizada (`{a:{}}` chegava em `applyMissedDay` e derrubava a virada); `totalDone ≥ done.length` | sim |

### 2.3 Cuidado, cocô e tetos

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `careCaps?` | `CareCaps` | **Onde os tetos de cuidado moram**: `feedTimes` (timestamps da janela de 1 h) e `rubHeal` (`{date, healed}` do dia). | `src/utils/careCaps.ts` | `mergeCareCaps(save, legado do localStorage, Date.now())` — idempotente | sim |
| `foodInventory` | `Record<string, number>` | A pastinha, por emoji de item. | `src/utils/specialItemUse.ts`, `shopBuy.ts` | valores viram inteiro ≥ 0 e entrada zerada é **removida** | sim |
| `poopEventsScheduled` | `number[]` | Instantes agendados dos cocôs do dia. | `src/hooks/useCareSystem.ts` | só números finitos (`'x'` viraria `NaN` e o cocô nunca mais apareceria) | sim |
| `poopEventsShown` | `number[]` | Índices que realmente apareceram na tela (o pulado por sono não penaliza). | `src/hooks/useCareSystem.ts` | idem | sim |
| `poopEventsCompleted` | `number[]` | Índices já limpos. | `src/hooks/useCareSystem.ts` | idem | sim |
| `poopPenaltyClockAt` | `number` | Relógio (epoch ms) do dreno de 6 h. | `src/utils/poopDrain.ts` | **`0` sempre** — restaurar o timestamp cru fazia o dreno cobrar as horas em que a pessoa não estava lá | sim (mas chega sempre zerado) |
| `poopDrainCharge?` | `{ day: string; hearts: number }` | Quanto o dreno já cobrou no DIA DO JOGADOR — é o que faz o teto ser diário, e não por tick. | `src/utils/poopDrain.ts` | só sobrevive com `day` string | sim |
| `glitchtamaUse?` | `{ day: string; used: number }` | Glitchtamas usados no dia do jogador (`GLITCHTAMA_PER_DAY`). | `src/utils/specialItemUse.ts` | só sobrevive com `day` string; ausência = zero, nunca dívida | sim |
| `minigameBits?` | `{ day: string; earned: number }` | **Campo novo em `cf6315e1`** (decisão do dono **#61/#63**, 22/09/2026). Ledger do teto diário de 💠 de **minijogo** (`MINIGAME_BITS_PER_DAY = 150`); `day` é o **dia do jogador**. Os Bits do **dia completo** (`BITS_PER_COMPLETE_DAY = 100`) **não** passam por aqui. No save e não no `localStorage` pelo mesmo motivo do `careCaps`/`poopDrainCharge`/`glitchtamaUse`: teto que se fura trocando de aparelho não é teto. | `src/utils/currencies.ts` (`creditMinigameBits`, `minigameBitsToday`, `remainingMinigameBits`) | só sobrevive com `day` string; ausência = dia inteiro disponível, nunca dívida | sim |
| `restDaysLeft?` · `restWeekKey?` | `number` · `string` | A folga da semana (`REST_DAYS_PER_WEEK`) e a segunda-feira a que ela pertence. | `src/utils/dailyReset.ts` (`restWeekKeyFor`) | `undefined` — ausência tem de significar "folga inteira", nunca "já gasta" | sim |
| `petPassive?` | `string` | O traço de nascimento. | `src/utils/passives.ts` | **`rollPetPassive()`** quando ausente — save sem traço ganha um no load | sim |

### 2.4 Noite: descanso, sonhos, pesadelos, aventuras

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `rest?` | `RestState` | `window` (a janela escolhida), `nights[]` (`{date, sleptAt?, wokeAt?, onTime}`, cortado em `MAX_NIGHTS`), `dreams[]`, `dreamDates?` (`Record<dreamId, dayKey>` — a PRIMEIRA data de cada sonho, carimbada por `collectDream` (o id sorteado vem de `rollDream`; quem chama é o `App.tsx`), lida pelo "#NN · data" do Dex), `hideMetrics?`, `playerDayTz`. **Só agregados por noite** — nunca série de sensor. | `src/utils/restWindow.ts` | `hydrateRest`: `rest: {}` derrubava a árvore no primeiro render; noite sem `date` é descartada; `onTime` inválido vira `false` (o valor NEUTRO); `dreamDates` só sobrevive com entradas string→string não vazias (o resto some, nunca vira data inventada). ⚠️ Até 20/09/2026 (`8bc55437`) `hydrateRest` DESCARTAVA `dreamDates` a cada load — o save gravava, a abertura seguinte apagava, e a coleção voltava a "sem data". | sim |
| `nightmares?` | `NightmareState` | `fought[]` (manhãs já combatidas, teto de 30) e `pending?`. | `src/utils/nightmares.ts` | `hydrateNightmares`: `fought` sempre array de string | sim |
| `adventures?` | `Array<{ id: string; day: string }>` | O diário de aventuras, com a data da PRIMEIRA vez. **Não paga nada** — nenhum Bit, item ou atributo depende dele. | `src/utils/adventure.ts` | entrada malformada é descartada, o load nunca cai | sim |
| `playLog?` | `PlayLog` | `date` da última brincadeira + `buff` de Bits do próximo minijogo. **Nunca** pode ser lido por dia completo, HP ou evolução. | `src/utils/petNeeds.ts` | `hydratePlayLog`: sem `date` string não existe registro; buff com `multiplier` não-numérico é descartado | sim |
| `steps?` | `StepsRecord` | **Só o agregado do dia**: `{date, baseline, today}`. Nunca série bruta, horário ou localização. | `src/utils/steps.ts` | `hydrateSteps`: sem `date` string, `undefined`; `baseline`/`today` ≥ 0 | sim |
| `stepsConsent?` | `'granted' \| 'declined'` | A resposta à tela de consentimento de passos. `'declined'` é PERMANENTE. | `src/utils/steps.ts` | só os dois valores conhecidos sobrevivem; o resto vira `undefined` = "ainda não perguntei" | sim |

### 2.5 Rituais e humor

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `lastCheckInDate?` | `string` | Dia do jogador do último check-in concluído. | `src/utils/rituals.ts` (`needsCheckIn`) | `str(…)` | sim |
| `lastWeeklyReportDate?` | `string` | Dia do último relatório semanal mostrado (checado por SEMANA). | `src/utils/rituals.ts` | `str(…)` | sim |
| `lastFreshStartDate?` | `string` | Dia do último recomeço aceito. | `src/utils/rituals.ts` (`applyFreshStart`) | `str(…)` | sim |
| `moodLog?` | `Array<{ date: string; mood: 1..5 }>` | Check-in de humor. **Nunca alimenta pontuação.** | `src/utils/mood.ts` | entrada sem `date` string ou `mood` numérico é filtrada | sim |
| `lastDayReport?` | objeto (§2.11) | O relatório do dia anterior, escrito na virada. | `src/utils/dailyReset.ts` | só sobrevive como objeto **com `date` string** (lixo truthy abriria o modal vazio) | sim |
| `firstDay?` | `FirstDayProgress \| null` | Os três gestos do primeiro dia. Some sozinho na virada. | `src/utils/firstDay.ts` | `normalizeFirstDay(…) ?? undefined` | sim |
| `memoriesShown?` | `number[]` | Marcos de memória (30/90) já mostrados. | `src/utils/memories.ts` | só números | sim |

### 2.6 Economia e coleções

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `gamePoints` | `number` | **Bits**. Duas fontes desde 22/09/2026: a virada credita `BITS_PER_COMPLETE_DAY` (100) a cada dia completo, e os minijogos creditam até `MINIGAME_BITS_PER_DAY` (150) por dia do jogador, com ledger em `minigameBits` (o nome do campo foi mantido). | `src/utils/currencies.ts` | `0` | sim |
| `emblems?` | `number` | **Emblemas** — a moeda do Torneio. | `src/utils/currencies.ts` | `0` | sim |
| `credits?` | `number` | **Créditos** — comprados com dinheiro real. Espelho apenas: a verdade é `ent:<saveId>`. | `functions/api/_entitlements.js` | `0` | ❌ **removido no POST**, devolvido pelo servidor no GET |
| `accountTier?` | `'demo' \| 'paid'` | O tier da conta. Espelho, mesma regra dos Créditos. | `functions/api/_entitlements.js` | `'demo'` só quando o save diz `'demo'`; qualquer outra coisa vira `'paid'` (saves anteriores ao campo são adotados como pagos) | ❌ **removido no POST**, devolvido no GET |
| `ownedBackgrounds` | `string[]` | Cenários comprados. | `src/utils/backgrounds.ts` | `Set([...lidos, 'bg-room'])` — o cenário grátis é sempre possuído | sim |
| `equippedBackground` | `string \| null` | Cenário equipado. | `src/utils/backgrounds.ts` | `null` | sim |
| `ownedFurniture?` | `string[]` | Decorações compradas. | `src/utils/shop.ts` | `[]` | sim |
| `equippedDecor?` | `Partial<Record<SlotId, string>>` | Um item de decoração por espaço do palco. | `src/utils/petStage.ts` | `hydrateDecor(migrateDecor(loaded))` — §5.2 | sim |
| `equippedFurniture?` | `string \| null` | ⚰️ **Depreciado.** Só existe para migrar. | — | forçado a `undefined`, some no primeiro `JSON.stringify` | não (some) |
| `droppedItems?` | `string[]` | Ids de item de loja que JÁ dropou (destrava a compra). ⚠️ **Lido e nunca escrito**: o leitor é `StatsPage.tsx` (jornada); ⚰️ esta linha dizia "escrito por `shop.ts` (`unlock:'drop'`)" — `grep -n "'drop'" src/utils/shop.ts` → 0, o escritor não existe (QA Rodada 2 `04` §2.1). | — (nenhum escritor) | `[]` | sim |
| `bestiary?` | `string[]` | Inimigos da masmorra já enfrentados (`linha-tier`). Só cresce. | `src/utils/dungeon.ts` (`enemyKey`) | `[]` | sim |
| `incubation?` | `Incubation` (`{ v: 1, since: Record<formId, string> }` — ⚰️ `notified: string[]` saiu em `4b87fee0`, 27/09/2026) | WP4.29 (D-G8b/D-G8c, 22/09/2026) — a incubação: `formId` → instante em que a forma ficou **apta** (não "gerando"; sem relação com o acervo de sprites). O gesto de evoluir só completa depois de `INCUBATION_MIN_MS`. O `since` de uma forma **nunca é apagado dentro da mesma criatura** (degenerar e re-subir reaproveita o relógio, parecer R-L); **zera** (`emptyIncubation()`) no Renascimento e na troca de criatura do upgrade demo→pago (`handleUpgradeRevealed`). | `src/utils/spriteTrigger.ts` (`incubationFor`, idempotente); escrito por um efeito do `App.tsx`, conferido em `handleEvolve` (`incubationReady`) | `undefined` se ausente/não-objeto/`since` inválido; senão só pares forma→string sobrevivem; `notified` de save antigo **não é copiado** (descartado em silêncio). Data inválida **não** é filtrada: `incubationReady` responde `true` para relógio corrompido e para forma sem registro (save antigo não ganha relógio novo) | sim |
| `weeklyMissions?` | `WeeklyMissionProgress` | `{week, counts, claimed}` da semana ISO corrente. | `src/utils/weeklyMissions.ts` (`forWeek`) | `undefined` se `week` não for string — a leitura seguinte devolve semana vazia | sim |
| `season?` | `SeasonProgressState` | Estado da estação corrente. | `src/utils/seasons.ts` | `undefined` — a primeira virada tira a foto | sim |
| `dungeonKills?` · `dungeonRunsCompleted?` · `dinoBest?` | `number` | Contadores LIFETIME das missões. | `src/utils/missions.ts` | `0` cada — valor não-numérico viraria `NaN` permanente e a missão ficaria impossível | sim |
| `review?` | `ReviewState` (`{ cards, lastSessionDay? }`) | **Campo novo de 30/09/2026** (Ateliê da Mente, Revisão da Malha). Os cartões que a PESSOA escreve e a caixa de Leitner de cada um. Mora no save — e não no aparelho — porque é conteúdo dela: perder ao trocar de celular seria perder o que escreveu. Teto `REVIEW_MAX_CARDS`. | `src/utils/mente/revisao.ts` (`sanitizeReview`) | `{ cards: [] }` — cartão malformado é DESCARTADO, a varredura é limitada a um múltiplo de `REVIEW_MAX_CARDS`, lixo não derruba o load | sim |
| `refugeInvite?` | `RefugeInviteState` | **Campo novo de 30/09/2026** (convite ao Refúgio). Só DATAS (`lastShownDay`, `dismissedDay`, `acceptedDay`, `silencedUntil`, dia do jogador em ISO) e `dismissStreak` — **nunca o humor que disparou o convite** (dado sensível). Nada paga, nada conta. | `src/utils/refugio/convite.ts` (`sanitizeRefugeInvite`) | `undefined` se não for objeto; `dismissStreak` preso em `0..REFUGE_INVITE_DISMISSALS_TO_SILENCE`; data fora do formato vira `undefined` | sim |
| `crossings?` | `CrossingsState` (`{ opened, active, pending, destination, hidden, doneDay, pickDay, score, trip }`; `pickDay`/`score`/`trip` desde 04/10/2026 — dia da missão escolhida, total de Marcos de Aventura 0–9999 e a viagem da noite `{ day, region }`; todos opcionais num save antigo) | **Campo novo de 30/09/2026** (`3532ccf5`, Passeio + Travessias). Regiões abertas com o dia do jogador, a Travessia escolhida (sem data — não envelhece), os "Fiz" guardados (`pending`, nunca expira), o destino do Passeio e o interruptor. **Só ids, enum, `dayKey` e um booleano** — nada de texto livre, lugar ou foto (parecer 04 R-4). **Nenhum sistema do núcleo lê este campo** (há contrato). Leitura: `?? CROSSINGS_EMPTY`. | `src/utils/travessiasSave.ts` (`normalizeCrossings`; regra em `src/utils/travessias.ts`) | `CROSSINGS_EMPTY` se não for objeto; descarta `RegionId` inválido, casa em `opened`, dia fora de `AAAA-MM-DD`, id de desafio fora de `[a-z0-9-]{1,64}`, região repetida e `pending` já aberta; `destination` só se aberta e ≠ casa — lixo nunca derruba o load | sim |
| `ownedFrames?` | `string[]` (ids `^[a-z0-9-]{1,40}$`, sem repetição, teto 200) | Cosmético (R8, 04/10/2026): posse de molduras de loja/conquista/evento (as de rank vêm da faixa). `sanitizeOwnedFrames` (load) e `clampOwnedFrames` (`save.js`). Leitura `?? []`. Não é dado pessoal sensível; nunca vai a perfil público ainda. |
| `avatarId?` | `string \| null` | Foto de perfil (Tarefa C, 07/10/2026): id de um NPC da LISTA FECHADA `src/assets/avatares/catalogo.json` (123 miniaturas webp; espelho `functions/api/_avatares.js`, paridade em `utils/avatar.test.ts`). Só o id vai ao save e ao servidor; `save.js` zera (`null`) o que não está na lista, e a moldura equipada (`equippedFrame`) também é conferida contra o catálogo fechado (`functions/api/_frames.js`). O perfil público (`community.js`: `profile`, `publicProfile`, `match.opponent`, linhas de rank) guarda e devolve `avatarId`/`frameId` pelas mesmas listas. Descrição EN é o padrão (`en` no catálogo; PT-BR derivado do slug). Leitura `?? null` → padrão determinístico do saveId (`utils/avatar.ts`). |
| `equippedFrame?` | `string \| null` | Cosmético (R8): a moldura escolhida. `sanitizeEquippedFrame` / `clampFrameId`. Leitura `?? null`; se deixou de valer (lugar de Mestre perdido) a tela desenha sem moldura e o id fica guardado. |
| `caderno?` | `CadernoEntry[]` (`{ id, day, formato, text, at }`, até 120 × 2000 caracteres) | **Sensível** (04/10/2026): as anotações do Caderno. Sanitizado em `cadernoSave.normalizeEntries` (load) e `clampCaderno` (`save.js`). Nunca em IA/telemetria; exportado e apagado com a conta. |
| `trophies?` | `Array<{ season: string; place: 1\|2\|3 }>` | Troféus de season do Torneio. | `src/utils/seasons.ts`, `functions/api/community.js` | item sem `season` string ou `place` fora de 1..3 é filtrado (viraria medalha fantasma no palco) | sim |
| `talentPicks?` | `string[]` (um id de talento por grau, até `TALENT_POINTS_MAX` = 20) | Combate v3 (PR7): os talentos escolhidos; os pontos NÃO são guardados (= Vínculo, que sai de `totalXP`). `sanitizeTalentPicks` (load, limitado ao Vínculo) e o mesmo no `save.js`; vetor inválido é descartado inteiro (vale 0 no duelo). | `src/utils/talents.ts`, `functions/api/_talents.js` | `[]` | sim |
| `equipment?` | `EquipmentState` (`{ owned: string[], equipped: { nucleo?, carapaca?, rastro? }, fragments }`) | Combate v3 (PR8a/b): o equipamento comprado e o que está nos 3 slots; id fora do catálogo ou slot forjado é descartado peça a peça (`sanitizeEquipment`, cliente e `_equipment.js`). `fragments` teto `FRAGMENTS_MAX` = 999. | `src/utils/equipment.ts`, `functions/api/_equipment.js` | `EMPTY_EQUIPMENT` | sim |
| `bitsOrigin?` | `BitsOrigin` (`{ day, free, fromCredits, paidLeft }`) | Combate v3 (PR8a): a PROCEDÊNCIA dos Bits. `gamePoints` segue um número só; `paidLeft` é quanto dele veio de Crédito (o equipamento só enxerga `saldo − paidLeft`), e `free`/`fromCredits` medem o câmbio do dia contra o teto `CREDIT_BITS_CAP_RATIO` (25%). Sem o campo, todo Bit é ganho. | `src/utils/bitsOrigin.ts`, `functions/api/_equipment.js` | sem campo (`sanitizeBitsOrigin`) | sim |
| `bondRewardsClaimed?` | `string[]` | As recompensas COSMÉTICAS da escada de Vínculo já entregues. É a única coisa que a escada persiste. | `src/utils/bond.ts` | `[]` | sim |
| `bondDaily?` | `BondDailyLedger` | `{day, spent:{dungeon?, tournament?}}` — o teto diário SUAVE das fontes repetíveis. | `src/utils/bond.ts` | `hydrateBondDaily`: tudo que não for número finito e positivo vira zero; fonte desconhecida é descartada | sim |

### 2.7 Identidade da criatura

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `soulmonStages?` | `CreatureStage[]` | A árvore de 11 formas do jogador, gerada pelo Oráculo e congelada. | `src/utils/oracle.ts` | item primitivo é filtrado (derrubaria a tela do Pet) | sim |
| `soulmonSkills?` | `Record<FichaStage, StageSkills>` | As duas skills de cada estágio. Persistidas porque o perfil do Oráculo mora só no `localStorage` e **não** vai à nuvem. | `src/utils/soulProfile/ficha/skills.ts` | — | sim |
| `fichaJornada?` | `{ v: 1; estagios: Partial<Record<FichaStage, { galhos; at; plano?; familia? }>> }` | PR15b (Combate v3): a janela de comportamento (`attributesSinceLastEvolution`) gravada na evolução manual sob o estágio que nasce. **Imutável** depois de gravada (degenerar e reevoluir reusa o registro — anti-reroll). Ausente em save de antes do PR15: nada muda até a próxima evolução, e a ficha atual nunca é reescrita. `galhos` é a fonte; `plano`/`familia` são espelho derivado. Zerado quando a criatura é substituída (renascimento, nova leitura). O servidor (PR15c, `functions/api/_fichaJornada.js`) sanea a forma (estágio válido, galhos finitos e com teto, `at` plausível, `familia` na lista fechada das 7), recalcula o `plano` dos `galhos` e faz cumprir a imutabilidade contra o save gravado (estágio já gravado nunca é sobrescrito; a `familia` entra uma vez); nunca recusa o save. Sem o campo, nada muda (reset/renascimento o apagam). Risco aceito pelo dono: ficha escolhida a dedo com o mesmo orçamento. | `src/utils/fichaJornada.ts` | ausente | sim |
| `soulmonClassTitles?` | `Record<FichaStage, ClassTitle>` | A classe (arquétipo do class-system) de cada estágio. Mesmo motivo de cache. | `src/utils/soulProfile/ficha/classTitle.ts` | — | sim |
| `soulmonMeta?` | objeto (§2.10) | Metadados do Oráculo usados fora da árvore. | `src/utils/oracle.ts`, `petName.ts` | — | sim |
| `spriteLibrary?` | `SpriteLibrary` | O acervo de sprites GERADOS, por forma, e o estado da adoção do visor. **Guarda só a URL** (~120 bytes): base64 aqui iria ao `localStorage` e subiria à KV a cada debounce. | `src/utils/spriteLibrary.ts` | `normalizeSpriteLibrary` devolve acervo vazio para qualquer coisa estranha — e acervo vazio é a arte de RESERVA, que nunca é erro | sim |
| `eggType?` | `'ignar' \| 'lumel' \| 'serah'` | A linha de sprite GENÉRICO sorteada no onboarding. Não é mais escolha do jogador. | `src/utils/sprites.ts` (`DUNGEON_LINE_SPRITES`) | `loaded ?? localStorage(EGG_TYPE) ?? 'ignar'` | sim |
| `demoCharacterId?` | `'kaelen' \| 'orrin' \| 'thalindra' \| 'igni' \| 'nautilu' \| 'astrase'` | Qual personagem pré-pronto o modo grátis escolheu. Os três últimos entraram em 15/09/2026 (`c11dc49d`, as linhas novas da pré-seleção). | `src/utils/monetization.ts` | só os seis ids conhecidos sobrevivem (`hydrateSave`, lista `as const` + `find`) | sim |
| `demoTint?` | `number` | Tonalidade do personagem do demo. `0` = original; `1..3` = as três. **Cosmético, zero mecânica.** | `src/utils/monetization.ts` | `0` | sim |
| `bornAt?` | `string` | O dia (do jogador) em que a criatura nasceu. **Nunca é inferido** em save antigo, e o upgrade não o reescreve. | `src/utils/anniversary.ts` | `undefined` se não for string — jamais um fallback calculado | sim |

### 2.8 Social

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `pvpEnabled?` | `boolean` | Opt-in do PvP assíncrono. É o **portão do `pushProfile`**: com ele falso, nada é publicado no diretório. | `src/utils/community.ts`, `functions/api/community.js` | `false` | sim |
| `friends?` | `string[]` | Amigos aceitos (até 5), por id de perfil público. | `src/utils/community.ts` | `[]` | sim |

### 2.9 Onboarding, consentimento e oferta

| Campo | Tipo | O que guarda | Módulo dono | Default no load | Nuvem |
|---|---|---|---|---|---|
| `soulGoal?` · `soulStruggle?` | `string` | O "porquê" do usuário, respondido antes de qualquer mecânica. **Texto livre sobre a vida da pessoa** — é o campo mais sensível do save. | `src/utils/goalToCategory.ts` | `''` | sim |
| `consent?` | `ConsentRecord` | Quando (ISO) e QUAL versão de cada documento foi aceita. Um booleano não diz a que texto a pessoa disse sim. | `src/utils/consent.ts` (`normalizeConsent`) | `normalizeConsent(…)`; ausência **nunca** vira bloqueio | sim |
| `offerShownWeek?` | `string` | Semana ISO em que a oferta do value moment apareceu. O cap é sobre ter OFERECIDO. | `src/utils/offerMoment.ts` | `undefined` | sim |
| `offerDismissed?` | `boolean` | O jogador dispensou o convite PARA SEMPRE. Terminal de propósito. | `src/utils/offerMoment.ts` | `false` | sim |
| `playerDayTz?` | `PlayerDayAnchor` | O fuso FIXO em que o dia do jogador é contado. §6. | `src/utils/playerDay.ts` | `resolvePlayerDayAnchor(…)` — a do save VENCE | sim |

### 2.10 `soulmonMeta` (aninhado)

| Sub-chave | Tipo | O que guarda |
|---|---|---|
| `seed?` | `number` | A semente do Oráculo (permite regerar). |
| `baseName` | `string` | O nome da ESPÉCIE, gerado pelo Oráculo. |
| `petName?` | `string` | O nome que o JOGADOR deu. Ausente em quem manteve a sugestão; quem lê usa `soulmonDisplayName`, que cai no `baseName`. **Nunca sobrescreve `baseName`.** |
| `dominantElement?` · `dominantAlignment?` · `dominantRealm?` | `ElementId` · `AlignmentId` · `RealmId` | Os eixos dominantes da leitura. |
| `creature?` | `'corvo'` | (29/09/2026) Criatura de arte fixa adotada no lugar da gerada — hoje só o corvinho do administrador (`adoptCorvo`). Qualquer outro valor é descartado no load; `spriteLineOf` lê daqui. |

### 2.11 `lastDayReport` (aninhado)

`date`, `done`, `total`, `required`, `heartsLost`, `wasPerfect`,
`energyWasFull?`, `perfectDays`, `degenerated`, `welcomeBack?`,
`shieldsSpent?`, `daysAway?`, `weeklyRelief?`, `heartsRecovered?`,
`restDayUsed?`, `restDaysLeft?`.

⚠️ `restDayUsed` existe porque **perdão que a pessoa não soube que recebeu faz a
cobrança da semana seguinte parecer arbitrária** — a UI conta que a folga foi
usada.

### 2.12 O que a hidratação faz, e por quê

`hydrateSave` não é higiene decorativa: `/api/save` valida apenas que `state` é
um objeto, então **o TIPO de cada campo é dado não confiável** (vem da nuvem,
pode ter sido editado à mão). Um `tasks: {}` ou um `activities: 3` passa direto
por `?? padrão` e só explode dentro do updater da virada, que roda no mount — a
árvore do React desmonta e o usuário fica na **tela branca PERMANENTE**, porque
toda carga seguinte lê o mesmo save.

Os quatro ajudantes que fazem o que o `??` não faz: `arr` (é array?), `num` (é
número finito?), `obj` (é mapa simples, nem array nem null?) e `str` (é string?),
mais `strArr`/`numArr`.

⚠️ **Regra que não pode ser quebrada:** *todo campo não-opcional de `GameState`
precisa de linha em `hydrateSave`*. Faltaram `activities` e `healthPoints` por
muito tempo, e o resultado era literalmente a tela branca — inclusive para um
`{}` adotado da nuvem, porque `adoptCloudSave` grava qualquer objeto simples.
O guard é `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`.

Ordem do inicializador: `readLocal(GAME_STATE)` → `JSON.parse` (array e
primitivo são **recusados**, não convertidos) → `hydrateSave` dentro de
`try/catch` → em qualquer falha, `freshGameState()`.

### 2.13 O que NUNCA vai para o save

| Coisa | Onde ela vive de verdade | Por quê |
|---|---|---|
| **Nível do Vínculo** (`bondLevel`) | derivado sempre: `bondLevelFor(totalXP)` em `src/utils/bond.ts` | Duas fontes para o mesmo número, uma delas gravada no aparelho, é o footgun 9 na forma mais cara. `hydrateSave` escreve `bondLevel: undefined` explicitamente — se um save adulterado trouxer o nível, ele **não entra no estado**. O gate de PvP (`BOND_PVP_MIN_LEVEL`) usa a MESMA derivação nos dois lados, e quem decide é o servidor (`functions/api/_bond.js`), porque o cliente é editável. |
| **Créditos** e **tier** | `ent:<saveId>` na KV, escrito só por `functions/api/_entitlements.js` | `SERVER_OWNED_FIELDS = ['accountTier', 'credits']` é apagado do POST e sobreposto no GET. Sem isso, bastava editar o `localStorage` para virar assinante. |
| **A série bruta de sono ou de passos** | não existe | Só agregados por noite/dia. É o que mantém o app fora do escopo de dado sensível da LGPD e das exigências de health app do Google Play. |
| **Áudio da transcrição** | não existe | `functions/api/transcribe.js` **repassa**, nunca grava: não há `put` de KV nem de R2 no arquivo, e não pode haver. |
| **`digimonName`** | ⚰️ **não existe mais** (07/09/2026) | O campo é `petName` em todo lugar — cliente, bridge (`pet_name`), chat e push. O servidor conhece **um** nome. |
| **`LEGACY_FORM_TIERS`** | ⚰️ **não existe mais** (07/09/2026) | Eram 57 ids de espécie de franquia no bundle. Id fora do esquema cai em `'rookie'` e o sprite em `fallbackSpriteForStage`, que responde com arte nossa por hash. |
| **`digivolutionSegments` / `digivolutionSegmentsNeeded`** | ⚰️ **saíram em 06/09/2026** | Escritos em todo save e lidos por ninguém. A chave continua no `localStorage` de quem já jogou; é órfã inofensiva. |

---

## 3. Persistência local e cloud save

### 3.1 O efeito do `GameStateProvider`

Um `useEffect` com dependência `[gameState]` faz, nesta ordem:

1. `writeLocal(GAME_STATE, JSON.stringify(gameState))` — **sempre**. Storage cheio
   (`QuotaExceededError`) ou bloqueado não pode derrubar a árvore: o jogo segue em
   memória e o usuário é avisado **uma vez**.
2. Pula o cloud save no primeiro render (o load inicial não é mutação).
3. Garante o `SAVE_ID` (gera `crypto.randomUUID()` se não houver).
4. Agenda o POST.

### 3.2 O debounce, e o teto contra inanição

| Constante | Valor | Papel |
|---|---|---|
| `CLOUD_SAVE_DEBOUNCE_MS` | `3000` | Debounce de **cauda**. É este amortecedor que impede a densidade de gesto de virar densidade de escrita: ~23 mutações de uma sessão cheia colapsam em ~14 POSTs. **Reduzi-lo "para encurtar a janela de conflito" PIORA o 409 e o custo.** |
| `CLOUD_SAVE_MAX_WAIT_MS` | `15000` | **R-4 — teto absoluto de espera.** Um debounce de cauda reinicia a cada mutação: um fluxo sustentado de mutações a menos de 3 s **nunca dispara o POST**, e a nuvem para de receber em silêncio. Com o teto, o POST sai no máximo 15 s depois da PRIMEIRA mutação pendente. |

⚠️ **R-1: nada no callback do timer pode chamar `setGameState`.** O efeito depende
de `[gameState]`; tocar o estado ali reiniciaria o debounce e reagendaria o POST
que acabou de falhar, e **cada gesto do jogador aceleraria o ciclo**. A única
exceção declarada é a reconciliação do `pvpBlocked`, que DESLIGA `pvpEnabled` — e
`pvpEnabled` é justamente o portão do `pushProfile`, então ela FECHA a porta em
vez de bater nela (guard: `GameStateContext.pvpBlocked.test.tsx`).

### 3.3 O caminho de erro tipado (`src/utils/cloudSave.ts`)

`cloudSave` devolvia `boolean`, e todo status colapsava em `false` — save perdido
sem ninguém ver. Hoje cada código vira uma CLASSE, e cada classe carrega **por
código** as duas decisões que importam (`CLOUD_SAVE_POLICY`):

| `CloudSaveFailureKind` | Status | `retentavel` | `avisaJogador` |
|---|---|---|---|
| `offline` | `0` (a requisição nem saiu) | sim | não |
| `auth` | `401` | sim | sim |
| `identity` | `403` | **não** (quem conserta é `reconcileSaveId`) | sim |
| `conflict` | `409` | **não** (retentar é o loop que se auto-alimenta) | não |
| `stale` | `412` | não | sim |
| `too-large` | `413` | não | sim |
| `server` | `5xx` | sim | não |
| `deleted` | `410` (`account-deleted`, desde `a6c1cd8a` — a conta foi excluída neste ou em outro aparelho; lápide de 30 dias no servidor, §8.1; desde `592e2c14` o corpo traz `deletedAt` em ms e o 410 vem de TODA rota autorizada, não só do save) | **não** (reenviar recriaria o que a pessoa mandou apagar) | sim — mas não é aviso, é PARADA: `reagirContaExcluida({ excluidaEm })` grava `ACCOUNT_DELETED_NOTICE` (com o `DD/MM` e a frase "o servidor libera o e-mail no próximo login"), **guarda o estado local em `CONFLICT_BACKUP` com `motivo: 'account-deleted'`** (desde `592e2c14` — o wipe deixou de ser irrecuperável), remove `GAME_STATE`/`SAVE_ID`/`LAST_CLOUD_SYNC`/`USER_EMAIL`, desloga e recarrega; o portão mostra a frase uma vez. O `cloudLoad` só reage ao 410 se `SAVE_ID` local for o mesmo id (carregar o save de outro id no login não é "minha conta sumiu"). **E o login confere a lápide ANTES de qualquer onboarding** (`checarContaExcluidaNoLogin`, desde `592e2c14`): conta com lápide fica no portão com o aviso; entrar de novo depois da exclusão REABRE no servidor (`auth_time` > `at`, §8.1 linha 23). |
| `client` | outro `4xx` | não | sim |

**Orçamento de retry, por `saveId` e não por chamada**: `CLOUD_SAVE_RETRY_TETO`
= `3` por `CLOUD_SAVE_RETRY_JANELA_MS` = `10 * 60_000`, com backoff
`CLOUD_SAVE_RETRY_BACKOFF_MS` = `[2000, 8000, 30000]`. Sucesso devolve o
orçamento. Um teto por chamada com ~14 saves/dia viraria 42 requisições
autenticadas/dia contra o Firebase e contra o Pages.

**O carimbo de sincronizado** (`LAST_CLOUD_SYNC`) só é gravado quando o servidor
confirma. Gravá-lo sem checar `res.ok` fazia o app afirmar que o progresso estava
na nuvem depois de um 401 — o jogador trocava de aparelho confiando nisso.

### 3.4 Adoção e reconciliação

| Função | Quando | Regra |
|---|---|---|
| `adoptCloudSave(saveId, state, email?)` | Único caminho que SUBSTITUI o save inteiro (onboarding, "proteger progresso", restaurar, login por e-mail). | **DADO PRIMEIRO, identidade depois.** Se o `writeLocal` do estado falhar, a identidade NÃO troca. Antes eram quatro call sites à mão, na ordem inversa: a identidade trocava sem o dado e o próximo `setGameState` subia o estado ANTIGO sob o `saveId` NOVO, sobrescrevendo o save do outro aparelho em silêncio. Nunca lança; devolve `'ok' \| 'invalid' \| 'storage'`. |
| `reconcileSaveId(email, estadoLocal)` | No login. | 1) `SAVE_ID` já é o derivado → **sai sem tocar a rede**. 2) Chave derivada vazia → **migra** (reaponta e sobe). 3) Chave derivada ocupada → **a NUVEM ganha**, e o local vai para `CONFLICT_BACKUP` ANTES de qualquer troca. 4) Nuvem indeterminada (5xx/offline) → **não migra** — dúvida não move dado. 5) Chave derivada com lápide (410) → `{ estado: 'excluida', saveId, excluidaEm? }` (desde `592e2c14`): nada é movido e `reagirContaExcluida` já correu. **A chave antiga nunca é apagada**, nem no aparelho nem na nuvem. |

O critério de (3) é assimetria de reversão: sobrescrever a nuvem destrói o
progresso de OUTRO aparelho de forma irrecuperável (`save.js` faz `put` cego, sem
versão e sem histórico); "perder" o estado local é recuperável porque ele foi
copiado byte a byte antes.

---

## 4. As chaves de `localStorage`

**Dono único:** `src/utils/storageKeys.ts`. São **44** em `STORAGE_KEYS` mais **2**
em `RECONCILE_KEYS` = 46 (contagem de 09/09/2026 — ⚠️ em 30/09/2026 `grep -c "^  [A-Z_]*: '" src/utils/storageKeys.ts` dá **52** (eram 51 em `ae366480`; entrou `PICROSS_DAILY_PAID`), com as duas da Guilda no fim da tabela abaixo; extraída das duas tabelas do
arquivo; é o mesmo 46 do inventário).

⚠️ **O prefixo é `soulmon-` desde 07/09/2026** (era `digiapp-`). A única exceção
de forma é `GAME_STATE`, que usa `_` e versão: `soulmon_state_v1` (era
`digiapp_state_v3`).

⚠️ **Nenhum arquivo de `src/` chama `localStorage` direto** — tudo passa por
`src/utils/safeStorage.ts`, e há guard exigindo isso.

### 4.1 `STORAGE_KEYS`

| Chave | Valor | O que guarda | Quem lê / escreve |
|---|---|---|---|
| `GAME_STATE` | `soulmon_state_v1` | O `GameState` serializado. | `GameStateContext.tsx`, `App.tsx`, `cloudSave.ts` |
| `LAST_BAD_DAY` | `soulmon-last-bad-day` | Dia do último dia ruim, para fechar `after_bad_day` **no aparelho**. Nunca é enviada: o que sai é uma FAIXA de distância. | `App.tsx` |
| `AI_SETTINGS` | `soulmon-ai-settings` | Personalidade do pet (`customKeywords` etc.) usada no prompt do chat. | `App.tsx` |
| `THEME` | `soulmon-theme` | `light`/`dark`/`system`. Chave reaproveitada do antigo seletor de skin — valor desconhecido vira `system`. | `ThemeContext.tsx` |
| `LANGUAGE` | `soulmon-language` | `pt-BR` / `en-US`. | `i18n.ts`, `App.tsx`, `GameStateContext.tsx` e **5** componentes — `ErrorBoundary`, `AISettingsModal`, `ConfirmDialog`, `SettingsModal`, `SoulmonOnboarding` (`grep -rl "STORAGE_KEYS.LANGUAGE" src/components`, 10/09/2026) |
| `ONBOARDING_COMPLETE` | `soulmon-onboarding-complete` | O ritual do Oráculo terminou. | `App.tsx` |
| `USER_NAME` | `soulmon-user-name` | O nome do JOGADOR (vai ao ranking público quando o PvP está ligado). | `App.tsx`, `GameStateContext.tsx` |
| `EGG_TYPE` | `soulmon-egg-type` | Linha de sprite genérico; semente do `eggType` do save. | `App.tsx`, `GameStateContext.tsx` |
| `FIRST_TASK_POPUP_SHOWN` | `soulmon-first-task-popup-shown` | O aviso da primeira tarefa já apareceu. | `App.tsx` |
| `NOTIFICATIONS_ENABLED` | `soulmon-notifications-enabled` | O jogador ligou notificações. | `App.tsx` |
| `PWA_INSTALL_DISMISSED` | `soulmon-pwa-install-dismissed` | Dispensou o convite de instalar a PWA. | `InstallPrompt.tsx`, `WelcomePromptModal.tsx` |
| `NOTIFICATION_PROMPT_DISMISSED` | `soulmon-notification-prompt-dismissed` | Dispensou o PRIMEIRO convite de push. | `App.tsx`, `WelcomePromptModal.tsx` |
| `NOTIFICATION_PROMPT_DISMISSED_AT` | `soulmon-notification-prompt-dismissed-at` | QUANDO (epoch ms) — o segundo convite precisa das 24 h. Ausente com a booleana ligada = dispensou antes desta versão, e a espera já passou. | `App.tsx`, `WelcomePromptModal.tsx` |
| `NOTIFICATION_PRIMING_DISMISSED` | `soulmon-notification-priming-dismissed` | Dispensou o SEGUNDO convite. **Não existe terceiro.** | `App.tsx` |
| `SCHEDULED_NOTIFICATIONS` | `soulmon-scheduled-notifications` | Fila local de notificações agendadas. | `notifications.ts` |
| `DAILY_NOTIFICATION_CHECK` | `soulmon-daily-notification-check` | Dia do último varrimento de notificações. | `notifications.ts` |
| `SAVE_ID` | `soulmon-save-id` | A identidade do save neste aparelho (UUID antes do login; derivado do e-mail depois). | `GameStateContext.tsx`, `cloudSave.ts`, `App.tsx`, `entitlements.ts`, `playBilling.ts`, `aiClient.ts`, `SettingsPage.tsx`, `AccountDataSection.tsx` |
| `USER_EMAIL` | `soulmon-user-email` | E-mail normalizado do dono do save. | `cloudSave.ts`, `App.tsx`, `SettingsPage.tsx` |
| `PROTECT_PROMPT_AT` | `soulmon-protect-prompt-at` | Última vez (epoch ms) que o app pediu o e-mail para proteger o progresso. | `App.tsx` |
| `IS_SLEEPING` | `soulmon-is-sleeping` | O pet está dormindo (a cama é DESTE aparelho). | `App.tsx` |
| `FOOD_FEED_TIMES` | `soulmon-food-feed-times` | ⚰️ **LEGADO.** Nada escreve nela. Lida uma vez no load e **apagada** pela migração dos tetos. | `GameStateContext.tsx` (só migração) |
| `RUB_HEAL_DAY` | `soulmon-rub-heal-day` | ⚰️ **LEGADO**, idem. | `GameStateContext.tsx` (só migração) |
| `DAILY_REPORT_SHOWN` | `soulmon-daily-report-shown` | Dia em que o relatório diário já foi exibido (1×/dia). | `App.tsx` |
| `RUB_HINT_SHOWN` | `soulmon-rub-hint-shown` | A dica de esfregar já apareceu. | `CompanionHUD.tsx` |
| `AUTO_SLEEP_ENABLED` · `AUTO_SLEEP_START` · `AUTO_SLEEP_END` | `soulmon-auto-sleep-*` | O sono automático opcional e a janela dele. | `App.tsx`, `SettingsPage.tsx` |
| `DUNGEON_DIFFICULTY` | `soulmon-dungeon-difficulty` | `{week, level}` — a base semanal da masmorra. Semana nova zera. | `dungeon.ts` |
| `DUNGEON_BEST` | `soulmon-dungeon-best` | Melhor placar da masmorra. | `dungeon.ts` |
| `DUNGEON_HEART_DROPS` | `soulmon-dungeon-heart-drops` | `{date, count}` — o teto diário de coraçãozinho dropado (`HEART_DROP_DAILY_CAP`). | `dungeon.ts` |
| `DINO_BEST` | `soulmon-dino-best` | Melhor placar do Dino. | `DinoGame.tsx`, `App.tsx` |
| `PICROSS_DAILY_PAID` | `soulmon-picross-daily-paid` | **Nova em 30/09/2026.** Dia do jogador (ISO, `playerDayIso`) em que o bônus do Picross do dia já foi pago NESTE aparelho. Só do aparelho: não entra no save. | `src/components/mente/PicrossGame.tsx` |
| `SOUND_MUTED` | `soulmon-sound-muted` | Mudo global. **Sem a chave, `readFlag` devolve `false` e o som NASCE LIGADO** — coerente para SFX, que só saem por gesto. | `sounds.ts`, `telemetry.ts`, `EvolutionPath.tsx` |
| `SOUND_CATEGORY_VOLUMES` | `soulmon-sound-category-volumes` | Volume por categoria (0..1, JSON). Chave NOVA: `SOUND_MUTED` não foi renomeada, só se ACRESCENTA. | `audioBus.ts` |
| `SOUND_TRACK_ENABLED` | `soulmon-sound-track-enabled` | Trilha ligada. **Polaridade invertida de propósito**: a chave guarda LIGADA, então sem ela `readFlag` devolve `false` e a trilha nasce DESLIGADA — pendurar trilha no mudo global seria autoplay, que a D11 veta. | `audioBus.ts` |
| `TERMS_NOTICE_SEEN` | `soulmon-terms-notice-seen` | Versão dos termos/política cujo banner de atualização já foi visto (decisão #24, 21/09/2026). Sem ela, quem aceitou versão anterior vê o banner uma vez. | `termsNotice.ts`, `App.tsx` |
| `ACCOUNT_DELETED_NOTICE` | `soulmon-account-deleted-notice` | A frase do portão depois de um 410 `account-deleted` (§3.3). Escrita por `reagirContaExcluida`/`gravarAvisoContaExcluida` (com a data desde `592e2c14`), **lida e apagada uma vez** pelo inicializador de estado do `SoulmonOnboarding` — não reaparece na abertura seguinte. Desde `a6c1cd8a`. | `cloudSave.ts`, `SoulmonOnboarding.tsx` |
| `TERMS_NOTICE_SHOWN` | `soulmon-terms-notice-shown` | A `marcaAvisoTermos(...)` da versão cuja PRIMEIRA exibição do banner já aconteceu — distinta de `TERMS_NOTICE_SEEN` (dispensado): é o que põe o banner em posição 1 da fila de avisos da Home só na primeira vez (`App.tsx` › `termsNoticePrimeiraVez`). Desde `592e2c14` (QA Rodada 2 A3). | `App.tsx` |
| `GUILD_LAST_STAGE` | `soulmon-guild-last-stage` | O que ESTE aparelho já viu do Bosque (`GroveLocal`: `gid`, último estágio reconhecido, datas dos marcos, marco pendente, cenários já entregues). Estado de UI, **nunca de jogo**; o ponteiro da guilda é do servidor (`guildNoSave.contract.test.ts`). | `groveLocal.ts`, `useGroveWatch.ts`, `GuildSheet.tsx` |
| `GUILD_CLAIMED` | `soulmon-guild-claimed` | Os RECIBOS opacos dos resgates da Feira que este aparelho já creditou (impedem o segundo crédito de Emblemas se o KV devolver 200 duas vezes). Só recibos: sem nome, guilda ou quantia. | `guildClaimLocal.ts`, `GuildSheet.tsx` |
| `FOCO_TIMER` | `soulmon-foco-timer` | O timer da Oficina do Foco em curso (modo, fase, `endAt`). Só do aparelho, fora do save. |
| `FOCO_SESSIONS` | `soulmon-foco-sessions` | Os "foquei" dos últimos 14 dias (contagem + minutos por dia). Aparelho, fora do save. |
| `CADERNO` | `soulmon-caderno` | **Legada** (1ª versão do Caderno, só aparelho): lida UMA vez para migrar as anotações para `GameState.caderno` e apagada em seguida. |
| `NPC_FALA_VISTA` | `soulmon-npc-fala-vista` | Lista (JSON, até 64) de `area:lote` cujo NPC já digitou a fala uma vez neste aparelho (rodada 7 · J2): depois a fala aparece inteira. Conveniência de aparelho, fora do save. | `NpcSpeech.tsx` |
| `FOCO_VIBRATE` | `soulmon-foco-vibrate` | A vibração ao fim do foco; ligada por padrão (só `'false'` desliga). Aparelho. |
| `FCM_TOKEN` | `soulmon-fcm-token` | O token FCM deste aparelho. | `notifications.ts` |
| `LAST_CLOUD_SYNC` | `soulmon-last-cloud-sync` | ISO do último save confirmado PELO SERVIDOR. | `cloudSave.ts`, `SettingsPage.tsx` |
| `ORACLE_FORM` | `soulmon-oracle-form` | Estado do formulário da página do Oráculo (ferramenta de criação). | `OraclePage.tsx` |
| `ORACLE_DRAFT` | `soulmon-oracle-draft` | Rascunho do ritual: fechar o app no item 15 de 20 não perde as respostas. Apagado na geração, no `finish()` e no muro de idade. **Nunca guarda e-mail, consentimento, idade nem o resultado.** | `oracleDraft.ts` |
| `GATE_DRAFT` | `soulmon-gate-draft` | Rascunho do trecho ANTES da escolha grátis/completo. | `gateDraft.ts` |
| `SOULMON_PROFILE` | `soulmon-profile` | O perfil da alma gerado no onboarding (input + seed). **Mora só neste aparelho e NÃO vai à nuvem** — é por isso que `soulmonSkills`/`soulmonClassTitles` são cacheados no save. Contém nome, data, hora e local de nascimento. | `SoulmonOnboarding.tsx`, `PetPage.tsx`, `App.tsx`, `GameStateContext.tsx` (só o fuso, via `onboardingTimeZone`) |
| `TUTORIAL_COMPLETE` | `soulmon-tutorial-complete` | O segundo onboarding (tutorial + 1ª tarefa) terminou. | `App.tsx` |
| `PENDING_LOGIN_EMAIL` | `soulmon-pending-login-email` | O e-mail entre o envio do link de login e o retorno (o Firebase exige reconfirmar). | `auth.ts` |
| `SLEEP_STARTED_AT` | `soulmon-sleep-started-at` | ISO de quando o pet deitou — a "outra ponta" da noite, lida ao acordar para `recordNight` gravar deitar E acordar. | `App.tsx` |
| `MORNING_DREAM_SHOWN` | `soulmon-morning-dream-shown` | Dia da última manhã em que o sonho foi mostrado. Um por manhã: o feedback de sono é SÓ de manhã e SÓ uma vez. | `App.tsx` |

Fora da tabela, de propósito (moram no próprio módulo, como `K_QUEUE`): as duas
filas da telemetria em `src/utils/telemetry.ts` — `soulmon-telemetry-queue`
(`K_QUEUE`, teto `MAX_QUEUE`) e, desde `a6c1cd8a`, **`soulmon-telemetry-hidden`**
(`K_HIDDEN`, teto `MAX_HIDDEN = 50`): o que `track` gerou com a aba OCULTA,
com o dia carimbado na hora, à espera de `drainHiddenTelemetry` quando a aba
volta. ⚰️ Até `f4086ce0` o evento em aba oculta era descartado — e o `day_active`
da virada (timer de 30 s que não para em segundo plano) morria à meia-noite.
As duas são apagadas juntas por `setTelemetryEnabled(false)`.

⚰️ **`soulmon-demo-tasks-created-today` foi aposentada em 26/08/2026** — era o
contador do cap DIÁRIO de criação no demo, que virou teto TOTAL
(`DEMO_ACTIVITY_TOTAL_CAP`). A declaração saiu; o valor continua no
`localStorage` de quem usou o app. Está registrada no próprio `storageKeys.ts`
para ninguém reaproveitar o nome e herdar um número velho como se fosse novo.

### 4.2 `RECONCILE_KEYS`

Tabela própria de propósito: não são preferência nem estado de jogo, são o rastro
forense de UMA migração de identidade. Nada as lê no caminho normal do app.

| Chave | Valor | O que guarda |
|---|---|---|
| `PREVIOUS_SAVE_ID` | `soulmon-previous-save-id` | O id que o aparelho usava antes da re-derivação. Só diagnóstico. |
| `CONFLICT_BACKUP` | `soulmon-reconcile-backup` | `{saveId, salvoEm, state}` — a cópia do progresso local descartado quando a nuvem ganhou o conflito. Desde `592e2c14` também `{ …, motivo: 'account-deleted' }` — o estado local que o 410 apaga (`reagirContaExcluida`), gravado ANTES do remove; um caminho novo sobrescreve o backup do outro (chave única). |

⚠️ **O VALOR de cada string é contrato com o aparelho do jogador.** Renomear
`CONFLICT_BACKUP` não apaga o backup: torna-o inalcançável para sempre, sem erro
nenhum para avisar. `storageKeys.reconcile.test.ts` trava os dois como literais.

### 4.3 `safeStorage.ts` — a única porta

| Função | O que faz |
|---|---|
| `readLocal` / `writeLocal` / `removeLocal` | `localStorage` com `try/catch`. `writeLocal` devolve `boolean` (falhou = `false`, nunca lança) e aceita `{ silent: true }` para não avisar o usuário. |
| `readJson<T>` / `writeJson` | Idem, com `JSON.parse`/`stringify` e fallback tipado. |
| `readFlag` / `writeFlag` / `readFlagState` / `readNumber` | Açúcar. `readFlagState` distingue `'on' \| 'off' \| 'absent' \| 'unknown'` — ausência ≠ falha de leitura. |
| `onStorageDegraded` / `storageDegradedMessage` / `resetStorageNotice` | O canal do aviso ÚNICO por sessão (`read` \| `write` \| `quota`), com par PT/EN. O `GameStateProvider` o assina e emite um `toast.warning`. |

---

## 5. Migrações

### 5.1 Chaves legadas (`migrateLegacyStorageKeys`)

Roda em `src/main.tsx` **antes dos providers**, porque `GameStateProvider` lê o
save no inicializador do próprio estado. Três decisões, todas sobre não destruir
nada:

- **copia, não move** — o valor `digiapp-*` fica no `localStorage`; se a migração
  tiver defeito, o original está lá para recuperar à mão;
- **nunca sobrescreve** — se a chave nova já tem valor, ela ganha;
- **falha em silêncio** — `localStorage` lança em aba privada e em modo estrito;
  uma migração que derruba o boot é infinitamente pior que uma que não acontece.

O mapeamento é `soulmon-x` → `digiapp-x`, com a exceção de `soulmon_state_v1` →
`digiapp_state_v3`. Passa por `safeStorage` (há guard exigindo). Ela é
**temporária por natureza** — existe só pelo save do dono, e pode ser apagada
quando ele confirmar que abriu o app depois desta versão.

⚠️ `public/sw.js` continua varrendo os DOIS prefixos na limpeza de cache; tirar o
antigo deixaria lixo permanente na origem.

### 5.2 `equippedFurniture` → `equippedDecor`

`migrateDecor(loaded)` em `src/contexts/GameStateContext.tsx`. Roda uma vez, no
load, e o campo antigo é forçado a `undefined` logo em seguida (senão ele fica no
save para sempre e a migração reaparece).

A checagem é pela **PRESENÇA** de `equippedDecor`, não por ele estar cheio: um
mapa vazio é uma decisão do jogador ("desequipei tudo"), não ausência de
migração. Confundir os dois foi bug real — quem tinha save antigo desequipava o
item, recarregava e ele voltava sozinho. Guard: `src/contexts/migrateDecor.test.ts`.

O retorno de `migrateDecor` ainda passa por `hydrateDecor`, porque ele devolve
`loaded.equippedDecor` **cru** quando existe — um array ou um número passaria.

### 5.3 Tetos de cuidado (`careCaps`)

`mergeCareCaps(loadedState.careCaps, { feedTimes, rubHeal }, Date.now())` funde o
que sobrou no `localStorage` deste aparelho com o que já está no save, e em
seguida `removeLocal` apaga as duas chaves legadas.

É **idempotente** por construção (união de `feedTimes`, `max` de
`rubHeal.healed`), porque roda no save local **e de novo** quando a nuvem é
adotada — é isso que permite apagar as chaves antigas sem criar ponto de não
retorno.

O `now` da higienização é o relógio DESTE aparelho no instante do load:
timestamp de comida **no futuro** (relógio adiantado do outro aparelho, que agora
viaja no save) some na fusão, senão travaria a comida por horas (achado X-5).

⚠️ `src/utils/careCaps.ts` **não redeclara nenhuma constante de teto** e não
reimplementa a janela de 1 h — as REGRAS seguem em `src/utils/careRules.ts`. Há
teste travando isso.

### 5.5 Ids de caminho renomeados (29/09/2026)

`src/utils/branchMigration.ts` › `migrateBranchIds` (PURA, idempotente, devolve a MESMA referência sem nada antigo) reescreve, no `hydrateSave` do local e da nuvem, em `adoptCloudSave` e no desktop (`fetchRemoteSnapshot`/`normalizeForRules`): `evolutionStage`, `currentBranch`, `unlockedEvolutions` (**deduplicada** desde `fd8c4f6a`/B1), `soulmonStages[].id`, chaves de `spriteLibrary`/incubação, os três `*Points` (`virusPoints`→`powerPoints`, `dataPoints`→`harmonyPoints`, `vaccinePoints`→`benevolencePoints`), `attributesSinceLastEvolution`, os emojis dos chips na `foodInventory` (🦠/💾/💉 → 👊/🎶/🤲), `playLog.buff.attribute`, `rebirth` e relatórios. O servidor não migra as chaves KV: `_branchLegacy.js` só LÊ o id antigo (cache `sprite:img:<saveId>:<formId>` e contador `ent.aiForms.<formId>`), e escreve só o novo. Régua: `branchMigration.test.ts`, `branchRename.contract.test.ts`, `functions/api/branchLegacy.parity.test.js`.

### 5.4 Id de espécie legado

⚰️ **A migração de id de espécie de outra franquia foi apagada em 07/09/2026.**
Os três ids de linha também ERAM nomes de franquia, então o migrador traduzia um
nome proibido em outro. Hoje as linhas são `ignar`/`lumel`/`serah`
(`DUNGEON_LINE_SPRITES` em `src/utils/sprites.ts`), e um id que a arte não
conheça cai em `fallbackSpriteForStage`, que responde com arte NOSSA por hash do
id — determinístico: o mesmo save renderiza sempre a mesma criatura.

---

## 6. O dia do jogador

**Dono:** `src/utils/playerDay.ts` (`playerDayKey`, `playerDayIso`, `resolvePlayerDayAnchor`,
`sanitizePlayerDayAnchor`, `anchorOffsetMs`, `deviceOffsetMs`).

**O problema:** `new Date().toDateString()` é o dia do **APARELHO**. Enquanto os
registros diários moravam no `localStorage`, isso era correto por construção — o
registro e o relógio eram do mesmo aparelho. Quando eles foram para o SAVE, que é
sincronizado, a premissa morreu: dois aparelhos em fusos diferentes discordam do
NOME do dia por `|offsetA − offsetB|` horas TODO DIA (Brasil↔Tóquio: 12 h;
Brasil↔Portugal: 4 h).

**A solução:** um fuso FIXO gravado no save (`playerDayTz`), resolvido UMA vez no
load pela ordem: (1) a âncora que **já está no save VENCE**; (2) o fuso IANA da
cidade de nascimento declarada no onboarding (que sabe de horário de verão); (3)
o offset DESTE aparelho, congelado.

**O formato** é uma string com a MESMA FORMA de `toDateString()` ("Wed Aug 26
2026") — o que torna a migração **invisível** para quem está no fuso de casa (a
string sai idêntica à já gravada) e mantém `Date.parse` funcionando.

**Segunda forma, desde 30/09/2026:** `playerDayIso(now, anchor)` devolve o MESMO dia do jogador em ISO (`YYYY-MM-DD`), para quem faz CONTA de dias (a Revisão da Malha soma intervalos; o convite ao Refúgio e o Picross do dia gravam essa forma). Mesma âncora e mesmo fallback (sem âncora = dia local do aparelho): as duas formas nunca discordam de QUE dia é, só de como ele se escreve. Régua: `src/utils/playerDayIso.test.ts`.

### 6.1 As sete famílias de consumidores

| Registro | Símbolo | Módulo |
|---|---|---|
| teto diário de **carinho** | `careCaps.rubHeal` (via `rubDecision`) | `src/utils/careUpdaters.ts`, `careCaps.ts` |
| **check-in** | `lastCheckInDate` | `src/App.tsx` (escrita) e `needsCheckIn` em `src/utils/rituals.ts` |
| **humor** | `moodLog[].date` | `recordMood`/`moodFor`, `src/utils/mood.ts` |
| **cocô** | `poopDrainCharge.day` | `applyPoopDrain`/`cleanPoop`, `src/utils/poopDrain.ts` |
| **brincar** | `playLog.date` | `src/utils/petNeeds.ts` + a IIFE do `PlayCard` no `src/App.tsx` |
| **a manhã** | `rest.nights[].date` / `restConstancy` | `recordNight`, `src/utils/restWindow.ts` |
| **o pesadelo** | `nightmares.fought[]` | `src/utils/nightmares.ts` |

Todas passam por `playerDayKey(now, playerDayTz)` — é esse o `grep` que acha a
família inteira. A régua VIVA da lista é
`src/utils/playerDay.contract.test.ts`, um guard de AST que pergunta, no ponto de
uso, quem produz a chave de dia.

### 6.2 Duas coisas que este arquivo deliberadamente NÃO faz

- **Não toca em `dayKeyOf`** (`src/utils/habitRhythm.ts`). Aquela é a chave do
  motor de hábitos, de `perfectDays`, da streak e do gatilho de virada.
  Redefini-la mudaria o significado de strings JÁ GRAVADAS em todo save e
  dispararia uma virada espúria em cada um. Há guard de fiação no AST.
- **Não usa UTC puro.** Em fuso negativo o dia UTC vira à tarde: para um
  brasileiro em UTC−3 o teto de carinho zeraria às 21 h.

### 6.3 A comida NÃO entra

`careCaps.feedTimes` é uma janela **DESLIZANTE** de timestamps
(`FOOD_LIMIT_PER_HOUR`, `src/utils/careRules.ts`), não um registro diário. Um
instante em ms é o mesmo instante nos dois aparelhos — não tem nome de dia para
discordar.

### 6.4 A `rest` leva a âncora DENTRO dela

`recordNight`, `restConstancy` e `src/utils/nightmares.ts` leem
`rest.playerDayTz` **do estado**, nunca por parâmetro. `hydrateRest` recebe a
MESMA referência de âncora que o `GameState` — duas âncoras resolvidas em pontos
diferentes do load poderiam divergir (basta o relógio virar entre as duas linhas)
e passariam a nomear a mesma noite de dois jeitos. Há guard de AST travando essa
linha.

---

## 7. O `saveId`, e as três implementações

**A regra:** `SHA-256("soulmon:" + e-mail.trim().toLowerCase())`, hex, cortado em
**32 caracteres**. O corte não é estético: sem ele o hash tem 64 caracteres, a
comparação do servidor nunca casa e **todo usuário autenticado toma 403**. O
formato tem de passar no `VALID_ID` do servidor: `/^[a-zA-Z0-9_-]{8,64}$/`.

**O salt namespeia o produto.** Com `digiapp:` o mesmo e-mail hasheava para a
MESMA chave nos dois produtos; `soulmon:` faz os dois derivarem chaves diferentes
mesmo enquanto o armazenamento cru é compartilhado.

| # | Implementação | Árvore | Ciclo de deploy |
|---|---|---|---|
| 1 | `emailToSaveId` em `src/utils/cloudSave.ts` | app web/PWA/APK | Cloudflare Pages, no push da `main` |
| 2 | `emailToSaveId` em `desktop/renderer/src/cloudSync.ts` | overlay Electron | tag `v[0-9]+.[0-9]+.[0-9]+` |
| 3 | `emailToSaveId` em `functions/api/_auth.js` | servidor | Pages Functions, no mesmo push |

**Divergir não dá erro nenhum**: o overlay lê um save inexistente e mostra um
bicho genérico; a do servidor devolve **403 para todo usuário autenticado**. Já
aconteceu — o código do desktop veio do fork com o salt `digiapp:`.

**Réguas** (comportamentais, não de texto): `functions/api/saveId.parity.test.js`
(as três) e `desktop/renderer/src/cloudSync.test.ts` (duas).

⚠️ Quem nunca logou tem `SAVE_ID = crypto.randomUUID()`, que **passa** no
`VALID_ID`. No dia em que o servidor exigir a derivação (`enforced: true`), esse
UUID vira 403 — e **re-login não conserta**, porque o erro está no `SAVE_ID`
gravado no aparelho. Quem conserta é `reconcileSaveId` (§3.4).

---

## 8. O que existe no servidor

### 8.1 KV de saves — `kv(env)` em `functions/api/_kv.js`

**Nunca leia `env.*_SAVES` direto** — há teste varrendo `functions/api/`
(`_kv.fiacao.test.js`). O acessor prefere `SOULMON_SAVES` e cai em
`DIGIAPP_SAVES`; `kvOrThrow(env)` é o mesmo namespace já estreitado, para uso
depois da guarda.

⚠️ **Estado em 09/09/2026:** desde 07/09/2026 o `wrangler.jsonc` declara
`SOULMON_SAVES` apontando para um namespace **próprio e vazio** (decisão do dono:
separar sem migrar, já que ninguém usou o app em produção), e `DIGIAPP_SAVES`
fica declarado só como rede para o dado herdado continuar alcançável por
`wrangler kv key get`. Como `_kv.js` prefere o primeiro, é ele que vale. O painel
do Pages tem a própria lista de bindings, e é ela que vale em produção.

**Inventário canônico — 25 famílias de chave em dois namespaces** (reescrito em
22/09/2026 a partir de [`reviews/2026-09-22-qa-rodada-2/04-dados-r2.md`](../reviews/2026-09-22-qa-rodada-2/04-dados-r2.md)
§1; comando-base: `grep -nE "'[a-zA-Z_]+:'|\`[a-zA-Z_]+:" functions/api/*.js workers/*.js | grep -v test`
+ `grep -nE "\.(put|get|getWithMetadata|delete|list)\(" functions/api/*.js workers/*.js | grep -v test`).
⚰️ A versão anterior desta tabela documentava **11** famílias, com TTL "—" em `profile:`/`pid:`/
`rank:`/`gifts:` onde o código tem 365/400/120/60 d, `sprite:blob:` sem o prefixo e `ord:`
descrito como KV quando em produção (binding `DB` presente) o vínculo mora no D1.

Coluna **Excl.** = o que `functions/api/account.js` › `handleDeleteConfirm` faz com a chave
quando a conta é apagada. As marcas "em curso 22/09" desta tabela **aterrissaram em `592e2c14`**
(22/09/2026, QA Rodada 2) e viraram fato datado nas linhas 7, 8, 11, 12, 13, 15, 23 e 25 abaixo.

**Namespace de saves** (`kv(env)` → `SOULMON_SAVES`):

| # | Chave | Conteúdo | Escreve | TTL (constante) | Excl. |
|---|---|---|---|---|---|
| 1 | `<saveId>` | O `GameState` serializado (sem `accountTier`/`credits`), com `metadata: { t, f? }` (`f` = a 1ª gravação em ms, `firstSeenMeta`; o servidor do duelo a usa no teto S1 de 1 level por dia, `maxLevelFor`; sem `f` vale o level 1 até a próxima gravação, que o escreve; PR13). **Três leitores do formato cru**: `save.js`, `_bond.js` (gate de PvP lê `totalXP`) e `account.js › collect` — importa para a ADR-004 (envelope quebraria os dois últimos). | `save.js` POST (e GET renova); **desktop** via `cloudSync.ts › pushCareAction` | `SAVE_TTL_SECONDS` = 365 d, renovado (`RENEW_AFTER_SECONDS` = 30 d — no máximo uma escrita extra por mês) | apaga (passo 8) |
| 2 | `ent:<saveId>` | O entitlement: `tier`, `credits`, `consumedOrders[]`, `orderDetails[]`, `auditedAt`, `aiLifetime{}`, `aiForms{}`, `adDate`, `adCount`, `updatedAt` e, desde 22/09/2026, **`rebirthSpriteResetAt`** (epoch ms — a marca de que o RENASCIMENTO já zerou `aiLifetime.sprite`; decisão do dono **#62**, `REBIRTH_SPRITE_RESET_FIELD` em `_entitlements.js`). Ela existe para o reset ser **uma vez por conta**, do mesmo jeito que o renascimento é um por save: sem ela, quem descobrisse a rota teria geração de sprite infinita (o teto vitalício é 26, a ~R$ 0,10 cada). ⚠️ `aiForms` **não** é zerado no renascimento — é teto por FORMA, e as formas de depois são outras. | `_entitlements.js › writeEntitlement` (**só** ele) | `RETENTION_TTL_SECONDS` = 5 anos, renovado em toda escrita | **minimiza** (passo 6); o TTL corre até o fim (política §8) |
| 3 | `ord:<orderId>` | O `saveId` que reivindicou o comprovante ("um recibo, uma conta"). **Só existe na KV quando `env.DB` está ausente**; em produção o binding `DB` existe e o vínculo mora em D1 `order_claims` (§8.3) — ⚠️ `plan().sobrevive` e `NOT_INCLUDED` ainda o citam como KV e a exportação não lista a linha D1. | `claimOrder` (sem `DB`) | 5 anos, renovado por reivindicação do mesmo dono | sobrevive (declarado) |
| 4 | `ord:steam:own:<appid>:<steamid>` | O mesmo vínculo para licença de posse Steam. **O `orderId` É a chave**: `steam:own:<appid>:<steamid>` carrega um **SteamID64, identificador de TERCEIRO**. ⚰️ **Sobrevivia 5 anos até 22/09/2026**, sob a justificativa fiscal da política §8 — que **não se aplica a licença de posse** (não há transação nossa). Decisão do dono **#54**: **APAGAR na exclusão**, privacidade vence a trava "um Steam, uma conta" (preço: quem apagou reativa a mesma licença numa conta nova). A chave é **derivada** de `ent:<saveId>.consumedOrders` (`account.js › steamLicenseKeysOf`), sem varredura, e a mesma string sai de `consumedOrders`/`orderDetails` no passo 6 — apagar só a chave reteria o SteamID pela porta de trás. Guard: `account.steamLicense.qa2.test.js`. | `_billing.js › verifySteamOwnership` → `claimOrder` | 5 anos (enquanto a conta viver) | **apaga (passo 5b)** |
| 5 | `spend:<saveId>:<opId>` | Idempotência do gasto de créditos; o valor é o entitlement inteiro. | `spendCredits` | `SPEND_TTL_SECONDS` = 24 h | não (expira) |
| 6 | `courtesy:count` | Contador global de contas de cortesia (`grantCourtesy`, teto `COURTESY_MAX_ACCOUNTS`, padrão 25). RMW sem CAS — o teto pode passar por corrida; irrelevante no volume. | `grantCourtesy` | 5 anos | global |
| 7 | `profile:<saveId>` | Perfil público (nome, pet, formas, pvp, `friends[]` = saveIds de até 5 terceiros). | `community.js › putProfile`; `account.js` (scrub de `friends`) | **365 d** (`putProfile`) | apaga (passo 7) — ⚠️ `pushProfile` do cliente o **recriava** no mesmo tick que recebia o 410 (`04` §0): fechado em `592e2c14` — `community.js` herda o 410 de `authorizeSaveAccess` (`gateTombstone`) e o `GameStateContext` só publica o perfil DEPOIS de `cloudSaveComRetry` ok (`publicarPerfil`) |
| 8 | `pid:<pid>` | Índice reverso identidade pública → `saveId`. Nenhuma resposta pública devolve `saveId` (teste `community.test.js`) — ⚠️ exceto `handleExport`, que devolvia `profile.friends`/`state.friends` crus: fechado em `592e2c14` (`pidDeAmigo`/`amigosComoPids` — só leitura; amigo sem pid aleatório é omitido, nunca o hash derivado; `account.coopExport.qa2.test.js`). | `community.js › indexPublicId` | **400 d** (sobrevive 35 d ao perfil apontando para nada — inofensivo, `getProfile` devolve null) | apaga |
| 9 | `rank:<season>:<saveId>` | Pontos de rank da season (`YYYY-MM`). Desde 30/09/2026 carrega também `pending` (`{ opp, oppSave, seed, at }`) — o **duelo aberto** do Torneio: a semente é sorteada no servidor em `duelStart` e guardada aqui; `match` a usa e zera; duelo que não fechou é derrota (`forfeitPending`, prazo `DUEL_PENDING_MS`). `pending` guarda o `oppSave`, por isso some junto com a chave na exclusão. | `community.js` (`duelStart`/`match`), regra em `_duel.js` | **120 d** | apaga |
| 10 | `gifts:<saveId>` | Bits pendentes de presente. | `community.js` | **60 d** | apaga |
| 11 | `closed:<season>` | Marca "esta season já foi premiada" (`closedKey`, `{ at, awarded }`). | `community.js` (fechamento de season) | **`CLOSED_SEASON_TTL` = 400 d** (desde `592e2c14`; ⚰️ sem TTL — era a única chave imortal por acidente, uma por mês; só precisa sobreviver ao retry do cron e a `rank:<season>:*`, 120 d) | global |
| 12 | `coop:<gid>` | O grupo cooperativo: `members[]` = saveIds, código, meta (`target = members.length × COOP_CHECKINS_POR_MEMBRO`). ⚠️ **Fora da exclusão até `592e2c14`**: membro apagado virava fantasma e o grupo nunca mais batia a meta. Desde `592e2c14` o estado mora em **`_coop.js`** (chaves, `COOP_*`, `gravarGrupo` renova os DOIS índices, `coopLeave`) e a exclusão chama `coopLeave` no passo 3b (`plan().apaga` lista `coop:<gid>` como "sua vaga no grupo"). | `_coop.js › gravarGrupo` (via `community.js`) | `COOP_TTL` = 120 d | sai do `members[]` (passo 3b, desde `592e2c14`; grupo vazio some com o código) |
| 13 | `coopOf:<saveId>` | Grupo do titular (chave COM o saveId). | `_coop.js › gravarGrupo` (renovada a cada gravação do grupo desde `592e2c14` — ⚰️ escrita UMA vez na entrada, evaporava aos 120 d com o grupo vivo) | 120 d | apaga (passo 3b, desde `592e2c14`) |
| 14 | `coopCode:<code>` | Código de convite → `gid`. | `gravarGrupo` | 120 d | global |
| 15 | `coopCk:<gid>:<saveId>` | Dias de presença do titular no grupo (`{ weekKey, days }`). | `_coop.js › gravarCheckins` | 120 d | apaga (passo 3b, desde `592e2c14`) |
| 15-A | `coopFio:<gid>:<saveId>` | O fio do titular na guilda (`{ lastDay, distinctDays, days[] (até 60), herdou? }`). Só o dono escreve. | `_coop.js › gravarFio` | 120 d — **sem TTL com Bosque plantado** (`prazoDoGrupo`, G17a) | apaga (na saída e na exclusão); a exportação traz só a do titular |
| 15-B | `coopGest:<gid>:<saveId>` | Os gestos que o titular mandou hoje (`{ day, kinds[] }`). | `guildGesture` | 3 d | apaga |
| 15-C | `coopHit:<gid>:<week>:<saveId>` | Os golpes do titular na Feira da semana (`{ week, days[], dmg }`) — o dano NUNCA sai do servidor. | `guildRaidHit` | `COOP_HIT_TTL` = 21 d | apaga em **toda** saída (M5) e na exclusão; a exportação traz só os próprios dias da semana |
| 15-D | `coopRaidOk:<gid>:<week>` | A marca de semana vencida (`{ at, hp, members }`) — uma vez gravada, a Feira dessa semana fica dissipada PARA SEMPRE. | `resolverFeira` (na LEITURA, valor constante e idempotente) | `COOP_RAIDOK_TTL` = 60 d | global (da guilda) |
| 15-E | `coopClaim:<saveId>:<week>` | O resgate registrado (`{ at, kind, emblems, selo, receipt, trophy? }`); o 409 o devolve. | `guildClaim` | `COOP_CLAIM_TTL` = 60 d | apaga (`apagarClaims`); exportação traz as semanas |
| 15-F | `coopPart:<saveId>:<week>` | A participação do titular na Feira (`{ gid, day }`): é onde mora o DIREITO ao resgate, que sobrevive à saída (A-1). | `marcarParticipacao` | 60 d | apaga (`apagarClaims`) |
| 15-G | `coopDias:<saveId>` | Os dias distintos de fio que o titular carrega de guildas anteriores (`{ n, days[] }`) — o relógio dos 7 dias do cenário não recomeça (M-2). | `guardarDiasDistintos` (na saída) | **sem TTL** (é progresso) | apaga (`apagarClaims`) |
| 15-H | `coopMem:<gid>:<saveId>` | O CARTÃO do membro: resumo DERIVADO das chaves dele (`coopCk`, `coopFio`, `coopGest`, `coopHit`, nome) que a vista lê — 1 GET por membro em vez de ~9 (A3). Reconstruído só pelo próprio membro a cada ação. | `renovarCartao` | `COOP_TTL` | apaga |
| 15-I | `coopShell:<saveId>` | O conjunto de semanas de Feira dissipada JÁ resgatadas (`{ ids[] }`) — conta a Concha da Maré (a cada 4). | `unirConjunto` (em `guildClaim`) | **sem TTL** (é conquista) | apaga (exclusão, `apagarClaims`); **nunca na saída** (é conquista) |
| 15-J | `coopScenes:<saveId>` | Os cenários `bg-guild-*` já liberados (`{ ids[] }`) — ficam com quem sai (G12). | `unirConjunto` (em `guildRewards`) | **sem TTL** | apaga (exclusão, `apagarClaims`); **nunca na saída** (é conquista) |
| 16 | `m:<YYYY-MM-DD>` | **Agregado diário** de telemetria — contadores somados de todo mundo; não há chave por usuário nem lista de eventos. | `metrics.js` POST | 730 d | global |
| 17 | `ai:<bucket>:<saveId>:<dia>` | Reserva/consumo do teto diário de IA por conta (`_aiGuard.js › reserve/release`; fail-closed — `put` falho = 503). Desde 22/09 a cota de `chat` é por tier (demo 30 / paid 120, provisório #55). | `_aiGuard.js` | `TTL_SECONDS` = 30 h | não (expira) |
| 18 | `ai:<bucket>:@all:<dia\|mês>` | O mesmo, global (teto de conta inteira e mensal). | `_aiGuard.js` | 30 h / 40 d | global |
| 18-A | `ai:sprite:@admin:<mês UTC>` | **Sub-teto mensal do admin para sprite** (29/09/2026): `ADMIN_SPRITE_MONTHLY_CAP` = 40, contador SEM PII (nem e-mail, nem saveId), TTL de mês. Estouro = 503 `ai-monthly-budget-reached`, igual ao teto global. Não é uma família nova de dado de jogador (mesmo namespace, mesmo `_aiGuard.js`); o total continua declarado como 25 famílias + esta variante. | `_aiGuard.js` (lê `ADMIN_SPRITE_MONTHLY_CAP` de `_admin.js`) | ~mês | admin |
| 19 | `sprite:img:<saveId>:<formId>` | Cache do sprite gerado (`{ image, provider, at }`) — arte paga, **sem TTL de propósito**. | `generate-sprite.js` | — | apaga (desde `a6c1cd8a`, `collectSprites`) |
| 20 | `sprite:lock:<saveId>:<formId>` | Lock de geração. | `generate-sprite.js` | 120 s | apaga |
| 21 | `sprite:blob:<token>` | O binário republicado quando o provedor devolve `data:` — a chave é um **token de 32 hex**, não o `saveId` (derivável de um e-mail); o token só existe dentro da URL `image` do cache. Servido por `sprite-image.js` com `Cache-Control: immutable`. Blob órfão (cache falhou) declarado. | `guardarBlob` | — | apaga via cache (token da URL própria; `account.deleteConfirm.qa.test.js`) |
| 22 | `del:<saveId>` | O token de confirmação da exclusão (`delete-request` → `delete-confirm`). | `account.js › handleDeleteRequest` | `CONFIRM_TTL_SECONDS` = 15 min | apagado no fim do `delete-confirm` só se `falhou.length === 0` |
| 23 | `del:done:<saveId>` | **Lápide de conta apagada** (`{ at }`), gravada ANTES da primeira destruição. Desde `592e2c14` lida por **`_auth.js › authorizeSaveAccess`** (`gateTombstone`, DEPOIS da autorização) — logo por TODA rota que autoriza em nome do `saveId` (`save`, `community`, `generate-sprite`, `entitlements`, `billing`, `chat`/`suggest-tasks`, `subscribe`/`fcm-subscribe` com `saveId`) → **410 `account-deleted` + `deletedAt`**; ⚰️ até `a6c1cd8a` só `save.js` a lia (`community.js` recriava `profile:`/`pid:` 3 s depois). **Reabertura (`592e2c14`, provisório #56):** `auth_time` do JWT (segundos, o instante do LOGIN — não o `iat`) posterior a `at` = a pessoa voltou → `clearTombstone` e a chamada segue; sessão anterior à exclusão continua 410; sem `auth_time` (auth desligada) nunca reabre; lápide sem `at` vale `at: 0`. ⚰️ Bloqueava o **próprio titular** por 30 d (loop wipe + logout — FATAL da R2). Retém um hash derivado do e-mail por 30 d pós-exclusão: **declarado** em `NOT_INCLUDED` da exportação (`account.js`) e em `public/privacidade.html` desde `592e2c14` (⚰️ "não declarado", `01` 1.4). | `_accountTombstone.js › writeTombstone` (`clearTombstone` se a varredura de amigos estourar antes de destruir, ou na reabertura) | `TOMBSTONE_TTL_SECONDS` = 30 d | — (sai na reabertura) |

**Notas das chaves `coop*` (Guilda, 29/09/2026).** (1) O blob `coop:<gid>` ganhou
`bosqueProgress`, `progressDay`, `tideKey`/`tideBase`, `ornaments[]`, `fiosAvulsos`
(conjunto de ids OPACOS por dia — nunca contador, nunca saveId), `hostSave`, `desde{}` e
`prazoAte`; **com `bosqueProgress > 0` a guilda não expira** (G17a: `coop:`, `coopOf:`,
`coopCode:` e `coopFio:` perdem o TTL — o que a roda construiu não evapora por
inatividade), e sem Bosque plantado valem os 120 d. (2) **Nada disto está no save do
cliente**: o aparelho guarda só duas chaves de conveniência em `localStorage`
(`soulmon-guild-last-stage`, `soulmon-guild-claimed`, §4.1) e o que foi GANHO — cenários
`bg-guild-*`, Concha da Maré e Emblemas — entra no `GameState` pelos caminhos comuns
(`ownedBackgrounds`, `ownedFurniture`, `emblems`). (3) **Exclusão** (`handleDeleteConfirm`):
`coopLeave(..., { exclusao: true })` + `apagarClaims`; os fios ainda não fechados viram
contagem ANÔNIMA do Bosque (a obra nunca regride, LV-G3). **Exportação** (`action=export`):
`coop` traz `coopOf`, os próprios `coopCk`/`coopFio`, `grupo { id, name, joinedAs,
myDistinctDays, myLastThreadDay, myHitsThisWeek }` e `recompensas { claimedWeeks,
guildScenes, shellWeeks, raidWeeks, carriedThreadDays }` — nunca saveId nem nome de outro
membro, nunca dano. (4) O segredo `GUILD_MEMBER_SECRET` (só o NOME; mora em `wrangler secret`,
[08 §2.11-A](08-INTEGRACOES-E-DEPLOY.md)) entra no id opaco do membro (`idOpacoDoMembro`).

Teto do save: `MAX_STATE_BYTES` = `5 * 1024 * 1024` (o KV aceita 25 MB por
chave; 5 MB é ~50× o maior save real observado). Acima disso, **413**.

### 8.2 KV de push — `PUSH_SUBSCRIPTIONS`

Namespace separado, compartilhado pelos dois canais e lido pelo mesmo cron.

| # | Prefixo | Conteúdo | Escrito por | TTL | Excl. |
|---|---|---|---|---|---|
| 24 | `push:<hash do endpoint>` / `fcm:<…>` | `{ endpoint, keys: {p256dh, auth}, petName, bornAt?, language, saveId?, refreshedAt }` — Web Push (`saveId` desde `42b07bec`); `fcm:` = token de dispositivo Android com os mesmos campos de identidade. Lida por `workers/push-scheduler.js › drainPrefix`, que apaga a morta (404/410) **sem desindexar** — a entrada fica em `pushidx:` até o TTL; `lerIndice` pula entrada morta ("índice aponta, não prova"), sem efeito. | `subscribe.js` / `fcm-subscribe.js` via `gravarSeMudou` (`saveId` só com prova de posse desde `592e2c14` — `saveIdAutorizado`; sem prova, registro SEM `saveId`; lápide → 410) | `TTL_INSCRICAO` = 365 d | apaga pelo índice (`via:'index'`); `'index+scan'` quando o índice está cheio (≥ 16, desde `592e2c14`); fallback varredura sem índice |
| 25 | `pushidx:<saveId>` | **Índice inverso** (desde `a6c1cd8a`): `{ v: 1, keys: { 'push:<hash>': <epoch ms>, 'fcm:<hash>': … }, updatedAt }`. Teto `PUSHIDX_MAX = 16` (sai a mais velha). Escrito **mesmo quando o registro não mudou** (migração sem script). ⚠️ **Envenenável até `a6c1cd8a`**: 17 POSTs anônimos com o `saveId` da vítima expulsavam a inscrição real (também benigno: 16 reinstalações de PWA). Desde `592e2c14`: só o dono provado indexa (`authorizeSaveAccess` no `saveId` de `subscribe`/`fcm-subscribe`; não-ok → grava sem `saveId`) e **a inscrição expulsa pelo teto é apagada do KV junto** — INVARIANTE: toda inscrição viva com `saveId` está no índice (`subscribe.pushidx.qa2.test.js`). O cron continua sem tocar o índice. | `_pushIdentity.js › indexarInscricao` | 365 d, renovado a cada escrita | apaga |

O que as duas rotas compartilham (teto de 24 do apelido, lista fechada de idioma,
`bornAt` como `YYYY-MM-DD` sem hora e sem fuso, limite de taxa e a escrita-só-
quando-muda) mora em `functions/api/_pushIdentity.js` — `gravarSeMudou` só
reescreve quando o registro mudou **ou** quando passou de `REFRESCA_APOS_MS`, e
o `put` leva `expirationTtl: TTL_INSCRICAO`.

⚠️ **A idade da criatura morre junto com a subscription**: não existe registro
separado, e cancelar o push apaga o `bornAt` junto.

### 8.3 D1 — `order_claims`

Binding `DB`, banco `soulmon-billing` (`wrangler.jsonc`). Schema versionado em
`migrations/`:

```sql
-- 0001_order_claims.sql
CREATE TABLE IF NOT EXISTS order_claims (
  order_id   TEXT PRIMARY KEY,
  save_id    TEXT NOT NULL,
  claimed_at INTEGER NOT NULL
);
-- 0002_order_claims_expires_at.sql
ALTER TABLE order_claims ADD COLUMN expires_at INTEGER;
UPDATE order_claims SET expires_at = claimed_at + 157680000000 WHERE expires_at IS NULL;
```

`claimOrder` usa D1 quando `env.DB` existe (`claimOrderAtomic`: o `INSERT` **é** a
disputa, porque `order_id` é PRIMARY KEY) e cai no KV quando não existe — e o KV
é eventualmente consistente, então o mesmo comprovante pode valer para N contas.

Duas propriedades que o D1 replica do KV de propósito, para não haver duas
políticas para o mesmo dado: o prazo vira **coluna** (`expires_at`) e a limpeza é
**na leitura**, ANTES da disputa; e reivindicar pelo mesmo dono **renova** o
prazo (recibo em uso é recibo vivo), sem mexer em `claimed_at`. Linha legada com
`expires_at` NULL é prazo **desconhecido**, não vencido — o desempate é a favor de
manter.

Regras do diretório (`migrations/README.md`): ordem numérica, uma vez cada;
**migração aplicada não se edita** (escreve-se a próxima); e toda migração declara
no cabeçalho o que acontece com as linhas existentes.

---

## 9. Os dados das outras superfícies

### 9.1 Overlay Electron

**Namespace PRÓPRIO**: `STORAGE_KEY = 'soulmon_desktop_v1'`
(`desktop/renderer/src/config.ts`). Separado do save real de propósito — o que
mora ali é o que é DESTE APARELHO, e misturá-lo com o save corromperia o
progresso do celular sem chance de desfazer.

`DesktopState` (`desktop/renderer/src/state.ts`) tem duas metades declaradas:

- **espelho do save real** (cache de leitura, preenchido por
  `fetchRemoteSnapshot`): `stage`, `stageName`, `genericLine`, `demoCharacterId?`,
  `hearts`, `maxHearts`, `energy`, `maxEnergy`, `foodInventory`, `tasks[]`;
- **só do desktop**: `language`, `sleeping`, `sleepStartedAt`, e o restante do
  estado local da faixa.

A escrita de volta existe: `menu.ts` chama `pushCareAction` para carinho, comida,
tarefa, **banho e sono**, e quem decide cada uma é `desktop/renderer/src/care.ts`,
que **importa** `careRules`, `careUpdaters`, `careCaps`, `playerDay`,
`restWindow` e `poopDrain` de `src/utils/` — não são cópia. A fronteira de
cuidado é o `care.ts`, e não o `menu.ts`: este toca o DOM no topo e por isso
**nenhum teste em `node` consegue importá-lo**.

⚠️ **Comentário desatualizado encontrado em 09/09/2026:** o cabeçalho de
`desktop/renderer/src/cloudSync.ts` explica a cópia removida citando
`LEGACY_FORM_TIERS` como se ela existisse ("a `getStageLevel` do app cai em
`LEGACY_FORM_TIERS` quando o prefixo não casa"). A tabela foi **apagada em
07/09/2026** (`src/types/progression.ts` tem a lápide). O comportamento descrito
— o overlay importar `MAX_HP_BY_FORM`/`getStageLevel`/`getMaxEnergyForStage` em
vez de reimplementá-los — continua correto; só a justificativa envelheceu.

### 9.2 Widgets Android

O widget **não fala com o servidor**. O app grava em `SharedPreferences`
(`WidgetRenderer.PREFS_NAME`) pela ponte `SoulmonWidget`
(`src/plugins/SoulmonWidgetPlugin.ts` → `plugins/SoulmonWidgetPlugin.kt`), e o
`WidgetRenderer.kt` lê de lá.

**As chaves do bridge são CONGELADAS: só se ACRESCENTA.**

| Chave | Origem no `DigiWidgetData` | Observação |
|---|---|---|
| `pet_name` | `petName` | ⚰️ Era `digimonName` até 07/09/2026. |
| `current_stage` | `currentStage` | |
| `egg_type` | `eggType` | |
| `branch_type` | `branchType` | |
| `completed_tasks` · `total_tasks` | `completedTasks` · `totalTasks` | Só gravadas quando ≥ 0. |
| `hp` · `health_points` · `max_health_points` · `energy_points` | idem | Só gravadas quando ≥ 0. |
| `has_poop` | `hasPoop` | |
| `habit_steady` | `habitSteady?` | Chave **NOVA**: uma FAIXA, nunca o percentual. Ausente = sem histórico, que é diferente de "não está firme" — o plugin faz `editor.remove("habit_steady")` quando o campo não vem. |
| `habit_tier_max` | `habitTierMax?` | 0 = semente … 3 = árvore. |
| `needs_intervention` | `needsIntervention?` | A oferta dos 5 minutos. |

⚰️ **`constancy_pct`, `shields` e `bond_level` NÃO EXISTEM MAIS** (06/09/2026). As
três eram escritas e **nunca lidas** pelo renderer; percentual cru é linha
vermelha do produto e escudo exposto vira placar de uma proteção que só funciona
sendo silenciosa. O plugin **remove** as três a cada escrita, porque parar de
escrever não apaga o que já está no aparelho.

⚠️ **O widget não cobra**, e há régua: `src/plugins/widgetSemCobranca.contract.test.ts`
— que lê o FONTE Kotlin, porque nenhum teste em `node` alcança Kotlin.

`SoulmonAlarmPlugin.kt` usa a mesma casa para os alarmes, com chaves
`alarm_<notificationId>`.
