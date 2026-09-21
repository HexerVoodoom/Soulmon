# Referência — hooks, contexts, types

> **Dono:** doc-redator-referencia · **Data:** 20/09/2026 · **Estado:** verificado em 21/09/2026 por doc-verificador (mecânico completo)
> **Verificação:** `npx vitest run src/hooks src/contexts src/types` — cada símbolo abaixo foi lido no corpo do arquivo, não só no JSDoc.
> **Não cobre:** regra de negócio em profundidade (→ `02-REGRAS-DE-NEGOCIO.md`), `src/App.tsx` (→ `06-REFERENCIA/components.md`), `src/utils/*` que os hooks/contexts importam (→ `06-REFERENCIA/utils.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

## Índice
- [src/hooks](#src-hooks) — `useCareSystem.ts` · `useDailyReset.ts` · `useDialogA11y.ts` · `useItemForm.ts` · `useProgressTracking.ts` · `useSpriteGeneration.ts`
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

### `src/hooks/useDialogA11y.ts`
**Dono de:** o contrato de acessibilidade de TODO diálogo modal do app — foco inicial, focus trap, Escape, devolução de foco e travamento do fundo (scroll + árvore de acessibilidade). Um hook só para os quatro diálogos do motor de rituais, porque os quatro tinham o mesmo contrato quebrado de formas diferentes (ver o cabeçalho do arquivo: `MorningCheckIn`/`TriagePile` sem trap nem Escape, `MorningDream` com Escape por acidente, `NightmareBattle` sem foco inicial).
**Exports:**
- `useDialogA11y<T>(open, onClose)` — devolve um `ref` a ser posto no elemento raiz do diálogo (`role="dialog" aria-modal="true"`). Quando `open` vira `true`: guarda `document.activeElement` (para devolver o foco depois), trava o scroll do documento e do scroller interno do `App.tsx` (`overflow:hidden` em `html`/`body` + guarda de `touchmove`/`wheel` em captura), inertiza os IRMÃOS do nó do diálogo (nunca o `#root` inteiro — os diálogos não são portais), foca o primeiro elemento focável (ou o próprio container), e registra um `keydown` em captura no `document` que fecha em Escape e faz o Tab circular dentro da lista de focáveis (remedida a cada Tab). No cleanup: remove o listener, desfaz a inertização, destrava o scroll e devolve o foco a quem abriu (se ainda estiver no DOM).
- `default` — reexporta `useDialogA11y`.
**Chamado por:** `src/components/NightmareBattle.tsx`, `DailyReportModal.tsx`, `TournamentPage.tsx`, `MorningCheckIn.tsx`, `form/FormKit.tsx`, `TriagePile.tsx`, `MorningDream.tsx`.
**Régua:** `src/hooks/useDialogA11y.test.tsx`.
**Avisos do arquivo:** trata de propósito quatro casos que a versão ingênua erra — diálogos empilhados (contagem de referência em `lockCount`/`inertRefs`), restauro exato do `overflow` original, `inert` ausente em WebView antigo (cai em `aria-hidden` + o trap de Tab), e desmontagem abrupta (nada em estado React, tudo no cleanup do efeito, contagens saneadas com `Math.max(0, …)`). O hook **não** desenha véu — cada diálogo continua dono do próprio véu.

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
- `useProgressTracking(gameState)` — usa o hook interno `useTodayKey` (recalcula `today` em `resetSignal` mudando, `visibilitychange` e `focus`, nunca por ticker) para derivar `todayWeekDay`, `dailyTotal` (= `dailyGoalFor`, NUNCA o cadastro cru), `dailyDone` (`doneWeightFor` com teto em `dailyTotal` — não existe "mais que 100%"), `progress` (0–100, considerando passo como concluído só quando TODOS os passos da atividade fecham) e `todayAttributes` (soma virus/data/vaccine das atividades completas hoje, via `CATEGORY_ATTRIBUTES`).
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

### `src/contexts/GameStateContext.tsx` (1463 linhas — `wc -l src/contexts/GameStateContext.tsx`, 10/09/2026, corrigido de "1464" por doc-verificador)
**Dono de:** o `GameState` inteiro (tipo + valor inicial + hidratação de save + persistência local e na nuvem). É o maior contexto do app e a única fonte do estado do jogo.
**Exports:**
- `migrateDecor(loaded)` — save antigo guardava UMA decoração (`equippedFurniture`, badge de canto); a migração devolve o mapa `equippedDecor` novo, colocando o item antigo no espaço (`slot`) que ele declara. Roda uma vez no load; checa a PRESENÇA de `equippedDecor` (não se está vazio) para não confundir "nunca migrou" com "desequipou tudo".
- `Step`, `Activity`, `Task`, `CompletedTask`, `ActivityStats` — interfaces de dados do jogo. `Activity` é o contrato de CONSTÂNCIA (hábito); `Task` é o contrato de EXECUÇÃO (tarefa pontual) — campos novos de `Task` são todos opcionais com padrão seguro (save antigo lê `effort:1`, `status:'open'`, sem `daysStale`), para não assombrar em massa o backlog de quem só atualizou o app.
- `GameState` — a interface do save inteiro (88 campos de topo — `sed -n '160,506p' src/contexts/GameStateContext.tsx | grep -cE '^  [A-Za-z_][A-Za-z0-9_]*\??:'`, 10/09/2026, corrigido de "110" por doc-verificador; ver `docs/manual/07-DADOS-E-SAVE.md` para a lista — se aquele doc ainda citar "110", a divergência é dele, não deste arquivo). `demoCharacterId` aceita 6 ids desde 15/09/2026 (`c11dc49d`; `'kaelen' | 'orrin' | 'thalindra' | 'igni' | 'nautilu' | 'astrase'`; eram só os 3 primeiros).
- `getMaxHPForStage(stage)` — `MAX_HP_BY_FORM[getStageLevel(stage)]`.
- `CLOUD_SAVE_DEBOUNCE_MS = 3000` — debounce de CAUDA do cloud save; reinicia a cada mutação. Medido: colapsa ~23 mutações de uma sessão cheia em ~14 POSTs.
- `CLOUD_SAVE_MAX_WAIT_MS = 15000` — teto absoluto de espera (R-4): sem ele, um fluxo sustentado de mutações a menos de 3s de distância nunca dispara o POST e o cloud save para em silêncio.
- `GameStateProvider({ children })` — inicializa o estado lendo `STORAGE_KEYS.GAME_STATE` do `localStorage` (via `readLocal`/`safeStorage`, nunca lança — save corrompido, storage bloqueado ou array/primitivo no lugar de objeto caem em `freshGameState()`), monta um `useEffect` que grava local a cada mudança e agenda o cloud save com o debounce de cauda + teto R-4, avisa o jogador (toast, uma vez por classe de falha por sessão) quando o save falha, e publica o perfil público (`pushProfile`) só se `pvpEnabled`. Trata a recusa de PvP do servidor (`resposta.pvpBlocked === true`) desligando `pvpEnabled` localmente — o único `setGameState` permitido dentro do `.then` do save, porque fecha a porta do próprio `if` em vez de reabrir o ciclo (comentário R-1 explica por que não viola a proibição de `setGameState` no callback de save).
- `useGameState()` — `useContext(GameStateContext)`, lança se usado fora do provider.

⚠️ **`hydrateRest` descartava `dreamDates` a cada load, achado em 20/09/2026** (WP4.10, a data da PRIMEIRA coleta de cada sonho): `collectDream` carimbava a data, o save gravava, e a próxima abertura do app apagava de novo — o "#NN · data" do Dex nunca ficava persistido. Desde `8bc55437` (20/09/2026) `hydrateRest` preserva só entradas string→string não vazias de `raw.dreamDates`; o resto some, mas nunca vira data inventada.

**Chamado por:** `useGameState` tem 2 consumidores fora deste arquivo — `src/App.tsx` e `src/main.tsx` (monta o `GameStateProvider`). `getMaxHPForStage`, `migrateDecor` e as interfaces (`Activity`, `Task`, …) são importados por dezenas de componentes em `src/components/`.
**Régua:** `src/contexts/GameStateContext.bond.test.tsx`, `.careCaps.test.tsx`, `.cloudErrors.test.tsx`, `.hostile.test.tsx`, `.hydrate.fuzz.test.tsx`, `.legacySave.test.tsx`, `.pvpBlocked.test.tsx`, `.saveContent.test.tsx`, `.storage.test.tsx`, `migrateDecor.test.ts`.
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

### `src/types/attributes.ts`
**Dono de:** os três atributos do jogo (Poder/Harmonia/Benevolência — internamente `virus`/`data`/`vaccine`), a cor e o rótulo canônicos de cada um, e o mapeamento categoria de atividade → atributo/galho de evolução.
**Exports:**
- `AttributePoints`, `ActivityCategory` — tipos base.
- `ALIGN_TO_ATTR` — alinhamento do oráculo → galho de evolução; era um mapa local de `EvolutionPath`, virou compartilhado quando `EvoTrail` da Home passou a precisar dele.
- `CATEGORY_ATTRIBUTES` — quanto cada categoria de atividade rende em cada atributo.
- `XP_THRESHOLDS` — limiares de XP.
- `BranchType` — o galho (`virus`/`data`/`vaccine`).
- `ATTR_COLOR` — FONTE ÚNICA DA VERDADE da cor de cada atributo; nenhuma tela deve redeclarar.
- `ATTR_LABEL` — FONTE ÚNICA DA VERDADE do nome que o jogador vê (os ids internos `virus`/`data`/`vaccine` são herdados do fork e nunca aparecem na UI).
- `ATTR_INK` — a mesma cor de `ATTR_COLOR`, na luminosidade que passa 4,5:1 como texto, por tema (resolvida via variável CSS).
- `ATTR_ON_FILL_INK` — tinta escura para texto por cima de um preenchimento de atributo (mede 5,4–7,0:1 contra os 2,4–3,1:1 do branco).
- `EvolutionBranch`, `EVOLUTION_BRANCHES` — os três galhos como dado estruturado.
**Chamado por:** 24 arquivos (`grep -rl "from '.*/attributes'" src | wc -l`, 10/09/2026 — corrigido de "23" por doc-verificador) — entre eles `TaskEditModal.tsx`, `ItemsWindow.tsx`, `PlayerDetailModal.tsx`, `StatsPage.tsx`, `EvoTrail.tsx`, `CreateModal.tsx`.
**Régua:** cobertura indireta via testes de render dos componentes que o usam; nenhum `attributes.test.ts` próprio.
**Avisos do arquivo:** `ATTR_LABEL` — "este comentário..." (nota sobre não expor `virus`/`data`/`vaccine` na UI).

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
- `getStageLevel(stageId)` — nível do estágio a partir do prefixo do id (`'champion-virus'` → `'champion'`); id fora do esquema cai em `'rookie'`.
- `getStageBranch(stageId)` — atributo (`virus`/`data`/`vaccine`) embutido no id, se houver.
- `getMaxEnergyForStage(stageId)` — energia máxima = `FORM_REQUIREMENTS.required` do estágio.
- `canSelectWeekdays(...)`, `AVAILABLE_BRANCHES`, `AvailableBranch`, `clampBranch(...)` — auxiliares de seleção de galho.
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
