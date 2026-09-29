# Inventário de Telas do Soulmon

> **Dono deste arquivo:** o Cartógrafo de Telas. Este documento é o MAPA da
> superfície visual do app — não propõe soluções de design. O que não estiver
> listado aqui não vai ser redesenhado.
>
> **Data do levantamento:** 19/08/2026 · commit da árvore de trabalho em
> `D:\Soulmon\repo` · app rodando em `http://localhost:3001` (`npm run dev`;
> a porta 3000 estava ocupada).
>
> ⚰️ **Registro de 19/08/2026, não estado** (lápide de 21/09/2026, QA GERAL). O inventário vivo é `docs/manual/03-FLUXO-DE-TELAS.md` + `docs/design/INVENTARIO-WIREFRAMES.md` §3. Três componentes citados abaixo **não existem mais** (`ls src/components/{DigivolutionProgress,RowIcon,WalkingPetStrip}.tsx` → nenhum): `RowIcon.tsx` apagado em `ad11e64b` (24/08/2026, lucide zerado), `WalkingPetStrip.tsx` em `55793cb6` (07/09/2026, órfão), `DigivolutionProgress.tsx` em `977634f1` (07/09/2026, rename DigiApp). `utils/iconRegistry.ts` também não existe.

---

## 0. Método e limites da verificação

| O que | Como foi obtido | Confiança |
|---|---|---|
| Contagem de arquivos/ícones | `find`/`ls`/`grep` no repo | **Medido** |
| Contagem de imports e classes | `grep -o` + script Node | **Medido** |
| Fluxo de onboarding, home, views, loja, masmorra, torneio, biblioteca, configurações | Percorrido no navegador com `document.body.innerText` + clique por DOM | **Medido no app rodando** |
| Cartões contextuais (fresh start, relatório semanal, banner de HP, triagem, PlayCard) | Lidos do código (`src/App.tsx`) | **Só leitura estática** |
| Aparência visual (cor, espaçamento, contraste, alinhamento) | — | **Não verificado** |

### O que NÃO consegui verificar, e por quê

1. **Nenhuma captura de tela.** `computer{screenshot}` falha com
   `the Browser pane is not displayed, so the page is not compositing frames`.
   Toda a verificação foi por DOM (`innerText`, `querySelectorAll('img')`,
   `getComputedStyle`). **Logo: nenhuma afirmação sobre aparência neste
   documento é medida** — só presença/ausência de elementos e origem de ícone.
2. **A viewport nasce 0×0.** Corrigi com `resize_window(412×915)`, mas os
   valores de layout lidos antes disso (e qualquer medida de `getBoundingClientRect`)
   não são confiáveis.
3. **Resíduo do splash no DOM.** Em TODAS as telas o `innerText` termina com
   `SOULMON / LOADING DATA... / SOUL_LINK ESTABLISHED` — é o splash estático do
   `index.html` (`div.sp-link`, pai `position:fixed; z-index:9999; opacity:1`).
   Medi `height: 0` depois do resize, então ele provavelmente está colapsado e
   não cobre nada — **mas sem screenshot não dá para afirmar**. Fica como
   pendência de verificação visual.
4. **Superfícies que exigem tempo ou progresso**: relatório diário, check-in de
   um segundo dia, sonho, pesadelo, fresh start de segunda, relatório semanal de
   domingo, cerimônia de evolução, torneio com PvP ligado, StepsCard (só APK),
   InstallPrompt (precisa de `beforeinstallprompt`). Todas mapeadas por leitura
   de código; **condição de aparição transcrita literalmente do fonte**.
5. **A geração do oráculo (caminho pago)** não foi percorrida — depende de
   backend e de compra. Os 20 itens do teste e o reveal saem de leitura.
6. **`OraclePage` é inalcançável pela UI** (ver §5.13) — não há como visitar.

---

## 1. Contagens reais (medidas, não estimadas)

### 1.1 PNGs de ícone

```
src/assets/soulmon/icons/*.png            47
src/assets/soulmon/icons/categories/*.png  8
src/assets/soulmon/icons/games/*.png       5
                            ── TOTAL      60
```

Fora dessa pasta, mas usados como ícone na UI:

```
src/assets/icons/                          8  (confetti-burst, icon-chip-{power,data,benevolence},
                                               icon-heart-item, icon-trophy-{bronze,silver,gold})
src/assets/soulmon/evolution/              4  (node-current, node-forecast, node-locked, …)
src/assets/soulmon/buttons/               13
src/assets/soulmon/progress/               4
src/assets/soulmon/ui/                     3
src/assets/soulmon/windows/                1
src/assets/soulmon/bg/                     6
src/assets/soulmon/lines/                 53  (sprites de linhas evolutivas)
src/assets/soulmon/*.png (raiz)           ~11 (rookie, ultra, mega/ultimate/champion ×3 galhos,
                                               nest-base, mascot-raven, dungeon-spirit)
─────────────────────────────────────────────
Total de PNG em src/assets/soulmon/       158
```

**Onde cada ícone de `soulmon/icons/` é usado** (arquivo → ícones importados):

| Arquivo | Ícones PNG |
|---|---|
| `BottomNav.tsx` | home, activities, evolution, book, coin, menu, gem, gear, reset |
| `SettingsPage.tsx` | book, sleep, wake, bell, bell-off, globe, cloud-rain, spellbook, star |
| `ShopModal.tsx` | close, map, home, lock, potion, game-dungeon, shield, gem |
| `DailyReportModal.tsx` | close, activities, heart-item, wake, star, cloud-rain, heart-handshake, confetti-burst |
| `ActivitiesPage.tsx` | game-activities, game-dungeon, game-dino, game-rps, game-tournament, chevron-right |
| `CompanionHUD.tsx` | items, bath, sleep, wake |
| `ItemsWindow.tsx` | close, heart-item, chip-power, chip-harmony, chip-benevolence |
| `CreditsModal.tsx` | gem, heart-item, reset, close |
| `RPSGame.tsx` | game-rps, game-tournament, skull, close |
| `AccountSection.tsx` | shield, reset, exit, gem |
| `CreateModal.tsx` / `TaskEditModal.tsx` | close, trash, clock, bell |
| `EditModal.tsx` | trash, bell, close |
| `LibraryPage.tsx` | search, profile, heart-handshake |
| `PlayerDetailModal.tsx` | activities, clock, game-tournament, close |
| `TournamentPage.tsx` | game-dungeon, game-tournament, clock |
| `ChatBox.tsx` | send, mic |
| `pixel/HomeHud.tsx` | flame, gem |
| `StatsPage.tsx` | bolt, star |
| `App.tsx` | target, heart-handshake |
| `EvolutionPath.tsx` | lock |
| `SettingsModal.tsx` | gear-gold, close |
| `DungeonGame` / `DinoGame` / `ArenaGame` | game-*, close |
| `AISettingsModal`, `ConfirmDialog`, `FirstTaskCompletedPopup`, `GuideModal`, `HelpModal`, `MorningDream`, `NightmareBattle`, `ProtectProgressModal`, `TriagePile`, `UnlockAccountModal` | close (+ bell/home no Welcome) |
| `types/attributes.ts` | attr-poder, attr-harmonia, attr-benevolencia |
| `types/category-icons.ts` | as 8 de `categories/` |

**6 PNGs no repo sem nenhuma referência** (peso morto):
`icon-edit.png` · `icon-heart-crack.png` · `icon-plant.png` · `icon-shard.png` ·
`icon-torch.png` · `icon-warning.png`.

Além disso, `src/utils/iconRegistry.ts` documenta um kit de **142 PNGs prontos
fora do repositório** em `E:\Soulmon-assets\out` (nav bar, chips, checkbox/radio,
toggle, barras, janela de diálogo, slot de inventário, logo, cenário tileável,
6 frames de FX de evolução) — não ligados a nenhum componente.

### 1.2 `lucide-react`

| Escopo | Arquivos | Símbolos importados |
|---|---|---|
| Código do app (fora de `components/ui/`) | **18** arquivos com import efetivo | **46** símbolos |
| `src/components/ui/` (shadcn, quase todo não usado pelo app) | 18 arquivos | — |
| **Total de arquivos que mencionam `lucide-react`** | **39** | — |

Lista com contagem por arquivo (medida com parser de `import { … } from 'lucide-react'`):

| Arquivo | Nº | Símbolos |
|---|---|---|
| `utils/shop.ts` | 15 | Heart, Sofa, Lamp, Armchair, BookOpen, Flower2, PawPrint, Trophy, Flag, Medal, Award, Image, Flame, Tent, Mountain |
| `GameTutorialFlow.tsx` | 5 | Heart, Sparkles, LoaderCircle, Check, Wand2 |
| `SettingsModal.tsx` | 4 | Sparkles, Zap, Volume2, VolumeX |
| `LibraryPage.tsx` | 4 | UserPlus, UserMinus, Gift, Loader2 |
| `CreditsModal.tsx` | 3 | Play, ShoppingCart, Loader |
| `SoulmonOnboarding.tsx` | 3 | ArrowLeft, ArrowRight, LoaderCircle |
| `UnlockAccountModal.tsx` | 3 | Sparkles, Infinity, LoaderCircle |
| `App.tsx` | 1 | Edit2 |
| `AISettingsModal.tsx` | 1 | Sparkles |
| `ChatBox.tsx` | 1 | Square |
| `CreateModal.tsx` | 1 | Plus |
| `EditModal.tsx` | 1 | Plus |
| `TaskEditModal.tsx` | 1 | Plus |
| `DinoGame.tsx` | 1 | ArrowUp |
| `InstallPrompt.tsx` | 1 | Download |
| `ProtectProgressModal.tsx` | 1 | CloudUpload |
| `TournamentPage.tsx` | 1 | Loader2 |
| `BottomNav.tsx`, ⚰️ `RowIcon.tsx` (apagado em `ad11e64b`, 24/08/2026), ⚰️ `utils/iconRegistry.ts` (não existe), `vite-env.d.ts` | 0 | só menção em comentário/tipo |

> **Observação de coerência:** `utils/shop.ts` é o maior consumidor de lucide
> (15 ícones), mas na loja renderizada os móveis aparecem como **PNG**
> (`furn-sofa.png`, `furn-tent.png`, …, verificado no app). Os lucide são
> fallback/legado. Os `Loader*` são os spinners de carregamento — o app tem
> **4 spinners lucide diferentes** (`Loader`, `Loader2`, `LoaderCircle` ×3).

### 1.3 Emojis usando função de ícone

**Método:** varredura de `src/**/*.{ts,tsx}` (exclui `*.test.*`) com a regex
Unicode `\p{Extended_Pictographic}`, descartando linhas que começam com `//`,
`/*`, `*` (comentários). É uma **aproximação por cima**: inclui emojis de texto
de UI (mensagens, toasts) além dos que são literalmente ícone.

```
468 ocorrências · 184 emojis distintos · 51 arquivos
(sem o filtro de comentário: 531 / 193 / 67)
```

Concentração (top 10):

| Arquivo | Ocorrências |
|---|---|
| `OraclePage.tsx` | 55 |
| `supabase/functions/server/chat.tsx` | 40 |
| `utils/shop.ts` | 39 |
| `HelpModal.tsx` | 35 |
| `App.tsx` | 31 |
| `utils/restWindow.ts` | 30 (o `DREAM_CATALOG`) |
| `utils/oracle.ts` | 25 |
| `GuideModal.tsx` | 24 |
| `ItemsWindow.tsx` | 22 |
| `constants/labels.ts` | 16 |

**Emojis confirmados como ícone renderizado no app** (medidos no DOM):
os **30 slots do DreamDex** (☁️🌼🌧️🛏️🔥🌤️🛋️📚🌱🧶☂️☄️ / ⛵🏮❄️🌳🐚🚃🪁🪵🫧🔭 /
🌙✨🌌🐋🍃🪔🌊🔮), o 💎 das linhas de troca de Créditos na loja, o 🏥 da tarefa
sugerida no tutorial, o 🌱 do tier de hábito na Home, o 🍴 do traço de nascimento
em Estatísticas.

### 1.4 Sistema de classes

| Família | Arquivos | Ocorrências |
|---|---|---|
| `sm-px-*` (kit 9-slice) | **51** arquivos (48 de produção + 3 de teste/contrato) | **~470** usos, **113 classes distintas** |
| `sm-card` | **26** arquivos | — |
| `sm-btn` | **25** arquivos | — |

As 10 classes `sm-px-*` mais usadas: `field` (40) · `card` (29) ·
`arcade-value` (25) · `copper` (24) · `cyan` (21) · `cyan-ink` (15) ·
`arcade-label` (14) · `copper-ink` (13) · `choice` (10) · `arcade-bar` (9).

> **Leitura do número:** existem **duas linguagens visuais concorrentes** no
> app — o kit pixel (`sm-px-*`, 51 arquivos) e o sistema antigo
> (`sm-card`/`sm-btn`, 26/25 arquivos), com sobreposição grande (`CreateModal`,
> `EditModal`, `TaskEditModal`, `SoulmonOnboarding`, `GameTutorialFlow`,
> `TriagePile`, `MorningCheckIn`, `CreditsModal`, `SettingsModal`,
> `OraclePage`, `EvolutionPath`, `StatsPage` usam as duas ao mesmo tempo).
> Some-se `src/components/ui/` (44 componentes shadcn, Tailwind/Radix), que é
> uma **terceira** linguagem herdada — praticamente morta, mas presente.

---

## 2. O PixelKit — componente por componente

Arquivo: `src/components/pixel/PixelKit.tsx` (556 linhas). São **11 componentes
exportados** + 3 painéis de composição em arquivos irmãos.

| # | Componente | Props que mudam o desenho | Estados desenhados | Onde aparece |
|---|---|---|---|---|
| 1 | `PixelButton` | `size` (sm/md/lg), `variant`, `disabled` | normal / hover / active / disabled | onboarding, modais, jogos |
| 2 | `PixelPanel` | `title`, `titleIcon`, `padded` | com/sem título, com/sem ícone | Home (RitualPanel), Stats, Shop |
| 3 | `PixelSegmentedBar` | segmentos ligados/desligados | 0…N ligados | HUD (energia, HP) |
| 4 | `PixelCheckbox` | `checked` | marcado / desmarcado | check-in, tutorial |
| 5 | `PixelTabs<K>` | itens, `value` | aba ativa / inativa | Loja (5 abas), Evolução (3 abas) |
| 6 | `PixelChoiceChip` | `selected` | ligado / desligado | onboarding, categorias, dias da semana |
| 7 | `PixelTag` | `filled` | vazio / preenchido | tags de tarefa, forecast da árvore |
| 8 | `PixelSwitch` | `checked`, `disabled` | 4 combinações | Configurações |
| 9 | `PixelMeter` | `ratio`, `tone` (cyan/…), `label` | 0% → 100% | constância, progresso |
| 10 | `PixelSlot` | `src`, `background`, `locked`, `overlay` | normal / travado / com overlay | Loja, Itens, DreamDex |
| 11 | `PixelChip` | `label`, `value`, `icon`, `onClick` | estático / clicável | HUD de moeda, contadores |
| — | `HomeHud` (156 l.) | — | marca + Créditos + HP + Energia | Home |
| — | `RitualPanel` (237 l.) | `done`/`total`, `emptyMessage`, `ctaLabel` | vazio / parcial / completo | Home |
| — | `PixelFrame` (136 l.) | — | 4 cantos SVG desenhados por script | global (moldura da tela) |

Fora do kit, mas recorrentes e definidores da linguagem:

| Componente | Arquivo | Papel |
|---|---|---|
| `RitualRow` | dentro de `RitualPanel.tsx` | **a linha de ritual/tarefa** — o átomo mais repetido do app |
| `StepRow` | `StepRow.tsx` | sub-etapa de hábito |
| `TaskMeta` | `TaskMeta.tsx` | metadados da tarefa (prazo, adiamentos, esforço, assombrada) |
| `HabitConstancy` | `HabitConstancy.tsx` | "N das últimas 7" + marco de hábito |
| ⚰️ `RowIcon` | `RowIcon.tsx` — **apagado em `ad11e64b` (24/08/2026)**, junto com o lucide | aceitava string (PNG) OU componente lucide — a costura entre os dois sistemas; hoje os ícones são `PixelKit`/Material Symbols |
| `AlignmentIcons` | `AlignmentIcons.tsx` | 3 ícones **SVG inline** (Power/Harmony/Benevolence), usados só em `EvolutionPath` |
| `PetStageDecor` | `PetStageDecor.tsx` | decoração do palco |
| `EvoTrail` | `EvoTrail.tsx` | trilha vertical de nós na Home |

---

## 3. A fila de intersticiais (regra crítica de UI)

`src/App.tsx:646` define **uma** prioridade explícita — só UM monta por vez:

```
triagem → relatório diário → check-in → sonho → pesadelo → welcome prompt
```

Todos são `position: fixed` no mesmo z-index (200; pesadelo em 210) e vários
montam focus-trap próprio. **Qualquer tela nova que se abra sozinha entra
nessa fila, nunca com guard ad-hoc.** Isso é restrição de redesenho, não
detalhe de implementação.

**Verificado no app:** logo depois do onboarding + tutorial, o `MorningCheckIn`
abriu sozinho, sem colisão com o welcome prompt.

---

## 4. Onboarding — a contagem correta

Percorrido no navegador (caminho grátis/demo, ponta a ponta). Passos numerados
lidos de `SoulmonOnboarding.tsx:106-121`.

| # | Passo | id interno | Caminho | Verificado |
|---|---|---|---|---|
| 1 | Intro / bifurcação grátis × pago | `step 0` | ambos | ✅ |
| 2 | "O que você quer melhorar?" | `GOAL_STEP = -2` | ambos | ✅ |
| 3 | "O que mais atrapalha?" | `STRUGGLE_STEP = -3` | ambos | ✅ |
| 4 | Escolher personagem pronto (3 cards) | `DEMO_PICK = -1` | **só demo** | ✅ |
| 5 | Nome completo | `step 1` | só oráculo | ❌ (caminho pago) |
| 6 | Data de nascimento | `step 2` | só oráculo | ❌ |
| 7 | Hora de nascimento (+ "não sei") | `step 3` | só oráculo | ❌ |
| 8 | Cidade de nascimento (`CityPicker`) | `step 4` | só oráculo | ❌ |
| 9 | Criatura favorita (opcional) | `FAVORITE_STEP = 5` | só oráculo | ❌ |
| 10–15 | **6 perguntas do ritual** (`ORACLE_QUESTIONS`, medido = 6) | `6…11` | só oráculo | ❌ |
| 16 | Bifurcação "refinar?" (`REFINE_OFFER`) | `12` | só oráculo | ❌ |
| 17–36 | **20 itens psicométricos** (`SOUL_TEST_ITEMS`, medido = 20, `SoulTestItem`) | `13…32` | só quem aceita | ❌ |
| 37 | Tela "gerando" | `GENERATING` | só oráculo | ❌ |
| 38 | Tela de erro de geração (`generateError` → volta ao `REFINE_OFFER`) | — | raro | ❌ |
| 39 | **Reveal** da criatura | `REVEAL` | só oráculo | ❌ |
| 40 | Cadastro (apelido + e-mail) | `REGISTER` | ambos | ✅ |
| 41 | Tutorial — página de conceito ("Seu Soulmon nasceu!") | `PAGES[0]` | ambos | ✅ |
| 42 | Tutorial — escolher 1ª tarefa (categorias + sugestão IA) | `TASK_STEP` | ambos | ✅ |

**Superfícies distintas de onboarding: 42** (contando as 6 perguntas e os 20
itens como telas individuais, porque cada uma ocupa a tela inteira). Se contar
por *template*, são **16 templates distintos**.

### Estados observados no tutorial (TASK_STEP)

| Estado | Como cheguei | O que apareceu |
|---|---|---|
| Vazio | entrada | 8 chips de categoria (PNG `icon-cat-*`), botão "SUGGEST TASKS WITH AI", CTA travado "SELECT AT LEAST 1 TASK" |
| Sem categoria selecionada | cliquei "SUGGEST TASKS WITH AI" | **nada aconteceu** — nenhuma sugestão, nenhum aviso, nenhum spinner visível no DOM |
| Fallback offline/IA indisponível | selecionei "Health" e cliquei | veio **1 única** sugestão (`🏥 Drink a glass of water`) — o `fallbackTasks` local |

> **Problema com evidência:** o botão de IA fica habilitado sem categoria e sem
> texto de objetivo, e o clique não produz retorno nenhum. O caminho de erro/
> offline entrega **uma** tarefa com **emoji** de ícone, quebrando o padrão
> PNG das categorias que estão logo acima na mesma tela.

---

## 5. Views do BottomNav e tudo que elas alcançam

O `BottomNav` expõe **6 botões** (não 10): `main`, `games`, `evolution`,
`library`, `shop` + menu sanduíche. `stats` e `pet` são **abas internas** de
Evolução; `tournament` é alcançada pelo card em Atividades; `settings` pelo
menu sanduíche; **`oracle` não é alcançável** (ver 5.13).

### 5.1 `main` — Home

**Arquivo:** `src/App.tsx:2877-3355` + `pixel/HomeHud.tsx`, `CompanionHUD.tsx`,
`pixel/RitualPanel.tsx`. **Frequência: todo dia, várias vezes.**

| Elemento | Origem do ícone | Condição |
|---|---|---|
| Fundo (grade de circuito `sm-circuit-bg` ou cenário equipado) | CSS / `PET_BACKGROUNDS` (20 cenários) | sempre |
| `HomeHud`: marca "SOUL MON", Créditos, HEALTH x/x, ENERGY x/x | PNG `icon-flame`, `icon-gem` + `figma:asset/7e77e9ec….png` (coração) | sempre |
| **Banner de HP** | PNG `icon-heart-handshake` + `✕` em texto | `healthPoints ≤ 1 && > 0 && dailyDone < hpSafeToday && !dismissed` — **raro, mas no pior dia** |
| `CompanionHUD` (pet, palco, ninho, decoração, gesto de esfregar) | PNG `nest-base.png`, sprite da linha (`kaelen-rookie.png`) | sempre |
| Action bar de cuidado: ITEMS / BATH / SLEEP-WAKE | PNG `icon-items`, `icon-bath`, `icon-sleep`, `icon-wake` | sempre |
| `CareSystem` (cocô) | FX `anim-poop-plop` do `animArt` (quadro 3/3 a 2×; o PNG `figma:asset/9087…` saiu em 16/09/2026) | agendado 07–15h e +8–10h; nunca dormindo |
| `ChatBox` (dock de chat) | PNG `icon-send`, `icon-mic` + lucide `Square` (parar gravação) | sempre |
| `PlayCard` | — | **só depois da 1ª conclusão da vida** (`jaConcluiuAlgo`) |
| `EvoTrail` | PNG `node-current`, `node-forecast`, `node-locked` | `soulmonStages.length > 0` |
| **Cartão de fresh start** | sem ícone | `freshStartOffer(...)` — **toda segunda ou dia 1** |
| **`WeeklyReportCard`** | — | `needsWeeklyReport(...)` — **todo domingo** |
| **Botão "Arrumar a pilha (N)"** | sem ícone | `triageQueue(...).length > 0` |
| `RitualPanel` "DAILY RITUALS x/y" | PNG `icon-target` (titleIcon) | sempre |
| `RitualRow` de tarefa + `TaskMeta` | emoji da tarefa | por tarefa ativa |
| `RitualRow` de hábito + `StepRow` + `HabitConstancy` | emoji + `🌱/🌿/🌳` do tier | por hábito |
| Gaveta de guardadas (`someday`/`dropped`) | — | `guardadas.length > 0` |
| CTA "+ NOVA ATIVIDADE" | — | sempre |
| Empty state do painel | texto | `total === 0` |

**Estados da Home verificados:** primeiro uso (1 hábito, HP 3/3, ENERGY 0/4,
sem PlayCard, sem trilha lateral) ✅. Cheio, vazio total, carregando, erro,
offline: **não verificados**.

**Problema com evidência (primeiro uso):** a Home do dia 1 mostra
`ENERGY 0/4` e `DAILY RITUALS 0/1` — a barra de energia promete 4 segmentos
num dia cuja meta é 1. O número está certo pela regra (barras = requisito do
estágio), mas o desenho não distingue "cheio" de "meta cumprida".

### 5.2 `evolution` — Evolução

**Arquivo:** `EvolutionPath.tsx` (+ ⚰️ `DigivolutionProgress.tsx` — apagado em `977634f1`, 07/09/2026;
⚰️ `WalkingPetStrip.tsx` — apagado em `55793cb6`, 07/09/2026; `evolution/SoulNode.tsx`). **Frequência: semanal.**

Verificado. Elementos: 3 abas internas (EVOLUTION / SOULMON / STATS),
`UnlockNudge` (só demo: "Want YOUR own evolution tree?"), CURRENT ALIGNMENT com
3 atributos (PNG `icon-attr-poder/harmonia/benevolencia`), frase de galho
previsto, barra "Evolution 0/10 days", EVOLUTION BRANCHES com **3 ícones SVG
inline** (`AlignmentIcons`), e a árvore de nós (PNG `node-current`,
`node-forecast`, `node-locked` ×3, `icon-lock`).

**Problema com evidência:** os 3 atributos aparecem como **PNG** no bloco
"CURRENT ALIGNMENT" e como **SVG inline** logo abaixo em "EVOLUTION BRANCHES",
na mesma tela — duas artes para o mesmo conceito.

Alcança: cerimônia de evolução (toque no nó atual → `evolutionLocked` toggle;
`onEvolveRequest` → `EvolutionCeremony`).

### 5.3 `pet` — aba SOULMON

**Arquivo:** `PetPage.tsx` + `DreamDex.tsx`. **Frequência: rara/semanal.**

Verificado. Nome da criatura, sprite, badge AWAKENED/CURRENT, descrição, e o
**DreamDex**: "DREAM COLLECTION 0 of 30" em 3 faixas (COMMON 0/12, RARE 0/10,
LEGENDARY 0/8), **30 slots com emoji + `???`**.

**Problema com evidência:** **os 30 slots do dex são emoji puro** — a única
coleção do jogo é desenhada com arte de sistema operacional, ao lado de sprites
próprios na mesma tela. É a maior concentração de emoji-como-ícone do app.

> **Divergência de documentação:** `CLAUDE.md` afirma "18 no `DREAM_CATALOG`";
> o app mostra **30** e `utils/restWindow.ts` tem **30** entradas com `rarity:`.
> Contado, não estimado.

### 5.4 `stats` — Estatísticas

**Arquivo:** `StatsPage.tsx`. **Frequência: rara.**

Verificado no estado vazio: traço de nascimento (**emoji 🍴** "Foodie"), bloco
"THIS SOULMON'S JOURNEY" com 5 contadores (perfect days, enemies beaten, runs
cleared, dino best, rare items), linha Bits/XP/Perfect days (PNG `icon-bolt`,
`icon-star`), 3 atributos (PNG), e **3 listas vazias**: "No activities completed
yet." / "No tasks completed yet." / "No history yet."

**Problema com evidência:** três empty states seguidos, em texto corrido, sem
ilustração nem CTA — é a tela mais desanimadora do primeiro uso.

### 5.5 `games` — Atividades

**Arquivo:** `ActivitiesPage.tsx`. **Frequência: semanal.**

Verificado. Chip "BITS 0", card **Tournament** (PNG `icon-game-tournament` +
`icon-chevron-right`), seção MINIGAMES com 3 cards: Dungeon, Dino Runner,
Rock-Paper-Scissors (PNG `icon-game-*`).

### 5.6 Masmorra

**Arquivo:** `DungeonGame.tsx` + `utils/dungeonScenes.ts`.
**Frequência: semanal (sem limite diário).**

Verificado:
- **Lobby**: "FLOOR 1/5 · TOY TOWN", BEST 0, BASE LEVEL 1, texto de regras, CTA
  "ENTER THE DUNGEON", `icon-close`.
- **Batalha**: "FLOOR 1/5 · TOY TOWN · 1/6", sprite do inimigo
  (`lumel-rookie.png`), sprite do jogador (`kaelen-rookie.png`), "YOUR TURN —
  AIM FOR THE CENTER!", botão "ATTACK!".

**Cenários (lidos do código):** 5 clássicos (`DUNGEON_SCENES`: Tamagotchi, Fita
VHS, Sol Neon, Terminal CRT, Vazio Glitch) + 5 cenas de arte
(`dungeonBg1…5`: Gruta Azul, Caverna Verde, Salão Dourado, Abismo Violeta,
Fenda Rósea) + os cenários da loja sorteados por run. Overlay `dungeon-vhs`.

**Não verificados:** fim de andar, run completa (Glitchtama), derrota, drop de
coraçãozinho, ranking.

### 5.7 Dino Runner — `DinoGame.tsx`
Ícone lucide `ArrowUp` + PNG `icon-game-dino`, `icon-close`. **Não percorrido**
(exige interação de canvas/teclado). Frequência: semanal.

### 5.8 Pedra-Papel-Tesoura — `RPSGame.tsx`
PNG `icon-game-rps`, `icon-game-tournament`, `icon-skull`, `icon-close`.
**Não percorrido.** Frequência: semanal.

### 5.9 `tournament` — Torneio

**Arquivo:** `TournamentPage.tsx` + `PlayerDetailModal.tsx`.
**Frequência: semanal (janela sexta–domingo, mas sempre acessível).**

Verificado no estado **PvP desligado**: "EMBLEMS 0", switch "Join PvP",
"Next round in 2 days. You can still battle today." (PNG `icon-clock`), abas
ARENA / RANK e o empty state "Enable PvP above to challenge opponents."

**Não verificados:** PvP ligado, lista de oponentes, batalha, faixas
(Semente→Lendário), ranking global, `PlayerDetailModal`.

### 5.10 `library` — Biblioteca

**Arquivo:** `LibraryPage.tsx`. **Frequência: rara.**

Verificado. Abas ALL / FRIENDS 0/5, campo de busca (PNG `icon-search`), 3 cards
de NPC (Pyraka / Orrin / Thalindra) com sprite, "RANK 340 · 47D PLAYING", PNG
`icon-profile`, `icon-heart-handshake`. Lucide: `UserPlus`, `UserMinus`, `Gift`,
`Loader2`.

**Problema com evidência:** a lista só tem **NPCs**; nenhum estado indica que
são NPCs além do rótulo pequeno "NPC". Não existe empty state real de "nenhum
jogador ainda".

### 5.11 `shop` — Loja

**Arquivo:** `ShopModal.tsx` (renderizada como *view*, não como modal, apesar do
nome). **Frequência: semanal.**

**5 abas** (`PixelTabs`), todas verificadas em parte:

| Aba | Conteúdo verificado | Ícones |
|---|---|---|
| ITEMS | 3 chips de atributo (120 Bits), Coraçãozinho (150), bloco "Swap Credits for Bits" com 3 degraus | PNG `icon-attr-*`, `icon-gem` + **emoji 💎** |
| BACKDROPS | não aberto | PNG `icon-map` |
| FURNITURE | 10 móveis com PNG próprio (`furn-sofa`, `furn-chair`, `furn-books`, `furn-lamp`, `furn-rug`, `furn-plant`, `furn-picture`, `furn-campfire`, `furn-tent`, `furn-rock`) | PNG |
| TOURNAMENT | não aberto (6 itens em Emblemas) | PNG `icon-shield` |
| MISSIONS | 6 missões com progresso (PENDING / 0/100 / 0/3 / 0/1000 / 0/30) | PNG `icon-game-*`, `icon-star` |

**Problema com evidência:** na aba ITEMS os degraus de troca aparecem como
`10 💎 → 100 Bits`, com **emoji 💎**, enquanto a mesma tela usa `icon-gem.png`
para Créditos no topo. `CLAUDE.md` estabelece que as três moedas nunca podem
compartilhar ícone; aqui Créditos tem **duas** representações na mesma tela.

**Estados não verificados:** item já comprado, item travado com 🔒 + dica
(`hintFor`), flash de compra bem/malsucedida (`flash`), troca em andamento
(`exchanging`).

### 5.12 `settings` — Configurações

**Arquivo:** `SettingsPage.tsx` (+ `AccountSection.tsx`, `InstallPrompt.tsx`,
`RestWindowCard.tsx`, `StepsCard.tsx`). **Frequência: rara.**

Verificado — **11 blocos numa página só**: CLOUD BACKUP (código de recuperação,
COPY, RESTORE) · ACCOUNT & PURCHASES (tipo de conta, Créditos, restaurar
compras) · ARTIFICIAL INTELLIGENCE (CONFIGURE AI) · GUIDE (OPEN GUIDE / OPEN
GLOSSARY) · NOTIFICATIONS · AUTO SLEEP · APPEARANCE (LIGHT/DARK/SYSTEM) ·
LANGUAGE (ENGLISH/PORTUGUÊS) · ABOUT (v1.0.2, Privacy Policy) · **REST WINDOW**
(STARTS/ENDS, "No nights logged yet.", COMMON DREAM, "Dreams collected: 0 of
30", switch "Don't show me sleep metrics") · **StepsCard** (não apareceu —
`stepsAvailable === true` é falso na web).

Ícones: PNG `icon-cloud-rain`, `icon-shield`, `icon-gem`, `icon-reset`,
`icon-spellbook`, `icon-bell-off`, `icon-sleep`, `icon-globe`, `icon-star`.

**Problemas com evidência:**
- **`icon-cloud-rain.png` (nuvem de CHUVA) rotula "CLOUD BACKUP"** — o mesmo
  ícone também aparece no `DailyReportModal`. Colisão semântica dupla.
- A página é uma pilha vertical de 11 blocos heterogêneos, sem agrupamento nem
  navegação interna.
- **`InstallPrompt`** vive dentro desta página, mas só monta com
  `beforeinstallprompt` e `!standalone` — **não verificado**.

### 5.13 `oracle` — INALCANÇÁVEL

**Arquivo:** `OraclePage.tsx` (o maior consumidor de emoji do app: 55).

**Medido:** em todo o `src/`, os únicos `setCurrentView(...)` com literal são
`'evolution'`, `'main'` e `'tournament'`; o `BottomNav` só oferece `main`,
`games`, `evolution`, `library`, `shop`, `settings`. **Nada leva a
`currentView === 'oracle'`** (`App.tsx:3578`). A página só é montada pelo painel
de debug interno do onboarding (`oracleDebugOpen`, `SoulmonOnboarding.tsx:80`).

Decisão necessária antes de redesenhar: **é tela viva ou código morto?**

---

## 6. Modais e diálogos

### 6.1 Abrem sozinhos (fila de intersticiais)

| # | Superfície | Arquivo | Condição exata (do código) | Frequência | Verificado |
|---|---|---|---|---|---|
| 1 | `TriagePile` | `TriagePile.tsx` | `triageTasks !== null` (aberto por toque no botão "Arrumar a pilha") | rara | ❌ |
| 2 | `DailyReportModal` (+ check-in de humor, 5 carinhas) | `DailyReportModal.tsx` | `showDailyReport && gameState.lastDayReport` — 1×/dia (`DAILY_REPORT_SHOWN`) | **todo dia** | ❌ |
| 3 | `MorningCheckIn` | `MorningCheckIn.tsx` | `checkInPlanData !== null` (`needsCheckIn`, 1×/dia civil) | **todo dia** | ✅ |
| 4 | `MorningDream` | `MorningDream.tsx` | `morningDream !== null` — manhã depois de noite na janela | quase todo dia | ❌ |
| 5 | `NightmareBattle` | `NightmareBattle.tsx` | `!isSleeping && 4h ≤ hora < 12h && rest && hasPendingNightmare(...)` | rara | ❌ |
| 6 | `WelcomePromptModal` | `WelcomePromptModal.tsx` | último da fila; ele mesmo devolve `null` quando não tem o que dizer | rara | ❌ |
| 7 | `EvolutionCeremony` | `EvolutionCeremony.tsx` | `evolutionCeremony !== null` | **uma vez por evolução** | ❌ |
| 8 | `EvolveTaskModal` | `EvolveTaskModal.tsx` | `evolveModalStage !== null` — dispara em level-up detectado (`App.tsx:688`) | uma vez por evolução | ❌ |
| 9 | `FirstTaskCompletedPopup` | `FirstTaskCompletedPopup.tsx` | `showFirstTaskPopup` — 1× na vida | **uma vez na vida** | ❌ |
| 10 | `ProtectProgressModal` | `ProtectProgressModal.tsx` | `protectPrompt ∈ {'evolution','streak'}` (`App.tsx:537`) | uma vez | ❌ |
| 11 | `UnlockNudge` | dentro de `UnlockAccountModal.tsx` | `currentView==='evolution' && demoCharacterId` | toda visita (demo) | ✅ |

**Verificado no app:** o `MorningCheckIn` abriu imediatamente após o tutorial,
com "GOOD MORNING! / Twenty seconds and we're off.", TODAY'S HABITS (1 item,
emoji 🏥), "TODAY'S FOCUS (UP TO 3)" com empty state "No tasks waiting. Today is
habits only.", linha "Planned load: 1 points · chosen focus: 0" e dois botões
(START THE DAY / NOT TODAY, THANKS).

**Problema com evidência:** "Planned load: **1 points**" — concordância
quebrada no singular, na primeira tela que o usuário novo vê depois de nascer o
pet.

### 6.2 Abrem por ação do usuário

| # | Superfície | Arquivo | Aberto de onde | Frequência | Verificado |
|---|---|---|---|---|---|
| 12 | `ItemsWindow` (pastinha) | `ItemsWindow.tsx` | botão ITEMS da action bar | semanal | ❌ |
| 13 | `CreateModal` | `CreateModal.tsx` | "+ NOVA ATIVIDADE" | semanal | ❌ |
| 14 | `EditModal` (hábito) | `EditModal.tsx` | toque no hábito | semanal | ❌ |
| 15 | `TaskEditModal` | `TaskEditModal.tsx` | toque na tarefa | semanal | ❌ |
| 16 | `ConfirmDialog` | `ConfirmDialog.tsx` | exclusão, reset do ritual | rara | ❌ |
| 17 | `SettingsModal` (IA) | `SettingsModal.tsx` | "CONFIGURE AI" | rara | ❌ |
| 18 | `AISettingsModal` | `AISettingsModal.tsx` | via `CompanionHUD` | rara | ❌ |
| 19 | `GuideModal` | `GuideModal.tsx` (via `ContentModals`) | "OPEN GUIDE" | uma vez | ❌ |
| 20 | `HelpModal` (glossário) | `HelpModal.tsx` | "OPEN GLOSSARY" | uma vez | ❌ |
| 21 | `CreditsModal` | `CreditsModal.tsx` | HomeHud e menu sanduíche | rara | ❌ |
| 22 | `UnlockAccountModal` | `UnlockAccountModal.tsx` | `unlockReason !== null` (limite de tarefa, evolução) | uma vez | ❌ |
| 23 | `PlayerDetailModal` | `PlayerDetailModal.tsx` | card na Biblioteca | rara | ❌ |
| 24 | `CityPicker` | `CityPicker.tsx` | onboarding pago e OraclePage | uma vez | ❌ |
| 25 | Popover do menu sanduíche | `BottomNav.tsx` | botão MENU | todo dia | ✅ |
| 26 | Toaster (sonner) | `ui/sonner.tsx` | avisos do app | todo dia | ❌ |

**Verificado:** o popover do menu tem 3 itens — Créditos (PNG `icon-gem`),
Configurações (PNG `icon-gear`), "Refazer o ritual" (PNG `icon-reset`).

**Problema com evidência:** "Refazer o ritual" é rotulado no código como
**DEBUG ONLY** (`handleResetOnboarding`), mas está visível no menu de produção
ao lado de Configurações, e o `handleConfirmResetOnboarding` apaga
`ONBOARDING_COMPLETE`, `USER_NAME`, `EGG_TYPE` e recarrega a página.

### 6.3 Código morto identificado

| Superfície | Evidência |
|---|---|
| `ArenaGame.tsx` | `grep -rn "ArenaGame" src --include=*.tsx` fora do próprio arquivo: **zero** resultados |
| `currentView === 'oracle'` | nenhum navegador leva até lá (§5.13) |
| `src/components/ui/` (44 componentes shadcn) | só 18 importam lucide; o app quase não os usa — terceira linguagem visual herdada |
| 6 PNGs de ícone | sem nenhuma referência (§1.1) |

---

## 7. Estados por superfície — o que falta desenhar

| Estado | Cobertura observada |
|---|---|
| **Vazio** | Existe em: Stats (3× texto puro), Torneio ("Enable PvP above…"), RitualPanel (`emptyMessage`), DreamDex (`???` ×30), Biblioteca (só NPCs). **Nenhum tem ilustração ou CTA.** |
| **Primeiro uso** | Home dia 1 verificada. Não há distinção visual entre "primeiro uso" e "vazio" em nenhuma outra tela. |
| **Cheio** | Não verificado em nenhuma tela — precisa de save semeado. |
| **Carregando** | Existe como spinner lucide em 4 sabores diferentes (`Loader`, `Loader2`, `LoaderCircle`×3) + `Suspense fallback={null}` em **13 pontos** de `App.tsx` — ou seja, na maioria das navegações a tela fica **em branco** enquanto o chunk carrega. |
| **Erro** | Verificado 1: fallback de sugestão de tarefa no tutorial (1 item, emoji). `generateError` do onboarding lido no código. `ErrorBoundary` global existe (`main.tsx`). Nenhum outro estado de erro localizado. |
| **Offline** | Não há estado de offline desenhado em lugar nenhum. O `sw.js` (CACHE_VERSION v24) serve cache, mas nenhuma superfície comunica "sem conexão". |

---

## 8. Contagem total de superfícies

| Grupo | Superfícies |
|---|---|
| Onboarding + tutorial (telas individuais) | 42 |
| Chrome global (splash, PixelFrame, BottomNav, popover, HomeHud, ChatBox, Toaster, ErrorBoundary, NotificationManager) | 9 |
| Home (cartões e blocos contextuais) | 14 |
| Views e sub-abas (evolution, pet/DreamDex, stats, games, tournament, library, shop×5 abas, settings, oracle) | 15 |
| Minijogos e cenas (Masmorra lobby/batalha/fim, Dino, PPT, Arena morta, Pesadelo) | 8 |
| Modais e diálogos | 26 |
| **TOTAL** | **114 superfícies** |
| (contando onboarding por *template* em vez de por passo) | **88 superfícies** |

Mais: **11 componentes do PixelKit** + **8 componentes recorrentes** fora dele +
**44 componentes shadcn** herdados.

---

## 9. Checklist priorizado de redesenho

Prioridade = frequência × gravidade. `P0` = todo dia + quebra a linguagem;
`P1` = frequente ou muito visível; `P2` = raro mas presente; `P3` = higiene.

### P0 — todo dia, e define a linguagem do app

- [ ] **`RitualRow`** (linha de ritual/tarefa) — o átomo mais repetido do app; hoje o ícone é **emoji do usuário**
- [ ] **`HomeHud`** — barra de HP/Energia/Créditos; hoje mistura PNG (`icon-flame`, `icon-gem`) com sprite `figma:asset/*` de coração
- [ ] **`CompanionHUD`** — pet, palco, ninho, gesto de esfregar; a tela que a pessoa mais olha
- [ ] **Action bar de cuidado** (ITEMS / BATH / SLEEP) — 4 PNGs a 42px
- [ ] **`BottomNav`** — 6 destinos, 6 PNGs, halo ciano de estado ativo
- [ ] **`RitualPanel`** — moldura + contador "DAILY RITUALS x/y" + empty state
- [ ] **`ChatBox`** / dock de chat — PNG `icon-send` + `icon-mic` + lucide `Square` (única mistura PNG×lucide num mesmo controle)
- [ ] **`DailyReportModal`** — 1×/dia; 7 ícones PNG + confete + 5 carinhas de humor
- [ ] **`MorningCheckIn`** — 1×/dia; corrigir "1 **points**"; desenhar o empty state de foco
- [ ] **Barras de energia/HP** (`PixelSegmentedBar`) — distinguir "cheio" de "meta do dia cumprida"
- [ ] **Estado de carregamento global** — hoje `Suspense fallback={null}` em 13 pontos deixa a tela em branco

### P1 — frequente ou de alto impacto emocional

- [ ] **`DreamDex` — 30 slots em emoji.** A única coleção do jogo, sem arte própria
- [ ] **`EvolutionCeremony`** — o momento de maior carga do jogo; uma vez por evolução
- [ ] **`EvolutionPath`** — unificar os 3 atributos (PNG × SVG inline na mesma tela)
- [ ] **`EvoTrail`** (trilha lateral da Home) — nós `node-current/forecast/locked`
- [ ] **`TaskMeta`** — prazo, adiamentos, esforço, estado "assombrada"
- [ ] **`HabitConstancy`** — "N das últimas 7" + marcos 🌱/🌿/🌳 (emoji)
- [ ] **`PlayCard`** — oferta de brincar
- [ ] **`ShopModal`** — 5 abas; **eliminar o 💎 emoji** dos degraus de troca (conflita com a regra das 3 moedas)
- [ ] **`ItemsWindow`** (pastinha) — 22 emojis no arquivo
- [ ] **`MorningDream`** — quase todo dia, e é a recompensa da janela de descanso
- [ ] **`CreateModal` / `EditModal` / `TaskEditModal`** — os 3 usam `sm-card`+`sm-px-*` misturados
- [ ] **Masmorra: batalha, fim de andar, fim de run, derrota** — 10 cenários + overlay VHS
- [ ] **Cartão de fresh start** (toda segunda) e **`WeeklyReportCard`** (todo domingo) — hoje sem ícone nenhum
- [ ] **Botão "Arrumar a pilha (N)"** + **`TriagePile`** (fila de 4 ações grandes)
- [ ] **Banner de HP** — aparece no pior dia da pessoa
- [ ] **Empty states de `StatsPage`** — 3 textos crus seguidos

### P2 — raro, mas visível

- [ ] **`SettingsPage`** — 11 blocos empilhados; trocar `icon-cloud-rain` (chuva) de CLOUD BACKUP
- [ ] **`RestWindowCard`** e **`StepsCard`** (StepsCard só verificável no APK)
- [ ] **`TournamentPage`** — estado PvP ligado, faixas, ranking, `PlayerDetailModal`
- [ ] **`LibraryPage`** — desenhar o "NPC" e o empty state real de amigos
- [ ] **`NightmareBattle`**, **`WelcomePromptModal`**, **`FirstTaskCompletedPopup`**
- [ ] **`GuideModal`** (24 emojis) e **`HelpModal`** (35 emojis) — as duas telas de texto do app
- [ ] **`CreditsModal`**, **`UnlockAccountModal`**, **`ProtectProgressModal`**, **`SettingsModal`/`AISettingsModal`**
- [ ] **`ConfirmDialog`** — o único diálogo de confirmação
- [ ] **`DinoGame`** e **`RPSGame`**
- [ ] **Popover do menu sanduíche** — decidir o destino de "Refazer o ritual" (marcado DEBUG no código, visível em produção)

### P3 — uma vez na vida / higiene

- [ ] **Onboarding: 16 templates** (intro, goal, struggle, demo-pick, nome, data, hora, cidade, favorita, pergunta do ritual, bifurcação de refino, item psicométrico, gerando, erro, reveal, cadastro)
- [ ] **Tutorial (2 telas)** — corrigir o botão de IA que não responde sem categoria e o fallback de 1 sugestão com emoji
- [ ] **`IntroScreen`/splash** — confirmar se o `div.sp-link` fica no DOM depois do boot
- [ ] **`InstallPrompt`** (PWA)
- [ ] **`PixelKit` inteiro** — 11 componentes × estados (o kit é a alavanca de maior rendimento)
- [ ] **Definir o destino de `OraclePage`** — hoje inalcançável
- [ ] **Remover `ArenaGame.tsx`** — zero referências
- [ ] **Remover os 6 PNGs órfãos** e ligar (ou descartar) os 9 de `HIGGSFIELD_UNUSED`
- [ ] **Unificar `sm-card`/`sm-btn` no kit `sm-px-*`** — 26+25 arquivos na linguagem antiga
- [ ] **Decidir o futuro de `src/components/ui/`** (44 componentes shadcn)
- [ ] **Unificar os 4 spinners lucide** num só componente de carregamento
- [ ] **Desenhar um estado de offline** — não existe nenhum

---

## 10. Os 10 itens de maior impacto

| # | Item | Por quê |
|---|---|---|
| 1 | **`RitualRow` + `RitualPanel`** | É a superfície que a pessoa toca todo dia. Uma linha bem desenhada arruma a Home inteira. |
| 2 | **`PixelKit` (11 componentes)** | Cada componente redesenhado propaga para 51 arquivos. Maior alavanca por unidade de trabalho do inventário. |
| 3 | **`CompanionHUD` + action bar** | É o pet — a razão de o app existir. Nada acima disso em carga emocional diária. |
| 4 | **`HomeHud` + barras de HP/Energia** | Comunica as duas regras centrais (corações e energia) e hoje mistura três fontes de arte. |
| 5 | **`DreamDex` (30 slots em emoji)** | A única coleção do jogo, inteiramente desenhada com arte de sistema operacional, ao lado de sprites próprios. |
| 6 | **`BottomNav`** | Está em 100% das telas; define a primeira impressão de acabamento. |
| 7 | **`DailyReportModal` + `MorningCheckIn`** | Os dois rituais diários obrigatórios; passam por todo usuário ativo, todo dia. |
| 8 | **`EvolutionCeremony`** | O clímax do jogo. Raro por definição, mas é a memória que fica. |
| 9 | **Unificação `sm-card`/`sm-btn` → `sm-px-*`** | Duas linguagens visuais convivem em 12+ arquivos ao mesmo tempo; sem isso, todo redesenho volta a divergir. |
| 10 | **Estados de carregamento e vazio** | 13 `Suspense fallback={null}` (tela branca) e 5 empty states em texto cru — hoje o app parece quebrado justamente nos momentos de transição. |

---

## 11. Pendências de verificação (para a próxima rodada)

1. Rodar com **captura de tela habilitada** — nada aqui afirma nada sobre cor,
   espaçamento, contraste ou alinhamento.
2. **Semear `soulmon_state_v1`** (era `digiapp_state_v3`, renomeada em
   07/09/2026 — quem seguisse a instrução antiga semearia uma chave que o app
   não lê mais e mediria os estados "cheio" num app VAZIO) com save cheio (muitas tarefas, hábitos com
   marcos, itens, cenários, troféus) para medir os estados "cheio".
3. **Viajar no tempo** (segunda-feira, domingo, madrugada) para acionar fresh
   start, relatório semanal, sonho e pesadelo.
4. **Percorrer o caminho pago** do onboarding (26 telas não verificadas).
5. **Torneio com PvP ligado** e **Masmorra até o 5º andar**.
6. Rodar no **APK** para verificar `StepsCard` e o `InstallPrompt`.
