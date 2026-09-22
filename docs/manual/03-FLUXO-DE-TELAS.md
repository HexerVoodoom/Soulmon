# Fluxo de telas do Soulmon

> **Dono:** doc-redator-telas · **Data:** 21/09/2026 · **Estado:** verificado em 21/09/2026 por doc-verificador (delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — §2.1 aviso de WebView, §3.2 item 6 `termos`, §4.23 grupo Sobre, §4.23a/§4.23b ⚰️ `SettingsModal`, §4.25 `ErrorBoundary` conferidos símbolo a símbolo; anterior: §4.23/§4.23b, delta `5ac3d351..8d318529`, som/S16 + grupo "Som" na `SettingsPage`; verificação anterior do mesmo dia: delta `dc72579e..9875477b`, 30 commits: copy da bíblia §1–§6-bis, superfície de suporte, rodada 2 da arte; verificação anterior do delta `2580b73a..dc72579e`, Fase 2, identidade "O Visor", 14 fluxos: 21/09/2026)
> **Verificação:** `npx vitest run src/components/filaDeAvisos.contract.test.ts src/components/evolucaoManual.contract.test.ts src/components/ofertaDoisCanais.contract.test.ts src/components/upgradeReveal.contract.test.ts src/components/textoBilingue.contract.test.ts src/plugins/widgetSemCobranca.contract.test.ts src/components/SoulmonOnboarding.oraculo.render.test.tsx src/components/StatsPage.render.test.tsx src/utils/petVoice.test.ts src/narrativa.contract.test.ts` · guard do manual: `npx vitest run src/docsManual.contract.test.ts`
> **Não cobre:** aparência (cor, tipografia, espaçamento, tokens `--sm2-*`) — é do `04-IDENTIDADE-VISUAL.md`; as REGRAS que as telas aplicam (corações, meta do dia, evolução, moedas) — são do `02-REGRAS-DE-NEGOCIO.md`; a assinatura de cada componente — é de [`06-REFERENCIA/components.md`](06-REFERENCIA/components.md); percurso real com o app rodando — é do procedimento "Inventário de superfícies" de `.claude/skills/squad-design/METODO.md` (⚰️ agente `soulmon-screen-cartographer`, 21/09/2026), cuja medição de 19/08/2026 está em [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md).
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
poder ser refeito. Em 09/09/2026 → em 20/09/2026 (delta `2580b73a..dc72579e`) → em
21/09/2026 (delta `dc72579e..9875477b`):

```
wc -l src/App.tsx                       → 6245 → 6100 → 6139
wc -l src/components/SoulmonOnboarding.tsx → 1979 → 2302 → 2302
grep -rn "<UnlockNudge" src --include=*.tsx | grep -v "\.test\." | wc -l → 6 → 6 (conjunto diferente, ver §4.13) → 6
```

**O que o delta `dc72579e..9875477b` (21/09/2026, 30 commits) mudou NESTE
documento** — nenhuma tela nasceu nem morreu; mudaram **textos que o jogador lê**
(a copy da bíblia `docs/NARRATIVA-E-UNIVERSO.md`, régua `src/narrativa.contract.test.ts`)
e **três superfícies ganharam conteúdo novo**: a linha de suporte fixa no `ChatBox`
(§4.3), o grupo "Sobre" das Configurações (§4.23) e a frase do `not-ultra` na
Evolução (§4.10). As falas de comida cheia e teto de carinho saíram do
`CompanionHUD` para `petVoice.ts`, e dormir/acordar/borra ganharam fala (§4.2,
§4.2a, §4.2b). A rodada 2 da `squad-arte` trocou o que se vê nos mini-visores
(miniaturas na Loja §4.6, ícones-ficha no Torneio §4.15 e no Dino §4.14, aura 96²
na Ficha §4.7, `sleep-z` claro sobre cenário escuro §4.2) — o que é aparência fica
no `04-IDENTIDADE-VISUAL.md`; aqui entra só o símbolo que decide o que se vê.
⚰️ `src/components/EvoTrail.tsx` continua morto — foi apagado em `7ea27825`
(delta anterior, `2580b73a..dc72579e`), não neste; as lápides de §1.4, §4.1 e
§4.10 já valem.

**O que a Fase 2 (identidade "O Visor", 16–20/09/2026) mudou NESTE documento**:
pixel só existe dentro de um vidro (`Viewport`/`MiniGlass`/`GameVisor`); tudo o
resto virou vetor sobre tokens `--sm2-*` e ícones Material Symbols. Isso é
assunto do `04-IDENTIDADE-VISUAL.md`. O que entra aqui é só o que mudou de
**fluxo**: passo novo no ritual grátis (`REVEAL_DEMO`, §2.3), o Brincar que saiu
do card e virou célula do deck (§4.2, §4.14), a trilha `EvoTrail` que morreu
(§1.4, §4.1, §4.10), a lista do dia que ganhou dono (`DailyRituals`, §4.1), o
`EditModal` que deixou de criar (§4.5, §4.13), o toque no visor da Evolução que
evolui (§4.10), a cerimônia como `role="dialog"` (§4.11), `hideMetrics` chegando à
`StatsPage` (§4.8), a escada do widget em inglês e o contador que some no zero
(§5.1) e o overlay com ícones em vez de emoji (§5.2). Fonte de decisão por
fluxo: `docs/design/DECISOES-WIREFRAME.md` §18–§31.

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
    │     ⚰️ EvoTrail `onOpen` → setCurrentView('evolution') — não existe mais (20/09/2026, ver abaixo)
    │
    ├── FILA 1: intersticiais (um por vez, tela cheia)
    │     triage → dailyReport → checkIn → dream → nightmare → welcome
    │
    └── FILA 2: slot de avisos da Home (só o primeiro; resto vira "+N")
          firstDay → hp → semanal → triagem → priming → recomeco
```

Os únicos `setCurrentView('<literal>')` fora da `BottomNav` em todo o `src/` são
**dois** (medido em 20/09/2026 com
`grep -rn "setCurrentView(" src/ --include=*.tsx | grep -o "setCurrentView('[a-z]*'" | sort | uniq -c`):
`'main'` (do `ShopModal onClose`) e `'tournament'` (do `ActivitiesPage`).
⚰️ Eram três em 09/09/2026 — o `'evolution'` vinha do `EvoTrail`, apagado em
`72196da2` (canvas Evolução, `DECISOES-WIREFRAME.md` §24) depois de sair da Home
pela decisão S1 do canvas Home (§5); a célula Evolução da barra é o único caminho.
**Nenhum leva a `'oracle'`.**

---

## 2. Primeira abertura, passo a passo

### 2.1 Splash estática do `index.html`

- **Chega por**: carregar a página. É HTML puro, pintado **antes** do bundle.
- **Sai para**: `main.tsx` a remove — `requestAnimationFrame` duplo adiciona a
  classe `done` e o `transitionend` chama `remover()`; um `window.setTimeout(remover, 1200)`
  é agendado **fora** do rAF, como rede de segurança.
- **Aparece quando**: sempre. `<div id="splash" aria-hidden="true">`.
- **Estados**: **erro de WebView** — um `<script>` inline testa
  `CSS.supports('color','oklch(0 0 0)')`, `color-mix` e, desde `42b07bec`
  (decisão #19), **`CSS.supports('selector(&)')`** — o aninhamento CSS que o
  `src/index.css` usa em mais de cem regras (`grep -c "^\s*&" src/index.css` → 101, 21/09/2026; o comentário do `index.html` diz 122) só existe a partir do Chromium 112, e um WebView
  111 passava no teste antigo e abria o app sem hover/foco/variante (pior que a
  tela branca, porque parece bug nosso); falhando, ele monta um
  aviso bilíngue ("Precisamos de uma atualização" / "An update is needed") no
  `#root` **e remove a splash**, senão o aviso ficaria por baixo dela para sempre.
  **Idioma**: um segundo script troca `LOADING DATA...` por `CARREGANDO DADOS...`
  quando `navigator.language` começa com `pt`.
- **O que se vê/faz**: nada é clicável.
- **Dono**: `index.html` (`#splash`) + `src/main.tsx` (`remover`).
- **Régua**: `src/security/oldWebview.test.ts` (o aviso em vez de tela branca; ⚠️ o caso "antigo" só falha em oklch/color-mix — `selector(&)` não é exercitado sozinho) e `src/security/csp.test.ts` (o hash do script mudou em `42b07bec`, e a CSP em `public/_headers` acompanhou).

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
  no mascote + wordmark dentro do mesmo `.sm2-splash`, com `scheduleFinish(1500)`
  (⚰️ o gradiente Tailwind e o literal `#0b0d16` saíram em `f6a0fadf`, 20/09/2026).
  **Duração**: `onLoadedMetadata` assume a duração real do vídeo; sem ela, 1500 ms.
- **O que se vê/faz**: **a superfície inteira é o alvo "Pular introdução" /
  "Skip intro"** — o `<div>` raiz recebe `role="button"`, `tabIndex={0}`,
  `aria-label={skipLabel}`, `onClick={skip}` e Enter/Espaço (`onKeyDown`); `skip`
  reagenda a saída para 400 ms. Com `videoFailed` o alvo **não** é montado
  (`const alvo = videoFailed ? {} : {…}`): a tela de erro sai sozinha em 1,5 s.
  Desde `f6a0fadf` (canvas Onboarding-funil, `DECISOES-WIREFRAME.md` §23, D-O3/X4)
  a intro é a continuação da splash do `index.html` no mesmo `.sm2-splash`.
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
| `REVEAL_DEMO` | −4 | **novo em `a1181a5b` (20/09/2026)** — a leitura do caminho GRÁTIS: criatura em silhueta + descrição + oferta `UnlockNudge reason="reveal-demo"`; só renderiza com `demoReading` | é a própria escolha: "Continuar com um personagem demo" e o × "Agora não" levam os dois a `DEMO_PICK` |
| `DEMO_PICK` | −1 | os **6** personagens pré-prontos (`PREMADE_CHARACTERS` em `utils/monetization.ts`: `kaelen`, `orrin`, `thalindra`, `igni`, `nautilu`, `astrase` — eram 3 até `c11dc49d`) | volta ao `REVEAL_DEMO` quando há `demoReading`; senão ao `CHOICE_STEP` |
| `AGE_BLOCK` | −5 | muro de idade | saída única: `restartFromAgeBlock` |
| `1` | 1 | nome completo | não |
| `2` | 2 | data de nascimento (mapa astral **e** 18+) | não |
| `3` | 3 | hora | não |
| `4` | 4 | cidade (`CityPicker`) | não |
| `FAVORITE_STEP` | 5 | criatura favorita | **sim** — caixa "Prefiro não influenciar o resultado" |
| `QUIZ_START`..`QUIZ_END − 1` | 6..11 | as 6 de `ORACLE_QUESTIONS`, uma por página (`QUIZ_END` = 12 é o "primeiro passo pós-quiz", pelo comentário do código). **Desde `a1181a5b` o caminho grátis também passa por aqui** (`flow === 'demo'`): ao escolher a última, `setDemoReading(generateOracle({… answers: nextAnswers}))` e `setStep(REVEAL_DEMO)` em vez de `s + 1` | não (avançam sozinhas ao escolher); `back()` na 1ª com `flow === 'demo'` volta ao `CHOICE_STEP` |
| `REFINE_OFFER` | 12 | a bifurcação do teste longo | é a própria escolha |
| `DEEP_START`..`DEEP_END − 1` | 13..32 | os 20 de `SOUL_TEST_ITEMS` (`DEEP_END` = 33, que é o próprio `GENERATING`) | só quem aceitou |
| `GENERATING` | — | tela de geração — o `role="status"` é o casulo `forming` num `BirthCard`/vidro, pulsando por posição (`55d02ccc`; ⚰️ o corvo e o `Spinner` saíram) | — |
| `REVEAL` | — | `BirthCard` (nome + epíteto + batismo). **Estados do sprite**: `pending='forming'` enquanto `revealEsperando`; passado `REVEAL_WAIT_MS`, `pending='dormant'` (cristal apagado) e a frase "The drawing is still being made — it arrives on its own, later." — nunca arte de reserva | — |
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
onClick={() => { setFlow('demo'); setDemoReading(null); setStep(QUIZ_START); }}   // "Começar agora — é grátis"
onClick={handleUnlockFull}                                                        // "Quero o completo — <precoLabel>"
```

⚰️ Até `a1181a5b` o grátis ia direto a `DEMO_PICK` (`setStep(DEMO_PICK)`). Hoje
responde as 6 perguntas e vê o `REVEAL_DEMO` antes de escolher o personagem
(`REGISTRO-DE-DECISOES.md` §13.19; canvas Onboarding-oráculo,
`DECISOES-WIREFRAME.md` §31). A oferta do `REVEAL_DEMO` compra pelo **mesmo**
`handleUnlockFull`; o × emite `track('unlock_dismiss', { reason: unlockReasonCode('reveal-demo') })`
e a montagem emite `unlock_view` com o mesmo motivo.

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

**Estados gerais do ritual**: barra de progresso (`.meter` do kit) montada sob
`(step > 0 && step <= lastStep) || step === REVEAL_DEMO` (no reveal demo ela
conta como `REVEAL`: `const progressStep = step === REVEAL_DEMO ? REVEAL : step`);
rascunho do ritual por `readOracleDraft(mode, DEEP_END - 1)` (nunca retoma na
geração ou depois); `generateError` renderiza um `role="alert"` na bifurcação.
"Continuar" inerte é por **superfície** (`aria-disabled`, fora do Tab), nunca
`disabled`/opacidade (`2b334035`).

**Régua**: `SoulmonOnboarding.portao.render.test.tsx`,
`SoulmonOnboarding.batismo.render.test.tsx`,
`SoulmonOnboarding.reveal.render.test.tsx`,
`SoulmonOnboarding.rascunho.render.test.tsx`,
`SoulmonOnboarding.copyRitual.render.test.tsx`,
`SoulmonOnboarding.funil.render.test.tsx` e
`SoulmonOnboarding.oraculo.render.test.tsx` (os dois novos na Fase 2; o ritual
grátis é atravessado nos testes por `src/test/ritualDemo`).

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
| 6 | `'termos'` | `precisaAvisarTermos(gameState.consent, TERMS_VERSION, PRIVACY_VERSION, termsNoticeSeen)` (`utils/termsNotice.ts`, desde `42b07bec`, decisão #24 — só quem já consentiu a uma versão ANTERIOR; save sem registro nunca vê) | `TermsUpdateBanner` (`.sm2-notice`, `role="status"`: "Os Termos e a Política de Privacidade mudaram" + "Ler os Termos" / "Ler a Política" em aba nova + "Ok", que grava `marcaAvisoTermos` em `STORAGE_KEYS.TERMS_NOTICE_SEEN`). Informativo, **sem re-aceite**; o comentário do código o chama de "7." porque conta o `hp` como 1 |

- **Régua**: `src/components/filaDeAvisos.contract.test.ts` — exige as chaves
  `'firstDay'` e `'priming'`, exige que `shouldShowFirstDay(` e
  `if (mostrarPrimingDePush) avisos.push` apareçam **uma vez cada**, e trava a
  ordem `key: 'semanal'` **antes** de `key: 'triagem'`.

⚠️ O comentário do slot no `App.tsx` numera "1. HP" duas vezes (a primeira antes
do item 0). É defeito de comentário, não de comportamento: a ordem executada é a
dos `push`, que é a da tabela acima — sete itens desde `42b07bec`, o banner de
termos por último ("é o único aviso que não fala do dia da pessoa"). Régua do
banner: `src/components/TermsUpdateBanner.render.test.tsx` e
`src/utils/termsNotice.test.ts`.

---

## 4. As superfícies, uma a uma

### 4.1 Home — `currentView === 'main'`

**Chega por**: célula 1 da `BottomNav`, `setCurrentView('main')` (também é o
valor inicial e o destino do `onClose` da Loja) · **Sai para**: qualquer célula
da barra.

A Home empilha, nesta ordem de render:

1. **`HomeHud`** — o `<h1>` da Home (o wordmark) + `focusSealed` (o selo do dia,
   binário: `focoDoDiaCompleto`). **Só isso**: ⚰️ a barra DOM de HP/energia
   (`hideMeters`) saiu em `f5ead7c0` (16/09/2026, canvas Home achado 1,
   `DECISOES-WIREFRAME.md` §19) — a leitura de HP/energia mora **uma vez**, na
   `VisorBar` dentro do vidro do `CompanionHUD`.
2. **O slot de avisos** (§3.2).
3. **`CompanionHUD`** — §4.2. Brincar é a **5ª célula do deck** dele
   (`play={playDeck}`), não um card.
4. ⚰️ **`PlayCard`** — não é mais montado (`f5ead7c0`); o arquivo
   `src/components/PlayCard.tsx` continua no repo **sem consumidor**
   (`grep -rn "PlayCard" src --include=*.tsx` devolve só um comentário do
   `App.tsx`, 20/09/2026).
5. ⚰️ **`EvoTrail`** — apagado em `72196da2` (S1 do canvas Home): a escada de
   altura fora da própria tela saiu, e a célula Evolução da barra é o caminho.
6. **`QuickAddBar`** (`onCommit={handleQuickAdd}`).
7. **Botão "Equilibrar minha semana"**, sob `{podeEquilibrar && (…)}` →
   `setBalanceOpen(true)`.
8. **`DailyRituals`** (`src/components/DailyRituals.tsx`, novo em `682835a3`,
   canvas Atividades §20) — a lista do dia inteira ganhou dono: o `RitualPanel`
   com as tarefas (`RitualRow` + `TaskMeta`), as atividades (`RitualRow` +
   `StepRow` + `HabitConstancy`) **e** a gaveta "Guardadas" (`<details>` sob
   `{guardadas.length > 0 && (…)}`, com `guardadas = tasks.filter(t => !isActive(t))`
   e o botão "Retomar" → `onRestoreTask`). Ordem declarada no cabeçalho: tarefas
   ativas → hábitos devidos hoje → hábitos fora do dia → concluídas de hoje por
   último. O `App.tsx` só passa o save e os handlers.

**Estados**: **vazio** — `DailyRituals` passa ao `RitualPanel`
`emptyMessage={tarefas.length + atividades.length + feitasHoje.length === 0 ? emptyMessage : undefined}`
(com `emptyMessage={t.main.noActivityRegistered}` vindo do `App`);
**hábito fora do dia** — `dimmed={!activity.disponivelHoje}` e as etapas ficam
inertes (esmaecer é tinta `muted`, nunca `opacity` — é regra do componente);
**sem métricas** — `hideMetrics={gameState.rest?.hideMetrics === true}` desce
pelo `DailyRituals` até o `HabitConstancy`; **contador "feitos/total"** = devido
hoje + concluídas de hoje (a tarefa concluída fica riscada na lista até a virada);
**"N/M steps" só com N ≥ 1** — antes do primeiro passo é "M steps".

**Dono**: `src/App.tsx` (bloco `currentView === 'main'`) +
`src/components/DailyRituals.tsx` · **Régua**:
`src/components/dailyList.sm2.render.test.tsx`,
`src/components/p5DiaCompleto.contract.test.ts`.

### 4.2 `CompanionHUD` — a área do pet

**Chega por**: está montado o tempo todo na Home · **Sai para**: nada (não navega).

- **O gesto de carinho**: um `<button>` transparente sobreposto ao sprite
  (`className="sm2-rub"`), com `aria-label` "Fazer carinho no Soulmon (segure
  para curar)" / "Pet your Soulmon (hold to heal)", `onPointerDown/Move/Up` e
  `onKeyDown` (Enter/Espaço rodam um ciclo de 2 s). A regra e o teto de cura são
  de `onPet` (`handlePet` no `App.tsx`), nunca daqui.
- **O deck de CINCO ações** (`div.sm2-deck`, `role="group"`), na ordem literal
  do array (`key`): `feed` (abre o seletor de comida, `setFeedOpen(true)`), `items`
  (`onOpenItems` → `handleOpenItems`, que **alterna** `showItemsWindow`), `bath`
  (`handleShowerClick`; `inert: showerCooldown` é um cooldown de 5 s contra o
  toque duplo — não existe gate de regra, o banho está sempre disponível), `sleep`
  (`onSleep`, glifo `bedtime`/`wb_sunny`) e **`play`** (novo em `f5ead7c0`,
  canvas Home E1+E2 / `PlayEstados`, `DECISOES-WIREFRAME.md` §19 — Brincar saiu do
  `PlayCard` e virou gesto de cuidado). A regra de `play` é única
  (`handleDeckPlay`): célula **inerte** (`aria-disabled`, tracejado, rótulo diz o
  porquê — "Brincar — depois da primeira atividade" / "Brincar — já brincamos
  hoje") quando `!play.available || play.playedToday`; célula viva com
  `!play.canPlay` → o pet **recusa no balão** ("Brincar pede 1 de energia…"),
  nunca toast; só então `play.onPlay()` (`handlePlay` do `App.tsx`). Célula
  inerte **não é `disabled`**: fica na ordem de Tab e o clique não faz nada.
- **Botão "Evoluir"**: montado sob `{canEvolve && !isSleeping && (…)}`, chama
  `onEvolveRequest` — hoje é a placa "EVOLVE" na moldura do vidro.
- **Estados**: `hauntedWatching` acrescenta a classe `sm-pet-haunted` ao sprite —
  é gesto, sem texto junto; `hasNewItems` acende o selo do botão de itens
  (`inventory_2` FILL + ponto); `isSleeping` troca a ação de dormir por acordar.
- **A voz do gesto (21/09/2026, copy §1 da bíblia)**: `fullSignal` e
  `healCapSignal` continuam sendo os contadores que o `App.tsx` acende, mas a
  frase vem do dono único `PET_VOICE_LINES` (`src/utils/petVoice.ts`, kinds
  `full` e `healCap`) — ⚰️ as três frases inline de cada um ("Estou cheio! Me dá
  uma horinha…", "Já recebi muito carinho hoje!") não existem mais:

  ```ts
  speak(petVoiceLine('full', language === 'pt-BR', Math.random(), petPassive), 3500);
  speak(petVoiceLine('healCap', language === 'pt-BR', Math.random(), petPassive), 3500);
  ```

  Três gestos que eram mudos falam pelo `falar(kind)` do `App.tsx`
  (`setSpeakSignal`): **dormir/acordar manual** — `falar(isSleeping ? 'wake' : 'sleep')`
  fora do updater, só no toque (o sono automático segue calado); **a borra que
  chegou** — `falar('residue')` na transição `careEvent?.type === 'poop'`
  (`borraAnteriorRef`), nunca no dreno; **vida cheia ao usar 💗** — `falar('steady')`
  (§4.2b). `wake` nunca comenta a noite de quem lê — `src/utils/petVoice.test.ts`
  exige.
- **O "Z" do sono** troca de folha pelo cenário: `isDarkBackground(equippedBackground)`
  (`utils/backgrounds.ts`) escolhe `ANIM_ART.sleepZLight` sobre cenário escuro e
  `ANIM_ART.sleepZ` nos demais (R2-4 da `squad-arte`, 21/09/2026).
- **Dono**: `src/components/CompanionHUD.tsx` · **Régua**:
  `CompanionHUD.render.test.tsx`, `CompanionHUD.cta.test.tsx`,
  `CompanionHUD.vinculo.render.test.tsx`, `CompanionHUD.voz.render.test.tsx`,
  `CompanionHUD.reacao.render.test.tsx`, `src/components/som-presenca-d11.render.test.tsx`.

### 4.2a O seletor de comida — a folha "Alimentar" (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: a ação `feed` do deck do `CompanionHUD` —
`onClick: () => setFeedOpen(true)` · **Sai para**:
`onClose={() => setFeedOpen(false)}`, o × / Escape do `ModalSheet`, ou escolher
uma comida — `handleDeckFeed` **fecha a folha antes** de chamar `onFeed`.
Desde `91b0deb8` (16/09/2026) a folha sai por **`createPortal(folha, document.body)`**:
montada dentro do `.sm-pet-sticky`, ela ficava presa sob o dock do chat e a nav
(medido no comentário do próprio arquivo); sem `document` (jsdom/SSR) fica onde
estava.

**Aparece quando** (condição literal):

```jsx
<ModalSheet
  open={feedOpen}
  onClose={() => setFeedOpen(false)}
  title={language === 'pt-BR' ? 'Alimentar' : 'Feed'}
  language={language}
>
  {foodStock.length === 0 ? (…parágrafo…) : (…grade…)}
</ModalSheet>
```

com

```ts
const foodStock = Object.entries(foodInventory)
  .filter(([emoji, n]) => n > 0 && !isSpecialItem(emoji))
  .sort((a, b) => b[1] - a[1]);
```

**Estados** — os três existem, e o terceiro **não é uma tela**:

| Estado | Condição | O que se vê |
|---|---|---|
| com estoque (`HOME-35`) | `foodStock.length > 0` | grade `.sm2-gcell-grid` (canvas `AlimentarFolha`, D-H6, desde `91b0deb8`); cada célula é um `<button className="sm2-gcell">` com a arte (`ITEM_ART[emoji]`, 48px, dentro de `.sm2-gcell-art`), o nome (`FOOD_NAME_BY_EMOJI[emoji] ?? ''`), `×N` em `sm2-num`, e `aria-label` = `` `${FOOD_NAME_BY_EMOJI[emoji] ?? emoji} × ${n}` ``. ⚰️ **Item sem arte não cai mais no emoji do sistema** — mostra o quadro vazio. Abaixo, a dica: "Cada comida dá +1 de energia e pontos de atributo. Se a barriga estiver cheia, seu Soulmon avisa." / "Each food gives +1 energy and attribute points. If its belly is full, your Soulmon will say so." |
| vazio | `foodStock.length === 0` | **um parágrafo, e só** — "Sua pastinha está sem comida. Conclua uma tarefa ou hábito para ganhar comida — é assim que seu Soulmon come." / "You're out of food. Complete a task or habit to earn some — that's how your Soulmon eats." Sem grade, sem botão, sem ilustração |
| recusa por teto (`HOME-36`) | acontece **depois** de a folha fechar | ver abaixo |

**A recusa (`HOME-36`) é fala do pet, não superfície.** `handleDeckFeed` faz
`setFeedOpen(false)` e delega; quem recusa é o `handleFeed` do `App.tsx`:

```ts
if (feedTimesFor(gameState.careCaps, now).length >= FOOD_LIMIT_PER_HOUR) {
  setFullSignal(n => n + 1); // pet says "I'm full"
  return;
}
```

`fullSignal` é um contador que **só cresce**; no `CompanionHUD` ele dispara um
`speak(…, 3500)` com `petVoiceLine('full', …)` — a frase mora em `PET_VOICE_LINES`
(`src/utils/petVoice.ts`) desde 21/09/2026; ⚰️ até então eram três frases inline
no `CompanionHUD` ("Estou cheio! Me dá uma horinha…" / "I'm full! Give me an
hour…"), fora do alcance do teste de tom. **Sem toast, sem modal, sem estado de
erro na folha** — e o item **não** é decrementado (o `return` é antes do
updater). `FOOD_LIMIT_PER_HOUR` é `MAX_STAGE_REQUIREMENT` (derivado do maior
`FORM_REQUIREMENTS[…].required`, nunca um literal) e a janela é deslizante de
1 h sobre `careCaps.feedTimes`, que mora no SAVE.

**Item especial não entra aqui**: `isSpecialItem` (dono: `src/utils/shop.ts`)
tira 🌀 / 💗 / 🦠 / 💾 / 💉 do `foodStock` — eles se usam na pastinha (§4.2b).
Misturá-los faria "Alimentar" gastar um consumível caro por engano.

**Dono**: `src/components/CompanionHUD.tsx` (`feedOpen`, `foodStock`,
`handleDeckFeed`) para a TELA; a REGRA é do `handleFeed` (`src/App.tsx`) sobre
`src/utils/careRules.ts` (`feedFood`, `FOOD_LIMIT_PER_HOUR`) ·
**Régua**: `src/components/CompanionHUD.cta.test.tsx` (abre a folha, escolhe a
comida, exige que o especial NÃO apareça e que o vazio explique como conseguir),
`src/utils/careRules.test.ts` (o teto por hora).

### 4.2b `ItemsWindow` — a pastinha: o vazio e o uso de item especial (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: a ação `items` do deck → `onOpenItems` → `handleOpenItems`, que
**alterna** (`setShowItemsWindow(prev => !prev)`) e apaga o selo
(`setNewItemsReady(false)`) · **Sai para**:
`onClose={() => setShowItemsWindow(false)}`.

**Aparece quando**: `{showItemsWindow && (<ItemsWindow … />)}` na raiz do
`App.tsx` (§4.25). O componente não tem prop `open` própria: monta já com
`<ModalSheet open …>`. O selo do botão do deck vem de `hasNewItems={newItemsReady}`,
e `newItemsReady` acende quando o total do inventário cresce
(`if (total > prevInventoryTotalRef.current) setNewItemsReady(true);`).

**Estados**:

| Estado | Condição literal | O que se vê |
|---|---|---|
| vazio (`HOME-38`) | `items.length === 0`, com `const items = Object.entries(foodInventory).filter(([, c]) => c > 0)` | **ilustração, não texto cru**: `mascot-raven.png` 72×72 **dentro de um `Viewport` 32×32 a `scale={3}`** (pixel só vive em vidro — canvas Home `ItensVazio`, D-H7; ⚰️ o `opacity: .85` saiu em `91b0deb8`), centralizado, e a frase "Sua pastinha está vazia. Conclua uma atividade para ganhar comida." / "Your item folder is empty. Complete an activity to earn food." **Sem rodapé** — o `footer` do `ModalSheet` só existe com `detail` |
| com itens, nada escolhido | `detail === null` | grade de 3 (`.sm2-gcell-grid`, a mesma da folha Alimentar — §4.2a); cada célula (`.sm2-gcell`) tem arte (`ITEM_ART`, 48px; ⚰️ sem fallback de emoji desde `91b0deb8`), nome e `×N`, com `aria-pressed={active}` e `aria-label` = `` `${getFoodName(emoji, language)} ×${count}` `` |
| item escolhido | `const detail = selected && foodInventory[selected] > 0 ? selected : null` | a célula ganha borda `--sm2-primary-ink` e fundo `--sm2-primary-soft`; o **rodapé** mostra nome + `effectLine` e o botão "Usar" / "Use" |

**O uso (`HOME-39`)**. "Usar" chama `use(emoji)` → `onFeed(emoji)` (que é o
`handleFeed` do `App.tsx`) e limpa a seleção. **A tela não decide nada**:
`effectLine` lê `CHIP_BOOST` / `HEART_HEAL` de `src/utils/shop.ts` — nunca um
número à mão —, e o dono do USO é `src/utils/specialItemUse.ts`
(`specialRefusal` / `applySpecialItem`), não o `careUpdaters.ts`. As três
recusas, transcritas do `handleFeed`:

```ts
const refused = specialRefusal(gameState, foodEmoji, agora);
if (refused === 'no-stock') return;
if (refused === 'daily-cap') {
  toast(language === 'pt-BR'
    ? '🌀 Um Glitchtama por dia. Ele te espera amanhã.'
    : "🌀 One Glitchtama a day. It'll wait for you tomorrow.");
  return;
}
if (refused === 'already-full') { falar('steady'); return; }
```

- **`'daily-cap'`** (🌀 Glitchtama além de `GLITCHTAMA_PER_DAY`): **toast**, e a
  pastinha continua aberta com o item **ainda na grade** — a recusa acontece
  antes do decremento, então ele volta e vale amanhã. A frase diz o que fazer,
  não o que foi negado.
- **`'already-full'`** (💗 Coraçãozinho com `healthPoints >= maxHealthPoints`):
  **fala do pet**, kind `steady` de `petVoice.ts` ("Tô firme. Guarda essa.") via
  `falar('steady')` (21/09/2026, copy §5.1: a recusa PROTEGE o item). ⚰️ Até
  então acendia o `healCapSignal`, o canal do teto de carinho — a frase dizia que
  o carinho tinha acabado, não que a vida estava cheia. Nenhum toast, nenhum
  texto dentro da pastinha.
- **`'no-stock'`**: silêncio total.

**Sucesso**: `playTaskComplete()` para 🌀 e 💗, `playFeed()` para chip;
`setFeedAnim` roda a mesma animação de comer do caminho comum; só o 🌀 ganha
toast ("🌀 Glitchtama! +1 dia completo" / "🌀 Glitchtama! +1 complete day").
A folha **não fecha** ao usar — só a seleção é limpa.

**Dono**: `src/components/ItemsWindow.tsx` (a tela) + `src/utils/specialItemUse.ts`
(a regra) · **Régua**: `src/utils/specialItemUse.test.ts` (cada número e as três
recusas, inclusive os dois toques no mesmo lote do React).
⚠️ **A TELA não tem régua**: não existe nenhum `ItemsWindow.*.test.tsx`
(`ls src/components | grep ItemsWindow` devolve só o `.tsx`, 13/09/2026).

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
  montar o `CompanionHUD` não toque a rede (`CompanionHUD.render.test.tsx`, caso
  "monta sem tocar a rede"):

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
- **A superfície de suporte** (`6ad2e629` + `f3654076`, 21/09/2026 — parecer
  clínico, `docs/NARRATIVA-COPY.md` §6): um `<p className="sm2-chat-support">`
  **sempre montado** sob o campo, sem condição, sem ícone, sem caixa — é a única
  tela em que a pessoa escreve texto livre para a criatura, então o caminho de
  ajuda mora aqui e não nas Configurações. Ordem da frase: o caminho primeiro
  ("procure ajuda de verdade: um serviço de saúde, uma linha de apoio da sua
  região, ou alguém de confiança"), a limitação do produto depois ("O Soulmon é
  um app de hábitos e não substitui isso"). Um link `<a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">`
  ("Encontrar uma linha de apoio" / "Find a helpline") e dois serviços fixos por
  idioma — PT: "No Brasil: CVV, 188 (24h, gratuito)"; EN: "US/Canada: 988. UK/IE:
  116 123". A lista é **estática e humana**: faz par com a cláusula SAFETY de
  `functions/api/chat.js`, que **proíbe o modelo** de citar número, serviço ou
  site — quem cita é esta linha. Mais serviços ou um diretório diferente é
  decisão do dono.
- **Dono**: `src/components/ChatBox.tsx` · **Régua**:
  `src/security/supabase.contract.test.ts` (as quatro peças da transcrição);
  a linha de suporte: `régua: nenhuma` (`grep -rl "sm2-chat-support" src --include=*.test.*`
  → vazio em 21/09/2026).

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
| `EditModal` | toque no lápis de uma atividade (`handleEditActivity`, **único gatilho**: `setEditingActivity(id); setEditModalOpen(true)`) | `{editModalOpen && (…)}` | `onClose` limpa `editModalOpen` e `editingActivity` | `EditModal.tsx` |
| `TaskEditModal` | toque no lápis de uma tarefa (`handleEditTask`) | `{taskEditModalOpen && (…)}` | idem, com `editingTask` | `TaskEditModal.tsx` |
| `PostponeNudgeSheet` | `TaskMeta` → `handlePostponeNudge` | `task={nudgeTaskId ? … : null}` | `handleCloseNudge` | dentro do `App.tsx` |
| `BalanceWeekModal` | botão "Equilibrar minha semana" | `{balanceOpen && (…)}` | `onClose={() => setBalanceOpen(false)}` | `BalanceWeekModal.tsx` |
| `TriagePile` | botão "Arrumar a pilha" → `handleOpenTriage` | `interstitial === 'triage' && triageTasks` | `onClose={() => setTriageTasks(null)}` | `TriagePile.tsx` |

**Demo × pago**: `CreateModal` recebe `capIsDemoBoundary={gameState.accountTier === 'demo'}`
e `onUnlock={() => { setCreateModalOpen(false); setUnlockReason('task-limit'); }}`.
⚰️ **O `EditModal` não monta mais o `UnlockNudge`** (`d044fb2e`, 20/09/2026,
canvas Atividades A1 — "um modal de criação só"): as props `atCap` /
`capIsDemoBoundary` / `activitiesCap` / `onUnlock` saíram, e ele **só edita** —
hoje recebe `rhythm` (a ficha do hábito: janela de 7, "N of the last 7",
maturidade, escudos) e `hideMetrics`. O teto do demo bate num lugar só, o
`CreateModal`. ⚠️ **Divergência com o `CLAUDE.md`**, que ainda diz que o
`EditModal` "passou a exibir o `UnlockNudge` também" (item "Desbloqueio no meio
do jogo") — ver §4.13 e §6.

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
- **O que o card de cenário mostra** (`66e32d43`, rodada 2 da `squad-arte`,
  21/09/2026): `const src = BG_THUMBS[item.id] ?? bgImage(bg?.css);` — a
  miniatura 96×52 de `src/assets/backgrounds/thumbs/<id>.png` (`import.meta.glob`
  eager em `BG_THUMBS`); cenário sem miniatura cai na ilustração 1200×648
  reduzida por CSS, ⚰️ que era o caminho de todos até então ("transição
  declarada").
- **Dono**: `src/components/ShopModal.tsx` · **Régua**:
  `ShopModal.missoes.render.test.tsx`, `ShopModal.convitePassivo.render.test.tsx`,
  `src/utils/weeklyMissions.fiacao.test.ts`.

### 4.6a Loja — o card sem saldo (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: tocar o card de um item cujo preço passa do saldo da moeda dele
(`LOJA-07`) · **Sai para**: nada — não navega, não fecha, não abre modal.

⚠️ **O card NÃO é desabilitado por saldo.** `disabled={!action}` só alcança o
item bloqueado por missão (`unlocked === false`, que deixa `action` `undefined`)
e o item já possuído troca a ação por equipar. Com saldo insuficiente o card
segue clicável, e a recusa é o retorno de `onBuy`:

```ts
const buy = (item: ShopItem) => {
  const name = isPt ? item.namePt : item.nameEn;
  const ok = onBuy(item.id);
  say(item.id, ok, ok
    ? (isPt ? `${name} comprado.` : `${name} purchased.`)
    : (isPt ? `Saldo insuficiente para ${name}.` : `Not enough to buy ${name}.`));
};
```

**Aparece quando** — dois sinais, um permanente e um momentâneo:

```ts
const affordable = (isEmblem ? emblems : points) >= item.price;   // permanente
const failing = flash?.id === item.id && !flash.ok;               // 2600 ms
```

**O que se vê/faz**:

- **Antes do toque**, só o PREÇO esmaece: `opacity: affordable ? 1 : 0.5` no
  número (Bits em `bitsNum`, **sem ícone**; Emblemas em `emblemNum` com o
  `military_tech` dourado ao lado). Arte, nome, descrição e borda **não mudam** —
  a loja continua mostrando o catálogo inteiro.
- **No toque**, `say(...)` acende `flash` e três coisas duram 2600 ms: a borda do
  card vira `--sm2-danger-ink`; a linha `sub` do card (a descrição) troca de cor
  para `--sm2-danger-ink`; e a região `role="status" aria-live="polite"` do topo
  substitui a dica ("Ganhe Bits nos minijogos.") pela frase de recusa, em tinta
  de perigo. Junto vai `navigator.vibrate?.(60)` — o sucesso vibra 25.
- Passados os 2600 ms, `setFlash(f => (f && f.id === id ? null : f))` devolve
  tudo ao estado normal. **Não há tela de "comprar Bits"**, nem atalho para o
  minijogo, nem convite de Créditos no ponto da recusa.

⚠️ **A frase é a mesma para as duas recusas de `shopBuyRefusal`** (`'no-funds'`
e `'already-owned'`): o `ShopModal` lê só o `boolean`, nunca o motivo. Na prática
só `'no-funds'` chega pelo card, pelo desvio de ação descrito acima.

**Dono**: `src/components/ShopModal.tsx` (`buy`, `say`, `affordable`, `failing`)
para a TELA; a regra é de `src/utils/shopBuy.ts` (`shopBuyRefusal`, reconferida
sobre o `prev` em `applyShopBuy`) e do `handleShopBuy` (`src/App.tsx`) ·
**Régua**: `src/utils/shopBuy.test.ts` (a recusa `'no-funds'` e o duplo clique
com saldo exatamente igual ao preço). ⚠️ **O ESTADO VISUAL não tem régua** —
`grep -n "Saldo\|afford" src/components/ShopModal.missoes.render.test.tsx src/components/ShopModal.convitePassivo.render.test.tsx`
não devolve nada (13/09/2026).

### 4.6b Loja — a troca Créditos → Bits (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: rolar até o fim do segmento `'shop'` (`LOJA-13`) · **Sai para**:
nada — a troca acontece ali mesmo.

**Aparece quando**: `{seg === 'shop' && exchange}` — **último nó do corpo da
Loja**, depois das três seções e depois do `UnlockNudge` do demo. No segmento
`'tournament'` ela não existe.

**O que se vê/faz**: uma linha de cabeçalho com o ícone `diamond` (tom primário)
+ "Trocar Créditos por Bits — você tem N" / "Swap Credits for Bits — you have N",
e abaixo os **três** degraus de `BITS_EXCHANGE`, lado a lado, cada um `flex: 1`:

```ts
export const CREDIT_TO_BITS = 10;
export const BITS_EXCHANGE = [
  { credits: 10, bits: 10 * CREDIT_TO_BITS },
  { credits: 25, bits: 25 * CREDIT_TO_BITS },
  { credits: 60, bits: 60 * CREDIT_TO_BITS },
] as const;
```

Cada botão é `diamond` + `credits` → `arrow_forward` → `bits`, com `aria-label`
"Trocar N Créditos por M Bits" / "Swap N Credits for M Bits".

**Estados**:

| Estado | Condição literal | O que se vê |
|---|---|---|
| disponível | `const can = credits >= pack.credits && exchanging === null` | `sm2Button('ghost')`, ícones em tom primário |
| sem Créditos | `credits < pack.credits` | `disabled`, `sm2Button('ghost', true)`, ícones em `muted` |
| em voo | `const busy = exchanging === pack.credits` | o `diamond` do degrau em voo vira `sync`; **os outros dois também ficam `disabled`**, porque `can` exige `exchanging === null` |
| falhou | `ok === false` no `await onExchangeCredits(pack.credits)` | a região `aria-live` diz "A troca não foi concluída. Tente de novo." / "The swap did not go through. Try again."; e o `handleExchangeCredits` do `App.tsx` ainda dá `toast('Créditos insuficientes.')` quando é o servidor que recusa |
| concluiu | `ok === true` | "+M Bits." na região `aria-live` + `toast('+M Bits!')`; o saldo do rodapé (ou do topo, com `asPage`) já mostra o número novo |

**A direção é uma só, e a ausência é a regra**: não existe Bits → Créditos, porque
Créditos são a moeda que libera gerar o pet próprio e farmá-los em minijogo
anularia a única coisa que o dinheiro real compra com exclusividade
(`src/utils/currencies.ts`). **O gasto é do SERVIDOR**:
`spendCredits(pack.credits, 'exchange-bits')`; os Bits só entram depois que ele
confirma, e `credits`/`accountTier` são reescritos com o que ele devolveu (`ent`).

⚠️ **O achado de 19/08/2026 do [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md)
§5.11 — o emoji 💎 convivendo com `icon-gem.png` nesta tela — não vale mais.**
Hoje há **um** desenho de Crédito no app, o glifo `diamond` do `<Icon>`, e a
lápide está no cabeçalho do `ShopModal.tsx` ("o emoji de gem e o `icon-gem.png`
que conviviam NESTA tela morreram aqui"). Bits continuam **sem ícone nenhum** —
a ausência é a distinção.

**Dono**: `src/components/ShopModal.tsx` (`exchange`, `exchanging`, `say`) +
`src/utils/currencies.ts` (`BITS_EXCHANGE`, `CREDIT_TO_BITS`) +
`handleExchangeCredits` (`src/App.tsx`) · **Régua**:
`src/utils/currencies.test.ts` (os degraus e a fronteira das três moedas).
⚠️ **Nenhum teste monta os botões de troca.**

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
  **Novo no delta** (`a388ddb9` em 15/09/2026, refeito em `f1413ddc` pelo canvas
  Pet, `DECISOES-WIREFRAME.md` §22): o **visor de emblemas** — prop
  `achievements={unlockedAchievements(gameState)}` (`utils/achievements.ts`,
  `ACHIEVEMENT_IDS` = 9); **só os abertos são desenhados**, os fechados não viram
  cadeado nem silhueta, e a linha quieta sob o visor diz "Achievements · N of 9";
  o **sigilo de classe** aparece no canto do vidro sob
  `{classeAtual?.sigilo && sigilArt(classeAtual.sigilo) && (…)}`.
  **A aura atrás do herói** (`66e32d43`, 21/09/2026): `auraForElement(dominantElement, 96)`
  — a 96² da rodada 2 preenche o vidro inteiro (`AURA`); quando a 96² não
  existe e a chamada devolve a 128², entra `AURA_128` (o anel a 256 num vidro de
  192, 32 px de cada lado fora — ⚰️ era o único caminho até então):

  ```ts
  const aura = auraForElement(dominantElement, 96);
  const auraStyle = aura && aura === auraForElement(dominantElement, 128) ? AURA_128 : AURA;
  ```

  **Estado**: save legado sem `soulProfile` simplesmente não mostra habilidades;
  sem conquista aberta, sem faixa.
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

**`hideMetrics` chega à `StatsPage`** (`05808e27`, 20/09/2026, canvas Estatísticas
§27 — até então não chegava): `hideMetrics={gameState.rest?.hideMetrics === true}`
esconde os NÚMEROS — "Nível N" e o `role="progressbar"` do vínculo
(`{!hideMetrics && (…)}`), `daysTogether`, os `feitos`, as frações da estação e
"done N×" — e **preserva as recompensas**: a palavra do vínculo, o `BirthCard`,
as artes do bestiário e do álbum, as medalhas e as listas sem contagem. O
`BirthCard` é o **mesmo** do reveal (§2.3).

**Régua**: `StatsPage.render.test.tsx` (novo — cobre `hideMetrics`),
`BestiaryCard.render.test.tsx`, `FormAlbum.render.test.tsx`,
`BirthCard.render.test.tsx`, `MemoriesCard.render.test.tsx`.

### 4.8a Estatísticas — a primeira vez / o vazio (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: o chip "Estatísticas" no primeiro uso (`STAT-02`) · **Sai para**:
os outros dois chips.

⚠️ **A medição de 19/08/2026 do [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md)
está vencida.** Ela descreve **três** listas vazias em texto cru ("No activities
completed yet." / "No tasks completed yet." / "No history yet."); nenhuma das três
strings existe hoje — `grep -n "No activities\|No tasks\|No history" src/components/StatsPage.tsx`
não devolve nada (13/09/2026). As duas tabelas de topo viraram **uma** ("O que
você mais repete"), e as frases foram reescritas.

**O que a tela mostra com o save zerado**, seção por seção:

| Seção | Condição literal | Na primeira vez |
|---|---|---|
| Vínculo | nenhuma — **sempre monta** | a PALAVRA primeiro: `title ?? (isPt ? 'Recém-chegados' : 'Just met')`, "Nível 0" embaixo, `role="progressbar"` em 0% e a frase "Ele só sobe. Cuidar de você é o que aproxima vocês dois — nada aqui desce, nunca." |
| Quem é o seu Soulmon | `{(passive || carePattern) && (…)}` | **some inteira** sem traço nem ritmo. Com o traço de nascimento sorteado, aparece só ele: `carePattern` só é passado quando a leitura é confiável (§ `utils/carePattern.ts`) |
| A jornada | nenhuma — **sempre monta** | "0 dias completos até aqui" (`streakDays`, em `--sm2-font-display`). Tudo o mais é condicional: `daysTogether` (`typeof daysTogether === 'number'`), `BirthCard` (`{birth && …}`), `BestiaryCard` (`{(bestiary?.length ?? 0) > 0 && …}`), `FormAlbum` (`{album && album.length > 0 && …}`), a linha legada (`{!album && formNames.length > 0 && …}`), `feitos` (`{feitos.length > 0 && …}`) e `soulGoal` (`{journey?.soulGoal && …}`) |
| A estação | `{season && (…)}` | o rótulo da estação; **os caminhos só aparecem andados** (`const andados = status.paths.filter(p => p.current >= 1)`) — progresso zero **não** vira `0/20` na tela |
| O que você mais repete | `topRepeated.length === 0` | "Nada concluído ainda. A primeira vez já aparece aqui." / "Nothing finished yet. The very first one shows up here." |
| Últimas conclusões | `recent.length === 0` | "O histórico começa na sua próxima conclusão." / "History starts at your next completion." |

com (as duas derivações, sem o `useMemo` que as envolve no arquivo):

```ts
const topRepeated = Object.entries(activityStats)
  .filter(([, s]) => s.completionCount > 0)
  .sort((a, b) => b[1].completionCount - a[1].completionCount)
  .slice(0, 5);
const recent = completedTasks.slice(-10).reverse();
```

**O vazio tem forma declarada, e ela é mínima**: as duas listas **mantêm** o
`<section>` e o `<h3>`, e trocam só o `<ul>` por um `<p style={sm2Hint}>`.
**Não há ilustração e não há CTA** — ao contrário da pastinha (§4.2b), que usa o
mascote. As duas frases falam do FUTURO ("já aparece aqui", "começa na sua
próxima conclusão"), nunca da falta; é a mesma trava de forma que proíbe o
`0/20` da estação e o "faltam N" do bestiário.

**Dono**: `src/components/StatsPage.tsx` (`topRepeated`, `recent`) ·
**Régua**: `StatsPage.render.test.tsx` — existe desde `05808e27` (20/09/2026).
⚰️ Até 13/09/2026 **nenhum teste montava a `StatsPage`**; hoje
`ls src/components | grep -i 'StatsPage.*test'` devolve o arquivo. Os cartões
continuam com `BirthCard.render.test.tsx`, `BestiaryCard.render.test.tsx` e
`FormAlbum.render.test.tsx`. A linha "Nível 0" e o `progressbar` da tabela acima
**somem** com `hideMetrics` (§4.8).

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
— **único caminho**; ⚰️ `EvoTrail.onOpen` não existe mais (`72196da2`,
20/09/2026) · **Sai para**: os chips das sub-abas.

Seis blocos, com estas condições literais (a quarta ganhou `!gameState.demoCharacterId`
em `acf4413e` — dois convites iguais na mesma tela é cobrança, EVO-20; o quinto
nasceu em `84ae4937`, 21/09/2026 — eram cinco):

```jsx
{currentView === 'evolution' && gameState.demoCharacterId && (…UnlockNudge…)}
{currentView === 'evolution' && (…EvolutionPath…)}
{currentView === 'evolution' && canRebirth(gameState) && (…botão Renascimento…)}
{currentView === 'evolution' && rebirthRefusal(gameState) === 'not-paid' && !gameState.demoCharacterId && (…UnlockNudge…)}
{currentView === 'evolution' && rebirthRefusal(gameState) === 'not-ultra' && !gameState.demoCharacterId && (…frase "O padrão ainda não chegou ao limite do que esta forma ocupa."…)}
{currentView === 'evolution' && gameState.rebirth && (…linha "Já aconteceu, uma vez. Renasceu do … como …. É ele. Ainda é ele."…)}
```

- **`not-ultra`** (copy §5.4): é **uma frase em `sm2Hint`**, `data-rebirth-block`,
  sem botão e sem convite — a própria página já conta a escada. O `CLAUDE.md`
  ("`not-ultra` não vira convite") continua verdadeiro: o que entrou é
  contexto, não saída. **`already-used`** segue sendo a linha de registro, que
  ganhou a família obrigatória da §11 ("É ele. Ainda é ele." / "Same pattern.
  Still the same one.") — ⚰️ dizia só "Renasceu do X como "Y"".

- **Demo × pago no convite**: `variant={gameState.accountTier === 'paid' ? 'reveal' : 'buy'}`;
  `onOpen` chama `setUpgradeRitual(true)` para quem já pagou e
  `setUnlockReason('evolution')` para quem não pagou.
- **`EvolutionPath`**: o visor da forma atual é **um gesto com dois sentidos**
  (`acf4413e`, canvas Evolução V2, `DECISOES-WIREFRAME.md` §24):

  ```ts
  const evoluiNoToque = prontoParaEvoluir && !evolutionLocked && Boolean(onEvolveRequest);
  const acaoDoVisor = evoluiNoToque ? onEvolveRequest : onToggleEvolutionLock;
  ```

  Com a barra cheia e o cadeado aberto o toque **evolui** (`onEvolveRequest` →
  `handleEvolveRequest`, o mesmo do botão "EVOLVE" da Home); nos outros casos
  alterna `evolutionLocked` (`onToggleEvolutionLock` → `handleToggleEvolutionLock`).
  O `aria-label` do visor (`rotuloDoVisor`) diz qual dos dois vai acontecer
  ("Pronto — toque para evoluir" / "Evolução segurada, toque para liberar" /
  "Evolução liberada, toque para segurar"). O `title` do visor (`tituloDoVisor`)
  nomeia o gesto desde `84ae4937` (21/09/2026, copy §3.2/§3.3): "Encostar" /
  "Touch it" quando evolui, "Soltar" / "Release" quando segurada, "Segurar" /
  "Hold" quando liberada — ⚰️ era "Evoluir" / "Liberar evolução" / "Segurar
  evolução"; nunca "travar"/"lock" em texto de jogador. A frase da barra
  (`fraseProgresso`) com a barra cheia: cadeado aberto → "O padrão está pronto.
  Ele espera você encostar. Toque no seu Soulmon para evoluir." (a 2ª oração
  continua ensinando o gesto — `evolucaoManual.contract.test.ts` exige); cadeado
  fechado → "Ele espera. Esperar não tira nada dele." ⚰️ ("Pronto para evoluir —
  mas você segurou a evolução."). A dica sob o cadeado fechado perdeu "nos dias
  difíceis": "Segurar a forma não protege os corações." O mesmo estado do cadeado continua
  como botão de 44px (`data-lock-button`, `aria-pressed={evolutionLocked}`) para
  quem não descobre o gesto; segurada = placa "ON HOLD"/"SEGURADA" dentro do
  vidro. ⚰️ Até `2580b73a` o toque no visor **só** alternava o cadeado.
  **Nós da árvore** são `SoulNode` (SVG por token, `evolution/nodeArt.tsx`);
  ⚰️ os PNGs de nó saíram junto com o `EvoTrail`.
  **Estados de sprite**: `generatingSprites` (o card `GERANDO`), `onRetrySprite`,
  `onRevertVisor`, `onTuneVisor`, `onSeenTune`; `carePattern` só é passado
  quando `carePatternReading.confident`.
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
  **O que se vê**: um **visor de tela cheia** (`b83f30cd`, canvas Evolução D-E6):
  o vídeo é o cenário **dentro** do vidro; os sprites da forma atual e da
  próxima intercalam por `TOTAL_MS` (3000 ms), brancos, até estabilizar na
  evoluída — **nunca abaixo de `MIN_STEP_MS` (340 ms)** entre trocas (WCAG
  2.3.1; antes o intervalo caía a 55 ms). Fora do vidro, a faixa "EVOLVED INTO" +
  nome + data (`reachedAt`) + o primário "Seguimos juntos" / "We keep going
  together" (`84ae4937`, 21/09/2026, copy §3.2 — a mesma saída do
  `MilestoneCeremony`; ⚰️ era "Vamos seguir juntos" / "Let's keep going together").
  É `role="dialog"` + `aria-modal` com foco preso (`useDialogA11y`); **Escape só
  depois de `done`** — fechar antes seria abandonar a evolução no meio, e o commit
  acontece em `onEvolved`.
  **Movimento reduzido** (`usePrefersReducedMotion`): muda a ESTRUTURA, não a
  pausa — quadro parado antes (64) → `arrow_forward` → depois (128), sem burst e
  sem vídeo, com a evolução commitada na montagem; a cerimônia continua
  esperando o gesto.

- **`EvolveTaskModal`** — **Aparece quando**:

  ```jsx
  isOpen={evolveModalStage !== null && evolutionCeremony === null}
  ```

  ⚠️ O `evolutionCeremony === null` é o encadeamento que **faltava**: evoluir
  abria a cerimônia (z-500) e este modal montava por baixo (z-50), reaparecendo
  cobrando "crie mais atividades" quando ela fechava.
  **Sai para**: `onCreateTask` → `setEvolveModalStage(null)` + `setCreateModalOpen(true)`.
  **Número que ele mostra**: `registeredForDay(gameState, new Date().getDay(), new Date().toDateString())`
  — cadastradas **para hoje**, nunca `activities.length` cru; o texto
  "complete N tasks per day" tem plural real (`acf4413e`, X7).
  **Superfície**: desde `acf4413e` é um `RitualDialog` (`ritual/RitualKit.tsx`,
  `zIndex={200}`) — trap, Escape e devolução de foco vêm dele.
- **Régua**: `src/components/filaDeAvisos.contract.test.ts` trava a string do
  `isOpen`.

### 4.12 `RebirthModal`

- **Chega por**: botão "Renascimento" da página de Evolução ·
  **Aparece quando**: `{rebirthOpen && (…)}`, e o botão que o abre só existe sob
  `canRebirth(gameState)`.
- **Sai para**: `onConfirm` (async — só fecha com `ok`) e `onClose`.
- **Estados**: a confirmação exige **um segundo toque** (`confirmando`); a perda
  é dita **antes** de qualquer escolha, com nome e número, e o que **não** se
  perde é dito junto. "Renascer" sem nome de criatura (`podeSeguir = criaturaLimpa.length > 0 && !ocupado`)
  é inerte **por superfície** (`aria-disabled={!podeSeguir}`, tinta `muted`),
  nunca opacidade; o erro é um
  `role="alert"` âmbar (`acf4413e`).
- **Recusa motivada**: `rebirthRefusal` distingue `not-paid` / `not-ultra` /
  `already-used`; só `not-paid` vira convite (`UnlockNudge` com `reason="evolution"`),
  e só quando o convite do demo não está na mesma tela (§4.10).
- **Dono**: `src/components/RebirthModal.tsx` + `src/utils/rebirth.ts`.

### 4.13 `UnlockNudge` e `UnlockAccountModal`

- **`UnlockAccountModal`** — **Aparece quando**: `{unlockReason && (…)}`, na raiz
  do `App`. **Nunca abre sozinho.** `UnlockReason = 'task-limit' | 'evolution' | 'report' | 'shop' | 'reveal-demo'`
  (o quinto entrou em `a1181a5b`, com o código `revealDemo` no schema de
  telemetria, cliente e servidor).
  **Sai para**: `onUnlocked={handleAccountUnlocked}` (só depois de o **servidor**
  confirmar) e `onClose={() => setUnlockReason(null)}`.
- **`UnlockNudge`** — ⚠️ **Divergência com o `CLAUDE.md`**, que fala em "dois
  lugares" e depois corrige para "TRÊS", **e cita o `EditModal`, que já não
  monta o convite**. Medido em 20/09/2026
  (`grep -rn "<UnlockNudge" src --include=*.tsx | grep -v "\.test\." | wc -l` → **6**,
  o mesmo número de 09/09/2026 com um lugar trocado):

  | Onde | `reason` | Condição |
  |---|---|---|
  | `CreateModal.tsx` | `task-limit` | teto do demo |
  | ⚰️ `EditModal.tsx` | `task-limit` | **saiu em `d044fb2e`** (A1 do canvas Atividades: um modal de criação só — o `EditModal` não cria mais, então não há teto para bater) |
  | `SoulmonOnboarding.tsx` (`REVEAL_DEMO`) | `reveal-demo` | `step === REVEAL_DEMO && demoReading` — novo em `a1181a5b` (§2.3) |
  | `ShopModal.tsx` | `shop` | `seg === 'shop' && accountTier === 'demo' && onUnlock` |
  | `DailyReportModal.tsx` | `report` | `showOffer` (`ofereceNoRelatorio`, com cap semanal por `offerShownWeek`) |
  | `App.tsx` (Evolução) | `evolution` | `currentView === 'evolution' && gameState.demoCharacterId` |
  | `App.tsx` (Renascimento) | `evolution` | `rebirthRefusal(gameState) === 'not-paid' && !gameState.demoCharacterId` |

- **Régua**: `src/components/ofertaDoisCanais.contract.test.ts`,
  `UnlockAccountModal.copy.render.test.tsx`,
  `UnlockAccountModal.dismiss.render.test.tsx`.

### 4.14 Os jogos

| Jogo | Chega por | Sai para | Estados | Dono |
|---|---|---|---|---|
| `DungeonGame` | card na `ActivitiesPage` | `onExit` | `phase`: `intro` → `attack`/`defend`/`result` → `enemy-down` → `floor-clear` → `run-complete` \| `lost`; `floor` até `MAX_FLOORS` (5). **O vocabulário na tela é o da bíblia desde `84ae4937` (21/09/2026, copy §4)**: o subtítulo diz "Camada N de 5" / "Layer N of 5" (números de `MAX_FLOORS`, nunca à mão); o primário do `intro` é "Descer" / "Go down" (⚰️ "Entrar na masmorra"); `enemy-down` diz "‹nome› parou de insistir aqui." (⚰️ "derrotado!" — nenhuma criatura da Malha morre); `floor-clear` = "Camada N limpa."; `run-complete` = "As 5 camadas ficaram para trás." + a frase do Glitchtama "com um dia inteiro preso dentro" + "Descer de novo" (⚰️ "Nova run"); `lost` = "Você subiu. A descida ficou pelo caminho — e só ela." + "Seus corações continuam intactos." | `DungeonGame.tsx` |
| `ArenaGame` | card na `ActivitiesPage` | `onExit` | usa a ficha (`skills`, elemento) | `ArenaGame.tsx` |
| `DinoGame` | card na `ActivitiesPage` | `onExit` | `onScore={onDinoScore}` alimenta o recorde; o corredor é `lineIconForStage(evolutionStage, 64, demoCharacterId) ?? getSpriteForStage(…)` (`utils/lineIcons.ts`, rodada 2, 21/09/2026 — o ícone-ficha 64² da linha; sprite a 0,25× quando o estágio não é de linha) | `DinoGame.tsx` |
| `RPSGame` | card na `ActivitiesPage` | `onExit` | duelo curto | `RPSGame.tsx` |
| `NightmareBattle` | **fila de intersticiais** | `onWin={handleNightmareWin}` / `onLose`/`onClose` = `closeNightmare`; desde `6fe6c73a` é um `RitualDialog` (trap, Escape, devolução de foco) | perder não custa nada, e a tela diz isso | `NightmareBattle.tsx` |
| ⚰️ `PlayCard` | **não é mais montado** (`f5ead7c0`, 16/09/2026) — Brincar é a célula `play` do deck do `CompanionHUD` (§4.2) | — | `available` / `canPlay` / `playedToday` (`playDeck` no `App.tsx`) | `PlayCard.tsx` segue no repo sem consumidor |

**Chrome comum dos quatro jogos** (`src/components/games/GameKit.tsx`, novo em
`6fe6c73a`, canvas Jogos §25): `GameRoot` (a página, `position: fixed`, **reserva a
faixa da nav inferior** — a nav continua visível, e sair pelo Início é caminho
legítimo) › `GameHeader` (título + × 44 que chama `onClose` = o `onExit` do jogo, e
é **o primeiro interativo** da tela) › `GameVisor` (o minijogo é o conteúdo do
vidro) › `HpBars`/`TimingBar`/`FxPopup` (`role="status"`) embaixo (`TimingBar` mora em
`src/components/pixel/TimingBar.tsx`; os outros dois no `GameKit`). Sem `Suspense`
novo: o ponto de montagem continua `{openGame === '<id>' && (…)}` na
`ActivitiesPage`.

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

**Brincar — a célula `play` do deck**: `available: jaConcluiuAlgo` (`playDeck`,
`useMemo` no `App.tsx`). ⚰️ O `PlayCard` era montado sob `{jaConcluiuAlgo && (…)}`;
o gate é o mesmo, mas hoje é **célula inerte, não card ausente** — antes da
primeira conclusão `canPlay` exige energia ≥ `PLAY_ENERGY_COST` (1), energia vem
de comida e comida vem de concluir, então no dia 1 a célula nasce inerte com o
rótulo "Brincar — depois da primeira atividade".

**`MAX_FLOORS`** mora em `src/components/DungeonGame.tsx` (medido em 09/09/2026;
o `CLAUDE.md` já registra que ele **não** está em `utils/dungeon.ts`).
⚠️ **Divergência de vocabulário com o `CLAUDE.md`** (linha ⚔️ Masmorra: "uma run =
5 andares", "Concluir os 5 andares"): desde 21/09/2026 o jogador lê **descida** e
**camada**; `run`/`andar`/`floor` seguem sendo os nomes de código (`MAX_FLOORS`,
`floor`, `startRun`, `'run-complete'`). A mecânica não mudou — só o texto.

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
- **Resultado da partida**: um `RitualDialog` (`zIndex={400}`, `3f359acc`) com as
  duas criaturas em mini-visor; "Fight" tem nome acessível "Fight — challenge
  ‹nome›" (WCAG 2.5.3); o switch de PvP travado é inerte por forma
  (`aria-disabled`, fora do Tab), nunca `disabled`.
- **O que os mini-visores mostram** (`66e32d43`, rodada 2, 21/09/2026 — D-J13
  cumprida): o oponente a 64 é `lineIconForStage(o.stage, 64) ?? getSpriteForStage(o.stage)`;
  a linha do ranking a 32 é `lineIconForStage(r.stage, 32)` com `imageRendering:
  'pixelated'`, e cai no sprite a 0,125× com `imageRendering: 'auto'` (⚰️ o
  único caminho, "transição até os ícones 32²") quando o estágio não é de linha.
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
- **As manchetes e as notas** (`84ae4937`, 21/09/2026, copy §2 — o mundo
  constata, sem `!`; a decisão ordena `welcome` → `degenerated` → `wasPerfect` →
  `heartsLost > 0` → o resto): `welcome` → "Que saudade!" (mantida, decisão 3 do
  dono); `degenerated` → "Ele recolheu para uma forma que se sustenta com menos."
  (⚰️ "Seu Soulmon voltou um estágio") **mais a nota** "Nada do que foi
  descoberto saiu. O caminho de volta é o mesmo caminho."; `wasPerfect` → "Um
  trecho fechou." (⚰️ "Dia completo!") **mais a nota** "A fagulha firmou.";
  `heartsLost > 0` → "Um dia mais devagar."; senão "Dia novo." (⚰️ "Novo dia!").
  A linha de corações com perda diz "O padrão afrouxou um pouco." (⚰️ "meio em
  recuperação" / "N em recuperação" — sem número, sem causa). `restDayUsed` →
  "A maré absorveu ontem. Nada foi cobrado. Ela recarrega na segunda." (⚰️ "usou
  a folga da semana"); `weeklyRelief` → "A maré devolveu um pouco. Semana nova."
  **Sem saldo** de folga em lugar nenhum (§10 da bíblia).
- **Dono**: `src/components/DailyReportModal.tsx` · **Régua**:
  `DailyReportModal.aventura.render.test.tsx`,
  `src/components/ofertaDoisCanais.contract.test.ts`, `src/narrativa.contract.test.ts`
  (vocabulário vetado).

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
- ⚰️ **Divergência fechada em `4f5d2aac` (20/09/2026)**: o comentário do `App.tsx`
  dizia que ela "some sozinha em 2,5s"; hoje diz "não pede nada além do gesto".
  O componente continua sem `setTimeout` (`grep -n "setTimeout" src/components/MilestoneCeremony.tsx`
  → vazio), é `zIndex: 300` e **espera o gesto**. Desde o canvas Rituais (§21) é
  um `RitualDialog` (`role="dialog"` + `aria-labelledby`), com o sprite e o emblema
  do marco (`emblemFor(tier)`) num vidro.
- **O texto do marco** vem de `MILESTONE_TEXT[tier]` no `App.tsx`; o de 66 dias
  diz "66 dias! Isso virou raiz." / "66 days! This one took root." desde
  `84ae4937` (21/09/2026) — ⚰️ dizia "virou parte de quem você é" / "is part of
  who you are", a pessoa como sujeito de um verbo de ser (L1 da bíblia). O botão
  de saída é "Seguimos juntos" / "We keep going together" (o EN era "Let's keep
  going together").
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
- **Superfícies desde `f757ed26`** (canvas Social, `DECISOES-WIREFRAME.md` §28):
  o `PlayerDetailModal` é um `RitualDialog` com × "Fechar"/"Close"; as abas são
  `role="tab"`; ação sem rede/sem saldo é **inerte por forma** (tracejado +
  `muted` + `aria-disabled`, fora do Tab); alertas `role="alert"` em âmbar (⚰️ o
  `danger-ink` saiu); a criatura do outro aparece em `MiniGlass` (nunca avatar).
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

- **`SettingsPage`**: grupos por intenção (`grep -c "<Group title=" src/components/SettingsPage.tsx`
  → **9** em 21/09/2026 depois de `980bc84c`, dois deles condicionais — "Sua
  história" só sob `redeemed && onToggleShowRedeemed`, "Som" só sob
  `onToggleSound`; ⚰️ "8" era a contagem antes de `980bc84c` no mesmo dia e
  "cinco grupos" a de 09/09/2026), uma ação dominante
  (entrar/sincronizar). Contém `AccountSection` (conta e compras, com
  "Restaurar compras" — exigido pela Play), `AccountDataSection` (exportar e
  apagar), `InstallPrompt` (cartão, **não** modal) e os botões que abrem o
  `GuideModal` (`onOpenGuide`) e o `HelpModal` (`onOpenGlossary`).
  **Grupo "Sobre" / "About"** (`5b91717c`, 21/09/2026 — os três limites da §16
  da bíblia, em voz de PRODUTO, sem metáfora): três parágrafos `sm2Text` — o
  Soulmon "não avalia, não diagnostica, não trata e não substitui acompanhamento
  de saúde"; o questionário "não é um teste validado" e o mapa astral "não prevê
  nada"; o app "não sabe nada sobre a sua vida além do que você escreveu nele" —
  e um `sm2Hint` de fecho ("Nada do que aparece aqui é uma afirmação sobre a sua
  saúde, a sua mente ou o seu futuro"). Sempre montado, entre "Ajuda" e "Seu
  ritmo". Desde `42b07bec` o grupo ganhou três linhas (⚰️ "sem botão, sem
  link"): o **aviso de IA** (decisão #22, tom de fato — "A imagem da sua criatura
  e as falas do chat são geradas por IA (Higgsfield e Gemini para a imagem, Groq
  para a conversa)"), o `ActionRow` **"O que o chat recebe"** →
  `/privacidade.html#chat-contexto`, e a linha de **feedback** `FeedbackRow`
  ("Falar com quem faz o Soulmon" / "Talk to the people who make Soulmon", hint
  "Abre seu e-mail. A versão do app já vai preenchida.") — um `mailto:` para
  `FEEDBACK_EMAIL` com assunto "Soulmon", `APP_VERSION`, 8 caracteres do `saveId`
  e `Origem: settings` (`src/components/FeedbackLink.tsx`; não é formulário porque
  não há backend de suporte). A linha "Soulmon 1.0.2" do grupo Ajuda lê a mesma
  `APP_VERSION`. Régua: `src/components/SettingsPage.sobre.render.test.tsx` (5
  casos).
  **Grupo "Som" / "Sound"** (`980bc84c`, 21/09/2026 — achado do
  doc-mantenedor: o `SettingsModal` ficou sem gatilho e com ele o mudo e a
  trilha eram inalcançáveis): dois `SwitchRow`, entre "Sua história" e "O que o
  Soulmon te manda" — **"Sons" / "Sound effects"** (`checked={!soundMuted}`,
  toque → `onToggleSound`, que é `handleToggleSound` do `App.tsx`: `setMuted`,
  `setSoundMuted`, `pausarTrilha()`/`retomarTrilha()`, `trackSoundOff()` só ao
  ficar mudo; hint "Confirmam o que você fez. Nunca tocam sozinhos.") e
  **"Trilha" / "Music"** (`checked={trilha}`, estado local iniciado por
  `trilhaPreferida()`; toque → `desligarTrilha()` se ligada, senão
  `ligarTrilha()` — este toque É o gesto da S2; hint com `soundMuted`: "Com os
  sons desligados, a trilha fica em silêncio.", senão "Duas camadas calmas, em
  loop. Para sozinha quando o app sai de vista."). O grupo **só monta se
  `onToggleSound` chegar** — sem a prop, nada de switch morto. Régua:
  `src/components/settingsSom.render.test.tsx` (PT/EN, o toque chega ao dono).
  Regra em [`02` §58-A](02-REGRAS-DE-NEGOCIO.md#som).
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
- ⚰️ **`SettingsModal`** (o painel rápido "Ajustes rápidos") **foi apagado em
  `4a8b8049`** (decisão do dono #37): `{settingsOpen && (…)}`, `settingsOpen`,
  `handleOpenAISettings` e o `lazy()` saíram do `App.tsx`, e a prop
  `onOpenAISettings` saiu de `CompanionHUD` e `ChatBox` (`grep -rn
  "onOpenAISettings\|SettingsModal" src --include=*.tsx` → só três comentários
  ⚰️, 21/09/2026). O
  caminho real de "Personalidade" continua sendo esta página (§4.23a), e o par
  "Sons"/"Trilha" só existe no grupo "Som" acima — a `SettingsPage` é o ÚNICO
  caminho do mudo (comentário da prop `soundMuted`).
- **Dono**: `src/components/SettingsPage.tsx` e vizinhos · **Régua**:
  `AccountDataSection.render.test.tsx`,
  `src/components/settingsTelemetry.render.test.tsx`,
  `src/components/settingsSom.render.test.tsx`.

### 4.23a `AISettingsModal` — o caminho real de abertura (medido em 13/09/2026, a pedido do inventário de wireframes)

**Chega por**: **`SettingsPage` → `ActionRow` "Personalidade" / "Personality" →
`setShowAISettings(true)`**, no mesmo grupo que tem o switch "Conversa com IA" /
"AI chat". E a `SettingsPage` chega-se pela linha "Configurações" do menu
sanduíche da `BottomNav` (`onClick={() => { onNavigate('settings'); setMenuOpen(false); }}`
→ `currentView === 'settings'`) · **Sai para**:
`onClose={() => setShowAISettings(false)}`; "Salvar" / "Save" faz
`onSave(settings)` e fecha no mesmo gesto.

⚠️ **Este é o achado do inventário de wireframes (`CONTA-14`), e os dois docs
discordavam**: o [`../INVENTARIO-TELAS.md`](../INVENTARIO-TELAS.md) (19/08/2026)
diz "via `CompanionHUD`", e este documento não repetia o caminho. **O caminho
pelo `CompanionHUD` existe como FIAÇÃO e está MORTO** — medido em 13/09/2026:

```
$ grep -n "handleOpenAISettings" src/App.tsx
4072:  const handleOpenAISettings = useCallback(() => setSettingsOpen(true), []);
5032:                onOpenAISettings={handleOpenAISettings}

$ grep -n "onOpenAISettings" src/components/ChatBox.tsx
19:  onOpenAISettings?: () => void;
48:  onOpenAISettings,
```

A prop descia `App.tsx` → `CompanionHUD` → `ChatBox`, e o `ChatBox` **nunca a
chamava**: as duas ocorrências eram a declaração no tipo e a desestruturação.
Como `handleOpenAISettings` era o único chamador de `setSettingsOpen(true)`,
`{settingsOpen && (…SettingsModal…)}` **nunca montava** — e com ele ficava
inalcançável a **segunda** instância de `AISettingsModal`, a que vivia dentro do
`SettingsModal`. Era a mesma família do §4.9 (`OraclePage`): componente montado
atrás de um estado sem gatilho. ⚰️ **Fechado em `4a8b8049`** (decisão #37): o
modal, o estado, o handler e a prop foram apagados — a medição acima fica como
registro; hoje só existe UMA instância de `AISettingsModal`, a desta página.

**Aparece quando**: `<AISettingsModal isOpen={showAISettings} … />` — a folha é o
próprio componente (`ModalSheet` com `open={isOpen}`, `role="dialog"`,
`aria-modal="true"`, `aria-label` "Personalidade" / "Personality", z-index 120,
Escape e foco presos por `useDialogA11y`).

**O que se vê/faz** — quatro grupos de chips, todos PT/EN, e um bloco escondido:

| Bloco | Campo | Opções |
|---|---|---|
| "Como seu Soulmon fala" / "How it talks" | `tone` | Tranquilo · Elétrico · Sereno · Brincalhão |
| "Emojis" | `emojiIntensity` | Nenhum · Poucos · Alguns · Muitos |
| "Como seu Soulmon te incentiva" / "How it encourages you" | `motivationStyle` | Anima · Provoca · Acolhe · Equilibrado |
| `Disclosure` "Mais opções" / "More options" | `temperature` (`CREATIVITY`, três degraus; o marcado é `nearestCreativity(s.temperature)`) e `customKeywords` (`<textarea>` de `maxLength={500}`) | Previsível · Equilibrado · Criativo |

O contador do `<textarea>` **só aparece perto do limite**
(`{s.customKeywords.length > 400 && (…)}`), em `aria-live="polite"`. O rodapé tem
dois botões: "Padrão" / "Default" (`setS(defaultSettings)`, **local** — não
salva) e "Salvar" / "Save".

**Estados**: o estado local `s` é ressincronizado a cada abertura —
`useEffect(() => { setS(currentSettings || defaultSettings); }, [currentSettings, isOpen])`
—, então **fechar sem salvar descarta** tudo o que foi mexido.

**Dono**: `src/components/AISettingsModal.tsx` (a folha) e
`src/components/SettingsPage.tsx` (o caminho vivo) · **Régua: nenhuma.**
`grep -rln "AISettingsModal" src --include=*.test.tsx` devolve um único arquivo,
`src/components/settingsTelemetry.render.test.tsx`, e **só por `import type`** —
ele monta a `SettingsPage`, nunca a folha (13/09/2026).
⚠️ **Nada trava o caminho de abertura** (a morte do `SettingsModal` já aconteceu).

### 4.23b ⚰️ `SettingsModal` "Ajustes rápidos" / "Quick settings" — apagado em `4a8b8049` (21/09/2026, decisão #37)

**Registro histórico.** O arquivo `src/components/SettingsModal.tsx` não existe
mais (`ls src/components/SettingsModal.tsx` → não encontrado, 21/09/2026); tudo
abaixo descreve o que ele montava **se** abrisse — e ele nunca abria (§4.23a).
Motivo da remoção: duplicata da `SettingsPage` (as quatro linhas já viviam lá)
sem gatilho vivo. **Chegava por**: `{settingsOpen && (…SettingsModal…)}` da raiz
do `App` — reconferido em `8d318529`, sem gatilho vivo. Desde `980bc84c` o par
"Sons"/"Trilha" tem caminho vivo na `SettingsPage` (§4.23, grupo "Som") ·
**Saía para**: X/Escape do `ModalSheet` (`onClose`).

**O que se vê/faz** — `ModalSheet` com `title` "Ajustes rápidos" / "Quick
settings" e, desde `ee79fd44`, **quatro** linhas de `SwitchRow`/`ActionRow`, na
ordem do arquivo:

| Linha | Rótulo PT / EN | Gesto | Hint |
|---|---|---|---|
| 1 | "Sons" / "Sound" | `onToggleSound?.()` → `handleToggleSound` em `App.tsx` (único desde `980bc84c`, o mesmo da `SettingsPage`): `setMuted`, `setSoundMuted`, e **`pausarTrilha()` se ficou mudo / `retomarTrilha()` se religou** (E0: o mudo global cala a trilha); `trackSoundOff()` só na transição ligado → mudo | — |
| 2 | **"Trilha" / "Music"** | `checked={trilha}` (estado local iniciado por `trilhaPreferida()`); toque: `if (trilha) desligarTrilha(); else ligarTrilha(); setTrilha(!trilha)` — este toque É o gesto da S2 | com `soundMuted`: "Com os sons desligados, a trilha fica em silêncio." / "With sound off, music stays silent."; senão: "Duas camadas calmas, em loop. Para sozinha quando o app sai de vista." / "Two calm looping layers. Stops by itself when the app is out of view." (⚰️ dizia "Uma camada" até `980bc84c`) |
| 3 | "Conversa com IA" / "AI chat" | `onToggleAI` | "Desligado, seu Soulmon responde por palavras-chave." / "Off, it answers from keywords." |
| 4 | "Personalidade" / "Personality" | `setShowAISettings(true)` → segunda instância de `AISettingsModal` | — |

**Aparece quando**: a linha 2 não tem condição própria — monta sempre que o
modal monta, mudo ou não; o que muda com `soundMuted` é só o hint.

**Estados**: `trilha` é estado local lido uma vez na montagem
(`useState(() => trilhaPreferida())`, isto é, a chave
`STORAGE_KEYS.SOUND_TRACK_ENABLED`); não reage a mudança externa enquanto o
modal está aberto. A trilha em si para sozinha em `document.hidden`, no sono
(`handleSleep` chama `pausarTrilha`/`retomarTrilha`) e no mudo — regra em
[`02` §58-A](02-REGRAS-DE-NEGOCIO.md#som).

⚰️ **Consequência do gatilho morto, fechada em `980bc84c`** (21/09/2026,
mesmo dia): entre `ee79fd44` e `980bc84c`, `ligarTrilha` só era chamada por
esta linha e por `aoGestoSonoro` (`src/utils/trilha.ts`, que exige a chave já
ligada), e `setMuted` só pelo `onToggleSound` deste modal — **não existia
caminho vivo** para o jogador ligar a trilha nem mudar o mudo global. Hoje
`ligarTrilha`/`desligarTrilha` são chamadas também pela `SettingsPage` (§4.23,
grupo "Som"; `grep -rln "ligarTrilha" src/components` → `SettingsModal.tsx`,
`SettingsPage.tsx` e a régua `settingsSom.render.test.tsx`) e `setMuted` continua sendo chamado só em `App.tsx`
(`handleToggleSound`; `grep -rn "setMuted(" src --include=*.tsx` → só
`App.tsx`), agora alcançável pela página. Registrado como fechado no
[`../STATUS.md`](../STATUS.md). ⚰️ O hint dizia "Uma camada" com a trilha em
**duas** (`CAMADAS_DA_TRILHA`, `8a930657`) — D33 em
[`02` §59](02-REGRAS-DE-NEGOCIO.md#divergencias), fechada em `980bc84c`.

**Dono (era)**: `src/components/SettingsModal.tsx` (⚰️ `4a8b8049`) · `src/App.tsx`
(`handleToggleSound`, `handleSleep` — continuam, agora só para a `SettingsPage`) ·
**Régua: nenhuma** para o modal, nunca houve; o par de chaves na `SettingsPage` é
travado por `src/components/settingsSom.render.test.tsx`, e a chave separada do
mudo por `src/utils/audioBus.contract.test.ts`.

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
| `GamePopups` → `FirstTaskCompletedPopup` | `showFirstTaskPopup` | **uma vez na vida**, guardado por `FIRST_TASK_POPUP_SHOWN` e por uma varredura (`anyStepCompleted` / `anyTaskCompleted`). Desde `eb932ebb` (canvas Rituais R8/S8) mudou de CLASSE: ⚰️ era `ModalSheet` em z-120, **sob** os intersticiais (invisível quando o gatilho era o "só 5 minutos?" do check-in); hoje é `RitualDialog` **z-300, espera o gesto**, como a cerimônia do marco — fora das filas de propósito | `GamePopups.tsx` |
| `ContentModals` → `GuideModal` | `guideModalOpen` | o guia; os números saem das CONSTANTES | `GuideModal.tsx` |
| `HelpModal` | `showHelpModal` | o glossário, idem; a linha de abertura diz, desde `5b91717c` (21/09/2026, copy §6): "O que cada palavra da tela quer dizer. O Soulmon tem um universo próprio: estes são os nomes dele, e nenhum deles descreve você." — a 2ª oração bloqueia a leitura de tipologia ("então eu sou akasha") | `HelpModal.tsx` |
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

- **O que mostram** (`WidgetRenderer.kt`, refeito em `6affd501` pelo canvas
  Fora do app, `DECISOES-WIREFRAME.md` §30): nome do pet (`pet_name`), rótulo do
  estágio, o contador `"$completed/$total"` **só com ≥1 feita**
  (`taskCounter` devolve `null` e a linha `widget_tasks` vai a `View.GONE` com zero
  feitas ou zero tarefas — REGISTRO 13.16; ⚰️ o `"—"` no zero saiu), corações,
  barra de energia, sprite (a criatura do estágio via `setImageViewBitmap`) e uma
  **frase do pet**. Por widget: **A** (`renderFull`, horizontal) tem contador e
  frase; **B** (vertical) tem o contador **na linha do estágio** e ⚰️ **sem
  frase**; **C** (`renderPet`) só sprite + cocô; **D** (`renderChat`) frases e
  ⚰️ **sem contador**; **E** (`renderScreen`) corações + energia + sprite.
- **Para onde levam**: `attachClick` monta um `PendingIntent` com o
  `getLaunchIntentForPackage` e o liga ao `R.id.widget_root` — **tocar em
  qualquer lugar do widget abre o app**. Não há alvo por região.
- **O widget NÃO cobra** — a escada de frases (`contextualMessage`), na ordem em
  que a função decide (três `if` e então um `when`), **só em inglês e sem emoji**
  (REGISTRO 13.18 — o widget não tem idioma; D-F3 — o RemoteViews não tem fonte
  de ícone): `hp <= 20` → "I've been missing you"; `needsIntervention` → "Today,
  just five minutes?"; `total == 0` → "You've been steady" (com `habit_steady`)
  ou "One day at a time"; depois `ratio >= 1.0` → "Complete day!"; `>= 0.7` →
  "Almost there!"; `>= 0.4` → "Keep it up!"; senão → "You started — that already
  counts". No widget D (`buildChatPhrases`): `hp <= 20` → "I miss you...";
  `total == 0` → "Let's add a task?"; `completed >= total` → "We crushed it
  today! ✨"; senão "Whenever you're ready, I'm here."; ⚰️ "Don't forget about
  me today!" saiu do pool.
  ⚰️ `"📋 $completed de $total feitas"`, `"⚠️ Cuide de mim!"` e
  `"N task(s) left, let's go!"` **não existem mais**; ⚰️ a escada em PT-BR
  ("💛 Tô com saudade de você" … "✨ Dia perfeito!") **também não** — saiu em
  `6affd501` (20/09/2026).
- **Régua**: `src/plugins/widgetSemCobranca.contract.test.ts` — lê o FONTE
  Kotlin, porque nenhum teste em `node` alcança Kotlin; desde `6affd501` trava
  também `"0/"`, o traço e o veto de presença.

⚰️ As duas observações de 09/09/2026 (frase só em PT-BR; "Dia perfeito!" no topo
da escada) **fecharam em `6affd501`**: a escada é só em inglês por decisão
(13.18) e o degrau diz "Complete day!" (P5).

### 5.2 Overlay Electron

Dono da fronteira: `desktop/renderer/src/menu.ts` (`renderMain`, `renderTasks`,
`renderSettings`) — e a fronteira de **cuidado** é `desktop/renderer/src/care.ts`,
não este arquivo.

- **Painel principal** (`renderMain`, refeito em `e2e196b2` pelo canvas Fora do
  app, `DECISOES-WIREFRAME.md` §30 D-F7..D-F13): cabeçalho com `stageName` (por
  `textContent`, nunca `innerHTML` — o nome vem do save remoto), a linha de
  estado `statusLine()` — corações `favorite` num `role="img"` com `aria-label`
  "N de M corações", `bolt` + `energy/maxEnergy` **só com energia > 0**,
  `restaurant` + `×foodCount` (⚰️ os emojis ❤️/⚡/🍎 saíram; a linha **não é
  montada dormindo**: `if (!state.sleeping) pb.appendChild(statusLine())`), o
  retrato do pet num vidro (dormindo = filtro + Z, nunca opacidade), a fala
  (`aria-live="polite"`), e a **fileira de cuidado** com quatro `careButton`:
  `volunteer_activism` Carinho (`doPet`), `restaurant` Comida (`doFeed`),
  `shower` Banho (`doShower`) e `bedtime` Dormir / `wb_sunny` Acordar
  (`doSleepToggle`).
- **Tarefas de hoje**: `button('task_alt', …)` **sem dígito** (REGISTRO 13.17 —
  ⚰️ o contador na porta da lista saiu) → `panel = 'tasks'; render()`.
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
- **Ícones** (`3e758a81`, canvas Fora do app D-F14/D-F15): Web Push e
  `AlarmReceiver.kt` levam `push-large-192.png` (mini-visor redondo com a chama)
  como `largeIcon`/`setLargeIcon` e `badge-96.png` alfa-only; o FCM v1 **não tem
  `largeIcon`** (e `image` viraria BigPicture), então `workers/fcm.js` manda só
  `android.notification.icon = ic_notification` + `color`. A copy de
  `_pushCopy.js` e os horários **não mudaram**.
- **Dedupe entre os dois canais**: a **tag da copy** é o que impede a duplicata;
  o `AlarmReceiver.kt` usa `notify(tag, 0, …)` casando com o
  `android.notification.tag` do `workers/fcm.js`.
- ⚰️ O nudge das 21h **não existe mais**, e o comentário de `PUSH_HOURS_BRT` diz
  por quê: "nada deve pedir uma quarta visita ao app".
- **Régua**: `workers/pushCopy.parity.test.js` (trava as três árvores).

---

## 6. Divergências abertas (para o `../STATUS.md`)

| # | Afirmação | Onde está | O que o código diz (09/09/2026; recheado em 20/09/2026 sobre `dc72579e`; linhas 12–13 medidas em 21/09/2026 sobre `9875477b`) |
|---|---|---|---|
| 1 | "Loja em ABAS (Itens/Cenários/Mobílias/Torneio/Missões)" | `CLAUDE.md` | `type ShopSegment = 'shop' \| 'tournament'` — **dois** segmentos; Itens/Cenários/Mobílias são seções de um scroll, e a aba Missões não existe |
| 2 | "a página é dungeon + dino + pedra-papel-tesoura + torneio" | comentário de `BottomNav.tsx` | `openGame` aceita `'dungeon' \| 'arena' \| 'dino' \| 'rps'` — **quatro** minijogos |
| 3 | "`UnlockNudge` só aparece em dois lugares… hoje são TRÊS", e "o `EditModal` passou a exibir o `UnlockNudge` também" | `CLAUDE.md` | `grep -rn "<UnlockNudge" src --include=*.tsx \| grep -v "\.test\." \| wc -l` → **6**; e o `EditModal` **não** monta mais o convite desde `d044fb2e` (o sexto lugar é o `REVEAL_DEMO` do onboarding) — §4.13 |
| 4 | "sem elas o botão de microfone **não é desenhado**" | `CLAUDE.md` | o `<button>` continua montado; com `micDisponivel === false` ele vira o botão de enviar, com `aria-disabled` quando não há texto |
| 5 | ⚰️ "a cerimônia de marco… some sozinha em 2,5s" | comentário do `src/App.tsx` | **fechada em `4f5d2aac`** (20/09/2026): o comentário passou a dizer "não pede nada além do gesto"; o componente segue sem `setTimeout`, `zIndex: 300` |
| 6 | "`ArenaGame` é código morto" | `docs/INVENTARIO-TELAS.md` §6.3 (19/08/2026) | é o segundo card da `ActivitiesPage` desde então |
| 7 | "`OraclePage` é alcançável pelo atalho de dono (segurar o mascote)" | `SoulmonOnboarding.tsx` (comentário) e `docs/INVENTARIO-TELAS.md` §5.13 | `startOracleDebugHold`/`cancelOracleDebugHold` **não têm chamador** — a intro que os usava foi apagada. `OraclePage` e `PixelizerCard` são inalcançáveis por qualquer caminho |
| 8 | ⚰️ frase do widget e nome do dia | `WidgetRenderer.kt` | **fechada em `6affd501`** (20/09/2026): a escada é só em inglês por decisão (REGISTRO 13.18) e o topo diz "Complete day!" (P5) — §5.1 |
| 9 | comentário do slot de avisos numera "1. HP" duas vezes | `src/App.tsx` | a ordem executada é a dos `push`: firstDay → hp → semanal → triagem → priming → recomeco |
| 10 | "Brincar" é um card na Home (`PlayCard`), e a IIFE do `PlayCard` no `App.tsx` é consumidora de `playLog` | `CLAUDE.md` (linha 🧮, "**brincar** `playLog` (`utils/petNeeds.ts` + a IIFE do `PlayCard` no `App.tsx`)") | o `PlayCard` não é montado desde `f5ead7c0`; Brincar é a célula `play` do deck do `CompanionHUD`, alimentada por `playDeck` (`useMemo` no `App.tsx`) — §4.2, §4.14. `src/components/PlayCard.tsx` segue no repo sem consumidor |
| 11 | "o fundo do widget é vetor `pet_grid.xml`" | `CLAUDE.md` (footgun 4) | `android/app/src/main/res/drawable/pet_grid.xml` foi **apagado** no delta (`6affd501`); o fundo é `widget_bg.xml` (`<shape>`, `drawable/` e `drawable-v31/`) — §5.1 |
| 12 | "uma **run = 5 andares**", "Concluir os 5 andares", "bônus de andar" | `CLAUDE.md` (linha ⚔️ Masmorra) e linha ⭐ ("os 5 andares da masmorra") | desde `84ae4937` (21/09/2026) o jogador lê **descida** e **camada** ("Camada N de 5", "Descer", "Descer de novo", "As 5 camadas ficaram para trás"); `run`/`floor`/`MAX_FLOORS` continuam sendo os nomes de código — vocabulário, não mecânica — §4.14 |
| 13 | "Recusa = pet fala que está cheio (sem toast)" e a tabela 🫶 sem dizer o que acontece ao usar 💗 com a vida cheia | `CLAUDE.md` (linhas 🍎 e 🫶) | continua sem toast; mas a frase de comida cheia vem de `PET_VOICE_LINES.full` (`petVoice.ts`), não do `CompanionHUD`, e a vida cheia ao usar 💗 fala `steady` ("Tô firme. Guarda essa."), ⚰️ não mais o canal do teto de carinho (`healCapSignal`) — §4.2, §4.2b |
