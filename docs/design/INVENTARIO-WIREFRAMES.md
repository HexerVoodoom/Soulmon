# Inventário de wireframes do Soulmon

> **Dono:** `soulmon-screen-cartographer` · **Data:** 13/09/2026 · **Fase:** SQUAD-DESIGN, Fase 1
> **Fonte:** [`../manual/03-FLUXO-DE-TELAS.md`](../manual/03-FLUXO-DE-TELAS.md) (09/09/2026, verificado em 10/09/2026 — 1133 linhas: §1 navegação, §2 onboarding passo a passo, §3 as duas filas, §4 as 40 superfícies, §5 fora do app, §6 divergências), cruzado com [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md) (**medição por percurso real de 19/08/2026**, 114 superfícies contadas, app rodando em `localhost:3001`).
> **Precedência:** onde os dois discordam, **o `03` manda** — e a divergência está anotada na linha ou na §3. Acima dos dois: código > teste > `CLAUDE.md` > manual.
> **Não cobre:** aparência (cor, tipografia, espaçamento, tokens `--sm2-*`) — é do `04-IDENTIDADE-VISUAL.md` e da Fase 2; as REGRAS que as telas aplicam — são do `02-REGRAS-DE-NEGOCIO.md`; **o que cada wireframe deve mostrar** — é do `design-wireframer` e do `PRINCIPIOS-DE-WIREFRAME.md`; percurso novo com o app rodando — **não foi feito** (por briefing: mede-se o documento, que já cita o código).

---

## 0. Como ler

**O que este documento é.** A lista fechada do que a Fase 1 vai desenhar. `CONTRACT.md`:
*"Nada se desenha fora do inventário."* Uma superfície que não tem linha aqui não vira
artboard; uma que tem linha e não for desenhada aparece como pendência no `status`.

**Uma linha = um artboard.** A unidade é **tela × estado**, não componente. `EvolutionPath`
travado e destravado são duas linhas porque são dois desenhos (W3: *"um wireframe só do caso
feliz não está pronto"*).

**Só estado que EXISTE.** Cada linha de estado cita a condição **do `03`** — o símbolo, a
expressão ou a constante que o faz aparecer. Onde a condição é regra e não código de tela,
está dito. Não inventei estado "para completar a matriz": onde o `03` não mede, a linha diz
`medição faltando` e vai para a §3.

**Referência por SÍMBOLO, nunca `arquivo:linha`.** Regra do `CLAUDE.md`: o endereço apodrece
mais rápido que o número, e um `grep` pelo símbolo reencontra o alvo.

**Demo × pago são estados distintos** sempre que o `03` distingue — são seis pontos de
`UnlockNudge` medidos em 09/09/2026, mais o `variant` da página de Evolução, mais o fallback
de sprite do `BirthCard`, mais o `capIsDemoBoundary` do `CreateModal`/`EditModal`.

**Onde um componente aparece dentro de outro.** Para não duplicar artboard, vale a regra:
a **composição da página** fica no fluxo da página; o **átomo e seus modais** ficam no fluxo
que os possui. Então a Home desenha a página, o pet e o slot de avisos; **Atividades** desenha
a linha de ritual, os metadados e os modais de tarefa, que aparecem dentro da Home. O mesmo
vale para o `UnlockNudge`: uma linha própria em Conta (com os seis pontos) e um **estado**
`demo` em cada tela que o hospeda.

**Os dez fluxos** são os do `CONTRACT.md` §Regras de despacho, um canvas cada. Duas
observações de nomenclatura, medidas:

- O fluxo **Jogos** é a página `currentView === 'games'`, cujo componente se chama
  `ActivitiesPage` e cujo rótulo na barra virou **"Jogos"/"Games"** em 09/09/2026 — o
  `03` §1.2 registra os dois motivos. **`ActivitiesPage` não é a tela de atividades.**
- O fluxo **Atividades** é o motor de tarefas (`RitualPanel`, `RitualRow`, `TaskMeta`,
  `CreateModal`, `TriagePile`…), que mora **dentro da Home**. Não tem `currentView` próprio.

**Prioridade (W5 — frequência manda na ordem).** `P0` = todo dia, por todo jogador
(Home, lista, rituais diários, chrome de navegação). `P1` = semanal ou de alta carga
(evolução, jogos, loja, primeira semana). `P2` = raro, uma vez na vida ou fora do app
(oráculo, conta, memórias, overlay, widgets). A leitura declarada do onboarding está na
§3 — ela é a única em que W5 sozinho não decide.

**Coluna `estado do wireframe`:** `a desenhar` → `desenhado` → `criticado` → `aprovado`,
ou `fora`. Hoje **tudo é `a desenhar`** — nenhum canvas existe (`docs/design/wireframes/`
está vazio em 13/09/2026).

---

## 1. Tabela-mestra

### 1.1 Home

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `HOME-01` | Home | Home (`currentView === 'main'`) | normal — com atividades cadastradas | célula 1 da `BottomNav`; valor inicial de `currentView` | qualquer célula da barra | P0 | aprovado |
| `HOME-02` | Home | Home | vazio — `emptyMessage={total === 0 ? t.main.noActivityRegistered : undefined}` | idem | `handleAddNewActivity` | P0 | aprovado |
| `HOME-03` | Home | Home | primeira-vez — `FirstDayCard` no slot, sem `PlayCard` (`jaConcluiuAlgo` falso), sem `EvoTrail` (`soulmonStages` vazio) | fim do `GameTutorialFlow` | — | P0 | aprovado |
| `HOME-04` | Home | Home | carregando — `Suspense` com `<ScreenSkeleton>` | navegação para página `lazy()` | — | P0 | aprovado |
| `HOME-05` | Home | Home | sem métricas — `hideMetrics={gameState.rest?.hideMetrics === true}` | switch do `RestWindowCard` | — | P1 | aprovado |
| `HOME-06` | Home | `HomeHud` | normal — wordmark (`<h1>` da Home), energia e vida | montado sempre | — | P0 | aprovado |
| `HOME-07` | Home | `HomeHud` | selo do dia — `focusSealed` = `focoDoDiaCompleto` (binário) | as 3 do foco concluídas | — | P0 | aprovado |
| `HOME-08` | Home | `HomeHud` | medidores ocultos — modo `hideMeters` | idem `HOME-05` | — | P1 | aprovado |
| `HOME-09` | Home | slot de avisos (fila 2) | colapsado — renderiza `avisos[0]`, resto vira `+N` (`resto = avisos.length - 1`) | IIFE do `App.tsx` | expande | P0 | aprovado |
| `HOME-10` | Home | slot de avisos | expandido — `avisosAbertos` | toque no `+N` | colapsa | P0 | aprovado |
| `HOME-11` | Home | `FirstDayCard` | normal — `shouldShowFirstDay(gameState.firstDay, playerDayKey(...))`; 3 gestos de `FIRST_DAY_GESTURES` | aviso 0 da fila 2 | some na virada (não tem botão de fechar) | P0 | aprovado |
| `HOME-12` | Home | `FirstDayCard` | parcial — `!allGesturesDone(p)` com gestos já feitos; **não dá prêmio, não abre modal, não cobra** | idem | idem | P0 | aprovado |
| `HOME-13` | Home | aviso de HP (bloco `sm2-notice-warn` inline) | normal — `healthPoints <= 1 && > 0 && dailyDone < hpSafeToday && !hpBannerDismissed` | aviso 1 da fila 2 | `hpBannerDismissed` | P1 | aprovado |
| `HOME-14` | Home | aviso de triagem (botão "Arrumar a pilha") | normal — `triageQueue(gameState.tasks, agoraA).length > 0` | aviso 3 da fila 2 | `handleOpenTriage` → `ATIV-22` | P0 | aprovado |
| `HOME-15` | Home | priming de push (seção inline) | normal — `mostrarPrimingDePush` (`shouldPrimePush`); "Pode sim" ou "Agora não" | aviso 4 da fila 2 | resposta do jogador | P1 | aprovado |
| `HOME-16` | Home | aviso de recomeço (bloco `sm2-notice` inline) | normal — `freshStartDismissed ? null : freshStartOffer(gameState, agoraA, language)` | aviso 5 da fila 2 | `freshStartDismissed` | P1 | aprovado |
| `HOME-17` | Home | `CompanionHUD` | normal — pet acordado, deck de 4 ações (`div.sm2-deck`, `role="group"`) | montado o tempo todo na Home | não navega | P0 | aprovado |
| `HOME-18` | Home | `CompanionHUD` | carinho em curso — `<button className="sm2-rub">`, `onPointerDown/Move/Up`; teclado roda ciclo de 2 s | gesto sobre o sprite | `onPet` → `handlePet` | P0 | aprovado |
| `HOME-19` | Home | `CompanionHUD` | dormindo — `isSleeping` troca a ação de dormir por acordar | ação `sleep` do deck | idem | P0 | aprovado |
| `HOME-20` | Home | `CompanionHUD` | assombrado — `hauntedWatching` acrescenta `sm-pet-haunted`; **gesto, sem texto junto** | tarefa vencida ou parada `HAUNTED_AFTER_DAYS` | — | P1 | aprovado |
| `HOME-21` | Home | `CompanionHUD` | itens novos — `hasNewItems` acende o selo do botão de itens | compra ou drop | `handleOpenItems` | P1 | aprovado |
| `HOME-22` | Home | `CompanionHUD` | pode evoluir — `{canEvolve && !isSleeping && (…)}` monta o botão "Evoluir" | barra cheia e cadeado aberto | `onEvolveRequest` → `EVO-13` | P1 | aprovado |
| `HOME-23` | Home | `CompanionHUD` | banho em espera — `disabled: showerCooldown` (5 s contra toque duplo; **não é gate de regra**) | ação `bath` | `handleShowerClick` | P1 | aprovado |
| `HOME-24` | Home | área do pet com cocô | normal — agendamento de `useCareSystem` (polling 10 s) | virada do relógio de cocô | `cleanPoop` pelo banho | P1 | aprovado |
| `HOME-25` | Home | `ChatBox` | normal — sem texto, mic otimista (`micDisponivel` nasce `null`) | montada dentro do `CompanionHUD` | não navega | P0 | aprovado |
| `HOME-26` | Home | `ChatBox` | com texto — o botão único vira enviar (`hasText ... ? handleSendMessage : handleMicClick`) | digitação | `handleSendMessage` | P0 | aprovado |
| `HOME-27` | Home | `ChatBox` | sem transcrição — `micDisponivel === false`: o `<button>` **continua no DOM**, vira glifo `send`, com `aria-disabled` sem texto | resposta de `fetchServerConfig` | — | P1 | aprovado |
| `HOME-28` | Home | `ChatBox` | gravando — `isRecording` → `stop_circle` em tom `danger` | `handleMicClick` | envio ou parada | P1 | aprovado |
| `HOME-29` | Home | `ChatBox` | carregando — `isLoading` → glifo `sync` girando | envio | resposta | P1 | aprovado |
| `HOME-30` | Home | `ChatBox` | permissão negada — o pet fala "Não consegui acessar o microfone. Dá para escrever aqui do mesmo jeito 🎤" | recusa do sistema | — | P1 | aprovado |
| `HOME-31` | Home | `PlayCard` | disponível — `{jaConcluiuAlgo && (…)}` e `canPlay` (energia ≥ `PLAY_ENERGY_COST`) | cartão na Home | não navega | P1 | aprovado |
| `HOME-32` | Home | `PlayCard` | já brincou — `playedToday` | idem | — | P1 | aprovado |
| `HOME-33` | Home | `PlayCard` | com efeito — `buff` | idem | — | P2 | aprovado |
| `HOME-34` | Home | `EvoTrail` | normal — `(gameState.soulmonStages?.length ?? 0) > 0` | trilha na Home | `onOpen` → `setCurrentView('evolution')` | P1 | aprovado |
| `HOME-35` | Home | seletor de comida | normal — `setFeedOpen(true)` pela ação `feed` do deck; `ModalSheet` "Alimentar"/"Feed" com a grade de `foodStock` (`n > 0 && !isSpecialItem(emoji)`, ordenada por quantidade), célula de 72px com arte/emoji + `×N`, e a dica "+1 de energia e pontos de atributo". **Medido em 13/09/2026** → `03` §4.2a | ação `feed` | `handleDeckFeed` fecha a folha e chama `handleFeed` | P0 | aprovado |
| `HOME-36` | Home | seletor de comida | recusa por teto — `FOOD_LIMIT_PER_HOUR` (= `MAX_STAGE_REQUIREMENT`) sobre `careCaps.feedTimes`. ⚠️ **não é uma tela**: a folha JÁ fechou; `setFullSignal(n => n + 1)` faz o pet falar por 3500 ms, **sem toast, sem modal e sem decrementar o item**. O artboard é o estado do pet, não do seletor. **Medido em 13/09/2026** → `03` §4.2a | idem | — | P1 | aprovado |
| `HOME-37` | Home | `ItemsWindow` (pastinha) | normal — `{showItemsWindow && (…)}`; `handleOpenItems` **alterna** e zera `newItemsReady` | botão `items` do deck | alterna | P1 | aprovado |
| `HOME-38` | Home | `ItemsWindow` | vazio — `items.length === 0` (`Object.entries(foodInventory).filter(([, c]) => c > 0)`): **ilustração, não texto cru** — `mascot-raven.png` 72×72 em `opacity: .85` + "Sua pastinha está vazia. Conclua uma atividade para ganhar comida.", e **sem rodapé** (o `footer` só existe com `detail`). **Medido em 13/09/2026** → `03` §4.2b | idem | — | P1 | aprovado |
| `HOME-39` | Home | `ItemsWindow` | uso de item especial — toque seleciona (borda `--sm2-primary-ink`) e o **rodapé** traz nome + `effectLine` + "Usar"; `use()` chama `onFeed` e limpa a seleção, **sem fechar a folha**. Três recusas com três canais distintos: `'daily-cap'` (🌀) = **toast** e o item continua na grade, `'already-full'` (💗) = **fala do pet** (`healCapSignal`), `'no-stock'` = **silêncio**. **Medido em 13/09/2026** → `03` §4.2b | toque no item | — | P2 | aprovado |
| `HOME-40` | Home | `BottomNav` | normal — 4 destinos + menu sanduíche (teto declarado no cabeçalho do componente) | sempre montada | as cinco células | P0 | aprovado |
| `HOME-41` | Home | `BottomNav` | célula ativa — seleção é **sublinhado ciano**, nunca placa preenchida (regra de UI do `CLAUDE.md`) | navegação | — | P0 | aprovado |
| `HOME-42` | Home | menu sanduíche (popover) | normal — 4 `MenuRow`: Biblioteca, Créditos (`onOpenCredits`, só se a prop existir), Configurações, "Refazer o ritual" (`onResetOnboarding`, idem) | célula 5 | `library` · `creditsOpen` · `settings` · `ConfirmDialog` | P0 | aprovado |
| `HOME-43` | Home | "Pular para o conteúdo" | normal — `<a href="#conteudo">`, primeiro nó focável do documento | foco por teclado | `<main tabIndex={-1}>` | P1 | aprovado |
| `HOME-44` | Home | `OfflineSeal` | offline — acende pelos eventos `online`/`offline`; **não bloqueia nada** | raiz do `App`, sempre | — | P1 | aprovado |
| `HOME-45` | Home | `Toaster` (sonner) | aviso de uma linha — último nó do `App` | qualquer ação que avise | — | P1 | aprovado |
| `HOME-46` | Home | `ScreenSkeleton` | carregando — `Suspense fallback` de toda página `lazy()`. ⚰️ substituiu os `fallback={null}` (13 pontos medidos em 19/08/2026) que deixavam a tela **em branco** | navegação | a página | P0 | aprovado |
| `HOME-47` | Home | `ErrorBoundary` | erro — `getDerivedStateFromError` troca a tela pelo fallback; loga só em `DEV` | envolve a árvore em `main.tsx` | — | P1 | aprovado |
| `HOME-48` | Home | região `aria-live` do visor | anúncio — `spriteText('tuned', language)` quando `visorAnunciou` | sintonia do visor | — | P2 | aprovado |

### 1.2 Atividades (o motor de tarefas — mora dentro da Home)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `ATIV-01` | Atividades | `RitualPanel` | vazio — `emptyMessage` | Home | `+ Nova atividade` | P0 | aprovado |
| `ATIV-02` | Atividades | `RitualPanel` | parcial — `done`/`total` do dia | Home | — | P0 | aprovado |
| `ATIV-03` | Atividades | `RitualPanel` | completo — meta do dia cumprida | Home | — | P0 | aprovado |
| `ATIV-04` | Atividades | `RitualRow` (tarefa) + `TaskMeta` | normal — por tarefa ativa | `RitualPanel` | conclusão ou lápis | P0 | aprovado |
| `ATIV-05` | Atividades | `RitualRow` (tarefa) | concluída — `completeTask` remove a tarefa de `tasks` | toque | — | P0 | aprovado |
| `ATIV-06` | Atividades | `RitualRow` (hábito) + `StepRow` + `HabitConstancy` | normal — por hábito devido hoje | `RitualPanel` | `handleToggleActivityCompletion` | P0 | aprovado |
| `ATIV-07` | Atividades | `RitualRow` (hábito) | fora do dia — `dimmed={!disponivelHoje}`, **etapas inertes** | `isDueOn` falso | — | P0 | aprovado |
| `ATIV-08` | Atividades | `TaskMeta` | normal — prazo e esforço (`effort` 1–3) | dentro da linha | `handleEditTask` | P0 | aprovado |
| `ATIV-09` | Atividades | `TaskMeta` | adiada — contador visível; em `POSTPONE_NUDGE_AT` (3) chama o nudge | `handlePostponeNudge` | `ATIV-20` | P1 | aprovado |
| `ATIV-10` | Atividades | `TaskMeta` | assombrada — vencida ou parada há `HAUNTED_AFTER_DAYS` (7): esmaece + partícula escura; **`someday`/`dropped` nunca assombram** | idade da tarefa | conclusão com bônus de alívio | P1 | aprovado |
| `ATIV-11` | Atividades | `HabitConstancy` | normal — "N das últimas 7" (`CONSTANCY_WINDOW_DAYS`), **nunca percentual cru** | dentro da linha de hábito | — | P0 | aprovado |
| `ATIV-12` | Atividades | `HabitConstancy` | sem métricas — `hideMetrics={gameState.rest?.hideMetrics === true}`; **as recompensas ficam** | switch de Configurações | — | P1 | aprovado |
| `ATIV-13` | Atividades | `HabitConstancy` | marco — tier `seed → sprout → sapling → tree` (`HABIT_MILESTONES` 7/21/66), ícone evolui na lista | dias efetivos | `RIT-18` | P1 | aprovado |
| `ATIV-14` | Atividades | `QuickAddBar` | normal — sempre acima do painel | Home | `onCommit={handleQuickAdd}` | P0 | aprovado |
| `ATIV-15` | Atividades | `CreateModal` | normal — `{createModalOpen && (…)}` | CTA `+ Nova atividade` (`handleAddNewActivity`) e `EvolveTaskModal.onCreateTask` | `onClose` | P0 | aprovado |
| `ATIV-16` | Atividades | `CreateModal` | **demo no teto** — `capIsDemoBoundary={gameState.accountTier === 'demo'}` monta `UnlockNudge` (`reason` `task-limit`) | idem | `onUnlock` → `setUnlockReason('task-limit')` | P1 | aprovado |
| `ATIV-17` | Atividades | `EditModal` | normal — `{editModalOpen && (…)}` | lápis da atividade (`handleEditActivity`) | `onClose` limpa `editModalOpen` e `editingActivity` | P0 | aprovado |
| `ATIV-18` | Atividades | `EditModal` | **demo no teto** — também monta o `UnlockNudge`: era **o caminho que contornava o cap** (o botão principal de criar da tela inicial abre o `EditModal`) | idem | `setUnlockReason('task-limit')` | P1 | aprovado |
| `ATIV-19` | Atividades | `TaskEditModal` | normal — `{taskEditModalOpen && (…)}`, com `editingTask` | lápis da tarefa (`handleEditTask`) | `onClose` | P0 | aprovado |
| `ATIV-20` | Atividades | `PostponeNudgeSheet` (dentro do `App.tsx`) | normal — `task={nudgeTaskId ? … : null}`; três saídas: decompor, encolher (`shrink` rebaixa o `effort` e **zera o contador**), deixar pra lá | `TaskMeta` → `handlePostponeNudge` | `handleCloseNudge` | P1 | aprovado |
| `ATIV-21` | Atividades | `BalanceWeekModal` | normal — `{balanceOpen && (…)}` | botão "Equilibrar minha semana" | `onClose` | P1 | aprovado |
| `ATIV-22` | Atividades | `TriagePile` | fila — `interstitial === 'triage' && triageTasks`; a fila é **congelada** ao abrir (`setTriageTasks(triageQueue(…))`) para o contador não mentir | botão "Arrumar a pilha" → `handleOpenTriage` | `handleTriageResolve` | P1 | aprovado |
| `ATIV-23` | Atividades | `TriagePile` | carta — 4 ações de **peso igual** (`TriageAction = 'today' \&#124; 'week' \&#124; 'someday' \&#124; 'drop'`) | idem | `toOpen` · `postpone` · `toSomeday` · `drop` | P1 | aprovado |
| `ATIV-24` | Atividades | `TriagePile` | fim da fila — terminar rende recompensa (planejar é o que alivia) | última carta | `onClose={() => setTriageTasks(null)}` | P1 | aprovado |
| `ATIV-25` | Atividades | gaveta "Guardadas" | fechada — `{guardadas.length > 0 && (…)}`, um `<details>` **fechado por padrão** | Home | abre | P1 | aprovado |
| `ATIV-26` | Atividades | gaveta "Guardadas" | aberta — `someday` e `dropped`, com o botão "Retomar" (`handleRestoreTask`) | toque | `handleRestoreTask` | P1 | aprovado |
| `ATIV-27` | Atividades | botão "Equilibrar minha semana" | normal — `{podeEquilibrar && (…)}` | Home | `setBalanceOpen(true)` | P1 | aprovado |

### 1.3 Onboarding

> Os passos negativos existem **para não renumerar o ritual** — a mesma razão declarada de
> `DEMO_PICK`. Os números 1..5 e 6..11 vêm de constantes derivadas
> (`QUIZ_START = FAVORITE_STEP + 1`, `QUIZ_END = QUIZ_START + ORACLE_QUESTIONS.length`), não
> de literais. As 6 perguntas do ritual e os 20 itens psicométricos são **um template cada**,
> não 26 artboards — a medição de 19/08/2026 já separava "42 superfícies" de "16 templates".

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `ONB-01` | Onboarding | splash estática (`#splash` do `index.html`) | normal — HTML puro, pintado **antes** do bundle; nada é clicável | carregar a página | `remover()` do `main.tsx` (rAF duplo + `setTimeout(1200)` fora do rAF, como rede de segurança) | P2 | aprovado |
| `ONB-02` | Onboarding | splash estática | **erro de WebView** — o `<script>` inline testa `CSS.supports('color','oklch(0 0 0)')` e `color-mix`; falhando, monta aviso bilíngue no `#root` **e remove a splash** | idem | nada (é terminal) | P2 | aprovado |
| `ONB-03` | Onboarding | `IntroScreen` | normal — vídeo de marca; tocar (`skip`) reagenda a saída para 400 ms | `showIntro` nasce `true` | `onFinish` → `setShowIntro(false)` | P2 | aprovado |
| `ONB-04` | Onboarding | `IntroScreen` | erro — `onError` do `<video>` liga `videoFailed`: mascote + wordmark sobre gradiente, `scheduleFinish(1500)` | idem | idem | P2 | aprovado |
| `ONB-05` | Onboarding | `IDENTITY_STEP` (−6) | carregando — `authEmail === null` (ainda não se sabe; checagem assíncrona) | passo inicial do ritual | — | P1 | aprovado |
| `ONB-06` | Onboarding | `IDENTITY_STEP` | normal — `authEmail === ''` (deslogado): "Continue with Google" ou "New User" | idem | `GOOGLE_STEP` · `EMAIL_STEP` | P1 | aprovado |
| `ONB-07` | Onboarding | `IDENTITY_STEP` | ocupado — `authOcupado` desabilita o botão | toque | — | P1 | aprovado |
| `ONB-08` | Onboarding | `IDENTITY_STEP` | erro — `textoErroAuth`, tabelado nos dois idiomas (`popup-bloqueado`, `dominio-nao-autorizado`, `sem-resposta`, …) | falha de auth | volta ao portão | P1 | aprovado |
| `ONB-09` | Onboarding | `IDENTITY_STEP` | sem Firebase — `aoContinuarSemConta`: "falta de configuração vira ausência de conta, **nunca porta trancada**"; aceite e 18+ continuam obrigatórios (`podeAutenticar`) | ambiente sem config | `GOAL_STEP` | P1 | aprovado |
| `ONB-10` | Onboarding | `GOOGLE_STEP` (−9) | normal — aceite dos Termos + 18+, então o pop-up | portão | `aposAutenticar` grava e-mail, carimba `ConsentRecord`, `setStep(GOAL_STEP)` | P1 | aprovado |
| `ONB-11` | Onboarding | `GOOGLE_STEP` | sem resposta — `GOOGLE_SEM_RESPOSTA_MS` (120 000 ms): o botão volta com mensagem honesta, **sem cancelar a promessa original** | 2 min sem retorno | — | P1 | aprovado |
| `ONB-12` | Onboarding | `EMAIL_STEP` (−8) | normal — e-mail + senha, aceite e 18+ | portão | `aposAutenticar` · `back` volta ao portão | P1 | aprovado |
| `ONB-13` | Onboarding | `EMAIL_STEP` | rascunho retomado — `readGateDraft()` devolve objetivo, dificuldade e aceite quando o link de e-mail levou a pessoa para fora e a página recarregou | volta do link | — | P2 | fora |
| `ONB-14` | Onboarding | `GOAL_STEP` (−2) | normal — "por que você quer mudar" (`soulGoal`); **pulável** (botão que limpa o campo e chama `next()`) | depois de autenticar | `STRUGGLE_STEP` | P1 | aprovado |
| `ONB-15` | Onboarding | `STRUGGLE_STEP` (−3) | normal — "o que te atrapalha" (`soulStruggle`); **pulável**, idem | `GOAL_STEP` | `CHOICE_STEP` | P1 | aprovado |
| `ONB-16` | Onboarding | `CHOICE_STEP` (−7) | normal — "Começar agora — é grátis" (`setFlow('demo')`) × "Quero o completo — `precoLabel`" (`handleUnlockFull`) | `STRUGGLE_STEP` | `DEMO_PICK` · passo 1 | P1 | aprovado |
| `ONB-17` | Onboarding | `CHOICE_STEP` | compra indisponível — `!isBillingAvailable()`: "A compra está disponível no app Android (Google Play)…" e **nada acontece** | toque no completo | — | P1 | aprovado |
| `ONB-18` | Onboarding | `CHOICE_STEP` | recusa por login — `authUsavel && !authEmail`: "Entre com seu e-mail antes de comprar" (a compra manda o `saveId` como `obfuscatedAccountId`) | idem | portão | P1 | aprovado |
| `ONB-19` | Onboarding | `CHOICE_STEP` | compra recusada — `setUnlockMessage`, com texto próprio para `result.reason === 'cancelled'` ("Compra cancelada.") e outro para o resto | retorno do billing | — | P1 | aprovado |
| `ONB-20` | Onboarding | `DEMO_PICK` (−1) | normal — os 3 personagens pré-prontos (`PREMADE_CHARACTERS`) | `CHOICE_STEP` grátis | `REGISTER` · `back` volta ao `CHOICE_STEP` | P1 | aprovado |
| `ONB-21` | Onboarding | `AGE_BLOCK` (−5) | muro de idade — saída **única**: `restartFromAgeBlock` | data de nascimento < 18 | reinício | P2 | aprovado |
| `ONB-22` | Onboarding | passo 1 — nome completo | normal — não pulável | `CHOICE_STEP` pago ou `mode='upgrade'` | passo 2 | P2 | aprovado |
| `ONB-23` | Onboarding | passo 2 — data de nascimento | normal — serve ao mapa astral **e** ao 18+ | passo 1 | passo 3 · `AGE_BLOCK` | P2 | aprovado |
| `ONB-24` | Onboarding | passo 3 — hora de nascimento | normal | passo 2 | passo 4 | P2 | aprovado |
| `ONB-25` | Onboarding | passo 4 — cidade (`CityPicker`) | normal — busca de cidade | passo 3 | `FAVORITE_STEP` | P2 | aprovado |
| `ONB-26` | Onboarding | `FAVORITE_STEP` (5) | normal — criatura favorita; **pulável** pela caixa "Prefiro não influenciar o resultado" | passo 4 | primeira pergunta do ritual | P2 | aprovado |
| `ONB-27` | Onboarding | pergunta do ritual (template, 6×: `QUIZ_START`..`QUIZ_END − 1`) | normal — **avança sozinha ao escolher**, não pulável. As 6 respostas entram na leitura nos DOIS caminhos | `FAVORITE_STEP` | `REFINE_OFFER` | P2 | aprovado |
| `ONB-28` | Onboarding | `REFINE_OFFER` (12) | normal — a bifurcação do teste longo, **declarada na tela como decisão SEM VOLTA** | 6ª pergunta | `DEEP_START` · `GENERATING` | P2 | aprovado |
| `ONB-29` | Onboarding | `REFINE_OFFER` | erro de geração — `generateError` renderiza um `role="alert"` **na bifurcação** | falha de `generate` | nova tentativa | P2 | aprovado |
| `ONB-30` | Onboarding | item psicométrico (template, 20×: `DEEP_START`..`DEEP_END − 1`) | normal — só para quem aceitou (`SOUL_TEST_ITEMS`) | `REFINE_OFFER` | `GENERATING` (`DEEP_END` = 33 é o próprio `GENERATING`) | P2 | aprovado |
| `ONB-31` | Onboarding | `GENERATING` | normal — tela de geração; **o rascunho nunca retoma aqui nem depois** (`readOracleDraft(mode, DEEP_END - 1)`) | fim do teste | `REVEAL` | P2 | aprovado |
| `ONB-32` | Onboarding | `REVEAL` | com sprite — nome + descrição + batismo; "Nascer `nome`" emite `track('reveal_seen', { has_sprite, funnel, duration })` | `GENERATING` | `REGISTER` ou `onRevealed` (upgrade) | P2 | aprovado |
| `ONB-33` | Onboarding | `REVEAL` | sem sprite — `REVEAL_WAIT_MS` (12 000 ms) é o **teto da espera**; passado ele o reveal segue só com texto e o desenho entra pelo acervo depois | espera estourada | idem | P2 | aprovado |
| `ONB-34` | Onboarding | `REGISTER` | **demo** — apelido **+ tonalidade** | `DEMO_PICK` | `onComplete` → `GameTutorialFlow` | P1 | aprovado |
| `ONB-35` | Onboarding | `REGISTER` | **pago** — apelido | `REVEAL` | idem | P2 | aprovado |
| `ONB-36` | Onboarding | barra de progresso do ritual | normal — `role="progressbar"`, montada sob `step > 0 && step <= lastStep` (**não existe nos passos negativos**) | transversal | — | P1 | aprovado |
| `ONB-37` | Onboarding | `SoulmonOnboarding mode='upgrade'` | entrada — `step` começa em `1`, `flow` já é `'oracle'`; **não há portão, `CHOICE_STEP`, `DEMO_PICK` nem `REGISTER`** | card da Evolução com `accountTier === 'paid'` e `demoCharacterId` → `setUpgradeRitual(true)` | `handleUpgradeRevealed` troca **só a criatura** | P2 | aprovado |
| `ONB-38` | Onboarding | `SoulmonOnboarding mode='upgrade'` | saída pela metade — `back()` no passo 1 chama `onCancel?.()` e volta ao jogo (a Evolução passa a mostrar o convite na variante `reveal`) | `back` no passo 1 | `setUpgradeRitual(false)` | P2 | aprovado |
| `ONB-44` | Onboarding | `REVEAL` **demo** [novo] | **o reveal demo** — decisão 13.19 (modal final de 15/09/2026): as 6 perguntas do ritual valem para todo mundo; o demo vê a leitura (nome, essência, descrição, silhueta) com a OFERTA da 13.1 (card dispensável, largura parcial, "agora não" com peso de primário); o sprite e a árvore só pagando; dispensar → `DEMO_PICK` e a leitura fica para o upgrade. ⚠️ não existe no código | 6ª pergunta no caminho grátis | oferta → `UnlockAccountModal` · × → `DEMO_PICK` | P1 | aprovado |
| `ONB-39` | Onboarding | `GameTutorialFlow` | conceito — `PAGES.length` = **1**: "Seu Soulmon nasceu!" / "Your Soulmon is born!" | portão `!hasCompletedTutorial` | `TASK_STEP` | P1 | aprovado |
| `ONB-40` | Onboarding | `GameTutorialFlow` · `TASK_STEP` | vazio — criação **obrigatória** da 1ª atividade: objetivo, `CATEGORIES` (8) e CTA travado | conceito | sugestões | P1 | aprovado |
| `ONB-41` | Onboarding | `GameTutorialFlow` · `TASK_STEP` | com sugestões — retorno da API | toque em sugerir | `onComplete(activities.slice(0, remaining))` → `handleCompleteTutorial` | P1 | aprovado |
| `ONB-42` | Onboarding | `GameTutorialFlow` · `TASK_STEP` | erro/offline — `fallbackTasks` devolve até 4 tarefas locais de dois minutos (`FALLBACK_BY_CATEGORY`) | falha de rede | idem | P1 | aprovado |
| `ONB-43` | Onboarding | `GameTutorialFlow` · `TASK_STEP` | primeira ordenação — `orderCategoriesForGoal` põe na frente a área que o `soulGoal` descreveu, **e o texto não sai do aparelho** (decisão D8) | `soulGoal` preenchido | idem | P1 | aprovado |

### 1.4 Rituais (as duas filas, o diário e as cerimônias)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `RIT-01` | Rituais | **fila 1 — intersticiais** (quadro de estrutura, não é tela) | ordem literal do `const interstitial`: triagem → relatório diário → check-in → sonho → pesadelo → welcome. **Um por vez**; quem está abaixo continua pendente e monta quando o de cima fecha — nada é descartado | `App.tsx` | — | P0 | aprovado |
| `RIT-02` | Rituais | **fila 2 — slot de avisos** (quadro de estrutura) | ordem dos `push`: `firstDay` → `hp` → `semanal` → `triagem` → `priming` → `recomeco`; renderiza só `avisos[0]`. **Superfície nova entra numa das duas filas, com posição declarada** | Home | `HOME-09`/`HOME-10` | P0 | aprovado |
| `RIT-03` | Rituais | `MorningCheckIn` | normal — `interstitial === 'checkIn' && checkInPlanData`; hábitos do dia, até `MAX_DAILY_FOCUS` (3) focos, humor | fila 1 | `onConfirm={handleCheckInConfirm}` | P0 | aprovado |
| `RIT-04` | Rituais | `MorningCheckIn` | pendências de ontem primeiro — `plan.carryOver` (Shutdown do Sunsama invertido: a dívida nunca fica invisível) | idem | idem | P0 | aprovado |
| `RIT-05` | Rituais | `MorningCheckIn` | sem tarefas para foco — o plano só monta se `habitsToday`, `suggestedFocus` ou `carryOver` tiver algo; o vazio de foco é interno. ⚠️ medição de 19/08/2026: "No tasks waiting. Today is habits only." | idem | idem | P0 | aprovado |
| `RIT-06` | Rituais | `MorningCheckIn` | oferta reduzida — `needsIntervention` (`MISS_INTERVENTION_AT` = 2 faltas); aceitar usa o **mesmo** caminho de conclusão (`onTinyHabit={handleToggleActivityCompletion}`) | 2ª falta seguida | idem | P0 | aprovado |
| `RIT-07` | Rituais | `MorningCheckIn` | pulado — `onSkip={handleCheckInSkip}` **marca o dia do mesmo jeito** (um ritual que reaparece por ter sido recusado é cobrança) | botão | fecha | P0 | aprovado |
| `RIT-08` | Rituais | `DailyReportModal` | normal — `interstitial === 'dailyReport' && gameState.lastDayReport`; trava de 1×/dia por `DAILY_REPORT_SHOWN` | fila 1 | `onClose` grava `markMemoryShown` **antes** e então `handleCloseDailyReport` | P0 | aprovado |
| `RIT-09` | Rituais | `DailyReportModal` | dia completo — o `soulGoal` volta | meta cumprida | idem | P0 | aprovado |
| `RIT-10` | Rituais | `DailyReportModal` | retorno de ausência — o `soulGoal` também volta (`ABSENCE_FORGIVENESS_DAYS`: quem volta encontra saudade, não fatura) | volta depois de ≥2 dias | idem | P0 | aprovado |
| `RIT-11` | Rituais | `DailyReportModal` | check-in de humor — 5 carinhas, `moodToday={moodFor(…)}` / `onPickMood={handlePickMood}`; **opcional e nunca alimenta pontuação** | dentro do relatório | `recordMood` | P0 | aprovado |
| `RIT-12` | Rituais | `DailyReportModal` | aventura da noite — `aventuraDaNoite` com `adventureIsNew` | houve aventura | `AdventureDiary` | P1 | aprovado |
| `RIT-13` | Rituais | `DailyReportModal` | memória — `MemoriesCard` sob `memories !== null`; `memoryToShow` compara por **igualdade**, então aparece uma vez em 30 e uma em 90 dias | marco de memória | — | P2 | aprovado |
| `RIT-14` | Rituais | `DailyReportModal` | **oferta (demo)** — `showOffer={ofereceNoRelatorio}`, com cap semanal por `offerShownWeek`, marcado **antes** de abrir; chama `setUnlockReason('report')` | `accountTier === 'demo'` | `CONTA-22` | P1 | aprovado |
| `RIT-15` | Rituais | `DailyReportModal` | recuperar corações — `onRecoverHearts` | item na pastinha | `applySpecialItem` | P1 | aprovado |
| `RIT-16` | Rituais | `MorningDream` | com sonho — `interstitial === 'dream' && morningDream`; guardas: `!isSleeping`, `4 ≤ hora < 12`, `rest` existe, noite registrada, `MORNING_DREAM_SHOWN` diferente | fila 1 | `onClose={() => setMorningDream(null)}` | P1 | aprovado |
| `RIT-17` | Rituais | `MorningDream` | sem sonho — `dream === null` → um bom-dia neutro. **Nenhuma variante julga a noite**: sem score, sem duração, sem nota | idem | idem | P1 | aprovado |
| `RIT-18` | Rituais | `WeeklyReportCard` | normal — `needsWeeklyReport(gameState, agoraA)`, checado por **SEMANA**, não por dia: constância por hábito, `effortDone`, categoria dominante, sonhos | aviso 2 da fila 2 | `onDismiss={handleDismissWeeklyReport}` | P1 | aprovado |
| `RIT-19` | Rituais | `WeeklyReportCard` | sem sugestão — `stackingSuggestion` devolve **`null`** sem dados suficientes, **e esse silêncio é a metade importante** | poucos dados | idem | P1 | aprovado |
| `RIT-20` | Rituais | `MilestoneCeremony` | normal — `{milestoneCeremony && (…)}`, **fora das duas filas, de propósito**; `zIndex: 300`, **espera o gesto** (`<button onClick={onDone}>`), com a data | hábito cruza `HABIT_MILESTONES` | `onDone` | P1 | aprovado |
| `RIT-21` | Rituais | `MilestoneCeremony` | **movimento reduzido** — `window.matchMedia?.('(prefers-reduced-motion: reduce)').matches` **só desliga animação e háptico**: a cerimônia é a mesma, com a mesma pausa | preferência do sistema | idem | P1 | aprovado |
| `RIT-22` | Rituais | `ProtectProgressModal` | normal — gate `{protectPrompt && interstitial === 'welcome' && (…)}`, que **substituiu a esperança depositada num `setTimeout(15 s)`**; guardas: onboarding e tutorial feitos, sem `USER_EMAIL`, ≥7 dias desde `PROTECT_PROMPT_AT`, `jaEvoluiu \&#124;\&#124; jaEngajou`. **Nunca bloqueia** | efeito do `App.tsx` | `onDismiss` (só adia) ou `onConfirm={handleProtectProgress}` | P2 | aprovado |
| `RIT-23` | Rituais | `WelcomePromptModal` | instalar a PWA — some com `Capacitor.isNativePlatform()`, com `display-mode: standalone`, com `PWA_INSTALL_DISMISSED` ou sem `beforeinstallprompt` (há `setTimeout(800)` antes de decidir) | último da fila 1 | `onClose` | P2 | aprovado |
| `RIT-24` | Rituais | `WelcomePromptModal` | notificações — exige `notificationsUnlocked`, alimentado por `jaConcluiuAlgo` | idem | permissão do sistema | P2 | aprovado |
| `RIT-25` | Rituais | `WelcomePromptModal` | as duas metades juntas — são **independentes**; quando nenhuma tem o que dizer ele devolve `null` (e é por isso que não dá para consultá-lo de fora) | idem | — | P2 | aprovado |
| `RIT-26` | Rituais | `FirstTaskCompletedPopup` (via `GamePopups`) | **uma vez na vida** — `showFirstTaskPopup`, guardado por `FIRST_TASK_POPUP_SHOWN` e por uma varredura (`anyStepCompleted` / `anyTaskCompleted`) | 1ª conclusão | fecha | P1 | aprovado |

### 1.4a Pet (a sub-aba Soulmon: ficha, coleção de sonhos, diário — canvas próprio por D1)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `PET-01` | Pet | `PetPage` (sub-aba Soulmon) | normal — as formas **já desbloqueadas** (nunca as futuras), descrição do oráculo, `classTitle` e as duas habilidades | chip "Soulmon" | os outros dois chips | P2 | aprovado |
| `PET-02` | Pet | `PetPage` | save legado sem `soulProfile` — simplesmente **não mostra habilidades** | save antigo | — | P2 | fora |
| `PET-03` | Pet | `DreamDex` | vazio — os 30 do `DREAM_CATALOG`, o não coletado é **silhueta, nunca "faltando"** | sub-aba Soulmon | — | P2 | aprovado |
| `PET-04` | Pet | `DreamDex` | parcial — `dexProgress` **só cresce**: barra de coleção, não de desempenho | noites na janela | — | P2 | aprovado |
| `PET-05` | Pet | `DreamDex` | completo — 30 de 30 | coleção cheia | — | P2 | aprovado |
| `PET-06` | Pet | `AdventureDiary` | vazio — `entries={gameState.adventures ?? []}` | sub-aba Soulmon | — | P2 | aprovado |
| `PET-07` | Pet | `AdventureDiary` | com entradas — **só o que já aconteceu; não mostra lacuna, de propósito** (o contrário do Dex) | aventuras | — | P2 | aprovado |
| `PET-08` | Pet | sub-aba Soulmon | carregando — cada um dos três blocos em `Suspense` com `<ScreenSkeleton language={language} />` | navegação | — | P2 | aprovado |

### 1.5 Evolução (a sub-aba Soulmon migrou para §1.4a — D1)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `EVO-01` | Evolução | fileira de sub-abas | normal — 3 chips sob `{(currentView === 'evolution' \&#124;\&#124; currentView === 'stats' \&#124;\&#124; currentView === 'pet') && (…)}`: "Evolução"/"Evolution", `Soulmon` (igual nos dois idiomas), "Estatísticas"/"Stats" | célula 3 da barra | `setCurrentView(view)` | P1 | aprovado |
| `EVO-02` | Evolução | `EvolutionPath` | normal — barra parcial, cadeado aberto | célula 3 (que também chama `contarMissao('evolve-view')`) ou `EvoTrail.onOpen` | chips | P1 | aprovado |
| `EVO-03` | Evolução | `EvolutionPath` | **travado** — toque na criatura atual alterna `evolutionLocked` (`onToggleEvolutionLock`); a cerimônia **não abre** e `canEvolve` é `false`, mas os `perfectDays` seguem acumulando | toque na criatura ou botão de 44px | — | P1 | aprovado |
| `EVO-04` | Evolução | `EvolutionPath` | **destravado com barra cheia** — quem dispara é o JOGADOR (`MANUAL_EVOLUTION = true`); a virada do dia nunca evolui sozinha | meta acumulada | `onEvolveRequest` → `EVO-13` | P1 | aprovado |
| `EVO-05` | Evolução | `EvolutionPath` | gerando sprite — `generatingSprites` (o card `GERANDO`) | evolução nova | `onRetrySprite` | P1 | aprovado |
| `EVO-06` | Evolução | `EvolutionPath` | erro de sprite — `onRetrySprite` | falha da geração | nova tentativa | P1 | aprovado |
| `EVO-07` | Evolução | `EvolutionPath` | sintonia do visor — `onTuneVisor`, `onRevertVisor`, `onSeenTune` (+ o anúncio `aria-live` de `HOME-48`) | card do sprite | — | P2 | aprovado |
| `EVO-08` | Evolução | `EvolutionPath` | silhueta — forma ainda não alcançada | sempre que houver futuro | — | P1 | aprovado |
| `EVO-09` | Evolução | `EvolutionPath` | ritmo de cuidado — `carePattern` só é passado quando `carePatternReading.confident`; ele é **critério de desempate**, os atributos mandam | histórico suficiente | — | P2 | aprovado |
| `EVO-10` | Evolução | `EvolutionPath` | ritmo não confiável — com pouco histórico a leitura **se declara não-confiável e não desempata** | histórico curto | — | P2 | aprovado |
| `EVO-11` | Evolução | Evolução · convite | **demo** — `{currentView === 'evolution' && gameState.demoCharacterId && (…UnlockNudge…)}` com `variant='buy'` | visita à página | `setUnlockReason('evolution')` | P1 | aprovado |
| `EVO-12` | Evolução | Evolução · convite | **pago com criatura de demo** — mesmo bloco com `variant='reveal'` quando `accountTier === 'paid'` | idem | `setUpgradeRitual(true)` → `ONB-37` | P1 | aprovado |
| `EVO-13` | Evolução | `EvolutionCeremony` | intercalando — os sprites da forma atual e da próxima alternam por `TOTAL_MS` (3000 ms), brancos, sobre vídeo em loop | `handleEvolveRequest` (só se `next !== evolutionStage`) | — | P1 | aprovado |
| `EVO-14` | Evolução | `EvolutionCeremony` | estabilizada — para na forma evoluída | fim do ciclo | `onEvolved={handleEvolve}` · `onClose` | P1 | aprovado |
| `EVO-15` | Evolução | `EvolveTaskModal` | normal — `isOpen={evolveModalStage !== null && evolutionCeremony === null}` (o `&& null` é o encadeamento que **faltava**: ele reaparecia por baixo da cerimônia cobrando "crie mais atividades"). Mostra `registeredForDay(...)`, **nunca `activities.length` cru** | level-up detectado | `onCreateTask` → `setCreateModalOpen(true)` | P1 | aprovado |
| `EVO-16` | Evolução | botão "Renascimento" | normal — `{currentView === 'evolution' && canRebirth(gameState) && (…)}`: só depois do **ultra**, só `accountTier:'paid'`, **uma vez só** | página de Evolução | `rebirthOpen` | P2 | aprovado |
| `EVO-17` | Evolução | `RebirthModal` | normal — a perda é dita **antes** de qualquer escolha, com nome e número, e o que **não** se perde é dito junto | botão | `onClose` | P2 | aprovado |
| `EVO-18` | Evolução | `RebirthModal` | confirmando — exige um **segundo toque** (`confirmando`); `onConfirm` é async e **só fecha com `ok`** | 1º toque | commit | P2 | aprovado |
| `EVO-19` | Evolução | `RebirthModal` | escolhas — criatura (campo aberto), escola (as 6 do class-system) e elemento (base ou par de 2º nível) | dentro do modal | `applyRebirth` | P2 | aprovado |
| `EVO-20` | Evolução | recusa de renascimento | **`not-paid`** — `{currentView === 'evolution' && rebirthRefusal(gameState) === 'not-paid' && (…UnlockNudge reason="evolution"…)}`. `not-ultra` **não vira convite** (a página já conta a escada) e `already-used` é registro, nunca oferta repetida | visita | `setUnlockReason('evolution')` | P2 | aprovado |
| `EVO-21` | Evolução | linha "Renasceu do …" | registro — `{currentView === 'evolution' && gameState.rebirth && (…)}`; o registro **nunca é apagado** (é o que impede a segunda vez) | após renascer | — | P2 | aprovado |

### 1.6 Jogos (a página `currentView === 'games'`, os 4 minijogos e o Torneio)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `JOGO-01` | Jogos | `ActivitiesPage` | normal — um card destacado (`featured: true`) para o **Torneio** e a lista `games` com **quatro** minijogos na ordem literal do array: `dungeon`, `arena`, `dino`, `rps`. Cada card é um `<button>` inteiro | célula 2 da `BottomNav` (rótulo "Jogos"/"Games") | `onOpenTournament` → `setCurrentView('tournament')`; cada jogo monta **dentro** da página (`openGame`) | P1 | aprovado |
| `JOGO-02` | Jogos | `DungeonGame` | lobby — `phase: 'intro'`; uma run = 5 andares (`MAX_FLOORS`, que mora em `DungeonGame.tsx`) | card | `onExit={() => setOpenGame(null)}` | P1 | aprovado |
| `JOGO-03` | Jogos | `DungeonGame` | ataque — `phase: 'attack'` | dentro da run | próximo turno | P1 | aprovado |
| `JOGO-04` | Jogos | `DungeonGame` | defesa — `phase: 'defend'` | idem | idem | P1 | aprovado |
| `JOGO-05` | Jogos | `DungeonGame` | resultado do turno — `phase: 'result'` | idem | idem | P1 | aprovado |
| `JOGO-06` | Jogos | `DungeonGame` | inimigo derrubado — `phase: 'enemy-down'` (escada de 6 inimigos por andar) | 6º inimigo | `floor-clear` | P1 | aprovado |
| `JOGO-07` | Jogos | `DungeonGame` | andar limpo — `phase: 'floor-clear'`; HP do jogador carrega entre andares (+25% de cura) | fim do andar | próximo andar | P1 | aprovado |
| `JOGO-08` | Jogos | `DungeonGame` | run completa — `phase: 'run-complete'`: sobe a base (`setDungeonDifficultyAtLeast`), bônus de andar escalado e **🌀 Glitchtama** | 5º andar limpo | `onExit` | P1 | aprovado |
| `JOGO-09` | Jogos | `DungeonGame` | derrota — `phase: 'lost'`. **Perder não custa coração nenhum**, e o que está em jogo é a run | HP zerado na run | `onExit` | P1 | aprovado |
| `JOGO-10` | Jogos | `DungeonGame` | drop de coraçãozinho — `💗`, muito raro (5%/inimigo, máx. 2/dia, `DUNGEON_HEART_DROPS`); **não dropa comida** | sorteio | pastinha | P2 | aprovado |
| `JOGO-11` | Jogos | `ArenaGame` | normal — usa a ficha (`skills`, elemento). ⚠️ o `INVENTARIO-TELAS.md` (19/08/2026) a lista como **código morto**; o `03` mede que ela é o **segundo card** da página desde então — **o `03` manda, a Arena entra** | card | `onExit` | P1 | aprovado |
| `JOGO-12` | Jogos | `DinoGame` | normal | card | `onExit` | P1 | aprovado |
| `JOGO-13` | Jogos | `DinoGame` | fim de partida — `onScore={onDinoScore}` alimenta o recorde (`dinoBest`) | colisão | `onExit` | P1 | aprovado |
| `JOGO-14` | Jogos | `RPSGame` | normal — duelo curto (5 Bits por vitória) | card | `onExit` | P1 | aprovado |
| `JOGO-15` | Jogos | `TournamentPage` | **vazio** — "Enable PvP above…" quando `pvpEnabled` é falso | `onOpenTournament` | a barra | P1 | aprovado |
| `JOGO-16` | Jogos | `TournamentPage` | faixa — `getTierStanding` (Semente→Broto→Guardião→Ancião→Lendário) vem **antes** do ranking, porque posição absoluta é a leitura associada a comparação tóxica | PvP ligado | — | P1 | aprovado |
| `JOGO-17` | Jogos | `TournamentPage` | ranking — janela de **±`RANK_WINDOW` (3)** posições | idem | season inteira | P1 | aprovado |
| `JOGO-18` | Jogos | `TournamentPage` | season inteira — a um toque | toque | volta | P2 | aprovado |
| `JOGO-19` | Jogos | `TournamentPage` | vitória — `onEarnEmblems` soma e chama `contarMissao('tournament-match')` (conta a **PARTIDA**, não a vitória); `onMatchPlayed` credita XP de Vínculo | partida | — | P1 | aprovado |
| `JOGO-20` | Jogos | `TournamentPage` | derrota — o placar de derrota é **tinta neutra**; perder também rende Emblemas **e a tela diz** | partida | — | P1 | aprovado |
| `JOGO-21` | Jogos | `TournamentPage` | **travado** — gate de Vínculo (`BOND_PVP_MIN_LEVEL` = 5), **decidido pelo servidor** (o cliente é editável) | nível < 5 | — | P1 | aprovado |
| `JOGO-22` | Jogos | `TournamentPage` | carregando — busca de oponentes | entrada | — | P1 | aprovado |
| `JOGO-23` | Jogos | `NightmareBattle` | batalha — fila 1; guardas: `!nightmareOpen`, `!isSleeping`, `4 ≤ hora < 12`, `rest` existe, `hasPendingNightmare(...)` | fila de intersticiais | `closeNightmare` | P2 | aprovado |
| `JOGO-24` | Jogos | `NightmareBattle` | vitória — `onWin={handleNightmareWin}` | fim da luta | fecha | P2 | aprovado |
| `JOGO-25` | Jogos | `NightmareBattle` | derrota — `onLose`; **perder não custa nada, e a tela diz isso** | fim da luta | fecha | P2 | aprovado |

### 1.7 Loja

> ⚠️ **Divergência resolvida pelo `03`:** o `CLAUDE.md` descreve "Loja em ABAS
> (Itens/Cenários/Mobílias/Torneio/Missões)" e o `INVENTARIO-TELAS.md` de 19/08/2026 mediu
> **5 abas** (`PixelTabs`). O código tem `type ShopSegment = 'shop' &#124; 'tournament'` — **dois
> segmentos**; Itens/Cenários/Mobílias são **seções de um scroll único**, e a aba Missões
> ⚰️ não existe mais. **Wireframar dois segmentos.**

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `LOJA-01` | Loja | `ShopModal` `asPage` · segmento `shop` | normal — `<div>` com o **saldo no topo** + seção Itens (`kind === 'chip'`; ⚰️ `heart` saiu da venda em 06/09/2026 — `SPECIAL_ITEMS`, só drop da masmorra) | célula 4 da `BottomNav` | `onClose={() => setCurrentView('main')}` | P1 | aprovado |
| `LOJA-02` | Loja | segmento `shop` | seção Cenários — `kind === 'bg'` (19 à venda) | rolagem | — | P1 | aprovado |
| `LOJA-03` | Loja | segmento `shop` | seção Mobílias — `kind === 'furniture'` (27 à venda), com os espaços do palco | rolagem | — | P1 | aprovado |
| `LOJA-04` | Loja | card de item | **travado** — item com `unlock`: aparece escurecido com 🔒 e **o próprio card diz a missão e o progresso**. ⚰️ o estado `hintFor` ("tocar para revelar") saiu | missão não cumprida | — | P1 | aprovado |
| `LOJA-05` | Loja | card de item | já comprado | compra anterior | — | P1 | aprovado |
| `LOJA-06` | Loja | card de item | flash de compra — `flash` (medido em 19/08/2026; o `03` não detalha) | `handleShopBuy` | — | P1 | aprovado |
| `LOJA-07` | Loja | card de item | saldo insuficiente — **o card NÃO é desabilitado**: só o preço esmaece (`opacity: affordable ? 1 : 0.5`), e o toque acende `flash` por 2600 ms (borda e `sub` em `--sm2-danger-ink` + "Saldo insuficiente para X." na região `role="status" aria-live="polite"` + `vibrate(60)`). Sem tela de "comprar Bits". **Medido em 13/09/2026** → `03` §4.6a | toque sem Bits | — | P1 | aprovado |
| `LOJA-08` | Loja | segmento `shop` | **demo** — `{seg === 'shop' && accountTier === 'demo' && onUnlock && (…)}` monta o `UnlockNudge` com `reason="shop"` | visita | `setUnlockReason('shop')` | P1 | aprovado |
| `LOJA-09` | Loja | segmento `tournament` | missões semanais — **no topo**, sob `{seg === 'tournament' && (weeklyMissions?.length ?? 0) > 0 && (…)}`: 3 por semana ISO, determinísticas por `weekKey`, pagas em Emblemas | troca de segmento | — | P1 | aprovado |
| `LOJA-10` | Loja | segmento `tournament` | itens de Emblemas — `TOURNAMENT_ITEMS` (8, escada 8/12/15/20/25/40/55/70); **tudo cosmético, e isso é regra** | idem | `handleShopBuy` | P1 | aprovado |
| `LOJA-11` | Loja | segmento `tournament` | sem missões — `weeklyMissions?.length === 0` (o bloco não monta) | semana sem sorteio | — | P2 | aprovado |
| `LOJA-12` | Loja | `ShopModal` sem `asPage` | como modal — a mesma `body` dentro de um `ModalSheet` com título "Loja"/"Shop". ⚠️ o `App.tsx` **sempre passa `asPage`**; a variante existe e não é usada — ver §3 | nenhum caminho vivo | — | P2 | fora |
| `LOJA-13` | Loja | troca Créditos → Bits | os **3** degraus de `BITS_EXCHANGE` (`CREDIT_TO_BITS` = 10), **último nó do corpo**, só em `{seg === 'shop'}`; cinco estados (`can` / sem Créditos / `busy` = `sync` e os outros dois travados / falhou / concluiu, os dois últimos pela região `aria-live` + toast). ⚰️ **O achado de 19/08/2026 (💎 emoji convivendo com `icon-gem.png`) não vale mais**: hoje é um glifo só, `diamond`, e Bits seguem sem ícone. **Medido em 13/09/2026** → `03` §4.6b | segmento `shop` | — | P1 | aprovado |

### 1.8 Estatísticas

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `STAT-01` | Estatísticas | `StatsPage` | normal — quatro cartões, cada um com condição literal | chip "Estatísticas" | os outros dois chips | P2 | aprovado |
| `STAT-02` | Estatísticas | `StatsPage` | **primeira-vez / vazio** — ⚰️ a medição de 19/08/2026 (três listas cruas: "No activities completed yet." / "No tasks completed yet." / "No history yet.") **venceu**: nenhuma das três strings existe. Hoje são **duas** listas, cada uma mantendo `<section>` + `<h3>` e trocando o `<ul>` por uma frase de FUTURO ("Nada concluído ainda. A primeira vez já aparece aqui." / "O histórico começa na sua próxima conclusão."); Vínculo e A jornada montam sempre — e também **Quem é o seu Soulmon** (o traço `petPassive` é sorteado na criação do save; só o ritmo falta) e **A estação** (o `App.tsx` passa `season` sempre; sem caminho andado, só o rótulo) — ⚠️ corrigido em 15/09/2026 pelo `design-critic` (B3); o `03` §4.8a ainda diz que as duas somem. As demais seções (encontros, formas, feitos, "começou por") somem. Continua **sem ilustração e sem CTA**. **Medido em 13/09/2026** → `03` §4.8a | 1º uso | — | P2 | aprovado |
| `STAT-03` | Estatísticas | `BirthCard` | normal — `{birth && (…)}`; o `App.tsx` monta `birth` sob `bornAt \&#124;\&#124; soulmonMeta?.baseName \&#124;\&#124; demoCharacterId` | `StatsPage` | — | P2 | aprovado |
| `STAT-04` | Estatísticas | `BirthCard` | **demo** — `displaySprite` lê o acervo, que o demo nunca preenche, então há fallback `getSpriteForStage('rookie', gameState.demoCharacterId)` | `accountTier === 'demo'` | — | P2 | aprovado |
| `STAT-05` | Estatísticas | `BestiaryCard` | ausente — `{(bestiary?.length ?? 0) > 0 && (…)}`: sem nenhum inimigo visto, o cartão **não monta**. A condição é **PRÓPRIA, não aninhada no álbum** (o álbum depende de `soulmonStages`, que o jogador grátis não tem — e é ele quem mais roda masmorra) | nenhum encontro | — | P2 | aprovado |
| `STAT-06` | Estatísticas | `BestiaryCard` | parcial — **36** artes possíveis (9 linhas × 4 tiers desde `c11dc49d`, 15/09/2026; era 24), **silhueta** para o que não apareceu e contagem de COLEÇÃO (nunca percentual, nunca "faltam N") | masmorra | — | P2 | aprovado |
| `STAT-07` | Estatísticas | `BestiaryCard` | completo — 24 de 24 | coleção cheia | — | P2 | aprovado |
| `STAT-08` | Estatísticas | `FormAlbum` | normal — `{album && album.length > 0 && (…)}`, com `reachedAt` | evoluções | — | P2 | aprovado |
| `STAT-09` | Estatísticas | `FormAlbum` | silhueta — para o não alcançado | formas futuras | — | P2 | aprovado |
| `STAT-10` | Estatísticas | linha de texto legada | compat — `{!album && formNames.length > 0 && (…)}`: ⚰️ o que o álbum substituiu, mantido para save sem `album`. **Ver §3** — desenhar ou não é decisão do design-lead | save antigo | — | P2 | fora |

### 1.9 Conta (o que o menu sanduíche alcança, compra e ajuda — a Biblioteca migrou para §1.9a, D2)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `CONTA-01` | Conta | `SettingsPage` | normal — **cinco grupos por intenção**, uma ação dominante (entrar/sincronizar). ⚠️ o `INVENTARIO-TELAS.md` (19/08/2026) mediu **11 blocos empilhados sem agrupamento**: o agrupamento em 5 é posterior — **o `03` manda** | linha "Configurações" do menu | a barra | P2 | aprovado |
| `CONTA-02` | Conta | `AccountSection` | deslogado — conta e compras | `SettingsPage` | portão de auth | P2 | aprovado |
| `CONTA-03` | Conta | `AccountSection` | logado — com **"Restaurar compras"** (exigido pela Play) | idem | `claimOrder` | P2 | aprovado |
| `CONTA-04` | Conta | `AccountDataSection` | normal — exportar e apagar | `SettingsPage` | — | P2 | aprovado |
| `CONTA-05` | Conta | `AccountDataSection` | **503 é ESTADO, não erro** — o botão nasce desabilitado **com o motivo escrito, em tinta neutra** | servidor indisponível | — | P2 | aprovado |
| `CONTA-06` | Conta | `InstallPrompt` | cartão — **não modal**; vive dentro da `SettingsPage` e só monta com `beforeinstallprompt` e `!standalone` | `SettingsPage` | prompt do sistema | P2 | aprovado |
| `CONTA-07` | Conta | `RestWindowCard` | normal — o usuário escolhe a **própria** janela (`onChangeWindow`, `DEFAULT_REST_WINDOW` 23:00–07:00) | `currentView === 'settings'` | — | P1 | aprovado |
| `CONTA-08` | Conta | `RestWindowCard` | vazio — nenhuma noite registrada; **noite sem registro é NEUTRA** e sai do denominador | 1ª semana | — | P1 | aprovado |
| `CONTA-09` | Conta | `RestWindowCard` | lembrete de deitar — `onEnableReminder` com `reminderPreview`, pedido **no momento-ouro**; é o **único push possível** deste eixo | toque | permissão do sistema | P1 | aprovado |
| `CONTA-10` | Conta | `RestWindowCard` | sem métricas — switch `onToggleMetrics`: esconde números e **preserva as recompensas**. **Proibido nesta tela**: score de 0 a 100 e gráfico de estágios do sono | switch | `hideMetrics` no save | P1 | aprovado |
| `CONTA-11` | Conta | `StepsCard` | disponível — `{currentView === 'settings' && stepsAvailable === true && gameState.stepsConsent !== 'declined' && (…)}`; **some por completo** sem sensor (PWA) | APK com sensor | — | P2 | aprovado |
| `CONTA-12` | Conta | `StepsCard` | consentimento — vem **antes** do diálogo do sistema; `'declined'` é **definitivo** (insistir depois de um "não" é assédio) | 1ª visita | — | P2 | aprovado |
| `CONTA-13` | Conta | `SettingsModal` | painel rápido de IA — `{settingsOpen && (…)}` na raiz do `App`. ⚠️ **não é "aberto pelo menu": é INALCANÇÁVEL** — o único chamador de `setSettingsOpen(true)` é `handleOpenAISettings`, que desce até o `ChatBox` e nunca é chamado (medido em 13/09/2026). Mesma família do `OraclePage`; ver `03` §4.23a | nenhum caminho vivo | `onClose` | P2 | fora |
| `CONTA-14` | Conta | `AISettingsModal` | normal — 3 grupos de chips (`tone` · `emojiIntensity` · `motivationStyle`) + `Disclosure` "Mais opções" (`CREATIVITY` e `customKeywords`, contador só acima de 400/500); rodapé "Padrão" (local) + "Salvar"; `useEffect` ressincroniza a cada abertura, então fechar sem salvar descarta. **Caminho de abertura REAL, medido em 13/09/2026**: menu sanduíche → "Configurações" (`onNavigate('settings')`) → `SettingsPage` → `ActionRow` "Personalidade" → `setShowAISettings(true)`. ⚰️ O "via `CompanionHUD`" do `INVENTARIO-TELAS.md` (19/08/2026) é a fiação MORTA que abriria o `SettingsModal` (ver `CONTA-13`). → `03` §4.23a | `SettingsPage` | `onClose` | P2 | aprovado |
| `CONTA-15` | Conta | `GuideModal` (via `ContentModals`) | normal — `guideModalOpen`; **os números saem das CONSTANTES**, nunca de texto à mão | `onOpenGuide` da `SettingsPage` | `onClose` | P2 | aprovado |
| `CONTA-16` | Conta | `HelpModal` | glossário — `showHelpModal`, idem | `onOpenGlossary` | `onClose` | P2 | aprovado |
| `CONTA-17` | Conta | `ConfirmDialog` | "Refazer o ritual" — `resetOnboardingOpen`; o texto diz que Soulmon, atividades, Bits e progresso **continuam** | linha do menu | confirma ou cancela | P2 | aprovado |
| `CONTA-18` | Conta | `CreditsModal` | normal — `{creditsOpen && (…)}` | `onOpenCredits` do menu → `openCredits` | `onClose` | P2 | aprovado |
| `CONTA-19` | Conta | `CreditsModal` | sem reroll — `canReroll` é `!!readLocal(STORAGE_KEYS.SOULMON_PROFILE)` | sem perfil salvo | — | P2 | aprovado |
| `CONTA-20` | Conta | `NewReadingModal` | normal — **só chega do `CreditsModal`** (a linha faz `setCreditsOpen(false); setNewReadingOpen(true)`). ⚰️ substituiu o reroll por `Math.random()`: a semente passa a vir **das respostas** | `CreditsModal` | `onClose` | P2 | aprovado |
| `CONTA-21` | Conta | `NewReadingModal` | confirmando — `onConfirm` async, **só fecha com `ok`** | toque | commit | P2 | aprovado |
| `CONTA-22` | Conta | `UnlockAccountModal` | normal — `{unlockReason && (…)}` na raiz do `App`; **nunca abre sozinho**. `UnlockReason = 'task-limit' \&#124; 'evolution' \&#124; 'report' \&#124; 'shop'` | os 4 motivos | `onClose={() => setUnlockReason(null)}` | P1 | aprovado |
| `CONTA-23` | Conta | `UnlockAccountModal` | comprando — espera do servidor; `onUnlocked={handleAccountUnlocked}` **só depois de o servidor confirmar** | toque | `ONB-37` (ritual de upgrade) | P1 | aprovado |
| `CONTA-24` | Conta | `UnlockAccountModal` | recusa / cancelamento | retorno do billing | fecha | P1 | aprovado |
| `CONTA-25` | Conta | `UnlockNudge` | o componente e seus **6 pontos** (medidos em 09/09/2026): `CreateModal` e `EditModal` (`task-limit`), `ShopModal` (`shop`), `DailyReportModal` (`report`), `App.tsx` Evolução e Renascimento (`evolution`). **Nunca abre sozinho** | as 6 telas hospedeiras | `setUnlockReason(...)` | P1 | aprovado |







| `CONTA-33` | Conta | `SettingsPage` | carregando — `Suspense` com `ScreenSkeleton` | navegação | — | P2 | aprovado |

### 1.9a Social (a Biblioteca: diretório, amigos, grupo, o perfil do outro — canvas próprio por D2; `CONTA-26`→`CONTA-32` renumerados)

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `SOC-01` | Social | `LibraryPage` | **carregando** — um dos quatro estados declarados | linha "Biblioteca" do menu (**único caminho**) | a barra | P2 | aprovado |
| `SOC-02` | Social | `LibraryPage` | **vazio** | busca sem resultado | — | P2 | aprovado |
| `SOC-03` | Social | `LibraryPage` | **erro** | falha do servidor | — | P2 | aprovado |
| `SOC-04` | Social | `LibraryPage` | **sem rede** — ⚰️ a versão anterior tratava falha de rede como "nenhum jogador encontrado" (`.catch(() => setPlayers([]))`), **a pior mentira possível numa tela social** | offline | — | P2 | aprovado |
| `SOC-05` | Social | `LibraryPage` | lista — uma ação dominante por linha; NPCs de `utils/libraryNpcs.ts` misturados aos jogadores reais, marcados por `isNpc`; presentear e adicionar/remover amigo com rótulo e 44px | carga ok | `PlayerDetailModal` | P2 | aprovado |
| `SOC-06` | Social | `CoopPanel` | normal — montado dentro da página; `metaDoDiaCumprida` vem do `App.tsx` (`dailyTotal > 0 && dailyDone >= dailyTotal`). O número é do **GRUPO**, nunca de um membro; por pessoa existe só "apareceu hoje: sim/não" | `LibraryPage` | — | P2 | aprovado |
| `SOC-07` | Social | `PlayerDetailModal` | normal — abre pelo toque no jogador e chama `onVisitPlayer` → `contarMissao('friend-visit')` | linha da lista | `onClose` | P2 | aprovado |
### 1.10 Fora do app

| id | fluxo | tela | estado (condição do `03`) | chega por | sai para | prio | estado do wireframe |
|---|---|---|---|---|---|---|---|
| `FORA-01` | Fora-do-app | widget `SoulmonWidgetProvider` (label "Soulmon") | normal — nome do pet (`pet_name`), rótulo do estágio, `"$completedTasks/$totalTasks"` (ou `"—"`), sprite e uma frase (⚠️ corrigido em 15/09/2026: corações e barra de energia são do widget E, o cocô é do C — `widget_soulmon.xml` não os tem) | lista de widgets do Android | **tocar em qualquer lugar abre o app** (`PendingIntent` no `R.id.widget_root`; não há alvo por região) | P2 | aprovado |
| `FORA-02` | Fora-do-app | widget `SoulmonWidgetVerticalProvider` ("Soulmon Vertical") | normal | idem | idem | P2 | aprovado |
| `FORA-03` | Fora-do-app | widget `SoulmonWidgetPetProvider` ("Soulmon Pet") | normal | idem | idem | P2 | aprovado |
| `FORA-04` | Fora-do-app | widget `SoulmonWidgetChatProvider` ("Soulmon Chat") | normal | idem | idem | P2 | aprovado |
| `FORA-05` | Fora-do-app | widget `SoulmonWidgetScreenProvider` ("Soulmon Tela") | normal | idem | idem | P2 | aprovado |
| `FORA-06` | Fora-do-app | escada de frases do `WidgetRenderer.kt` | os 7 degraus, na ordem em que a função decide (três `if` e então um `when`): `hp <= 20` · `needsIntervention` · `total == 0` (com `habit_steady` ou neutro) · `ratio >= 1.0` · `>= 0.7` · `>= 0.4` · senão. ⚰️ `"📋 $completed de $total feitas"`, `"⚠️ Cuide de mim!"` e `"N task(s) left, let's go!"` **não existem mais** — **o widget NÃO cobra** | render do widget | — | P2 | aprovado |
| `FORA-07` | Fora-do-app | overlay Electron · `renderMain` | painel principal — cabeçalho com `stageName` (por `textContent`, **nunca `innerHTML`**), a linha `heartsLabel() · ⚡energia · 🍎comida`, retrato, status e a fileira de 4 botões: 🫶 `doPet`, 🍎 `doFeed`, 🚿 `doShower`, 💤/☀️ `doSleepToggle` | faixa na barra de tarefas do Windows | `panel = 'tasks'` · `renderSettings` | P2 | aprovado |
| `FORA-08` | Fora-do-app | overlay · `renderTasks` | tarefas de hoje — `button(...)` com contador. **Criar e editar tarefas é só no app**, e a nota do painel diz isso | painel principal | volta | P2 | aprovado |
| `FORA-09` | Fora-do-app | overlay · `renderSettings` | configurações — inclui "📱 Abrir Soulmon completo" (`window.soulmonDesktop?.openFullApp()`) | painel principal | o app web | P2 | aprovado |
| `FORA-10` | Fora-do-app | overlay | **sem conta** — "Conecte a sua conta para cuidar do pet e marcar tarefas daqui." | sem sessão | janela de auth (`auth-preload.js`) | P2 | aprovado |
| `FORA-11` | Fora-do-app | overlay | **com conta** — e-mail + "🔄 Sincronizar agora" (`syncNow`) | sessão ativa | — | P2 | aprovado |
| `FORA-12` | Fora-do-app | push 10h (`pet-nudge-10`) | "`nome` passou pra dizer oi" — `PUSH_HOURS_BRT = [10, 16, 22]`, dono único do texto e do horário: `functions/api/_pushCopy.js` | cron do `workers/push-scheduler.js` | abre o app | P2 | aprovado |
| `FORA-13` | Fora-do-app | push recém-nascido (`pet-newborn`) | "`nome` acordou" — 10h com `ageDays` 1 ou 2 | idem | abre o app | P2 | aprovado |
| `FORA-14` | Fora-do-app | push 16h (`pet-nudge-16`) | "`nome` pensou em você" | idem | abre o app | P2 | aprovado |
| `FORA-15` | Fora-do-app | push 20h (`evening-reminder`) | "🌙 `nome` está te esperando" — **só no cliente**, com quatro guardas: `hh !== 20 \&#124;\&#124; mm !== 0`, `lastEveningWarnDate === today`, `completedSteps >= totalRequired`, **`restWindow`** (a precedência do lembrete de deitar: é o único dos três que pede EXECUÇÃO, então é ele que cede) | `NotificationManager` | abre o app | P2 | aprovado |
| `FORA-16` | Fora-do-app | push 20h (`hp-critical-evening`) | "`nome` está meio pra baixo" — variante de HP crítico | idem | abre o app | P2 | aprovado |
| `FORA-17` | Fora-do-app | push 22h (`pet-goodnight`) | "🌙 `nome` te deseja boa noite" — o título **parou de alegar horário** | cron | abre o app | P2 | aprovado |
| `FORA-18` | Fora-do-app | push lembrete de deitar (`pet-sleep-reminder`) | "`nome` está ficando com sono" — janela −30 min (`sleepReminderAt`) | cron | abre o app | P2 | aprovado |

---

## 2. Por fluxo — o que tem dentro e em que ordem desenhar

**A ordem entre os canvases é W5 — frequência manda.** Os três primeiros são os que
o jogador vê todo dia; o último é o que ele vê uma vez por semana no telefone, fora do app.
Um fluxo por despacho, dois agentes nunca no mesmo canvas (`CONTRACT.md`).

| ordem | canvas | telas | artboards | P0 / P1 / P2 | por quê nesta posição |
|---|---|---|---|---|---|
| 1 | `wireframes/home/` — **[canvas publicado](https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332)** (13/09/2026, 28 artboards em 4 páginas, rodada 2 pós-crítica; `Main.dc.html` + 27 `<TelaEstado>.dc.html` + `canvas.json`) | 26 | 48 | 21 / 24 / 3 | a tela que existe em 100% das sessões; carrega o chrome (`BottomNav`, menu, `Toaster`, `ScreenSkeleton`) que toda outra herda |
| 2 | `wireframes/atividades/` — **[canvas publicado](https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1)** (14/09/2026, 17 artboards em 4 páginas, rodada 2 pós-crítica; `Main.dc.html` + 16 `<TelaEstado>.dc.html` + `canvas.json`) | 16 | 27 | 13 / 14 / 0 | o átomo mais repetido do app (`RitualRow`); uma linha bem desenhada arruma a Home inteira |
| 3 | `wireframes/rituais/` — **[canvas publicado](https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a)** (14/09/2026, 21 artboards em 4 páginas, rodada 2 pós-crítica; `Main.dc.html` + 20 `<TelaEstado>.dc.html` + `canvas.json`) | 10 | 26 | 11 / 10 / 5 | check-in e relatório passam por todo usuário ativo **todo dia**, e as duas filas são estrutura (W7) |
| 4 | `wireframes/pet/` — **[canvas publicado](https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e)** (14/09/2026, 9 artboards em 3 páginas, rodada 2 pós-crítica; `Main.dc.html` + 8 `<TelaEstado>.dc.html` + `canvas.json`) | 3 | 8 | 0 / 0 / 8 | D1: canvas próprio, logo após Rituais — a ficha é onde a criatura é heroína, e o Dex é a única coleção do jogo |
| 5 | `wireframes/evolucao/` — **[canvas publicado](https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed)** (14/09/2026, 15 artboards em 3 páginas, rodada 2 pós-crítica; `Main.dc.html` + 14 `<TelaEstado>.dc.html` + `canvas.json`) | 11 | 21 | 0 / 12 / 9 | o clímax do jogo e o único lugar onde demo × pago muda a página inteira |
| 6 | `wireframes/jogos/` — **[canvas publicado](https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a)** (15/09/2026, 16 artboards em 4 páginas, rodada 2 pós-crítica; `Main.dc.html` + 15 `<TelaEstado>.dc.html` + `canvas.json`) | 7 | 25 | 0 / 20 / 5 | semanal, mas é onde mora a maior máquina de estados do app (9 fases da masmorra) |
| 7 | `wireframes/loja/` — **[canvas publicado](https://claude.ai/code/artifact/ef3ed287-1ecd-466a-a8de-c5aea415f2f8)** (15/09/2026, 7 artboards em 2 páginas, rodada 2 pós-crítica; `Main.dc.html` + 6 `<TelaEstado>.dc.html` + `canvas.json`; LOJA-12 `fora` por D5) | 6 | 13 | 0 / 11 / 2 | semanal; e é onde as três moedas não podem se confundir |
| 8 | `wireframes/onboarding-funil/` — **[canvas publicado](https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6)** (14/09/2026, 17 artboards em 4 páginas, rodada 2 pós-crítica; `Main.dc.html` + 16 `<TelaEstado>.dc.html` + `canvas.json`; D3: o funil — ONB-01→20, 34, 39→43; ONB-13 `fora` por D4) | 18 | 26 | 0 / 21 / 5 | uma vez por jogador — mas por **todos** eles. Ver a ressalva na §3.2 item 3 |
| 9 | `wireframes/estatisticas/` — **[canvas publicado](https://claude.ai/code/artifact/b35cbac1-de65-4b5d-a17a-760f94e4d6df)** (15/09/2026, 7 artboards em 2 páginas, rodada 3 — checkpoint final do dono; `Main.dc.html` + 6 `<TelaEstado>.dc.html` + `canvas.json`; STAT-10 `fora` por D4) | 5 | 10 | 0 / 0 / 10 | raro; três coleções (bestiário, álbum, nascimento) com a mesma gramática de silhueta |
| 10 | `wireframes/social/` — **[canvas publicado](https://claude.ai/code/artifact/7abe2a04-90db-43f1-9d75-dd8a742f3ff0)** (15/09/2026, 8 artboards em 2 páginas, rodada 2 pós-crítica; `Main.dc.html` + 7 `<TelaEstado>.dc.html` + `canvas.json`; D2: CONTA-26→32 → SOC-01→07) | 3 | 7 | 0 / 0 / 7 | raro; a única família em que um número ao lado de um nome vira comparação — o guarda dá parecer sobre o canvas inteiro (D2) |
| 11 | `wireframes/conta/` — **[canvas publicado](https://claude.ai/code/artifact/c5fba27a-548f-444c-890f-10f4d482229f)** (15/09/2026, 14 artboards em 2 páginas, rodada 2 pós-crítica; `Main.dc.html` + 13 `<TelaEstado>.dc.html` + `canvas.json`; CONTA-13 `fora` pelo precedente da D5) | 15 | 26 | 0 / 8 / 18 | raro, mas é onde a compra acontece e onde a Biblioteca ficou hospedada (§3.2 item 2) |
| 12 | `wireframes/fora-do-app/` — **[canvas publicado](https://claude.ai/code/artifact/89cc5550-5b1a-4f2b-8929-759a4a68373b)** (15/09/2026, 7 artboards em 3 páginas, rodada 3 — checkpoint final do dono; `Main.dc.html` + 6 `<TelaEstado>.dc.html` + `canvas.json`) | 17 | 18 | 0 / 0 / 18 | 5 widgets + overlay + 7 copies de push: superfície que a pessoa vê **sem decidir abrir** |
| 13 | `wireframes/onboarding-oraculo/` — **[canvas publicado](https://claude.ai/code/artifact/6dcb1aed-d52c-4c7c-ada1-c3de69f0de38)** (15/09/2026, 12 artboards em 2 páginas, rodada 3 — checkpoint final do dono; `Main.dc.html` + 11 `<TelaEstado>.dc.html` + `canvas.json`; D3: o ritual — ONB-21→33, 35→38, + ONB-44 o reveal demo pela 13.19) | 13 | 18 | 0 / 2 / 16 | uma vez por jogador pagante; é o último canvas por W5 |
| S | `wireframes/sistema/identidade/` — **canvas Sistema (Fase 2, identidade)**: 8 artboards (SIS-01..07 + Main claro), `canvas.json`, `README.md`, `CRITICA.md`; checkpoint do dono 16/09/2026 → `identidade` (`DECISOES-WIREFRAME.md` §18) | — | 8 | — | não é fluxo: é o sistema (tokens, tipografia, átomos, o Visor) que os 13 canvases de identidade consomem |
| H | `wireframes/home/identidade/` — canvas Home (identidade), 28 + `MainClaro`, checkpoint 16/09/2026 → `identidade` (§19) | 26 | 29 | — | P4 textura 10%, P5 `--sm2-haunted`, P6 `toys`/`groups` |
| A | `wireframes/atividades/identidade/` — canvas Atividades (identidade), 17 + `MainClaro`, checkpoint 16/09/2026 → `identidade` (§20) | 16 | 18 | — | sem pendência do dono |
| R | `wireframes/rituais/identidade/` — canvas Rituais (identidade), 21 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§21) | 21 | 22 | — | emblemas de marco habit-7/21/66 |
| P | `wireframes/pet/identidade/` — canvas Pet (identidade), 9 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§22) | 9 | 10 | — | visor de emblemas como exceção declarada |
| O | `wireframes/onboarding-funil/identidade/` — canvas Onboarding-funil (identidade), 17 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§23) | 25 | 18 | — | 6 personagens; chama no slot-visor |
| E | `wireframes/evolucao/identidade/` — canvas Evolução (identidade), 15 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§24) | 15 | 16 | — | nós SVG por token (H1 a), vidro 80 |
| J | `wireframes/jogos/identidade/` — canvas Jogos (identidade), 16 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§25) | 16 | 17 | — | minijogo = conteúdo do vidro; chrome vetor |
| L | `wireframes/loja/identidade/` — canvas Loja (identidade), 7 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§26) | 7 | 8 | — | três moedas distintas; palco falso saiu |
| T | `wireframes/estatisticas/identidade/` — canvas Estatísticas (identidade), 7 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§27) | 7 | 8 | — | bestiário 36 |
| C | `wireframes/social/identidade/` — canvas Social (identidade), 8 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§28) | 8 | 9 | — | selo offline SIS-06 |
| K | `wireframes/conta/identidade/` — canvas Conta (identidade), 14 + `MainClaro`, checkpoint 20/09/2026 → `identidade` (§29) | 32 | 15 | — | tudo aparelho; Redo primário |

### 2.1 Home — ordem sugerida dentro do canvas
Chrome primeiro (`HOME-40`→`HOME-42`, `HOME-43`), porque tudo se desenha dentro dele → a
página nos três recortes que mudam a composição (`HOME-01`, `HOME-02`, `HOME-03`) → o
`HomeHud` (`HOME-06`→`HOME-08`) → **o slot de avisos e os cinco avisos** (`HOME-09`→`HOME-16`),
que é a metade estrutural da Home (W7) → a área do pet (`HOME-17`→`HOME-24`), que é a razão
de o app existir → `ChatBox` (`HOME-25`→`HOME-30`) → cartões (`HOME-31`→`HOME-34`) → comida e
pastinha (`HOME-35`→`HOME-39`) → os estados globais (`HOME-04`, `HOME-05`, `HOME-44`→`HOME-48`).
**Desenhado, criticado e aprovado pelo dono em 13–14/09/2026** (`design-wireframer`; crítica de `design-critic`, `soulmon-product-designer` e `soulmon-guarda-linha-vermelha`; decisão em [DECISOES-WIREFRAME.md](DECISOES-WIREFRAME.md) §5): 48 linhas em 28 artboards — a composição da página em artboard próprio (`Main`, `HomeRolado` — a Home rolada, lista sob o pet fixo —, `HomeVazio`, `HomePrimeiroDia`, `HomeCarregando`, `HomeSemMetricas`, `HomeOffline`, `HomeErro`, `HomeAvisosExpandido`, `PetCarinho`, `PetDormindo`, `PetAssombrado`, `PetPodeEvoluir`, `PetCheio`, `AlimentarFolha`, `ItensPastinha`, `ItensVazio`, `ItensUsar`, `NavMenu`), e os estados que diferem só por um cartão ou um glifo em **folhas de estados** (`HomeAvisosCartoes` = HOME-13→16, `FirstDayEstados` = 11/12, `HomeHudEstados` = 06→08, `PetDeckEstados` = 21/23/24, `ChatEstados` = 25→30, `PlayEstados` = 31→33 — Play como célula do deck, `[novo]` —, `NavEstados` = 40/41/43, `FeedbackEstados` = 45/48), como o handoff §5 permite. `TrilhaEvolucao` desenha o `HOME-34` como **o que sai** (W9). Cada artboard leva a tag `HOME-xx` que cobre.

⚠️ **Achados da crítica para o cartógrafo** (13/09/2026): (1) a condição de `HOME-08` ("switch do `RestWindowCard`") não bate com o código — `hideMeters` é **fixo** no `HomeHud` do topo desde 27/08/2026 (os medidores moram dentro do `.sm2-device`); o toggle do jogador é `HOME-05`. (2) O estado "retorno após ausência" (`welcomeBackLine` no balão, `PRINCIPIOS` §1) não tem linha própria — desenhado em `PetDeckEstados`. (3) A Home rolada (lista sob o pet fixo) é a interação central e está em `HomeRolado`, sob `HOME-01`.

### 2.2 Atividades
`RitualPanel` nos três enchimentos (`ATIV-01`→`ATIV-03`) → as duas linhas, tarefa e hábito
(`ATIV-04`→`ATIV-07`) → os metadados, que são onde a cobrança poderia entrar e não pode
(`ATIV-08`→`ATIV-13`) → entrada rápida e modais de criação/edição, com os dois estados de demo
(`ATIV-14`→`ATIV-19`) → as saídas: nudge, equilíbrio, triagem, gaveta (`ATIV-20`→`ATIV-27`).

**Desenhado, criticado e aprovado pelo dono em 14/09/2026** (`design-wireframer`; crítica de `design-critic`, `soulmon-product-designer` e `soulmon-guarda-linha-vermelha` — decisão em [DECISOES-WIREFRAME.md](DECISOES-WIREFRAME.md) §6): 27 linhas em 17 artboards — a lista em composição própria (`Main` = parcial, `ListaVazia`, `ListaCompleta`, `CargaDoDia` = D10 `[decisão 13/09]`), as linhas e metadados em folhas de estados (`LinhaTarefaEstados` = 04/05/08/09/10, `LinhaHabitoEstados` = 06/07, `FichaHabito` = 11/12/13 — a ficha do hábito no topo do `EditModal` `[novo — estrutura]`, + T5 escudos e T6 aura `[decisão 13/09]`), criar/editar em folhas (`CriarAtividade` 15, `CriarTetoDemo` 16, `EditarAtividade` 17 (+ 18 como **sai**: o teto não tranca edição), `EditarTarefa` 19, `CapturaRapida` 14) e as saídas (`NudgeAdiamento` 20, `EquilibrarSemana` 21/27, `TriagemFila` 22/23, `TriagemFim` 24, `GuardadasEstados` 25/26). Cada artboard leva a tag `ATIV-xx` que cobre.

### 2.3 Rituais
**Os dois quadros de fila primeiro** (`RIT-01`, `RIT-02`) — eles são a regra que governa todo
o resto do canvas → check-in (`RIT-03`→`RIT-07`) → relatório diário (`RIT-08`→`RIT-15`) →
sonho (`RIT-16`, `RIT-17`) → semanal (`RIT-18`, `RIT-19`) → cerimônia de marco com o par
movimento-reduzido (`RIT-20`, `RIT-21`) → os que entram por gate ou por último
(`RIT-22`→`RIT-26`).

**Desenhado, criticado e aprovado pelo dono em 14/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1–B5/R1–R7 aplicados, `soulmon-product-designer` #1–#10, `soulmon-guarda-linha-vermelha` aprovada com ressalva; decisão do lead em `DECISOES-WIREFRAME.md` §7; checkpoint em modal): 26 linhas em 21 artboards — os dois quadros de fila (`Main` = RIT-01, `Fila2Slot` = RIT-02, com a 7ª entrada de §6 A5), o check-in (`CheckInNormal` 03, `CheckInPendencias` 04 + carga D10, `CheckInSemTarefas` 05, `CheckInOfertaReduzida` 06, `CheckInEstados` 07), o relatório diário (`RelatorioNormal` 08/11/12/15, `RelatorioDiaCompleto` 09/12, `RelatorioRetorno` 10, `RelatorioOferta` 14, `RelatorioEstados` 11/12/13/15), o sonho (`SonhoComCena` 16, `SonhoSemCena` 17), a semana (`SemanaCartao` 18, `SemanaSemSugestao` 19), a cerimônia (`MarcoCerimonia` 20/21 — D7: movimento reduzido como nota) e os que entram por gate (`ProtegerProgresso` 22, `WelcomeInstalar` 23, `WelcomeNotificacoes` 24/25, `PrimeiraTarefa` 26). Cada artboard leva a tag `RIT-xx` que cobre.

### 2.3a Pet
**A ficha primeiro** (`PET-01`, com o rolado e os estados) → a coleção de sonhos nos três
estados (`PET-03`→`PET-05`) → o diário (`PET-06`, `PET-07`) → carregando (`PET-08`). `PET-02`
(save legado) é `fora` por D4.

**Desenhado, criticado e aprovado pelo dono em 14/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1/R1/R2 aplicados, `soulmon-product-designer` #1–#8, `soulmon-guarda-linha-vermelha` aprovada com ressalva, veto 1a ao `[novo]` que suprimia o "0 of 30"; decisão do lead em `DECISOES-WIREFRAME.md` §8; checkpoint em modal): 7 linhas em 9 artboards — `Main` (PET-01, a heroína no Visor + habilidades), `FichaRolada` (as formas anteriores), `FichaEstados` (poder assíncrono, classe ausente, o vazio, PET-02 como nota), `DexVazio`/`DexParcial`/`DexCompleto` (PET-03/04/05), `DiarioVazio`/`DiarioComEntradas` (PET-06/07), `PetCarregando` (PET-08). Cada artboard leva a tag `PET-xx` que cobre.

### 2.4 Evolução
Sub-abas (`EVO-01`) → `EvolutionPath` com o cadeado como ação dominante
(`EVO-02`→`EVO-10`) → os dois convites, demo e pago (`EVO-11`, `EVO-12`) → cerimônia e o
modal que já montou por baixo dela (`EVO-13`→`EVO-15`) → renascimento
(`EVO-16`→`EVO-21`); a sub-aba Soulmon migrou para o canvas Pet (D1, §1.4a).

**Desenhado, criticado e aprovado pelo dono em 14/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1–B3/W3 aplicados, `soulmon-product-designer` #1–#8, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto; decisão do lead em `DECISOES-WIREFRAME.md` §10; checkpoint em modal — o dono decidiu que o `EvolveTaskModal` vira card, 13.12): 21 linhas em 15 artboards — a página (`Main` 01/02/08, `EvoArvore` 08/09/10, `EvoTravado` 03, `EvoPronto` 04, `EvoSpriteEstados` 05/06/07, `EvoOffline` 05 + D9, `EvoEstados` 08/09), os convites e a cerimônia (`ConviteDemo` 11, `ConvitePago` 12, `Cerimonia` 13/14, `CerimoniaReduzida` 13 + D7, `EvolveTaskModal` 15) e o renascimento (`RenascimentoBlocos` 16/20/21, `RenascimentoModal` 17/19, `RenascimentoConfirmando` 18). Cada artboard leva a tag `EVO-xx` que cobre.

### 2.5 Jogos
A página (`JOGO-01`) → masmorra inteira, que é a máquina de estados
(`JOGO-02`→`JOGO-10`) → os três curtos (`JOGO-11`→`JOGO-14`) → torneio, da tela vazia até a
derrota em tinta neutra (`JOGO-15`→`JOGO-22`) → pesadelo (`JOGO-23`→`JOGO-25`).

**Desenhado, criticado e aprovado pelo dono em 15/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1–B6 aplicados, `soulmon-product-designer` #1–#6, `soulmon-guarda-linha-vermelha` aprovada com ressalva, veto 3b à faixa do oponente; decisão do lead em `DECISOES-WIREFRAME.md` §11; checkpoint em modal — 13.13): 25 linhas em 16 artboards — a página (`Main` 01), a masmorra (`MasmorraLobby` 02, `MasmorraTurno` 03/04/05, `MasmorraAndar` 06/07, `MasmorraFim` 08/09/10), os três curtos (`Arena` 11, `Dino` 12/13, `PPT` 14), o Torneio (`TorneioVazio` 15, `TorneioTravado` 21, `TorneioArena` 22/19/20, `TorneioOffline` 22 + D9, `TorneioRanking` 16/17/18, `TorneioResultado` 19/20) e o pesadelo (`PesadeloIntro` 23, `PesadeloFim` 24/25). Cada artboard leva a tag `JOGO-xx` que cobre.

### 2.6 Loja
Segmento `shop` com as três seções e o saldo (`LOJA-01`→`LOJA-03`) → os estados do card, que
é o átomo (`LOJA-04`→`LOJA-07`) → convite de demo (`LOJA-08`) → segmento `tournament`
(`LOJA-09`→`LOJA-11`) → as duas pontas soltas (`LOJA-12`, `LOJA-13`).

**Desenhado, criticado e aprovado em 15/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1–B4 + ressalvas 5–9 aplicados, `soulmon-product-designer` #1–#5, `soulmon-guarda-linha-vermelha` aprovada, veto 2b ao Coraçãozinho na vitrine; decisão do lead em `DECISOES-WIREFRAME.md` §12; checkpoint fechado por aprovação automática — meta do dono de 15/09; 13.14): 12 linhas em 7 artboards — o segmento Shop (`Main` 01, `CenariosMobilias` 02/03, `CardEstados` 04/05/06/07, `ConviteDemo` 08, `TrocaCreditos` 13) e o segmento Tournament (`TorneioSegmento` 09/10, `TorneioEstados` 11 + 12 como nota). `LOJA-12` é `fora` por D5. Cada artboard leva a tag `LOJA-xx` que cobre.

### 2.7 Onboarding
Splash e intro (`ONB-01`→`ONB-04`) → **o portão de conta com os cinco estados**
(`ONB-05`→`ONB-13`), que é onde o funil perde gente → as duas perguntas abertas
(`ONB-14`, `ONB-15`) → a bifurcação grátis × pago com as quatro saídas de `handleUnlockFull`
(`ONB-16`→`ONB-20`) → o caminho do oráculo, que W5 manda por último
(`ONB-21`→`ONB-33`, `ONB-36`, `ONB-37`, `ONB-38`) → cadastro (`ONB-34`, `ONB-35`) → tutorial
(`ONB-39`→`ONB-43`).

**Funil desenhado, criticado e aprovado pelo dono em 14/09/2026** (`design-wireframer`; D3 divide o Onboarding em dois canvases; crítica em duas rodadas — `design-critic` B1–B4/W3 aplicados, `soulmon-product-designer` #1–#6, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto; decisão do lead em `DECISOES-WIREFRAME.md` §9; checkpoint em modal — o dono manteve a ordem de hoje do funil): 25 linhas em 17 artboards — splash (`Main` 01, `SplashWebView` 02, `IntroEstados` 03/04), o portão (`PortaoDuasPortas` 06, `PortaoGoogle` 10/11, `PortaoEmail` 12, `PortaoEstados` 05/07/08/09 + 13 como nota), as perguntas e a bifurcação (`Objetivo` 14, `Atrapalha` 15, `Escolha` 16, `EscolhaEstados` 17/18/19, `EscolherPersonagem` 20, `CadastroDemo` 34) e o tutorial (`TutorialConceito` 39, `TutorialTarefa` 40/43, `TutorialSugestoes` 41, `TutorialErro` 42). `ONB-13` é `fora` por D4. O ritual do Oráculo (ONB-21→33, 35→38) é o canvas `onboarding-oraculo/`, o último.

**Oráculo desenhado, criticado e aprovado em 15/09/2026** (`design-wireframer`; o segundo canvas do Onboarding por D3; crítica em duas rodadas — `design-critic` B1–B5 aplicados e re-carimbo PASSA, `soulmon-product-designer` #1–#9, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto; decisão do lead em `DECISOES-WIREFRAME.md` §17; checkpoint fechado por aprovação automática — meta do dono de 15/09; T1/13.1 sem piso no funil e o voltar da 1ª pergunta pendentes do dono): 18 linhas em 12 artboards (`ONB-44`, o reveal demo, entrou no checkpoint final de 15/09/2026 pela 13.19 — `RevealDemo`) — os passos (`Main` 22/36, `Nascimento` 23/21/24/25, `Favorita` 26, `Ritual` 27, `Bifurcacao` 28/29) e o resto (`Teste` 30, `Gerando` 31, `Reveal` 32, `RevealSemSprite` 33 — D9, `Cadastro` 35, `Upgrade` 37/38). Cada artboard leva a tag `ONB-xx` que cobre.

### 2.8 Estatísticas
`StatsPage` cheia e vazia (`STAT-01`, `STAT-02`) → nascimento (`STAT-03`, `STAT-04`) →
bestiário nos três enchimentos (`STAT-05`→`STAT-07`) → álbum (`STAT-08`, `STAT-09`) → o ramo
legado (`STAT-10`).

**Desenhado, criticado e aprovado em 15/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1–B8 aplicados e re-carimbo, `soulmon-product-designer` #1–#6, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto; decisão do lead em `DECISOES-WIREFRAME.md` §13; checkpoint fechado por aprovação automática — meta do dono de 15/09; o "0" grande do primeiro uso pendente do dono): 9 linhas em 7 artboards — a página (`Main` 01, `JornadaRolada` 01, `EstacaoListas` 01, `Vazio` 02) e os cartões (`Nascimento` 03/04, `Bestiario` 05/06/07, `Album` 08/09 + 10 como nota). `STAT-10` é `fora` por D4. Cada artboard leva a tag `STAT-xx` que cobre.

### 2.9 Conta
`SettingsPage` e os blocos de conta (`CONTA-01`→`CONTA-06`) → descanso e passos
(`CONTA-07`→`CONTA-12`) → modais de ajuste e ajuda (`CONTA-13`→`CONTA-17`) → créditos e nova
leitura (`CONTA-18`→`CONTA-21`) → **compra** (`CONTA-22`→`CONTA-25`) → carregando (`CONTA-33`);
a Biblioteca migrou para o canvas Social (D2, §1.9a).

**Desenhado, criticado e aprovado em 15/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1/B2 + R1/R2 aplicados e re-carimbo PASSA, `soulmon-product-designer` #1–#9, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto; decisão do lead em `DECISOES-WIREFRAME.md` §15; checkpoint fechado por aprovação automática — meta do dono de 15/09; a reordenação por prioridade e CONTA-13 pendentes do dono): 25 linhas em 14 artboards — a página (`Main` 01/02/06, `ContaLogada` 03, `DadosTelemetria` 04/05, `Grupos` 01, `Descanso` 07/08/09/10, `Passos` 11/12, `Carregando` 33) e os modais (`Personalidade` 14 + 13 como nota, `GuiaGlossario` 15/16, `RefazerRitual` 17, `Creditos` 18/19, `NovaLeitura` 20/21, `Desbloquear` 22/23/24, `Convites` 25). `CONTA-13` é `fora` pelo precedente da D5 (sem caminho vivo; pendente do dono). Cada artboard leva a tag `CONTA-xx` que cobre.

### 2.9a Social
A Biblioteca com os quatro estados declarados (`SOC-01`→`SOC-04`) → a lista e o presente (`SOC-05`) →
o grupo (`SOC-06`) → o perfil do outro (`SOC-07`).

**Desenhado, criticado e aprovado em 15/09/2026** (`design-wireframer`; `design-critic` PASSA na rodada 1 com ressalvas aplicadas na rodada 2, `soulmon-product-designer` #1–#8, `soulmon-guarda-linha-vermelha` aprovada com ressalva sobre o canvas inteiro — D2; decisão do lead em `DECISOES-WIREFRAME.md` §14; checkpoint fechado por aprovação automática — meta do dono de 15/09; T10/T11 pendentes do dono): 7 linhas em 8 artboards — a Biblioteca (`Main` 05, `Estados` 01/02/03, `SemRede` 04 — D9, `AmigosPresente` 05, `PerfilJogador` 07) e o Grupo (`GrupoSemGrupo` 06, `GrupoComGrupo` 06, `GrupoEstados` 06). Cada artboard leva a tag `SOC-xx` que cobre.

### 2.10 Fora do app
Os cinco widgets (`FORA-01`→`FORA-05`) → **a escada de frases** (`FORA-06`), que é a regra
"o widget não cobra" em forma de texto → overlay (`FORA-07`→`FORA-11`) → as sete copies de
push na ordem do relógio (`FORA-12`→`FORA-18`).

**Desenhado, criticado e aprovado em 15/09/2026** (`design-wireframer`; crítica em duas rodadas — `design-critic` B1–B7 aplicados e re-carimbo PASSA, `soulmon-product-designer` #1–#7, `soulmon-guarda-linha-vermelha` aprovada com ressalva e um veto ao CÓDIGO; decisão do lead em `DECISOES-WIREFRAME.md` §16; checkpoint fechado por aprovação automática — meta do dono de 15/09; cinco pendentes do dono): 18 linhas em 7 artboards — os widgets (`Main` 01, `Tamanhos` 02/03/04/05, `Escada` 06), o overlay (`OverlayPrincipal` 07, `OverlayTarefas` 08, `OverlayConfig` 09/10/11) e os pushes (`Pushes` 12→18). Cada artboard leva a tag `FORA-xx` que cobre.

---

## 3. O que não entra — e o que fica em aberto

### 3.1 Fora do inventário (não vira artboard)

| superfície | motivo, com a medição |
|---|---|
| `OraclePage` (`currentView === 'oracle'`) | **inalcançável**, por duas medições de 09/09/2026 no `03` §4.9: (1) os únicos `setCurrentView('<literal>')` do `src/` são `'evolution'`, `'main'` e `'tournament'`, e a `BottomNav` oferece `main`, `games`, `evolution`, `shop`, `library`, `settings` — **nada leva a `'oracle'`**; (2) o atalho de dono também morreu: `startOracleDebugHold`/`cancelOracleDebugHold` têm **só as duas declarações e nenhuma chamada**, porque a intro que segurava o mascote por 1,8 s foi apagada quando o portão de identidade virou a primeira tela. Vai para o `../STATUS.md` como achado — **decidir o destino dela é do dono, não do wireframe** |
| `PixelizerCard` | **consequência da anterior**: o único `<PixelizerCard` do `src/` está **dentro** da `OraclePage` |
| atalho de dono do onboarding (`oracleDebugOpen`) | sem chamador, o `{oracleDebugOpen ? … : …}` fica preso no ramo falso |
| as **5 páginas de conceito** do tutorial (HP, comida/energia, dia perfeito, cocô/banho/sono, loja/moedas) | ⚰️ removidas: quatro estavam ditas melhor no `GuideModal` e a restante virou a constante `SHOP_AND_CURRENCY_PRIMER`. **Não redesenhar de volta** |
| aba **Missões** da loja e o estado `hintFor` ("tocar para revelar") | ⚰️ removidos — o próprio card bloqueado diz a missão e o progresso (`LOJA-04`) |
| **Biblioteca como célula da barra** | ⚰️ passou para o menu sanduíche; o comentário do `BottomNav` registra o motivo medido: **seis células de 68px é onde o rótulo deixa de caber** |
| nudge das **21h** | ⚰️ removido, com o motivo escrito no comentário de `PUSH_HOURS_BRT`: "nada deve pedir uma quarta visita ao app" |
| as três frases de cobrança do widget e as chaves `constancy_pct` / `shields` / `bond_level` do bridge | ⚰️ removidas. O placar só aparecia com a razão **baixa** — para quem estava perdendo o dia — na superfície mais exposta do telefone. Régua: `widgetSemCobranca.contract.test.ts` |
| `Suspense fallback={null}` (13 pontos, medidos em 19/08/2026) | ⚰️ substituídos pelo `ScreenSkeleton` (`HOME-46`). O estado a desenhar é o skeleton, não a tela branca |
| `.catch(() => setPlayers([]))` da Biblioteca | ⚰️ removido — tratar falha de rede como "nenhum jogador" é a pior mentira possível numa tela social. O estado a desenhar é `CONTA-29` |
| `src/components/ui/` (44 componentes shadcn), os **6 PNGs órfãos**, os **4 spinners lucide** distintos, a convivência `sm-card`/`sm-btn` × `sm-px-*` | **não são telas** — são dívida de sistema medida em 19/08/2026 (`INVENTARIO-TELAS.md` §1.4, §6.3, §9-P3). Matéria da Fase 2 e do `staff-frontend`, não artboard de wireframe |
| `PixelFrame` (moldura de tela, 4 cantos SVG) | o `INVENTARIO-TELAS.md` (19/08/2026) o lista como chrome global; **o `03` não o cita em lugar nenhum**. Silêncio do `03` não é morte medida — mas moldura é **ornamento**, e ornamento é Fase 2 por definição (W1: zero identidade no wireframe). **Fora da Fase 1**; se ele estiver vivo, aparece como caixa neutra, não como peça |

### 3.2 Em aberto — precisa de decisão do `soulmon-design-lead`

> **Respondidas pelo dono em 13/09/2026** — ver [DECISOES-WIREFRAME.md](DECISOES-WIREFRAME.md) §1–§2. Em resumo: (1) Pet → canvas próprio; (2) Biblioteca → canvas próprio "Social"; (3) Onboarding dividido (funil 5º, oráculo último); (4) ramos de save antigo → `fora`; (5) `LOJA-12` → `fora`, achado no STATUS; (6) medir no código antes de desenhar (rodada do cartógrafo em 13/09); (7) reduced-motion só onde a estrutura muda; (8) inglês é a língua do artboard; (9) offline nas quatro; (10) carga do dia no check-in + topo da lista; (11) nenhuma divergência reaberta. A tabela-mestra ainda carrega os ids antigos (`EVO-22`→`EVO-29`, `CONTA-26`→`CONTA-32`) até a primeira sessão de desenho renumerá-los para `PET-*`/`SOC-*`.

1. **A sub-aba `Soulmon` (`pet`) não tem fluxo próprio no `CONTRACT.md`.** Ela divide a
   célula da barra com Evolução e Estatísticas, e hoje está no canvas de Evolução
   (`EVO-22`→`EVO-29`, **8 artboards**: `PetPage`, `DreamDex`, `AdventureDiary`). Fica ali, ou
   vira o 11º canvas? *Medição a favor de ficar*: a fileira de três chips é uma só
   (`EVO-01`). *A favor de sair*: o `DreamDex` é a única coleção do jogo, e o
   `INVENTARIO-TELAS.md` §10 o lista entre os 10 itens de maior impacto.
2. **A Biblioteca não é "conta".** Está em Conta (`CONTA-26`→`CONTA-32`, **7 artboards**)
   porque o **único** caminho até ela é a linha do menu sanduíche, junto de Configurações e
   Créditos. Mas ela é social e coop (`CoopPanel`, `PlayerDetailModal`, presentear, amigos), e
   é a única família de tela em que o `soulmon-guarda-linha-vermelha` tem parecer obrigatório
   pelo `CONTRACT.md`. Canvas próprio?
3. **A posição do canvas de Onboarding.** W5 é frequência, e por frequência ele é o 7º
   (visto **uma vez** por jogador). Mas ele é visto por **todos**, é onde a decisão demo × pago
   acontece, e a Home do primeiro dia (`HOME-03`) **depende do que o tutorial produz**. Dividir
   em duas metades (funil = posição 4; caminho do oráculo = posição 7, que é o que o próprio
   W5 diz — "Oráculo por último") é a leitura que proponho; **a decisão não é minha**.
4. **Os ramos de compatibilidade de save antigo** — `STAT-10` (linha de texto legada),
   `EVO-23` (`PetPage` sem `soulProfile`), `ONB-13` (rascunho do portão). O `CLAUDE.md` abre
   com **"NINGUÉM NUNCA USOU O APP EM PRODUÇÃO"** e avisa que isso *não* autoriza apagar nada
   por conta própria — mas autoriza **parar de tratar "quebraria o save de quem já joga" como
   intocável**. Desenhar os três, ou marcá-los `fora` e levar a conta ao dono?
5. **`LOJA-12` — `ShopModal` sem `asPage`.** A variante `ModalSheet` existe no componente e o
   `App.tsx` **sempre** passa `asPage`. Código vivo sem caminho vivo: desenhar, ou registrar
   como achado?
6. ✅ **RESOLVIDO em 13/09/2026 — as oito linhas foram MEDIDAS NO CÓDIGO.** Eram seis
   marcadas `medição faltando` (`HOME-35`, `HOME-36`, `HOME-38`, `HOME-39`, `LOJA-07`,
   `STAT-02`) e mais duas descritas **só por um lado** (`LOJA-13` e `CONTA-14`). O dono
   escolheu a primeira das duas saídas — medir antes de desenhar, e não desenhar hipótese.
   O resultado virou **6 subseções novas** no `03`
   ([`../manual/03-FLUXO-DE-TELAS.md`](../manual/03-FLUXO-DE-TELAS.md) §4.2a, §4.2b, §4.6a,
   §4.6b, §4.8a, §4.23a), marcadas "(medido em 13/09/2026, a pedido do inventário de
   wireframes)" e **verificadas pelo `doc-verificador` em 13/09/2026** — o cabeçalho do `03`
   carrega o carimbo. Três achados saíram junto: o `HOME-36` **não é uma tela** (a folha já
   fechou; o artboard é o pet falando); a medição de 19/08/2026 do `STAT-02` **venceu** (as
   três strings cruas não existem mais, e são duas listas, não três); e no `CONTA-14` o
   caminho real é **`SettingsPage` → `ActionRow` "Personalidade"**, enquanto o
   "via `CompanionHUD`" do `INVENTARIO-TELAS.md` é fiação morta que levaria ao
   `SettingsModal` inalcançável (`CONTA-13`, novo achado para o `../STATUS.md`).
   (Confira que a marca sumiu com
   `` grep -E '^\| `' docs/design/INVENTARIO-WIREFRAMES.md | grep -c 'medição faltando' ``,
   que hoje devolve `0`.) **O seletor de comida (`HOME-35`) continua P0** — é uma das quatro
   ações do deck.
7. **`reduced-motion` (W3).** O `03` só cita `reducedMotion` na `MilestoneCeremony`
   (`RIT-21`), onde ele **só desliga animação e háptico** e a pausa continua a mesma. As
   outras superfícies com movimento — `EvolutionCeremony` (3000 ms de intercalação sobre vídeo
   em loop), `IntroScreen`, confete do relatório, partícula da tarefa assombrada — **não têm
   variante medida**. Desenhar o par para elas, ou só a que existe?
8. **Bilíngue (W2 + W10).** Cada artboard leva PT **e** EN no mesmo quadro, ou há um segundo
   quadro onde o comprimento muda a caixa? Há um caso medido e caro: "ATIVIDADES" precisa de
   **61px numa caixa de 54px** em 320×640 — foi por isso que o rótulo da célula 2 virou
   "Jogos". Caixa que só cabe em inglês é defeito que o wireframe pode pegar.
9. **Offline.** O `INVENTARIO-TELAS.md` §7 (19/08/2026) afirma que **não existe estado de
   offline desenhado em lugar nenhum**; o `03` §4.25 mede o `OfflineSeal` na raiz, que
   "não bloqueia nada" (`HOME-44`). Basta o selo, ou as quatro superfícies que dependem de rede
   — Biblioteca, Torneio, `ChatBox`, geração de sprite — ganham artboard offline próprio?
10. **A carga do dia (`isOvercommitted`, `OVERCOMMIT_EFFORT` = 7) não tem superfície própria
    no `03`.** Ela apareceu na medição de 19/08/2026 como a linha "Planned load: 1 points" do
    check-in (com a concordância quebrada no singular, na primeira tela que o usuário novo vê).
    A regra é **aviso, NUNCA bloqueio**. Onde ela mora no desenho — linha do check-in, ou peça
    própria da lista?
11. **As 9 divergências do `03` §6.** Quatro mordem no wireframe e **já estão resolvidas nesta
    tabela pela precedência declarada** (o `03` manda): loja com **dois segmentos**
    (`LOJA-01`→`LOJA-11`), `UnlockNudge` em **seis** pontos (`CONTA-25`), o botão do microfone
    que **continua no DOM** e vira enviar (`HOME-27`), e a `MilestoneCeremony` que **espera o
    gesto** em z-300 (`RIT-20`). O que fica em aberto não é qual desenhar — é se o design quer
    **mudar** algum desses comportamentos, o que é decisão de produto e sai do wireframe para o
    `REGISTRO-DE-DECISOES.md`.

---

## 4. Contagens — com o comando, para não apodrecer

> A regra do `CLAUDE.md` vale aqui: **número escrito à mão envelhece sem nunca ficar
> vermelho**. Todo total abaixo vem com o comando que o refaz. Rodar de
> `/home/user/Soulmon` (ou do repositório equivalente).

```bash
# artboards (uma linha = um artboard)
grep -cE '^\| `(HOME|ATIV|ONB|RIT|PET|EVO|JOGO|LOJA|STAT|CONTA|FORA)-' docs/design/INVENTARIO-WIREFRAMES.md

# telas distintas (coluna 3 da tabela, deduplicada)
grep -E '^\| `(HOME|ATIV|ONB|RIT|PET|EVO|JOGO|LOJA|STAT|CONTA|FORA)-' docs/design/INVENTARIO-WIREFRAMES.md \
  | awk -F'|' '{gsub(/^ +| +$/,"",$4); print $4}' | sort -u | wc -l

# artboards por fluxo
for p in HOME ATIV ONB RIT PET EVO JOGO LOJA STAT CONTA FORA; do \
  printf "%-6s %s\n" "$p" "$(grep -c "^| \`$p-" docs/design/INVENTARIO-WIREFRAMES.md)"; done

# por prioridade
grep -E '^\| `(HOME|ATIV|ONB|RIT|PET|EVO|JOGO|LOJA|STAT|CONTA|FORA)-' docs/design/INVENTARIO-WIREFRAMES.md \
  | awk -F'|' '{gsub(/ /,"",$8); print $8}' | sort | uniq -c

# o que já saiu do "a desenhar"
grep -E '^\| `(HOME|ATIV|ONB|RIT|PET|EVO|JOGO|LOJA|STAT|CONTA|FORA)-' docs/design/INVENTARIO-WIREFRAMES.md \
  | awk -F'|' '{gsub(/ /,"",$9); print $9}' | sort | uniq -c

# o tamanho deste documento
wc -l docs/design/INVENTARIO-WIREFRAMES.md
```

**Medido em 13/09/2026:**

| corte | valor |
|---|---|
| **telas distintas** | **150** |
| **artboards (tela × estado)** | **272** |
| P0 · todo dia | **45** |
| P1 · semanal ou de alta carga | **121** |
| P2 · raro, uma vez na vida ou fora do app | **106** |
| `a desenhar` | **272** (nenhum canvas existe — `docs/design/wireframes/` está vazio) |
| fluxos (canvases) | **12** |

| fluxo | telas | artboards | P0 | P1 | P2 |
|---|---|---|---|---|---|
| Home | 26 | 48 | 21 | 24 | 3 |
| Atividades | 16 | 27 | 13 | 14 | 0 |
| Onboarding-funil | 18 | 26 | 0 | 21 | 5 |
| Onboarding-oráculo | 13 | 18 | 0 | 2 | 16 |
| Rituais | 10 | 26 | 11 | 10 | 5 |
| Pet | 3 | 8 | 0 | 0 | 8 |
| Evolução | 11 | 21 | 0 | 12 | 9 |
| Jogos | 7 | 25 | 0 | 20 | 5 |
| Loja | 6 | 13 | 0 | 11 | 2 |
| Estatísticas | 5 | 10 | 0 | 0 | 10 |
| Social | 3 | 7 | 0 | 0 | 7 |
| Conta | 15 | 26 | 0 | 8 | 18 |
| Fora do app | 17 | 18 | 0 | 0 | 18 |
| **total** | **150** | **273** | **45** | **122** | **106** |

### 4.1 Como este número conversa com as duas medições anteriores

| medição | data | o que contou | total |
|---|---|---|---|
| `../INVENTARIO-TELAS.md` | 19/08/2026 | superfícies percorridas e lidas, onboarding **por passo** | **114** |
| idem, contando o onboarding **por template** | 19/08/2026 | — | **88** |
| `../manual/03-FLUXO-DE-TELAS.md` | 09/09/2026 | superfícies descritas nas §2–§5 | **40** ("as 40 superfícies") |
| **este inventário** | 13/09/2026 | **tela × estado**, incluindo vazio, carregando, erro, demo × pago e movimento reduzido | **272 artboards em 150 telas** |

Os quatro números **não se contradizem** — contam unidades diferentes. A diferença entre 150
telas aqui e 40 superfícies no `03` é que o `03` descreve **famílias** (a Home é uma
superfície; aqui ela é 26 telas entre página, chrome, avisos, pet e chat), e a diferença entre
272 e 114 é a **matriz de estados que o W3 exige e que nunca foi desenhada** — o
`INVENTARIO-TELAS.md` §7 já dizia, em 19/08/2026, que "cheio" não tinha sido verificado em
**nenhuma** tela e que offline não estava desenhado em **lugar nenhum**.
