# Fluxo de telas do Soulmon

> **Dono:** doc-redator-telas · **Data:** 09/09/2026 · **Estado:** rascunho
> **Verificação:** `npx vitest run src/components/filaDeAvisos.contract.test.ts src/components/evolucaoManual.contract.test.ts src/components/ofertaDoisCanais.contract.test.ts src/components/upgradeReveal.contract.test.ts src/components/textoBilingue.contract.test.ts src/plugins/widgetSemCobranca.contract.test.ts` · guard do manual: `npx vitest run src/docsManual.contract.test.ts`
> **Não cobre:** aparência (cor, tipografia, espaçamento, tokens `--sm2-*`) — é do `04-IDENTIDADE-VISUAL.md`; as REGRAS que as telas aplicam (corações, meta do dia, evolução, moedas) — são do `02-REGRAS-DE-NEGOCIO.md`; a assinatura de cada componente — é de [`06-REFERENCIA/components.md`](06-REFERENCIA/components.md); percurso real com o app rodando — é do `soulmon-screen-cartographer`, cuja medição de 19/08/2026 está em [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## Como ler este documento

Cada superfície é descrita por sete campos fixos:

| Campo | O que é |
|---|---|
| **Chega por** | o gesto e o SÍMBOLO que faz a transição (`setCurrentView('shop')`, `handleOpenTriage`) |
| **Sai para** | o símbolo que fecha ou navega para fora |
| **Aparece quando** | a condição **transcrita** do código, em bloco — nunca parafraseada |
| **Estados** | vazio · carregando · erro · travado · demo × pago · movimento reduzido |
| **O que se vê/faz** | as ações que a tela oferece |
| **Dono** | o arquivo do componente |
| **Régua** | o teste que trava o comportamento, ou `régua: nenhuma` |

Duas medições que este documento usa e que envelhecem — o comando está junto para
poder ser refeito, em 09/09/2026:

```
wc -l src/App.tsx                       → 6245
wc -l src/components/SoulmonOnboarding.tsx → 1979
grep -rn "<UnlockNudge" src --include=*.tsx | grep -v "\.test\." | wc -l → 6
```

A medição por percurso real mais recente é de **19/08/2026**
([`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md), 114 superfícies contadas). O que
mudou depois dela está medido aqui no código e marcado com a data.

---

## 1. Mapa de navegação

### 1.1 O estado que decide a tela

Não existe roteador. A tela vem de **um** estado no `src/App.tsx`:

```ts
type ViewType = 'main' | 'evolution' | 'stats' | 'pet' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library' | 'shop';
const [currentView, setCurrentView] = useState<ViewType>('main');
```

São dez valores. **Nove são alcançáveis; `'oracle'` não é** — ver §4.9.

Antes de `currentView` chegar a decidir qualquer coisa, o `App` tem **quatro portões
de tela cheia**, nesta ordem literal (`src/App.tsx`, `showIntro` →
`hasCompletedOnboarding` → `hasCompletedTutorial` → `upgradeRitual`):

```
showIntro            → <IntroScreen>            (retorna, nada mais renderiza)
!hasCompletedOnboarding → <SoulmonOnboarding>   (retorna)
!hasCompletedTutorial   → <GameTutorialFlow>    (retorna)
upgradeRitual           → <SoulmonOnboarding mode="upgrade">  (retorna)
```

### 1.2 A barra inferior

Dono: `src/components/BottomNav.tsx` (`BottomNav`, lista `items`). São **quatro
destinos + o menu sanduíche** — teto declarado no cabeçalho do componente:

| Célula | `view` | Rótulo PT / EN | Glifo (`NavGlyphs.tsx`) |
|---|---|---|---|
| 1 | `main` | Início / Home | `home` |
| 2 | `games` | Jogos / Games | `activities` |
| 3 | `evolution` | Evolução / Evolution | `evolution` |
| 4 | `shop` | Loja / Shop | `shop` |
| 5 | — (popover) | Menu / Menu | `menu` |

⚰️ **A Biblioteca não é mais célula da barra** — passou para o menu sanduíche, e o
comentário do `BottomNav` registra por quê (seis células de 68px é onde o rótulo
deixa de caber). O menu tem quatro linhas (`MenuRow`): Biblioteca
(`onNavigate('library')`), Créditos (`onOpenCredits`, só se a prop existir),
Configurações (`onNavigate('settings')`) e "Refazer o ritual"
(`onResetOnboarding`, só se a prop existir).

⚠️ O rótulo da célula 2 é **"Jogos"/"Games"**, não "Atividades" — trocado em
09/09/2026 por dois motivos escritos no próprio `BottomNav.tsx`: "ATIVIDADES"
precisa de 61px numa caixa de 54px em 320×640, e `gameState.activities` são os
hábitos do jogador, que não moram nessa página.

### 1.3 As sub-abas de Evolução / Soulmon / Estatísticas

`evolution`, `pet` e `stats` **dividem a mesma célula da barra** e se alternam por
uma fileira de três chips renderizada no `App.tsx` sob a condição:

```jsx
{(currentView === 'evolution' || currentView === 'stats' || currentView === 'pet') && (
```

Cada chip chama `setCurrentView(view)`. Os rótulos são "Evolução"/"Evolution",
`Soulmon` (o mesmo nos dois idiomas) e "Estatísticas"/"Stats".

### 1.4 Diagrama

```
[splash do index.html]  (estática, some no 1º frame — main.tsx)
        │
        ▼
  IntroScreen ──(onFinish)──▶ SoulmonOnboarding ──(onComplete)──▶ GameTutorialFlow ──(onComplete)──▶ app
                                    │                                        (handleCompleteTutorial)
                                    └─ mode='upgrade' (compra no meio do jogo) ──(onRevealed)──▶ app

                    ┌──────────────────────── BottomNav ─────────────────────────┐
                    │                                                            │
   Home (main) ◀────┤   Jogos (games) ──▶ Torneio (tournament)                    │
    │ ▲             │        │                                                   │
    │ │             │        ├─ DungeonGame · ArenaGame · DinoGame · RPSGame      │
    │ │             │        │   (montam DENTRO da página, openGame)              │
    │ │             │   Evolução (evolution) ⇄ Soulmon (pet) ⇄ Estatísticas (stats)
    │ │             │        │                                                   │
    │ │             │   Loja (shop)  ── ShopModal asPage, 2 segmentos             │
    │ │             │        │                                                   │
    │ │             │   Menu ▸ Biblioteca (library) · Créditos (modal) ·          │
    │ │             │          Configurações (settings) · Refazer o ritual        │
    │ │             └────────────────────────────────────────────────────────────┘
    │ │
    │ └── ShopModal `onClose` → setCurrentView('main')
    │     ActivitiesPage `onOpenTournament` → setCurrentView('tournament')
    │     EvoTrail `onOpen` → setCurrentView('evolution')
    │
    ├── FILA 1: intersticiais (um por vez, tela cheia)
    │     triage → dailyReport → checkIn → dream → nightmare → welcome
    │
    └── FILA 2: slot de avisos da Home (só o primeiro; resto vira "+N")
          firstDay → hp → semanal → triagem → priming → recomeco
```

Os únicos `setCurrentView('<literal>')` fora da `BottomNav` em todo o `src/` são
três (medido em 09/09/2026 com
`grep -rn "setCurrentView(" src/ --include=*.tsx | grep -o "setCurrentView('[a-z]*'" | sort | uniq -c`):
`'evolution'` (do `EvoTrail`), `'main'` (do `ShopModal onClose`) e `'tournament'`
(do `ActivitiesPage`). **Nenhum leva a `'oracle'`.**

---

## 2. Primeira abertura, passo a passo

### 2.1 Splash estática do `index.html`

- **Chega por**: carregar a página. É HTML puro, pintado **antes** do bundle.
- **Sai para**: `main.tsx` a remove — `requestAnimationFrame` duplo adiciona a
  classe `done` e o `transitionend` chama `remover()`; um `window.setTimeout(remover, 1200)`
  é agendado **fora** do rAF, como rede de segurança.
- **Aparece quando**: sempre. `<div id="splash" aria-hidden="true">`.
- **Estados**: **erro de WebView** — um `<script>` inline testa
  `CSS.supports('color','oklch(0 0 0)')` e `color-mix`; falhando, ele monta um
  aviso bilíngue ("Precisamos de uma atualização" / "An update is needed") no
  `#root` **e remove a splash**, senão o aviso ficaria por baixo dela para sempre.
  **Idioma**: um segundo script troca `LOADING DATA...` por `CARREGANDO DADOS...`
  quando `navigator.language` começa com `pt`.
- **O que se vê/faz**: nada é clicável.
- **Dono**: `index.html` (`#splash`) + `src/main.tsx` (`remover`).
- **Régua**: nenhuma.

⚠️ O rAF sozinho não era rede de segurança: numa aba em segundo plano ele nunca
dispara, e o `setTimeout` agendado dentro dele também não — a splash ficava por
cima de um app já carregado. Corrigido em 27/08/2026 (comentário em `main.tsx`).

### 2.2 `IntroScreen` — o vídeo de marca

- **Chega por**: `showIntro` nasce `true` (`useState(true)`).
- **Sai para**: `onFinish` → `setShowIntro(false)`.
- **Aparece quando**:

  ```jsx
  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }
  ```

- **Estados**: **erro** — `onError` do `<video>` liga `videoFailed` e a tela cai
  no mascote + wordmark sobre gradiente, com `scheduleFinish(1500)`. **Duração**:
  `onLoadedMetadata` assume a duração real do vídeo; sem ela, 1500 ms.
- **O que se vê/faz**: tocar no vídeo (`skip`) reagenda a saída para 400 ms.
- **Dono**: `src/components/IntroScreen.tsx`.
- **Régua**: nenhuma.

### 2.3 `SoulmonOnboarding` — o ritual

Dono: `src/components/SoulmonOnboarding.tsx`. Um único estado `step` percorre a
sequência inteira. **Os passos negativos existem para não renumerar o ritual** —
é a mesma razão declarada de `DEMO_PICK`.

| Constante | Valor | O que é | Pulável? |
|---|---|---|---|
| `IDENTITY_STEP` | −6 | portão: "Continue with Google" ou "New User" | não (é o passo inicial) |
| `GOOGLE_STEP` | −9 | aceite dos Termos + 18+ e então o pop-up do Google | volta ao portão (`back`) |
| `EMAIL_STEP` | −8 | e-mail + senha, aceite e 18+ | volta ao portão (`back`) |
| `GOAL_STEP` | −2 | "por que você quer mudar" (`soulGoal`) | **sim** — botão que limpa o campo e chama `next()` |
| `STRUGGLE_STEP` | −3 | "o que te atrapalha" (`soulStruggle`) | **sim**, idem |
| `CHOICE_STEP` | −7 | grátis × completo | não |
| `DEMO_PICK` | −1 | os 3 personagens pré-prontos | volta ao `CHOICE_STEP` |
| `AGE_BLOCK` | −5 | muro de idade | saída única: `restartFromAgeBlock` |
| `1` | 1 | nome completo | não |
| `2` | 2 | data de nascimento (mapa astral **e** 18+) | não |
| `3` | 3 | hora | não |
| `4` | 4 | cidade (`CityPicker`) | não |
| `FAVORITE_STEP` | 5 | criatura favorita | **sim** — caixa "Prefiro não influenciar o resultado" |
| `QUIZ_START`..`QUIZ_END − 1` | 6..11 | as 6 de `ORACLE_QUESTIONS`, uma por página (`QUIZ_END` = 12 é o "primeiro passo pós-quiz", pelo comentário do código) | não (avançam sozinhas ao escolher) |
| `REFINE_OFFER` | 12 | a bifurcação do teste longo | é a própria escolha |
| `DEEP_START`..`DEEP_END − 1` | 13..32 | os 20 de `SOUL_TEST_ITEMS` (`DEEP_END` = 33, que é o próprio `GENERATING`) | só quem aceitou |
| `GENERATING` | — | tela de geração | — |
| `REVEAL` | — | nome + descrição + batismo | — |
| `REGISTER` | — | apelido (+ tonalidade, no demo) | — |

Os números 1..5 e 6..11 vêm das constantes derivadas
(`QUIZ_START = FAVORITE_STEP + 1`, `QUIZ_END = QUIZ_START + ORACLE_QUESTIONS.length`),
não de literais escritos à mão.

**Aparece quando**:

```jsx
if (!hasCompletedOnboarding) {
  return <Suspense …><SoulmonOnboarding onComplete={handleCompleteOnboarding} /></Suspense>;
}
```

**O portão de conta (`IDENTITY_STEP`)**

- `next()` **não** atravessa o portão:

  ```ts
  if (step === IDENTITY_STEP || step === EMAIL_STEP || step === GOOGLE_STEP) return;
  ```

  Quem atravessa é `aposAutenticar`, que grava o e-mail, carimba o
  `ConsentRecord` e faz `setStep(GOAL_STEP)`.
- **Sem Firebase configurado o portão não tranca**: `aoContinuarSemConta` existe
  exatamente para isso, e o cabeçalho diz que "falta de configuração vira
  ausência de conta, nunca porta trancada" — mas o aceite e o 18+ continuam
  obrigatórios (`podeAutenticar`).
- **Estados**: `authEmail === null` = ainda não se sabe (checagem assíncrona);
  `''` = deslogado; string = comprovado. `authOcupado` desabilita o botão, e
  `GOOGLE_SEM_RESPOSTA_MS` (120 000 ms) é a **rede de segurança**: passado o
  prazo o botão volta e uma mensagem honesta aparece, **sem cancelar a promessa
  original**. Erros vêm de `textoErroAuth`, tabelados nos dois idiomas
  (`popup-bloqueado`, `dominio-nao-autorizado`, `sem-resposta`, …).
- **Rascunho**: `readGateDraft()` (de `utils/gateDraft.ts`) devolve objetivo,
  dificuldade e aceite quando o link de e-mail levou a pessoa para fora do app e
  o `App.tsx` recarregou a página.

**Free × pago (`CHOICE_STEP`)**

```jsx
onClick={() => { setFlow('demo'); setStep(DEMO_PICK); }}   // "Começar agora — é grátis"
onClick={handleUnlockFull}                                 // "Quero o completo — <precoLabel>"
```

`handleUnlockFull` (mesmo arquivo) tem quatro saídas:

1. `!isBillingAvailable()` → mensagem "A compra está disponível no app Android
   (Google Play)…" e nada acontece;
2. `authUsavel && !authEmail` → recusa com "Entre com seu e-mail antes de
   comprar" (a compra manda o `saveId` como `obfuscatedAccountId`, e comprar
   antes do login amarra o recibo a um id que a conta abandona);
3. `result.ok` → `track('purchase', …)`, `setFlow('oracle')` e `setStep(1)`;
4. compra recusada → `setUnlockMessage`, com texto próprio para
   `result.reason === 'cancelled'` ("Compra cancelada.") e outro para o resto.

**O reveal**

O botão "Nascer <nome>" emite `track('reveal_seen', { has_sprite, funnel, duration })`
e então bifurca:

```ts
if (isUpgrade) onRevealed?.(result, revealSprite ?? undefined); else setStep(REGISTER);
```

`REVEAL_WAIT_MS` = 12 000 ms é o teto da espera pelo sprite; passado ele, o
reveal segue só com o texto e o desenho entra pelo acervo depois.

**`mode='upgrade'`**

- **Chega por**: `setUpgradeRitual(true)` — disparado no card da página de
  Evolução quando `gameState.accountTier === 'paid'` e ainda há
  `demoCharacterId`.
- **Aparece quando**:

  ```jsx
  if (upgradeRitual) { return <SoulmonOnboarding mode="upgrade" onComplete={handleCompleteOnboarding} onRevealed={handleUpgradeRevealed} onCancel={() => setUpgradeRitual(false)} /> }
  ```

- **O que muda**: `step` começa em `1`, `flow` já é `'oracle'`, não há portão,
  não há `CHOICE_STEP`, não há `DEMO_PICK` e não há `REGISTER`. `back()` no
  passo 1 chama `onCancel?.()` e volta ao jogo.
- **Régua**: `src/components/upgradeReveal.contract.test.ts`.

**Estados gerais do ritual**: barra de progresso (`role="progressbar"`) montada
sob `step > 0 && step <= lastStep`; rascunho do ritual por
`readOracleDraft(mode, DEEP_END - 1)` (nunca retoma na geração ou depois);
`generateError` renderiza um `role="alert"` na bifurcação.

**Régua**: `SoulmonOnboarding.portao.render.test.tsx`,
`SoulmonOnboarding.batismo.render.test.tsx`,
`SoulmonOnboarding.reveal.render.test.tsx`,
`SoulmonOnboarding.rascunho.render.test.tsx`,
`SoulmonOnboarding.copyRitual.render.test.tsx`.

### 2.4 `GameTutorialFlow` — o segundo onboarding

- **Chega por**: o portão `if (!hasCompletedTutorial)`, depois do onboarding.
- **Sai para**: `onComplete(activities.slice(0, remaining))` →
  `handleCompleteTutorial`.
- **Aparece quando**: `!hasCompletedTutorial`.
- **O que se vê/faz**: `PAGES.length` = **1** tela de conceito ("Seu Soulmon
  nasceu!" / "Your Soulmon is born!") e depois `TASK_STEP` — a criação
  **obrigatória** da primeira atividade. O jogador digita o objetivo, escolhe
  áreas de vida (`CATEGORIES`, 8) e recebe sugestões da API.
- **Estados**: **erro/offline** — `fallbackTasks` devolve até 4 tarefas locais
  de dois minutos (`FALLBACK_BY_CATEGORY`); **primeira ordenação** —
  `orderCategoriesForGoal` põe na frente a área que o `soulGoal` descreveu, e o
  texto não sai do aparelho (decisão D8).
- **Dono**: `src/components/GameTutorialFlow.tsx`.
- **Régua**: nenhuma (a régua do texto bilíngue é `textoBilingue.contract.test.ts`).

⚰️ As **5 páginas de conceito** (HP, comida/energia, dia perfeito, cocô/banho/sono,
loja/moedas) **não existem mais** — quatro estavam ditas melhor no `GuideModal`, e
o assunto restante virou a constante exportada `SHOP_AND_CURRENCY_PRIMER`.

### 2.5 `FirstDayCard`

- **Chega por**: entra na **fila de avisos** da Home, em primeiro lugar.
- **Sai para**: some sozinho na virada — não tem botão de fechar.
- **Aparece quando**:

  ```jsx
  if (shouldShowFirstDay(gameState.firstDay ?? null, playerDayKey(new Date(), gameState.playerDayTz))) {
  ```

  e a regra é `src/utils/firstDay.ts` (`shouldShowFirstDay`): `false` sem
  progresso, `false` se `p.day !== today`, e `!allGesturesDone(p)`.
- **O que se vê/faz**: três gestos (`FIRST_DAY_GESTURES`) — carinho, comida,
  concluir uma atividade — cada um com uma dica. **Não dá prêmio, não abre modal
  e não cobra.**
- **Dono**: `src/components/FirstDayCard.tsx`.
- **Régua**: `src/components/filaDeAvisos.contract.test.ts` (exige que
  `shouldShowFirstDay(` apareça **uma vez só**, dentro do `avisos.push`) +
  `FirstDayCard.render.test.tsx`.

### 2.6 `WelcomePromptModal`

- **Chega por**: é o **último** da fila de intersticiais.
- **Aparece quando**: `interstitial === 'welcome'` — ou seja, **nada mais está
  aberto**. Ele decide sozinho se tem o que dizer e devolve `null` quando não
  tem, e é por isso que não dá para consultá-lo de fora.
- **Estados**: duas metades independentes. **Instalar a PWA** some com
  `Capacitor.isNativePlatform()`, com `display-mode: standalone`, com
  `PWA_INSTALL_DISMISSED` ou sem `beforeinstallprompt` (há um `setTimeout(800)`
  antes de decidir). **Notificações** exigem `notificationsUnlocked`, que o
  `App.tsx` alimenta com `jaConcluiuAlgo`:

  ```ts
  const jaConcluiuAlgo = useMemo(
    () => (gameState.completedTasks?.length ?? 0) > 0
      || (gameState.activityLog?.length ?? 0) > 0
      || Object.values(gameState.activityStats ?? {}).some(s => (s?.completionCount ?? 0) > 0),
  ```

- **Dono**: `src/components/WelcomePromptModal.tsx`.
- **Régua**: nenhuma específica; a condição de entrada está descrita no bloco da
  fila em `src/App.tsx`.

---

## 3. As duas filas

### 3.1 Fila 1 — os intersticiais (um por vez, tela cheia)

A prioridade é **uma expressão só**, no `src/App.tsx` (`const interstitial`):

```ts
const interstitial: 'triage' | 'dailyReport' | 'checkIn' | 'dream' | 'nightmare' | 'welcome' =
  triageTasks ? 'triage'
    : showDailyReport && gameState.lastDayReport ? 'dailyReport'
      : checkInPlanData ? 'checkIn'
        : morningDream ? 'dream'
          : nightmareOpen ? 'nightmare'
            : 'welcome';
```

Ordem: **triagem → relatório diário → check-in → sonho → pesadelo → welcome
prompt**. Quem está mais abaixo continua **pendente** e monta sozinho quando o de
cima fecha — nada é descartado. A triagem vem primeiro por ser a única aberta
por TOQUE do usuário; o welcome prompt vem por último porque é o único que decide
sozinho se tem algo a dizer.

Duas superfícies **entram por gate reativo** em vez de entrar na fila:

```jsx
{protectPrompt && interstitial === 'welcome' && (   // ProtectProgressModal
<EvolveTaskModal isOpen={evolveModalStage !== null && evolutionCeremony === null} …/>
```

- **Régua**: `src/components/filaDeAvisos.contract.test.ts` — trava as duas
  strings acima, literalmente.

### 3.2 Fila 2 — o slot de avisos da Home

Uma IIFE monta o array `avisos` e **renderiza só `avisos[0]`**; o resto vira um
botão `+N` (`resto = avisos.length - 1`) que expande com `avisosAbertos`. A
ordem literal dos `push`, com a chave de cada um:

| # | `key` | Condição (do código) | Componente |
|---|---|---|---|
| 0 | `'firstDay'` | `shouldShowFirstDay(gameState.firstDay ?? null, playerDayKey(new Date(), gameState.playerDayTz))` | `FirstDayCard` |
| 1 | `'hp'` | `gameState.healthPoints <= 1 && gameState.healthPoints > 0 && dailyDone < hpSafeToday && !hpBannerDismissed` | bloco `sm2-notice-warn` inline |
| 2 | `'semanal'` | `needsWeeklyReport(gameState, agoraA)` | `WeeklyReportCard` |
| 3 | `'triagem'` | `triageQueue(gameState.tasks, agoraA).length > 0` | botão "Arrumar a pilha" → `handleOpenTriage` |
| 4 | `'priming'` | `mostrarPrimingDePush` (`shouldPrimePush`, `utils/pushPriming.ts`) | seção inline com "Pode sim" / "Agora não" |
| 5 | `'recomeco'` | `freshStartDismissed ? null : freshStartOffer(gameState, agoraA, language)` | bloco `sm2-notice` inline |

- **Régua**: `src/components/filaDeAvisos.contract.test.ts` — exige as chaves
  `'firstDay'` e `'priming'`, exige que `shouldShowFirstDay(` e
  `if (mostrarPrimingDePush) avisos.push` apareçam **uma vez cada**, e trava a
  ordem `key: 'semanal'` **antes** de `key: 'triagem'`.

⚠️ O comentário do slot no `App.tsx` numera "1. HP" duas vezes (a primeira antes
do item 0). É defeito de comentário, não de comportamento: a ordem executada é a
dos `push`, que é a da tabela acima.

---

## 4. As superfícies, uma a uma

### 4.1 Home — `currentView === 'main'`

**Chega por**: célula 1 da `BottomNav`, `setCurrentView('main')` (também é o
valor inicial e o destino do `onClose` da Loja) · **Sai para**: qualquer célula
da barra.

A Home empilha, nesta ordem de render:

1. **`HomeHud`** — o `<h1>` da Home (o wordmark) + `focusSealed` (o selo do dia,
   binário: `focoDoDiaCompleto`), energia e vida em modo `hideMeters`.
2. **O slot de avisos** (§3.2).
3. **`CompanionHUD`** — §4.2.
4. **`PlayCard`**, sob `{jaConcluiuAlgo && (…)}` — §4.14.
5. **`EvoTrail`**, sob `(gameState.soulmonStages?.length ?? 0) > 0`, com
   `onOpen={() => setCurrentView('evolution')}`.
6. **`QuickAddBar`** (`onCommit={handleQuickAdd}`).
7. **Botão "Equilibrar minha semana"**, sob `{podeEquilibrar && (…)}` →
   `setBalanceOpen(true)`.
8. **`RitualPanel`** com as tarefas (`RitualRow` + `TaskMeta`) e as atividades
   (`RitualRow` + `StepRow` + `HabitConstancy`).
9. **A gaveta "Guardadas"**, sob `{guardadas.length > 0 && (…)}`, um `<details>`
   fechado por padrão com o botão "Retomar" (`handleRestoreTask`).

**Estados**: **vazio** — `RitualPanel` recebe `emptyMessage={total === 0 ? t.main.noActivityRegistered : undefined}`;
**hábito fora do dia** — `dimmed={!disponivelHoje}` e as etapas ficam inertes;
**sem métricas** — `HabitConstancy` recebe `hideMetrics={gameState.rest?.hideMetrics === true}`.

**Dono**: `src/App.tsx` (bloco `currentView === 'main'`) · **Régua**:
`src/components/dailyList.sm2.render.test.tsx`,
`src/components/p5DiaCompleto.contract.test.ts`.

### 4.2 `CompanionHUD` — a área do pet

**Chega por**: está montado o tempo todo na Home · **Sai para**: nada (não navega).

- **O gesto de carinho**: um `<button>` transparente sobreposto ao sprite
  (`className="sm2-rub"`), com `aria-label` "Fazer carinho no Soulmon (segure
  para curar)" / "Pet your Soulmon (hold to heal)", `onPointerDown/Move/Up` e
  `onKeyDown` (Enter/Espaço rodam um ciclo de 2 s). A regra e o teto de cura são
  de `onPet` (`handlePet` no `App.tsx`), nunca daqui.
- **O deck de quatro ações** (`div.sm2-deck`, `role="group"`), na ordem literal
  do array: `feed` (abre o seletor de comida, `setFeedOpen(true)`), `items`
  (`onOpenItems` → `handleOpenItems`, que **alterna** `showItemsWindow`), `bath`
  (`handleShowerClick`; `disabled: showerCooldown` é um cooldown de 5 s contra o
  toque duplo — não existe gate de regra, o banho está sempre disponível) e `sleep` (`onSleep`, glifo `bedtime`/`wb_sunny`).
- **Botão "Evoluir"**: montado sob `{canEvolve && !isSleeping && (…)}`, chama
  `onEvolveRequest`.
- **Estados**: `hauntedWatching` acrescenta a classe `sm-pet-haunted` ao sprite —
  é gesto, sem texto junto; `hasNewItems` acende o selo do botão de itens;
  `isSleeping` troca a ação de dormir por acordar.
- **Dono**: `src/components/CompanionHUD.tsx` · **Régua**:
  `CompanionHUD.render.test.tsx`, `CompanionHUD.cta.test.tsx`,
  `CompanionHUD.vinculo.render.test.tsx`, `CompanionHUD.voz.render.test.tsx`,
  `CompanionHUD.reacao.render.test.tsx`, `src/components/som-presenca-d11.render.test.tsx`.

### 4.3 `ChatBox` — a barra de conversa

**Chega por**: montada dentro do `CompanionHUD` · **Sai para**: nada.

- **O botão da direita é UM só, e troca de ação** — nunca dois em `? :`, porque
  desmontar o nó no instante do envio derruba o foco do teclado:

  ```jsx
  onClick={hasText || micDisponivel === false ? handleSendMessage : handleMicClick}
  ```

- **O microfone**: `micDisponivel` nasce `null` (**otimista**: `null` desenha o
  microfone) e só vira `false` quando o servidor responde. A busca acontece na
  **primeira interação** com a barra, nunca na montagem — há guard exigindo que
  montar o `CompanionHUD` não toque a rede:

  ```ts
  const garantirConfig = useCallback(async () => {
    const { transcribeAvailable } = await fetchServerConfig();
    setMicDisponivel(transcribeAvailable);
    return transcribeAvailable;
  }, []);
  ```

  ⚠️ **Divergência com o `CLAUDE.md`**, que diz "sem elas o botão de microfone
  **não é desenhado**": com `micDisponivel === false` o **botão continua no DOM**
  — o que muda é o glifo (vira `send`) e o `aria-disabled` quando também não há
  texto. O comentário do próprio arquivo explica: "continua no DOM: o nó do foco
  tem que ser estável".
- **Estados**: `isLoading` → glifo `sync` girando; `isRecording` → `stop_circle`
  em tom `danger`; permissão negada → o pet fala "Não consegui acessar o
  microfone. Dá para escrever aqui do mesmo jeito 🎤" / "I could not reach the
  microphone. You can still type here 🎤".
- **Memória**: `history` vive em `useState`, cortado em 6 entradas — **nada vai
  para o save nem para o `localStorage`**.
- **Dono**: `src/components/ChatBox.tsx` · **Régua**:
  `src/security/supabase.contract.test.ts` (as quatro peças da transcrição).

### 4.4 `ActivitiesPage` — `currentView === 'games'`

**Chega por**: célula 2 da `BottomNav` · **Sai para**: `onOpenTournament` →
`setCurrentView('tournament')`; cada jogo monta **dentro** desta página.

- **O que se vê/faz**: um card destacado (`featured: true`) para o **Torneio** e
  a lista `games` com **quatro** minijogos, na ordem literal do array:
  `dungeon` (Masmorra), `arena` (Arena), `dino` (Corrida do Dino), `rps`
  (Pedra, Papel e Tesoura). Cada card é um `<button>` inteiro.
- **Aparece quando**: o jogo monta sob `{openGame === '<id>' && (…)}` — estado
  `useState<'dungeon' | 'arena' | 'dino' | 'rps' | null>(null)`; cada jogo sai
  por `onExit={() => setOpenGame(null)}`.
- ⚠️ **A Arena está viva desde então**: o `../INVENTARIO-TELAS.md` de 19/08/2026
  a lista como código morto ("`grep -rn "ArenaGame" src --include=*.tsx` fora do
  próprio arquivo: zero"). Em 09/09/2026 ela é o segundo card da lista. O
  comentário da `BottomNav.tsx` ainda descreve a página como "dungeon + dino +
  pedra-papel-tesoura + torneio" — **são quatro minijogos, não três**. O
  `CLAUDE.md` não descreve os minijogos da página (`grep -ni 'arena\|dino' CLAUDE.md`
  devolve só as linhas de Bits, Masmorra e áudio).
- **Dono**: `src/components/ActivitiesPage.tsx` · **Régua**:
  `src/components/ArenaGame.render.test.tsx`, `src/utils/cortes.contract.test.ts`
  (a régua de som que a Arena reintroduziu).

### 4.5 A lista de atividades (Home) e seus modais

| Superfície | Chega por | Aparece quando | Sai para | Dono |
|---|---|---|---|---|
| `QuickAddBar` | está na Home | sempre (acima do painel) | `onCommit={handleQuickAdd}` | `QuickAddBar.tsx` |
| `CreateModal` | CTA `+ Nova atividade` (`handleAddNewActivity`) e `EvolveTaskModal.onCreateTask` | `{createModalOpen && (…)}` | `onClose={() => setCreateModalOpen(false)}` | `CreateModal.tsx` |
| `EditModal` | toque no lápis de uma atividade (`handleEditActivity`) | `{editModalOpen && (…)}` | `onClose` limpa `editModalOpen` e `editingActivity` | `EditModal.tsx` |
| `TaskEditModal` | toque no lápis de uma tarefa (`handleEditTask`) | `{taskEditModalOpen && (…)}` | idem, com `editingTask` | `TaskEditModal.tsx` |
| `PostponeNudgeSheet` | `TaskMeta` → `handlePostponeNudge` | `task={nudgeTaskId ? … : null}` | `handleCloseNudge` | dentro do `App.tsx` |
| `BalanceWeekModal` | botão "Equilibrar minha semana" | `{balanceOpen && (…)}` | `onClose={() => setBalanceOpen(false)}` | `BalanceWeekModal.tsx` |
| `TriagePile` | botão "Arrumar a pilha" → `handleOpenTriage` | `interstitial === 'triage' && triageTasks` | `onClose={() => setTriageTasks(null)}` | `TriagePile.tsx` |

**Demo × pago**: `CreateModal` recebe `capIsDemoBoundary={gameState.accountTier === 'demo'}`
e `onUnlock={() => { setCreateModalOpen(false); setUnlockReason('task-limit'); }}`.
O `EditModal` também monta o `UnlockNudge` — **era o caminho que contornava o
teto do demo**, porque o botão principal de criar da tela inicial abre o
`EditModal`, que salvava sem checar cap.

**`TriagePile`**: quatro saídas de peso igual, `TriageAction = 'today' | 'week' | 'someday' | 'drop'`;
quem aplica é `handleTriageResolve` no `App.tsx`, delegando a `toOpen`,
`postpone`, `toSomeday` e `drop`. A fila é **congelada** ao abrir (`setTriageTasks(triageQueue(…))`),
para o contador não mentir enquanto encolhe.

**Régua**: `CreateModal.presets.render.test.tsx`, `QuickAddBar.render.test.tsx`,
`TaskMeta.render.test.tsx`, `StepRow.render.test.tsx`,
`HabitConstancy.hideMetrics.render.test.tsx`,
`BalanceWeekModal.render.test.tsx`.

### 4.6 Loja — `currentView === 'shop'`

**Chega por**: célula 4 da `BottomNav` · **Sai para**: `onClose={() => setCurrentView('main')}`.

⚠️ **Divergência com o `CLAUDE.md`**, que descreve "Loja em ABAS
(Itens/Cenários/Mobílias/Torneio/Missões)". O código tem **dois segmentos**:

```ts
type ShopSegment = 'shop' | 'tournament';
```

- Dentro de `'shop'` há **três seções** de rolagem única (`sections`): Itens
  (`kind === 'chip' || kind === 'heart'`), Cenários (`kind === 'bg'`) e Mobílias
  (`kind === 'furniture'`).
- Dentro de `'tournament'` há uma seção (`TOURNAMENT_ITEMS`) e, **no topo**, as
  missões semanais, sob `{seg === 'tournament' && (weeklyMissions?.length ?? 0) > 0 && (…)}`.
- ⚰️ **A aba Missões não existe mais** — o próprio card bloqueado diz a missão e
  o progresso; o estado `hintFor` ("tocar para revelar") saiu junto.
- **Demo × pago**: `{seg === 'shop' && accountTier === 'demo' && onUnlock && (…)}`
  monta o `UnlockNudge` com `reason="shop"`.
- **Como página × como modal**: `asPage` (o valor que o `App.tsx` passa) devolve
  um `<div>` com o saldo no topo; sem ele, a mesma `body` vai dentro de um
  `ModalSheet` com título "Loja"/"Shop".
- **Dono**: `src/components/ShopModal.tsx` · **Régua**:
  `ShopModal.missoes.render.test.tsx`, `ShopModal.convitePassivo.render.test.tsx`,
  `src/utils/weeklyMissions.fiacao.test.ts`.

### 4.7 Soulmon — `currentView === 'pet'`

**Chega por**: chip "Soulmon" da fileira de sub-abas · **Sai para**: os outros
dois chips.

Três blocos, cada um com condição própria e cada um em `Suspense` com
`<ScreenSkeleton language={language} />`:

```jsx
{currentView === 'pet' && (<Suspense …><PetPage …/></Suspense>)}
{currentView === 'pet' && (… <DreamDex rest={gameState.rest ?? createRestState()} …/> …)}
{currentView === 'pet' && (… <AdventureDiary entries={gameState.adventures ?? []} …/> …)}
```

- **`PetPage`** mostra as formas **já desbloqueadas** (nunca as futuras), a
  descrição do oráculo, a classe do estágio (`classTitle`) e as duas habilidades.
  **Estado**: save legado sem `soulProfile` simplesmente não mostra habilidades.
- **`DreamDex`**: os 30 do `DREAM_CATALOG`; o não coletado é **silhueta**, nunca
  "faltando".
- **`AdventureDiary`**: só o que já aconteceu — **não** mostra lacuna, de
  propósito (o contrário do Dex).
- **Régua**: `AdventureDiary.render.test.tsx`.

### 4.8 Estatísticas — `currentView === 'stats'`

**Chega por**: chip "Estatísticas" · **Sai para**: os outros dois chips.

Quatro cartões, cada um com condição literal dentro da `StatsPage`:

| Cartão | Aparece quando | Observação |
|---|---|---|
| `BirthCard` | `{birth && (…)}` — o `App.tsx` monta `birth` sob `gameState.bornAt \|\| gameState.soulmonMeta?.baseName \|\| gameState.demoCharacterId` | **Demo**: `displaySprite` lê o acervo, que o demo nunca preenche, então há fallback `getSpriteForStage('rookie', gameState.demoCharacterId)` |
| `BestiaryCard` | `{(bestiary?.length ?? 0) > 0 && (…)}` | **condição PRÓPRIA, não aninhada no álbum** — o álbum depende de `soulmonStages`, que o jogador grátis não tem |
| `FormAlbum` | `{album && album.length > 0 && (…)}` | silhueta para o não alcançado, com `reachedAt` |
| linha de texto legada | `{!album && formNames.length > 0 && (…)}` | ⚰️ o que o álbum substituiu, mantido para save sem `album` |

`MemoriesCard` **não mora aqui** — ele é montado dentro do `DailyReportModal`
(§4.16).

**Régua**: `BestiaryCard.render.test.tsx`, `FormAlbum.render.test.tsx`,
`BirthCard.render.test.tsx`, `MemoriesCard.render.test.tsx`.

### 4.9 `OraclePage` — `currentView === 'oracle'`, inalcançável

- **Aparece quando**: `{currentView === 'oracle' && (…)}`.
- **Como se sabe que é inalcançável** — duas medições de 09/09/2026:
  1. `grep -rn "setCurrentView(" src/ --include=*.tsx | grep -o "setCurrentView('[a-z]*'"`
     devolve **só** `'evolution'`, `'main'` e `'tournament'`; a `BottomNav`
     oferece `main`, `games`, `evolution`, `shop`, `library` e `settings`.
     **Nada leva a `'oracle'`.**
  2. O segundo caminho, o atalho de dono do onboarding, **também morreu**:
     `grep -n "startOracleDebugHold\|cancelOracleDebugHold" src/components/SoulmonOnboarding.tsx`
     devolve apenas as duas **declarações** (`const startOracleDebugHold = () =>`
     e `const cancelOracleDebugHold = () =>`) e **nenhuma chamada** — a intro de
     marca que segurava o mascote por 1,8 s foi apagada quando o portão de
     identidade virou a primeira tela. Sem chamador, `setOracleDebugOpen(true)`
     nunca roda, e o `{oracleDebugOpen ? … : …}` fica preso no ramo falso.
- **Consequência**: `PixelizerCard` também é inalcançável — o único
  `<PixelizerCard` do `src/` está dentro da `OraclePage`.
- **Dono**: `src/components/OraclePage.tsx`, `src/components/PixelizerCard.tsx`.
- **Régua**: nenhuma. ⚠️ Vai para o `../STATUS.md` como achado.

### 4.10 Evolução — `currentView === 'evolution'`

**Chega por**: célula 3 da `BottomNav` (que também chama `contarMissao('evolve-view')`)
ou `EvoTrail.onOpen` · **Sai para**: os chips das sub-abas.

Cinco blocos, com estas condições literais:

```jsx
{currentView === 'evolution' && gameState.demoCharacterId && (…UnlockNudge…)}
{currentView === 'evolution' && (…EvolutionPath…)}
{currentView === 'evolution' && canRebirth(gameState) && (…botão Renascimento…)}
{currentView === 'evolution' && rebirthRefusal(gameState) === 'not-paid' && (…UnlockNudge…)}
{currentView === 'evolution' && gameState.rebirth && (…linha "Renasceu do …"…)}
```

- **Demo × pago no convite**: `variant={gameState.accountTier === 'paid' ? 'reveal' : 'buy'}`;
  `onOpen` chama `setUpgradeRitual(true)` para quem já pagou e
  `setUnlockReason('evolution')` para quem não pagou.
- **`EvolutionPath`**: o **cadeado** é a ação dominante — toque na criatura
  atual alterna `evolutionLocked` (`onToggleEvolutionLock` →
  `handleToggleEvolutionLock`), e o mesmo estado aparece como botão de 44px para
  quem não descobre o gesto. **Estados de sprite**: `generatingSprites`
  (o card `GERANDO`), `onRetrySprite`, `onRevertVisor`, `onTuneVisor`,
  `onSeenTune`; `carePattern` só é passado quando `carePatternReading.confident`.
- **Régua**: `src/components/evolucaoManual.contract.test.ts` (a régua VIVA da
  evolução manual), `EvolutionPath.estados.render.test.tsx`,
  `EvolutionPath.silhueta.render.test.tsx`, `EvolutionPath.sprite.render.test.tsx`,
  `EvolutionPath.credencial.render.test.tsx`,
  `EvolutionPath.sintonia-anuncio.render.test.tsx`.

### 4.11 `EvolutionCeremony` e `EvolveTaskModal`

- **`EvolutionCeremony`** — **Chega por**: `handleEvolveRequest`, que só abre se
  o destino for diferente do estágio atual:

  ```ts
  if (next !== evolutionStage) setEvolutionCeremony({ from: evolutionStage, to: next });
  ```

  **Aparece quando**: `{evolutionCeremony && (…)}` · **Sai para**:
  `onEvolved={handleEvolve}` (o commit) e `onClose={() => setEvolutionCeremony(null)}`.
  **O que se vê**: os sprites da forma atual e da próxima intercalam por `TOTAL_MS` (3000 ms),
  brancos, até estabilizar na evoluída, sobre vídeo em loop.

- **`EvolveTaskModal`** — **Aparece quando**:

  ```jsx
  isOpen={evolveModalStage !== null && evolutionCeremony === null}
  ```

  ⚠️ O `evolutionCeremony === null` é o encadeamento que **faltava**: evoluir
  abria a cerimônia (z-500) e este modal montava por baixo (z-50), reaparecendo
  cobrando "crie mais atividades" quando ela fechava.
  **Sai para**: `onCreateTask` → `setEvolveModalStage(null)` + `setCreateModalOpen(true)`.
  **Número que ele mostra**: `registeredForDay(gameState, new Date().getDay(), new Date().toDateString())`
  — cadastradas **para hoje**, nunca `activities.length` cru.
- **Régua**: `src/components/filaDeAvisos.contract.test.ts` trava a string do
  `isOpen`.

### 4.12 `RebirthModal`

- **Chega por**: botão "Renascimento" da página de Evolução ·
  **Aparece quando**: `{rebirthOpen && (…)}`, e o botão que o abre só existe sob
  `canRebirth(gameState)`.
- **Sai para**: `onConfirm` (async — só fecha com `ok`) e `onClose`.
- **Estados**: a confirmação exige **um segundo toque** (`confirmando`); a perda
  é dita **antes** de qualquer escolha, com nome e número, e o que **não** se
  perde é dito junto.
- **Recusa motivada**: `rebirthRefusal` distingue `not-paid` / `not-ultra` /
  `already-used`; só `not-paid` vira convite (`UnlockNudge` com `reason="evolution"`).
- **Dono**: `src/components/RebirthModal.tsx` + `src/utils/rebirth.ts`.

### 4.13 `UnlockNudge` e `UnlockAccountModal`

- **`UnlockAccountModal`** — **Aparece quando**: `{unlockReason && (…)}`, na raiz
  do `App`. **Nunca abre sozinho.** `UnlockReason = 'task-limit' | 'evolution' | 'report' | 'shop'`.
  **Sai para**: `onUnlocked={handleAccountUnlocked}` (só depois de o **servidor**
  confirmar) e `onClose={() => setUnlockReason(null)}`.
- **`UnlockNudge`** — ⚠️ **Divergência com o `CLAUDE.md`**, que fala em "dois
  lugares" e depois corrige para "TRÊS". Medido em 09/09/2026
  (`grep -rn "<UnlockNudge" src --include=*.tsx | grep -v "\.test\." | wc -l` → **6**):

  | Onde | `reason` | Condição |
  |---|---|---|
  | `CreateModal.tsx` | `task-limit` | teto do demo |
  | `EditModal.tsx` | `task-limit` | teto do demo (o caminho que contornava o cap) |
  | `ShopModal.tsx` | `shop` | `seg === 'shop' && accountTier === 'demo' && onUnlock` |
  | `DailyReportModal.tsx` | `report` | `showOffer` (`ofereceNoRelatorio`, com cap semanal por `offerShownWeek`) |
  | `App.tsx` (Evolução) | `evolution` | `currentView === 'evolution' && gameState.demoCharacterId` |
  | `App.tsx` (Renascimento) | `evolution` | `rebirthRefusal(gameState) === 'not-paid'` |

- **Régua**: `src/components/ofertaDoisCanais.contract.test.ts`,
  `UnlockAccountModal.copy.render.test.tsx`,
  `UnlockAccountModal.dismiss.render.test.tsx`.

### 4.14 Os jogos

| Jogo | Chega por | Sai para | Estados | Dono |
|---|---|---|---|---|
| `DungeonGame` | card na `ActivitiesPage` | `onExit` | `phase`: `intro` → `attack`/`defend`/`result` → `enemy-down` → `floor-clear` → `run-complete` \| `lost`; `floor` até `MAX_FLOORS` (5) | `DungeonGame.tsx` |
| `ArenaGame` | card na `ActivitiesPage` | `onExit` | usa a ficha (`skills`, elemento) | `ArenaGame.tsx` |
| `DinoGame` | card na `ActivitiesPage` | `onExit` | `onScore={onDinoScore}` alimenta o recorde | `DinoGame.tsx` |
| `RPSGame` | card na `ActivitiesPage` | `onExit` | duelo curto | `RPSGame.tsx` |
| `NightmareBattle` | **fila de intersticiais** | `onWin={handleNightmareWin}` / `onLose`/`onClose` = `closeNightmare` | perder não custa nada, e a tela diz isso | `NightmareBattle.tsx` |
| `PlayCard` | cartão na Home | não navega | `canPlay` / `playedToday` / `buff` | `PlayCard.tsx` |

**`NightmareBattle` — aparece quando** (efeito no `App.tsx`, transcrito):

```ts
if (nightmareOpen) return;
if (isSleeping) return;
const hour = now.getHours();
if (hour < 4 || hour >= 12) return; // só de manhã
const rest = gameState.rest;
if (!rest) return;
if (!hasPendingNightmare(gameState.nightmares ?? EMPTY_NIGHTMARES, rest, now)) return;
setNightmareOpen(true);
```

`não percorrida` — depende de noite registrada e da janela 4h–12h.

**`PlayCard` — aparece quando**: `{jaConcluiuAlgo && (…)}`. Não existe antes da
primeira conclusão porque `canPlay` exige energia ≥ `PLAY_ENERGY_COST` (1), energia vem de comida e
comida vem de concluir — no dia 1 o card nasceria indisponível.

**`MAX_FLOORS`** mora em `src/components/DungeonGame.tsx` (medido em 09/09/2026;
o `CLAUDE.md` já registra que ele **não** está em `utils/dungeon.ts`).

### 4.15 Torneio — `currentView === 'tournament'`

**Chega por**: `onOpenTournament` da `ActivitiesPage` · **Sai para**: a barra.

- **O que se vê/faz**: a **faixa** (`getTierStanding`) vem **antes** do ranking;
  o ranking é uma **janela de ±`RANK_WINDOW` (3) posições**, com a season inteira a um toque; o
  placar de derrota é tinta neutra; perder também rende Emblemas e a tela diz.
- **Estados**: **vazio** — "Enable PvP above…" quando `pvpEnabled` é falso; o
  gate de Vínculo (`BOND_PVP_MIN_LEVEL`) é decidido pelo servidor.
- **Efeitos ao jogar**: `onEarnEmblems` soma emblemas **e** chama
  `contarMissao('tournament-match')` (conta a PARTIDA, não a vitória);
  `onMatchPlayed` credita XP de Vínculo.
- **Dono**: `src/components/TournamentPage.tsx` · **Régua**:
  `TournamentPage.bondGate.test.tsx`.

### 4.16 `DailyReportModal` (+ humor, aventura, memórias, oferta)

- **Chega por**: a fila de intersticiais · **Aparece quando**:

  ```jsx
  {interstitial === 'dailyReport' && gameState.lastDayReport && (
  ```

  e o `showDailyReport` é ligado por um efeito com a trava de 1×/dia:

  ```ts
  if (readLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN) === report.date) return;
  setShowDailyReport(true);
  ```

- **Sai para**: `onClose` — que **primeiro** grava o marco de memória
  (`markMemoryShown`, idempotente; registrado ao FECHAR, não ao abrir) e depois
  chama `handleCloseDailyReport`.
- **O que se vê/faz**: o resumo do dia; o **check-in de humor** (5 carinhas,
  `moodToday={moodFor(…)}` / `onPickMood={handlePickMood}` — opcional e nunca
  alimenta pontuação); `onRecoverHearts`; a aventura da noite (`aventuraDaNoite`,
  com `adventureIsNew`); o `MemoriesCard` sob `memories !== null`
  (`memoryToShow` compara por **igualdade**, então o cartão aparece uma vez em 30
  e uma em 90 dias); e a **oferta** sob `showOffer={ofereceNoRelatorio}`, que ao
  abrir marca a semana **antes** (`offerShownWeek`) e chama `setUnlockReason('report')`.
- **Estados**: `soulGoal` volta em dias completos e no retorno de ausência.
- **Dono**: `src/components/DailyReportModal.tsx` · **Régua**:
  `DailyReportModal.aventura.render.test.tsx`,
  `src/components/ofertaDoisCanais.contract.test.ts`.

### 4.17 `MorningCheckIn`

- **Chega por**: a fila · **Aparece quando**: `{interstitial === 'checkIn' && checkInPlanData && (…)}`,
  e o plano é congelado por um efeito com **quatro** guardas literais:

  ```ts
  if (checkInPromptedRef.current === hoje) return;
  if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
  if (!needsCheckIn(gameState, now)) return;
  const plan = checkInPlan(gameState, now);
  if (plan.habitsToday.length === 0 && plan.suggestedFocus.length === 0 && plan.carryOver.length === 0) return;
  ```

- **Sai para**: `onConfirm={handleCheckInConfirm}` (grava focos, conta missão,
  credita XP, emite `checkin_commit`) ou `onSkip={handleCheckInSkip}` (**marca o
  dia do mesmo jeito** — um ritual que reaparece por ter sido recusado é
  cobrança).
- **O que se vê/faz**: pendências de ontem primeiro, hábitos do dia, até
  `MAX_DAILY_FOCUS` focos, humor. Na segunda falta seguida o pet oferece a
  **versão reduzida**, e aceitar usa o **mesmo** caminho de conclusão
  (`onTinyHabit={handleToggleActivityCompletion}`).
- **Dono**: `src/components/MorningCheckIn.tsx` · **Régua**:
  `MorningCheckIn.commit.render.test.tsx`,
  `MorningCheckIn.ofertaReduzida.render.test.tsx`.

### 4.18 `MorningDream`

- **Chega por**: a fila · **Aparece quando**: `{interstitial === 'dream' && morningDream && (…)}`.
  As guardas do efeito, transcritas:

  ```ts
  if (isSleeping) return;
  if (hour < 4 || hour >= 12) return; // só de manhã
  if (!rest) return;
  if (dreamShownRef.current === key) return;
  if (!rest.nights.some(n => n.date === key)) return; // nenhuma noite registrada
  if (readLocal(STORAGE_KEYS.MORNING_DREAM_SHOWN) === key) return;
  ```

- **Sai para**: `onClose={() => setMorningDream(null)}`.
- **Estados**: `dream === null` → um bom-dia neutro. **Nenhuma variante julga a
  noite** — sem score, sem duração, sem nota.
- **Dono**: `src/components/MorningDream.tsx`. `não percorrida`.

### 4.19 `WeeklyReportCard`

- **Chega por**: posição 2 da fila de avisos · **Aparece quando**:
  `needsWeeklyReport(gameState, agoraA)` (checado por **semana**, não por dia).
- **Sai para**: `onDismiss={handleDismissWeeklyReport}`.
- **O que se vê/faz**: constância por hábito, esforço concluído, categoria
  dominante, sonhos e `stackingSuggestion` — que devolve `null` sem dados
  suficientes, e o silêncio é a metade importante.
- **Dono**: `src/components/WeeklyReportCard.tsx`. `não percorrida` (domingo).

### 4.20 `MilestoneCeremony`

- **Chega por**: `setMilestoneCeremony({…})` quando um hábito cruza um marco.
- **Aparece quando**: `{milestoneCeremony && (…)}` — **fora das duas filas**, de
  propósito.
- **Sai para**: `onDone={() => setMilestoneCeremony(null)}`.
- **Estados**: `reducedMotion` é calculado no `App.tsx` por
  `window.matchMedia?.('(prefers-reduced-motion: reduce)').matches` e **só
  desliga as animações e o háptico** — a cerimônia é a mesma, com a mesma pausa.
- ⚠️ **Divergência dentro do próprio código**: o comentário do `App.tsx` diz que
  ela "some sozinha em 2,5s". O componente **não tem `setTimeout` nenhum**
  (medido: `grep -n "setTimeout" src/components/MilestoneCeremony.tsx` → vazio);
  ele é `zIndex: 300` e **espera o gesto** — um `<button onClick={onDone}>`. O
  comentário é resíduo do comportamento anterior; o `CLAUDE.md` já descreve o
  comportamento certo.
- **Dono**: `src/components/MilestoneCeremony.tsx` · **Régua**:
  `MilestoneCeremony.render.test.tsx`.

### 4.21 `ProtectProgressModal`

- **Chega por**: um efeito com quatro guardas + um `setTimeout(15_000)`:

  ```ts
  if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
  if (readLocal(STORAGE_KEYS.USER_EMAIL)) return;   // já protegido
  const last = readNumber(STORAGE_KEYS.PROTECT_PROMPT_AT, 0);
  if (Date.now() - last < 7 * 24 * 3600_000) return;
  if (!jaEvoluiu && !jaEngajou) return;
  ```

- **Aparece quando** (o **gate**, que substituiu a esperança depositada no timer):

  ```jsx
  {protectPrompt && interstitial === 'welcome' && (
  ```

- **Sai para**: `onDismiss={dismissProtectPrompt}` (só adia o próximo pedido) ou
  `onConfirm={handleProtectProgress}`. **Nunca bloqueia.**
- **Dono**: `src/components/ProtectProgressModal.tsx` · **Régua**:
  `src/components/filaDeAvisos.contract.test.ts` (trava a string do gate).

### 4.22 Biblioteca — `currentView === 'library'`

**Chega por**: linha "Biblioteca" do menu sanduíche (**único caminho**) ·
**Sai para**: a barra.

- **O que se vê/faz**: uma ação dominante por linha — tocar no jogador abre o
  `PlayerDetailModal` (e chama `onVisitPlayer` → `contarMissao('friend-visit')`).
  Presentear e adicionar/remover amigo são botões com rótulo e 44px. NPCs de
  `utils/libraryNpcs.ts` aparecem misturados aos jogadores reais, marcados por
  `isNpc`.
- **Estados**: **quatro, e é de propósito** — carregando · vazio · erro · sem
  rede. ⚰️ A versão anterior tratava falha de rede como "nenhum jogador
  encontrado" (`.catch(() => setPlayers([]))`), a pior mentira possível numa tela
  social.
- **`CoopPanel`**: montado dentro da página, com `metaDoDiaCumprida` vindo do
  `App.tsx` (`dailyTotal > 0 && dailyDone >= dailyTotal`) — a meta é do motor, e
  o painel não pode ter uma segunda cópia dela. O número é do **grupo**, nunca de
  um membro; por pessoa existe só "apareceu hoje: sim/não".
- **Dono**: `src/components/LibraryPage.tsx`, `CoopPanel.tsx`,
  `PlayerDetailModal.tsx` · **Régua**: `LibraryPage.amigos.render.test.tsx`,
  `CoopPanel.render.test.tsx`, `PlayerDetailModal.semMetrica.render.test.tsx`.

### 4.23 Configurações — `currentView === 'settings'`

**Chega por**: linha "Configurações" do menu sanduíche · **Sai para**: a barra.

Três blocos, com condições literais:

```jsx
{currentView === 'settings' && (…SettingsPage…)}
{currentView === 'settings' && (…RestWindowCard…)}
{currentView === 'settings' && stepsAvailable === true && gameState.stepsConsent !== 'declined' && (…StepsCard…)}
```

- **`SettingsPage`**: cinco grupos por intenção, uma ação dominante
  (entrar/sincronizar). Contém `AccountSection` (conta e compras, com
  "Restaurar compras" — exigido pela Play), `AccountDataSection` (exportar e
  apagar), `InstallPrompt` (cartão, **não** modal) e os botões que abrem o
  `GuideModal` (`onOpenGuide`) e o `HelpModal` (`onOpenGlossary`).
  **Estados do `AccountDataSection`**: `503` é **estado**, não erro — o botão
  nasce desabilitado com o motivo escrito, em tinta neutra.
- **`RestWindowCard`**: escolhe a janela (`onChangeWindow`), o switch "não quero
  ver métricas" (`onToggleMetrics`) e pede a permissão de push no momento-ouro
  (`onEnableReminder`, com `reminderPreview`). **Proibido nesta tela**: score de
  0 a 100 e gráfico de estágios do sono.
- **`StepsCard`**: **some por completo** sem sensor (PWA) e quando
  `stepsConsent === 'declined'` — `'declined'` é definitivo, porque insistir
  depois de um "não" é assédio. O consentimento vem **antes** do diálogo do
  sistema.
- **`SettingsModal`** (o painel rápido de IA) e **`AISettingsModal`** são
  separados: `{settingsOpen && (…)}` na raiz do `App`, aberto pelo menu.
- **Dono**: `src/components/SettingsPage.tsx` e vizinhos · **Régua**:
  `AccountDataSection.render.test.tsx`,
  `src/components/settingsTelemetry.render.test.tsx`.

### 4.24 Créditos e Nova Leitura

```jsx
{creditsOpen && (…CreditsModal…)}
{newReadingOpen && (…NewReadingModal…)}
```

- **`CreditsModal`** — **Chega por**: `onOpenCredits` (linha do menu sanduíche)
  → `openCredits`. **Sai para**: `onClose`, e a linha de reroll faz
  `setCreditsOpen(false); setNewReadingOpen(true)`. `canReroll` é
  `!!readLocal(STORAGE_KEYS.SOULMON_PROFILE)`.
- **`NewReadingModal`** — **Chega por**: só do `CreditsModal`. ⚰️ Substituiu o
  reroll por `Math.random()` que o `termos.html` chamava de "sorteio pago": a
  semente passa a vir das respostas (`utils/newReading.ts`). **Sai para**:
  `onConfirm` (async; só fecha com `ok`) e `onClose`.

### 4.25 Superfícies globais (montadas uma vez, cobrem tudo)

| Superfície | Aparece quando | O que faz | Dono |
|---|---|---|---|
| `ErrorBoundary` | envolve a árvore inteira em `main.tsx` | `getDerivedStateFromError` troca a tela pelo fallback; loga só em `DEV` | `ErrorBoundary.tsx` |
| `OfflineSeal` | montado na raiz do `App`, sempre | acende pelos eventos `online`/`offline`; **não bloqueia nada** | `ui/OfflineSeal` |
| "Pular para o conteúdo" | primeiro nó focável do documento | `<a href="#conteudo">` para o `<main tabIndex={-1}>` | `App.tsx` |
| região `aria-live` do visor | sempre, fora da tela | anuncia `spriteText('tuned', language)` quando `visorAnunciou` | `App.tsx` |
| `Toaster` (sonner) | último nó do `App` | avisos de uma linha | `ui/sonner.tsx` |
| `NotificationManager` | sempre | agenda os pushes locais — §5.3 | `NotificationManager.tsx` |
| `ItemsWindow` | `{showItemsWindow && (…)}` | a pastinha; `handleOpenItems` **alterna** e zera `newItemsReady` | `ItemsWindow.tsx` |
| `GamePopups` → `FirstTaskCompletedPopup` | `showFirstTaskPopup` | **uma vez na vida**, guardado por `FIRST_TASK_POPUP_SHOWN` e por uma varredura (`anyStepCompleted` / `anyTaskCompleted`) | `GamePopups.tsx` |
| `ContentModals` → `GuideModal` | `guideModalOpen` | o guia; os números saem das CONSTANTES | `GuideModal.tsx` |
| `HelpModal` | `showHelpModal` | o glossário, idem | `HelpModal.tsx` |
| `ConfirmDialog` | `resetOnboardingOpen` | "Refazer o ritual" — o texto diz que Soulmon, atividades, Bits e progresso **continuam** | `ConfirmDialog.tsx` |
| `ScreenSkeleton` | `Suspense fallback` de toda página carregada por `lazy()` | ⚰️ substituiu os `Suspense fallback={null}` que deixavam a tela **em branco** (13 pontos, medidos em 19/08/2026) | `ui/ScreenSkeleton.tsx` |

**Régua**: `GuideModal.gateReal.render.test.tsx`,
`src/components/textoBilingue.contract.test.ts`.

---

## 5. Superfícies fora do app

### 5.1 Widgets Android

Cinco provedores, todos em `android/app/src/main/java/com/hexervoodoom/soulmon/widget/`:
`SoulmonWidgetProvider`, `SoulmonWidgetVerticalProvider`, `SoulmonWidgetPetProvider`,
`SoulmonWidgetChatProvider`, `SoulmonWidgetScreenProvider`. Os cinco `android:label`
do `AndroidManifest.xml` são "Soulmon", "Soulmon Vertical", "Soulmon Pet",
"Soulmon Chat" e "Soulmon Tela" — é o texto que a pessoa lê na lista de widgets.

- **O que mostram** (`WidgetRenderer.kt`): nome do pet (`pet_name`), rótulo do
  estágio, `"$completedTasks/$totalTasks"` (ou `"—"`), corações, barra de energia,
  sprite, cocô e uma **frase do pet**.
- **Para onde levam**: `WidgetRenderer` monta um `PendingIntent` com o
  `getLaunchIntentForPackage` e o liga ao `R.id.widget_root` — **tocar em
  qualquer lugar do widget abre o app**. Não há alvo por região.
- **O widget NÃO cobra** — a escada de frases, na ordem em que a função decide (três `if` e então um `when`):
  `hp <= 20` → "💛 Tô com saudade de você"; `needsIntervention` → "🌱 Hoje, só 5
  minutos?"; `total == 0` → "🌳 Você tem estado firme" (com `habit_steady`) ou
  "🌤️ Um dia de cada vez"; depois `ratio >= 1.0` → "✨ Dia perfeito!";
  `>= 0.7` → "💪 Quase lá!"; `>= 0.4` → "🔥 Continue assim!"; senão →
  "🌱 Começou — isso já conta".
  ⚰️ `"📋 $completed de $total feitas"`, `"⚠️ Cuide de mim!"` e
  `"N task(s) left, let's go!"` **não existem mais**.
- **Régua**: `src/plugins/widgetSemCobranca.contract.test.ts` — lê o FONTE
  Kotlin, porque nenhum teste em `node` alcança Kotlin.

⚠️ Duas observações do fluxo: a frase do widget é **só em PT-BR** (não há par EN
no `when`), e o degrau `ratio >= 1.0` ainda diz "Dia perfeito!" enquanto o app
renomeou a leitura para "dia completo" (P5, 07/09/2026). Vão para o `../STATUS.md`.

### 5.2 Overlay Electron

Dono da fronteira: `desktop/renderer/src/menu.ts` (`renderMain`, `renderTasks`,
`renderSettings`) — e a fronteira de **cuidado** é `desktop/renderer/src/care.ts`,
não este arquivo.

- **Painel principal** (`renderMain`): cabeçalho com `stageName` (por
  `textContent`, nunca `innerHTML` — o nome vem do save remoto), a linha
  `${heartsLabel()} · ⚡${state.energy}/${state.maxEnergy} · 🍎×${foodCount(...)}`,
  o retrato do pet, a linha de status, e a **fileira de cuidado** com quatro
  botões: 🫶 Carinho (`doPet`), 🍎 Comida (`doFeed`), 🚿 Banho (`doShower`) e
  💤 Dormir / ☀️ Acordar (`doSleepToggle`).
- **Tarefas de hoje**: `button(...)` com contador → `panel = 'tasks'; render()`.
- **Para onde leva**: `window.soulmonDesktop?.openFullApp()` — a linha
  "📱 Abrir Soulmon completo" nas Configurações e o botão de entrar quando não há
  sessão. **Criar e editar tarefas é só no app**, e a nota do painel diz isso:
  "Tudo aqui vale no celular também. Criar e editar tarefas é no app."
- **Estados**: sem conta — "Conecte a sua conta para cuidar do pet e marcar
  tarefas daqui."; com conta — e-mail + "🔄 Sincronizar agora" (`syncNow`).
- **Régua**: `desktop/renderer/src/cloudSync.test.ts`,
  `care.parity.test.ts`, `care.feed.parity.test.ts`,
  `care.banhoSono.parity.test.ts`.

### 5.3 Notificações

Dono único do texto e do horário: `functions/api/_pushCopy.js`.

```js
export const PUSH_HOURS_BRT = [10, 16, 22];
export const PUSH_HOURS_UTC = PUSH_HOURS_BRT.map(h => (h + 3) % 24).sort((a, b) => a - b);
```

| Hora | `tag` | Título (PT) | Para onde leva |
|---|---|---|---|
| 10h | `pet-nudge-10` | "<nome> passou pra dizer oi" | abre o app |
| 10h, `ageDays` 1 ou 2 | `pet-newborn` | "<nome> acordou" | abre o app |
| 16h | `pet-nudge-16` | "<nome> pensou em você" | abre o app |
| 20h (só no cliente) | `evening-reminder` ou `hp-critical-evening` | "🌙 <nome> está te esperando" / "<nome> está meio pra baixo" | abre o app |
| 22h | `pet-goodnight` | "🌙 <nome> te deseja boa noite" | abre o app |
| janela −30 min | `pet-sleep-reminder` | "<nome> está ficando com sono" | abre o app |

- **As 20h moram no cliente**, e a **condição** tem de continuar lá — o worker
  não sabe se a meta foi cumprida. As guardas do `NotificationManager`,
  transcritas:

  ```ts
  if (hh !== 20 || mm !== 0) return;
  if (lastEveningWarnDate.current === today) return;
  if (completedSteps >= totalRequired) return;
  if (restWindow) return;
  ```

  A última é a **precedência do lembrete de deitar**: com a janela padrão
  (23:00) a noite mandava três pushes em 2h30, e o das 20h é o único dos três
  que pede EXECUÇÃO — então é ele que cede.
- **Dedupe entre os dois canais**: a **tag da copy** é o que impede a duplicata;
  o `AlarmReceiver.kt` usa `notify(tag, 0, …)` casando com o
  `android.notification.tag` do `workers/fcm.js`.
- ⚰️ O nudge das 21h **não existe mais**, e o comentário de `PUSH_HOURS_BRT` diz
  por quê: "nada deve pedir uma quarta visita ao app".
- **Régua**: `workers/pushCopy.parity.test.js` (trava as três árvores).

---

## 6. Divergências abertas (para o `../STATUS.md`)

| # | Afirmação | Onde está | O que o código diz (09/09/2026) |
|---|---|---|---|
| 1 | "Loja em ABAS (Itens/Cenários/Mobílias/Torneio/Missões)" | `CLAUDE.md` | `type ShopSegment = 'shop' \| 'tournament'` — **dois** segmentos; Itens/Cenários/Mobílias são seções de um scroll, e a aba Missões não existe |
| 2 | "a página é dungeon + dino + pedra-papel-tesoura + torneio" | comentário de `BottomNav.tsx` | `openGame` aceita `'dungeon' \| 'arena' \| 'dino' \| 'rps'` — **quatro** minijogos |
| 3 | "`UnlockNudge` só aparece em dois lugares… hoje são TRÊS" | `CLAUDE.md` | `grep -rn "<UnlockNudge" src --include=*.tsx \| grep -v "\.test\." \| wc -l` → **6** |
| 4 | "sem elas o botão de microfone **não é desenhado**" | `CLAUDE.md` | o `<button>` continua montado; com `micDisponivel === false` ele vira o botão de enviar, com `aria-disabled` quando não há texto |
| 5 | "a cerimônia de marco… some sozinha em 2,5s" | comentário do `src/App.tsx` | `MilestoneCeremony.tsx` não tem `setTimeout`; é `zIndex: 300` e espera o toque no botão |
| 6 | "`ArenaGame` é código morto" | `docs/INVENTARIO-TELAS.md` §6.3 (19/08/2026) | é o segundo card da `ActivitiesPage` desde então |
| 7 | "`OraclePage` é alcançável pelo atalho de dono (segurar o mascote)" | `SoulmonOnboarding.tsx` (comentário) e `docs/INVENTARIO-TELAS.md` §5.13 | `startOracleDebugHold`/`cancelOracleDebugHold` **não têm chamador** — a intro que os usava foi apagada. `OraclePage` e `PixelizerCard` são inalcançáveis por qualquer caminho |
| 8 | frase do widget e nome do dia | `WidgetRenderer.kt` | a escada de frases é **só PT-BR** e o topo dela ainda diz "Dia perfeito!", enquanto a UI do app diz "dia completo" desde 07/09/2026 (P5) |
| 9 | comentário do slot de avisos numera "1. HP" duas vezes | `src/App.tsx` | a ordem executada é a dos `push`: firstDay → hp → semanal → triagem → priming → recomeco |
