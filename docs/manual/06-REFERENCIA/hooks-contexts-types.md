# Referência — hooks, contexts, types

> **Dono:** doc-redator-referencia · **Data:** 07/10/2026 (sincronização `e3d55bb8..e71061b8`, Combate v3 PR1–PR18, prédios, missões, avatar: `useGameStateOptional`, `ULTRA_COLOR`, `MISSION_WINDOW_MS`/`LOG_MAX`); anterior: 30/09/2026 (delta `cfe27cc7..3532ccf5`: `types/travessias.ts` (entrada do PR conferida); `GameStateContext.tsx` — campo `crossings` e `normalizeCrossings` no load, 1648 linhas, 97 campos); anterior: 29/09/2026 (delta `ae366480..5edfcfba`: `GameState.review`/`refugeInvite` e a hidratação em `GameStateContext.tsx`); anterior: 29/09/2026 (Guilda completa, delta `38c3ccb5..b657a340`: `useGroveWatch.ts` NOVO); anterior: 27/09/2026 (sincronização do delta `c510c7e4..2336e4e7`: `hydrateSave` deixa de copiar `incubation.notified` ⚰️); anterior: 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: `GameStateContext.tsx` **1542 linhas** e **91** campos de topo — os dois campos novos do save (`missionPerfectDays`, #41/#60, e `minigameBits`, #61/#63) com a leitura que `hydrateSave` faz de cada um; anterior: 2ª sincronização do dia: delta `a6c1cd8a..592e2c14`, QA Rodada 2 — `GameStateContext.tsx` `publicarPerfil` só após save ok e `hydrateSave` de `soulmonMeta`/`soulmonSkills`/`soulmonClassTitles`/`evolutionLocked`) · **Estado:** verificado em 27/09/2026 por doc-verificador (HEAD `78ef5367` — `wc -l` → 1577, `sed -n '161,537p' … | grep -cE` → 92 (interface fecha na linha 537), `incubation?` na linha 242 e o bloco de `hydrateSave` conferido no fonte); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — `wc -l` → 1542 e `sed -n '161,521p' … | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*\??:'` → 91, com os dois blocos de `hydrateSave` conferidos no fonte); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — entrada `GameStateContext.tsx` conferida símbolo a símbolo, `wc -l` 1523; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — `reagirContaExcluida` no `.then` do cloud save, `wc -l`; anterior: delta `f02a3166..4a8b8049`, `conquistasHerdadas` e a migração em `hydrateSave`; anterior: mecânico completo)
> **Estado:** verificado em 30/09/2026 por doc-mantenedor (delta `cfe27cc7..3532ccf5`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `3532ccf5` — `utils/travessias.ts`, `utils/travessiasSave.ts`, `types/travessias.ts`, `PasseioSheet.tsx`, `adventure.ts` › `adventureOfNight`, `playAreaLots.ts`, `CompanionHUD` › `walkingTo`, `GameStateContext` › `crossings`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-verificador (delta `ae366480..5edfcfba` — `wc -l src/contexts/GameStateContext.tsx` → 1637; `awk` da interface `GameState` | `grep -cE` → 96 (94 em `ae366480`); `review?`/`refugeInvite?` nas linhas da interface e `hydrateSave` com `sanitizeReview`/`sanitizeRefugeInvite` conferidos, e os exports nos donos `utils/mente/revisao.ts` e `utils/refugio/convite.ts`; corrigidos: cabeçalho da entrada (1577→1637, 92→96) e o 'entra vazio' do `refugeInvite`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes)
> **Verificação:** `npx vitest run src/hooks src/contexts src/types` — cada símbolo abaixo foi lido no corpo do arquivo, não só no JSDoc.
> **Não cobre:** regra de negócio em profundidade (→ `02-REGRAS-DE-NEGOCIO.md`), `src/App.tsx` (→ `06-REFERENCIA/components.md`), `src/utils/*` que os hooks/contexts importam (→ `06-REFERENCIA/utils.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

## Índice
- [src/hooks](#src-hooks) — `useCareSystem.ts` · `useDailyReset.ts` · `useDeferredFlush.ts` · `useDialogA11y.ts` · `useGroveWatch.ts` · `useItemForm.ts` · `useProgressTracking.ts` · `useSpriteGeneration.ts`
- [src/contexts](#src-contexts) — `GameStateContext.tsx` · `LanguageContext.tsx` · `ThemeContext.tsx`
- [src/types](#src-types) — `attributes.ts` · `category-icons.ts` · `progression.ts` · `taskModel.ts`

---

## src/hooks

### `src/hooks/useCareSystem.ts`
**Dono de:** o agendamento do cocô — quando o primeiro e o segundo evento do dia aparecem na tela, nunca a regra de quanto custa não limpar (isso é `src/utils/poopDrain.ts`).
**Exports:**
- `useCareSystem({ gameState, careEvent, setCareEvent, setMessageTrigger, setGameState, language, isSleeping })` — dois `useEffect`. O primeiro agenda o horário do PRIMEIRO cocô do dia (07h–15h, ou a partir da hora que `earliestPoopHour` devolver para o traço Madrugador) quando `poopEventsScheduled` está vazio E `lastResetDate` já é hoje. O segundo faz `setInterval` de 10s: quando o relógio passa da hora agendada, dispara `setCareEvent({type:'poop', ...})`, incrementa `messageTrigger`, chama `showNotification` (PT/EN) e agenda o SEGUNDO cocô (8–10h depois do primeiro aparecer). Nunca dispara com `isSleeping` ou com `careEvent` já preenchido. Devolve `{}` — o retorno existia para uma fala de cobrança que foi removida de propósito (comentário no corpo: "Antes isto trocava a fala do pet por 'Complete a task!'... cobrança, e errada").
**Chamado por:** `src/App.tsx`.
**Régua:** nenhum teste próprio (`useCareSystem.test.*` não existe); a regra de cobrança do cocô em si é travada por `src/utils/poopDrain.regression.test.ts` e `src/utils/poopDrain.cleanPoop.test.ts`.
**Avisos do arquivo:** o retorno `{}` existe de propósito — não reintroduzir a fala de cobrança que o comentário do corpo descreve e rejeita.

### `src/hooks/useDailyReset.ts`
**Dono de:** disparar `computeDailyReset` quando o dia vira, e nada além disso — a regra da virada mora em `src/utils/dailyReset.ts`.
**Exports:**
- `useDailyReset({ gameState, setGameState })` — `performDailyReset` (via `useCallback`) chama `setGameState(prev => computeDailyReset(prev))`. Um `useEffect` roda `checkRollover` na montagem e a cada 30s (nunca um ticker de 1s — footgun documentado no próprio corpo); se `rolloverPendingFor(gameState.lastResetDate)` for `true`, dispara o reset. Devolve `{ rolloverPending }`, usado por quem precisa **não agir** durante a janela entre a virada civil e o commit do reset (achado X-7 do comentário: o `busy` de `useSpriteGeneration` cobria só 3 das 4 ocasiões declaradas).
- `rolloverPendingFor(lastResetDate)` — `new Date().toDateString() !== lastResetDate`. É a pergunta "o dia de hoje já é outro em relação ao último reset commitado?", isolada para o teste importar a mesma função que o hook usa (em vez de reimplementá-la, que foi o defeito original: o teste antigo tinha uma cópia `simulateReset` que testava uma evolução automática que `MANUAL_EVOLUTION` proíbe).
**Chamado por:** `src/App.tsx`. Testado via import direto em `src/contexts/GameStateContext.hydrate.fuzz.test.tsx`.
**Régua:** `src/hooks/useDailyReset.test.ts`, `useDailyReset.clock.test.ts`, `useDailyReset.rollover.test.ts`.
**Avisos do arquivo:** "não reimplemente a lógica aqui — foi assim que o teste antigo passou a testar uma cópia" (comentário logo acima de `performDailyReset`); `rolloverPending` deve ser devolvido daqui, nunca recalculado no `App.tsx`, "uma dona só".

### `src/hooks/useDeferredFlush.ts`

- `function useDeferredFlush(delayMs: number): (fn: () => void) => void` (desde 04/10/2026, QA2) — `setTimeout` que também roda o pendente na hora se a aba for escondida (`visibilitychange`), a página descarregada (`pagehide`) ou o dono desmontar; cada `fn` roda uma vez. Usado por `App.tsx` › `handleToggleTask` (a conclusão da tarefa avulsa, 3 s depois do toque). Régua: `useDeferredFlush.test.tsx`, `qa2.taskFinalize.contract.test.ts`.

### `src/hooks/useDialogA11y.ts`
**Dono de:** o contrato de acessibilidade de TODO diálogo modal do app — foco inicial, focus trap, Escape, devolução de foco e travamento do fundo (scroll + árvore de acessibilidade). Um hook só para os quatro diálogos do motor de rituais, porque os quatro tinham o mesmo contrato quebrado de formas diferentes (ver o cabeçalho do arquivo: `MorningCheckIn`/`TriagePile` sem trap nem Escape, `MorningDream` com Escape por acidente, `NightmareBattle` sem foco inicial).
**Exports:**
- `useDialogA11y<T>(open, onClose)` — devolve um `ref` a ser posto no elemento raiz do diálogo (`role="dialog" aria-modal="true"`). Quando `open` vira `true`: guarda `document.activeElement` (para devolver o foco depois), trava o scroll do documento e do scroller interno do `App.tsx` (`overflow:hidden` em `html`/`body` + guarda de `touchmove`/`wheel` em captura), inertiza os IRMÃOS do nó do diálogo (nunca o `#root` inteiro — os diálogos não são portais), foca o primeiro elemento focável (ou o próprio container), e registra um `keydown` em captura no `document` que fecha em Escape e faz o Tab circular dentro da lista de focáveis (remedida a cada Tab). No cleanup: remove o listener, desfaz a inertização, destrava o scroll e devolve o foco a quem abriu (se ainda estiver no DOM).
- `default` — reexporta `useDialogA11y`.
**Chamado por:** `src/components/NightmareBattle.tsx`, `DailyReportModal.tsx`, `TournamentPage.tsx`, `MorningCheckIn.tsx`, `form/FormKit.tsx`, `TriagePile.tsx`, `MorningDream.tsx`.
**Régua:** `src/hooks/useDialogA11y.test.tsx`.
**Avisos do arquivo:** trata de propósito quatro casos que a versão ingênua erra — diálogos empilhados (contagem de referência em `lockCount`/`inertRefs`), restauro exato do `overflow` original, `inert` ausente em WebView antigo (cai em `aria-hidden` + o trap de Tab), e desmontagem abrupta (nada em estado React, tudo no cleanup do efeito, contagens saneadas com `Math.max(0, …)`). O hook **não** desenha véu — cada diálogo continua dono do próprio véu.

### `src/hooks/useGroveWatch.ts`
**Dono de:** o App OLHAR o Bosque (`PLANO-GUILDA.md` §4) — a cerimônia de marco e o aviso da Home precisam saber que o estágio subiu sem a pessoa abrir o Salão. **Só pergunta ao servidor quem já tem roda NESTE aparelho** (existe memória em `groveLocal`): quem nunca abriu a Guilda não paga requisição a cada abertura. **Sem timer** — consulta ao montar e ao voltar ao app (`visibilitychange`), nunca em intervalo (footgun de re-render/cloud save). **Uma consulta por volta**: com a folha aberta (`isGuildSheetOpen`) o hook fica quieto. Cenários `bg-guild-*` vão ao SAVE por `onScenes` (fora de updater), e **só com a confirmação do servidor** (`mine.groveScenes` da vista que acabou de chegar) — nunca de um número guardado no aparelho, que é editável (L3-codigo B1).
**Exports:** `useGroveWatch({ saveId, playerDayTz?, onScenes })` → a memória local (`GroveLocal | null`: `pending`, `scenes`, `marks`), que o `App.tsx` usa para o intersticial `groveMilestone` e o aviso `marcoBosque`. Escuta `GROVE_EVENT` e o evento `storage` para relê-la.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/hooks/useGroveWatch.test.tsx`.
**Avisos do arquivo:** só pergunta com a página visível (`document.hidden`), com memória de roda e sem a folha aberta; sem rede ou sem login fica a memória que já existe.

### `src/hooks/useItemForm.ts`
**Dono de:** o estado de formulário de criar/editar UMA tarefa (`useItemForm`) e o estado do seletor de recorrência + âncora de UM hábito (`useHabitSchedule`), separados porque `EditModal` (edita hábito) não usa o formulário de tarefa e `CreateModal` usa os dois.
**Exports:**
- `Step`, `AlarmData`, `ItemFormInitialData` — tipos do formulário de tarefa.
- `useItemForm({ isOpen, initialData, defaultCategory })` — estado de nome/categoria/passos/prazo/alarme/esforço/`startDate`. No `useEffect` de `isOpen`, preenche a partir de `initialData` (com `normalizeEffort` para save antigo sem `effort`) ou reseta para os padrões. Expõe `handlePresetClick`/`handleCustomTimeChange` (calcula o horário do alarme a partir do prazo, com offset de 2h/1h/30min), `handleAddStep`/`handleUpdateStepLabel`/`handleDeleteStep`, e os builders `buildAlarm`/`buildDeadline`/`buildStartDate` que devolvem `undefined` quando o campo está desativado (em vez de um objeto vazio).
- `todayIso(d = new Date())` — `YYYY-MM-DD` no fuso LOCAL (não `toISOString()`, que converte para UTC e adianta o dia a oeste de Greenwich).
- `ALL_WEEK_DAYS` — `[0,1,2,3,4,5,6]`.
- `ScheduleKind` — `Schedule['kind']`.
- `UseHabitScheduleProps`, `useHabitSchedule({ isOpen, initial })` — estado POR MODO (`weekdays`/`timesPerWeek`/`everyNDays`) para trocar de modo e voltar sem perder o que a pessoa já tinha marcado. `buildSchedule()` monta o `Schedule` do modo ativo; `buildWeekDays()` deriva os dias equivalentes via `weekDaysForSchedule` (compat com widget Android/desktop); `applySchedule(s)` aplica um `Schedule` vindo de fora (Quick Add) sem perder os outros modos; `isValid` só falha no modo `weekdays` sem nenhum dia marcado.
- `anchorSentence(anchor, language)` — monta a frase da âncora do hábito ("Depois de X, no Y.") nos dois idiomas; `null` se não há `after` nem `where`.
**Chamado por:** `src/components/TaskEditModal.tsx`, `CreateModal.tsx`, `EditModal.tsx`.
**Régua:** nenhum teste próprio deste arquivo; comportamento coberto indiretamente pelos testes de render de `CreateModal`/`TaskEditModal`/`EditModal` (ex.: `src/components/CreateModal.presets.render.test.tsx`).
**Avisos do arquivo:** `useHabitSchedule` "vive fora do `useItemForm`" de propósito — uma segunda cópia divergiria em silêncio, e a divergência não dá erro nenhum: "o hábito simplesmente passaria a cobrar num ritmo que o usuário não escolheu". O padrão de "a cada N dias" é contar da CONCLUSÃO (`fromCompletion = true`), porque é o único que não acumula atrasada.

### `src/hooks/useProgressTracking.ts`
**Dono de:** o "hoje" recalculado quando o dia vira (sem ticker) e a barra/humor do pet — quanto do dia já foi feito contra a meta ponderada do dia, na MESMA unidade dos dois lados (peso de esforço).
**Exports:**
- `doneWeightFor(state, weekDay, dayKey)` — soma o peso de esforço concluído no dia: hábitos do dia fechados (`HABIT_WEIGHT` cada, via a mesma lista que `dailyGoalFor` usa — `activitiesForWeekDay`) + tarefas marcadas ainda na lista (`normalizeEffort(t.effort)`) + tarefas já em `completedTasks` (`tasksCompletedOn`). Exportada porque o `App.tsx` também precisa do número (toast "uma ação, várias barras") e recontar ali já causou três divergências em silêncio — é o dono único do lado "feito" na UI.
- `useProgressTracking(gameState)` — usa o hook interno `useTodayKey` (recalcula `today` em `resetSignal` mudando, `visibilitychange` e `focus`, nunca por ticker) para derivar `todayWeekDay`, `dailyTotal` (= `dailyGoalFor`, NUNCA o cadastro cru), `dailyDone` (`doneWeightFor` com teto em `dailyTotal` — não existe "mais que 100%"), `progress` (0–100, considerando passo como concluído só quando TODOS os passos da atividade fecham) e `todayAttributes` (soma power/harmony/benevolence das atividades completas hoje, via `CATEGORY_ATTRIBUTES`).
**Chamado por:** `src/App.tsx`.
**Régua:** `src/hooks/useProgressTracking.test.ts`.
**Avisos do arquivo:** o denominador NÃO É o cadastro cru — antes ele contava `activities.length + tasks.length + completedTasks.length`, o que fazia o widget Android mostrar "6/9" mesmo quando 6 já cumpria a meta do dia. Também NÃO existe uma segunda definição de "dia perfeito" aqui (havia uma, morta, comentário no corpo diz para não recriá-la — a real vive em `computeDailyReset`/`lastDayReport.wasPerfect`). Passo de atividade não move mais a barra sozinho — só quando todos os passos fecham (antes punia visualmente quem quebra tarefa grande em passos pequenos).

### `src/hooks/useSpriteGeneration.ts`
**Dono de:** a FIAÇÃO de quando um lote de geração incremental de sprite parte — não a regra (gatilho é de `utils/spriteTrigger.ts`, acervo é de `utils/spriteLibrary.ts`, execução é de `utils/spriteRunner.ts`).
**Exports:**
- `whenIdle(fn)` — `requestIdleCallback({timeout:5000})` com fallback `setTimeout(2000)`; devolve o cancelador.
- `UseSpriteGenerationArgs`, `SpriteGenerationStatus` — tipos de entrada/saída do hook.
- `useSpriteGeneration(args)` — dois efeitos. (1) adoção automática (`autoTuneDue`): quando não `busy` e há troca pendente, adota o sprite tunado em janela ociosa e sinaliza `tunedAnnouncement`. (2) o lote em si: quando `enabled && !busy && stages.length`, calcula o lote (`birthBatch` no nascimento, senão `spriteBatch`) em janela ociosa e chama `executarLote`. `executarLote(formIds, {adoptCurrentNow, manual})` é o ÚNICO caminho de geração do app (usado tanto pelo lote automático quanto pelo botão "Tentar de novo"): chama `runSpriteBatch`, que para cada forma pede `requestSprite` (com a imagem da forma anterior como referência, cadeia image2image) e grava resultado (`recordSprite`) ou falha (`recordFailure`) no acervo. `retry(formId)` é o gesto manual — confere `canManualRetry` (teto de 3 + cooldown de 60s) antes de despachar, com trava contra toque duplo (`manualPendente`).
- `libraryOf(state)` — `state.spriteLibrary ?? emptySpriteLibrary()`.
**Chamado por:** `src/App.tsx`.
**Régua:** nenhum teste próprio deste hook; a fiação em torno dele é coberta por `src/utils/spriteManualRetry.contract.test.ts`, `src/utils/spriteBirth.contract.test.ts`, `src/utils/spriteLibrary.test.ts`, `src/components/EvolutionPath.sintonia-anuncio.render.test.tsx`.
**Avisos do arquivo:** obedece quatro regras de janela do §3.3 da spec (depois do primeiro paint · em ocioso · nunca durante virada/relatório/cerimônia/cuidado · um lote por vez, serial). "Não simplifique o ramo `hasFormCap`" não é deste arquivo, mas o comentário de `_aiGuard.js` que ele alimenta pelo `formId` enviado em `requestSprite`.

---

## src/contexts

### `src/contexts/GameStateContext.tsx` (1648 linhas — `wc -l src/contexts/GameStateContext.tsx`, 30/09/2026 em `3532ccf5`; 1637 em `cfe27cc7`; 1622 em `ae366480`; 1577 em 24/09/2026 após WP4.29; 1542 em 22/09/2026 após `cf6315e1`; 1523 em `592e2c14`, 1503 em `a6c1cd8a`, 1485 em 21/09, 1463 em 10/09/2026)
**Dono de:** o `GameState` inteiro (tipo + valor inicial + hidratação de save + persistência local e na nuvem). É o maior contexto do app e a única fonte do estado do jogo.
**Exports:**
- `useGameStateOptional()` — como `useGameState`, mas sem lançar fora do provider (a Arena lê o level assim; sem provider cai no estágio).
- `migrateDecor(loaded)` — save antigo guardava UMA decoração (`equippedFurniture`, badge de canto); a migração devolve o mapa `equippedDecor` novo, colocando o item antigo no espaço (`slot`) que ele declara. Roda uma vez no load; checa a PRESENÇA de `equippedDecor` (não se está vazio) para não confundir "nunca migrou" com "desequipou tudo".
- `Step`, `Activity`, `Task`, `CompletedTask`, `ActivityStats` — interfaces de dados do jogo. `Activity` é o contrato de CONSTÂNCIA (hábito); `Task` é o contrato de EXECUÇÃO (tarefa pontual) — campos novos de `Task` são todos opcionais com padrão seguro (save antigo lê `effort:1`, `status:'open'`, sem `daysStale`), para não assombrar em massa o backlog de quem só atualizou o app.
- `GameState` — a interface do save inteiro (**97** campos de topo em `3532ccf5` — entrou `crossings`; 96 antes; comando na entrada `review`/`refugeInvite` abaixo, 30/09/2026; eram 92 em 24/09/2026 por `sed -n '161,537p'` (faixa fixa, não comparável), `incubation` entrou; eram 91 em 22/09, 89 em 21/09 e 88 em 10/09/2026, corrigido de "110" por doc-verificador; ver `docs/manual/07-DADOS-E-SAVE.md` para a lista — se aquele doc ainda citar "110", a divergência é dele, não deste arquivo). `demoCharacterId` aceita 6 ids desde 15/09/2026 (`c11dc49d`; `'kaelen' | 'orrin' | 'thalindra' | 'igni' | 'nautilu' | 'astrase'`; eram só os 3 primeiros). Campo novo em `42b07bec` (decisão #30): **`conquistasHerdadas?: AchievementId[]`** — conquistas abertas por um gatilho que NÃO existe mais, gravadas UMA vez na migração do load; hoje só `'dias-completos-30'` (ex-`tasks-100`). É a única conquista persistida. `hydrateSave`: save que JÁ tem o campo mantém (filtrado contra `ACHIEVEMENT_IDS`, mesmo `[]`); save sem o campo ganha `['dias-completos-30']` se `gatilhoAntigoTasks100(loadedState)` (≥ 100 em `completedTasks + activityLog`), senão `[]` — só nessa hora, porque `activityLog`/`completedTasks` são podados e a leitura derivada fecharia. Régua: `GameStateContext.legacySave.test.tsx`.
- `getMaxHPForStage(stage)` — `MAX_HP_BY_FORM[getStageLevel(stage)]`.
- `CLOUD_SAVE_DEBOUNCE_MS = 3000` — debounce de CAUDA do cloud save; reinicia a cada mutação. Medido: colapsa ~23 mutações de uma sessão cheia em ~14 POSTs.
- `CLOUD_SAVE_MAX_WAIT_MS = 15000` — teto absoluto de espera (R-4): sem ele, um fluxo sustentado de mutações a menos de 3s de distância nunca dispara o POST e o cloud save para em silêncio.
- `GameStateProvider({ children })` — inicializa o estado lendo `STORAGE_KEYS.GAME_STATE` do `localStorage` (via `readLocal`/`safeStorage`, nunca lança — save corrompido, storage bloqueado ou array/primitivo no lugar de objeto caem em `freshGameState()`), monta um `useEffect` que grava local a cada mudança e agenda o cloud save com o debounce de cauda + teto R-4, avisa o jogador (toast, uma vez por classe de falha por sessão) quando o save falha, e publica o perfil público (`pushProfile`) só se `pvpEnabled` — **e, desde `592e2c14`, só DEPOIS de `cloudSaveComRetry` confirmar `ok`** (`publicarPerfil()` dentro do `.then`; QA Rodada 2, `01-seguranca-r2` §1.3 / `04-dados-r2` §0: em paralelo, o `pushProfile` regravava `profile:`/`pid:` no mesmo tick em que o save tomava 410 — o diretório público renascia 3 s depois da exclusão; save recusado = perfil não sobe. Consequência: com o cloud save falhando, o interruptor local de PvP e o diretório divergem pelo tempo da falha). Trata a recusa de PvP do servidor (`resposta.pvpBlocked === true`) desligando `pvpEnabled` localmente — o único `setGameState` permitido dentro do `.then` do save, porque fecha a porta do próprio `if` em vez de reabrir o ciclo (comentário R-1 explica por que não viola a proibição de `setGameState` no callback de save).
- `useGameState()` — `useContext(GameStateContext)`, lança se usado fora do provider.

⚠️ **`hydrateRest` descartava `dreamDates` a cada load, achado em 20/09/2026** (WP4.10, a data da PRIMEIRA coleta de cada sonho): `collectDream` carimbava a data, o save gravava, e a próxima abertura do app apagava de novo — o "#NN · data" do Dex nunca ficava persistido. Desde `8bc55437` (20/09/2026) `hydrateRest` preserva só entradas string→string não vazias de `raw.dreamDates`; o resto some, mas nunca vira data inventada.

**Chamado por:** `useGameState` tem 2 consumidores fora deste arquivo — `src/App.tsx` e `src/main.tsx` (monta o `GameStateProvider`). `getMaxHPForStage`, `migrateDecor` e as interfaces (`Activity`, `Task`, …) são importados por dezenas de componentes em `src/components/`.
**Régua:** `src/contexts/GameStateContext.bond.test.tsx`, `.careCaps.test.tsx`, `.cloudErrors.test.tsx`, `.hostile.test.tsx`, `.hydrate.fuzz.test.tsx`, `.legacySave.test.tsx`, `.pvpBlocked.test.tsx`, `.saveContent.test.tsx`, `.storage.test.tsx`, `.conquistas.qa.test.tsx` (desde `a6c1cd8a` — saves tortos que a migração `tasks-100` → `dias-completos-30` pode encontrar na nuvem, provados por EXECUÇÃO do provider), `.hydrate.fuzz2.qa.test.tsx` (5, desde `592e2c14` — os 89 campos × 14 valores hostis, montando o `App` inteiro), `.perfilAposSave.qa.test.tsx` (4, desde `592e2c14` — `pushProfile` só depois do save ok; 410 não publica), `migrateDecor.test.ts`.
**Dois campos NOVOS em `cf6315e1` (execução das respostas do dono, 22/09/2026):**
- **`missionPerfectDays?: number`** (decisão **#41/#60**) — dias completos vitalícios **para a MISSÃO** `mission-perfect-30`: reais **mais** os 🌀 Glitchtama. `totalPerfectDays` volta a significar só dias completos REAIS, e é ele que `achievements.ts` e `seasons.ts` leem. `hydrateSave`: `num(loadedState.missionPerfectDays, num(loadedState.totalPerfectDays, 0))` — save anterior à decisão **herda** o vitalício antigo, que já somava os 🌀, e por isso a missão nunca anda para trás.
- **`minigameBits?: { day: string; earned: number }`** (decisão **#61/#63**) — ledger do teto diário de Bits de **minijogo** (`MINIGAME_BITS_PER_DAY = 150`, `utils/currencies.ts`); os Bits do **dia completo** não passam por aqui. `hydrateSave` usa o mesmo argumento do `glitchtamaUse`: só sobrevive com `day` string, e save antigo entra `undefined` e ganha o dia inteiro.
Os dois são **acréscimo**, nunca renomeação (linha vermelha #20 — save só ACRESCENTA). Ver [07-DADOS-E-SAVE.md](../07-DADOS-E-SAVE.md).
**Campo NOVO no delta `cfe27cc7..3532ccf5` (30/09/2026, Passeio + Travessias):** **`crossings?: CrossingsState`** — regiões abertas, a Travessia escolhida, os "Fiz" guardados, o destino do Passeio e o interruptor; só ids, enum, `dayKey` e um booleano (parecer 04 R-4); nenhum sistema do núcleo lê o campo (contrato `src/utils/travessias.contract.test.ts`); leitura `?? CROSSINGS_EMPTY`. `hydrateSave` copia por `crossings: normalizeCrossings(loadedState.crossings)` (`src/utils/travessiasSave.ts`, que mora fora de `utils/travessias.ts` para o catálogo não entrar no chunk de entrada) — lixo é descartado, nunca derruba o load. Com ele a interface tem **97** campos de topo (mesmo `awk` abaixo).
**Dois campos NOVOS no delta `ae366480..5edfcfba` (30/09/2026, prédios de Jogos):** **`review?: ReviewState`** (Revisão da Malha, Ateliê da Mente) — os cartões que o jogador escreve e a caixa de Leitner de cada um; dono da regra e da higienização `utils/mente/revisao.ts` (`sanitizeReview`); mora no save, não no aparelho, porque é conteúdo da pessoa. **`refugeInvite?: RefugeInviteState`** (convite ao Refúgio) — só DATAS e a contagem de dispensas, nunca o humor que disparou o convite (dado sensível); dono `utils/refugio/convite.ts` (`sanitizeRefugeInvite`). `hydrateSave` copia os dois por `review: sanitizeReview(loadedState.review)` e `refugeInvite: sanitizeRefugeInvite(loadedState.refugeInvite)` — cartão malformado é DESCARTADO pelo dono da regra, nunca derruba o load, e save sem o campo entra como `{ cards: [] }` (`review`) ou `undefined` (`refugeInvite`: `sanitizeRefugeInvite` devolve `undefined` se o bruto não é objeto). A interface `GameState` tem 96 campos de topo (`awk '/^export interface GameState/{f=1} f{print} f&&/^}/{exit}' src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*\??:'`, 30/09/2026; 94 em `ae366480` — a contagem de 92 acima foi feita por `sed` de faixa fixa e não é comparável). O arquivo tem 1637 linhas (`wc -l`, 30/09/2026; 1622 em `ae366480`; ver o cabeçalho desta entrada para as anteriores).
**Campo NOVO em WP4.29 (`8be8f9c5`, D-G8b/D-G8c, 22–24/09/2026): `incubation?: Incubation`** (tipo de `utils/spriteTrigger.ts`) — `formId` → instante em que a forma começou a incubar; o gesto de evoluir só completa depois de `INCUBATION_MIN_MS`. É "apto desde X", não "gerando desde X" (sem relação com o acervo de sprites), e o `since` de uma forma nunca é apagado enquanto a criatura for a mesma (degenerar e re-subir reaproveita o relógio — parecer R-L; o Renascimento e o upgrade zeram). `hydrateSave` higieniza o que vem da nuvem: objeto não-array com `since` objeto não-array, só pares forma→string sobrevivem, `notified` (⚰️ `4b87fee0`, 27/09/2026) não é copiado; data inválida NÃO é filtrada de propósito (`incubationReady` responde `true` para relógio corrompido — nunca prende ninguém). Ausente = save anterior, e forma sem registro conta como pronta. Acréscimo (linha vermelha #20).

**Hydrate de campos crus (desde `592e2c14`, QA Rodada 2 `04-dados-r2` #9):** o fuzz de 89 campos × 14 valores hostis derrubava a tela com `soulmonMeta` cru (`petName`/`baseName` não-string chegavam ao render). `hydrateSave` passou a sanear **`soulmonMeta`** (só objeto não-array; `baseName: str() ?? ''`, `petName: str()`), **`soulmonSkills`** e **`soulmonClassTitles`** (objeto não-array ou `undefined`) e **`evolutionLocked`** (`=== true`). ⚰️ Os quatro passavam crus da nuvem para o estado.
**Conta excluída (desde `a6c1cd8a`):** quando `cloudSaveComRetry` devolve `kind: 'deleted'` (410 `account-deleted`), o `.then` chama `reagirContaExcluida()` de `utils/cloudSave.ts` e retorna — limpa o local (com backup em `CONFLICT_BACKUP` desde `592e2c14`), desloga e volta ao portão SEM tocar em `setGameState` (R-1 respeitado; não é aviso, é parada). O perfil não sobe nesse caminho (`publicarPerfil` só roda no `ok`).
**Avisos do arquivo:** R-1 (nada de `setGameState` dentro do `.then` do cloud save, exceto o caso declarado do `pvpBlocked`, que fecha a porta em vez de reabrir o ciclo — há teste travando: `GameStateContext.pvpBlocked.test.tsx`) · R-3 (um aviso por classe de falha, por sessão — não a cada gesto) · R-4 (teto de espera contra a inanição do debounce). `CLOUD_SAVE_DEBOUNCE_MS` não deve ser reduzido "para encurtar a janela de conflito" sem refazer a conta — piora o 409 e o custo.

### `src/contexts/LanguageContext.tsx`
⚰️ **Módulo morto — sem chamador fora dele mesmo, verificado em 08/09/2026** (`src/components/p5DiaCompleto.contract.test.ts`, comentário que dispensa `src/utils/i18n.ts` da varredura de texto: "`useLanguage` — que não tem um único chamador fora do próprio `LanguageContext.tsx`"). `LanguageProvider` não é montado em `src/main.tsx` (que monta `ThemeProvider` e `GameStateProvider`, não este); o app inteiro escreve texto com `isPt ? … : …` inline, lendo `resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE))` direto (`src/App.tsx`). `src/translations/en.ts` e `pt.ts` (ver `plugins-constants.md`) só são lidos por este arquivo — logo também estão órfãos na prática.
**Dono de:** nada em uso — seria o dono do idioma via Context API, função hoje cumprida por `resolveLanguage`/`isPt` inline.
**Exports:**
- `LanguageProvider({ children })` — lê `STORAGE_KEYS.LANGUAGE` do `localStorage`, expõe `{ language, setLanguage, t }`; `t(key)` resolve chave aninhada em `translations.{en,pt}` com fallback para inglês.
- `useLanguage()` — `useContext`, lança se fora do provider.
**Chamado por:** ninguém fora deste arquivo (grep 09/09/2026).
**Régua:** nenhuma — não há teste próprio; a decisão de manter ou remover é registrada em `docs/STATUS.md`.
**Avisos do arquivo:** nenhum comentário próprio de aviso; a divergência (módulo nunca montado) não está declarada no código, só é reconstruível pela ausência de chamador.

### `src/contexts/ThemeContext.tsx`
**Dono de:** o tema visual (claro/escuro/sistema) e a sincronização do atributo `data-theme` no `<html>`.
**Exports:**
- `ThemeMode` — `'light' | 'dark' | 'system'`.
- `ThemeProvider({ children })` — lê o modo salvo (`STORAGE_KEYS.THEME`; valor inválido — resíduo do antigo seletor de skin default/win98/glitch — vira `'system'`). Resolve `'system'` sempre para `'dark'` (`resolveSystemPreference` NÃO segue o SO de propósito — comentário: o visual do jogo "só existe pensado pro tema escuro"). Sincroniza `document.documentElement.dataset.theme` a cada mudança de `resolvedTheme`, e escuta `prefers-color-scheme` só quando o modo é `'system'`. `setMode(next)` grava no storage (falha silenciosa — preferência cosmética) e atualiza o estado.
- `useTheme()` — `useContext`, lança se fora do provider.
**Chamado por:** `src/main.tsx` (monta `ThemeProvider`); `useTheme` tem 1 consumidor real em `src/components/` — `SettingsPage.tsx` (`grep -rn "\buseTheme\b" src/components --include=*.tsx --include=*.ts`, 10/09/2026, corrigido de "3 consumidores" por doc-verificador: a única outra ocorrência, em `ui/sonner.tsx`, é um COMENTÁRIO explicando por que aquele arquivo parou de usar `useTheme` — não é uma chamada real).
**Régua:** nenhum teste próprio deste arquivo; contraste de tokens por tema é travado em `src/styles/tokens.contrast.test.ts` (ver `plugins-constants.md`).
**Avisos do arquivo:** o `data-theme` inicial já é setado por um script inline em `index.html` (antes do primeiro paint, evita FOUC) — este provider só assume o controle depois que o React monta.

---

## src/types

### `src/types/travessias.ts`
**Dono de:** os TIPOS e as CONSTANTES do Passeio e das Travessias (30/09/2026): `RegionId` (os 8 reinos com superfície), `HOME_REGION` (`campina`), `CrossingArea`, `CrossingChallenge` (id, área, texto pleno e pequeno EN/PT, `minAge: 13` — sem campo que diferencie a versão pequena nem campo de prêmio, há contrato), `RegionFind`, `Region`, `REGIONS_OPENED_PER_DAY` (1), `PASSEIO_REGION_FIND_CHANCE` (0,5), `CrossingsState` (só ids, enum e `dayKey` — parecer 04 R-4; desde 04/10/2026 + `pickDay`, `score` e `trip`), `MARCO_THRESHOLDS` (5/10/20), `MISSIONS_OFFERED_PER_DAY` (3) e `CROSSINGS_EMPTY`.
**Chamado por:** `src/utils/travessias.ts`, `src/utils/travessiasSave.ts`, `src/data/travessiasCatalog.ts`, `src/contexts/GameStateContext.tsx` (`crossings?`), `src/App.tsx`, `src/components/nav/AreaView.tsx`, `src/components/play/PasseioSheet.tsx`.
**Régua:** `src/utils/travessias.contract.test.ts` (d).

**Delta 07/10/2026:** `MISSION_WINDOW_MS` (24 h — quanto vale a missão escolhida, sem troca; rodada 7/M4) e `LOG_MAX` (60 entradas do registro).

### `src/types/attributes.ts`
**Dono de:** os três atributos do jogo (Poder/Harmonia/Benevolência — internamente `power`/`harmony`/`benevolence`), a cor e o rótulo canônicos de cada um, e o mapeamento categoria de atividade → atributo/galho de evolução.
**Exports:**
- `ULTRA_COLOR` (`#F2C200`) — o amarelo do Ascendente (forma Ultra), o círculo do nó dela (rodada 7, I3).
- `AttributePoints`, `ActivityCategory` — tipos base.
- `ALIGN_TO_ATTR` — alinhamento do oráculo → galho de evolução; era um mapa local de `EvolutionPath`, virou compartilhado quando `EvoTrail` da Home passou a precisar dele.
- `CATEGORY_ATTRIBUTES` — quanto cada categoria de atividade rende em cada atributo.
- `XP_THRESHOLDS` — limiares de XP.
- `BranchType` — o galho (`power`/`harmony`/`benevolence`).
- `ATTR_COLOR` — FONTE ÚNICA DA VERDADE da cor de cada atributo; nenhuma tela deve redeclarar.
- `ATTR_LABEL` — FONTE ÚNICA DA VERDADE do nome que o jogador vê (os ids internos `power`/`harmony`/`benevolence` são herdados do fork e nunca aparecem na UI).
- `ATTR_INK` — a mesma cor de `ATTR_COLOR`, na luminosidade que passa 4,5:1 como texto, por tema (resolvida via variável CSS).
- `ATTR_ON_FILL_INK` — tinta escura para texto por cima de um preenchimento de atributo (mede 5,4–7,0:1 contra os 2,4–3,1:1 do branco).
- `EvolutionBranch`, `EVOLUTION_BRANCHES` — os três galhos como dado estruturado.
**Chamado por:** 24 arquivos (`grep -rl "from '.*/attributes'" src | wc -l`, 10/09/2026 — corrigido de "23" por doc-verificador) — entre eles `TaskEditModal.tsx`, `ItemsWindow.tsx`, `PlayerDetailModal.tsx`, `StatsPage.tsx`, `EvoTrail.tsx`, `CreateModal.tsx`.
**Régua:** cobertura indireta via testes de render dos componentes que o usam; nenhum `attributes.test.ts` próprio.
**Avisos do arquivo:** `ATTR_LABEL` — "este comentário..." (nota sobre não expor `power`/`harmony`/`benevolence` na UI).

### `src/types/category-icons.ts`
**Dono de:** o ícone (Material Symbol) e o rótulo PT de cada categoria de atividade, tolerantes a categoria vinda de save antigo/seed que não bate com `ActivityCategory`.
**Exports:**
- (`CATEGORY_ICON_IMG` / `categoryIconImg`, o PNG pixel-art dos chips, SAÍRAM em 20/09/2026 — canvas Atividades D-A7; o vetor abaixo é o único caminho.)
- `CATEGORY_ICON_NAME` — categoria → nome de ícone Material Symbols Rounded; todo nome está no inventário de 99 do subset de `src/styles/tokens.md`.
- `categoryIconName(category)` — tolerante à categoria vinda do ESTADO (pode não ser uma `ActivityCategory` válida): devolve `undefined` e ninguém desenha ícone.
- `CATEGORY_ICONS` — mapa categoria → emoji.
- `CATEGORY_LABELS_PT` — rótulo em português de cada categoria.
- `categoryLabel(category, language)` — rótulo final, nos dois idiomas.
**Chamado por:** 7 arquivos (`grep`, 09/09/2026) — `TaskEditModal.tsx`, `CreateModal.tsx`, `WeeklyReportCard.tsx`, `GameTutorialFlow.tsx`, `EditModal.tsx`, `App.tsx`.
**Régua:** nenhum teste próprio; o subset de ícones citado é travado por `src/styles/iconInventory.contract.test.ts`.
**Avisos do arquivo:** nenhum comentário de aviso formal além das notas de tolerância a dado sujo já citadas nos exports.

### `src/types/progression.ts`
**Dono de:** a escada de evolução inteira — os 11 ids de forma, requisito diário por estágio, HP máximo por estágio, energia máxima, os dois caminhos para o Ultra, e se a evolução é manual.
**Exports:**
- `FORM_REQUIREMENTS` — requisito diário (tarefas/hábitos) por estágio.
- `ULTRA_PATIENCE_DAYS` — o segundo caminho para o Ultra (decisão D6, WP4.2): dias de paciência em vez de só perfectDays acumulados.
- `canReachUltra(...)` — existe caminho para o Ultra a partir do mega? `perfectDays` contados desde a última evolução.
- `MAX_HP_BY_FORM` — HP máximo por NÍVEL de estágio (rookie/champion/ultimate=3 · mega=4 · ultra=5).
- `EvolutionStage` — tipo do id de forma.
- `MAX_STAGE_REQUIREMENT` — o maior requisito diário da escada (hoje 6, mega/ultra); todo outro teto do jogo deriva deste, nunca de um literal.
- `getStageLevel(stageId)` — nível do estágio a partir do prefixo do id (`'champion-power'` → `'champion'`); id fora do esquema cai em `'rookie'`.
- `getStageBranch(stageId)` — atributo (`power`/`harmony`/`benevolence`) embutido no id, se houver.
- `getMaxEnergyForStage(stageId)` — energia máxima = `FORM_REQUIREMENTS.required` do estágio.
- `canSelectWeekdays(...)`, `AVAILABLE_BRANCHES`, `AvailableBranch`, `clampBranch(...)` — auxiliares de seleção de galho.
- `STAGE_LEVEL_CAPS`, `stageIndexOf(stageId)`, `levelCapFor(stageId)` — teto de level do Soulmon por estágio (6/13/21/30/40), ACUMULADO de `FORM_REQUIREMENTS.cap` (combate v3, PR2); dono único, nunca número paralelo.
- `MANUAL_EVOLUTION = true` — a evolução nunca dispara sozinha na virada; quem dispara é o jogador, tocando na criatura com a barra cheia.
**Chamado por:** 35 arquivos (`grep -rl "from '.*/progression'" src desktop functions | wc -l`, 10/09/2026 — corrigido de "33" por doc-verificador), incluindo `desktop/renderer/src/cloudSync.ts` (`MAX_HP_BY_FORM`, `getStageLevel`, `getMaxEnergyForStage` — deixou de ser cópia em `d56bba7a`, ver footgun 9 do `CLAUDE.md`) e `functions/api/_aiGuard.js` (comentário cita as 11 formas por referência a este arquivo, mas `VALID_FORM_ID` é uma regex própria — não importa este módulo, porque Pages Functions não importam de `src/`).
**Régua:** `src/types/progression.test.ts`, `src/types/ultra.doisCaminhos.test.ts`.
**Avisos do arquivo:** ⚰️ `LEGACY_FORM_TIERS` não existe mais (57 ids de espécie Bandai removidos em 07/09/2026) — id fora do esquema cai direto em `'rookie'`.

### `src/types/taskModel.ts` (368 linhas — corrigido de "369" por doc-verificador, `wc -l`, 10/09/2026)
**Dono de:** TODOS os tipos e constantes do motor de tarefas/hábitos (`docs/PLANO-TAREFAS.md`) — dono único, nenhum outro arquivo inventa número deste domínio.
**Exports:**
- `Schedule` — como um hábito se repete: `weekdays` (modelo antigo, padrão de save velho), `timesPerWeek`, `everyNDays` (`from: 'schedule' | 'completion'`).
- `HabitAnchor` — a âncora do hábito (`after`/`where`), implementation intention de Gollwitzer.
- `Effort` — 1 rápida · 2 média · 3 projeto; `DEFAULT_EFFORT`.
- `HABIT_WEIGHT = 1` — peso fixo de um hábito na meta do dia (não varia porque o valor do hábito está em repetir, não em ser difícil).
- `ROUTINE_PRESETS`, `RoutinePreset`, `presetDeRotina(...)` — presets de rotina (P4 do dossiê de carga diária).
- `normalizeEffort(v)` — esforço válido, com padrão 1 para save antigo sem o campo.
- `TaskStatus` — `'open' | 'someday' | 'dropped'`.
- `POSTPONE_NUDGE_AT` — quantos adiamentos até o pet intervir (decompor/encolher/deixar pra lá).
- `HAUNTED_AFTER_DAYS` — dias parada até a tarefa ficar "assombrada".
- `MAX_DAILY_FOCUS = 3` — quantas tarefas podem ser foco do dia.
- `OVERCOMMIT_EFFORT` — carga de esforço a partir da qual o pet avisa (aviso, nunca bloqueio).
- `HABIT_MILESTONES` — 7/21/66 dias efetivos (Lally et al. 2010).
- `HABIT_CHEER_AT` — dias intermediários em que o pet comenta, sem serem marco.
- `cheerReached(...)` — o dia de fala que acabou de ser cruzado, ou `null`.
- `HabitTier`, `HABIT_TIER_BONUS` — degrau do marco → bônus de rendimento de atributo (0/10/20/30%).
- `HABIT_TIER_ICONS` — glifo de cada degrau (restrito a Emoji ≤11.0, ver aviso).
- `CONSTANCY_WINDOW_DAYS` — a janela de constância ("N das últimas 7").
- `REST_SHIELD_MAX`, `REST_SHIELD_EARN_EVERY_DAYS` — escudos de descanso.
- `MISS_INTERVENTION_AT` — "never miss twice": intervenção só na 2ª falta seguida.
- `DEFAULT_REST_WINDOW`, `REST_WINDOW_GRACE_MIN`, `REST_WINDOW_DAYS` — Janela de Descanso.
- `normalizeSchedule(...)` — lê `weekDays` antigo como `Schedule`.
- `weekDaysForSchedule(...)` — dias da semana equivalentes a um `Schedule` (compat com widget Android/desktop, que não carregam o motor novo).
**Chamado por:** 33 arquivos (`grep -rl "from '.*/taskModel'" src | wc -l`, 09/09/2026, reconferido em 10/09/2026 por doc-verificador — bate) — `TaskEditModal.tsx`, `RestWindowCard.tsx`, `GuideModal.tsx`, `MorningCheckIn.tsx`, `HelpModal.tsx`, `CreateModal.tsx`, `HabitConstancy.tsx`, `EditModal.tsx`, e utils como `habitRhythm.ts`/`taskTriage.ts`/`restWindow.ts`/`dailyReset.ts`.
**Avisos do arquivo:** `HABIT_TIER_ICONS` — "TODOS TÊM DE SER Emoji 11.0 OU ANTERIOR" (`🪴` U+1FAB4 é 13.0 e renderizava como caixa vazia). Nenhum outro módulo deve reinventar número deste domínio — os módulos de `src/utils/habitRhythm.ts`, `taskTriage.ts`, `restWindow.ts`, `rituals.ts` só APLICAM as constantes daqui.
**Régua:** cobertura indireta via `src/utils/habitRhythm.test.ts`, `taskTriage.test.ts`, `restWindow.test.ts` e os testes de render dos formulários listados acima.

### `src/types/activityCatalog.ts`
**Dono de:** Os tipos do catálogo de atividades curado (docs/PLANO-CATALOGO-ATIVIDADES.md §1) — `CatalogItem`, `LifeArea`, `StruggleId`, `StrengthId`, `CatalogLevel`, `CatalogLevelSpec`, `CatalogEvidence`/`EvidenceLevel`, e os rótulos bilíngues `LIFE_AREA_LABEL`/`STRUGGLE_LABEL`/`STRENGTH_LABEL`. O pool em si é dado, não tipo — mora em `src/data/activityCatalog.ts`.
**Chamado por:** `src/data/activityCatalog.ts`, `src/utils/recommend.ts`, `src/utils/catalogLevel.ts`.
**Régua:** `src/utils/recommend.test.ts`, `src/utils/catalogLevel.test.ts`; a evidência de cada item do pool é conferida em `docs/CATALOGO-EVIDENCIAS.md`.

### `src/contexts/useTalentBonus.ts`
**Dono de:** o bônus de talento do jogador. `useTalentBonus('pve')`: Arena e Pesadelo, pelo canal único `combinedBonus` (teto de 5%). `usePvpTalents()` (PR7b): o canal de PvP POR ATRIBUTO (`combinedAttrBonus`, teto de 5% na soma dos três) e o `cheerScale` da torcida, que o treino do Torneio usa (o duelo real é decidido no servidor, `_duel.js`). Sem Provider vale 0 / 1.
`useDungeonBonus()` (PR12a): a Masmorra, por atributo (talento de PvE no ATK + equipamento em ATK/DEF/SPD, um teto de 5% na soma).
**Exports:** `useTalentBonus`, `useDungeonBonus`, `usePvpTalents`, `PvpTalents`.
**Régua:** `src/contexts/useTalentBonus.test.tsx`.
